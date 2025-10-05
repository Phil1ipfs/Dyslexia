import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../../contexts/ChatbotContexts.jsx';
import { fetchTeacherProfile } from '../../../services/Teachers/teacherService';
import { getAllChatSessions, deleteChatSession, loadChatHistory } from '../../../services/Teachers/chatHistoryService';
import authService from '../../../services/authService';
import '../../../css/Teachers/TeacherChatbot.css';

// Adjust these relative paths if you've moved the file
import botAvatar from '../../../assets/icons/Homepage/penguin.png';
// Remove the static import
// import userAvatar from '../../../assets/icons/Teachers/Avatar.png';

const TeacherChatbot = () => {
  const {
    messages,
    isLoading,
    selectedCategory,
    suggestedQuestions,
    sessionId,
    sendMessage,
    changeCategory,
    startNewSession,
    formatTimestamp,
    loadSessionById
  } = useChatbot();

  const [inputMessage, setInputMessage] = useState('');
  const [userAvatar, setUserAvatar] = useState('../../../assets/icons/Teachers/avatar.png');
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ show: false, title: '', message: '', onConfirm: null });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Fetch teacher profile to get the avatar image
  useEffect(() => {
    const fetchUserAvatar = async () => {
      try {
        const teacherData = await fetchTeacherProfile();
        if (teacherData && teacherData.profileImageUrl) {
          // Add cache-busting parameter to avoid stale images
          setUserAvatar(`${teacherData.profileImageUrl}?t=${Date.now()}`);
        }
      } catch (error) {
        console.error('Failed to fetch teacher profile image:', error);
        // Keep using default avatar on error
      }
    };
    
    fetchUserAvatar();
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Load chat sessions when history is toggled
  useEffect(() => {
    if (showHistory) {
      loadChatSessions();
    }
  }, [showHistory]);

  const loadChatSessions = async () => {
    setLoadingHistory(true);
    try {
      const currentUser = authService.getCurrentUser();
      const userRole = authService.getUserRole();

      if (!currentUser || !currentUser.user) {
        console.error('No user logged in');
        setLoadingHistory(false);
        return;
      }

      const userData = currentUser.user;
      const userId = userData.id || userData.idNumber || userData.teacherId || userData.studentId || userData._id;
      const userType = userRole || 'teacher';

      const response = await getAllChatSessions(userId, userType);
      if (response.success) {
        setChatSessions(response.sessions);
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLoadSession = async (selectedSessionId) => {
    try {
      const currentUser = authService.getCurrentUser();
      const userRole = authService.getUserRole();

      if (!currentUser || !currentUser.user) return;

      const userData = currentUser.user;
      const userId = userData.id || userData.idNumber || userData.teacherId || userData.studentId || userData._id;
      const userType = userRole || 'teacher';

      // Load the selected session via context helper (no full reload)
      await loadSessionById(selectedSessionId);
      setShowHistory(false);
    } catch (error) {
      console.error('Failed to load chat session:', error);
    }
  };

  const handleDeleteSession = async (selectedSessionId) => {
    setConfirmDialog({
      show: true,
      title: 'Delete Chat Session',
      message: 'Are you sure you want to delete this chat session? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await deleteChatSession(selectedSessionId);
          // Reload the sessions list
          loadChatSessions();
          setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
        } catch (error) {
          console.error('Failed to delete chat session:', error);
          setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
        }
      }
    });
  };

  const handleNewChat = () => {
    setConfirmDialog({
      show: true,
      title: 'Start New Chat',
      message: 'Start a new chat? Your current conversation will be saved.',
      onConfirm: () => {
        startNewSession();
        setShowHistory(false);
        setConfirmDialog({ show: false, title: '', message: '', onConfirm: null });
      }
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  // Helper function to handle image errors
  const handleImageError = (e) => {
    e.target.src = '../../../assets/icons/Teachers/avatar.png';
  };

  // Format date for chat session display
  const formatSessionDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="tcb-chatbot-container">
      {/* Header */}
      <div className="tcb-chatbot-header">
        <div>
          <h1>Literexia Teaching Assistant</h1>
          <p>Your AI companion for teaching students with dyslexia</p>
        </div>
        <div className="tcb-header-actions">
          <button onClick={handleNewChat} className="tcb-new-chat-btn" title="Start new chat">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Chat
          </button>
          <button onClick={() => setShowHistory(!showHistory)} className="tcb-history-btn" title="Chat history">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 7v5l3 3"/>
            </svg>
            History
          </button>
        </div>
      </div>

      {/* Chat History Sidebar */}
      {showHistory && (
        <>
          <div className="tcb-history-overlay" onClick={() => setShowHistory(false)} />
          <div className="tcb-history-sidebar">
            <div className="tcb-history-header">
              <h3>Chat History</h3>
              <button onClick={() => setShowHistory(false)} className="tcb-close-history">
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="tcb-history-content">
              {loadingHistory ? (
                <div className="tcb-history-loading">Loading sessions...</div>
              ) : chatSessions.length === 0 ? (
                <div className="tcb-history-empty">No previous conversations</div>
              ) : (
                chatSessions.map((session) => (
                  <div key={session.sessionId} className={`tcb-history-item ${session.sessionId === sessionId ? 'active' : ''}`}>
                    <div className="tcb-history-item-header">
                      <div className="tcb-history-item-date">{formatSessionDate(session.lastActivity)}</div>
                      <div className="tcb-history-item-count">{session.messageCount} messages</div>
                    </div>
                    {session.title && (
                      <div className="tcb-history-item-title"><strong>{session.title}</strong></div>
                    )}
                    <div className="tcb-history-item-preview">{session.lastMessage || 'No messages'}</div>
                    <div className="tcb-history-item-actions">
                      <button
                        onClick={() => handleLoadSession(session.sessionId)}
                        className="tcb-load-session-btn"
                        disabled={session.sessionId === sessionId}
                      >
                        {session.sessionId === sessionId ? 'Current' : 'Load'}
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.sessionId)}
                        className="tcb-delete-session-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <>
          <div className="tcb-dialog-overlay" onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })} />
          <div className="tcb-confirm-dialog">
            <div className="tcb-dialog-header">
              <h3>{confirmDialog.title}</h3>
              <button
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
                className="tcb-dialog-close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="tcb-dialog-content">
              <p>{confirmDialog.message}</p>
            </div>
            <div className="tcb-dialog-actions">
              <button
                onClick={() => setConfirmDialog({ show: false, title: '', message: '', onConfirm: null })}
                className="tcb-dialog-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="tcb-dialog-confirm"
              >
                Confirm
              </button>
            </div>
          </div>
        </>
      )}

      {/* Main */}
      <div className="tcb-chatbot-main">
        {/* Category tabs */}
        <div className="tcb-category-tabs">
          {['all','teaching','activities','interventions'].map(cat => (
            <button
              key={cat}
              className={`tcb-category-tab ${selectedCategory===cat?'tcb-active':''}`}
              onClick={() => changeCategory(cat)}
            >
              {cat === 'all' ? 'All' :
               cat === 'teaching' ? 'Teaching Strategies' :
               cat === 'activities' ? 'Activities' :
               'Interventions'}
            </button>
          ))}
        </div>

        {/* Suggested */}
        <div className="tcb-suggested-questions">
          <h3>Suggested Questions</h3>
          <div className="tcb-question-list">
            {suggestedQuestions[selectedCategory].map((q,i) => (
              <button
                key={i}
                className="tcb-suggested-question"
                onClick={() => handleSuggestedQuestion(q)}
              >
                {q}
              </button>
            ))}
          </div>
          <div className="tcb-chatbot-info">
            <div className="tcb-info-card">
              <svg className="tcb-info-icon" width="20" height="20" viewBox="0 0 20 20">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="currentColor"/>
              </svg>
              <div className="tcb-info-content">
                <h4>Teaching Assistant Features</h4>
                <ul>
                  <li>Access teaching strategies for dyslexic students</li>
                  <li>Get activity ideas for different learning needs</li>
                  <li>Learn about interventions for reading challenges</li>
                  <li>Find resources specifically for Filipino language learning</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Chat window */}
        <div className="tcb-chat-window">
          <div className="tcb-messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`tcb-message ${msg.sender==='user'?'tcb-user-message':'tcb-bot-message'}`}>
                <div className="tcb-avatar">
                  <img 
                    src={msg.sender==='user'? userAvatar : botAvatar} 
                    alt={msg.sender}
                    onError={msg.sender==='user' ? handleImageError : undefined}
                  />
                </div>
                <div className="tcb-message-content">
                  <div className="tcb-message-text">
                    {msg.text.split('\n').map((line,i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < msg.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="tcb-message-time">{formatTimestamp(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="tcb-message tcb-bot-message">
                <div className="tcb-avatar"><img src={botAvatar} alt="Bot"/></div>
                <div className="tcb-message-content">
                  <div className="tcb-typing-indicator">
                    <span/><span/><span/>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <form className="tcb-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              ref={inputRef}
              className="tcb-message-input"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Type your question here..."
              disabled={isLoading}
            />
            <button type="submit" className="tcb-send-button" disabled={!inputMessage.trim()||isLoading}>
              {/* send icon */}
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="tcb-chatbot-footer">
        <p><strong>Note:</strong> The Teaching Assistant provides general guidance and suggestions. Always adapt recommendations to your classroom needs.</p>
      </div>
    </div>
  );
};

export default TeacherChatbot;