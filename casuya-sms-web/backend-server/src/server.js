require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set. Copy .env.example to .env and set a value.");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set. Copy .env.example to .env and set a value.");
  process.exit(1);
}

const app = require("./app");
const websocket = require("./core/websocket");

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
websocket.init(io);

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
server.listen(PORT, async () => {
  try {
    await require("./models/User").createTable();
    await Promise.all([
      require("./models/Device").createTable(),
      require("./models/ApiKey").createTable(),
      require("./models/UsageLog").createTable(),
      require("./models/Template").createTable(),
      require("./models/PasswordReset").createTable(),
    ]);
    await seedAdmin();
    console.log(`casuya-sms backend on :${PORT}`);
  } catch (err) {
    console.error("startup failed:", err.message);
    process.exit(1);
  }
});