const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../model/interviewerReport")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterviewReportController(req, res) {
    try {
        console.log('=== Generate Interview Report Controller ===');
        console.log('Has file:', !!req.file);
        console.log('User ID:', req.user?.id);
        
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ 
                message: "Resume file is required. Please upload a PDF file." 
            })
        }
        
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
        
        const { selfDescription, jobDescription } = req.body

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        })

        res.status(201).json({
            message: "Interview Report Generated Successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error in generateInterviewReportController:");
        console.error(err.message);
        console.error(err.stack);
        res.status(500).json({ message: "Failed to generate interview report.", error: err.message })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params

        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch interview report.", error: err.message })
    }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch interview reports.", error: err.message })
    }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        console.log('=== PDF Controller Started ===');
        console.log('Request params:', req.params);
        console.log('User ID:', req.user?.id);
        
        const { interviewReportId } = req.params

        console.log('Searching for interview report:', interviewReportId);
        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            console.error('Interview report not found:', interviewReportId);
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        console.log('✓ Interview report found');
        console.log('Report user:', interviewReport.user);
        console.log('Report has resume:', !!interviewReport.resume);
        console.log('Report has jobDescription:', !!interviewReport.jobDescription);
        console.log('Report has selfDescription:', !!interviewReport.selfDescription);

        const { resume, jobDescription, selfDescription } = interviewReport

        console.log('Calling generateResumePdf...');
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        console.log('✓ PDF generated successfully, sending response');
        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
        console.log('=== PDF Controller Completed ===');
    } catch (err) {
        console.error('=== PDF Controller Error ===');
        console.error('Error type:', err.constructor.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        res.status(500).json({ message: "Failed to generate resume PDF.", error: err.message })
    }
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}