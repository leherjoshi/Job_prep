const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const interviewRouter = express.Router();
const interviewController = require("../controllers/interview.controller");
const upload = require("../middlewares/file.middleware"); // <-- import your real one (adjust path/filename)

/**
 * @route POST /api/interview/generate-report
 * @desc Generate an interview report based on candidate's resume, self-description, and job description
 * @access Private
 */
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  upload.single("resume"),
  interviewController.generateInterviewReportController
);

module.exports = interviewRouter;