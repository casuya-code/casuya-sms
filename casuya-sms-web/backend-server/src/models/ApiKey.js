const crypto = require("crypto");
const { query } = require("../config/database");

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      key_hash TEXT UNIQUE NOT NULL,
      revoked BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function hashKey(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

async function generate(user_id) {
  const raw = `casuya_live_${crypto.randomBytes(24).toString("hex")}`;
  const key_hash = hashKey(raw);
  const { rows } = await query(
    "INSERT INTO api_keys (user_id, key_hash) VALUES ($1, $2) RETURNING id, revoked, created_at",
    [user_id, key_hash]
  );
  return { raw, record: rows[0] };
}

async function findByHash(key_hash) {
  const { rows } = await query(
    `SELECT ak.*, u.banned AS user_banned
     FROM api_keys ak
     JOIN users u ON u.id = ak.user_id
     WHERE ak.key_hash = $1 AND ak.revoked = false`,
    [key_hash]
  );
  return rows[0] || null;
}

async function listByUser(user_id) {
  const { rows } = await query(
    "SELECT id, revoked, created_at FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC",
    [user_id]
  );
  return rows;
}

async function revoke(user_id, id) {
  const { rowCount } = await query("UPDATE api_keys SET revoked = true WHERE id = $1 AND user_id = $2", [
    id,
    user_id,
  ]);
  return rowCount > 0;
}

async function remove(user_id, id) {
  const { rowCount } = await query("DELETE FROM api_keys WHERE id = $1 AND user_id = $2", [id, user_id]);
  return rowCount > 0;
}

async function removeAllForUser(user_id) {
  await query("DELETE FROM api_keys WHERE user_id = $1", [user_id]);
}

module.exports = { createTable, hashKey, generate, findByHash, listByUser, revoke, remove, removeAllForUser };