const router = require("express").Router();
const auth = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const Template = require("../models/Template");
const Device = require("../models/Device");
const UsageLog = require("../models/UsageLog");
const { broadcast, notifyUser } = require("../core/websocket");

router.use(auth);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const templates = await Template.listByUser(req.user.id);
    return res.json(templates);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, category, message, variables } = req.body || {};
    if (!name || !message) {
      return res.status(400).json({ error: "name and message are required" });
    }
    const tmpl = await Template.create(
      req.user.id,
      name.trim(),
      (category || "general").trim(),
      message,
      variables || []
    );
    return res.status(201).json(tmpl);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const tmpl = await Template.findById(req.params.id, req.user.id);
    if (!tmpl) {
      return res.status(404).json({ error: "template not found" });
    }
    const updated = await Template.update(req.params.id, req.user.id, req.body || {});
    return res.json(updated);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const tmpl = await Template.findById(req.params.id, req.user.id);
    if (!tmpl) {
      return res.status(404).json({ error: "template not found" });
    }
    await Template.remove(req.params.id, req.user.id);
    return res.json({ ok: true });
  })
);

router.post(
  "/:id/send",
  asyncHandler(async (req, res) => {
    const tmpl = await Template.findById(req.params.id, req.user.id);
    if (!tmpl) {
      return res.status(404).json({ error: "template not found" });
    }

    const { rows, device_id } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "rows array is required" });
    }

    const devices = await Device.listByUser(req.user.id);
    let device;
    if (device_id) {
      device = devices.find((d) => d.id === device_id && d.status === "online");
      if (!device) {
        return res.status(403).json({ error: "device not found or offline" });
      }
    } else {
      device = devices.find((d) => d.status === "online") || null;
      if (!device) {
        return res.status(503).json({ error: "no online device available" });
      }
    }

    let sent = 0;
    let failed = 0;
    const results = [];
    const phoneCol = findColumn(rows[0], ["number", "phone", "simu", "namba", "tel"]);

    for (const row of rows) {
      const phone = phoneCol ? String(row[phoneCol] || "").trim() : "";
      if (!phone || !/^\+?[0-9]{6,15}$/.test(phone)) {
        failed++;
        results.push({ to: phone, status: "failed", error: "invalid phone number" });
        continue;
      }

      const message = fillTemplate(tmpl.message, row);
      if (!message) {
        failed++;
        results.push({ to: phone, status: "failed", error: "empty message" });
        continue;
      }

      try {
        const log = await UsageLog.add(req.user.id, device.id, phone, message, "queued");
        const payload = { type: "sms:send", sms_log_id: log.id, to: phone, message };
        const delivered = broadcast(device.id, payload);
        if (!delivered) {
          await UsageLog.updateStatus(log.id, "failed");
          notifyUser(req.user.id, { type: "sms:update", sms_log_id: log.id, status: "failed" });
          failed++;
          results.push({ to: phone, status: "failed", error: "device went offline" });
        } else {
          sent++;
          results.push({ to: phone, status: "queued", sms_log_id: log.id });
        }
      } catch (err) {
        console.error("template bulk send error:", err.message);
        failed++;
        results.push({ to: phone, status: "failed", error: "internal error" });
      }
    }

    return res.json({ total: rows.length, sent, failed, device_id: device.id, results });
  })
);

function findColumn(row, keywords) {
  if (!row) return null;
  const keys = Object.keys(row);
  for (const kw of keywords) {
    const found = keys.find((k) => k.toLowerCase().includes(kw));
    if (found) return found;
  }
  return null;
}

function fillTemplate(message, row) {
  const keys = Object.keys(row);
  let result = message;

  const nameCol = findColumn(row, ["name", "jina", "mwanafunzi", "first", "last", "surname"]);
  const dateCol = findColumn(row, ["date", "tarehe", "siku", "mwaka"]);
  const phoneCol = findColumn(row, ["number", "phone", "simu", "namba", "tel"]);
  const computedCols = keys.filter((k) =>
    /^(tot|totl|total|avr|avg|average|grd|grade|gde|pos|position|pst|com|comment|comments|remarks|rmk)$/i.test(k)
  );
  const numericCols = keys.filter((k) => {
    if (k === nameCol || k === dateCol || k === phoneCol) return false;
    if (computedCols.includes(k)) return false;
    const val = row[k];
    return val !== "" && val !== null && !isNaN(Number(val));
  });
  const textCols = keys.filter((k) => {
    if (k === nameCol || k === dateCol || k === phoneCol) return false;
    if (computedCols.includes(k)) return false;
    if (numericCols.includes(k)) return false;
    return row[k] !== "" && row[k] !== null;
  });

  // Build name
  const nameParts = [];
  if (nameCol) {
    const nameKeys = keys.filter((k) => {
      const lc = k.toLowerCase();
      return lc.includes("name") || lc.includes("jina") || lc.includes("first") || lc.includes("last") || lc.includes("surname");
    });
    for (const nk of nameKeys) {
      const v = String(row[nk] || "").trim();
      if (v) nameParts.push(v);
    }
  }
  const fullName = nameParts.join(" ") || "";

  // Build computed string
  const computedParts = [];
  const computedLabels = {
    tot: "Jumla", totl: "Jumla", total: "Jumla",
    avr: "Wastani", avg: "Wastani", average: "Wastani",
    grd: "Daraja", grade: "Daraja", gde: "Daraja",
    pos: "Nafasi", position: "Nafasi", pst: "Nafasi",
    com: "Comment", comment: "Comment", comments: "Comment",
    remarks: "Remarks", rmk: "Remarks",
  };
  for (const ck of computedCols) {
    const label = computedLabels[ck.toLowerCase()] || ck;
    computedParts.push(`${label}: ${row[ck]}`);
  }
  const computedStr = computedParts.join(", ");

  // Build numeric string
  const numericParts = [];
  for (const nk of numericCols) {
    numericParts.push(`${nk}: ${row[nk]}`);
  }
  const numericStr = numericParts.join(", ");

  // Collect text values
  const textValues = textCols.map((k) => String(row[k]));

  // Replace variables
  let idx = 0;
  result = result.replace(/\{(name)\}/g, fullName);
  result = result.replace(/\{(date)\}/g, dateCol ? String(row[dateCol] || "") : "");
  result = result.replace(/\{(numeric)\}/g, numericStr);
  result = result.replace(/\{(computed)\}/g, computedStr);
  result = result.replace(/\{(text)\}/g, () => textValues[idx++] || "");

  // Numbered variants
  result = result.replace(/\{(text_(\d+))\}/g, (_, _full, num) => textValues[Number(num) - 1] || "");
  result = result.replace(/\{(date_(\d+))\}/g, (_, _full, num) => {
    const dateKeys = keys.filter((k) => {
      const lc = k.toLowerCase();
      return lc.includes("date") || lc.includes("tarehe") || lc.includes("siku") || lc.includes("mwaka");
    });
    return dateKeys[Number(num) - 1] ? String(row[dateKeys[Number(num) - 1]] || "") : "";
  });
  result = result.replace(/\{(numeric_(\d+))\}/g, (_, _full, num) => {
    return numericCols[Number(num) - 1] ? String(row[numericCols[Number(num) - 1]] || "") : "";
  });

  return result;
}

module.exports = router;
