# DETAILED PLAN — FINAL GRADUATION PROJECT

## Project title
**Building an AI-Assisted Recruitment System for Analyzing the Match Between CVs and Job Descriptions**

---

# 0. Role of this phase

This is **Phase 2 — the complete graduation project**, developed directly from the internship MVP.

The goal is not merely to add features. The final project must demonstrate clear advancement in three dimensions:

1. **Product** — a more realistic recruitment workflow.
2. **Engineering** — stronger architecture, async processing, security, observability, deployment, and testing.
3. **AI/Research** — an upgrade from keyword matching to semantic matching, ranking, recommendation, explainability, and quantitative evaluation.

The default roadmap is **16 weeks** and may be adjusted to match the university schedule.

---

# 1. Final product vision

Build a two-sided recruitment decision-support platform.

## Recruiter side
- Publish and manage jobs.
- Receive applications.
- Parse CVs automatically.
- Calculate CV–JD match.
- Rank applicants.
- Explain scores.
- Manage hiring pipeline.
- View analytics.

## Candidate side
- Manage profile and CVs.
- Discover jobs.
- View match insights.
- Receive job recommendations.
- Track applications.

## AI side
- CV parsing.
- JD parsing.
- Skill normalization.
- Structured feature extraction.
- Semantic similarity.
- Multi-factor scoring.
- Candidate ranking.
- Job recommendation.
- Explainability.
- Model/version tracking.
- Offline evaluation.
- Human-in-the-loop decision support.

---

# 2. Project objectives

## 2.1. Product objectives
Add to the stable V1 foundation:

- Candidate ranking by job.
- Semantic CV–JD matching.
- Job recommendation.
- Explainable AI results.
- Optional AI recruiter summaries.
- Interview pipeline.
- Notifications.
- Recruiter analytics.
- Advanced search/filtering.
- Audit/history.
- Matching feedback signals.

## 2.2. Research objectives
Answer:

1. What are the limitations of keyword matching?
2. Can embeddings recognize relevant equivalence when CV and JD wording differs?
3. How should rule-based and semantic features be combined?
4. Which scoring approach better reflects human judgments of fit?
5. How well does AI ranking correlate with human ranking?
6. Can explanations improve reviewability of AI results?
7. How should the system handle uncertainty, missing data, and bias risk?

## 2.3. Engineering objectives
Deliver:

- Production-quality frontend structure.
- Modular backend.
- Separate AI service.
- Background processing.
- Object storage.
- PostgreSQL with optional vector extension.
- Queue/cache where justified.
- Monitoring/logging.
- Automated tests.
- CI.
- Dockerized deployment.
- Appropriate data/model versioning.

---

# 3. Safety and ethical principles

1. AI must not autonomously hire or reject candidates.
2. A score represents **match to a specific JD**, not probability of being hired or overall human worth.
3. Do not use protected/sensitive attributes such as gender, ethnicity, religion, or marital status as scoring inputs.
4. Do not infer personal attributes from CV photos.
5. Every analysis should carry model/algorithm version information.
6. Recruiters remain final decision makers.
7. Users should understand that AI is being used as decision support.
8. Research data must be lawful, authorized, anonymized, or synthetic.
9. Limitations must be explicitly documented.

---

# 4. Final functional scope

## Candidate
- Full account lifecycle.
- Profile.
- Multiple CVs.
- CV parsing status and structured view.
- Job search and filters.
- Apply/withdraw according to policy.
- Application timeline.
- Match result.
- Notifications.
- Recommended jobs.
- Recommendation reasons and skill gaps.

## Recruiter
- Company management.
- Structured job creation.
- Required/preferred skills.
- Applicant search/filter.
- Candidate ranking.
- Candidate comparison optional.
- Shortlisting.
- Notes.
- Interview scheduling.
- Application pipeline.
- AI explanation.
- Score evidence.
- Analytics.

## Admin
- User moderation.
- Company/job moderation.
- AI job monitoring.
- Failed analysis review.
- Audit logs.
- Skill taxonomy management.
- Algorithm/model version visibility.

---

# 5. Final recruitment statuses

Recommended:
- `APPLIED`
- `SCREENING`
- `SHORTLISTED`
- `INTERVIEW`
- `OFFER`
- `HIRED`
- `REJECTED`
- `WITHDRAWN`

Every status change stores:
- actor;
- timestamp;
- previous status;
- new status;
- optional note.

History must not be overwritten.

---

# 6. Target architecture

```text
                         +----------------------+
                         |      Next.js Web     |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |      NestJS API      |
                         +----+--------+--------+
                              |        |
              +---------------+        +----------------+
              |                                         |
              v                                         v
      +---------------+                         +---------------+
      | PostgreSQL    |                         | Object Storage|
      | + pgvector*   |                         | CV / assets   |
      +-------+-------+                         +---------------+
              |
              +---------------------+
                                    |
                                    v
                         +----------------------+
                         |    Job Queue/Redis*  |
                         +----------+-----------+
                                    |
                                    v
                         +----------------------+
                         |   FastAPI AI Service |
                         +----------+-----------+
                                    |
                    +---------------+----------------+
                    |               |                |
                    v               v                v
              CV Parser       Embedding Model    LLM Adapter*
```

`*` = use only when it provides clear value.

---

# 7. Service boundaries

## Next.js
Owns:
- UI.
- forms.
- dashboard.
- visualization.
- client-side interaction.

It should not own critical business rules.

## NestJS
Owns:
- auth.
- RBAC.
- domain logic.
- jobs.
- applications.
- recruiter workflow.
- orchestration.
- persistence.
- audit.
- API security.

## FastAPI AI Service
Owns:
- text processing.
- structured extraction.
- embeddings.
- semantic matching.
- scoring.
- ranking features.
- explanation data.
- model versioning.
- evaluation helpers.

## PostgreSQL
Owns transactional state and optionally vectors through pgvector.

## Queue/Redis
Use for:
- CV parsing.
- embedding generation.
- batch ranking.
- recommendation refresh.
- retries.

Avoid unnecessary infrastructure such as Kafka if the workload does not justify it.

---

# 8. AI pipeline

```text
CV File
  |
Text Extraction
  |
Section Detection
  |
Structured Extraction
  +-- Skills
  +-- Experience
  +-- Education
  +-- Projects
  +-- Certifications
  |
Normalization
  |
Embedding / Feature Representation
  |
  +------------------- JD Parsing + JD Embedding
  |
Hybrid Matching Engine
  +-- Rule features
  +-- Skill fit
  +-- Experience fit
  +-- Education fit
  +-- Semantic fit
  |
Score + Explanation + Evidence
```

---

# 9. CV Parser V2

Recognize:
- Summary.
- Skills.
- Work Experience.
- Education.
- Projects.
- Certifications.
- Languages.

Suggested schema:

```json
{
  "skills": [
    {
      "name": "React",
      "normalized": "react",
      "confidence": 0.94,
      "evidence": "Built React applications..."
    }
  ],
  "experience": [
    {
      "company": "ABC",
      "title": "Full Stack Developer",
      "startDate": "2023-01",
      "endDate": "2025-01",
      "description": "..."
    }
  ],
  "education": [],
  "projects": [],
  "certifications": [],
  "estimatedExperienceYears": 2.4,
  "parserVersion": "cv-parser-v2"
}
```

Parser metadata should include:
- status;
- warnings;
- low-text flag;
- unsupported-layout indication when detectable.

---

# 10. Skill taxonomy and normalization

Maintain:
- canonical name;
- aliases;
- category;
- optional related skills.

Examples:
- JavaScript: JS, ECMAScript.
- PostgreSQL: Postgres, Postgre SQL.
- Node.js: NodeJS, Node in appropriate contexts.

Possible categories:
- programming language;
- frontend;
- backend;
- database;
- cloud;
- DevOps;
- testing;
- data/AI;
- soft skills.

Avoid aggressive normalization that creates false matches.

---

# 11. Semantic matching

Goal: detect relevance when wording differs.

Example:

JD:
> Experience building RESTful backend services.

CV:
> Developed APIs using NestJS and Express.

A keyword baseline can miss this. Embeddings can estimate semantic similarity.

Do not rely only on one full-document vector. Experiment with:
- CV summary.
- experience bullets.
- project bullets.
- skill context.
- JD responsibilities.
- JD requirements.

Use cosine similarity or another documented measure.

Persist:
- model/version;
- embedding version;
- similarity score;
- source section.

---

# 12. Hybrid Matching Engine V2

Starting formula:

`FinalScore = 0.35 Skill + 0.20 Experience + 0.10 Education + 0.30 Semantic + 0.05 Other`

Weights must be:
- documented;
- evaluated;
- versioned;
- adjusted only based on appropriate development/evaluation procedure.

Components:

## Skill
- required coverage.
- preferred coverage.
- evidence quality.

## Experience
- total experience.
- relevant experience.
- role similarity.
- optional recency.

## Education
Use only when job requirements justify it.

## Semantic
Compare:
- experience to responsibilities;
- projects to requirements;
- summary/context to role.

## Other
Possible:
- certifications;
- language requirements;
- domain experience.

Never include protected attributes.

---

# 13. Explainability

Every result should expose:

- Overall score.
- Component scores.
- Required skills matched.
- Preferred skills matched.
- Missing skills.
- Relevant experience evidence.
- Semantic evidence.
- Education match.
- Warnings.
- Algorithm/model version.

If an LLM generates prose:
- compute score before the LLM;
- ground the explanation in structured evidence;
- validate output;
- never let the LLM invent candidate skills.

---

# 14. Candidate ranking

Input:
- one job;
- N analyzed applications.

Output:
- rank;
- candidate;
- overall score;
- key strengths;
- key gaps;
- quality/confidence indicators if justified.

Rules:
- rank only successfully analyzed applications.
- deterministic tie handling.
- no protected attributes.
- expose breakdown rather than only rank.

Evaluation options:
- Spearman correlation.
- Kendall tau.
- NDCG@K.
- Precision@K for shortlist labels.

Choose metrics that fit the available labeled data.

---

# 15. Job recommendation

Candidate representation can combine:
- skills.
- experience.
- role/title.
- preferences.
- location.
- embeddings.

First apply hard filters:
- published status.
- location/workplace constraints.
- employment type.
- eligibility where applicable.

Then rank using:
- semantic fit.
- skill overlap.
- experience fit.

Recommendation output:
- job.
- match score.
- top reasons.
- missing skills.
- timestamp.
- algorithm version.

---

# 16. Feedback loop

Optional recruiter feedback:
- Relevant.
- Not relevant.
- Score too high.
- Score too low.
- Shortlist outcome.

Optional candidate feedback:
- Recommendation useful/not useful.

Use feedback as offline evaluation data first. Do not implement uncontrolled online learning.

---

# 17. Expanded data model

Core:
- `users`
- `roles`
- `candidate_profiles`
- `recruiter_profiles`
- `companies`
- `company_members`

Jobs:
- `jobs`
- `job_skills`
- `job_requirements`
- `job_embeddings`

Resume:
- `resumes`
- `resume_sections`
- `resume_skills`
- `resume_experiences`
- `resume_educations`
- `resume_projects`
- `resume_embeddings`

Applications:
- `applications`
- `application_status_history`
- `application_notes`
- `interviews`

AI:
- `ai_analyses`
- `ai_score_components`
- `ai_evidences`
- `ai_jobs`
- `model_versions`
- `analysis_feedback`

Recommendation:
- `job_recommendations`
- `recommendation_feedback`

System:
- `notifications`
- `audit_logs`
- optional `system_events`

---

# 18. Extended API surface

Candidate recommendation:
- `GET /candidate/recommendations`
- `POST /candidate/recommendations/:id/feedback`

Recruiter ranking:
- `GET /recruiter/jobs/:jobId/ranking`
- optional export.

Analysis:
- `GET /applications/:id/analysis/explanation`
- `POST /applications/:id/analysis/retry`

Interviews:
- create/update recruiter interview endpoints.
- candidate interview listing.

Notifications:
- list.
- mark read.

Analytics:
- overview.
- per-job analytics.

Feedback:
- recruiter AI feedback endpoint.

---

# 19. Async processing

AI job states:
- `PENDING`
- `PROCESSING`
- `SUCCEEDED`
- `FAILED`
- `RETRYING`

Guidelines:
- Queue IDs rather than large sensitive payloads where possible.
- Limited retries.
- Backoff.
- Failed-job visibility.
- UI “Processing” state.
- Application submission should not fail only because AI analysis is temporarily unavailable.

---

# 20. Security hardening

Authentication:
- access/refresh tokens;
- expiration;
- reset token expiration;
- optional rotation/revocation.

Authorization:
- RBAC.
- resource ownership.
- company membership.
- admin separation.

Files:
- private storage.
- signed expiring URLs.
- MIME validation.
- filename sanitization.
- size limits.

API:
- input validation.
- rate limiting.
- CORS.
- security headers.
- safe production errors.

Audit:
- security-relevant login events.
- job changes.
- application status changes.
- AI retries.
- admin actions.

---

# 21. Privacy and governance

Define:
- CV retention.
- account deletion.
- resume deletion.
- log retention.
- demo dataset policy.
- research dataset anonymization.
- export permissions.

Never place raw CV content in public logs or traces.

If an external LLM/API is used:
- document exactly what is sent;
- minimize payload;
- prefer redacted or structured data;
- state limitations in the thesis.

---

# 22. Observability

Logs:
- request ID.
- safe actor identifier when needed.
- service.
- latency.
- error type.
- AI job ID.
- model version.

Metrics:
- API error rate.
- parsing success rate.
- matching success rate.
- processing latency.
- failed jobs.
- queue depth when relevant.

Health checks:
- API.
- database.
- AI service.
- storage.
- queue.

---

# 23. Testing strategy

Unit:
- scoring.
- normalization.
- parser utilities.
- permissions.
- ranking aggregation.
- recommendation filters.

Integration:
- API + DB.
- object storage.
- queue.
- AI service contract.

E2E:
- candidate journey.
- recruiter journey.
- AI failure and retry.
- ranking.
- recommendation.
- interview flow.

Security:
- IDOR.
- role bypass.
- invalid JWT.
- signed URL expiry.
- malicious/invalid upload cases.

AI regression:
- golden CV/JD pairs.
- expected extracted skills.
- expected labels/ranking.
- model-version regression tests.

---

# 24. Research dataset

Suggested target:
- 50–100 JDs.
- 100–200 synthetic/anonymized CV profiles.
- 200–500 CV–JD pairs where feasible.
- Human labels such as poor/moderate/good fit or 1–5 rating.

If data is limited:
- use controlled synthetic examples;
- document generation method;
- avoid overclaiming generalization.

Annotation guideline:
- required skills.
- relevant experience.
- required education.
- domain relevance.
- exclude protected attributes.

Maintain a separate test/evaluation set even if no model is trained.

---

# 25. Experiment design

Compare at least:

## Baseline A
Rule/keyword V1.

## Model B
Semantic-only.

## Model C
Hybrid.

Evaluate:
- label agreement when labels exist.
- ranking correlation.
- top-K quality.
- qualitative error analysis.

Report:
- dataset size.
- metric.
- baseline score.
- semantic score.
- hybrid score.
- improvement.
- limitations.

---

# 26. Error analysis

Classify:
- missing aliases.
- skill ambiguity.
- experience date parsing.
- difficult CV layouts.
- vague JDs.
- soft skill ambiguity.
- domain terminology.
- semantic false positives.
- semantic false negatives.
- missing evidence.
- LLM hallucination if applicable.

For each class:
- example.
- root cause.
- mitigation.
- remaining limitation.

---

# 27. UX/UI requirements

Candidate:
- score card.
- score breakdown.
- recommendation cards.
- application timeline.
- processing/error states.
- clear AI disclaimer.

Recruiter:
- ranking table.
- filters.
- score distribution.
- candidate compare optional.
- evidence panel.
- pipeline.
- analytics.

Avoid presenting only “AI Score: 87%” with no context.

---

# 28. Dashboard metrics

Recruiter overview:
- active jobs.
- applications.
- new applications.
- shortlist count.
- interviews.
- offers.
- hires.

Per job:
- application count.
- average score.
- score distribution.
- top skills.
- missing-skill distribution.
- hiring funnel.

Do not infer employee performance from these metrics without evidence.

---

# 29. CI/CD

Minimum pipeline:
1. Install.
2. Lint.
3. Typecheck.
4. Unit test.
5. Build.
6. Integration test when feasible.
7. Build container image.
8. Deploy staging.

Simple branching:
- `main`.
- feature branches.
- release tags.

---

# 30. Environments

Maintain:
- local.
- test.
- staging/demo.
- production-like if available.

Separate:
- env variables.
- databases.
- storage.
- secrets.

Never commit secrets.

---

# 31. 16-week roadmap

## Week 1 — Audit V1 and freeze V2 scope
- Review MVP.
- List technical debt.
- Collect internship feedback.
- Define research questions.
- Prioritize required/optional features.
- Define success metrics.

Deliver:
- V1 audit.
- V2 scope.
- research questions.
- prioritized backlog.

## Week 2 — Refactor architecture and V2 data model
- Update ERD.
- Add AI tables.
- Add embedding schema.
- Add status history.
- Add audit.
- Define AI service boundary.
- Write API contracts.

Deliver:
- ERD V2.
- architecture V2.
- API V2.
- migration plan.

## Week 3 — AI service foundation
- FastAPI.
- health endpoint.
- schemas.
- version abstraction.
- parser module.
- embedding adapter.
- AI job model.
- NestJS integration.

Exit:
- API can call AI service with timeout/error handling.

## Week 4 — CV Parser V2
- section detection.
- structured experience.
- education.
- projects/certifications.
- normalization.
- warnings.
- test corpus.

Deliver:
- parser V2.
- parser evaluation.

## Week 5 — JD parser and skill taxonomy
- structured requirements.
- aliases.
- required/preferred.
- domain terms.
- structured recruiter UI.

Exit:
- jobs contain reliable structured features.

## Week 6 — Embeddings and semantic similarity
- select model/provider.
- implement adapter.
- cache/store vectors.
- cosine similarity.
- chunk strategy tests.
- latency measurement.

Deliver:
- semantic prototype.
- baseline-vs-semantic examples.

## Week 7 — Hybrid Matching Engine
- component scores.
- weights.
- evidence.
- versioning.
- fallback.
- persistence.

Exit:
- application analysis V2 is reproducible.

## Week 8 — Explainability
- evidence-driven strengths/gaps.
- snippets.
- optional LLM explanation.
- hallucination guard.
- score breakdown UI.
- disclaimer.

Deliver:
- explainable analysis.

## Week 9 — Candidate Ranking
- batch analysis.
- ranking endpoint.
- sort/filter.
- ties.
- recruiter ranking UI.

Exit:
- multi-applicant job produces stable ranking.

## Week 10 — Job Recommendation
- candidate representation.
- candidate-job retrieval.
- ranking.
- explanation.
- persistence.
- UI.
- optional feedback.

Deliver:
- end-to-end recommendation.

## Week 11 — Complete recruiter workflow
- shortlist.
- interview.
- status history.
- notes.
- notifications.
- candidate timeline.

Exit:
- APPLIED to HIRED/REJECTED flow is complete.

## Week 12 — Dashboard and observability
- recruiter dashboard.
- per-job analytics.
- AI metrics.
- logs.
- health checks.
- failed-job admin view.

Deliver:
- operational dashboard baseline.

## Week 13 — Dataset and experiments
- finalize dataset.
- annotate.
- run baseline.
- run semantic.
- run hybrid.
- compute metrics.
- export results.

Deliver:
- experiment tables.
- raw results.
- reproducible scripts.

## Week 14 — Error analysis and security hardening
- false positive analysis.
- false negative analysis.
- tune only with development data.
- security tests.
- privacy review.
- performance checks.
- critical fixes.

Deliver:
- error analysis.
- security checklist.
- stable release candidate.

## Week 15 — Deployment and thesis completion
- final staging deployment.
- CI.
- backup/restore basic check.
- complete thesis chapters.
- screenshots/diagrams.
- API and setup docs.

Deliver:
- release candidate.
- complete thesis draft.
- deployment guide.

## Week 16 — Final validation and defense preparation
- code freeze.
- tag `graduation-v2.0`.
- regression test.
- demo seed.
- slides.
- rehearsal.
- Q&A.
- offline fallback material.

Deliver:
- final source.
- thesis.
- slides.
- demo.
- experiment appendix.
- test report.
- deployable artifact.

---

# 32. Priority matrix

## Must-have
- Stable V1.
- CV Parser V2.
- Structured JD.
- Semantic matching.
- Hybrid scoring.
- Explainability.
- Candidate ranking.
- Job recommendation.
- Evaluation dataset.
- Baseline-vs-V2 experiment.
- Security/privacy.
- Tests.
- Deployment.
- Thesis.

## Should-have
- Async processing.
- Notifications.
- Interview flow.
- Dashboard.
- Audit logs.
- Feedback collection.

## Nice-to-have
- Candidate comparison.
- Email automation.
- Realtime notifications.
- Advanced search.
- multilingual support.
- OCR.
- richer recruiter collaboration.

Cut Nice-to-have first if schedule pressure appears.

---

# 33. AI acceptance criteria

The AI component is acceptable when:

1. CV parser success rate is measured and reported.
2. Skill normalization is tested.
3. Semantic matching correctly captures representative cases missed by keyword baseline.
4. Hybrid score exposes components.
5. Every result stores algorithm/model version.
6. Results include evidence.
7. Baseline comparison exists.
8. Quantitative evaluation exists.
9. Error analysis exists.
10. Limitations are documented.
11. Protected attributes are excluded.
12. Human decision authority is preserved.

---

# 34. System acceptance criteria

1. Candidate manages CV.
2. Recruiter publishes job.
3. Candidate applies.
4. AI processing is reliable or asynchronous.
5. Recruiter sees analysis.
6. Recruiter sees ranking.
7. Candidate sees recommendations.
8. Recruiter manages pipeline.
9. Status history is preserved.
10. Permissions are correct.
11. CV files remain private.
12. Logs avoid sensitive leakage.
13. Automated tests exist.
14. Deployment works.
15. Setup documentation exists.
16. Dataset/evaluation exists.
17. Experiment report exists.
18. Demo is stable.

---

# 35. Final defense demo script

## A — Create a job
Recruiter creates a Full Stack Developer JD with:
- React.
- Node.js.
- PostgreSQL.
- Docker.
- 2+ years.
- REST APIs.

## B — Upload a differently worded CV
Candidate CV contains:
- Next.js.
- NestJS/Express.
- “built backend APIs”.
- PostgreSQL.
- no exact “RESTful services” phrase.

## C — Compare baseline and V2
Show:
- keyword baseline.
- semantic score.
- hybrid score.

Explain a semantic case missed by the baseline.

## D — Explainability
Show:
- component scores.
- strengths.
- gaps.
- evidence.

## E — Ranking
Open a job with 5–10 applicants and show ordered ranking.

## F — Recommendation
Open candidate account and show 3–5 recommended jobs with reasons.

## G — Workflow
Shortlist -> interview -> status update -> candidate timeline/notification.

## H — Research results
Show:
- baseline metrics.
- semantic metrics.
- hybrid metrics.
- error analysis.
- limitations.

This proves the project is more than CRUD plus an AI API call.

---

# 36. Suggested thesis structure

## Chapter 1 — Introduction
Context, problem, objectives, scope, contributions.

## Chapter 2 — Background and related work
Recruitment systems, NLP, embeddings, similarity, ranking, recommendation, explainability.

## Chapter 3 — Requirements and system design
Actors, use cases, architecture, ERD, security/privacy, sequence flows.

## Chapter 4 — AI methodology
Baseline, parsing, taxonomy, embeddings, hybrid scoring, explainability, ranking, recommendation.

## Chapter 5 — Implementation
Frontend, backend, AI service, database, queue, storage, deployment.

## Chapter 6 — Experiments and evaluation
Dataset, annotation, metrics, setup, results, error analysis, limitations.

## Chapter 7 — Conclusion
Outcomes, contributions, limitations, future work.

---

# 37. Required diagrams

At minimum:
- System context.
- Use case.
- Component/architecture.
- ERD.
- Sequence: CV upload.
- Sequence: apply + analysis.
- Sequence: recruiter ranking.
- Sequence: job recommendation.
- Activity: recruitment pipeline.
- AI processing flow.
- Deployment diagram.

---

# 38. Major risks and mitigation

## Embeddings do not improve enough
- retain clear baseline;
- test chunk strategies;
- use hybrid approach;
- report honestly.

## Small dataset
- synthetic + manual annotation;
- avoid overclaiming;
- focus on comparative evaluation.

## LLM hallucination
- LLM never computes score;
- ground in evidence;
- validate output;
- deterministic fallback.

## AI latency
- async queue;
- cache embeddings;
- reuse vectors;
- batch operations.

## Vector infrastructure complexity
- prefer pgvector when PostgreSQL is already present;
- do not add unnecessary databases.

## Scope overload
- Must/Should/Nice priorities.
- scope freeze early.
- protect research features before cosmetic extras.

## Bias risk
- exclude protected attributes.
- human-in-the-loop.
- limitations.
- score distribution checks when dataset permits.

## Demo failure
- deterministic seed.
- precomputed examples.
- health checks.
- offline screenshots/video fallback.

---

# 39. Feature Definition of Done

A feature is Done only when:

- requirement is explicit;
- API implemented;
- authorization correct;
- validation exists;
- UI has loading/error/empty states;
- appropriate tests exist;
- operational errors are logged;
- documentation is updated;
- no critical regression;
- demo data exists when relevant.

---

# 40. Project Definition of Done

## Product
- End-to-end recruitment platform.
- Stable Candidate and Recruiter workflows.
- Ranking and recommendation work.

## AI
- V1 baseline remains available.
- Semantic/hybrid V2 works.
- Explainability includes evidence.
- Evaluation produces quantitative results.
- Error analysis is substantive.

## Engineering
- Correct security/RBAC.
- Private CV storage.
- Async/retry where needed.
- Logging/health checks.
- Tests.
- Deployment.

## Academic
- Research questions answered.
- Dataset and methodology documented.
- Metrics explained.
- No unsupported claims.
- Limitations explicit.
- Future work identified.

---

# 41. Final checklist

## Core product
- [ ] Candidate profile.
- [ ] Resume management.
- [ ] Job search.
- [ ] Application workflow.
- [ ] Recruiter job management.
- [ ] Applicant management.
- [ ] Interview/status pipeline.
- [ ] Notifications.
- [ ] Admin.

## AI
- [ ] CV Parser V2.
- [ ] JD Parser.
- [ ] Skill taxonomy.
- [ ] Embeddings.
- [ ] Semantic similarity.
- [ ] Hybrid matching.
- [ ] Explainability.
- [ ] Candidate ranking.
- [ ] Job recommendation.
- [ ] Versioning.
- [ ] AI job retry.

## Research
- [ ] Dataset.
- [ ] Annotation guide.
- [ ] Baseline experiment.
- [ ] Semantic experiment.
- [ ] Hybrid experiment.
- [ ] Metrics.
- [ ] Error analysis.
- [ ] Limitations.

## Engineering
- [ ] RBAC.
- [ ] Resource ownership.
- [ ] Private storage.
- [ ] Queue/background processing.
- [ ] Logging.
- [ ] Health checks.
- [ ] Tests.
- [ ] CI.
- [ ] Docker.
- [ ] Deployment.
- [ ] Configuration/backup docs.

## Documentation
- [ ] Requirements.
- [ ] Use cases.
- [ ] ERD.
- [ ] Architecture.
- [ ] Sequence diagrams.
- [ ] AI methodology.
- [ ] API docs.
- [ ] Test report.
- [ ] Experiment report.
- [ ] User guide.
- [ ] Deployment guide.
- [ ] Thesis.
- [ ] Slides.
- [ ] Demo script.

---

# 42. Expected final outcome

The final product should not be described merely as “a recruitment website with AI.”

A stronger final statement is:

> **A human-in-the-loop recruitment decision-support system in which CVs and job descriptions are transformed into structured representations, candidate–job fit is assessed through a hybrid method combining feature-based matching and semantic similarity, results are accompanied by explanations and evidence, applicants can be ranked for individual roles, and candidates can receive job recommendations while final hiring decisions remain with human recruiters.**

That is the intended distinction between the **internship MVP** and the **complete graduation project**.
