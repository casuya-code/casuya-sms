# Casuya SMS API & Webhooks

This document describes the HTTP API and webhook integration for Casuya SMS. Use it to send SMS programmatically, receive real-time status updates, and react to inbound messages.

Base URL for the hosted API: `https://casuya-sms-production.up.railway.app` (self-hosted deployments use your own Railway URL).

All request and response bodies are JSON (`Content-Type: application/json`).

---

## 1. Authentication

Casuya SMS uses two authentication schemes:

| Scheme | Header | Used for |
|--------|--------|----------|
| **JWT** (dashboard) | `Authorization: Bearer <jwt>` | Managing devices, templates, API keys, webhooks, logs |
| **API Key** (integration) | `X-API-KEY: <api_key>` | Sending SMS (`/api/v1/*`) |

### Get a JWT

```bash
curl -X POST https://casuya-sms-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"YourPassword1"}'
```

```json
{ "token": "eyJhbGciOi...", "user": { "id": 1, "email": "you@example.com", "role": "user", "banned": false } }
```

### Get an API key

```bash
curl -X POST https://casuya-sms-production.up.railway.app/api/apikeys \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json"
```

```json
{ "id": 12, "raw": "casuya_live_9f2c..." }
```

> Save the `raw` value — it is shown only once. Send it in the `X-API-KEY` header for SMS operations.

---

## 2. Sending SMS

### 2.1 Single SMS — `POST /api/v1/send`

Auth: **API Key** · Rate limit: 30/min per user

```bash
curl -X POST https://casuya-sms-production.up.railway.app/api/v1/send \
  -H "X-API-KEY: casuya_live_9f2c..." \
  -H "Content-Type: application/json" \
  -d '{"to":"+255712345678","message":"Hello from Casuya SMS!"}'
```

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `to` | string | yes | E.164 phone number, e.g. `+255712345678` |
| `message` | string | yes | Max 1500 characters |

Responses:

- `202 Accepted` — queued for delivery:
  ```json
  { "success": true, "sms_log_id": 123, "status": "queued", "device_id": "dev_abc123" }
  ```
- `400` — missing/invalid `to` or `message`, message too long
- `503` — no online device available, or the device went offline mid-send

### 2.2 Bulk SMS — `POST /api/v1/bulk`

Auth: **API Key** · Rate limit: 10/min · Max 500 messages per call

```bash
curl -X POST https://casuya-sms-production.up.railway.app/api/v1/bulk \
  -H "X-API-KEY: casuya_live_9f2c..." \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "dev_abc123",
    "messages": [
      { "to": "+255712345678", "message": "Hi Alice" },
      { "to": "+255765432109", "message": "Hi Bob" }
    ]
  }'
```

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `messages` | array | yes | Array of `{ to, message }` objects |
| `device_id` | string | no | Optional — pin a specific online device |

Response (`202 Accepted`):

```json
{
  "success": true,
  "total": 2, "sent": 2, "failed": 0,
  "device_id": "dev_abc123",
  "results": [
    { "to": "+255712345678", "status": "queued", "sms_log_id": 124 },
    { "to": "+255765432109", "status": "queued", "sms_log_id": 125 }
  ]
}
```

### 2.3 Check delivery status — `GET /api/v1/status/:smsLogId`

Auth: **API Key**

```bash
curl -X GET https://casuya-sms-production.up.railway.app/api/v1/status/123 \
  -H "X-API-KEY: casuya_live_9f2c..."
```

```json
{ "id": 123, "device_id": "dev_abc123", "to_number": "+255712345678", "status": "delivered", "created_at": "2026-08-17T10:00:00.000Z" }
```

Status values: `queued` → `delivered` | `failed`.

---

## 3. SMS Logs — `/api/v1/sms/logs`

Auth: JWT or API Key

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/sms/logs` | List the user's SMS logs |
| DELETE | `/api/v1/sms/logs` | Clear all logs |
| DELETE | `/api/v1/sms/logs/:id` | Delete a single log |

---

## 4. Webhooks

Webhooks push events to your endpoint as soon as they happen, so you don't have to poll for status. When an event fires, Casuya SMS sends an HTTP `POST` to every registered webhook URL that subscribes to that event.

### 4.1 Managing webhooks — `/api/webhooks`

Auth: **JWT**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/webhooks` | List your webhooks |
| POST | `/api/webhooks` | Create a webhook |
| PATCH | `/api/webhooks/:id` | Update a webhook |
| DELETE | `/api/webhooks/:id` | Delete a webhook |

**Create a webhook:**

```bash
curl -X POST https://casuya-sms-production.up.railway.app/api/webhooks \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.example.com/sms/webhook",
    "secret": "a-long-random-string",
    "events": ["sms.sent", "sms.status", "sms.received"]
  }'
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `url` | string | yes | Must be `http://` or `https://` |
| `secret` | string | no | Used to sign payloads (strongly recommended) |
| `events` | array | no | Event names to subscribe to. Empty/omitted = all events |

Response (`201 Created`):

```json
{ "id": 5, "url": "https://your-app.example.com/sms/webhook", "events": ["sms.sent","sms.status","sms.received"], "created_at": "2026-08-17T10:00:00.000Z", "has_secret": true }
```

> The `secret` is never returned by the API. `has_secret` tells you whether one is configured.

**Events:**

| Event | Fires when |
|-------|-----------|
| `sms.sent` | An SMS was queued for delivery (`/api/v1/send`, `/api/v1/bulk`, template sends) |
| `sms.status` | An SMS delivery status changed to `delivered` or `failed` |
| `sms.received` | The Android device forwarded an inbound message |

### 4.2 Delivery format

Each delivery is an HTTP `POST` with JSON body:

```json
{
  "event": "sms.status",
  "created_at": "2026-08-17T10:05:01.000Z",
  "data": {
    "sms_log_id": 123,
    "to": "+255712345678",
    "message": "Hello from Casuya SMS!",
    "status": "delivered",
    "device_id": "dev_abc123"
  }
}
```

Headers on every delivery:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-Casuya-Event` | The event name, e.g. `sms.status` |
| `X-Casuya-Signature` | HMAC signature (see below) |

**Example payloads per event:**

- `sms.sent` → `data`: `{ sms_log_id, to, message, status: "queued", device_id }`
- `sms.status` → `data`: `{ sms_log_id, to, message, status: "delivered"|"failed", device_id }`
- `sms.received` → `data`: `{ device_id, messages: [ { from, message, timestamp, type }, ... ] }`

### 4.3 Verifying signatures (recommended)

If you set a `secret`, every payload is signed. Compute the HMAC-SHA256 of the **raw request body** using your secret and compare it to the signature:

```
X-Casuya-Signature: sha256=HMAC_SHA256(secret, raw_body)
```

Node.js (Express, raw body required):

```js
const crypto = require("crypto");

app.post("/sms/webhook", express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), (req, res) => {
  const secret = process.env.CASUYA_WEBHOOK_SECRET;
  const signature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex")}`;

  if (signature !== req.get("X-Casuya-Signature")) {
    return res.status(401).json({ error: "invalid signature" });
  }

  console.log(req.body.event, req.body.data);
  res.status(200).json({ ok: true }); // ack immediately
});
```

Python (Flask):

```python
import hashlib, hmac
from flask import Flask, request

app = Flask(__name__)
SECRET = b"your-long-random-string"

@app.post("/sms/webhook")
def webhook():
    raw = request.get_data()
    expected = "sha256=" + hmac.new(SECRET, raw, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, request.headers["X-Casuya-Signature"]):
        return {"error": "invalid signature"}, 401
    print(request.json)
    return {"ok": True}
```

### 4.4 Delivery behavior

- **Acknowledge fast:** return `2xx` immediately after receiving. Delays or non-`2xx` responses are treated as failures.
- **Retries:** on failure (network error, timeout, or `5xx`), Casuya retries with a small exponential backoff, up to 3 total attempts per event.
- **`4xx` responses** are not retried (the endpoint rejected the payload).
- **Timeout:** each attempt times out after 5 seconds.
- Deliveries are **fire-and-forget** and do not block or slow down SMS processing.

---

## 5. Devices — `/api/devices`

Auth: **JWT**

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/devices/provision` | Provision a new device; returns `{ deviceId, apiKey }` |
| POST | `/api/devices/link` | Link an existing device by `device_id` + `api_key` |
| GET | `/api/devices` | List your devices with online status |
| POST | `/api/devices/heartbeat` | Update device battery/signal telemetry |
| PATCH | `/api/devices/:deviceId` | Rename a device |
| DELETE | `/api/devices/:deviceId` | Remove a device |

---

## 6. Received messages — `/api/messages`

Auth: **JWT** (uploading via the Android app uses the device owner's JWT)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/messages/received` | Upload received messages from a device (`{ deviceId, items: [...] }`) |
| GET | `/api/messages` | List received messages (filters: `type`, `search`, `limit`, `offset`) |
| GET | `/api/messages/count` | Count messages |
| DELETE | `/api/messages/:id` | Delete a message |
| DELETE | `/api/messages` | Clear all messages |

---

## 7. Templates — `/api/templates`

Auth: **JWT**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/templates` | List templates |
| POST | `/api/templates` | Create a template (`{ name, category, message, variables }`) |
| PATCH | `/api/templates/:id` | Update a template |
| DELETE | `/api/templates/:id` | Delete a template |
| POST | `/api/templates/:id/send` | Send a template to a list of rows (`{ rows, device_id }`) |

---

## 8. Auth & account — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create an account |
| POST | `/api/auth/login` | No | Login, get a JWT |
| GET | `/api/auth/me` | JWT | Get the current user |
| POST | `/api/auth/forgot-password` | No | Request a password reset |
| POST | `/api/auth/reset-password` | No | Reset the password with a token |

---

## 9. Admin — `/api/admin`

Auth: **JWT + admin role only**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/stats` | Platform statistics |
| GET | `/api/admin/users` | List users (paginated) |
| PATCH | `/api/admin/users/:id` | Update role / banned status |
| DELETE | `/api/admin/users/:id` | Delete a user |
| GET | `/api/admin/devices` | List all devices (paginated) |
| GET | `/api/admin/logs` | List all SMS logs (paginated) |
| GET | `/api/admin/messages` | List all received messages |

---

## 10. Health check

`GET /health` → `{ "ok": true }`

---

## 11. Error responses

The API returns structured errors:

```json
{ "error": "no online device available" }
```

| HTTP | Meaning |
|------|---------|
| `400` | Invalid request body or validation failure |
| `401` | Missing or invalid auth |
| `403` | Not allowed (CORS, banned account, admin-only) |
| `404` | Resource not found |
| `409` | Conflict (e.g. email already registered) |
| `429` | Rate limit exceeded |
| `500` | Internal error (generic in production) |
| `503` | No online device / device went offline |