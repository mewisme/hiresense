# KẾ HOẠCH CHI TIẾT — ĐỒ ÁN TỐT NGHIỆP HOÀN CHỈNH

## Đề tài
**Xây dựng hệ thống tuyển dụng và phân tích mức độ phù hợp giữa CV và mô tả công việc ứng dụng trí tuệ nhân tạo**

---

# 0. Vai trò của giai đoạn này

Đây là **giai đoạn 2 — Đồ án tốt nghiệp hoàn chỉnh**, phát triển trực tiếp từ MVP đã hoàn thành ở giai đoạn Thực tập tốt nghiệp.

Mục tiêu không chỉ là “thêm nhiều chức năng”, mà phải chứng minh được sự tiến bộ rõ ràng ở cả ba lớp:

1. **Sản phẩm** — hệ thống tuyển dụng đầy đủ hơn, có workflow thực tế.
2. **Kỹ thuật** — kiến trúc ổn định, xử lý bất đồng bộ, logging, bảo mật, deployment tốt hơn.
3. **Nghiên cứu/AI** — nâng baseline keyword matching lên semantic matching, ranking, recommendation, explainability và đánh giá định lượng.

Kế hoạch mặc định theo **16 tuần**. Có thể co giãn theo lịch trường nhưng nên giữ nguyên thứ tự phụ thuộc.

---

# 1. Tầm nhìn sản phẩm cuối cùng

Xây dựng một nền tảng tuyển dụng hỗ trợ hai chiều:

## Recruiter-side
- Đăng và quản lý tin tuyển dụng.
- Tiếp nhận CV.
- Phân tích CV tự động.
- Tính mức độ phù hợp CV–JD.
- Xếp hạng ứng viên.
- Giải thích điểm số.
- Theo dõi pipeline tuyển dụng.
- Dashboard thống kê.

## Candidate-side
- Quản lý hồ sơ và CV.
- Tìm kiếm công việc.
- Xem mức độ phù hợp.
- Nhận gợi ý công việc.
- Theo dõi tiến trình ứng tuyển.
- Nhận feedback phù hợp ở mức an toàn, không tạo ấn tượng AI quyết định tuyển dụng.

## AI-side
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
- Human-in-the-loop.

---

# 2. Mục tiêu cụ thể

## 2.1. Mục tiêu sản phẩm

Hoàn thiện các chức năng của V1 và bổ sung:

- Candidate ranking theo từng job.
- Semantic CV–JD matching.
- Job recommendation cho candidate.
- AI explanation.
- AI-generated recruiter summary ở mức hỗ trợ.
- Interview pipeline.
- Notification.
- Recruiter dashboard.
- Search/filter nâng cao.
- Audit/history.
- Feedback loop cho matching.

## 2.2. Mục tiêu nghiên cứu

Trả lời được các câu hỏi:

1. Keyword matching có hạn chế gì?
2. Semantic embeddings có cải thiện khả năng nhận ra kỹ năng/kinh nghiệm tương đương không?
3. Kết hợp rule-based features và semantic similarity như thế nào?
4. Score nào phản ánh mức độ phù hợp hợp lý hơn?
5. Ranking ứng viên có tương quan với đánh giá của con người không?
6. Explainability có thể giúp recruiter hiểu và kiểm tra kết quả AI như thế nào?
7. Hệ thống xử lý uncertainty, missing data và bias risk ra sao?

## 2.3. Mục tiêu kỹ thuật

- Frontend hoàn thiện.
- Backend modular.
- AI service riêng.
- Async/background processing.
- Object storage.
- PostgreSQL + vector extension nếu dùng.
- Caching/queue khi cần.
- Monitoring/logging.
- Automated tests.
- CI pipeline.
- Dockerized deployment.
- Data/model versioning ở mức phù hợp.

---

# 3. Nguyên tắc an toàn và đạo đức

1. AI không tự động tuyển hoặc loại ứng viên.
2. Score là **mức độ phù hợp với JD**, không phải “khả năng làm việc tốt” hay “xác suất được tuyển”.
3. Không dùng thuộc tính nhạy cảm như giới tính, dân tộc, tôn giáo, tình trạng hôn nhân để tính score.
4. Không dùng ảnh CV để suy đoán thuộc tính cá nhân.
5. Kết quả AI phải có explanation và version.
6. Recruiter luôn là người ra quyết định.
7. Candidate/recruiter phải được thông báo rằng hệ thống có AI hỗ trợ.
8. Dữ liệu dùng để nghiên cứu phải có nguồn hợp lệ hoặc được tạo/ẩn danh.
9. Phải ghi rõ limitations trong báo cáo.

---

# 4. Phạm vi chức năng hoàn chỉnh

## 4.1. Candidate

### Account & Profile
- Register/login/logout.
- Forgot/reset password.
- Optional email verification.
- Candidate profile.
- Portfolio/GitHub/LinkedIn.
- Skill profile.
- Experience history.
- Education history.

### Resume
- Multiple CVs.
- PDF upload.
- Parse status.
- Parsed data view.
- Candidate correction mechanism optional but recommended.
- Default CV.
- Resume version history optional.

### Job discovery
- Keyword search.
- Skill-based filtering.
- Location.
- Employment type.
- Workplace type.
- Experience level.
- Salary range if available.
- Sort newest / relevance / match score.

### Application
- Apply.
- Withdraw according to policy.
- Track pipeline.
- View timeline/history.
- View match result.
- Receive notifications.

### Recommendation
- Recommended jobs.
- Match percentage.
- Reasons for recommendation.
- Missing skills.
- Optional save/bookmark.

---

## 4.2. Recruiter

### Company
- Company profile.
- Recruiter membership.
- Basic member roles optional.
- Company job history.

### Job
- Draft.
- Publish.
- Pause.
- Close.
- Duplicate job.
- Structured requirements.
- Required/preferred skills.
- Experience and education requirements.
- Matching configuration optional.

### Applicant management
- Applicant list.
- Search/filter.
- Sort by score.
- Candidate ranking.
- Compare candidates.
- Application pipeline.
- Notes.
- Status history.
- Shortlist.
- Interview scheduling.

### AI assistance
- CV summary.
- Score breakdown.
- Matched skills.
- Missing skills.
- Semantic evidence.
- Experience evidence.
- Education evidence.
- AI explanation.
- Confidence/quality indicator when appropriate.

### Analytics
- Applicants per job.
- Application status funnel.
- Average match score.
- Top skills.
- Time-to-stage.
- Job performance summary.

---

## 4.3. Admin

- User management.
- Company moderation.
- Job moderation.
- AI processing health.
- Failed analysis list.
- Audit logs.
- Skill taxonomy management.
- System config at safe level.
- Model/algorithm version visibility.
- Dataset management for internal evaluation if appropriate.

---

# 5. Recruitment workflow hoàn chỉnh

Đề xuất trạng thái:

- `APPLIED`
- `SCREENING`
- `SHORTLISTED`
- `INTERVIEW`
- `OFFER`
- `HIRED`
- `REJECTED`
- `WITHDRAWN`

Mỗi thay đổi:
- lưu người thay đổi;
- timestamp;
- note optional;
- previous status;
- new status.

Không xóa lịch sử trạng thái.

---

# 6. Kiến trúc mục tiêu

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

`*` = chỉ dùng nếu cần và có giá trị rõ ràng.

---

# 7. Phân ranh service

## 7.1. Next.js
Chịu trách nhiệm:
- UI.
- form.
- session presentation.
- dashboard.
- visualization.
- không chứa business rule quan trọng.

## 7.2. NestJS
Chịu trách nhiệm:
- auth.
- RBAC.
- domain business logic.
- jobs.
- applications.
- recruiter workflow.
- file metadata.
- orchestration.
- persistence.
- audit.
- API security.

## 7.3. FastAPI AI Service
Chịu trách nhiệm:
- CV text processing.
- structured extraction.
- embedding.
- semantic matching.
- scoring.
- ranking features.
- explanation inputs/outputs.
- model version.
- evaluation helpers.

## 7.4. PostgreSQL
Chịu trách nhiệm:
- transactional state.
- user/job/application data.
- AI result metadata.
- vector storage nếu dùng pgvector.

## 7.5. Queue/Redis
Dùng cho:
- CV parsing background.
- embedding generation.
- batch ranking.
- recommendation refresh.
- retry AI jobs.

Nếu tải nhỏ, có thể dùng queue đơn giản; không thêm Kafka chỉ để “trông phức tạp”.

---

# 8. Thiết kế AI tổng thể

## 8.1. Pipeline

```text
CV File
  |
  v
Text Extraction
  |
  v
Section Detection
  |
  v
Structured Extraction
  |
  +---- Skills
  +---- Experience
  +---- Education
  +---- Projects
  +---- Certifications
  |
  v
Normalization
  |
  v
Embedding / Feature Vector
  |
  +---------------------+
                        |
JD ---------------------+
  |
JD Parsing
  |
Structured Requirements
  |
Embedding
  |
  v
Hybrid Matching Engine
  |
  +---- Rule-based features
  +---- Skill match
  +---- Experience match
  +---- Education match
  +---- Semantic similarity
  |
  v
Score + Explanation + Evidence
```

---

# 9. CV parsing V2

## 9.1. Section detection
Cố gắng nhận biết:
- Summary.
- Skills.
- Work Experience.
- Education.
- Projects.
- Certifications.
- Languages.

## 9.2. Structured schema đề xuất

```json
{
  "candidate": {
    "name": "string|null",
    "email": "string|null",
    "phone": "string|null",
    "location": "string|null"
  },
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

## 9.3. Confidence
Không nhất thiết mọi field đều có confidence nếu khó calibrate, nhưng parser nên có:
- parse status;
- warnings;
- unsupported layout flag;
- low-text flag.

---

# 10. Skill taxonomy và normalization

Tạo skill taxonomy có:

- canonical name;
- aliases;
- category;
- related skills optional.

Ví dụ:

```text
Canonical: JavaScript
Aliases: JS, ECMAScript

Canonical: PostgreSQL
Aliases: Postgres, Postgre SQL

Canonical: Node.js
Aliases: NodeJS, Node
```

Không nên normalize quá mạnh gây sai nghĩa.

Có thể chia category:
- programming language;
- frontend;
- backend;
- database;
- cloud;
- DevOps;
- testing;
- data/AI;
- soft skill.

---

# 11. Semantic Matching

## 11.1. Mục tiêu

Nhận ra similarity dù CV và JD không dùng cùng từ.

Ví dụ:

JD:
> Experience building RESTful backend services.

CV:
> Developed APIs using NestJS and Express.

Keyword baseline có thể bỏ sót.
Embedding có thể nhận ra semantic similarity.

## 11.2. Unit of embedding

Không nên chỉ embedding toàn bộ CV thành một vector.

Đề xuất thử nghiệm:
- CV summary vector.
- experience bullets.
- project bullets.
- skill context.
- JD responsibilities.
- JD requirements.

Sau đó aggregate similarity.

## 11.3. Similarity
Có thể dùng cosine similarity.

Lưu:
- model name/version;
- embedding version;
- similarity score;
- source section.

---

# 12. Hybrid Matching Engine V2

Đề xuất bắt đầu:

`FinalScore = 0.35 Skill + 0.20 Experience + 0.10 Education + 0.30 Semantic + 0.05 Other`

Trọng số **không phải cố định vĩnh viễn**. Phải được:
- document;
- thử nghiệm;
- đánh giá;
- version.

## 12.1. Skill score
Tính riêng:
- required skill coverage;
- preferred skill coverage;
- skill evidence quality.

## 12.2. Experience score
Xem:
- total experience;
- relevant experience;
- role similarity;
- recency optional.

## 12.3. Education score
Chỉ dùng nếu JD thật sự yêu cầu.

Không nên cho education weight cao mặc định với mọi job.

## 12.4. Semantic score
Từ:
- CV experience vs JD responsibilities;
- projects vs JD requirements;
- summary vs role context.

## 12.5. Other
Có thể:
- certifications;
- language requirements;
- domain experience.

Không dùng protected attributes.

---

# 13. Explainable AI

Mỗi result nên gồm:

- Overall score.
- Score breakdown.
- Matched required skills.
- Matched preferred skills.
- Missing skills.
- Relevant experience evidence.
- Semantic evidence snippets.
- Education match.
- Warnings.
- Algorithm/model version.

Ví dụ:

```json
{
  "overallScore": 84,
  "breakdown": {
    "skills": 88,
    "experience": 80,
    "education": 100,
    "semantic": 79
  },
  "strengths": [
    "Strong overlap in React and Node.js",
    "2.5 years of relevant full-stack experience"
  ],
  "gaps": [
    "Docker is required but not clearly evidenced"
  ],
  "evidence": [
    {
      "type": "experience",
      "cvText": "Developed REST APIs with NestJS...",
      "jdText": "Build scalable backend services..."
    }
  ],
  "version": "hybrid-v2.1"
}
```

Nếu dùng LLM để viết explanation:
- score phải được tính trước bằng deterministic/hybrid engine;
- LLM chỉ diễn giải;
- output phải dựa trên structured evidence;
- không để LLM tự bịa kỹ năng.

---

# 14. Candidate Ranking

## 14.1. Input
Một job + N applications.

## 14.2. Output
Danh sách:
- rank;
- candidate;
- overall score;
- confidence/quality;
- top strengths;
- key gaps.

## 14.3. Ranking rules
- Chỉ xếp hạng application có analysis thành công.
- Tie handling rõ ràng.
- Không dùng thuộc tính nhạy cảm.
- Recruiter có thể sort theo score nhưng phải thấy score breakdown.

## 14.4. Evaluation
So sánh ranking của hệ thống với ranking của người đánh giá.

Metric có thể dùng:
- Spearman rank correlation.
- Kendall tau.
- NDCG@K.
- Precision@K cho shortlist label.

Không cần dùng tất cả; chọn metric phù hợp với dataset.

---

# 15. Job Recommendation

## 15.1. Mục tiêu
Từ profile/CV candidate, gợi ý job đang mở.

## 15.2. Candidate representation
Có thể dùng:
- skills;
- experience;
- title/role;
- location;
- preference;
- embedding.

## 15.3. Job candidate set
Filter hard constraints trước:
- job status.
- location/workplace nếu cần.
- employment type.
- eligibility nếu có.

Sau đó rank bằng:
- semantic score;
- skill overlap;
- experience fit.

## 15.4. Output
- Job.
- Match score.
- Top reasons.
- Missing skills.
- Recommended timestamp.
- recommendation algorithm version.

---

# 16. Feedback loop

Cho recruiter optional feedback:

- “Relevant”.
- “Not relevant”.
- “Score too high”.
- “Score too low”.
- shortlist outcome.

Cho candidate:
- job recommendation useful/not useful optional.

Mục đích:
- thu thập evaluation signal;
- không tự động online-learning nếu chưa kiểm soát.

---

# 17. Database mở rộng

Ngoài bảng V1, thêm/hoàn thiện:

## Core
- `users`
- `roles`
- `candidate_profiles`
- `recruiter_profiles`
- `companies`
- `company_members`

## Jobs
- `jobs`
- `job_skills`
- `job_requirements`
- `job_embeddings`

## Candidate/CV
- `resumes`
- `resume_sections`
- `resume_skills`
- `resume_experiences`
- `resume_educations`
- `resume_projects`
- `resume_embeddings`

## Applications
- `applications`
- `application_status_history`
- `application_notes`
- `interviews`

## AI
- `ai_analyses`
- `ai_score_components`
- `ai_evidences`
- `ai_jobs`
- `model_versions`
- `analysis_feedback`

## Recommendation
- `job_recommendations`
- `recommendation_feedback`

## System
- `notifications`
- `audit_logs`
- `system_events` optional.

---

# 18. API mở rộng

## Candidate recommendation
- `GET /candidate/recommendations`
- `POST /candidate/recommendations/:id/feedback`

## Recruiter ranking
- `GET /recruiter/jobs/:jobId/ranking`
- `GET /recruiter/jobs/:jobId/ranking/export` optional

## AI explanation
- `GET /applications/:id/analysis/explanation`
- `POST /applications/:id/analysis/retry`

## Interviews
- `POST /recruiter/applications/:id/interviews`
- `PATCH /recruiter/interviews/:id`
- `GET /candidate/interviews`

## Notifications
- `GET /notifications`
- `PATCH /notifications/:id/read`

## Analytics
- `GET /recruiter/analytics/overview`
- `GET /recruiter/jobs/:jobId/analytics`

## Feedback
- `POST /recruiter/applications/:id/ai-feedback`

---

# 19. Async processing

AI tasks nên có trạng thái:

- `PENDING`
- `PROCESSING`
- `SUCCEEDED`
- `FAILED`
- `RETRYING`

Job payload nên chứa ID, không chứa toàn bộ dữ liệu nhạy cảm nếu không cần.

Retry:
- giới hạn retry.
- exponential backoff nếu phù hợp.
- dead-letter handling đơn giản hoặc failed job table.

UI:
- hiển thị “Processing”.
- cho retry khi fail.
- không block application submission chỉ vì AI đang chạy.

---

# 20. Security nâng cao

## Authentication
- Access + refresh token.
- Rotation/revocation nếu triển khai.
- Password reset token có expiry.

## Authorization
- RBAC.
- Resource ownership.
- Company membership validation.
- Admin separation.

## File security
- Private storage.
- Signed URL có expiry nếu dùng object storage.
- MIME check.
- Filename sanitization.
- file size limit.
- optional malware scan nếu có hạ tầng.

## API
- validation.
- rate limiting.
- CORS config.
- security headers.
- safe error response.
- no sensitive stack trace production.

## Audit
Ghi:
- login security events;
- application status changes;
- job changes;
- AI retry;
- admin actions.

---

# 21. Privacy và data governance

Phải xác định:

- CV retention policy.
- Account deletion behavior.
- Resume deletion behavior.
- Log retention.
- Demo dataset policy.
- Research dataset anonymization.
- Who can export candidate data.
- Không đưa raw CV vào public logging/tracing.

Nếu dùng external LLM/API:
- document dữ liệu nào được gửi.
- không gửi thừa.
- ưu tiên redaction hoặc structured data.
- ghi rõ hạn chế và policy trong báo cáo.

---

# 22. Observability

## Logs
- request ID.
- user ID ở dạng an toàn nếu cần.
- service.
- latency.
- error type.
- AI job ID.
- model version.

## Metrics
Ít nhất:
- API error rate.
- AI parse success rate.
- AI matching success rate.
- average processing time.
- failed jobs.
- queue depth nếu có queue.

## Health checks
- API.
- database.
- AI service.
- storage.
- queue.

---

# 23. Testing strategy hoàn chỉnh

## Unit
- scoring.
- feature normalization.
- parser utilities.
- permissions.
- ranking aggregation.
- recommendation filters.

## Integration
- API + DB.
- object storage.
- queue.
- AI service contract.

## E2E
- Candidate full journey.
- Recruiter full journey.
- AI failure/retry.
- recommendation.
- ranking.
- interview flow.

## Security tests
- IDOR/resource ownership.
- role bypass.
- invalid JWT.
- signed URL expiry.
- upload validation.

## AI evaluation tests
- golden CV/JD pairs.
- expected skills.
- expected labels/ranking.
- regression test across model versions.

---

# 24. Dataset cho nghiên cứu

## 24.1. Dataset tối thiểu đề xuất

Tạo/thu thập:
- 50–100 JD.
- 100–200 CV hoặc candidate profiles giả lập/ẩn danh.
- 200–500 CV–JD pairs nếu có thể.
- Human labels:
  - poor fit;
  - moderate fit;
  - good fit;
  hoặc score 1–5.

Nếu dữ liệu khó:
- dùng dữ liệu synthetic có kiểm soát;
- mô tả rõ cách tạo;
- tránh tuyên bố generalization quá mức.

## 24.2. Annotation guideline
Người đánh giá dựa trên:
- required skills.
- relevant experience.
- education nếu bắt buộc.
- domain relevance.
- không dùng thuộc tính nhạy cảm.

## 24.3. Split
- train/tuning nếu có.
- validation.
- test.
Nếu không train model, vẫn phải có evaluation set tách biệt.

---

# 25. Experiment design

Ít nhất so sánh:

## Baseline A
Keyword/rule-based V1.

## Model B
Semantic-only.

## Model C
Hybrid.

Đánh giá:
- classification agreement nếu có labels.
- ranking correlation.
- top-K quality.
- qualitative error analysis.

Bảng báo cáo nên có:
- dataset size.
- metric.
- baseline.
- semantic.
- hybrid.
- improvement.
- limitation.

---

# 26. Error analysis

Phân loại lỗi:

- Missing skill alias.
- Skill ambiguity.
- Experience date parse.
- CV layout.
- JD quá chung chung.
- Soft skills.
- Domain-specific terms.
- Semantic false positive.
- Semantic false negative.
- Missing evidence.
- LLM explanation hallucination nếu có.

Mỗi nhóm lỗi:
- ví dụ;
- nguyên nhân;
- hướng xử lý;
- còn giới hạn gì.

---

# 27. UX/UI nâng cao

## Candidate
- score card.
- breakdown.
- recommendation cards.
- application timeline.
- processing states.
- clear disclaimer.

## Recruiter
- ranking table.
- filters.
- score distribution.
- candidate compare.
- evidence drawer.
- pipeline board optional.
- analytics cards/charts.

## AI status
Không dùng chỉ “AI score 87%”.
Phải hiển thị:
- score;
- component;
- explanation;
- data quality warning;
- version/details ở mức phù hợp.

---

# 28. Dashboard metrics

## Recruiter overview
- active jobs.
- total applications.
- new applications.
- shortlisted.
- interviews.
- offers.
- hires.

## Per-job
- application count.
- average score.
- score distribution.
- top candidate skills.
- missing-skill distribution.
- status funnel.

Không diễn giải dashboard thành hiệu suất con người nếu dữ liệu không đủ.

---

# 29. CI/CD

Pipeline tối thiểu:

1. Install.
2. Lint.
3. Typecheck.
4. Unit test.
5. Build.
6. Integration test nếu môi trường cho phép.
7. Build image.
8. Deploy staging.

Branch strategy đơn giản:
- `main`
- feature branches
- release tags.

Không cần quy trình enterprise quá phức tạp.

---

# 30. Environments

- Local.
- Test.
- Staging/demo.
- Production-like nếu có.

Mỗi environment:
- env vars riêng.
- database riêng.
- storage riêng nếu có.
- secrets không commit.

---

# 31. Kế hoạch 16 tuần

## Tuần 1 — Audit V1 và freeze scope V2

### Việc cần làm
- Review toàn bộ MVP.
- Liệt kê technical debt.
- Thu thập feedback giai đoạn thực tập.
- Chốt research questions.
- Chốt required vs optional features.
- Chốt success metrics.

### Deliverables
- V1 audit report.
- V2 scope.
- Research questions.
- Prioritized backlog.

### DoD
- Không còn feature “mơ hồ bắt buộc”.

---

## Tuần 2 — Refactor architecture + data model V2

### Việc cần làm
- Update ERD.
- Add AI tables.
- Add embeddings schema.
- Add status history.
- Add audit.
- Tách AI service boundary.
- Viết API contracts.

### Deliverables
- ERD V2.
- Architecture V2.
- API spec V2.
- Migration plan.

---

## Tuần 3 — AI service foundation

### Việc cần làm
- FastAPI.
- health endpoint.
- request/response schema.
- model version abstraction.
- parser module.
- embedding adapter.
- AI job model.
- NestJS integration.

### DoD
- API gọi AI service được.
- Có timeout/error handling.

---

## Tuần 4 — CV Parser V2

### Việc cần làm
- section detection.
- experience structure.
- education structure.
- project/certification extraction.
- normalization.
- parser warnings.
- test corpus.

### Deliverables
- Parser V2.
- Parser evaluation report.

---

## Tuần 5 — JD Parser + Skill Taxonomy

### Việc cần làm
- structured job requirements.
- taxonomy.
- aliases.
- required/preferred.
- domain terms.
- recruiter structured job UI.

### DoD
- Job có structured requirements đủ dùng cho hybrid engine.

---

## Tuần 6 — Embedding + semantic similarity

### Việc cần làm
- Chọn embedding model/API.
- Implement embedding adapter.
- Cache/store vectors.
- Implement cosine similarity.
- Test chunk strategies.
- Measure latency.

### Deliverables
- Semantic prototype.
- Comparison examples baseline vs semantic.

---

## Tuần 7 — Hybrid Matching Engine V2

### Việc cần làm
- Component scores.
- Weight configuration.
- Evidence collection.
- Versioning.
- Fallback when embedding unavailable.
- Score persistence.

### DoD
- Một application có result V2 đầy đủ.
- Có baseline comparison.

---

## Tuần 8 — Explainability

### Việc cần làm
- Generate strengths/gaps từ evidence.
- Evidence snippets.
- Optional LLM explanation.
- Hallucination guard.
- UI score breakdown.
- Disclaimer.

### Deliverables
- Explainable analysis view.
- Explanation test cases.

---

## Tuần 9 — Candidate Ranking

### Việc cần làm
- batch analyze job candidates.
- ranking query.
- sort/filter.
- tie handling.
- recruiter ranking table.
- candidate compare optional.

### DoD
- Job có nhiều applicant và ranking ổn định/reproducible.

---

## Tuần 10 — Job Recommendation

### Việc cần làm
- Candidate representation.
- Candidate-job retrieval.
- Ranking.
- explanation.
- recommendation persistence.
- Candidate UI.
- feedback optional.

### Deliverables
- Recommendation feature end-to-end.

---

## Tuần 11 — Recruiter workflow hoàn thiện

### Việc cần làm
- application pipeline.
- shortlist.
- interview.
- status history.
- notes.
- notifications.
- candidate timeline.

### DoD
- Workflow từ APPLIED đến HIRED/REJECTED rõ ràng.

---

## Tuần 12 — Dashboard + Observability

### Việc cần làm
- recruiter dashboard.
- per-job analytics.
- AI health metrics.
- logs.
- health checks.
- failed job UI/admin.

### Deliverables
- Dashboard.
- Operational monitoring baseline.

---

## Tuần 13 — Dataset + Experimental Evaluation

### Việc cần làm
- finalize evaluation dataset.
- annotation.
- run baseline.
- run semantic.
- run hybrid.
- calculate metrics.
- export results.

### Deliverables
- Experiment result tables.
- Raw evaluation outputs.
- Metric scripts/notebooks if used.

---

## Tuần 14 — Error analysis + Security hardening

### Việc cần làm
- inspect false positives.
- inspect false negatives.
- adjust normalization/weights only using development data.
- security tests.
- privacy review.
- load/performance checks.
- fix critical bugs.

### Deliverables
- Error analysis report.
- Security checklist.
- Stable RC.

---

## Tuần 15 — Deployment + Thesis completion

### Việc cần làm
- staging/final deployment.
- CI.
- backup/restore basic check.
- finish thesis chapters.
- screenshots.
- diagrams.
- API docs.
- setup docs.

### Deliverables
- Release candidate.
- Thesis draft complete.
- Deployment guide.

---

## Tuần 16 — Final validation + Defense preparation

### Việc cần làm
- freeze code.
- tag release `graduation-v2.0`.
- final regression.
- seed demo data.
- prepare slides.
- demo rehearsal.
- prepare Q&A.
- prepare offline fallback demo/video/screenshots if deployment fails.

### Deliverables
- Final source.
- Final report/thesis.
- Slides.
- Demo.
- Experiment appendix.
- Test report.
- Deployment artifact.

---

# 32. Required vs Optional feature matrix

## Must-have
- V1 features stable.
- CV Parser V2.
- JD structured parsing.
- Semantic matching.
- Hybrid scoring.
- Explainability.
- Candidate ranking.
- Job recommendation.
- Evaluation dataset.
- Baseline vs V2 experiment.
- Security/privacy.
- Tests.
- Deployment.
- Thesis documentation.

## Should-have
- Async processing.
- Notifications.
- Interview flow.
- Dashboard.
- Audit logs.
- Feedback collection.

## Nice-to-have
- Candidate compare.
- Email automation.
- Realtime notification.
- advanced search.
- multiple languages.
- OCR.
- richer recruiter collaboration.

Nếu thiếu thời gian, cắt từ Nice-to-have trước.

---

# 33. Tiêu chí nghiệm thu AI

AI component đạt khi:

1. Parse được CV test set với tỷ lệ thành công được báo cáo.
2. Skill normalization có test.
3. Semantic model nhận ra ít nhất các case đồng nghĩa/diễn đạt khác mà baseline bỏ sót.
4. Hybrid score có component rõ ràng.
5. Mỗi result lưu model/algorithm version.
6. Có evidence cho kết quả.
7. Có baseline comparison.
8. Có evaluation metric.
9. Có error analysis.
10. Có limitation.
11. Không dùng protected attributes.
12. Recruiter vẫn là người quyết định.

---

# 34. Tiêu chí nghiệm thu hệ thống

1. Candidate đăng ký và quản lý CV.
2. Recruiter publish job.
3. Candidate apply.
4. AI process chạy async hoặc ổn định.
5. Recruiter thấy analysis.
6. Recruiter thấy ranking.
7. Candidate thấy job recommendations.
8. Recruiter quản lý pipeline.
9. Status history không mất.
10. Permissions đúng.
11. CV file private.
12. Logs không lộ dữ liệu nhạy cảm.
13. Hệ thống có test.
14. Hệ thống deploy được.
15. Có tài liệu setup.
16. Có dataset/evaluation.
17. Có báo cáo thí nghiệm.
18. Có demo ổn định.

---

# 35. Kịch bản demo cuối cùng

## Phần A — Recruiter tạo JD
Tạo Full Stack Developer:
- React.
- Node.js.
- PostgreSQL.
- Docker.
- 2+ years.
- REST APIs.

## Phần B — Candidate upload CV
CV dùng cách diễn đạt khác:
- Next.js.
- NestJS/Express.
- “built backend APIs”.
- PostgreSQL.
- không ghi chính xác “RESTful services”.

## Phần C — So sánh baseline vs V2
Hiển thị:
- keyword baseline.
- semantic similarity.
- hybrid result.

Giải thích trường hợp semantic bắt được ý nghĩa mà baseline bỏ sót.

## Phần D — Explainability
Hiển thị:
- component score.
- strengths.
- gaps.
- evidence.

## Phần E — Ranking
Mở job có 5–10 ứng viên.
Hiển thị ranking và filter.

## Phần F — Recommendation
Login candidate.
Hiển thị 3–5 job phù hợp + lý do.

## Phần G — Workflow
Recruiter shortlist -> interview -> status change.
Candidate nhận notification / xem timeline.

## Phần H — Research result
Show chart/table:
- baseline metric.
- semantic metric.
- hybrid metric.
- error analysis.
- limitation.

Đây là phần quan trọng để chứng minh đồ án không chỉ là CRUD + gọi AI API.

---

# 36. Cấu trúc báo cáo/khóa luận đề xuất

## Chương 1 — Tổng quan
- Bối cảnh.
- Vấn đề.
- Mục tiêu.
- Phạm vi.
- Đóng góp.
- Cấu trúc báo cáo.

## Chương 2 — Cơ sở lý thuyết
- Recruitment systems.
- CV/JD matching.
- NLP.
- Embeddings.
- Similarity.
- Ranking.
- Recommendation.
- Explainable AI.
- Related work.

## Chương 3 — Phân tích và thiết kế
- Actors.
- Use cases.
- Requirements.
- Architecture.
- ERD.
- Security/privacy.
- Main sequences.

## Chương 4 — Phương pháp AI
- Baseline.
- CV parsing.
- JD parsing.
- Taxonomy.
- Embeddings.
- Hybrid score.
- Explainability.
- Ranking.
- Recommendation.

## Chương 5 — Cài đặt
- Frontend.
- Backend.
- AI service.
- DB.
- Queue.
- Storage.
- Deployment.

## Chương 6 — Thực nghiệm và đánh giá
- Dataset.
- Annotation.
- Metrics.
- Experiment setup.
- Results.
- Error analysis.
- Limitations.

## Chương 7 — Kết luận
- Kết quả.
- Đóng góp.
- Hạn chế.
- Hướng phát triển.

---

# 37. Các sơ đồ cần chuẩn bị

Tối thiểu:
- System context diagram.
- Use case diagram.
- Component/architecture diagram.
- ERD.
- Sequence: upload CV.
- Sequence: apply + matching.
- Sequence: recruiter ranking.
- Sequence: job recommendation.
- Activity diagram recruitment pipeline.
- AI processing flow.
- Deployment diagram.

---

# 38. Rủi ro và mitigation

## R1 — Embedding không cải thiện đủ
- Có baseline rõ.
- Test nhiều chunk strategy.
- Hybrid thay vì semantic-only.
- Báo cáo kết quả trung thực.

## R2 — Dataset nhỏ
- Dùng synthetic + manual annotation.
- Không overclaim.
- Tập trung comparative evaluation.

## R3 — LLM hallucination
- LLM không tính score.
- structured evidence.
- output validation.
- deterministic fallback.

## R4 — AI latency
- async queue.
- cache embedding.
- reuse vectors.
- batch processing.

## R5 — Vector DB làm phức tạp
- ưu tiên pgvector nếu PostgreSQL đã dùng.
- không thêm hệ thống mới nếu không cần.

## R6 — Scope quá lớn
- Must/Should/Nice.
- đóng scope trước tuần 3.
- bảo vệ research features trước cosmetic features.

## R7 — Bias
- loại protected attributes.
- human-in-the-loop.
- document limitations.
- kiểm tra score distribution nếu dataset cho phép.

## R8 — Demo lỗi
- seed cố định.
- precompute analyses.
- staging health check.
- offline screenshots/video fallback.

---

# 39. Definition of Done cho mỗi feature

Một feature chỉ “Done” khi:

- Requirement rõ.
- API implemented.
- Authorization đúng.
- Validation có.
- UI có loading/error/empty state.
- Tests mức phù hợp.
- Logging lỗi phù hợp.
- Documentation cập nhật.
- Không phá regression.
- Có dữ liệu demo nếu là feature trình bày.

---

# 40. Definition of Done toàn đồ án

Đồ án hoàn chỉnh được coi là hoàn thành khi:

**Sản phẩm**
- Hệ thống tuyển dụng end-to-end hoàn chỉnh.
- Candidate và Recruiter workflow chạy ổn định.
- Ranking và recommendation hoạt động.

**AI**
- Baseline V1 tồn tại để so sánh.
- Semantic/hybrid V2 hoạt động.
- Explainability có evidence.
- Evaluation có số liệu.
- Error analysis có chiều sâu.

**Engineering**
- Security/RBAC đúng.
- Private CV storage.
- Async/retry nếu cần.
- Logging/health check.
- Tests.
- Deployment.

**Học thuật**
- Research questions được trả lời.
- Dataset và methodology được mô tả.
- Metrics được giải thích.
- Không overclaim.
- Limitations rõ.
- Có hướng phát triển.

---

# 41. Checklist cuối cùng

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
- [ ] Queue/background jobs.
- [ ] Logging.
- [ ] Health checks.
- [ ] Tests.
- [ ] CI.
- [ ] Docker.
- [ ] Deployment.
- [ ] Backup/config documentation.

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

# 42. Kết quả cuối cùng mong đợi

Sản phẩm cuối không nên được mô tả đơn giản là “website tuyển dụng có AI”.

Mục tiêu nên là:

> **Một hệ thống tuyển dụng hỗ trợ quyết định, trong đó CV và JD được chuyển thành dữ liệu có cấu trúc, mức độ phù hợp được đánh giá bằng phương pháp hybrid kết hợp feature-based matching và semantic similarity, kết quả có giải thích và bằng chứng, ứng viên có thể được xếp hạng theo từng vị trí và nhận gợi ý công việc, trong khi quyết định tuyển dụng cuối cùng vẫn thuộc về con người.**

Đây là điểm khác biệt giữa **MVP thực tập** và **đồ án tốt nghiệp hoàn chỉnh**.
