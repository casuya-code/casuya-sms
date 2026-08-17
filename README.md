<div align="center">

# Casuya SMS

**Open-source SMS Gateway — turn any Android phone into an SMS API**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![API](https://img.shields.io/badge/API-REST-blue)](https://casuya-sms.vercel.app)
[![Android](https://img.shields.io/badge/Android-8.0+-green)]()

[Web Dashboard](https://casuya-sms.vercel.app) · [Download APK](https://github.com/casuya-code/casuya-sms/releases) · [Report Bug](https://github.com/casuya-code/casuya-sms/issues)

</div>

---

## What is Casuya SMS?

Casuya SMS lets you use an Android phone as an SMS gateway. Send SMS messages via a REST API, manage devices from a web dashboard, and receive SMS notifications — all from one platform.

```
Your App → REST API → Railway Server → WebSocket → Android Phone → Sends SMS
```

## Features

| Feature | Description |
|---------|-------------|
| **REST API** | Send SMS programmatically with API keys |
| **Web Dashboard** | Manage devices, view logs, send SMS from browser |
| **Android Gateway** | Forward SMS from phone to server in real-time |
| **Multi-device** | Connect multiple phones for redundancy |
| **SMS Templates** | Create reusable message templates with variables |
| **Bulk SMS** | Send to multiple recipients via CSV upload |
| **API Keys** | Generate and revoke API keys per user |
| **Admin Panel** | Manage users, devices, and view analytics |

## Quick Start

### 1. Get the App

Download the latest APK from [Releases](https://github.com/casuya-code/casuya-sms/releases) and install on your Android device.

### 2. Create Account

Go to [casuya-sms.vercel.app](https://casuya-sms.vercel.app) and sign up.

### 3. Register Device

Open the dashboard **Devices** section and click **Link Device**. In the Android app's Device Info screen, tap **Copy ID** and **Copy Key**, then paste both values into the dashboard and click **Link Device**. Keep the app open — it connects automatically and shows as online.

### 4. Send SMS

```bash
curl -X POST https://casuya-sms-production.up.railway.app/api/v1/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "+1234567890", "message": "Hello from Casuya SMS!"}'
```

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Web App    │────▶│  Backend API     │◀────│ Android App  │
│  (React)     │     │  (Node.js)       │     │  (Kotlin)    │
└──────────────┘     └──────────────────┘     └──────────────┘
       │                     │                       │
       ▼                     ▼                       ▼
   Vercel              Railway + Neon            Your Phone
                     (PostgreSQL)
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, React Router |
| Backend | Node.js, Express, WebSocket |
| Database | PostgreSQL (Neon) |
| Android | Kotlin, Jetpack Compose |
| Hosting | Vercel (frontend), Railway (backend) |

## Self-Hosting

### Backend (Railway)

1. Fork this repo
2. Create a Railway project from `casuya-sms-web/backend-server`
3. Add a PostgreSQL database (Neon or Railway)
4. Set environment variables:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-min-32-chars
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=YourStrongPassword!
CORS_ORIGINS=https://your-vercel-app.vercel.app
NODE_ENV=production
```

### Frontend (Vercel)

1. Create a Vercel project from `casuya-sms-web/web-dashboard`
2. Set environment variable:

```env
VITE_API_URL=https://your-railway-app.up.railway.app
```

## API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/devices/register` | JWT | Register device |
| GET | `/api/devices` | JWT | List devices |
| POST | `/api/v1/send` | API Key | Send SMS |
| GET | `/api/v1/sms/logs` | JWT | View SMS logs |

> Full API and webhook documentation: see [**API.md**](casuya-sms-web/API.md) — covers sending SMS, delivery status, webhook setup, signature verification, and all endpoint reference.

## Environment Variables

### Backend

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Min 32 characters |
| `ADMIN_EMAIL` | Yes | Admin account email |
| `ADMIN_PASSWORD` | Yes | Min 8 chars, upper+lower+digit |
| `CORS_ORIGINS` | Yes | Comma-separated allowed origins |
| `JWT_EXPIRY` | No | Default: `1h` |
| `NODE_ENV` | No | `production` for live |

### Frontend

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with care by [Casuya Systems](https://casuya.dev)**

</div>
