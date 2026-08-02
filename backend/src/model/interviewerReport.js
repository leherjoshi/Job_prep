const mongoose =require('mongoose');

/**
 * -job desciption schema :string
 *  resume text :string
 * self description :string
 * 
 * matchscore :number
 * - technical question :
 *        [{
 *          question:"",
 *          intension:"",
 *        answer:"",
 *        }]
 * - behavioral question:[{
 *            question:"",
  *              intenstion:"",
  *                answer:"",
 *   
 * 
 *    }  ]
 * -skill gap:[{
 *        skill:"",
 * severity:{
 * type:String,
 * enum["low","medium","high"]
 * }    }
 *        ]
 * preparation plan:[{
 * day:number,
 * focus:String,
 * tasks:[string]
 * }]
 */



const technicalQuestionSchema = new mongoose.Schema({
  question: { type: String },
  intention: { type: String },
  answer: { type: String },
}, { _id: false });

const behavioralQuestionSchema = new mongoose.Schema({
  question: { type: String },
  intention: { type: String },
  answer: { type: String },
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
  skill: {
    type: String,
    required: [true, "Skill is required"]
  },
  severity: {
    type: String,
    required: [true, "Severity is required"]
    // no enum — Gemini returns free text like "minor" / "moderate" / "major"
  }
}, { _id: false });

const preparationPlanSchema = new mongoose.Schema({
  day: {
    type: Number,
    required: [true, "Day is required"]
  },
  focus: {
    type: String,
    required: [true, "Focus is required"]
  },
  tasks: {
    type: [String],
    required: [true, "Tasks are required"]
  }
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false  // Made optional since AI might not always provide it
  },
  jobDescription: {
    type: String,
    required: [true, "Job description is required"]
  },
  resume: {
    type: String,
  },
  selfDescription: {
    type: String,
  },
  matchScore: {
    type: Number,
  },
  overallFeedback: {
    type: String,
  },
  technicalQuestions: [technicalQuestionSchema],
  behavioralQuestions: [behavioralQuestionSchema],
  skillGaps: [skillGapSchema],
  preparationPlan: [preparationPlanSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users"
  }
}, {
  timestamps: true
});

const interviewReportModel = mongoose.model("InterviewReport", interviewReportSchema);

module.exports = interviewReportModel;