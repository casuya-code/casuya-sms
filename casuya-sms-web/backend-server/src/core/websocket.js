const { pool } = require("../config/database");
const Device = require("../models/Device");
const UsageLog = require("../models/UsageLog");

const deviceSockets = new Map();

function init(io) {
  io.on("connection", (socket) => {
    const deviceId = socket.handshake.query.deviceId;

    if (!deviceId) {
      socket.disconnect(true);
      return;
    }

    socket.on("sms:status", async (data) => {
      if (!data || !data.sms_log_id) {
        socket.emit("sms:ack", { received: true });
        return;
      }
      try {
        const { rows } = await pool.query(
          "SELECT id FROM sms_logs WHERE id = $1 AND device_id = $2",
          [data.sms_log_id, deviceId]
        );
        if (rows.length === 0) {
          socket.emit("sms:ack", { received: false, error: "log not found or not yours" });
          return;
        }
        const status = data.success ? "delivered" : "failed";
        await UsageLog.updateStatus(data.sms_log_id, status);
        socket.emit("sms:ack", { received: true, sms_log_id: data.sms_log_id, status });
      } catch (err) {
        console.error("sms:status update failed:", err.message);
        socket.emit("sms:ack", { received: false, error: err.message });
      }
    });

    Device.setStatus(deviceId, "online")
      .then((result) => {
        if (result.rowCount === 0) {
          socket.disconnect(true);
          return;
        }
        deviceSockets.set(deviceId, socket);
      })
      .catch((err) => {
        console.error("device online update failed:", err.message);
        socket.disconnect(true);
      });

    socket.on("disconnect", () => {
      deviceSockets.delete(deviceId);
      Device.setStatus(deviceId, "offline").catch((err) => {
        console.error("device offline update failed:", err.message);
      });
    });
  });
}

function broadcast(deviceId, payload) {
  const socket = deviceSockets.get(deviceId);
  if (!socket) return false;
  socket.emit("sms:send", payload);
  return true;
}

module.exports = { init, broadcast };
