const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ['technical', 'behavioral'],
    required: true
  },
  questionText: {
    type: String,
    required: true
  },
  questionIntention: {
    type: String,
  },
  idealAnswer: {
    type: String,
  },
  userAnswer: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    min: 0,
    max: 10
  },
  feedback: {
    type: String,
  },
  strengths: {
    type: [String],
    default: []
  },
  improvements: {
    type: [String],
    default: []
  },
  answeredAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const interviewSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  interviewReport: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewReport',
    required: true
  },
  sessionType: {
    type: String,
    enum: ['technical', 'behavioral', 'both'],
    default: 'both'
  },
  currentQuestionIndex: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 10
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

module.exports = InterviewSession;
