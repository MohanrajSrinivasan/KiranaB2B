#!/usr/bin/env node

// KiranaConnect JavaScript Server Startup
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log('Starting KiranaConnect in JavaScript mode...');

// Import and start the server
import('./server/index.js').catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});