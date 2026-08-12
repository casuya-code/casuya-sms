const { query } = require("../config/database");

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      device_name TEXT NOT NULL DEFAULT 'android',
      status TEXT NOT NULL DEFAULT 'offline',
      battery_level INTEGER,
      is_charging BOOLEAN DEFAULT false,
      signal_strength TEXT,
      last_heartbeat_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS battery_level INTEGER");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_charging BOOLEAN DEFAULT false");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS signal_strength TEXT");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ");
}

async function register(user_id, deviceId, device_name) {
  const { rows } = await query(
    `INSERT INTO devices (id, user_id, device_name)
     VALUES ($1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET device_name = $3, status = 'offline'
     RETURNING *`,
    [deviceId, user_id, device_name]
  );
  return rows[0];
}

async function listByUser(user_id) {
  const { rows } = await query(
    "SELECT * FROM devices WHERE user_id = $1 ORDER BY created_at DESC",
    [user_id]
  );
  return rows;
}

async function findByUserAndId(user_id, deviceId) {
  const { rows } = await query(
    "SELECT * FROM devices WHERE id = $1 AND user_id = $2",
    [deviceId, user_id]
  );
  return rows[0] || null;
}

async function updateName(deviceId, device_name) {
  await query("UPDATE devices SET device_name = $1 WHERE id = $2", [
    device_name,
    deviceId,
  ]);
}

async function setStatus(deviceId, status) {
  return query("UPDATE devices SET status = $1 WHERE id = $2", [status, deviceId]);
}

async function updateHeartbeat(deviceId, { batteryLevel, isCharging, signalStrength }) {
  return query(
    `UPDATE devices
     SET status = 'online',
         battery_level = $2,
         is_charging = $3,
         signal_strength = $4,
         last_heartbeat_at = NOW()
     WHERE id = $1`,
    [deviceId, batteryLevel ?? null, isCharging ?? false, signalStrength ?? null]
  );
}

async function remove(user_id, deviceId) {
  await query("DELETE FROM devices WHERE id = $1 AND user_id = $2", [
    deviceId,
    user_id,
  ]);
}

async function countOnline() {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS count FROM devices WHERE status = 'online'"
  );
  return rows[0].count;
}

module.exports = {
  createTable,
  register,
  listByUser,
  findByUserAndId,
  updateName,
  setStatus,
  updateHeartbeat,
  remove,
  countOnline,
};
