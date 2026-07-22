# Next.js backend (Prisma)

The web app no longer needs a separate Django API for login and admin CRUD.

## Local setup

1. Copy `.env.example` to `.env.local` (already uses SQLite).
2. `npm install`
3. `npm run db:push`
4. `npm run dev`

Demo admin (seeded on first API call):

- Email: `admin@bonyan.local`
- Password: `Admin123!@#`

## Vercel

- Root Directory: `frontend`
- No `API_URL` required
- Set `AUTH_SECRET` to a long random string
- Optional: `DEMO_ADMIN_EMAIL` / `DEMO_ADMIN_PASSWORD`
- SQLite runs under `/tmp` on Vercel (ephemeral). Data resets when the instance recycles; admin is re-seeded automatically.

For durable production data later, move `BONYAN_DATABASE_URL` to a hosted database (and switch Prisma provider accordingly).

## Covered APIs

Auth, users, clients, contracts, projects, project stages, stage templates, and list stubs for site-visits / issues / reports.

Not yet ported (returns 501): detailed site-visit workflows, PDF reports, inspections, guidance, Celery jobs.
