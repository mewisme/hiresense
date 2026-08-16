# DETAILED PLAN — GRADUATION INTERNSHIP PHASE

## Project title
**Building an AI-Assisted Recruitment System for Analyzing the Match Between CVs and Job Descriptions**

---

## 0. Purpose of this document

This document defines the implementation plan for **Phase 1 — Graduation Internship**. The goal is to build a working end-to-end MVP with a limited but defensible AI component, while intentionally reserving advanced research and product capabilities for the final graduation project.

The default schedule is **12 weeks**. If the real academic timeline is shorter or longer, the plan can be compressed or expanded while preserving dependency order.

### Mandatory principles for Phase 1

1. Do not overbuild advanced AI.
2. Deliver one complete recruitment flow from job publishing to CV–JD match review.
3. Persist real application data in a database.
4. Implement basic Candidate / Recruiter / Admin access control.
5. Produce requirements, design, test, deployment, and demo documentation.
6. AI assists evaluation; it must not autonomously accept or reject applicants.
7. Optimize for stability, demonstrability, and clean extension into Phase 2.

---

# 1. Phase objectives

## 1.1. Product objective

Build a recruitment web application that allows:

- Candidates to register, maintain a profile, and upload a CV.
- Recruiters to create a company, publish jobs, and manage applicants.
- Candidates to search jobs and apply.
- The system to extract basic information from CVs.
- The system to structure key requirements from job descriptions.
- The system to calculate a basic CV–JD match score.
- Recruiters to see matched skills, missing skills, and score breakdown.
- Recruiters to update application status.
- Admins to perform basic moderation.

## 1.2. Academic objective

Demonstrate that:

- The recruitment process can be modeled as a software system.
- Free-form CVs and JDs can be transformed into structured features.
- A baseline matching method can be built from skills, experience, and education.
- The architecture is designed to evolve toward semantic matching, recommendation, ranking, and explainable AI.

## 1.3. Technical objective

Deliver:

- Frontend: Next.js + TypeScript.
- Backend API: NestJS + TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- AI/CV processing: Python + FastAPI or a lightweight backend module.
- Basic file storage.
- JWT authentication.
- Validation, logging, and error handling.
- Tests for critical flows.
- Minimal containerization when practical.

---

# 2. MVP scope

## 2.1. Mandatory capabilities

### Candidate
- Register.
- Login/logout.
- Basic password change/recovery.
- Update profile.
- Upload a PDF CV.
- Manage uploaded CVs.
- Browse jobs.
- Basic search/filtering.
- View job details.
- Apply using a selected CV.
- View applications.
- Track application status.
- View personal match results.

### Recruiter
- Register/login.
- Create/update company profile.
- Create job.
- Edit job.
- Publish/close job.
- View applicants by job.
- View candidate profile and CV.
- View matching result.
- Change application status.

### Admin
- Login.
- List users.
- Disable/enable accounts.
- View companies.
- View jobs.
- Hide/close problematic jobs.

### AI / Matching
- Extract text from PDF CVs.
- Normalize extracted text.
- Extract skills.
- Estimate years of experience.
- Extract basic education information.
- Structure important JD requirements.
- Match skills.
- Calculate a score.
- Return matched skills.
- Return missing skills.
- Persist analysis results.

## 2.2. Explicitly out of scope for Phase 1

Reserve the following for the final project:

- Embedding-based semantic similarity.
- Vector database / pgvector.
- Advanced candidate ranking.
- Personalized job recommendation.
- Detailed explainable AI.
- LLM-generated candidate summaries.
- Fairness/bias evaluation.
- Realtime notifications.
- Chat.
- Interview scheduling.
- Full email automation.
- Advanced analytics.
- Elasticsearch.
- Full microservice architecture.
- Kubernetes.
- Complex event-driven infrastructure.
- Advanced multilingual CV handling.
- OCR for scanned CVs unless absolutely required.

---

# 3. User roles and permissions

## 3.1. Candidate

Can:
- Manage own profile.
- Manage own CVs.
- View open jobs.
- Apply.
- View own applications.
- View own match results.

Cannot:
- View other candidates' CVs.
- Access recruiter-only data.
- Change application status.
- Edit jobs.

## 3.2. Recruiter

Can:
- Manage the assigned company.
- Manage jobs for that company.
- View applications submitted to owned company jobs.
- View CVs for applicants who applied.
- View AI analysis.
- Update application status.

Cannot:
- View private data of unrelated candidates.
- Manage another company's jobs.
- Directly overwrite AI scores.

## 3.3. Admin

Can:
- Manage users.
- Moderate companies and jobs.
- Review system-level operational information.

Manual AI score changes should not be allowed except for debug tooling with auditing.

---

# 4. Core business flows

## 4.1. Candidate flow

1. Candidate registers.
2. Candidate logs in.
3. Candidate updates profile.
4. Candidate uploads a CV.
5. System validates the file.
6. System stores file metadata.
7. System extracts text.
8. System parses basic structured information.
9. Candidate browses jobs.
10. Candidate opens a JD.
11. Candidate selects a CV and applies.
12. System creates an application.
13. System runs CV–JD analysis.
14. System stores matching results.
15. Candidate tracks status.

## 4.2. Recruiter flow

1. Recruiter registers/logs in.
2. Recruiter creates or joins a company.
3. Recruiter creates a job.
4. Recruiter enters title, description, responsibilities, requirements, preferred skills, experience, education, location, and optional salary.
5. Recruiter publishes the job.
6. Applications arrive.
7. Recruiter opens the applicant list.
8. Recruiter opens a CV.
9. Recruiter sees:
   - overall score;
   - matched skills;
   - missing skills;
   - experience match;
   - education match.
10. Recruiter changes application status.

## 4.3. Application statuses

Minimum:
- `APPLIED`
- `REVIEWING`
- `ACCEPTED`
- `REJECTED`

Optional refined MVP:
- `APPLIED`
- `SCREENING`
- `INTERVIEW`
- `ACCEPTED`
- `REJECTED`

Do not overcomplicate the workflow in Phase 1.

---

# 5. Detailed functional requirements

## FR-AUTH

### FR-AUTH-01 — Registration
- Role selection: Candidate or Recruiter.
- Unique email.
- Minimum password policy.
- Password hashing.
- Clear duplicate-email validation.

### FR-AUTH-02 — Login
- Validate credentials.
- Return access token.
- Optional refresh token.
- Return basic user and role context.

### FR-AUTH-03 — Authorization
- Every private API requires authentication.
- Recruiter APIs require recruiter role.
- Candidate resources enforce ownership.

### FR-AUTH-04 — Password change
- Require current password.
- Hash new password.
- Invalidate old refresh tokens when implemented.

---

## FR-CANDIDATE

### FR-CAN-01 — Candidate profile
Suggested fields:
- fullName
- phone
- location
- headline
- summary
- yearsOfExperience
- portfolioUrl
- GitHub URL
- LinkedIn URL

### FR-CAN-02 — CV upload
- PDF only for MVP.
- File size limit.
- MIME validation.
- Resume metadata record.
- Store path/object key.
- Trigger parser.

### FR-CAN-03 — CV management
- List own CVs.
- Mark one as default.
- Delete according to business policy.

### FR-CAN-04 — Job discovery
Minimum filters:
- keyword;
- location;
- employment type;
- experience level.

### FR-CAN-05 — Apply
- Candidate must have a CV.
- Prevent duplicate application when policy is one application per job.
- Associate selected resume.
- Create `APPLIED` status.
- Trigger matching.

### FR-CAN-06 — Application tracking
Show:
- Job title.
- Company.
- Applied date.
- Status.
- Match score if available.

---

## FR-RECRUITER

### FR-REC-01 — Company
- Create company.
- Update company.
- Optional logo.
- Website.
- Industry.
- Size.
- Description.

### FR-REC-02 — Job CRUD
Fields:
- title
- slug
- description
- responsibilities
- requirements
- preferredQualifications
- minExperience
- maxExperience
- educationRequirement
- employmentType
- workplaceType
- location
- optional salary range
- status: DRAFT/PUBLISHED/CLOSED

### FR-REC-03 — Applicant list
Support:
- list by job;
- sort by appliedAt;
- sort by matchScore;
- filter by status.

### FR-REC-04 — Applicant detail
Show:
- candidate profile;
- CV;
- parsed information;
- match score;
- matched skills;
- missing skills;
- application status.

### FR-REC-05 — Status update
- Only recruiters from the relevant company.
- Update timestamp.
- Persist history if status history is implemented.

---

# 6. AI MVP design

## 6.1. Objective

Implement a transparent baseline pipeline:

`CV PDF -> Text -> Structured Candidate Features -> Compare with JD -> Score`

## 6.2. CV pipeline

### Step 1 — File validation
- Valid PDF.
- File size limit.
- Detect corrupted file.

### Step 2 — Text extraction
Prefer direct PDF text extraction.
Avoid OCR unless required.

Persist:
- rawText
- extractionStatus
- extractionError

### Step 3 — Normalization
- normalize whitespace;
- normalize punctuation;
- lowercase for matching while retaining raw text;
- normalize aliases such as NodeJS -> Node.js, ReactJS -> React, Postgres -> PostgreSQL.

### Step 4 — Skill extraction
Use:
- controlled skill dictionary;
- keyword matching;
- alias matching;
- optional regex rules.

### Step 5 — Experience extraction
Estimate:
- explicit “X years of experience”, or
- rough duration from work history.

Persist as an estimate, not a verified fact.

### Step 6 — Education extraction
Extract basic:
- school;
- degree;
- major;
- graduation year when available.

---

# 7. JD processing

Normalize each job into:
- required skills;
- preferred skills;
- minimum experience;
- education requirement.

For the MVP, allow recruiters to manually select structured skills while also storing the full JD text. This makes matching more reliable and keeps the baseline explainable.

---

# 8. Baseline matching formula

Recommended baseline:

`FinalScore = SkillScore * 0.60 + ExperienceScore * 0.25 + EducationScore * 0.15`

## SkillScore
- required skills: weight 1.0;
- preferred skills: weight 0.5.

## ExperienceScore
Example:
- candidate >= required: 100;
- one year below: 75;
- two years below: 50;
- significantly below: 25 or 0.

## EducationScore
Example:
- meets requirement: 100;
- roughly equivalent: 70;
- unknown: 50;
- clearly does not meet: 0.

### Example result

```json
{
  "overallScore": 78.5,
  "skillScore": 83,
  "experienceScore": 75,
  "educationScore": 65,
  "matchedSkills": ["React", "Node.js", "PostgreSQL"],
  "missingSkills": ["Docker"],
  "version": "mvp-v1"
}
```

The scoring formula must be documented and versioned.

---

# 9. Non-functional requirements

## NFR-01 — Performance
- Normal CRUD API target: typically below 500 ms in a reasonable development environment.
- Matching can initially be synchronous if execution is only a few seconds.
- Lists must use pagination.

## NFR-02 — Security
- bcrypt/argon2 password hashing.
- JWT expiry.
- Input validation.
- ORM parameterization.
- Protected CV storage.
- Optional rate limiting on auth endpoints.
- Never log passwords or tokens.

## NFR-03 — Privacy
- Treat CVs as sensitive personal data.
- Only the owner, relevant recruiter, and authorized admin may access them.
- Avoid using real third-party CVs without permission.

## NFR-04 — Maintainability
- Clear module boundaries.
- DTO/schema validation.
- Versioned migrations.
- README.
- `.env.example`.

## NFR-05 — Extensibility
The design must allow later addition of:
- AI service;
- vector search;
- ranking;
- recommendation;
- notifications;
- analytics.

---

# 10. Architecture

```text
[Browser]
   |
[Next.js Frontend]
   |
[NestJS REST API]
   |-----------|
   |           |
[PostgreSQL] [File Storage]
   |
[Basic AI / Parsing Module]
```

Optional service split:

```text
[Next.js]
   |
[NestJS]
   |------ [PostgreSQL]
   |------ [Object Storage]
   |
   +----HTTP----> [FastAPI AI Service]
```

Recommendation for Phase 1: keep infrastructure simple and avoid Redis/Kafka/vector DB unless clearly necessary.

---

# 11. MVP data model

Core tables:

- `users`
- `candidate_profiles`
- `recruiter_profiles`
- `companies`
- `jobs`
- `skills`
- `job_skills`
- `resumes`
- `resume_skills`
- `applications`
- `ai_analyses`
- optional `application_status_history`

Each table should include created/updated timestamps where appropriate and foreign keys with explicit delete behavior.

---

# 12. Planned API surface

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `PATCH /auth/change-password`

## Candidate
- `GET /candidate/profile`
- `PATCH /candidate/profile`
- `GET /candidate/resumes`
- `POST /candidate/resumes`
- `DELETE /candidate/resumes/:id`
- `PATCH /candidate/resumes/:id/default`

## Jobs
- `GET /jobs`
- `GET /jobs/:id`
- `POST /recruiter/jobs`
- `PATCH /recruiter/jobs/:id`
- `POST /recruiter/jobs/:id/publish`
- `POST /recruiter/jobs/:id/close`

## Applications
- `POST /jobs/:jobId/applications`
- `GET /candidate/applications`
- `GET /candidate/applications/:id`
- `GET /recruiter/jobs/:jobId/applications`
- `GET /recruiter/applications/:id`
- `PATCH /recruiter/applications/:id/status`

## AI/internal
- `POST /internal/resumes/:id/parse`
- `POST /internal/applications/:id/match`
- `GET /applications/:id/analysis`

---

# 13. UI inventory

Public:
1. Landing.
2. Job listing.
3. Job detail.
4. Login.
5. Register.

Candidate:
6. Dashboard.
7. Profile.
8. CV management.
9. CV upload.
10. Applications.
11. Application detail with score.

Recruiter:
12. Dashboard.
13. Company profile.
14. Jobs.
15. Create job.
16. Edit job.
17. Job management detail.
18. Applicants.
19. Applicant detail with CV and AI result.

Admin:
20. Dashboard.
21. Users.
22. Jobs moderation.

---

# 14. Engineering standards

- TypeScript strict mode when feasible.
- ESLint.
- Prettier.
- Consistent naming.
- Business logic in services/use-cases, not controllers.
- DTO validation.
- Secrets only in environment variables.
- Commit migrations.
- Separate seed scripts.
- Documentation under `/docs`.

---

# 15. 12-week execution roadmap

## Week 1 — Requirements and scope freeze
Tasks:
- Problem statement.
- Actors.
- MVP list.
- Non-goals.
- Use cases.
- AI input/output.
- Stack.
- Backlog.

Deliverables:
- Requirement document.
- Use case diagram.
- Scope baseline.
- Backlog.

Exit criteria:
- Core demo flow is unambiguous.

## Week 2 — System and database design
Tasks:
- ERD.
- Schema.
- API contract.
- Wireframes.
- Architecture diagram.
- Permission model.
- Ownership rules.

Deliverables:
- ERD v1.
- API list.
- Wireframes.
- Architecture diagram.

## Week 3 — Project setup and Auth
Tasks:
- Next.js, NestJS, PostgreSQL, Prisma setup.
- Initial migrations.
- Admin seed.
- Register/login.
- Guards.
- Error handling.

Exit criteria:
- Candidate and Recruiter can authenticate and access correct areas.

## Week 4 — Profiles, Company, Job CRUD
Tasks:
- Candidate profile.
- Recruiter profile.
- Company CRUD.
- Job CRUD.
- Publish/close.
- Public job listing.

Exit criteria:
- Recruiter can publish a job and Candidate can view it.

## Week 5 — CV upload
Tasks:
- PDF upload.
- Validation.
- Storage abstraction.
- Metadata.
- List/delete/default.
- Secure access.

Exit criteria:
- Candidate manages own CV without exposing it publicly.

## Week 6 — Application workflow
Tasks:
- Apply.
- Duplicate prevention.
- Candidate application list.
- Recruiter applicant list.
- Applicant detail.
- Status update.

Exit criteria:
- Candidate-to-Recruiter application flow works end to end.

## Week 7 — CV extraction and parsing
Tasks:
- Text extraction.
- Parse status.
- Skill dictionary.
- Alias normalization.
- Experience estimation.
- Education extraction.

Exit criteria:
- A CV produces structured baseline features.

## Week 8 — JD structure and Matching Engine v1
Tasks:
- Required/preferred skills.
- Score formula.
- Matched/missing skills.
- Analysis persistence.
- Algorithm versioning.

Exit criteria:
- Every analyzable application can produce a repeatable score.

## Week 9 — AI result UI
Tasks:
- Candidate result view.
- Recruiter applicant view.
- Score breakdown.
- Error/empty/loading states.

Exit criteria:
- Result is understandable without reading logs or raw JSON.

## Week 10 — Testing and security
Tasks:
- Unit tests.
- Integration tests.
- Authorization tests.
- Seed data.
- Fix critical defects.

Deliverables:
- Test report.
- Bug list.
- Stable release candidate.

## Week 11 — Deployment and documentation
Tasks:
- Docker config.
- `.env.example`.
- Staging/demo deployment.
- README.
- API docs.
- DB docs.
- Setup guide.
- Demo guide.

Exit criteria:
- Project can run from a clean setup.

## Week 12 — Finalize internship submission
Tasks:
- Screenshots.
- Internship report.
- Slides.
- Demo data.
- Rehearsal.
- Q&A preparation.
- Tag `internship-v1.0`.

Deliverables:
- Source.
- Report.
- Slides.
- Demo script.
- Phase 2 backlog.

---

# 16. Testing strategy

## Unit tests
Prioritize:
- score formula;
- skill normalization;
- experience scoring;
- authorization helpers.

## Integration tests
- register/login;
- job creation;
- CV upload;
- apply;
- recruiter applicant list;
- status change;
- analysis trigger.

## End-to-end smoke test
1. Recruiter registers.
2. Creates company.
3. Publishes job.
4. Candidate registers.
5. Uploads CV.
6. Applies.
7. System calculates score.
8. Recruiter sees score.
9. Recruiter updates status.
10. Candidate sees new status.

## Demo dataset target
- 3 recruiters.
- 3 companies.
- 10–20 jobs.
- 20–30 candidates.
- 20+ sample CVs.
- 50+ applications when seed generation is practical.

---

# 17. Acceptance criteria

Phase 1 is accepted when:

1. Role-based registration/login works.
2. Recruiter can publish jobs.
3. Candidate can upload a PDF CV.
4. Candidate can apply.
5. Application persistence is correct.
6. CV text is extracted.
7. Skills are parsed.
8. CV–JD score is calculated.
9. Recruiter sees score, matched skills, and missing skills.
10. Recruiter changes application status.
11. Candidate sees the updated status.
12. Unauthorized users cannot access unrelated CVs/applications.
13. Migrations and seed exist.
14. Scoring has automated tests.
15. Setup README exists.
16. Architecture is documented.
17. Limitations of baseline matching are documented.
18. Phase 2 backlog is explicit.

---

# 18. Recommended demo script

1. Recruiter logs in.
2. Recruiter publishes a Full Stack Developer job requiring React, Node.js, PostgreSQL, with Docker preferred and two years of experience.
3. Candidate logs in.
4. Candidate uploads a CV.
5. System parses the CV.
6. Candidate applies.
7. System displays overall, skill, experience, and education scores.
8. System displays matched and missing skills.
9. Recruiter reviews the application.
10. Recruiter changes status.
11. Candidate sees the status update.
12. Presenter explains that Phase 1 is a transparent baseline to be improved by semantic matching in Phase 2.

---

# 19. Required deliverables

Source:
- Frontend.
- Backend.
- AI module/service.
- Migrations.
- Seed scripts.
- Docker configuration when used.

Documentation:
- Requirements.
- Use case diagram.
- Activity/sequence diagrams.
- ERD.
- Architecture.
- API docs.
- Test plan.
- Test report.
- Deployment guide.
- Short user guide.
- Internship report.

Demo:
- Dataset.
- Sample CVs.
- Sample jobs.
- Demo accounts.
- Demo script.

---

# 20. Key risks and mitigation

## R1 — CV parsing is unreliable
Mitigation:
- Support text-based PDF first.
- Do not promise OCR.
- Use controlled skill dictionary.
- Show parse status.
- Document unsupported cases.

## R2 — Scope explosion
Mitigation:
- Freeze MVP at the end of Week 2.
- Move new ideas to Phase 2 backlog.

## R3 — “Where is the AI?” challenge
Mitigation:
- Clearly explain extraction, normalization, feature engineering, and scoring.
- Position Phase 1 as a measurable AI/NLP baseline.

## R4 — Score lacks credibility
Mitigation:
- Show score breakdown.
- Document formula.
- Version the algorithm.
- Never interpret it as probability of being hired.

## R5 — CV privacy
Mitigation:
- Private file access.
- Authorization.
- No public bucket.
- Use authorized demo data.

---

# 21. Deliberate handoff to the final project

Do not fully implement these in Phase 1:

- Embeddings.
- Vector similarity.
- Candidate ranking.
- Job recommendation.
- LLM explanations.
- Large evaluation datasets.
- Ranking metrics.
- Fairness analysis.
- Advanced recruiter analytics.
- Recommendation feedback loops.
- Full async AI pipelines.
- Advanced observability.
- Production hardening.

The internship version should be a **clean, measurable baseline**.

---

# 22. Final completion checklist

## Product
- [ ] Auth.
- [ ] Candidate profile.
- [ ] Company.
- [ ] Job CRUD.
- [ ] Resume upload.
- [ ] Applications.
- [ ] Recruiter applicant workflow.
- [ ] Matching v1.
- [ ] Match result UI.
- [ ] Basic Admin.

## Engineering
- [ ] Migrations.
- [ ] Seed.
- [ ] Validation.
- [ ] Error handling.
- [ ] Logging.
- [ ] Unit tests.
- [ ] Integration tests.
- [ ] Authorization tests.
- [ ] `.env.example`.
- [ ] README.
- [ ] Deployment.

## Documentation
- [ ] Requirements.
- [ ] Use cases.
- [ ] ERD.
- [ ] Architecture.
- [ ] API.
- [ ] Test report.
- [ ] Demo script.
- [ ] Internship report.
- [ ] Phase 2 backlog.

---

# 23. Definition of success

The internship phase succeeds when a stable demonstration can show:

**Recruiter publishes a job -> Candidate uploads a CV -> Candidate applies -> system parses CV and JD -> system calculates a transparent baseline match score -> Recruiter reviews the result -> Recruiter updates status -> Candidate tracks the status.**

Advanced AI is not required yet. The priority is to establish a reliable, explainable baseline and a software foundation that can support the full graduation project.
