# EventHub – Smart Event Management System (Hack4Tech)

Students browse events, register (individual or team) and get a downloadable QR pass.
Admins manage events, scan QR passes with the camera, mark attendance manually and export CSV/Excel.

**Stack:** React (Vite) + Tailwind + React Router · Node/Express · SQLite (better-sqlite3) · JWT · zod · qrcode · html5-qrcode · exceljs · jsPDF

## Quick start (Node 18.11+)
```bash
npm install        # installs root, server/ and client/ dependencies
npm run seed       # creates the DB, admin user and 3 sample events
npm run dev        # API on :4000, web app on http://localhost:5173
```
Admin login: `http://localhost:5173/admin` → **admin / admin123** (change it after the demo).

## Configuration
`server/.env` → `PORT`, `JWT_SECRET` (change it!), `JWT_EXPIRES_IN`. The Vite dev server proxies `/api` to port 4000.

## Structure
```
server/src  index.js (app, helmet, cors) · db.js (schema) · auth.js (JWT) · seed.js
            routes/public.js (events, register, passes) · routes/admin.js (login, CRUD, scan, attendance, stats, export)
client/src  App.jsx · api.js · components/ · pages/ (Home, EventDetail, Register, MyPass) · pages/admin/ (Login, Dashboard, Events, Registrations, Scanner)
```

## Notes
- **QR pass** encodes a random UUID (`pass_token`, UNIQUE). Scans are validated server-side: unknown token → rejected, other event's pass → rejected, repeat scan → "Already checked in at HH:MM".
- **Team size includes the leader** (e.g. 2–4 means leader + 1–3 members). Duplicate registration (same email + event, case-insensitive) is blocked by both a check and a unique index.
- Attendance: `present`/`late` store a check-in time; `absent` clears it. "Checked in" on the dashboard = present + late.
- Live updates use 5-second polling (dashboard + registrations table).
- Camera scanning needs `localhost` or HTTPS. A manual token field is provided as a fallback.
- Extra columns `schedule` and `rules` were added to `events` for the detail page. Passwords are hashed with `bcryptjs` (pure JS, no native build).
- Rate limits: login 10/15min, register 30/15min, passes 60/15min. Parameterized queries everywhere.
- Production: `npm run build`, serve `client/dist` behind a reverse proxy to `/api`, and set a strong `JWT_SECRET`.
