const router = require("express").Router();
const auth = require("../middleware/auth");
const { pool } = require("../config/database");
const asyncHandler = require("../middleware/asyncHandler");
const User = require("../models/User");
const Device = require("../models/Device");
const UsageLog = require("../models/UsageLog");

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
    const [users, onlineDevices, totalSms] = await Promise.all([
      User.countAll(),
      Device.countOnline(),
      pool.query("SELECT COUNT(*)::int AS count FROM sms_logs").then((r) => r.rows[0].count),
    ]);
    return res.json({ users, online_devices: onlineDevices, total_sms: totalSms });
  })
);

router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await User.listAll();
    return res.json(users);
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
  asyncHandler(async (_req, res) => {
    const { rows } = await pool.query(`
      SELECT d.id, d.device_name, d.status, d.created_at, u.email AS user_email
      FROM devices d
      JOIN users u ON u.id = d.user_id
      ORDER BY d.created_at DESC
    `);
    return res.json(rows);
  })
);

router.get(
  "/logs",
  asyncHandler(async (_req, res) => {
    const logs = await UsageLog.listAll();
    return res.json(logs);
  })
);

module.exports = router;
