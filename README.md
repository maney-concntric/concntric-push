# Concntric — Weekly Tactical Meeting Runner

A full-stack web app for facilitating [Lencioni / Table Group](https://www.tablegroup.com/) Weekly Tactical meetings. Includes a meeting runner with 8 structured sections, multi-user auth, and an admin panel.

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- npm

### 1. Clone & install

```bash
cd concntric-meetings
npm install          # installs root devDependencies (concurrently)
npm run install:all  # installs server + client dependencies
```

### 2. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env` and set:
- `JWT_SECRET` — a long random string (generate with `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- `ADMIN_PASSWORD` — your desired admin password (min 10 characters)
- `ADMIN_EMAIL` — defaults to `maney@concntric.com`
- `ADMIN_NAME` — defaults to `Maney`

### 3. Start dev servers

```bash
npm run dev
```

This starts:
- **Backend** on `http://localhost:3001`
- **Frontend** on `http://localhost:5173` (Vite dev server with API proxy)

### 4. First run

On first start, the server automatically:
- Creates the SQLite database at `./data/meetings.db`
- Seeds the admin account (using `ADMIN_EMAIL` + `ADMIN_PASSWORD`)
- Seeds 6 default team members (Steve/CEO, Sales, Marketing, Product, CS/Ops, Finance)

Open `http://localhost:5173` and sign in with your admin credentials.

---

## Admin Account

The admin account is seeded once on first run. If you need to re-seed (e.g. after deleting the database), just restart the server with `ADMIN_PASSWORD` set.

**Admin capabilities:**
- `/admin` — dashboard with stats
- `/admin/users` — invite users, deactivate/reactivate accounts
- `/admin/team` — configure team members shown in the meeting runner

---

## Inviting Users

1. Go to `/admin/users`
2. Enter the new user's name and email → click **Generate invite link**
3. Share the generated link with them (valid for 48 hours)
4. They visit the link and set their own password

---

## Deployment

### Option A: Separate services (Netlify + Railway)

#### Backend (Railway or Render)

1. Push the `server/` directory to a repo (or deploy the monorepo)
2. Set environment variables in Railway/Render:
   ```
   PORT=3001
   NODE_ENV=production
   JWT_SECRET=<your-secret>
   ADMIN_EMAIL=maney@concntric.com
   ADMIN_NAME=Maney
   ADMIN_PASSWORD=<your-password>
   ALLOWED_ORIGIN=https://your-frontend.netlify.app
   ```
3. Start command: `node index.js`
4. For persistent SQLite, attach a volume and set `DB_PATH=/data/meetings.db`

#### Frontend (Netlify)

1. Build the client:
   ```bash
   npm run build --prefix client
   ```
2. Deploy `client/dist/` to Netlify
3. Set environment variable in Netlify (or `client/.env.production`):
   ```
   VITE_API_URL=https://your-backend.railway.app
   ```
4. Add a `client/public/_redirects` file for SPA routing:
   ```
   /*    /index.html   200
   ```

> **Note:** Update `client/src/api/client.js` to use `VITE_API_URL` in production, or configure the Vite proxy for the build.

### Option B: Single Express app (simplest)

Build the React app and serve it from Express:

```bash
npm run build   # builds client/dist
npm start       # serves API + static files from one Express process
```

Set `NODE_ENV=production` and deploy the entire repo to Railway/Render/Fly.io.

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Set to `production` for prod |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs |
| `ADMIN_EMAIL` | No | `maney@concntric.com` | Admin account email |
| `ADMIN_NAME` | No | `Admin` | Admin display name |
| `ADMIN_PASSWORD` | **Yes** (first run) | — | Admin password (min 10 chars) |
| `ALLOWED_ORIGIN` | No | `http://localhost:5173` | Frontend origin for CORS |
| `DB_PATH` | No | `./data/meetings.db` | SQLite file path |

---

## Tech Stack

- **Frontend:** React 18, React Router 6, Vite 5
- **Backend:** Node.js, Express 4
- **Database:** SQLite via `better-sqlite3`
- **Auth:** JWT (8h access token, 24h refresh), bcrypt (12 rounds)
- **Rate limiting:** 10 login attempts per 15 min per IP

---

## Project Structure

```
/
├── client/               React + Vite frontend
│   └── src/
│       ├── api/          API client (fetch wrapper)
│       ├── components/   Shared UI (Layout, Toast, Timer, StatusPill)
│       ├── hooks/        useAuth, useAutoSave, useTimer
│       └── pages/
│           ├── sections/ 8 meeting section components
│           ├── Login.jsx
│           ├── Meetings.jsx
│           ├── MeetingRunner.jsx
│           ├── AdminDashboard.jsx
│           ├── AdminUsers.jsx
│           └── AdminTeam.jsx
├── server/               Express backend
│   ├── db/               SQLite setup + seeding
│   ├── middleware/        auth.js, rateLimiter.js
│   ├── routes/           auth, users, meetings, team
│   └── index.js
├── data/                 SQLite database (auto-created, gitignored)
├── .env.example
└── README.md
```
