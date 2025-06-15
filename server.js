#!/usr/bin/env node

// KiranaConnect JavaScript Server Entry Point
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

import('./server/index.js').catch((error) => {
  console.error('Server startup failed:', error);
  process.exit(1);
});