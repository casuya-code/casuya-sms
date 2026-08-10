const router = require("express").Router();
const { v4: uuidv4 } = require("uuid");
const auth = require("../middleware/auth");
const Device = require("../models/Device");
const asyncHandler = require("../middleware/asyncHandler");

router.post(
  "/register",
  auth,
  asyncHandler(async (req, res) => {
    const device_name = (req.body && req.body.device_name) || "android";
    const deviceId = uuidv4();
    const device = await Device.register(req.user.id, deviceId, device_name);
    return res.status(201).json({ deviceId: device.id, status: device.status });
  })
);

router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const devices = await Device.listByUser(req.user.id);
    return res.json(devices);
  })
);

router.patch(
  "/:deviceId",
  auth,
  asyncHandler(async (req, res) => {
    const device = await Device.findByUserAndId(req.user.id, req.params.deviceId);
    if (!device) {
      return res.status(404).json({ error: "device not found" });
    }
    const device_name = (req.body && req.body.device_name) || device.device_name;
    await Device.updateName(device.id, device_name);
    return res.json({ ok: true, device: { ...device, device_name } });
  })
);

router.delete(
  "/:deviceId",
  auth,
  asyncHandler(async (req, res) => {
    await Device.remove(req.user.id, req.params.deviceId);
    return res.json({ ok: true });
  })
);

module.exports = router;