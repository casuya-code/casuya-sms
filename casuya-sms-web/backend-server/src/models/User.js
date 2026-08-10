const { query } = require("../config/database");
const bcrypt = require("bcryptjs");

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      banned BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
}

function safeUser(u) {
  if (!u) return null;
  return { id: u.id, email: u.email, role: u.role, banned: u.banned, created_at: u.created_at };
}

async function findByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0] || null;
}

async function createUser(email, password, role = "user") {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *",
    [email, hash, role]
  );
  return safeUser(rows[0]);
}

async function listAll() {
  const { rows } = await query(
    "SELECT id, email, role, banned, created_at FROM users ORDER BY id ASC"
  );
  return rows;
}

async function setRole(id, role) {
  await query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
}

async function setBanned(id, banned) {
  await query("UPDATE users SET banned = $1 WHERE id = $2", [banned, id]);
}

async function remove(id) {
  await query("DELETE FROM users WHERE id = $1", [id]);
}

async function countAll() {
  const { rows } = await query("SELECT COUNT(*)::int AS count FROM users");
  return rows[0].count;
}

async function updatePassword(id, newPassword) {
  const hash = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, id]);
}

module.exports = {
  createTable,
  safeUser,
  findByEmail,
  findById,
  createUser,
  listAll,
  setRole,
  setBanned,
  remove,
  countAll,
  updatePassword,
};