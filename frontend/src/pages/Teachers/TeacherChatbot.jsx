// src/pages/Teachers/TeacherChatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChatbot } from '../../contexts/ChatbotContexts.js';
import '../../css/Teachers/TeacherChatbot.css'; 

import botAvatar from '../../assets/icons/Homepage/penguin.png'; 
import userAvatar from '../../assets/icons/Teachers/avatar.png'; 

const TeacherChatbot = () => {
  // Use the chatbot context hook
  const {
    messages,
    isLoading,
    selectedCategory,
    suggestedQuestions,
    sendMessage,
    changeCategory,
    formatTimestamp
  } = useChatbot();
  
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Focus input field when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;
    
    // Send message using the context function
    await sendMessage(inputMessage);
    setInputMessage('');
  };

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

  return (
    <div className="tcb-chatbot-container">
      <div className="tcb-chatbot-header">
        <div className="tcb-header-content">
          <h1>Literexia Teaching Assistant</h1>
          <p>Your AI companion for teaching students with dyslexia</p>
        </div>
      </div>
      
      <div className="tcb-chatbot-main">
        <div className="tcb-category-tabs">
          <button 
            className={`tcb-category-tab ${selectedCategory === 'all' ? 'tcb-active' : ''}`}
            onClick={() => changeCategory('all')}
          >
            All
          </button>
          <button 
            className={`tcb-category-tab ${selectedCategory === 'teaching' ? 'tcb-active' : ''}`}
            onClick={() => changeCategory('teaching')}
          >
            Teaching Strategies
          </button>
          <button 
            className={`tcb-category-tab ${selectedCategory === 'activities' ? 'tcb-active' : ''}`}
            onClick={() => changeCategory('activities')}
          >
            Activities
          </button>
          <button 
            className={`tcb-category-tab ${selectedCategory === 'interventions' ? 'tcb-active' : ''}`}
            onClick={() => changeCategory('interventions')}
          >
            Interventions
          </button>
        </div>
        
        <div className="tcb-suggested-questions">
          <h3 className="tcb-suggest-title">Suggested Questions</h3>
          <div className="tcb-question-list">
            {suggestedQuestions[selectedCategory].map((question, index) => (
              <button 
                key={index} 
                className="tcb-suggested-question" 
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
          
          <div className="tcb-chatbot-info">
            <div className="tcb-info-card">
              <div className="tcb-info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z" fill="currentColor"/>
                </svg>
              </div>
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
        
        <div className="tcb-chat-window">
          <div className="tcb-messages-container">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`tcb-message ${message.sender === 'user' ? 'tcb-user-message' : 'tcb-bot-message'}`}
              >
                {message.sender === 'bot' && (
                  <div className="tcb-avatar">
                    <img src={botAvatar} alt="Bot" />
                  </div>
                )}
                {message.sender === 'user' && (
                  <div className="tcb-avatar">
                    <img src={userAvatar} alt="You" />
                  </div>
                )}
                <div className="tcb-message-content">
                  <div className="tcb-message-text">
                    {/* Convert newlines to <br> tags for proper formatting */}
                    {message.text.split('\n').map((text, i) => (
                      <React.Fragment key={i}>
                        {text}
                        {i !== message.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="tcb-message-time">{formatTimestamp(message.timestamp)}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="tcb-message tcb-bot-message">
                <div className="tcb-avatar">
                  <img src={botAvatar} alt="Bot" />
                </div>
                <div className="tcb-message-content">
                  <div className="tcb-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form className="tcb-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              ref={inputRef}
              className="tcb-message-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your question here..."
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="tcb-send-button"
              disabled={!inputMessage.trim() || isLoading}
              aria-label="Send message"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
      
      <div className="tcb-chatbot-footer">
        <div className="tcb-footer-content">
          <p>
            <strong>Note:</strong> The Teaching Assistant provides general guidance and suggestions.
            Always use your professional judgment and adapt recommendations to your specific classroom needs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherChatbot;