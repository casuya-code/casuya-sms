const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");

const app = express();

// --- Security Headers ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-origin" },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true,
  frameguard: { action: "deny" },
}));

// --- CORS (restricted origins) ---
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map((s) => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      const err = new Error("CORS not allowed");
      err.statusCode = 403;
      callback(err);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-API-KEY"],
  maxAge: 86400,
}));

// --- Body parsing with strict limits ---
app.use(express.json({ limit: "64kb", type: ["application/json"] }));

// --- Global rate limiter (100 req/min per IP) ---
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many requests, please try again later" },
  keyGenerator: ipKeyGenerator,
});
app.use(globalLimiter);

// --- Disable X-Powered-By (defense in depth) ---
app.disable("x-powered-by");

// --- Trust proxy (for rate limiter behind reverse proxy) ---
if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY) {
  app.set("trust proxy", 1);
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/devices", require("./routes/devices"));
app.use("/api/apikeys", require("./routes/apikeys"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/templates", require("./routes/templates"));
app.use("/api/v1", require("./routes/v1-sms"));

app.use((_req, res) => res.status(404).json({ error: "route not found" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: process.env.NODE_ENV === "production" ? "internal error" : (err.message || "internal error"),
  });
});

module.exports = app;