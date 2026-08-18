const { query } = require("../config/database");

const ALL_EVENTS = ["sms.sent", "sms.status", "sms.received"];

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      secret TEXT,
      events JSONB NOT NULL DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function normalizeEvents(events) {
  if (!Array.isArray(events) || events.length === 0) return [];
  return events.filter((e) => ALL_EVENTS.includes(e));
}

async function add(user_id, { url, secret, events }) {
  const { rows } = await query(
    `INSERT INTO webhooks (user_id, url, secret, events)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [user_id, url, secret || null, normalizeEvents(events)]
  );
  return rows[0];
}

async function listByUser(user_id) {
  const { rows } = await query(
    `SELECT id, url, events, created_at,
            CASE WHEN secret IS NULL THEN false ELSE true END AS has_secret
     FROM webhooks WHERE user_id = $1 ORDER BY id DESC`,
    [user_id]
  );
  return rows;
}

async function update(user_id, id, { url, secret, events }) {
  const { rows } = await query(
    `UPDATE webhooks
     SET url = COALESCE($3, url),
         secret = COALESCE($4, secret),
         events = COALESCE($5, events)
     WHERE id = $1 AND user_id = $2
     RETURNING id, url, events, created_at,
               CASE WHEN secret IS NULL THEN false ELSE true END AS has_secret`,
    [id, user_id, url ?? null, secret ?? null, events ? normalizeEvents(events) : null]
  );
  return rows[0] || null;
}

async function remove(user_id, id) {
  const { rowCount } = await query(
    "DELETE FROM webhooks WHERE id = $1 AND user_id = $2",
    [id, user_id]
  );
  return rowCount > 0;
}

async function listForEvent(user_id, event) {
  const { rows } = await query(
    "SELECT id, url, secret, events FROM webhooks WHERE user_id = $1",
    [user_id]
  );
  return rows.filter(
    (w) => !w.events || w.events.length === 0 || w.events.includes(event)
  );
}

module.exports = { createTable, ALL_EVENTS, add, listByUser, update, remove, listForEvent };
