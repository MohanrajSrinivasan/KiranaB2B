import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { setupVite, serveStatic } from "./vite.js";
import { registerRoutes } from "./routes.js";
import { storage } from "./postgresql-storage.js";
import { seedDatabase } from "./seed-database.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : "*",
  credentials: true
}));

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      console.log('Login attempt for:', email);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log('User not found:', email);
        return done(null, false, { message: 'User not found' });
      }
      
      console.log('Comparing password for user:', user.email);
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return done(null, false, { message: 'Invalid password' });
      }
      
      console.log('Authentication successful for:', email);
      return done(null, user);
    } catch (error) {
      console.error('Authentication error:', error);
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
  try {
    // Seed database
    await seedDatabase();
    console.log("Database seeded successfully");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("Database already seeded");
    } else {
      console.error("Database seeding failed:", error);
    }
  }

  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();