const { query } = require("../config/database");

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS sms_logs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      device_id TEXT,
      to_number TEXT NOT NULL,
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'queued',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function add(user_id, device_id, to, message, status) {
  const { rows } = await query(
    `INSERT INTO sms_logs (user_id, device_id, to_number, message, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user_id, device_id, to, message, status]
  );
  return rows[0];
}

async function listByUser(user_id, limit = 50) {
  const { rows } = await query(
    `SELECT id, device_id, to_number, message, status, created_at
     FROM sms_logs WHERE user_id = $1 ORDER BY id DESC LIMIT $2`,
    [user_id, limit]
  );
  return rows;
}

async function listAll(limit = 100) {
  const { rows } = await query(
    `SELECT s.id, s.to_number, s.message, s.status, s.created_at,
            u.email AS user_email, s.device_id
     FROM sms_logs s
     JOIN users u ON u.id = s.user_id
     ORDER BY s.id DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function updateStatus(id, status) {
  await query("UPDATE sms_logs SET status = $1 WHERE id = $2", [status, id]);
}

async function remove(user_id, id) {
  const { rowCount } = await query(
    "DELETE FROM sms_logs WHERE id = $1 AND user_id = $2",
    [id, user_id]
  );
  return rowCount > 0;
}

async function clearAll(user_id) {
  const { rowCount } = await query(
    "DELETE FROM sms_logs WHERE user_id = $1",
    [user_id]
  );
  return rowCount;
}

async function countForUser(user_id) {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS count FROM sms_logs WHERE user_id = $1",
    [user_id]
  );
  return rows[0].count;
}

module.exports = { createTable, add, listByUser, listAll, updateStatus, remove, clearAll, countForUser };