const express = require('express');
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const { registerRoutes } = require('./routes.js');
const { setupVite, serveStatic, log } = require('./vite.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  secret: 'kiranaconnect-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

async function startServer() {
  const server = await registerRoutes(app);
  
  // Setup Vite or serve static files
  if (process.env.NODE_ENV === 'production') {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }
  
  const port = 5000;
  server.listen(port, '0.0.0.0', () => {
    log(`serving on port ${port}`);
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

startServer().catch(console.error);