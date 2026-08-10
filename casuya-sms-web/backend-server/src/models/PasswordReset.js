const crypto = require("crypto");
const { query } = require("../config/database");

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function hashToken(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function generateToken(user_id) {
  const raw = crypto.randomBytes(32).toString("hex");
  const token_hash = hashToken(raw);
  const expires_at = new Date(Date.now() + TOKEN_EXPIRY_MS);

  // Invalidate any existing unused tokens for this user
  await query(
    "UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false",
    [user_id]
  );

  await query(
    "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [user_id, token_hash, expires_at.toISOString()]
  );

  return { raw, expires_at };
}

async function verifyToken(raw) {
  const token_hash = hashToken(raw);
  const { rows } = await query(
    "SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND used = false AND expires_at > NOW()",
    [token_hash]
  );
  return rows[0] || null;
}

async function markUsed(id) {
  await query("UPDATE password_reset_tokens SET used = true WHERE id = $1", [id]);
}

async function cleanupExpired() {
  await query("DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = true");
}

module.exports = { createTable, generateToken, verifyToken, markUsed, cleanupExpired };
