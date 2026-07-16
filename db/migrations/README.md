# Migrations

This is where all schema/data changes go **after** the initial `db/schema.sql`
+ `db/seed.sql` have been applied once to a database. This is the answer to
the question Adam raised in review: *how do you change the database after
it's deployed without touching the original data?*

## The rule: additive only, never edit the past

- `db/schema.sql` and `db/seed.sql` are the "day one" state. Once a database
  exists (locally, in staging, in prod — anywhere with real data in it),
  **those two files are frozen.** Don't edit them again.
- Every future change — a new column, a new table, new seed rows, a data
  backfill — becomes a **new file in this folder**.
- Migrations run in filename order, so name them with a zero-padded number
  prefix: `0001_description.sql`, `0002_description.sql`, etc.
- Each migration only ever runs **once** against a given database. `db/init.js`
  tracks which ones have already run in a `schema_migrations` table and skips
  anything already applied — so re-running `npm run db:init` after deploying
  a new migration file only applies the *new* one, without touching existing
  rows.

## Writing a migration

Use `ALTER TABLE ... ADD COLUMN`, `CREATE TABLE`, or `INSERT INTO` — never
`DROP TABLE` or `DELETE` an existing table's data. If you need to remove a
column, prefer marking it unused before actually dropping it in a much later
migration, once you're sure nothing depends on it.

Example — adding a `market_value` column to players and backfilling a
default, in `0001_add_market_value.sql`:

```sql
ALTER TABLE players ADD COLUMN market_value INT DEFAULT 0;
UPDATE players SET market_value = rating * 1000000 WHERE market_value = 0;
```

## Running migrations

```bash
npm run db:init
```

This is safe to run repeatedly — on a fresh database it applies
`schema.sql` + `seed.sql` then any migrations; on an existing database it
skips schema/seed and only applies migrations that haven't run yet.
