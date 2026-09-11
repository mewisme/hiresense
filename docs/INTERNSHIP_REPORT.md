# HireSense Internship V1 — As-built report

Status date: **2026-09-12**

This document is the Internship V1 as-built summary for academic handoff. It describes what is implemented in source, not aspirational Phase II work.

## 1. Topic and product

**Topic:** Xây dựng hệ thống tuyển dụng và phân tích mức độ phù hợp giữa CV và mô tả công việc ứng dụng trí tuệ nhân tạo.

**Product:** HireSense — AI-assisted recruitment and CV–job matching platform.

**Principle:** Matching is decision support only. The system never auto-hires or auto-rejects.

## 2. Scope freeze

| In Internship V1                                            | Out of Internship V1                                           |
| ----------------------------------------------------------- | -------------------------------------------------------------- |
| Candidate + Recruiter actors                                | Admin Basic / moderation                                       |
| Auth/RBAC, profiles, companies, jobs, resumes, applications | Interviews, notifications, audit console                       |
| CV parsing (text/skills/experience/education)               | OCR for scanned image-only PDFs                                |
| Deterministic baseline matching `60/25/15`                  | Embeddings, semantic/hybrid matching, ranking, recommendations |
| Recruiter-triggered analysis                                | Auto-match on apply                                            |
| Desktop Candidate/Recruiter UI + Playwright checkpoint      | Mobile/tablet layout adaptation                                |

## 3. Architecture

```text
Browser (Next.js :3000)
  -> NestJS API (:4000)
       -> PostgreSQL 18
       -> file storage abstraction
       -> FastAPI AI (:8000)
```

Details: [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DATABASE.md`](./DATABASE.md).

## 4. Baseline matching

Pipeline: `matching-baseline-v1`

```text
FinalScore = Skill 60% + Experience 25% + Education 15%
```

- Skill: exact canonical ID matching with required/preferred weights
- Experience: quantified months vs job minimum
- Education: normalized degree vs optional job minimum
- Persistence: versioned match runs, components, skill evidence, job/resume snapshots
- Trigger: recruiter `POST .../matching/runs` only

Limitations: [`MATCHING_V1.md`](./MATCHING_V1.md).

## 5. Demo and reproducibility

Seed accounts and script: [`DEMO.md`](./DEMO.md).

Deterministic seed creates demo recruiter/candidate, company, published job, Demo CV parse rows, and an Applied application ready for analysis. Playwright reseeds before desktop QA.

## 6. Security and privacy

Authorization is enforced server-side for role, ownership, company membership, and CV access. Demo fixtures are synthetic. See [`SECURITY.md`](./SECURITY.md).

## 7. Quality evidence

| Gate                          | Result         |
| ----------------------------- | -------------- |
| typecheck / lint / build      | pass           |
| API Jest                      | 377 tests pass |
| AI tests                      | pass           |
| migrate + seed from clean DB  | pass           |
| Desktop Playwright checkpoint | 16/16 pass     |

Details: [`QUALITY.md`](./QUALITY.md), [`WEB_UI_DESKTOP_CHECKPOINT.md`](./WEB_UI_DESKTOP_CHECKPOINT.md), [`ACCEPTANCE_V1.md`](./ACCEPTANCE_V1.md).

## 8. Known limitations for Phase II

1. Experience month summing can over-count overlapping jobs.
2. No OCR for scanned PDFs.
3. Exact skill matching is not semantic similarity.
4. `detectedLanguage` is schema-ready but not reliably populated by the V1 parser path.
5. No admin, ranking, recommendation, embeddings, or async queue yet.
6. DisCloud storage can return 410 if upstream blobs disappear.

## 9. Release ceremony remaining

1. Optional clean-machine reproduction using README + this report.
2. Capture defense screenshots if required by the faculty template.
3. Tag `internship-v1.0` only on explicit request.
4. Start Phase II research only after the baseline is frozen.
