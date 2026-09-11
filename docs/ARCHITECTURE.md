# HireSense architecture (as-built Internship V1)

Status date: **2026-09-12**

This document describes the **implemented** Internship V1 architecture. Do not treat empty directories or reserved schema fields as completed Phase II features.

## Runtime topology

```text
Browser (Next.js web :3000)
  -> NestJS API (:4000)
       -> PostgreSQL 18
       -> file storage abstraction (Discord chunk provider)
       -> FastAPI AI service (:8000)
            -> PDF text extraction
            -> skill / experience / education extraction
```

`apps/ai/app/embeddings/` and `apps/ai/app/matching/` are empty placeholders. Semantic matching is **not** part of V1.

## Monorepo layout

| Path                                          | Role                                             |
| --------------------------------------------- | ------------------------------------------------ |
| `apps/web`                                    | Next.js 16 App Router UI (Candidate + Recruiter) |
| `apps/api`                                    | NestJS 11 API + Prisma 7                         |
| `apps/ai`                                     | FastAPI parsing service                          |
| `packages/ui`                                 | Shared shadcn/Base UI primitives                 |
| `packages/types`                              | Shared TypeScript contracts                      |
| `packages/eslint-config`, `packages/tsconfig` | Shared tooling                                   |

## Domain modules (API)

Auth/RBAC, users, candidates, recruiters, companies/memberships, skills, files, resumes/versions, resume parsing, jobs/versions, applications/stages, matching.

There is **no** dedicated admin module in V1. Role code `ADMIN` exists in the auth type system for future use but is outside acceptance scope.

## Versioning and reproducibility

- Jobs: `Job` + immutable published `JobVersion`
- Resumes: independent `Resume` rows, each with `ResumeVersion` history
- Applications snapshot both `jobVersionId` and `resumeVersionId`
- Parse/match runs store `AiPipelineVersion` metadata
- Match components and per-skill evidence persist separately

## Matching V1

Deterministic baseline pipeline `matching-baseline-v1`:

```text
FinalScore = Skill 60% + Experience 25% + Education 15%
```

Trigger: recruiter `POST .../matching/runs` only. Apply does not auto-run matching.

Scores are review signals. Stage transitions remain human decisions.

Details: [`MATCHING_V1.md`](./MATCHING_V1.md).

## UI shell

Candidate and Recruiter share `AppShell` (sidebar + sticky header + breadcrumbs). Desktop presentation is frozen by [`WEB_UI_DESKTOP_CHECKPOINT.md`](./WEB_UI_DESKTOP_CHECKPOINT.md).

## Storage

Business modules reference `FileObject` only. The current provider stores chunked content via Discord (DisCloud). Storage choice is an implementation detail; authorization still gates every CV read/download.

## Related docs

- [`DATABASE.md`](./DATABASE.md) — schema evolution source of truth
- [`DEMO.md`](./DEMO.md) — seeded accounts and demo script
- [`SECURITY.md`](./SECURITY.md) — authz/privacy notes
- [`ACCEPTANCE_V1.md`](./ACCEPTANCE_V1.md) — release checklist
- [`apps/api/BACKEND_STRUCTURE.md`](../apps/api/BACKEND_STRUCTURE.md) — Nest layering rules
