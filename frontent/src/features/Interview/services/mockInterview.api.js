import axios from "axios";
import { API_URL } from "../../../config/api";

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
});

/**
 * Start a new mock interview session
 */
export const startMockInterview = async ({ reportId, sessionType = 'both' }) => {
    const response = await api.post(`/api/mock-interview/start/${reportId}`, {
        sessionType
    });
    return response.data;
};

/**
 * Get current question in the session
 */
export const getCurrentQuestion = async (sessionId) => {
    const response = await api.get(`/api/mock-interview/session/${sessionId}/question`);
    return response.data;
};

/**
 * Submit answer for current question
 */
export const submitAnswer = async ({ sessionId, answer }) => {
    const response = await api.post(`/api/mock-interview/session/${sessionId}/answer`, {
        answer
    });
    return response.data;
};

/**
 * Get session summary and results
 */
export const getSessionSummary = async (sessionId) => {
    const response = await api.get(`/api/mock-interview/session/${sessionId}/summary`);
    return response.data;
};

/**
 * Get all user's mock interview sessions
 */
export const getUserSessions = async () => {
    const response = await api.get('/api/mock-interview/sessions');
    return response.data;
};
