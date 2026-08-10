const passport = require("../config/passport");

module.exports = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: "unauthorized" });
    if (user.banned) return res.status(403).json({ error: "account is banned" });
    req.user = user;
    return next();
  })(req, res, next);
};
