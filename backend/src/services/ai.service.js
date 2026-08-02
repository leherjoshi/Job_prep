const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

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

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm"
    }
  });
  await browser.close();
  return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
  });

  const prompt = `Generate resume for a candidate with the following details:

Resume: ${resume}

Self Description: ${selfDescription}

Job Description: ${jobDescription}

The response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.

The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.

The content of resume should not sound like it's generated by AI and should be as close as possible to a real human-written resume.

You can highlight the content using some colors or different font styles but the overall design should be simple and professional.

The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.

The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: zodToJsonSchema(resumePdfSchema),
    }
  });

  const jsonContent = JSON.parse(response.text);
  const pdfBuffer = await generatePdfFromHtml(jsonContent.html);
  return pdfBuffer;
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
