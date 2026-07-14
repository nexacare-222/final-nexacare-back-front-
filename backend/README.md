# NexaCare — merged frontend + backend

Two services, run together, same-site via a reverse proxy so the
`SameSite=Strict` auth cookies work:

```
backend/    Next.js API-only service (auth, patients, staff, care-events,
            lab-reports, notifications, messages, gemini) — port 4000
frontend/   Vite/React SPA + Express server that proxies /api/* to the
            backend and serves the app — port 3000
```

## Run it

```bash
# 1) backend
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT secrets, GEMINI_API_KEY
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev                 # http://localhost:4000

# 2) frontend (separate terminal)
cd frontend
cp .env.example .env        # BACKEND_ORIGIN defaults to http://localhost:4000
npm install
npm run dev                 # http://localhost:3000
```

Open http://localhost:3000 — every `fetch('/api/...')` call from the
browser goes to the frontend's own origin, which Express forwards to the
backend. The browser never talks to port 4000 directly, so the two
services are effectively "one site" and `SameSite=Strict` cookies survive.

## Auth flow

- `POST /api/auth/login`, `POST /api/auth/login-qr` set HttpOnly
  `nexacare_access_token` / `nexacare_refresh_token` cookies — no tokens in
  `localStorage`, no client-side JWT signing.
- `GET /api/auth/me` restores a session on page load.
- `frontend/services/apiClient.ts` retries once through
  `POST /api/auth/refresh` on a 401, then calls `logout()`/clears local
  state if that also fails.
- `POST /api/auth/logout` revokes the refresh token and clears cookies.

## Production deployment

Keep the same topology: put both services behind one origin (this
Express proxy, or an nginx/ALB doing the same job) rather than pointing
the browser at two different hosts. If you ever do split them onto
separate origins, switch `backend/lib/auth/cookies.ts` to
`SameSite=None; Secure` and add CORS with `credentials: true` on the
backend — `SameSite=Strict` will otherwise silently drop the cookies.

## PostgreSQL Row Level Security (RLS)

NexaCare relies on PostgreSQL Row Level Security to enforce data access at the database level.

**1. Dedicated Database User for Migrations**
Since RLS policies can block standard schema alterations if not careful, ensure that your migration execution script runs as the owner/superuser account (e.g., `postgres` in Supabase) which naturally bypasses RLS rules during deployment.

**2. Connection Pool Optimization for RLS Transactions**
Because the Prisma Client Extension forces all operations into an implicit `$transaction` to preserve the `SET LOCAL` variables on the connection, each web request will hold onto database connections slightly longer.

**Action:** Explicitly scale up your Supabase connection pool size (PgBouncer/Supavisor max connections) to account for the increased transactional overhead when deploying to production.
