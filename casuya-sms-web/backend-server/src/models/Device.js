const crypto = require("crypto");
const { query } = require("../config/database");

async function createTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      device_name TEXT NOT NULL DEFAULT 'android',
      status TEXT NOT NULL DEFAULT 'offline',
      pairing_key_hash TEXT,
      first_connected_at TIMESTAMPTZ,
      battery_level INTEGER,
      is_charging BOOLEAN DEFAULT false,
      signal_strength TEXT,
      last_heartbeat_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS pairing_key_hash TEXT");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS first_connected_at TIMESTAMPTZ");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS battery_level INTEGER");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS is_charging BOOLEAN DEFAULT false");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS signal_strength TEXT");
  await query("ALTER TABLE devices ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ");
}

function hashKey(raw) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function generatePairingKey() {
  return `casuya_dv_${crypto.randomBytes(32).toString("hex")}`;
}

async function provision(pairingKeyHash, device_name) {
  const deviceId = crypto.randomUUID();
  const { rows } = await query(
    `INSERT INTO devices (id, user_id, device_name, pairing_key_hash)
     VALUES ($1, NULL, $2, $3)
     RETURNING *`,
    [deviceId, device_name, pairingKeyHash]
  );
  return rows[0];
}

async function link(user_id, deviceId, pairingKeyHash, device_name) {
  const { rows } = await query(
    `INSERT INTO devices (id, user_id, device_name, pairing_key_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       device_name = EXCLUDED.device_name,
       pairing_key_hash = EXCLUDED.pairing_key_hash,
       status = 'offline',
       first_connected_at = NULL
     RETURNING *`,
    [deviceId, user_id, device_name, pairingKeyHash]
  );
  return rows[0];
}

async function findByDeviceAndKey(deviceId, pairingKeyHash) {
  const { rows } = await query(
    "SELECT * FROM devices WHERE id = $1 AND pairing_key_hash = $2 AND user_id IS NOT NULL",
    [deviceId, pairingKeyHash]
  );
  return rows[0] || null;
}

async function markConnected(deviceId) {
  return query(
    `UPDATE devices
     SET status = 'online', first_connected_at = COALESCE(first_connected_at, NOW())
     WHERE id = $1`,
    [deviceId]
  );
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
  const { rowCount } = await query("DELETE FROM devices WHERE id = $1 AND user_id = $2", [
    deviceId,
    user_id,
  ]);
  return rowCount > 0;
}

async function countOnline() {
  const { rows } = await query(
    "SELECT COUNT(*)::int AS count FROM devices WHERE status = 'online'"
  );
  return rows[0].count;
}

async function removeUnlinked(graceSeconds) {
  return query(
    `DELETE FROM devices
     WHERE pairing_key_hash IS NULL
        OR (first_connected_at IS NULL AND created_at < NOW() - make_interval(secs => $1))`,
    [graceSeconds]
  );
}

module.exports = {
  createTable,
  hashKey,
  generatePairingKey,
  provision,
  link,
  findByDeviceAndKey,
  markConnected,
  listByUser,
  findByUserAndId,
  updateName,
  setStatus,
  updateHeartbeat,
  remove,
  countOnline,
  removeUnlinked,
};
