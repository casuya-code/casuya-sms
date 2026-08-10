const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/devices", require("./routes/devices"));
app.use("/api/apikeys", require("./routes/apikeys"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/templates", require("./routes/templates"));
app.use("/api/v1", require("./routes/v1-sms"));

app.use((_req, res) => res.status(404).json({ error: "route not found" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "internal error" });
});

module.exports = app;