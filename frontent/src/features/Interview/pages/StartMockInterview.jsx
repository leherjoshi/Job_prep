import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { startMockInterview } from '../services/mockInterview.api';
import '../style/mockInterview.scss';

const StartMockInterview = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [sessionType, setSessionType] = useState('both');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleStart = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await startMockInterview({ reportId, sessionType });
            navigate(`/mock-interview/${response.session._id}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start mock interview');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mock-interview-container start-page">
            <div className="start-card">
                <h1>🎯 Start Mock Interview</h1>
                <p>Practice your interview skills with AI-powered feedback</p>

                <div className="session-type-selector">
                    <h3>Choose Interview Type:</h3>
                    
                    <label className={`type-option ${sessionType === 'both' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="sessionType"
                            value="both"
                            checked={sessionType === 'both'}
                            onChange={(e) => setSessionType(e.target.value)}
                        />
                        <div className="option-content">
                            <span className="option-icon">🎯</span>
                            <div>
                                <strong>Full Interview</strong>
                                <p>Both technical and behavioral questions</p>
                            </div>
                        </div>
                    </label>

                    <label className={`type-option ${sessionType === 'technical' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="sessionType"
                            value="technical"
                            checked={sessionType === 'technical'}
                            onChange={(e) => setSessionType(e.target.value)}
                        />
                        <div className="option-content">
                            <span className="option-icon">💻</span>
                            <div>
                                <strong>Technical Only</strong>
                                <p>Focus on technical questions</p>
                            </div>
                        </div>
                    </label>

                    <label className={`type-option ${sessionType === 'behavioral' ? 'selected' : ''}`}>
                        <input
                            type="radio"
                            name="sessionType"
                            value="behavioral"
                            checked={sessionType === 'behavioral'}
                            onChange={(e) => setSessionType(e.target.value)}
                        />
                        <div className="option-content">
                            <span className="option-icon">🗣️</span>
                            <div>
                                <strong>Behavioral Only</strong>
                                <p>Focus on behavioral questions</p>
                            </div>
                        </div>
                    </label>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="start-actions">
                    <button 
                        className="btn-secondary" 
                        onClick={() => navigate(`/interview/${reportId}`)}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        className="btn-primary" 
                        onClick={handleStart}
                        disabled={loading}
                    >
                        {loading ? 'Starting...' : 'Start Interview'}
                    </button>
                </div>

                <div className="tips-section">
                    <h4>💡 Tips:</h4>
                    <ul>
                        <li>Find a quiet place where you can focus</li>
                        <li>Take your time to think before answering</li>
                        <li>Be specific and use examples from your experience</li>
                        <li>Review the feedback carefully after each question</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default StartMockInterview;
