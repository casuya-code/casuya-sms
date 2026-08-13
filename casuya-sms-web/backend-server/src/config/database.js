const { Pool } = require("pg");
const dns = require("dns");
const net = require("net");

const originalLookup = dns.lookup;
dns.lookup = function lookupWithDnsFallback(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  } else if (typeof options === "number") {
    options = { family: options };
  }
  options = options || {};

  if (net.isIP(hostname)) {
    return originalLookup(hostname, options, callback);
  }

  originalLookup(hostname, options, (err, address, family) => {
    if (!err) return callback(null, address, family);
    dns.resolve4(hostname, (resolveErr, addresses) => {
      if (resolveErr || !addresses || addresses.length === 0) {
        return callback(err, address, family);
      }
      if (options.all) {
        callback(null, addresses.map((a) => ({ address: a, family: 4 })));
      } else {
        callback(null, addresses[0], 4);
      }
    });
  });
};

const ssl = process.env.DATABASE_SSL === "true"
  ? { rejectUnauthorized: process.env.NODE_ENV === "production" }
  : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl,
  max: Number(process.env.PG_POOL_MAX) || 50,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000,
  statement_timeout: 10000,
});

pool.on("error", (err) => {
  console.error("Unexpected database pool error:", err.message);
});

const KEEPALIVE_MS = 25000;
setInterval(() => {
  pool.query("SELECT 1").catch((err) => {
    console.error("DB keepalive ping failed:", err.message);
  });
}, KEEPALIVE_MS).unref();

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};