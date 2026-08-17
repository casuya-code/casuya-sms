const router = require("express").Router();
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const Message = require("../models/Message");
const Device = require("../models/Device");
const webhook = require("../core/webhook");

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "message upload rate limit exceeded, slow down" },
  keyGenerator: (req) => req.user?.id?.toString() || ipKeyGenerator(req),
});

router.post(
  "/received",
  auth,
  uploadLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const deviceId = typeof body.deviceId === "string" ? body.deviceId : "";

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const owned = await Device.findByUserAndId(req.user.id, deviceId);
    if (!owned) {
      return res.status(403).json({ error: "device not found or not owned by you" });
    }

    let items = [];
    if (Array.isArray(body.items)) {
      items = body.items.filter(
        (it) => it && (it.from !== undefined || it.message !== undefined || it.timestamp !== undefined)
      );
    } else {
      items = [
        { from: body.from, message: body.message, timestamp: body.timestamp, type: body.type },
      ];
    }

    if (items.length === 0) {
      return res.status(400).json({ error: "items array is empty" });
    }
    if (items.length > 1000) {
      return res.status(400).json({ error: "too many items (max 1000)" });
    }

    const inserted = await Message.addBatch(req.user.id, deviceId, items);
    webhook.deliver(req.user.id, "sms.received", { device_id: deviceId, messages: items });
    return res.status(201).json({ success: true, inserted });
  })
);

router.use(auth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { type, search, limit, offset } = req.query || {};
    const cleanType = type !== undefined && type !== null && type !== "" && Number.isFinite(Number(type))
      ? Number(type)
      : undefined;
    const messages = await Message.listByUser(req.user.id, { type: cleanType, search, limit, offset });
    return res.json(messages);
  })
);

router.get(
  "/count",
  asyncHandler(async (req, res) => {
    const { type, search } = req.query || {};
    const cleanType = type !== undefined && type !== null && type !== "" && Number.isFinite(Number(type))
      ? Number(type)
      : undefined;
    const count = await Message.countForUser(req.user.id, { type: cleanType, search });
    return res.json({ count });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const removed = await Message.remove(req.user.id, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "message not found" });
    }
    return res.json({ ok: true });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const count = await Message.clearAll(req.user.id);
    return res.json({ success: true, deleted: count });
  })
);

module.exports = router;