const passport = require("../config/passport");
const ApiKey = require("../models/ApiKey");
const asyncHandler = require("./asyncHandler");

module.exports = asyncHandler(async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey) {
    try {
      const hash = ApiKey.hashKey(apiKey);
      const record = await ApiKey.findByHash(hash);
      if (record && !record.revoked) {
        if (record.user_banned) {
          return res.status(403).json({ error: "account is banned" });
        }
        req.user_id = record.user_id;
        req.api_key_id = record.id;
        return next();
      }
      return res.status(401).json({ error: "invalid API key" });
    } catch (err) {
      return res.status(401).json({ error: "invalid API key" });
    }
  }

  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: "unauthorized" });
    if (user.banned) return res.status(403).json({ error: "account is banned" });
    req.user = user;
    req.user_id = user.id;
    return next();
  })(req, res, next);
});
