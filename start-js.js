#!/usr/bin/env node

// Temporary script to run the JavaScript server
process.env.NODE_ENV = 'development';

import('./server/index.js').catch(console.error);