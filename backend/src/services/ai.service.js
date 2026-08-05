const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEN_AI_KEY
});

const interviewReportSchema = z.object({
  matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
  technicalQuestions: z.array(z.object({
    question: z.string().describe("The technical question that can be asked in the interview"),
    intention: z.string().describe("The intention of interviewer behind asking this question"),
    answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
  })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
  behavioralQuestions: z.array(z.object({
    question: z.string().describe("The behavioral question that can be asked in the interview"),
    intention: z.string().describe("The intention of interviewer behind asking this question"),
    answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
  })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
  skillGaps: z.array(z.object({
    skill: z.string().describe("The skill which the candidate is lacking"),
    severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
  })).describe("List of skill gaps in the candidate's profile along with their severity"),
  preparationPlan: z.array(z.object({
    day: z.number().describe("The day number in the preparation plan, starting from 1"),
    focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
    tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
  })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
  title: z.string().describe("The title of the job for which the interview report is generated"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  try {
    // Truncate resume if too long to avoid token limits
    const maxResumeLength = 6000;
    const truncatedResume = resume.length > maxResumeLength 
      ? resume.substring(0, maxResumeLength) + "... (truncated)"
      : resume;

    const prompt = `You are an expert technical interviewer. Generate an interview preparation report.

Resume: ${truncatedResume}

Self Description: ${selfDescription || "Not provided"}

Job Description: ${jobDescription}

Generate valid JSON matching this EXACT format:

{
  "matchScore": 75,
  "title": "Software Engineer",
  "technicalQuestions": [
    {
      "question": "Explain microservices architecture",
      "intention": "Test distributed systems knowledge",
      "answer": "Discuss service independence, communication, scaling"
    },
    {
      "question": "What is the CAP theorem?",
      "intention": "Evaluate database understanding",
      "answer": "Explain Consistency, Availability, Partition tolerance"
    }
  ],
  "behavioralQuestions": [
    {
      "question": "Describe a time you faced a technical challenge",
      "intention": "Assess problem-solving skills",
      "answer": "Use STAR method with specific metrics"
    }
  ],
  "skillGaps": [
    {"skill": "Kubernetes", "severity": "high"},
    {"skill": "GraphQL", "severity": "medium"}
  ],
  "preparationPlan": [
    {
      "day": 1,
      "focus": "System Design Fundamentals",
      "tasks": ["Review scalability patterns", "Study load balancing", "Practice whiteboarding"]
    }
  ]
}

Requirements:
- 5 technical questions (MUST be objects with question/intention/answer)
- 3 behavioral questions (MUST be objects with question/intention/answer)
- 3-5 skill gaps (MUST be objects with skill/severity)
- 7-day preparation plan (MUST be objects with day/focus/tasks)
- Return ONLY the JSON above filled with relevant content`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
        // Removed responseSchema - gemini-3-flash-preview ignores it
      }
    });

    console.log("=== AI Response (first 1000 chars) ===");
    console.log(response.text.substring(0, 1000));
    
    const parsed = JSON.parse(response.text);
    
    // Log actual structure
    console.log("=== Structure Check ===");
    console.log("technicalQuestions[0] type:", typeof parsed.technicalQuestions?.[0]);
    console.log("technicalQuestions[0]:", JSON.stringify(parsed.technicalQuestions?.[0]));
    
    // Validate structure
    if (!parsed.technicalQuestions || !Array.isArray(parsed.technicalQuestions) || parsed.technicalQuestions.length === 0) {
      throw new Error("Missing or empty technicalQuestions");
    }
    if (typeof parsed.technicalQuestions[0] === 'string') {
      throw new Error("technicalQuestions are strings instead of objects - AI not following format");
    }
    if (!parsed.technicalQuestions[0].question || !parsed.technicalQuestions[0].intention) {
      throw new Error("technicalQuestions missing required fields");
    }
    
    console.log(`✓ Valid report: ${parsed.technicalQuestions.length} technical, ${parsed.behavioralQuestions?.length || 0} behavioral`);
    
    return parsed;
  } catch (error) {
    console.error("Error in generateInterviewReport:", error.message);
    throw error;
  }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  try {
    // Use PDFKit instead of Puppeteer (doesn't need Chrome)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks = [];
    
    // Collect PDF data
    doc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    // Add content to PDF
    doc.fontSize(20).fillColor('#dc2626').text('Interview Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).fillColor('#000000');
    
    // Job Description
    if (jobDescription) {
      doc.fontSize(14).fillColor('#dc2626').text('Job Description', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000').text(jobDescription.substring(0, 500));
      doc.moveDown();
    }
    
    // Self Description
    if (selfDescription) {
      doc.fontSize(14).fillColor('#dc2626').text('Your Profile', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000').text(selfDescription);
      doc.moveDown();
    }
    
    // Resume Summary
    if (resume) {
      doc.fontSize(14).fillColor('#dc2626').text('Resume Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#000000').text(resume.substring(0, 1000) + '...');
      doc.moveDown();
    }
    
    // Footer
    doc.fontSize(8).fillColor('#666666').text(
      'Generated by Interview AI - ' + new Date().toLocaleDateString(),
      { align: 'center' }
    );

    // Finalize PDF
    doc.end();
    
    return await pdfPromise;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
}

async function evaluateInterviewAnswer({ question, intention, idealAnswer, userAnswer }) {
  try {
    const prompt = `You are an expert technical interviewer. Evaluate this candidate's answer.

Question: ${question}
Interviewer's Intention: ${intention || "To assess candidate's knowledge and problem-solving"}
Ideal Answer Points: ${idealAnswer || "N/A"}

Candidate's Answer: ${userAnswer}

Provide constructive feedback in this JSON format:
{
  "score": 7,
  "feedback": "Overall assessment in 2-3 sentences",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific suggestion 1", "specific suggestion 2"]
}

Be constructive, specific, and encouraging. Score 1-10 where:
- 1-3: Poor answer, major gaps
- 4-6: Adequate but missing key points
- 7-8: Good answer with minor improvements needed
- 9-10: Excellent, comprehensive answer`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const evaluation = JSON.parse(response.text);
    
    // Ensure all fields exist
    return {
      score: evaluation.score || 5,
      feedback: evaluation.feedback || "Answer received.",
      strengths: evaluation.strengths || [],
      improvements: evaluation.improvements || []
    };
  } catch (error) {
    console.error("Error evaluating answer:", error.message);
    // Return default evaluation on error
    return {
      score: 5,
      feedback: "Unable to evaluate answer at this time. Please try again.",
      strengths: [],
      improvements: []
    };
  }
}

module.exports = { generateInterviewReport, generateResumePdf, evaluateInterviewAnswer };
