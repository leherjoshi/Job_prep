const express = require('express');
const router = express.Router();
const {
  startMockInterviewController,
  getCurrentQuestionController,
  submitAnswerController,
  getSessionSummaryController,
  getUserSessionsController
} = require('../controllers/mockInterview.controller');
const { authUser } = require('../middlewares/auth.middleware');

/**
 * @route POST /api/mock-interview/start/:reportId
 * @desc Start a new mock interview session
 * @access Private
 */
router.post('/start/:reportId', authUser, startMockInterviewController);

/**
 * @route GET /api/mock-interview/session/:sessionId/question
 * @desc Get current question in the session
 * @access Private
 */
router.get('/session/:sessionId/question', authUser, getCurrentQuestionController);

/**
 * @route POST /api/mock-interview/session/:sessionId/answer
 * @desc Submit answer for current question
 * @access Private
 */
router.post('/session/:sessionId/answer', authUser, submitAnswerController);

/**
 * @route GET /api/mock-interview/session/:sessionId/summary
 * @desc Get session summary and results
 * @access Private
 */
router.get('/session/:sessionId/summary', authUser, getSessionSummaryController);

/**
 * @route GET /api/mock-interview/sessions
 * @desc Get all mock interview sessions for a user
 * @access Private
 */
router.get('/sessions', authUser, getUserSessionsController);

module.exports = router;
