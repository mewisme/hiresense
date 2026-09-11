# Security and privacy notes — Internship V1

Status date: **2026-09-12**

## Authorization model

Server-side authorization is mandatory. Frontend route hiding is never sufficient.

| Boundary                | Rule                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| Unauthenticated callers | JWT required on protected routes                                                |
| Wrong role              | `@Auth('CANDIDATE' \| 'RECRUITER')` + `RolesGuard`                              |
| Candidate ownership     | Applications/resumes scoped to the authenticated candidate profile              |
| Company membership      | Recruiter company/job/application access requires active membership             |
| Submitted CV access     | Recruiter may open only application-linked resume versions for member companies |
| Admin endpoints         | No admin product API in V1 acceptance scope                                     |

Negative coverage lives in API Jest suites (ownership, cross-company, MIME/size, role guards).

## Authentication

- Access + refresh JWT pair
- Password hashing with argon2
- Refresh sessions persisted and revocable on logout

Do not commit real secrets. Local defaults in `.env.example` must be changed outside local demos.

## File / CV privacy

- CVs contain PII even when synthetic fixtures are used
- Raw CV URLs are not public; downloads go through authorized API streams
- MIME/size/empty validation rejects unsafe uploads before storage
- Demo fixtures use synthetic identities (`*.demo.hiresense.local`)
- Never commit real personal CVs into `apps/api/test/fixtures/`

DisCloud/Discord storage: if the upstream blob is deleted, download/parse returns **410 Gone**. Re-upload a new PDF rather than reusing a broken file row.

## Matching ethics

- Baseline matching does not use protected attributes
- Scores are decision-support only
- Recruiters retain human override through stage transitions
- Product UI warns that matching does not replace human judgment

## Known V1 limitations (security/privacy)

- No dedicated audit-log module yet
- No admin moderation console yet
- No formal retention/deletion automation beyond soft-delete/status fields already present
- Rate limiting for expensive AI endpoints is not a V1 hard requirement while local/demo load remains low

## Related evidence

- [`QUALITY.md`](./QUALITY.md)
- [`ACCEPTANCE_V1.md`](./ACCEPTANCE_V1.md)
- API Hoppscotch collections under `apps/api/test/hoppscotch/`
