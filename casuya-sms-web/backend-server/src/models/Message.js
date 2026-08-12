const { query } = require("../config/database");

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      device_id TEXT,
      from_number TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      timestamp BIGINT NOT NULL DEFAULT 0,
      type INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await query(
    "CREATE INDEX IF NOT EXISTS idx_messages_user_ts ON messages (user_id, timestamp DESC)"
  );
}

async function add(user_id, device_id, from_number, body, timestamp, type) {
  const { rows } = await query(
    `INSERT INTO messages (user_id, device_id, from_number, body, timestamp, type)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [user_id, device_id, from_number, body, timestamp, type]
  );
  return rows[0];
}

async function addBatch(user_id, device_id, items) {
  if (!Array.isArray(items) || items.length === 0) return 0;

  const valueClauses = [];
  const params = [];
  let i = 1;

  for (const it of items) {
    params.push(user_id, device_id, it.from || "", it.message || "", it.timestamp || 0, it.type || 1);
    valueClauses.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++})`);
  }

  const { rowCount } = await query(
    `INSERT INTO messages (user_id, device_id, from_number, body, timestamp, type)
     VALUES ${valueClauses.join(", ")}`,
    params
  );
  return rowCount;
}

async function listByUser(user_id, opts = {}) {
  const { type, search } = opts;
  const params = [user_id];
  const clauses = ["user_id = $1"];
  let i = 2;

  if (type !== undefined && type !== null && type !== "") {
    clauses.push(`type = $${i++}`);
    params.push(Number(type));
  }

  if (search && String(search).trim()) {
    clauses.push(`(body ILIKE $${i} OR from_number ILIKE $${i})`);
    params.push(`%${String(search).trim()}%`);
    i++;
  }

  const limit = Math.min(Math.max(Number(opts.limit) || 100, 1), 500);
  const offset = Math.max(Number(opts.offset) || 0, 0);
  params.push(limit, offset);

  const { rows } = await query(
    `SELECT id, device_id, from_number, body, timestamp, type, created_at
     FROM messages
     WHERE ${clauses.join(" AND ")}
     ORDER BY timestamp DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );
  return rows;
}

async function countForUser(user_id, opts = {}) {
  const { type, search } = opts;
  const params = [user_id];
  const clauses = ["user_id = $1"];
  let i = 2;

  if (type !== undefined && type !== null && type !== "") {
    clauses.push(`type = $${i++}`);
    params.push(Number(type));
  }

  if (search && String(search).trim()) {
    clauses.push(`(body ILIKE $${i} OR from_number ILIKE $${i})`);
    params.push(`%${String(search).trim()}%`);
    i++;
  }

  const { rows } = await query(
    `SELECT COUNT(*)::int AS count FROM messages WHERE ${clauses.join(" AND ")}`,
    params
  );
  return rows[0].count;
}

async function listAll(limit = 100) {
  const { rows } = await query(
    `SELECT m.id, m.from_number, m.body, m.timestamp, m.type, m.created_at,
            m.device_id, u.email AS user_email
     FROM messages m
     JOIN users u ON u.id = m.user_id
     ORDER BY m.timestamp DESC LIMIT $1`,
    [limit]
  );
  return rows;
}

async function countAll() {
  const { rows } = await query("SELECT COUNT(*)::int AS count FROM messages");
  return rows[0].count;
}

async function remove(user_id, id) {
  const { rowCount } = await query(
    "DELETE FROM messages WHERE id = $1 AND user_id = $2",
    [id, user_id]
  );
  return rowCount > 0;
}

async function clearAll(user_id) {
  const { rowCount } = await query("DELETE FROM messages WHERE user_id = $1", [user_id]);
  return rowCount;
}

module.exports = {
  createTable,
  add,
  addBatch,
  listByUser,
  countForUser,
  listAll,
  countAll,
  remove,
  clearAll,
};