# Internship V1 demo

## Accounts

After `pnpm prisma:migrate` + `pnpm prisma:seed`:

| Role      | Email                            | Password       |
| --------- | -------------------------------- | -------------- |
| Recruiter | `recruiter@demo.hiresense.local` | `Password123!` |
| Candidate | `candidate@demo.hiresense.local` | `Password123!` |

Seeded company slug: `hiresense-demo`
Seeded published job slug: `fullstack-engineer`
Seeded resume: **Demo CV** (synthetic parse results + application in Applied stage, no match run yet)
Synthetic CV/JD source files: `apps/api/test/fixtures/demo/`

The seed is deterministic and idempotent. Playwright reseeds before the desktop checkpoint suite.

## Script (matches Playwright happy path)

Candidate:

1. Sign in as candidate → `/candidate`.
2. Browse Jobs → open **Full-stack Engineer**.
3. Confirm selected resume **Demo CV · v1**.
4. Open Resumes and Applications; open the seeded application.
5. Confirm stage **Applied** and empty matching state (**No analysis result yet**).

Recruiter:

1. Sign in as recruiter → `/recruiter`.
2. Companies → **HireSense Demo Co** → Jobs → manage **Full-stack Engineer** → applicants.
3. Review **An Nguyen**.
4. **Run analysis** (matching is recruiter-triggered; apply does not auto-match).
5. Review overall score, components (Skill 60% / Experience 25% / Education 15%), matched/missing skills, evidence, pipeline version.
6. Move stage **Applied → Screening**.

Candidate again:

1. Re-open the application.
2. Confirm **Screening** and the explainable matching result.

Optional manual path: upload `cv-an-nguyen.pdf` as an additional resume and apply to another published job if you want to exercise upload/parse from a clean application.

## Health

- API: `GET /api/health` → `{ "status": "ok" }`
- AI: `GET /health` → `{ "status": "ok" }`

## Storage gotcha (DisCloud)

Resume bytes live in a Discord channel. If that message/attachment is deleted or no longer readable, download/parse returns **410 Gone** and asks for a re-upload. Fix: upload the PDF again (do not reuse the broken resume row). Keep the DisCloud channel messages intact during demos.

## Desktop QA

With web on `:3000` and API on `:4000`:

```bash
pnpm --filter @hiresense/web qa:desktop
```
