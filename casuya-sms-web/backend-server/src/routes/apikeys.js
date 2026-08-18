const router = require("express").Router();
const auth = require("../middleware/auth");
const ApiKey = require("../models/ApiKey");
const asyncHandler = require("../middleware/asyncHandler");

router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const keys = await ApiKey.listByUser(req.user.id);
    return res.json(keys);
  })
);

router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const { raw, record } = await ApiKey.generate(req.user.id);
    return res.status(201).json({ id: record.id, raw });
  })
);

router.post(
  "/:id/revoke",
  auth,
  asyncHandler(async (req, res) => {
    const revoked = await ApiKey.revoke(req.user.id, req.params.id);
    if (!revoked) {
      return res.status(404).json({ error: "API key not found" });
    }
    return res.json({ ok: true });
  })
);

router.delete(
  "/:id",
  auth,
  asyncHandler(async (req, res) => {
    const removed = await ApiKey.remove(req.user.id, req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "API key not found" });
    }
    return res.json({ ok: true });
  })
);

module.exports = router;