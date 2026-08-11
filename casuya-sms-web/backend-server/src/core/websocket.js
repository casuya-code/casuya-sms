const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const Device = require("../models/Device");
const UsageLog = require("../models/UsageLog");
const { pool } = require("../config/database");

const deviceSockets = new Map();

function verifyDeviceToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function init(server) {
  const wss = new WebSocketServer({
    server,
    perMessageDeflate: false,
    verifyClient: async (info, callback) => {
      try {
        const url = new URL(info.req.url, `http://${info.req.headers.host}`);
        const deviceId = url.searchParams.get("deviceId");
        const token = url.searchParams.get("token");

        if (!deviceId) {
          callback(false, 401, "deviceId required");
          return;
        }
        if (!token) {
          callback(false, 401, "token required for WebSocket");
          return;
        }

        const payload = verifyDeviceToken(token);
        if (!payload) {
          callback(false, 401, "invalid or expired token");
          return;
        }

        // Verify device ownership - prevent impersonation
        const device = await Device.findByUserAndId(payload.sub, deviceId);
        if (!device) {
          callback(false, 403, "device not found or not owned by you");
          return;
        }

        info.req.userId = payload.sub;
        callback(true);
      } catch (err) {
        console.error("WebSocket verifyClient error:", err.message);
        callback(false, 500, "server error");
      }
    },
  });

  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((socket) => {
      if (socket.isAlive === false) {
        const deviceId = socket.deviceId;
        if (deviceId) {
          deviceSockets.delete(deviceId);
          Device.setStatus(deviceId, "offline").catch((err) => {
            console.error("device offline update failed:", err.message);
          });
        }
        return socket.terminate();
      }
      socket.isAlive = false;
      socket.ping();
    });
  }, 30000);

  wss.on("close", () => clearInterval(heartbeatInterval));

  wss.on("connection", (socket, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const deviceId = url.searchParams.get("deviceId");
    const userId = req.userId;

    socket.isAlive = true;
    socket.deviceId = deviceId;

    socket.on("pong", () => {
      socket.isAlive = true;
    });

    const existing = deviceSockets.get(deviceId);
    if (existing && existing !== socket) {
      existing.close(1000, "replaced by new connection");
      deviceSockets.delete(deviceId);
    }

    Device.setStatus(deviceId, "online")
      .then((result) => {
        if (result.rowCount === 0) {
          socket.close(1008, "unknown device");
          return;
        }
        deviceSockets.set(deviceId, socket);
        console.log(`device connected: ${deviceId} (user: ${userId})`);
      })
      .catch((err) => {
        console.error("device online update failed:", err.message);
        socket.close(1011, "server error");
      });

    socket.on("message", async (raw) => {
      let data;
      try {
        data = JSON.parse(raw.toString());
      } catch (err) {
        console.error(`WebSocket parse error from ${deviceId}:`, err.message);
        return;
      }

      console.log(`WebSocket message from ${deviceId}:`, data.type);

      if (data.type === "sms:status") {
        const smsLogId = Number(data.sms_log_id);
        if (!smsLogId) return;

        try {
          const { rows } = await pool.query(
            "SELECT id FROM sms_logs WHERE id = $1 AND device_id = $2",
            [smsLogId, deviceId]
          );
          if (rows.length === 0) {
            socket.send(JSON.stringify({ type: "sms:ack", received: false, error: "log not found" }));
            return;
          }
          const status = data.success ? "delivered" : "failed";
          await UsageLog.updateStatus(smsLogId, status);
          console.log(`SMS status updated: log ${smsLogId} -> ${status}`);
          socket.send(JSON.stringify({ type: "sms:ack", received: true, sms_log_id: smsLogId, status }));
        } catch (err) {
          console.error("sms:status update failed:", err.message);
          socket.send(JSON.stringify({ type: "sms:ack", received: false, error: "update failed" }));
        }
      }
    });

    socket.on("close", () => {
      deviceSockets.delete(deviceId);
      Device.setStatus(deviceId, "offline").catch((err) => {
        console.error("device offline update failed:", err.message);
      });
      console.log(`device disconnected: ${deviceId}`);
    });

    socket.on("error", (err) => {
      console.error(`WebSocket error for ${deviceId}:`, err.message);
    });
  });
}

function broadcast(deviceId, payload) {
  const socket = deviceSockets.get(deviceId);
  if (!socket || socket.readyState !== 1) return false;
  socket.send(JSON.stringify(payload));
  return true;
}

module.exports = { init, broadcast };
