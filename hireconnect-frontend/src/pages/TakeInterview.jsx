import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../api';
import { toast } from 'react-hot-toast';
import { Video, Mic, Monitor, Power, MessageSquare, Users, Settings, Play } from 'lucide-react';
import './TakeInterview.css';

export default function TakeInterview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [streamActive, setStreamActive] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [id]);

  const handleStartInterview = async () => {
    try {
      setLoading(true);
      await interviewAPI.takeInterview(id);
      setStarted(true);
      toast.success('Interview session started successfully!');
    } catch (err) {
      console.error('Failed to start interview:', err);
      toast.error('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !started) {
    return (
      <div className="interview-session-page page">
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="interview-session-page page">
        <div className="container">
          <div className="interview-setup-container fade-in">
            <div className="setup-icon-wrapper">
              <Video className="setup-icon" />
            </div>
            <h1 className="setup-title">Ready for your Interview?</h1>
            <p className="setup-subtitle">
              You are about to enter a secure interview session. Please ensure your camera and microphone are working correctly.
            </p>
            
            <div className="status-grid">
              <div className="status-card">
                <Mic className="status-card-icon" />
                <p className="status-card-text">Microphone Ready</p>
              </div>
              <div className="status-card">
                <Monitor className="status-card-icon" />
                <p className="status-card-text">Camera Ready</p>
              </div>
            </div>

            <div className="setup-actions">
              <button onClick={handleStartInterview} className="btn-start-session">
                <Play size={20} fill="currentColor" />
                Start Interview Session
              </button>
              
              <button onClick={() => navigate('/dashboard')} className="btn-cancel-session">
                Cancel and return to dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-session-page page">
      <div className="live-session-layout">
        {/* Header */}
        <div className="session-header">
          <div className="session-header-left">
            <div className="session-logo-badge">HC</div>
            <span style={{ fontWeight: 600 }}>HireConnect Interview Room</span>
            <div className="session-live-indicator">
              <div className="live-dot" />
              LIVE
            </div>
          </div>
          <div className="session-header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b949e', fontSize: '0.85rem' }}>
              <Users size={16} />
              <span>2 Participants</span>
            </div>
            <Settings size={20} style={{ color: '#8b949e', cursor: 'pointer' }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="session-main">
          {/* Video Area */}
          <div className="video-grid-container">
            <div className="video-grid">
              {/* Interviewer */}
              <div className="video-card">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800" 
                  alt="Interviewer" 
                  className="video-placeholder"
                />
                <div className="participant-label">
                  <div className="online-dot" />
                  Interviewer (Senior Hiring Manager)
                </div>
              </div>

              {/* Candidate (Local) */}
              <div className="video-card active-speaker">
                <div style={{ width: '100%', height: '100%', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {streamActive ? (
                    <div style={{ textAlign: 'center' }}>
                      <div className="setup-icon-wrapper" style={{ marginBottom: '10px' }}>
                        <Users className="setup-icon" />
                      </div>
                      <p style={{ color: '#8b949e', fontSize: '0.9rem' }}>Your camera is active</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Video size={40} style={{ color: '#30363d', marginBottom: '10px' }} />
                      <p style={{ color: '#8b949e', fontSize: '0.9rem' }}>Camera is off</p>
                    </div>
                  )}
                </div>
                <div className="participant-label">
                  <div className="online-dot" />
                  You (Candidate)
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="session-controls">
              <button className="control-btn">
                <Mic size={20} />
              </button>
              <button 
                className={`control-btn ${!streamActive ? 'toggle-off' : ''}`}
                onClick={() => setStreamActive(!streamActive)}
              >
                <Video size={20} />
              </button>
              <button className="control-btn">
                <Monitor size={20} />
              </button>
              <div style={{ width: '1px', height: '30px', background: '#30363d' }} />
              <button onClick={() => navigate('/dashboard')} className="control-btn leave-btn">
                <Power size={20} />
                Leave Room
              </button>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="chat-sidebar">
            <div className="chat-header">
              <MessageSquare size={18} style={{ color: '#818cf8' }} />
              Interview Chat
            </div>
            <div className="chat-messages">
              <div className="message-bubble system">
                <p className="message-sender">SYSTEM</p>
                <p className="message-text">Welcome to the interview room. The interviewer will be with you shortly.</p>
              </div>
              <div className="message-bubble">
                <p className="message-sender">Interviewer</p>
                <p className="message-text">Hello Anshika! Can you hear me clearly? We'll start in a moment.</p>
              </div>
            </div>
            <div className="chat-input-wrapper">
              <input type="text" className="chat-input" placeholder="Type a message..." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
