import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import empRouter from "./routes/emp.js";
import authRouter from "./routes/auth.js";
import fileRouter from "./routes/files.js";
import pool from "./db.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./utils/logger.js";

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Check for critical environment variables
if (!process.env.JWT_SECRET_KEY) {
  logger.error("ERROR: JWT_SECRET_KEY environment variable is not set!");
  console.error("ERROR: JWT_SECRET_KEY environment variable is not set!");
  process.exit(1); // Exit the application if the critical env var is missing
}

const app = express();
const port = process.env.PORT || 3000;

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`, { ip: req.ip });
  next();
});

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled for React inline scripts/styles compatibility
  }),
);
app.use(compression()); // Compress responses

// Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again after 15 minutes",
  },
});

app.use(cookieParser());

// Update the CORS configuration to be more permissive for IP-based access
app.use(
  cors({
    origin: true, // Reflect the request origin
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "X-Requested-With",
      "Origin",
    ],
    exposedHeaders: ["Set-Cookie"],
  }),
);

app.use(express.json());

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Database test route
app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS solution");
    logger.info("Database connection successful!");
    res.json({ solution: rows[0].solution });
  } catch (err) {
    logger.error("Database connection failed", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Use employee routes
app.use("/api/employees", empRouter);
// Use authentication routes
app.use("/api/auth", authRouter);
// Use file routes
app.use("/api/files", fileRouter);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// For any other routes, serve the index.html for client-side routing
// Changed from app.get to app.all to catch all HTTP methods
app.all("*", (req, res) => {
  // Exclude API routes from this catch-all
  if (!req.path.startsWith("/api/")) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  } else {
    // This will now properly handle any unmatched API routes with any HTTP method
    logger.error(`API endpoint not found: ${req.method} ${req.url}`);
    res.status(404).json({ message: "API endpoint not found" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled error", { error: err.message, stack: err.stack });
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, "0.0.0.0", () => {
  logger.info(`Server running on http://0.0.0.0:${port}`);
  console.log(`Server running on http://0.0.0.0:${port}`);
});
