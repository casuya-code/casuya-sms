const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const apiKeyAuth = require("../middleware/apiKeyAuth");
const eitherAuth = require("../middleware/eitherAuth");
const { pool } = require("../config/database");
const Device = require("../models/Device");
const UsageLog = require("../models/UsageLog");
const { broadcast, notifyUser } = require("../core/websocket");
const asyncHandler = require("../middleware/asyncHandler");

// --- Rate limit: 30 SMS sends per minute per user ---
const smsSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "SMS rate limit exceeded, slow down" },
  keyGenerator: (req) => req.user_id || ipKeyGenerator(req),
});

// --- Rate limit: 10 bulk sends per minute per user ---
const bulkSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "bulk send rate limit exceeded, slow down" },
  keyGenerator: (req) => req.user_id || ipKeyGenerator(req),
});

router.get(
  "/sms/logs",
  eitherAuth,
  asyncHandler(async (req, res) => {
    const logs = await UsageLog.listByUser(req.user_id);
    return res.json(logs);
  })
);

router.delete(
  "/sms/logs/:id",
  eitherAuth,
  asyncHandler(async (req, res) => {
    const deleted = await UsageLog.remove(req.user_id, parseInt(req.params.id, 10));
    if (!deleted) {
      return res.status(404).json({ error: "log not found" });
    }
    return res.json({ success: true });
  })
);

router.delete(
  "/sms/logs",
  eitherAuth,
  asyncHandler(async (req, res) => {
    const count = await UsageLog.clearAll(req.user_id);
    return res.json({ success: true, deleted: count });
  })
);

router.post(
  "/send",
  smsSendLimiter,
  apiKeyAuth,
  asyncHandler(async (req, res) => {
    const { to, message } = req.body || {};
    if (!to || !message) {
      return res.status(400).json({ error: "to and message are required" });
    }
    if (!/^\+?[0-9]{6,15}$/.test(String(to).trim())) {
      return res.status(400).json({ error: "invalid phone number" });
    }
    if (String(message).length > 1500) {
      return res.status(400).json({ error: "message too long (max 1500 chars)" });
    }

    const devices = await Device.listByUser(req.user_id);
    const device = devices.find((d) => d.status === "online") || null;

    if (!device) {
      return res.status(503).json({ error: "no online device available" });
    }

    const log = await UsageLog.add(req.user_id, device.id, to, message, "queued");

    const payload = { type: "sms:send", sms_log_id: log.id, to, message };
    const delivered = broadcast(device.id, payload);
    if (!delivered) {
      await UsageLog.updateStatus(log.id, "failed");
      notifyUser(req.user_id, { type: "sms:update", sms_log_id: log.id, status: "failed" });
      return res.status(503).json({ error: "device went offline", sms_log_id: log.id });
    }

    return res.status(202).json({
      success: true,
      sms_log_id: log.id,
      status: "queued",
      device_id: device.id,
    });
  })
);

router.get(
  "/status/:smsLogId",
  apiKeyAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT id, device_id, to_number, status, created_at FROM sms_logs WHERE id = $1 AND user_id = $2",
      [req.params.smsLogId, req.user_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "sms log not found" });
    }
    return res.json(rows[0]);
  })
);

router.post(
  "/bulk",
  bulkSendLimiter,
  apiKeyAuth,
  asyncHandler(async (req, res) => {
    const { messages, device_id } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }
    if (messages.length > 500) {
      return res.status(400).json({ error: "max 500 messages per bulk send" });
    }

    let device;
    const devices = await Device.listByUser(req.user_id);
    if (device_id) {
      device = devices.find((d) => d.id === device_id && d.status === "online");
      if (!device) {
        return res.status(403).json({ error: "device not found or offline" });
      }
    } else {
      device = devices.find((d) => d.status === "online") || null;
      if (!device) {
        return res.status(503).json({ error: "no online device available" });
      }
    }

    const results = [];
    for (const msg of messages) {
      const { to, message } = msg || {};
      if (!to || !message) {
        results.push({ to: to || "", status: "failed", error: "missing to or message" });
        continue;
      }
      if (!/^\+?[0-9]{6,15}$/.test(String(to).trim())) {
        results.push({ to, status: "failed", error: "invalid phone number" });
        continue;
      }
      if (String(message).length > 1500) {
        results.push({ to, status: "failed", error: "message too long" });
        continue;
      }

      try {
        const log = await UsageLog.add(req.user_id, device.id, to, message, "queued");
        const payload = { type: "sms:send", sms_log_id: log.id, to, message };
        const delivered = broadcast(device.id, payload);
        if (!delivered) {
          await UsageLog.updateStatus(log.id, "failed");
          results.push({ to, status: "failed", error: "device went offline", sms_log_id: log.id });
        } else {
          results.push({ to, status: "queued", sms_log_id: log.id });
        }
      } catch (err) {
        results.push({ to, status: "failed", error: "internal error" });
      }
    }

    const sent = results.filter((r) => r.status === "queued").length;
    const failed = results.filter((r) => r.status === "failed").length;

    return res.status(202).json({
      success: true,
      total: messages.length,
      sent,
      failed,
      device_id: device.id,
      results,
    });
  })
);

module.exports = router;
