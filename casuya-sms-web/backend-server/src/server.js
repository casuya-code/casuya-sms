const os = require("os");
process.env.UV_THREADPOOL_SIZE = String(Math.min(os.cpus().length || 4, 16));
require("dotenv").config();
const http = require("http");
const crypto = require("crypto");

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Copy .env.example to .env and set a value.");
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error("FATAL: JWT_SECRET must be at least 32 characters long for security.");
  process.exit(1);
}
if (process.env.JWT_SECRET === "casuya-sms-super-secret-jwt-key-2024-local-dev") {
  console.error("FATAL: You are using the default JWT_SECRET. Generate a random one:");
  console.error(`  node -e "console.log(crypto.randomBytes(48).toString('base64'))"`);
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set. Copy .env.example to .env and set a value.");
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD.length < 8) {
  console.warn("WARNING: ADMIN_PASSWORD should be at least 8 characters for security.");
}

const app = require("./app");
const websocket = require("./core/websocket");

let server;
if (process.env.NODE_ENV === "production" && process.env.HTTPS_KEY && process.env.HTTPS_CERT) {
  const https = require("https");
  const fs = require("fs");
  server = https.createServer(
    {
      key: fs.readFileSync(process.env.HTTPS_KEY),
      cert: fs.readFileSync(process.env.HTTPS_CERT),
    },
    app
  );
  console.log("HTTPS server starting...");
} else {
  server = http.createServer(app);
  if (process.env.NODE_ENV === "production") {
    console.warn("WARNING: Running HTTP in production. Set HTTPS_KEY and HTTPS_CERT for TLS.");
  }
}

websocket.init(server);

async function seedAdmin() {
  const User = require("./models/User");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;
  const existing = await User.findByEmail(adminEmail.toLowerCase());
  if (!existing) {
    await User.createUser(adminEmail.toLowerCase(), adminPassword, "admin");
    console.log(`admin seeded: ${adminEmail}`);
  }
}

const PORT = process.env.PORT || 8081;

const DEVICE_GRACE_SECONDS = Number(process.env.DEVICE_GRACE_SECONDS) || 3600;

function startDeviceCleanup() {
  const run = async () => {
    try {
      const { rowCount } = await require("./models/Device").removeUnlinked(DEVICE_GRACE_SECONDS);
      if (rowCount > 0) console.log(`device cleanup: removed ${rowCount} unlinked device(s)`);
    } catch (err) {
      console.error("device cleanup failed:", err.message);
    }
  };
  run();
  setInterval(run, 5 * 60 * 1000);
}

function startResetCleanup() {
  const run = async () => {
    try {
      await require("./models/PasswordReset").cleanupExpired();
    } catch (err) {
      console.error("reset cleanup failed:", err.message);
    }
  };
  run();
  setInterval(run, 24 * 60 * 60 * 1000);
}

server.listen(PORT, async () => {
  try {
    await require("./models/User").createTable();
    await Promise.all([
      require("./models/Device").createTable(),
      require("./models/ApiKey").createTable(),
      require("./models/UsageLog").createTable(),
      require("./models/Template").createTable(),
      require("./models/PasswordReset").createTable(),
      require("./models/Message").createTable(),
      require("./models/Webhook").createTable(),
    ]);
    try {
      await seedAdmin();
    } catch (err) {
      console.error("admin seed skipped:", err.message);
    }
    startDeviceCleanup();
    startResetCleanup();
    console.log(`casuya-sms backend on :${PORT} [${process.env.NODE_ENV || "development"}]`);
  } catch (err) {
    console.error("startup failed:", err.message);
    process.exit(1);
  }
});
