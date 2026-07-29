const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEN_AI_KEY,
});

async function invokeGeminiAi() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: "Hello Gemini! Explain what an interview is.",
    });

    console.log(response.text);
  } catch (err) {
    console.error(err);
  }
}

const interviewReportSchema = z.object({
  matchMedia: z.string().describe("The degree to which the candidate's skills and experience match the requirements of the job description from 0 to 100"),
  technicalQuestions: z.array(z.object({
    question: z.string().describe("The technical question asked during the interview"),
    intension: z.string().describe("The intention behind the question, e.g., to assess problem-solving skills, coding ability, etc."),
    answer: z.string().describe("how to answer this question, what points to cover, and what to avoid, what approach to take"),
    feedback: z.string().describe("Feedback on the candidate's answer, including strengths and areas for improvement"),
  })).describe("An array of technical questions asked during the interview, along with the candidate's answers and feedback"),
  behavioralQuestions: z.array(z.object({
    question: z.string().describe("The behavioral question asked during the interview"),
    intension: z.string().describe("The intention behind the question, e.g., to assess communication skills, teamwork, etc."),
    answer: z.string().describe("how to answer this question, what points to cover, and what to avoid, what approach to take"),
    feedback: z.string().describe("Feedback on the candidate's answer, including strengths and areas for improvement"),
  })).describe("An array of behavioral questions asked during the interview, along with the candidate's answers and feedback"),
  overallFeedback: z.string().describe("Overall feedback on the candidate's performance in the interview, including strengths and areas for improvement"),
  skillGaps: z.array(z.object({
    skill: z.string().describe("The specific skill or knowledge area where the candidate has a gap"),
    severity: z.string().describe("The severity of the skill gap, e.g., minor, moderate, major"),
  })).describe("An array of skill gaps identified during the interview, along with their severity"),
  preparationPlan: z.array(z.object({
    day: z.string().describe("The day of the week for the preparation activity"),
    focus: z.string().describe("The specific skill or topic to focus on during the preparation activity"),
    task: z.string().describe("The specific task or activity to complete during the preparation activity"),
  })).describe("A detailed preparation plan for the candidate, including daily activities and focus areas to improve their skills and performance in future interviews"),
});

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
  const jsonSchema = zodToJsonSchema(interviewReportSchema);

  const response = await ai.models.generateContent({
    model: "gemini-flash-latest",
    contents: `Generate based on candidate his details are as follow.
The candidate's resume is as follows:
${resume}

The candidate's self-description is as follows:
${selfDescription}

The job description is as follows:
${jobDescription}

Please provide the interview report in JSON format that adheres to the following schema:
${JSON.stringify(jsonSchema)}
`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(interviewReportSchema),
    },
  });

  const interviewReport = JSON.parse(response.text);
  return interviewReport;

}

module.exports = { invokeGeminiAi, generateInterviewReport }; 