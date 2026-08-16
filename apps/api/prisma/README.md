# HireSense Internship Database Migrations

This directory initializes the **Internship** database baseline defined by
`docs/DATABASE.md`.

## Requirements

- PostgreSQL 18+
- A PostgreSQL image/build that includes pgvector
- Prisma ORM 7+
- `DATABASE_URL` pointing to the HireSense database

Example:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hiresense
```

## Migration order

Prisma applies the migration directories in lexical order:

1. `20260816000100_foundation`
2. `20260816000200_identity`
3. `20260816000300_profiles_companies`
4. `20260816000400_skill_taxonomy`
5. `20260816000500_file_resume`
6. `20260816000600_jobs`
7. `20260816000700_applications`
8. `20260816000800_ai_baseline`
9. `20260816000900_seed_internship`

## First run

From `apps/api`:

```powershell
pnpm prisma migrate deploy
pnpm prisma generate
```

For an actively developed local database, after these checked-in baseline
migrations are applied, use the project's normal Prisma migration workflow for
future changes. For PostgreSQL-specific features, create migrations with
`--create-only`, edit the SQL, then apply them.

## Verify

```sql
SHOW timezone;
SELECT uuidv7();

SELECT extname, extversion
FROM pg_extension
WHERE extname IN (
  'vector',
  'pg_trgm',
  'unaccent',
  'citext',
  'pgcrypto',
  'btree_gist'
)
ORDER BY extname;
```

Expected:

- timezone: `UTC`
- UUID returned by `uuidv7()`
- all six extensions installed

## Important SQL-only behavior

Some database rules intentionally live in migration SQL rather than Prisma DSL:

- extensions
- UTC database default
- `set_updated_at()` triggers
- check constraints
- partial unique index for default resumes
- trigram indexes
- `NULLS NOT DISTINCT` stage uniqueness
- cross-table snapshot validation triggers
- database-generated `uuidv7()`

Do not remove these just because Prisma schema cannot express every detail.


The scalar fields `resumes.current_version_id`, `jobs.current_published_version_id`,
and `applications.current_match_run_id` intentionally do **not** declare normal
single-column Prisma relations. Their real database constraints are composite
foreign keys that guarantee the pointed row belongs to the same parent entity.
Those ownership constraints remain SQL-only by design.

## Internship database invariants

- Application snapshots an exact `job_version_id`.
- Application snapshots an exact `resume_version_id`.
- Job versions and resume versions are historical artifacts.
- AI parse/match output is run-based and versioned.
- `applications.current_match_run_id` is only a pointer to a selected run.
- AI failure must not delete or invalidate the application.
