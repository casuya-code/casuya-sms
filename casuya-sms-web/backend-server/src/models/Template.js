const { query } = require("../config/database");

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS sms_templates (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      variables JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

async function listByUser(user_id) {
  const { rows } = await query(
    "SELECT * FROM sms_templates WHERE user_id = $1 ORDER BY created_at DESC",
    [user_id]
  );
  return rows;
}

async function findById(id, user_id) {
  const { rows } = await query(
    "SELECT * FROM sms_templates WHERE id = $1 AND user_id = $2",
    [id, user_id]
  );
  return rows[0] || null;
}

async function create(user_id, name, category, message, variables) {
  const { rows } = await query(
    `INSERT INTO sms_templates (user_id, name, category, message, variables)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [user_id, name, category, message, JSON.stringify(variables)]
  );
  return rows[0];
}

async function update(id, user_id, fields) {
  const sets = [];
  const vals = [];
  let i = 1;
  if (fields.name !== undefined) { sets.push(`name = $${i++}`); vals.push(fields.name); }
  if (fields.category !== undefined) { sets.push(`category = $${i++}`); vals.push(fields.category); }
  if (fields.message !== undefined) { sets.push(`message = $${i++}`); vals.push(fields.message); }
  if (fields.variables !== undefined) { sets.push(`variables = $${i++}`); vals.push(JSON.stringify(fields.variables)); }
  if (sets.length === 0) return findById(id, user_id);
  vals.push(id, user_id);
  const { rows } = await query(
    `UPDATE sms_templates SET ${sets.join(", ")} WHERE id = $${i++} AND user_id = $${i} RETURNING *`,
    vals
  );
  return rows[0] || null;
}

async function remove(id, user_id) {
  await query("DELETE FROM sms_templates WHERE id = $1 AND user_id = $2", [id, user_id]);
}

async function countForUser(user_id) {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS count FROM sms_templates WHERE user_id = $1",
    [user_id]
  );
  return rows[0].count;
}

module.exports = { createTable, listByUser, findById, create, update, remove, countForUser };
