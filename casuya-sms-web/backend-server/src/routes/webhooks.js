const router = require("express").Router();
const auth = require("../middleware/auth");
const Webhook = require("../models/Webhook");
const asyncHandler = require("../middleware/asyncHandler");

function parseEvents(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) return [];
  return Webhook.normalizeEvents(raw);
}

router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const webhooks = await Webhook.listByUser(req.user.id);
    return res.json(webhooks);
  })
);

router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { url, secret, events } = req.body || {};
    if (!url || typeof url !== "string" || !/^https?:\/\//.test(url)) {
      return res.status(400).json({ error: "valid url (http/https) is required" });
    }
    const created = await Webhook.add(req.user.id, {
      url: url.trim(),
      secret: secret || undefined,
      events: parseEvents(events),
    });
    return res.status(201).json(created);
  })
);

router.patch(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const { url, secret, events } = req.body || {};
    if (url !== undefined && (!url || !/^https?:\/\//.test(url))) {
      return res.status(400).json({ error: "valid url (http/https) is required" });
    }
    const updated = await Webhook.update(req.user.id, req.params.id, {
      url,
      secret,
      events: parseEvents(events),
    });
    if (!updated) {
      return res.status(404).json({ error: "webhook not found" });
    }
    return res.json(updated);
  })
);

router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const removed = await Webhook.remove(req.user.id, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "webhook not found" });
    }
    return res.json({ ok: true });
  })
);

module.exports = router;
