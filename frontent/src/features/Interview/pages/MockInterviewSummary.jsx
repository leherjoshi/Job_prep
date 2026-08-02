import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { getSessionSummary } from '../services/mockInterview.api';
import '../style/mockInterview.scss';

const MockInterviewSummary = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadSummary();
    }, [sessionId]);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const data = await getSessionSummary(sessionId);
            setSummary(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load summary');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="mock-interview-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading summary...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mock-interview-container">
                <div className="error-state">
                    <h2>Error</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate('/interview')}>Back to Reports</button>
                </div>
            </div>
        );
    }

    const { session, analytics } = summary;

    const getScoreColor = (score) => {
        if (score >= 8) return 'excellent';
        if (score >= 6) return 'good';
        if (score >= 4) return 'fair';
        return 'poor';
    };

    return (
        <div className="mock-interview-container">
            <div className="summary-header">
                <h1>🎉 Interview Complete!</h1>
                <p>Here's how you did</p>
            </div>

            <div className="summary-stats">
                <div className="stat-card overall">
                    <h3>Overall Score</h3>
                    <div className={`score-big ${getScoreColor(session.overallScore)}`}>
                        {session.overallScore ? session.overallScore.toFixed(1) : 'N/A'}
                        <span>/10</span>
                    </div>
                </div>

                <div className="stat-card">
                    <h3>Questions Answered</h3>
                    <div className="stat-value">
                        {analytics.questionsAnswered} / {analytics.totalQuestions}
                    </div>
                </div>

                {session.sessionType !== 'behavioral' && analytics.technicalScore > 0 && (
                    <div className="stat-card">
                        <h3>💻 Technical</h3>
                        <div className={`stat-value ${getScoreColor(analytics.technicalScore)}`}>
                            {analytics.technicalScore.toFixed(1)}/10
                        </div>
                    </div>
                )}

                {session.sessionType !== 'technical' && analytics.behavioralScore > 0 && (
                    <div className="stat-card">
                        <h3>🗣️ Behavioral</h3>
                        <div className={`stat-value ${getScoreColor(analytics.behavioralScore)}`}>
                            {analytics.behavioralScore.toFixed(1)}/10
                        </div>
                    </div>
                )}
            </div>

            <div className="answers-review">
                <h2>Answer Review</h2>
                {session.answers.map((answer, idx) => (
                    <div key={idx} className="answer-card">
                        <div className="answer-card-header">
                            <div className="question-badge">
                                {answer.questionType === 'technical' ? '💻' : '🗣️'} 
                                Question {idx + 1}
                            </div>
                            <div className={`answer-score ${getScoreColor(answer.score)}`}>
                                {answer.score}/10
                            </div>
                        </div>

                        <div className="answer-card-content">
                            <h4>{answer.questionText}</h4>
                            
                            <div className="user-answer-section">
                                <strong>Your Answer:</strong>
                                <p>{answer.userAnswer}</p>
                            </div>

                            <div className="feedback-section">
                                <strong>Feedback:</strong>
                                <p>{answer.feedback}</p>
                            </div>

                            {answer.strengths && answer.strengths.length > 0 && (
                                <div className="strengths-list">
                                    <strong>✓ Strengths:</strong>
                                    <ul>
                                        {answer.strengths.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {answer.improvements && answer.improvements.length > 0 && (
                                <div className="improvements-list">
                                    <strong>💡 Improvements:</strong>
                                    <ul>
                                        {answer.improvements.map((imp, i) => (
                                            <li key={i}>{imp}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="summary-actions">
                <button 
                    className="btn-secondary" 
                    onClick={() => navigate('/interview')}
                >
                    Back to Reports
                </button>
                <button 
                    className="btn-primary" 
                    onClick={() => navigate(`/mock-interview/start/${session.interviewReport}`)}
                >
                    Start New Session
                </button>
            </div>
        </div>
    );
};

export default MockInterviewSummary;
