# Quality gate snapshot — Internship V1

Recorded through **2026-09-12**.

| Check                                                       | Result                      |
| ----------------------------------------------------------- | --------------------------- |
| `pnpm typecheck`                                            | pass                        |
| `pnpm lint`                                                 | pass                        |
| `pnpm build`                                                | pass (web + api + packages) |
| `pnpm --filter @hiresense/api test`                         | 48 suites / 377 tests pass  |
| `pnpm --filter @hiresense/ai test`                          | pass                        |
| Authz / ownership / MIME unit coverage                      | covered in API Jest suites  |
| Compose wipe → `migrate deploy` → `prisma:seed`             | pass                        |
| `pnpm --filter @hiresense/ui typecheck` / `lint`            | pass                        |
| `pnpm --filter @hiresense/web typecheck` / `lint` / `build` | pass                        |
| `pnpm --filter @hiresense/web qa:desktop`                   | pass (16/16)                |

Desktop Playwright checkpoint details: [`WEB_UI_DESKTOP_CHECKPOINT.md`](./WEB_UI_DESKTOP_CHECKPOINT.md).

Not part of the automated V1 gate yet:

- Broad mobile/tablet layout suite (intentionally deferred)
- Formal internship report PDF
- Tagged release `internship-v1.0` (manual, on request)

## Privacy note

Demo fixtures use synthetic names/emails (`*.demo.hiresense.local`). Do not commit real CVs or PII into `apps/api/test/fixtures/`.

See also [`SECURITY.md`](./SECURITY.md).
