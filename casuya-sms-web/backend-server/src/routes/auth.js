const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const asyncHandler = require("../middleware/asyncHandler");

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || "1h",
  });
}

function validatePasswordStrength(password) {
  if (password.length < 8) {
    return "password must be at least 8 characters";
  }
  if (!/[A-Z]/.test(password)) {
    return "password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "password must contain at least one number";
  }
  return null;
}

// --- Rate limit: 5 registrations per 15 min per IP ---
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many registration attempts, please try again later" },
});

// --- Rate limit: 10 login attempts per 15 min per IP ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many login attempts, please try again later" },
});

// --- Rate limit: 3 forgot-password requests per 15 min per IP ---
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too many reset requests, please try again later" },
});

router.post(
  "/register",
  registerLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: "invalid email address" });
    }
    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return res.status(400).json({ error: strengthError });
    }

    const existing = await User.findByEmail(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: "email already registered" });
    }

    const user = await User.createUser(email.toLowerCase(), password);
    return res.status(201).json({ token: signToken(user), user: User.safeUser(user) });
  })
);

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findByEmail(email.toLowerCase());
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: "invalid email or password" });
    }
    if (user.banned) {
      return res.status(403).json({ error: "account is banned" });
    }

    return res.json({ token: signToken(user), user: User.safeUser(user) });
  })
);

router.get(
  "/me",
  require("../middleware/auth"),
  asyncHandler(async (req, res) => {
    return res.json({ user: User.safeUser(req.user) });
  })
);

router.post(
  "/forgot-password",
  forgotLimiter,
  asyncHandler(async (req, res) => {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    const user = await User.findByEmail(email.toLowerCase());
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ ok: true, message: "If an account exists, a reset link has been generated." });
    }

    const { raw, expires_at } = await PasswordReset.generateToken(user.id);

    // Log the reset link to console (no email service configured)
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${raw}`;
    console.log(`\n========================================`);
    console.log(`PASSWORD RESET for ${user.email}:`);
    console.log(`${resetUrl}`);
    console.log(`Expires: ${expires_at.toLocaleString()}`);
    console.log(`========================================\n`);

    return res.json({
      ok: true,
      message: "If an account exists, a reset link has been generated.",
      ...(process.env.NODE_ENV !== "production" && { resetUrl }),
    });
  })
);

router.post(
  "/reset-password",
  forgotLimiter,
  asyncHandler(async (req, res) => {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: "token and password are required" });
    }
    const strengthError = validatePasswordStrength(password);
    if (strengthError) {
      return res.status(400).json({ error: strengthError });
    }

    const record = await PasswordReset.verifyToken(token);
    if (!record) {
      return res.status(400).json({ error: "invalid or expired reset token" });
    }

    await User.updatePassword(record.user_id, password);
    await PasswordReset.markUsed(record.id);

    return res.json({ ok: true, message: "password has been reset" });
  })
);

module.exports = router;