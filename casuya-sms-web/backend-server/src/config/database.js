const { Pool } = require("pg");

const ssl = process.env.DATABASE_SSL === "true"
  ? { rejectUnauthorized: process.env.NODE_ENV === "production" }
  : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};