import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { setupVite, serveStatic } from "./vite.js";
import { registerRoutes } from "./routes.js";
import { storage } from "./storage.js";
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
    maxAge: 24 * 60 * 60 * 1000
  }
}));

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
  try {
    await seedDatabase();
    console.log("Database seeded successfully");
  } catch (error) {
    if (error.message && error.message.includes("already exists")) {
      console.log("Database already seeded, skipping...");
    } else {
      console.error("Database seeding failed:", error);
    }
  }

  app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const server = await registerRoutes(app);

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

startServer().catch(console.error);