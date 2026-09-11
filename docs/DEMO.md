# Internship V1 demo

## Accounts

After `pnpm prisma:migrate` + `pnpm prisma:seed`:

| Role      | Email                            | Password       |
| --------- | -------------------------------- | -------------- |
| Recruiter | `recruiter@demo.hiresense.local` | `Password123!` |
| Candidate | `candidate@demo.hiresense.local` | `Password123!` |

Seeded company slug: `hiresense-demo`
Seeded published job slug: `fullstack-engineer`
Synthetic CV/JD: `apps/api/test/fixtures/demo/`

## Script

1. Sign in as recruiter → `/recruiter`.
2. Open company `HireSense Demo Co` (or create another).
3. Confirm published job **Full-stack Engineer**, or create/publish a draft with skills.
4. Sign out; sign in as candidate → `/candidate`.
5. Profile is already seeded; upload `cv-an-nguyen.pdf` under Resumes and run parse.
6. Open Jobs → apply with the uploaded resume version.
7. Sign in as recruiter → Jobs → Applicants → open application.
8. **Run analysis** (matching is recruiter-triggered; apply does not auto-match).
9. Review overall score, components (Skill 60% / Experience 25% / Education 15%), matched/missing skills, evidence.
10. Change recruitment stage; candidate can confirm status on Applications.

## Health

- API: `GET /api/health` → `{ "status": "ok" }`
- AI: `GET /health` → `{ "status": "ok" }`
