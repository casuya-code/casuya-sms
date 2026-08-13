# casuya-sms-web

SaaS SMS Gateway Dashboard. This is the **Web project only** — the backend API + user/admin dashboard. The backend is the bridge: it authenticates users, manages API keys and devices, and pushes SMS orders to phones over WebSocket.

> The web never talks to phones directly. It sends instructions to the backend, the backend forwards them to the device app over WebSocket, and the device sends the actual SMS.

## Architecture

```
[Web Dashboard]  --HTTPS-->  [Backend API + Postgres]  --WebSocket-->  [APK on phone]  --SMS-->  Network
      |                              |                              |
   Browser                   Render / Railway                Mwalimu's phone
```

- **Web Dashboard**: React admin/user interface.
- **Backend**: Node.js API (auth, devices, API keys, SMS sending, admin, usage tracking).
- **Bridge**: WebSocket server that keeps device apps connected so SMS orders can be delivered to them.
- The two projects are fully independent. This repo deploys to the cloud; the APK repo is built separately in Android Studio.

## Project Structure

```
casuya-sms-web/
│
├── backend-server/          # Core Business Logic & Database API
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── config/
│       │   ├── database.js  # PostgreSQL connection
│       │   └── passport.js  # JWT Auth strategy
│       ├── core/
│       │   └── websocket.js # Socket.io init + broadcast to devices
│       ├── middleware/
│       │   ├── auth.js       # Protects dashboard routes (JWT)
│       │   ├── apiKeyAuth.js # Validates X-API-KEY header
│       │   └── asyncHandler.js # Wraps async routes (error handling)
│       ├── models/
│       │   ├── User.js      # users table + queries
│       │   ├── Device.js    # devices table + queries
│       │   ├── ApiKey.js    # api_keys table (hashed keys)
│       │   └── UsageLog.js  # sms_logs table
│       ├── routes/
│       │   ├── auth.js      # POST /api/auth/register, /login
│       │   ├── devices.js   # POST /api/devices/provision, /link, /heartbeat
│       │   ├── apikeys.js   # GET/POST /api/apikeys, revoke
│       │   ├── admin.js     # GET /api/admin/* (Admin only)
│       │   └── v1-sms.js    # POST /api/v1/send (API key)
│       ├── app.js           # Express app + route mounting
│       └── server.js        # HTTP + WebSocket bootstrap
│
└── web-dashboard/           # User & Admin Interface (Vite + React)
    ├── package.json
    ├── vite.config.js
    ├── index.html               # Vite entry (must be at root)
    └── src/
        ├── components/
        │   ├── ApiKeyManager.jsx   # Generate/Revoke API keys
        │   ├── DeviceList.jsx      # Paired phones + status
        │   ├── SendSmsPanel.jsx    # Compose and send SMS
        │   ├── UsageLog.jsx        # SMS log table (user view)
        │   ├── AdminSidebar.jsx    # Admin panel navigation
        │   └── admin/
        │       ├── OverviewSection.jsx  # Admin dashboard stats
        │       ├── UsersSection.jsx     # Admin user management
        │       ├── DevicesSection.jsx   # Admin device management
        │       └── LogsSection.jsx      # Admin SMS log view
        ├── pages/
        │   ├── Login.jsx          # Login form (+ token storage)
        │   ├── Dashboard.jsx      # Standard user view
        │   └── AdminPanel.jsx     # Stats + user management
        ├── lib/
        │   └── api.js             # Axios client + auth token
        ├── App.jsx                # Routes + auth guard
        └── main.jsx               # React entry point
```

## Database Schema (PostgreSQL — works great on Render)

```
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│     USERS      │       │    DEVICES     │       │    API_KEYS    │
├────────────────┤       ├────────────────┤       ├────────────────┤
│ id (PK)        │──────<│ id (PK)        │       │ id (PK)        │
│ email          │       │ user_id (FK)   │       │ user_id (FK)   │
│ password_hash  │       │ device_name    │       │ key_hash       │
│ role (user/adm)│       │ status (online)│       │ created_at     │
└────────────────┘       └────────────────┘       └────────────────┘
        │
        └─────────────────────────────────────────────────────────┘
```

Relationships:
- `users.role` = `'user'` or `'admin'` (drives admin panel access).
- `devices.user_id` → `users.id`: every phone belongs to one account.
- `api_keys.user_id` → `users.id`: the server stores only the **hashed** key; the raw key is shown once.

## Core Workflows

### 1. API Key Integration (for external apps & scripts)

1. User generates a key in `ApiKeyManager.jsx` (e.g. `casuya_live_8f39...`).
2. Server hashes it, saves the hash in DB, shows the raw key **once**.
3. User sends it in their app's header: `X-API-KEY: casuya_live_8f39...`.
4. `apiKeyAuth.js` validates the key → finds `user_id` → locates their online device → pushes the SMS payload via WebSocket.

### 2. Device Registration (pairing a phone)

1. User opens the Android App and logs in with dashboard credentials.
2. The app calls `routes/devices.js` (with the user's JWT).
3. Server generates a unique `deviceId` mapped to that `user_id`.
4. The app stores the `deviceId` locally and uses it to authenticate its WebSocket connection to `server.js`.

### 3. Admin Control

1. Admin routes sit behind a middleware that checks `req.user.role === 'admin'`.
2. Admins can view global stats, manage all registered devices, and ban accounts abusing the platform.

## Getting Started

### Backend

```bash
cd backend-server
npm install
npm run dev
```

Environment variables (`.env`):

```
PORT=8080
DATABASE_URL=postgres://...
# Set to true on Render/Railway (managed Postgres requires SSL)
DATABASE_SSL=true
JWT_SECRET=change-me
```

### Dashboard

```bash
cd web-dashboard
npm install
npm run dev
```

Configure the API base URL in `src/lib/` (point it at the backend URL).

## Core API: Send SMS

`POST /api/v1/send` with header `X-API-KEY: <your_key>`:

```json
{
  "to": "+255712345678",
  "message": "Hello world"
}
```

Response:

```json
{
  "success": true,
  "sms_log_id": 1,
  "status": "queued",
  "device_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

The backend picks an online device, pushes the order over WebSocket, and the device replies with the send result.

## Deployment

- **Web Dashboard** → Vercel / Netlify
- **Backend** → Render / Railway (PostgreSQL add-on)
- Point the dashboard's API URL at the deployed backend URL.

## Related

- Device app (Android APK): `casuya-sms-device` — lives on the phone, runs 24/7, receives orders over WebSocket and sends real SMS.