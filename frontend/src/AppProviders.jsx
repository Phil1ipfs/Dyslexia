// src/AppProviders.jsx
import React from 'react';
import { ChatbotProvider } from './contexts/ChatbotContexts';

/**
 * Wrapper component for all app providers.
 * Makes it easier to add more providers (like ThemeProvider, AuthProvider) in the future.
 *
 * ChatbotProvider gets user info directly from authService (localStorage)
 * so it doesn't need AuthProvider wrapping.
 */
const AppProviders = ({ children }) => {
  return (
    <ChatbotProvider>
      {children}
    </ChatbotProvider>
  );
};

export default AppProviders;
