const InterviewSession = require("../model/interviewSession");
const InterviewReport = require("../model/interviewerReport");
const { evaluateInterviewAnswer } = require("../services/ai.service");

/**
 * @description Start a new mock interview session
 * @route POST /api/mock-interview/start/:reportId
 * @access Private
 */
async function startMockInterviewController(req, res) {
  try {
    const { reportId } = req.params;
    const { sessionType } = req.body; // 'technical', 'behavioral', or 'both'

    // Get the interview report
    const report = await InterviewReport.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Interview report not found" });
    }

    // Check if user owns this report
    if (report.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Calculate total questions based on session type
    let totalQuestions = 0;
    if (sessionType === 'technical' || sessionType === 'both') {
      totalQuestions += report.technicalQuestions?.length || 0;
    }
    if (sessionType === 'behavioral' || sessionType === 'both') {
      totalQuestions += report.behavioralQuestions?.length || 0;
    }

    if (totalQuestions === 0) {
      return res.status(400).json({ message: "No questions available for this session type" });
    }

    // Create new session
    const session = await InterviewSession.create({
      user: req.user.id,
      interviewReport: reportId,
      sessionType: sessionType || 'both',
      totalQuestions,
      currentQuestionIndex: 0,
      status: 'in_progress'
    });

    res.status(201).json({
      message: "Mock interview session started",
      session
    });
  } catch (error) {
    console.error("Error starting mock interview:", error);
    res.status(500).json({ message: "Failed to start mock interview", error: error.message });
  }
}

/**
 * @description Get current question in the session
 * @route GET /api/mock-interview/session/:sessionId/question
 * @access Private
 */
async function getCurrentQuestionController(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findById(sessionId).populate('interviewReport');
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if session is completed
    if (session.status === 'completed') {
      return res.status(400).json({ message: "Session already completed" });
    }

    const report = session.interviewReport;
    
    // Build questions array based on session type
    let allQuestions = [];
    if (session.sessionType === 'technical' || session.sessionType === 'both') {
      allQuestions = allQuestions.concat(
        (report.technicalQuestions || []).map(q => ({ ...q._doc, type: 'technical' }))
      );
    }
    if (session.sessionType === 'behavioral' || session.sessionType === 'both') {
      allQuestions = allQuestions.concat(
        (report.behavioralQuestions || []).map(q => ({ ...q._doc, type: 'behavioral' }))
      );
    }

    const currentQuestion = allQuestions[session.currentQuestionIndex];
    
    if (!currentQuestion) {
      return res.status(400).json({ message: "No more questions available" });
    }

    res.status(200).json({
      question: currentQuestion,
      progress: {
        current: session.currentQuestionIndex + 1,
        total: session.totalQuestions
      },
      sessionId: session._id
    });
  } catch (error) {
    console.error("Error getting current question:", error);
    res.status(500).json({ message: "Failed to get question", error: error.message });
  }
}

/**
 * @description Submit answer for current question
 * @route POST /api/mock-interview/session/:sessionId/answer
 * @access Private
 */
async function submitAnswerController(req, res) {
  try {
    const { sessionId } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ message: "Answer is required" });
    }

    const session = await InterviewSession.findById(sessionId).populate('interviewReport');
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const report = session.interviewReport;
    
    // Build questions array based on session type
    let allQuestions = [];
    if (session.sessionType === 'technical' || session.sessionType === 'both') {
      allQuestions = allQuestions.concat(
        (report.technicalQuestions || []).map(q => ({ ...q._doc, type: 'technical' }))
      );
    }
    if (session.sessionType === 'behavioral' || session.sessionType === 'both') {
      allQuestions = allQuestions.concat(
        (report.behavioralQuestions || []).map(q => ({ ...q._doc, type: 'behavioral' }))
      );
    }

    const currentQuestion = allQuestions[session.currentQuestionIndex];
    
    if (!currentQuestion) {
      return res.status(400).json({ message: "No question to answer" });
    }

    // Evaluate the answer using AI
    console.log("Evaluating answer for question:", currentQuestion.question);
    const evaluation = await evaluateInterviewAnswer({
      question: currentQuestion.question,
      intention: currentQuestion.intention,
      idealAnswer: currentQuestion.answer,
      userAnswer: answer
    });

    console.log("Evaluation result:", evaluation);

    // Save the answer
    session.answers.push({
      questionType: currentQuestion.type,
      questionText: currentQuestion.question,
      questionIntention: currentQuestion.intention,
      idealAnswer: currentQuestion.answer,
      userAnswer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements
    });

    // Move to next question
    session.currentQuestionIndex += 1;

    // Check if interview is complete
    if (session.currentQuestionIndex >= session.totalQuestions) {
      session.status = 'completed';
      session.completedAt = new Date();
      
      // Calculate overall score
      const totalScore = session.answers.reduce((sum, ans) => sum + (ans.score || 0), 0);
      session.overallScore = session.answers.length > 0 
        ? Math.round((totalScore / session.answers.length) * 10) / 10 
        : 0;
    }

    await session.save();

    res.status(200).json({
      message: "Answer submitted successfully",
      evaluation,
      isComplete: session.status === 'completed',
      overallScore: session.overallScore,
      progress: {
        current: session.currentQuestionIndex,
        total: session.totalQuestions
      }
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ message: "Failed to submit answer", error: error.message });
  }
}

/**
 * @description Get session summary and results
 * @route GET /api/mock-interview/session/:sessionId/summary
 * @access Private
 */
async function getSessionSummaryController(req, res) {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Check ownership
    if (session.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json({
      session,
      analytics: {
        totalQuestions: session.totalQuestions,
        questionsAnswered: session.answers.length,
        overallScore: session.overallScore,
        averageScore: session.answers.length > 0
          ? session.answers.reduce((sum, ans) => sum + (ans.score || 0), 0) / session.answers.length
          : 0,
        technicalScore: session.answers
          .filter(a => a.questionType === 'technical')
          .reduce((sum, ans) => sum + (ans.score || 0), 0) / 
          (session.answers.filter(a => a.questionType === 'technical').length || 1),
        behavioralScore: session.answers
          .filter(a => a.questionType === 'behavioral')
          .reduce((sum, ans) => sum + (ans.score || 0), 0) / 
          (session.answers.filter(a => a.questionType === 'behavioral').length || 1)
      }
    });
  } catch (error) {
    console.error("Error getting session summary:", error);
    res.status(500).json({ message: "Failed to get session summary", error: error.message });
  }
}

/**
 * @description Get all mock interview sessions for a user
 * @route GET /api/mock-interview/sessions
 * @access Private
 */
async function getUserSessionsController(req, res) {
  try {
    const sessions = await InterviewSession.find({ user: req.user.id })
      .populate('interviewReport', 'title jobDescription')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      sessions
    });
  } catch (error) {
    console.error("Error getting user sessions:", error);
    res.status(500).json({ message: "Failed to get sessions", error: error.message });
  }
}

module.exports = {
  startMockInterviewController,
  getCurrentQuestionController,
  submitAnswerController,
  getSessionSummaryController,
  getUserSessionsController
};
