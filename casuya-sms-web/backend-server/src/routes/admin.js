const router = require("express").Router();
const auth = require("../middleware/auth");
const { pool } = require("../config/database");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Device = require("../models/Device");
const Message = require("../models/Message");

router.use(auth);

router.use((req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "admin only" });
  }
  return next();
});

router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const [users, onlineDevices, totalSms, totalMessages] = await Promise.all([
      User.countAll(),
      Device.countOnline(),
      pool.query("SELECT COUNT(*)::int AS count FROM sms_logs").then((r) => r.rows[0].count),
      Message.countAll(),
    ]);
    return res.json({ users, online_devices: onlineDevices, total_sms: totalSms, total_messages: totalMessages });
  })
);

function parsePagination(query, defaultLimit = 50, maxLimit = 200) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);
  return { limit, offset: (page - 1) * limit };
}

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req.query);
    const [totalRow, users] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM users"),
      pool.query(
        "SELECT id, email, role, banned, created_at FROM users ORDER BY id DESC LIMIT $1 OFFSET $2",
        [limit, offset]
      ),
    ]);
    return res.json({ data: users.rows, total: totalRow.rows[0].count });
  })
);

router.patch(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: "cannot modify your own account" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    const { role, banned } = req.body || {};
    if (role && ["user", "admin"].includes(role)) await User.setRole(user.id, role);
    if (typeof banned === "boolean") await User.setBanned(user.id, banned);
    const updated = await User.findById(user.id);
    return res.json({ user: User.safeUser(updated) });
  })
);

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ error: "cannot delete your own account" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "user not found" });
    }
    if (user.role === "admin") {
      const allAdmins = (await User.listAll()).filter((u) => u.role === "admin");
      if (allAdmins.length <= 1) {
        return res.status(400).json({ error: "cannot delete the last admin" });
      }
    }
    await User.remove(req.params.id);
    return res.json({ ok: true });
  })
);

router.get(
  "/devices",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req.query);
    const [totalRow, devices] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM devices"),
      pool.query(
        `SELECT d.id, d.device_name, d.status, d.created_at, u.email AS user_email
         FROM devices d
         JOIN users u ON u.id = d.user_id
         ORDER BY d.created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);
    return res.json({ data: devices.rows, total: totalRow.rows[0].count });
  })
);

router.get(
  "/logs",
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req.query);
    const [totalRow, logs] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM sms_logs"),
      pool.query(
        `SELECT s.id, s.to_number, s.message, s.status, s.created_at,
                u.email AS user_email, s.device_id
         FROM sms_logs s
         JOIN users u ON u.id = s.user_id
         ORDER BY s.id DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
    ]);
    return res.json({ data: logs.rows, total: totalRow.rows[0].count });
  })
);

router.get(
  "/messages",
  asyncHandler(async (req, res) => {
    const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 500);
    const { rows } = await pool.query(
      `SELECT m.id, m.from_number, m.body, m.timestamp, m.type, m.created_at,
              m.device_id, u.email AS user_email
       FROM messages m
       JOIN users u ON u.id = m.user_id
       ORDER BY m.timestamp DESC LIMIT $1`,
      [limit]
    );
    return res.json(rows);
  })
);

module.exports = router;
