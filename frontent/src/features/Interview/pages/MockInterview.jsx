import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { startMockInterview, getCurrentQuestion, submitAnswer } from '../services/mockInterview.api';
import '../style/mockInterview.scss';

const MockInterview = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [currentSession, setCurrentSession] = useState(null);
    const [question, setQuestion] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [evaluation, setEvaluation] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState(null);

    useEffect(() => {
        if (sessionId) {
            loadCurrentQuestion();
        }
    }, [sessionId]);

    const loadCurrentQuestion = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCurrentQuestion(sessionId);
            setQuestion(data.question);
            setProgress(data.progress);
            setCurrentSession(data.sessionId);
            setEvaluation(null);
            setUserAnswer('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load question');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (!userAnswer.trim()) {
            setError('Please enter an answer');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await submitAnswer({
                sessionId,
                answer: userAnswer
            });

            setEvaluation(result.evaluation);
            
            // If interview is complete, navigate to summary
            if (result.isComplete) {
                setTimeout(() => {
                    navigate(`/mock-interview/${sessionId}/summary`);
                }, 3000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit answer');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNextQuestion = () => {
        loadCurrentQuestion();
    };

    if (loading && !question) {
        return (
            <div className="mock-interview-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading question...</p>
                </div>
            </div>
        );
    }

    if (error && !question) {
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

    return (
        <div className="mock-interview-container">
            <div className="mock-interview-header">
                <h1>Mock Interview</h1>
                <div className="progress-bar-container">
                    <div className="progress-info">
                        <span>Question {progress.current} of {progress.total}</span>
                        <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                    </div>
                    <div className="progress-bar">
                        <div 
                            className="progress-fill" 
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {question && (
                <div className="question-section">
                    <div className="question-type-badge">
                        {question.type === 'technical' ? '💻 Technical' : '🗣️ Behavioral'}
                    </div>
                    <h2 className="question-text">{question.question}</h2>
                    {question.intention && (
                        <p className="question-intention">
                            <strong>What they're looking for:</strong> {question.intention}
                        </p>
                    )}
                </div>
            )}

            {!evaluation ? (
                <div className="answer-section">
                    <label htmlFor="answer">Your Answer:</label>
                    <textarea
                        id="answer"
                        className="answer-input"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer here... Take your time and be specific."
                        rows={12}
                        disabled={loading}
                    />
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <div className="answer-actions">
                        <button 
                            className="btn-secondary" 
                            onClick={() => navigate('/interview')}
                            disabled={loading}
                        >
                            Exit Interview
                        </button>
                        <button 
                            className="btn-primary" 
                            onClick={handleSubmitAnswer}
                            disabled={loading || !userAnswer.trim()}
                        >
                            {loading ? 'Evaluating...' : 'Submit Answer'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="evaluation-section">
                    <h3>Feedback</h3>
                    
                    <div className="score-display">
                        <div className="score-circle">
                            <span className="score-number">{evaluation.score}</span>
                            <span className="score-max">/10</span>
                        </div>
                        <div className="score-label">
                            {evaluation.score >= 8 ? 'Excellent!' : 
                             evaluation.score >= 6 ? 'Good Job!' : 
                             evaluation.score >= 4 ? 'Fair' : 'Needs Improvement'}
                        </div>
                    </div>

                    <div className="feedback-text">
                        <p>{evaluation.feedback}</p>
                    </div>

                    {evaluation.strengths && evaluation.strengths.length > 0 && (
                        <div className="feedback-list strengths">
                            <h4>✓ Strengths</h4>
                            <ul>
                                {evaluation.strengths.map((strength, idx) => (
                                    <li key={idx}>{strength}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {evaluation.improvements && evaluation.improvements.length > 0 && (
                        <div className="feedback-list improvements">
                            <h4>💡 Areas for Improvement</h4>
                            <ul>
                                {evaluation.improvements.map((improvement, idx) => (
                                    <li key={idx}>{improvement}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="next-actions">
                        {progress.current < progress.total ? (
                            <button 
                                className="btn-primary" 
                                onClick={handleNextQuestion}
                            >
                                Next Question →
                            </button>
                        ) : (
                            <div className="completion-message">
                                <h3>🎉 Interview Complete!</h3>
                                <p>Redirecting to summary...</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MockInterview;
