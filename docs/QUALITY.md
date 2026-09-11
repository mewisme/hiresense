# Quality gate snapshot — Internship V1

Recorded 2026-09-11 on a clean Compose Postgres volume.

| Check                                           | Result                      |
| ----------------------------------------------- | --------------------------- |
| `pnpm typecheck`                                | pass                        |
| `pnpm lint`                                     | pass                        |
| `pnpm build`                                    | pass (web + api + packages) |
| `pnpm --filter @hiresense/api test`             | 48 suites / 377 tests pass  |
| `pnpm --filter @hiresense/ai test`              | 2 tests pass                |
| Authz / ownership / MIME unit coverage          | covered in API Jest suites  |
| Compose wipe → `migrate deploy` → `prisma:seed` | pass                        |

Not yet automated for V1:

- Browser E2E happy path / failure paths (manual demo via [`DEMO.md`](./DEMO.md))
- Formal internship report PDF

## Privacy note

Demo fixtures use synthetic names/emails (`*.demo.hiresense.local`). Do not commit real CVs or PII into `apps/api/test/fixtures/`.
