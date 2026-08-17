const crypto = require("crypto");
const Webhook = require("../models/Webhook");

const TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 500;

function sign(secret, rawBody) {
  return `sha256=${crypto.createHmac("sha256", secret || "").update(rawBody).digest("hex")}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deliverAttempt(url, headers, rawBody, timeout) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: rawBody,
      signal: controller.signal,
    });
    return { ok: res.ok, status: res.status };
  } finally {
    clearTimeout(timer);
  }
}

async function deliverTo(url, secret, event, payload) {
  const envelope = { event, created_at: new Date().toISOString(), data: payload };
  const rawBody = JSON.stringify(envelope);
  const headers = {
    "Content-Type": "application/json",
    "X-Casuya-Event": event,
    "X-Casuya-Signature": sign(secret, rawBody),
  };

  let attempt = 0;
  let result;
  while (attempt < MAX_RETRIES) {
    try {
      result = await deliverAttempt(url, headers, rawBody, TIMEOUT_MS);
      if (result.ok) return true;
      if (result.status >= 400 && result.status < 500) {
        console.error(`webhook ${event} rejected (${result.status}): ${url}`);
        return false;
      }
    } catch (err) {
      result = { error: err.message };
    }
    attempt += 1;
    if (attempt < MAX_RETRIES) await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
  }

  console.error(`webhook ${event} failed after ${MAX_RETRIES} attempts: ${url}`, result);
  return false;
}

async function deliver(userId, event, payload) {
  try {
    const hooks = await Webhook.listForEvent(userId, event);
    if (hooks.length === 0) return;
    for (const hook of hooks) {
      deliverTo(hook.url, hook.secret, event, payload);
    }
  } catch (err) {
    console.error(`webhook deliver error: ${err.message}`);
  }
}

module.exports = { deliver, sign };
