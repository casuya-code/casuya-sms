const { WebSocketServer } = require("ws");
const jwt = require("jsonwebtoken");
const Device = require("../models/Device");
const UsageLog = require("../models/UsageLog");
const { pool } = require("../config/database");
const webhook = require("./webhook");

const deviceSockets = new Map();
const userSockets = new Map();

function init(server) {
  const wss = new WebSocketServer({
    server,
    perMessageDeflate: false,
    verifyClient: (info, callback) => {
      try {
        const url = new URL(info.req.url, "http://localhost");
        const deviceId = url.searchParams.get("deviceId");
        const apiKey = url.searchParams.get("apiKey");
        const token = url.searchParams.get("token");

        // --- Dashboard / user connection (authenticated via JWT) ---
        if (!deviceId) {
          if (!token) {
            callback(false, 401, "token required");
            return;
          }
          let payload;
          try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
          } catch (err) {
            callback(false, 401, "invalid token");
            return;
          }
          if (!payload || !payload.sub) {
            callback(false, 401, "invalid token");
            return;
          }
          const { rows } = await pool.query("SELECT id, banned FROM users WHERE id = $1", [payload.sub]);
          if (rows.length === 0) {
            callback(false, 403, "invalid user");
            return;
          }
          if (rows[0].banned) {
            callback(false, 403, "account is banned");
            return;
          }
          info.req.userId = rows[0].id;
          info.req.isUser = true;
          callback(true);
          return;
        }

        // --- Device connection (authenticated via device id + api key) ---
        if (!apiKey) {
          callback(false, 401, "apiKey required for WebSocket");
          return;
        }

        // Authenticate the device with its pairing credentials
        const device = await Device.findByDeviceAndKey(deviceId, Device.hashKey(apiKey));
        if (!device) {
          callback(false, 403, "invalid device id or api key");
          return;
        }

        const { rows: userRows } = await pool.query("SELECT banned FROM users WHERE id = $1", [device.user_id]);
        if (userRows.length === 0 || userRows[0].banned) {
          callback(false, 403, "account is banned");
          return;
        }

        info.req.device = device;
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
        if (socket.deviceId) {
          deviceSockets.delete(socket.deviceId);
          Device.setStatus(socket.deviceId, "offline").catch((err) => {
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
    // Dashboard / user socket
    if (req.isUser) {
      handleUserConnection(socket, req.userId);
      return;
    }

    const url = new URL(req.url, "http://localhost");
    const deviceId = url.searchParams.get("deviceId");
    const device = req.device;

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

    Device.markConnected(deviceId)
      .then((result) => {
        if (result.rowCount === 0) {
          socket.close(1008, "unknown device");
          return;
        }
        deviceSockets.set(deviceId, socket);
        console.log(`device connected: ${deviceId} (user: ${device.user_id})`);
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
            "SELECT id, to_number, message FROM sms_logs WHERE id = $1 AND device_id = $2",
            [smsLogId, deviceId]
          );
          if (rows.length === 0) {
            socket.send(JSON.stringify({ type: "sms:ack", received: false, error: "log not found" }));
            return;
          }
          const status = data.success ? "delivered" : "failed";
          await UsageLog.updateStatus(smsLogId, status);
          console.log(`SMS status updated: log ${smsLogId} -> ${status}`);
          notifyUser(device.user_id, { type: "sms:update", sms_log_id: smsLogId, status });
          webhook.deliver(device.user_id, "sms.status", {
            sms_log_id: smsLogId,
            to: rows[0].to_number,
            message: rows[0].message,
            status,
            device_id: deviceId,
          });
          socket.send(JSON.stringify({ type: "sms:ack", received: true, sms_log_id: smsLogId, status }));
        } catch (err) {
          console.error("sms:status update failed:", err.message);
          socket.send(JSON.stringify({ type: "sms:ack", received: false, error: "update failed" }));
        }
      }
    });

    socket.on("close", () => {
      // Only mark offline if this socket is still the active one for the device.
      // A reconnect closes the old socket after the new one has taken over, which
      // would otherwise race and persist a stale "offline" status.
      if (deviceSockets.get(deviceId) === socket) {
        deviceSockets.delete(deviceId);
        Device.setStatus(deviceId, "offline").catch((err) => {
          console.error("device offline update failed:", err.message);
        });
      }
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
  try {
    socket.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

function handleUserConnection(socket, userId) {
  socket.isAlive = true;
  socket.isUserSocket = true;

  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  const sockets = userSockets.get(userId);
  sockets.add(socket);

  const cleanup = () => {
    sockets.delete(socket);
    if (sockets.size === 0) userSockets.delete(userId);
  };

  socket.on("pong", () => { socket.isAlive = true; });
  socket.on("close", cleanup);
  socket.on("error", () => {});

  socket.send(JSON.stringify({ type: "connected", user_id: userId }));
}

function notifyUser(userId, payload) {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) return;
  const msg = JSON.stringify(payload);
  for (const sock of sockets) {
    if (sock.readyState === 1) {
      try { sock.send(msg); } catch { /* skip dead socket */ }
    }
  }
}

module.exports = { init, broadcast, notifyUser };
