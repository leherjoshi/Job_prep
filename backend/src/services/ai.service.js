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
  let PDFDocument;
  
  try {
    console.log('=== AI-Powered Resume Generation Started ===');
    console.log('Resume length:', resume?.length || 0);
    console.log('Self description length:', selfDescription?.length || 0);
    console.log('Job description length:', jobDescription?.length || 0);
    
    // Step 1: Generate tailored resume content using AI
    console.log('Step 1: Generating ATS-friendly resume with AI...');
    
    const resumePrompt = `You are an expert resume writer. Create a professional, ATS-friendly resume tailored to the job description.

ORIGINAL RESUME:
${resume}

CANDIDATE DESCRIPTION:
${selfDescription || "Not provided"}

TARGET JOB DESCRIPTION:
${jobDescription}

Create a tailored resume that:
1. Highlights relevant experience and skills for this specific job
2. Uses keywords from the job description naturally
3. Is ATS-friendly (simple formatting, clear sections)
4. Emphasizes achievements with metrics where possible
5. Sounds professional and human-written (not AI-generated)
6. Is concise (1-2 pages worth of content)

Return ONLY valid JSON in this format:
{
  "name": "Candidate Full Name",
  "email": "email@example.com",
  "phone": "+1234567890",
  "location": "City, State",
  "summary": "2-3 sentence professional summary tailored to the job",
  "skills": ["Skill 1", "Skill 2", "Skill 3", "..."],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Present",
      "achievements": ["Achievement 1 with metrics", "Achievement 2", "..."]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "University Name",
      "year": "2020",
      "details": "GPA, honors, etc."
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["Tech 1", "Tech 2"],
      "highlights": ["Key achievement 1", "Key achievement 2"]
    }
  ]
}`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: resumePrompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    console.log('✓ AI response received');
    const resumeData = JSON.parse(aiResponse.text);
    console.log('✓ Resume data parsed:', {
      hasName: !!resumeData.name,
      skillsCount: resumeData.skills?.length || 0,
      experienceCount: resumeData.experience?.length || 0,
      projectsCount: resumeData.projects?.length || 0
    });
    
    // Step 2: Generate PDF using PDFKit
    console.log('Step 2: Creating PDF with PDFKit...');
    
    try {
      PDFDocument = require('pdfkit');
      console.log('✓ PDFKit loaded successfully');
    } catch (err) {
      console.error('✗ Failed to load PDFKit:', err.message);
      throw new Error('PDFKit module not found. Please ensure pdfkit is installed.');
    }
    
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 50, right: 50 }
    });
    console.log('✓ PDF document created');

    const chunks = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    
    const pdfPromise = new Promise((resolve, reject) => {
      doc.on('end', () => {
        console.log('✓ PDF generation completed, buffer size:', Buffer.concat(chunks).length);
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err) => {
        console.error('✗ PDF generation error:', err);
        reject(err);
      });
    });

    console.log('Adding content to PDF...');
    
    // Helper function to add section header
    const addSectionHeader = (title) => {
      doc.fontSize(14)
         .fillColor('#2563eb')
         .text(title.toUpperCase(), { underline: false });
      doc.moveDown(0.3);
      doc.moveTo(doc.x, doc.y)
         .lineTo(doc.page.width - 50, doc.y)
         .strokeColor('#2563eb')
         .lineWidth(1)
         .stroke();
      doc.moveDown(0.5);
      doc.fillColor('#000000');
    };
    
    // Header - Name and Contact
    doc.fontSize(24)
       .fillColor('#1e293b')
       .text(resumeData.name || 'Your Name', { align: 'center' });
    doc.moveDown(0.3);
    
    // Contact info
    doc.fontSize(10)
       .fillColor('#64748b')
       .text(
         [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join(' | '),
         { align: 'center' }
       );
    doc.moveDown(1.5);
    
    // Professional Summary
    if (resumeData.summary) {
      addSectionHeader('Professional Summary');
      doc.fontSize(10)
         .fillColor('#374151')
         .text(resumeData.summary, { align: 'justify' });
      doc.moveDown(1);
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      addSectionHeader('Technical Skills');
      doc.fontSize(10)
         .fillColor('#374151')
         .text(resumeData.skills.join(' • '), { align: 'left' });
      doc.moveDown(1);
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      addSectionHeader('Professional Experience');
      
      resumeData.experience.forEach((exp, index) => {
        doc.fontSize(11)
           .fillColor('#1e293b')
           .text(exp.title, { continued: true })
           .fontSize(10)
           .fillColor('#64748b')
           .text(` | ${exp.company}`, { continued: false });
        
        doc.fontSize(9)
           .fillColor('#64748b')
           .text(exp.duration);
        doc.moveDown(0.3);
        
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach(achievement => {
            doc.fontSize(10)
               .fillColor('#374151')
               .list([achievement], {
                 bulletRadius: 2,
                 indent: 10
               });
          });
        }
        
        if (index < resumeData.experience.length - 1) {
          doc.moveDown(0.8);
        }
      });
      doc.moveDown(1);
    }
    
    // Projects
    if (resumeData.projects && resumeData.projects.length > 0) {
      addSectionHeader('Projects');
      
      resumeData.projects.forEach((project, index) => {
        doc.fontSize(11)
           .fillColor('#1e293b')
           .text(project.name);
        
        if (project.technologies && project.technologies.length > 0) {
          doc.fontSize(9)
             .fillColor('#64748b')
             .text(`Technologies: ${project.technologies.join(', ')}`);
        }
        
        doc.moveDown(0.2);
        doc.fontSize(10)
           .fillColor('#374151')
           .text(project.description);
        
        if (project.highlights && project.highlights.length > 0) {
          doc.moveDown(0.2);
          project.highlights.forEach(highlight => {
            doc.fontSize(10)
               .fillColor('#374151')
               .list([highlight], {
                 bulletRadius: 2,
                 indent: 10
               });
          });
        }
        
        if (index < resumeData.projects.length - 1) {
          doc.moveDown(0.8);
        }
      });
      doc.moveDown(1);
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      addSectionHeader('Education');
      
      resumeData.education.forEach((edu, index) => {
        doc.fontSize(11)
           .fillColor('#1e293b')
           .text(edu.degree, { continued: true })
           .fontSize(10)
           .fillColor('#64748b')
           .text(` | ${edu.institution}`, { continued: false });
        
        doc.fontSize(9)
           .fillColor('#64748b')
           .text(edu.year + (edu.details ? ` | ${edu.details}` : ''));
        
        if (index < resumeData.education.length - 1) {
          doc.moveDown(0.5);
        }
      });
    }
    
    // Footer
    doc.fontSize(8)
       .fillColor('#94a3b8')
       .text(
         `Tailored for: ${jobDescription.substring(0, 60)}... | Generated: ${new Date().toLocaleDateString()}`,
         50,
         doc.page.height - 30,
         { align: 'center', width: doc.page.width - 100 }
       );

    console.log('✓ All content added to PDF');
    
    // Finalize PDF
    doc.end();
    console.log('✓ PDF finalized, waiting for buffer...');
    
    const buffer = await pdfPromise;
    console.log('=== AI-Powered Resume Generation Successful ===');
    return buffer;
  } catch (error) {
    console.error('=== Resume PDF Generation Failed ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw new Error('Failed to generate tailored resume: ' + error.message);
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
