const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const asyncHandler = require("../middleware/asyncHandler");

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: "invalid email address" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "password must be at least 6 characters" });
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
      // In development, return the link directly so it can be shown in the UI
      ...(process.env.NODE_ENV !== "production" && { resetUrl }),
    });
  })
);

router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const { token, password } = req.body || {};
    if (!token || !password) {
      return res.status(400).json({ error: "token and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "password must be at least 6 characters" });
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