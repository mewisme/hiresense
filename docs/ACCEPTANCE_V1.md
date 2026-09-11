# Internship V1 acceptance checklist

Status date: **2026-09-12**

Actors in scope: **Candidate** + **Recruiter** only. Admin Basic is out of Internship V1 acceptance (Option B) and deferred to Phase II.

Statuses below are verified against current source, seed, Playwright checkpoint, and quality gates — not against historical plan prose alone.

## Product flow

| Criterion                                                       | Status | Evidence                                                   |
| --------------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| Candidate and Recruiter authenticate with correct role redirect | Pass   | Login UI + API auth; Playwright login helpers              |
| Recruiter can open/manage seeded company                        | Pass   | Seed `hiresense-demo` + recruiter companies UI             |
| Recruiter can create/publish job with structured skills         | Pass   | Job create/publish UI + backend job versions               |
| Candidate can browse job and apply through UI                   | Pass   | Jobs UI; seed already includes demo application for QA     |
| Candidate can upload CV PDF through UI                          | Pass   | Resumes UI; seed also provisions `Demo CV`                 |
| Resume parsing produces text + skills + experience + education  | Pass   | FastAPI extractors + parse-run persistence + API tests     |
| Official V1 formula consistent across code/seed/docs/UI         | Pass   | `matching-baseline-v1` weights `0.60 / 0.25 / 0.15`        |
| Match results persist and are readable                          | Pass   | Match run APIs + MatchResultPanel                          |
| Recruiter can view CV + match evidence                          | Pass   | Recruiter application detail + resume download             |
| Candidate can view stage + fit score                            | Pass   | Candidate application detail                               |
| Recruiter can make valid stage transitions                      | Pass   | Applied → Screening covered in Playwright                  |
| Candidate cannot access another candidate’s application         | Pass   | API ownership tests                                        |
| Recruiter cannot access outside company membership              | Pass   | Company membership / cross-company tests                   |
| Demo seed is reproducible/idempotent                            | Pass   | `pnpm prisma:seed`; Playwright `beforeAll` reseeds         |
| Clean checkout boots from documentation                         | Pass   | README + Compose + migrate + seed path                     |
| Required typecheck/lint/build/test gates pass                   | Pass   | See [`QUALITY.md`](./QUALITY.md)                           |
| Human-in-the-loop / AI disclaimer appears                       | Pass   | Matching UI warning + [`MATCHING_V1.md`](./MATCHING_V1.md) |

## Automated regression

| Gate                                         | Status                                               |
| -------------------------------------------- | ---------------------------------------------------- |
| API Jest suites                              | Pass (377 tests recorded in quality snapshot)        |
| AI Python tests                              | Pass                                                 |
| Desktop Playwright checkpoint (`qa:desktop`) | Pass (16/16)                                         |
| Desktop visual baselines                     | Pass (committed under `apps/web/e2e/...-snapshots/`) |

## Explicitly out of Internship V1

- Admin UI/module and moderation workflows
- Mobile/tablet layout adaptation
- Semantic embeddings / pgvector matching / ranking / recommendations
- Automatic matching on apply
- Formal internship report PDF and tagged Git release (`internship-v1.0`)

## Remaining before tag/release

1. Run this checklist once on a clean machine using README + [`DEMO.md`](./DEMO.md).
2. Capture defense screenshots if required by the academic template.
3. Tag only when explicitly requested (`internship-v1.0`).
