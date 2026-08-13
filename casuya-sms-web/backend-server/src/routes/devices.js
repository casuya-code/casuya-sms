const router = require("express").Router();
const auth = require("../middleware/auth");
const Device = require("../models/Device");
const asyncHandler = require("../middleware/asyncHandler");

router.post(
  "/register",
  auth,
  asyncHandler(async (req, res) => {
    const device_id = (req.body && req.body.device_id) || "";
    const api_key = (req.body && req.body.api_key) || "";
    const device_name = (req.body && req.body.device_name) || "android";
    if (!device_id || !api_key) {
      return res.status(400).json({ error: "device_id and api_key are required" });
    }
    const device = await Device.link(req.user.id, device_id, Device.hashKey(api_key), device_name.trim());
    return res.status(201).json({ deviceId: device.id, status: device.status, device_name: device.device_name });
  })
);

router.post(
  "/heartbeat",
  auth,
  asyncHandler(async (req, res) => {
    const { deviceId, batteryLevel, isCharging, signalStrength } = req.body || {};
    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }
    const device = await Device.findByUserAndId(req.user.id, deviceId);
    if (!device) {
      return res.status(404).json({ error: "device not found" });
    }
    await Device.updateHeartbeat(deviceId, { batteryLevel, isCharging, signalStrength });
    return res.json({ ok: true });
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
