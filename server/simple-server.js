import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import { storage } from "./storage.js";
import { seedDatabase } from "./seed-database.js";
import { registerRoutes } from "./routes.js";

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({
  origin: "*",
  credentials: true
}));

// Session configuration
app.use(session({
  secret: 'kiranaconnect-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport configuration
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user) return done(null, false);
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) return done(null, false);
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

app.use(passport.initialize());
app.use(passport.session());

async function startServer() {
  console.log("Starting KiranaConnect server...");
  
  // Seed database
  try {
    await seedDatabase();
    console.log("Database ready");
  } catch (error) {
    if (error.message && error.message.includes("already exists")) {
      console.log("Database already seeded");
    } else {
      console.error("Database seeding failed:", error);
    }
  }

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Register API routes first
  await registerRoutes(app);
  
  // Setup Vite for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);
    
    // Catch-all handler for SPA
    app.get('*', async (req, res) => {
      try {
        const template = await vite.transformIndexHtml(req.originalUrl, `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KiranaConnect</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        console.error('Vite error:', e);
        res.status(500).end('Server Error');
      }
    });
  }
  
  // Error handler
  app.use((err, req, res, next) => {
    console.error('Server error:', err);
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const PORT = 5000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);