const ApiKey = require("../models/ApiKey");
const asyncHandler = require("./asyncHandler");

const apiKeyAuth = asyncHandler(async (req, res, next) => {
  const key = req.headers["x-api-key"];
  if (!key) {
    return res.status(401).json({ error: "Missing X-API-KEY header" });
  }

  const hash = ApiKey.hashKey(key);
  const record = await ApiKey.findByHash(hash);
  if (!record) {
    return res.status(401).json({ error: "Invalid API key" });
  }
  if (record.user_banned) {
    return res.status(403).json({ error: "account is banned" });
  }

  req.user_id = record.user_id;
  req.api_key_id = record.id;
  return next();
});

module.exports = apiKeyAuth;