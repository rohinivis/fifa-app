# FUT Club

A FIFA-themed Express + Postgres app, containerized for Kubernetes and built
for the routing/containerization homework.

## What it does
- `/` — landing page
- `/about` — about page
- `/signup` — create an account (picks a favorite club from a live dropdown of teams)
- `/login` — two-step log in (username, then password)
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
you log in with, not what's stored in the database (see `db/seed.sql`
and `routes/auth.js`).

### Admin access

The `/admin` screen is gated separately from regular accounts — being
logged in as `messi_fan` etc. does **not** get you in. There's a dedicated
admin login at `/admin/login` (also reachable via the "Admin Login" link in
the nav), which checks against accounts with `is_admin = true`:

| Username | Password  |
|----------|-----------|
| admin    | admin123  |

This account is seeded in `db/migrations/0005_add_admin_role.sql`, which
also adds the `is_admin` column. The regular nav only shows the **Admin**
link once you're actually logged in as an admin; everyone else sees
**Admin Login** instead.

Two full current-season rosters (Real Madrid, Inter Miami) are seeded via
`db/migrations/0002_add_full_rosters.sql`, on top of the smaller starter
roster in `db/seed.sql`.

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
   This applies `db/schema.sql` + `db/seed.sql` once against a fresh
   database, then runs anything in `db/migrations/` that hasn't been
   applied yet. Safe to re-run after adding a new migration file — it skips
   whatever's already been applied. See `db/migrations/README.md` for the
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
edits to `views/`, `public/`, `routes/`, `db/`, and `server.js` straight into
the running pod — `.js` changes trigger a `nodemon` restart inside the pod,
`.ejs`/CSS changes take effect on the next request with no restart at all.
See `k8s/README.md` for the full deployment story (Docker build, manifests,
HPA, Ingress) beyond the fast dev loop.

## Project structure
```
fifa-app/
├── server.js              # app entry point, middleware, view engine
├── routes/
│   ├── index.js            # home, about, logout, health check
│   ├── auth.js              # signup, two-step login, /account
│   ├── market.js            # /market — browse + add cards to your squad
│   ├── api.js                # standalone CRUD service: /api/players, /api/teams
│   ├── admin.js               # /admin — manage all teams/players directly
│   ├── squad.js                 # squad-scoped remove + trade (your own cards only)
│   └── session.js                # /api/session — tells the client who's logged in
├── db/
│   ├── schema.sql           # day-one schema (frozen after first run — see migrations/README.md)
│   ├── seed.sql              # day-one seed data
│   ├── migrations/            # every schema/data change since day one, additive only
│   ├── init.js                  # applies schema+seed once, then runs pending migrations
│   └── pool.js                   # pg connection pool
├── views/                    # EJS templates
│   ├── partials/               # head.ejs (Tailwind config), nav-loader.ejs
│   ├── home.ejs, about.ejs, market.ejs, account.ejs, admin.ejs
│   └── signup.ejs, login-username.ejs, login-password.ejs
├── public/
│   ├── css/style.css           # the handful of things Tailwind utilities can't express
│   └── js/
│       ├── nav.js                # independently-loaded nav component (asks /api/session)
│       └── api-client.js           # thin fetch() wrapper around /api/*
├── k8s/                       # Kubernetes manifests
└── skaffold.yaml               # fast local dev loop (see above)
```

## Design notes

- **Dynamic, independently-loaded nav** — every page just includes
  `views/partials/nav-loader.ejs` and `public/js/nav.js`, which builds its
  own markup after asking `/api/session` who's logged in. No view
  server-renders nav state.
- **Standalone CRUD service** — `routes/api.js` isn't tied to any one page;
  `public/js/api-client.js` can be called from anywhere. `routes/squad.js`
  is intentionally separate: it only ever touches the *current* user's own
  `user_players` rows (remove, trade), never the global `players`/`teams`
  tables, so a mistake there can't affect anyone else's squad.
- **Append-only schema changes** — `db/schema.sql` and `db/seed.sql` are
  frozen after first use. Every later change (new columns, full rosters,
  login tracking, the password-hashing migration) lives in
  `db/migrations/` as a new, numbered file that only ever adds or updates
  in place — never drops or recreates. See `db/migrations/README.md`.
- **UI library** — Tailwind (Play CDN, no build step) with a custom theme
  (`views/partials/head.ejs`) mapped to the app's own brand colors/fonts
  instead of Tailwind's defaults.
- **Passwords** — hashed with bcrypt on signup, verified with
  `bcrypt.compare` on login (`routes/auth.js`). Session store is still the
  in-memory default (`express-session`), which is fine for local dev but
  would need a real store (e.g. `connect-pg-simple`) in production.

## Notes / things to build on next
- No role/permission system yet (`/admin` is gated the same as everything
  else — just "logged in", not "is an admin"). See the note at the top of
  `routes/admin.js`.
- Trading (`POST /api/squad/:playerId/trade`) requires knowing the exact
  recipient username — no search/autocomplete yet.
- Could add a route to let a user "open a pack" and insert a new row into
  `user_players` to simulate pulling a new card.
