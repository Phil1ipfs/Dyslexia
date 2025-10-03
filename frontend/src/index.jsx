// src/index.js or src/index.jsx
import * as Sentry from "@sentry/react";
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AppProviders from './AppProviders';

// Initialize Sentry as early as possible in your application's lifecycle
Sentry.init({
  dsn: "https://f3a688d11c91114e72a26cca6b0fb231@o4510122170646528.ingest.us.sentry.io/4510122220322816",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
  // Setting this option to true will send default PII data to Sentry
  sendDefaultPii: true,
  environment: process.env.NODE_ENV || 'production'
});


// Create a root
const container = document.getElementById('root');
const root = createRoot(container);

// Render app to root
root.render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);