# Bonyan Frontend

Next.js web console for the Bonyan construction supervision platform.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- TanStack Query
- React Hook Form + Zod
- next-intl (English / Arabic + RTL)
- Vitest + Testing Library

## Scripts

```bash
npm install
cp .env.example .env.local   # set API_URL to the Django backend
npm run dev
npm run build
npm start
npm run lint
npm test
```

App runs at [http://localhost:3000](http://localhost:3000) and redirects to `/en/...` or `/ar/...`.

## Authentication

JWT auth is integrated with the Django API through a Next.js BFF so tokens never reach browser JavaScript:

| Browser call | Backend |
|---|---|
| `POST /api/auth/login` | `POST /api/v1/auth/login/` |
| `POST /api/auth/logout` | `POST /api/v1/auth/logout/` |
| `POST /api/auth/refresh` | `POST /api/v1/auth/refresh/` |
| `GET /api/auth/me` | `GET /api/v1/auth/me/` |
| ` /api/backend/*` | `/api/v1/*` (Bearer from httpOnly cookie) |

- Access + refresh tokens are stored in **httpOnly**, `SameSite=Lax` cookies (`secure` in production)
- `AuthProvider` holds the current user (not tokens)
- Middleware + client guards protect private routes
- Expired access tokens are refreshed automatically (BFF `/me` + `/api/backend` proxy + client `apiFetch`)
- Sidebar navigation is filtered by user roles

Set `API_URL` (server-only) to the Django origin, e.g. `http://localhost:8000`.

## Structure

```
src/
  app/api/auth/          # BFF auth routes
  app/api/backend/       # Authenticated Django proxy
  app/[locale]/
    (auth)/login/
    (app)/dashboard/
  components/
    layout/              # AppShell, Sidebar, TopNav
    auth/                # LoginForm, guards
    providers/           # Query + Auth
  lib/auth/              # Roles, cookies, Django client, path guards
messages/
  en.json
  ar.json
```
