#!/usr/bin/env node

// AWS EC2 Cluster Startup Script
// This file should be used as the main entry point for production deployment

const { setupCluster } = require('./middleware/productionSecurity');

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`[CLUSTER] Starting Literexia backend in ${process.env.NODE_ENV} mode`);
console.log(`[CLUSTER] Node.js version: ${process.version}`);
console.log(`[CLUSTER] Platform: ${process.platform} ${process.arch}`);

// Setup clustering for AWS EC2
const shouldStartApp = setupCluster();

if (shouldStartApp) {
  // Start the actual application
  require('./server.js');
}

// Graceful shutdown handling for AWS
process.on('SIGTERM', () => {
  console.log('[CLUSTER] SIGTERM received from AWS, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[CLUSTER] SIGINT received, shutting down gracefully');
  process.exit(0);
});