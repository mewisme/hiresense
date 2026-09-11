# API surface notes — Internship V1

Status date: **2026-09-12**

HireSense does not currently ship a generated OpenAPI portal for Internship V1. Use this index plus the Hoppscotch collections under `apps/api/test/hoppscotch/` as the working API reference.

Base URL (local): `http://localhost:4000`
Health: `GET /api/health` → `{ "status": "ok" }`

## Auth

| Method | Path                 | Notes                      |
| ------ | -------------------- | -------------------------- |
| POST   | `/api/auth/register` | Creates user + role        |
| POST   | `/api/auth/login`    | Issues access/refresh pair |
| POST   | `/api/auth/refresh`  | Rotates tokens             |
| POST   | `/api/auth/logout`   | Revokes refresh session    |
| GET    | `/api/auth/me`       | Current user + roles       |

## Candidate

| Area          | Key paths                                                             |
| ------------- | --------------------------------------------------------------------- |
| Profile       | `/api/candidates/me`                                                  |
| Resumes       | `/api/resumes`, version upload/download routes                        |
| Parse         | `POST /api/resumes/:resumeId/versions/:versionId/parse-runs`          |
| Jobs (public) | `GET /api/jobs`, `GET /api/jobs/:jobId`                               |
| Applications  | `/api/candidates/me/applications` (+ withdraw)                        |
| Matching read | `GET /api/candidates/me/applications/:applicationId/matching/current` |

## Recruiter

| Area                                | Key paths                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| Profile                             | `/api/recruiters/me`                                                            |
| Companies                           | `/api/companies`                                                                |
| Jobs                                | `/api/companies/:companyId/jobs` (+ publish/pause/close/reopen)                 |
| Applicants                          | `/api/companies/:companyId/jobs/:jobId/applications`                            |
| Application detail / resume / stage | `/api/companies/:companyId/applications/:applicationId` (+ `/resume`, `/stage`) |
| Matching                            | `POST/GET .../matching/runs`, `GET .../matching/current`                        |

## Matching trigger rule

Creating an application does **not** start analysis. Recruiters must call:

```text
POST /api/companies/:companyId/applications/:applicationId/matching/runs
```

## Collections

Import JSON files from `apps/api/test/hoppscotch/` for auth, profiles, companies, jobs, resumes, parsing, applications, and access-regression flows.
