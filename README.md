# FUT Club

A FIFA-themed Express + Postgres app, containerized for Kubernetes and built
for the routing/containerization homework.

## What it does
- `/` — landing page
- `/about` — about page
- `/login` — one page for both logging in and creating an account: type a
  username and it dynamically shows a password field (existing account) or a
  full signup form with a live club dropdown (new account), no page reload.
  `/signup` redirects here.
- `/account` — protected dashboard: view your owned player cards, add new
  players to the global pool, remove cards from your own squad, or trade a
  card to another user by username
- `/market` — browse every player not already in your squad and add them
- `/admin` — protected data-management screen for teams and players
  (separate from `/account`, which only touches *your* squad)
- `/logout` — clears the session
- `/api/*` — standalone CRUD service (see below), callable from any page
- `/healthz` — Kubernetes liveness/readiness probe

Three test accounts are seeded:

| Username      | Password    |
|---------------|-------------|
| messi_fan     | goat123     |
| ronaldo_fan   | siuuu2024   |
| mbappe_fan    | speedster   |

Passwords are hashed with bcrypt — the table above shows the plaintext
you log in with, not what's stored in the database (see `init/seed.sql`
and `website/routes/auth.js`).

### Admin access

The `/admin` screen is gated separately from regular accounts — being
logged in as `messi_fan` etc. does **not** get you in. There's a dedicated
admin login at `/admin/login` (also reachable via the "Admin Login" link in
the nav), which checks against accounts with `is_admin = true`:

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

This account is seeded in `migrations/1718380800-add-admin-role.sql`, which
also adds the `is_admin` column. The regular nav only shows the **Admin**
link once you're actually logged in as an admin; everyone else sees
**Admin Login** instead.

Two full current-season rosters (Real Madrid, Inter Miami) are seeded via
`migrations/1718121600-add-full-rosters.sql`, on top of the smaller starter
roster in `init/seed.sql`.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the Postgres database** (local Postgres must be running)
   ```bash
   createdb fut_club
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # edit .env if your Postgres user/password/port differ
   ```

4. **Load schema, seed data, and migrations**
   ```bash
   npm run db:init
   ```
   This applies `init/schema.sql` + `init/seed.sql` once against a fresh
   database, then runs anything in `migrations/` that hasn't been
   applied yet. Safe to re-run after adding a new migration file — it skips
   whatever's already been applied. See `migrations/README.md` for the
   append-only pattern this project follows.

5. **Run it**
   ```bash
   npm start        # or: npm run dev (nodemon, auto-restart)
   ```
   Visit http://localhost:3000

## Faster local iteration with Skaffold (Kubernetes)

Instead of a rebuild → push → re-apply loop for every small edit:

```bash
skaffold dev
```

This builds the dev image once, deploys everything under `k8s/`, then syncs
edits to `website/views/`, `website/components/`, `website/routes/`,
`website/functions/`, `website/public/`, `init/`, and `migrations/` straight
into the running pod — `.js` changes (including views, which are now plain
JS modules, not EJS) trigger a `nodemon` restart inside the pod; CSS changes
take effect on the next request with no restart at all.
See `k8s/README.md` for the full deployment story (Docker build, manifests,
HPA, Ingress) beyond the fast dev loop.

## Project structure
```
fifa-app/
├── init/
│   ├── server.js            # app entry point, middleware
│   ├── pool.js                # pg connection pool
│   ├── schema.sql              # day-one schema (frozen after first run — see migrations/README.md)
│   ├── seed.sql                  # day-one seed data
│   └── dbInit.js                   # applies schema+seed once, then runs pending migrations
├── migrations/                # every schema/data change since day one, additive only
│   ├── runMigrations.js         # the migration runner (reads *.sql from this same folder)
│   ├── README.md                  # the append-only pattern this project follows
│   └── *.sql                        # timestamp-prefixed migration files
├── website/
│   ├── routes/
│   │   ├── router.js            # the master router — every route in the app, mapped in one place
│   │   ├── index.js              # home, about, logout, health check
│   │   ├── auth.js                # /login (log in + sign up, one dynamic page), /account
│   │   ├── market.js               # /market — browse + add cards to your squad
│   │   ├── api.js                    # standalone CRUD service: /api/players, /api/teams
│   │   ├── admin.js                    # /admin — manage all teams/players directly
│   │   ├── squad.js                      # squad-scoped remove + trade (your own cards only)
│   │   └── session.js                      # /api/session — tells the client who's logged in
│   ├── functions/                # DB access, pulled out of the route files, one file per table
│   │   ├── accountsTableHelper.js  # users table: getAccountByUsername, createAccount, loginAccount...
│   │   ├── teamTableHelper.js       # teams table
│   │   ├── playerTableHelper.js      # players table
│   │   ├── squadTableHelper.js        # user_players table (ownership + trading)
│   │   └── cryptographicHelper.js      # password hashing/comparison, shared by the account helper
│   ├── views/                  # pages — plain JS modules exporting a function that returns an
│   │   │                         HTML string (template literals), no templating engine
│   │   ├── layout.js              # shared doctype/head/nav shell every page wraps its content in
│   │   ├── escapeHtml.js            # shared HTML-escaping helper for untrusted values
│   │   ├── partials/
│   │   │   ├── head.js                # <head> contents (Tailwind + DaisyUI CDN)
│   │   │   └── navLoader.js            # the #nav-root mount point + its two <script> tags
│   │   └── home.js, about.js, market.js, account.js, admin.js, adminLogin.js,
│   │       login.js               # log in + sign up in one page (three panels, see website/public/js/auth-flow.js)
│   ├── components/             # reusable, data-driven "asset classes":
│   │   ├── DataTable.js          # hand it { columns, rows } → renders a full table
│   │   └── FormCard.js            # hand it { fields } → renders a full form
│   └── public/
│       ├── css/style.css       # the handful of things Tailwind utilities can't express
│       └── js/
│           ├── nav.js            # independently-loaded nav component (asks /api/session)
│           ├── api-client.js       # thin fetch() wrapper around /api/*
│           └── auth-flow.js         # drives login.js's three panels
├── k8s/                       # Kubernetes manifests
└── skaffold.yaml               # fast local dev loop (see above)
```

## Design notes

- **Dynamic, independently-loaded nav** — every page just includes
  `website/views/partials/navLoader.js` and `website/public/js/nav.js`,
  which builds its own markup after asking `/api/session` who's logged in.
  No view server-renders nav state.
- **Standalone CRUD service** — `website/routes/api.js` isn't tied to any
  one page; `website/public/js/api-client.js` can be called from anywhere.
  `website/routes/squad.js` is intentionally separate: it only ever touches
  the *current* user's own `user_players` rows (remove, trade), never the
  global `players`/`teams` tables, so a mistake there can't affect anyone
  else's squad.
- **Append-only schema changes** — `init/schema.sql` and `init/seed.sql`
  are frozen after first use. Every later change (new columns, full
  rosters, login tracking, the password-hashing migration) lives in
  `migrations/` as a new, numbered file that only ever adds or updates in
  place — never drops or recreates. See `migrations/README.md`.
- **UI library** — [DaisyUI](https://daisyui.com) (CDN, no build step) on
  top of Tailwind, themed with its built-in `luxury` theme (black/gold —
  already close to the app's own palette) via `data-theme="luxury"` on
  every page's `<html>` tag.
- **Pages as JS modules, not a templating engine** — every page in
  `website/views/` is a plain `.js` file exporting a function that returns
  an HTML string built from template literals (e.g. `renderHome(data)`).
  There's no EJS (or any templating language) left in the app — routes
  call `res.send(renderX(data))` the same way they used to call
  `res.render('x', data)`. Untrusted values are escaped explicitly via
  `website/views/escapeHtml.js` wherever they're interpolated.
- **Reusable components, not hand-written markup** — `website/views/admin.js`
  used to hand-write a full `<table>`/`<thead>`/`<tr>` structure and a
  full `<form>` for every screen. It now describes the *data* (which
  columns, which fields) and hands that to `website/components/DataTable.js`
  / `FormCard.js`, which render themselves. Change how tables or forms
  look once, in one of those two files, and every table/form in the app
  picks it up — no more hunting down every page that copy-pasted the same
  `<tr>` structure. The nav (`website/public/js/nav.js`) follows the same
  pattern client-side: it builds DaisyUI `navbar`/`menu`/`dropdown` markup
  from a single `links` array, with the mobile view rendering as a real
  DaisyUI flyout dropdown instead of a second copy of the links.
- **Passwords** — hashed with bcrypt on signup, verified with
  `bcrypt.compare` on login (`website/routes/auth.js`). Session store is
  still the in-memory default (`express-session`), which is fine for local
  dev but would need a real store (e.g. `connect-pg-simple`) in production.

## Notes / things to build on next
- No role/permission system yet (`/admin` is gated the same as everything
  else — just "logged in", not "is an admin"). See the note at the top of
  `website/routes/admin.js`.
- Trading (`POST /api/squad/:playerId/trade`) requires knowing the exact
  recipient username — no search/autocomplete yet.
- Could add a route to let a user "open a pack" and insert a new row into
  `user_players` to simulate pulling a new card.
