# KẾ HOẠCH CHI TIẾT — GIAI ĐOẠN THỰC TẬP TỐT NGHIỆP

## Đề tài
**Xây dựng hệ thống tuyển dụng và phân tích mức độ phù hợp giữa CV và mô tả công việc ứng dụng trí tuệ nhân tạo**

---

## 0. Mục đích của tài liệu

Tài liệu này là kế hoạch triển khai cho **giai đoạn 1 — Thực tập tốt nghiệp**, với mục tiêu xây dựng một MVP chạy được end-to-end, có yếu tố AI ở mức vừa đủ để chứng minh tính khả thi của đề tài, nhưng vẫn chủ động để lại các phần nâng cao cho giai đoạn Đồ án tốt nghiệp hoàn chỉnh.

Kế hoạch mặc định theo **12 tuần**. Nếu lịch thực tế ngắn hoặc dài hơn, có thể co giãn nhưng nên giữ nguyên thứ tự phụ thuộc giữa các hạng mục.

### Nguyên tắc bắt buộc của giai đoạn thực tập

1. Không làm quá sâu phần AI nâng cao.
2. Phải có một luồng nghiệp vụ hoàn chỉnh từ đăng tin tuyển dụng đến xem điểm phù hợp CV–JD.
3. Phải có dữ liệu lưu trữ thật trong database.
4. Phải có phân quyền Candidate / Recruiter / Admin ở mức cơ bản.
5. Phải có tài liệu phân tích, thiết kế, kiểm thử và hướng dẫn chạy.
6. AI chỉ hỗ trợ đánh giá; không tự động quyết định tuyển hoặc loại.
7. Ưu tiên tính ổn định, khả năng demo và khả năng tiếp tục mở rộng sang giai đoạn 2.

---

# 1. Mục tiêu giai đoạn thực tập

## 1.1. Mục tiêu sản phẩm

Xây dựng một hệ thống web tuyển dụng cho phép:

- Ứng viên tạo tài khoản, hồ sơ cá nhân và tải CV.
- Nhà tuyển dụng tạo công ty, đăng tin tuyển dụng và quản lý ứng viên.
- Ứng viên tìm kiếm, xem và ứng tuyển công việc.
- Hệ thống trích xuất thông tin cơ bản từ CV.
- Hệ thống phân tích yêu cầu từ mô tả công việc.
- Hệ thống tính điểm phù hợp cơ bản giữa CV và JD.
- Nhà tuyển dụng xem điểm phù hợp, kỹ năng phù hợp và kỹ năng còn thiếu.
- Nhà tuyển dụng cập nhật trạng thái hồ sơ.
- Quản trị viên quản lý dữ liệu cơ bản.

## 1.2. Mục tiêu học thuật

Chứng minh được:

- Bài toán tuyển dụng có thể được mô hình hóa thành hệ thống phần mềm.
- CV và JD có thể được chuyển từ tài liệu tự do sang dữ liệu có cấu trúc.
- Có thể xây dựng một phương pháp matching cơ bản dựa trên kỹ năng, kinh nghiệm và học vấn.
- Kiến trúc hệ thống có thể mở rộng sang semantic matching, recommendation và explainable AI ở giai đoạn sau.

## 1.3. Mục tiêu kỹ thuật

Hoàn thành các thành phần:

- Frontend: Next.js + TypeScript.
- Backend API: NestJS + TypeScript.
- Database: PostgreSQL.
- ORM: Prisma.
- AI/CV Processing: có thể dùng Python + FastAPI hoặc module backend riêng ở mức tối thiểu.
- File storage: local development hoặc object storage đơn giản.
- Authentication: JWT access/refresh token.
- Validation, logging, error handling.
- Test cho các luồng quan trọng.
- Docker hóa tối thiểu nếu thời gian cho phép.

---

# 2. Phạm vi MVP

## 2.1. Bắt buộc phải có

### Candidate
- Đăng ký.
- Đăng nhập.
- Đăng xuất.
- Quên/đổi mật khẩu ở mức cơ bản.
- Cập nhật hồ sơ cá nhân.
- Upload CV PDF.
- Xem CV đã upload.
- Xem danh sách công việc.
- Tìm kiếm/lọc công việc cơ bản.
- Xem chi tiết JD.
- Ứng tuyển bằng CV.
- Xem danh sách hồ sơ đã ứng tuyển.
- Xem trạng thái ứng tuyển.
- Xem điểm phù hợp của bản thân với JD sau khi hệ thống phân tích.

### Recruiter
- Đăng ký/đăng nhập.
- Tạo/cập nhật thông tin công ty.
- Tạo tin tuyển dụng.
- Sửa tin tuyển dụng.
- Đóng/mở tin tuyển dụng.
- Xem danh sách ứng viên theo từng job.
- Xem thông tin hồ sơ ứng viên.
- Xem CV.
- Xem kết quả matching.
- Cập nhật trạng thái application.

### Admin
- Đăng nhập.
- Xem danh sách người dùng.
- Khóa/mở tài khoản ở mức cơ bản.
- Xem danh sách công ty.
- Xem danh sách job.
- Ẩn job vi phạm nếu cần.

### AI/Matching
- Extract text từ CV PDF.
- Chuẩn hóa text.
- Trích xuất kỹ năng.
- Trích xuất số năm kinh nghiệm ở mức gần đúng.
- Trích xuất học vấn ở mức cơ bản.
- Trích xuất kỹ năng/yêu cầu chính từ JD.
- So khớp kỹ năng.
- Tính điểm phù hợp.
- Trả matched skills.
- Trả missing skills.
- Lưu kết quả phân tích.

## 2.2. Chưa làm ở giai đoạn thực tập

Các nội dung sau được cố ý để dành cho đồ án hoàn chỉnh:

- Semantic similarity bằng embedding.
- Vector database/pgvector.
- Candidate ranking nâng cao.
- Job recommendation cá nhân hóa.
- Explainable AI chi tiết.
- AI summary bằng LLM.
- Fairness/bias evaluation.
- Notification realtime.
- Chat.
- Lịch phỏng vấn.
- Email automation hoàn chỉnh.
- Analytics nâng cao.
- Elasticsearch.
- Microservices đầy đủ.
- Kubernetes.
- Hệ thống event-driven phức tạp.
- Multi-language CV nâng cao.
- OCR cho CV scan nếu không thật sự cần.

---

# 3. Đối tượng sử dụng và quyền hạn

## 3.1. Candidate

Quyền chính:
- Quản lý hồ sơ cá nhân.
- Quản lý CV của bản thân.
- Xem job đang mở.
- Ứng tuyển.
- Xem application của bản thân.
- Xem matching result của bản thân.

Không được:
- Xem CV ứng viên khác.
- Xem dữ liệu nội bộ recruiter.
- Thay đổi trạng thái application.
- Sửa job.

## 3.2. Recruiter

Quyền chính:
- Quản lý công ty mà mình thuộc về.
- Quản lý job của công ty.
- Xem application gửi vào job thuộc công ty.
- Xem CV của ứng viên đã ứng tuyển.
- Xem AI result.
- Cập nhật application status.

Không được:
- Xem dữ liệu riêng tư của ứng viên chưa ứng tuyển.
- Quản lý job công ty khác.
- Tự thay đổi score AI trực tiếp.

## 3.3. Admin

Quyền chính:
- Quản lý user.
- Quản lý company.
- Quản lý job.
- Xem trạng thái hệ thống ở mức cơ bản.

Không can thiệp thủ công vào kết quả AI trừ trường hợp phục vụ debugging có audit log.

---

# 4. Luồng nghiệp vụ cốt lõi

## 4.1. Luồng ứng viên

1. Candidate đăng ký.
2. Candidate xác thực và đăng nhập.
3. Candidate cập nhật profile.
4. Candidate upload CV.
5. Hệ thống kiểm tra định dạng file.
6. Hệ thống lưu metadata file.
7. Hệ thống extract text.
8. Hệ thống parse thông tin cơ bản.
9. Candidate duyệt danh sách job.
10. Candidate xem JD.
11. Candidate chọn CV và ứng tuyển.
12. Hệ thống tạo application.
13. Hệ thống phân tích CV–JD.
14. Hệ thống lưu score và chi tiết matching.
15. Candidate theo dõi trạng thái.

## 4.2. Luồng recruiter

1. Recruiter đăng ký/đăng nhập.
2. Tạo company hoặc được gắn vào company.
3. Tạo job.
4. Nhập:
   - title;
   - description;
   - responsibilities;
   - requirements;
   - preferred skills;
   - experience;
   - education;
   - location;
   - salary range nếu có.
5. Publish job.
6. Nhận application.
7. Mở danh sách candidate.
8. Xem CV.
9. Xem:
   - matching score;
   - matched skills;
   - missing skills;
   - experience match;
   - education match.
10. Cập nhật trạng thái application.

## 4.3. Trạng thái application

Tối thiểu:

- `APPLIED`
- `REVIEWING`
- `ACCEPTED`
- `REJECTED`

Nếu muốn đẹp hơn nhưng vẫn giữ MVP:

- `APPLIED`
- `SCREENING`
- `INTERVIEW`
- `ACCEPTED`
- `REJECTED`

Không nên thêm quá nhiều trạng thái ở giai đoạn 1.

---

# 5. Yêu cầu chức năng chi tiết

## FR-AUTH

### FR-AUTH-01 — Đăng ký
- Cho phép chọn role Candidate hoặc Recruiter.
- Email duy nhất.
- Password phải đạt rule tối thiểu.
- Lưu password dạng hash.
- Trả lỗi rõ ràng khi email tồn tại.

### FR-AUTH-02 — Đăng nhập
- Kiểm tra email/password.
- Sinh access token.
- Có refresh token nếu triển khai.
- Trả role và user profile cơ bản.

### FR-AUTH-03 — Phân quyền
- Mỗi API private phải kiểm tra authentication.
- API recruiter phải kiểm tra role.
- API candidate phải kiểm tra quyền sở hữu tài nguyên.

### FR-AUTH-04 — Đổi mật khẩu
- Yêu cầu password hiện tại.
- Hash password mới.
- Invalidate refresh token cũ nếu triển khai.

---

## FR-CANDIDATE

### FR-CAN-01 — Candidate profile
Thông tin đề xuất:
- fullName
- phone
- dateOfBirth (optional)
- location
- headline
- summary
- yearsOfExperience
- education summary
- portfolio URL
- GitHub URL
- LinkedIn URL

### FR-CAN-02 — Upload CV
- Chỉ chấp nhận PDF trong MVP.
- Giới hạn kích thước file.
- Kiểm tra MIME type.
- Tạo bản ghi resume.
- Lưu tên file, path/object key, size, uploadedAt.
- Trigger parse sau upload.

### FR-CAN-03 — Quản lý CV
- Xem danh sách CV của bản thân.
- Đặt một CV là active/default.
- Xóa CV nếu chưa gắn với application hoặc có policy phù hợp.

### FR-CAN-04 — Tìm việc
Filter tối thiểu:
- keyword;
- location;
- employment type;
- experience level.

### FR-CAN-05 — Ứng tuyển
- Candidate phải có CV.
- Không cho duplicate application cùng job nếu policy là 1 lần/job.
- Snapshot CV được chọn vào application.
- Tạo trạng thái `APPLIED`.
- Trigger matching.

### FR-CAN-06 — Theo dõi application
Hiển thị:
- Job title.
- Company.
- Applied date.
- Current status.
- Match score nếu có.

---

## FR-RECRUITER

### FR-REC-01 — Company
- Tạo company.
- Update company.
- Logo optional.
- Website optional.
- Industry.
- Company size.
- Description.

### FR-REC-02 — Job CRUD
Thông tin job:
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
- minSalary/maxSalary optional
- currency optional
- status: DRAFT/PUBLISHED/CLOSED

### FR-REC-03 — Danh sách ứng viên
Cho phép:
- xem theo job;
- sort theo appliedAt;
- sort theo matchScore;
- filter theo status.

### FR-REC-04 — Chi tiết ứng viên
Hiển thị:
- candidate profile;
- CV link/view;
- parsed information;
- match score;
- matched skills;
- missing skills;
- application status.

### FR-REC-05 — Cập nhật trạng thái
- Chỉ recruiter thuộc company được thao tác.
- Ghi `updatedAt`.
- Nếu có status history thì lưu lịch sử.

---

## FR-ADMIN

### FR-ADM-01 — User management
- List.
- Search theo email/tên.
- Disable/enable account.

### FR-ADM-02 — Job moderation
- List job.
- Xem company/job.
- Ẩn hoặc đóng job vi phạm.

---

# 6. AI MVP — Phạm vi và phương pháp

## 6.1. Mục tiêu

Không cố xây “AI tuyển dụng hoàn chỉnh”. Mục tiêu là tạo một pipeline có thể:

`CV PDF -> Text -> Structured Candidate Data -> Compare with JD -> Score`

## 6.2. Pipeline CV

### Bước 1 — File validation
- PDF hợp lệ.
- Không vượt size limit.
- Không bị lỗi file.

### Bước 2 — Text extraction
Ưu tiên thư viện PDF text extraction trước.
Không dùng OCR trừ khi cần.

Output:
- rawText
- extractionStatus
- extractionError nếu có

### Bước 3 — Normalization
- lowercase cho matching nhưng giữ raw text.
- remove redundant spaces.
- normalize punctuation.
- normalize common technology aliases:
  - nodejs -> node.js;
  - reactjs -> react;
  - postgres -> postgresql;
  - js -> javascript khi ngữ cảnh phù hợp.

### Bước 4 — Skill extraction
Cách MVP:
- skill dictionary.
- keyword matching.
- alias matching.
- optional regex.

Ví dụ dictionary:
- JavaScript
- TypeScript
- React
- Next.js
- Node.js
- NestJS
- Java
- Spring Boot
- C#
- .NET
- Python
- FastAPI
- Django
- PostgreSQL
- MySQL
- MongoDB
- Redis
- Docker
- AWS
- Git
- REST API
- GraphQL

### Bước 5 — Experience extraction
MVP có thể:
- đọc trường “x years experience”;
- hoặc tính gần đúng từ work history;
- lưu `estimatedYearsOfExperience`.

Phải đánh dấu đây là giá trị ước tính.

### Bước 6 — Education extraction
Tìm:
- university/college;
- degree;
- major;
- graduation year nếu có.

MVP không cần NLP phức tạp.

---

## 6.3. Pipeline JD

Tách JD thành:
- required skills;
- preferred skills;
- minimum experience;
- education requirement.

Có thể hỗ trợ recruiter chọn skills thủ công khi đăng job để giảm lỗi parse.

Đây là lựa chọn rất phù hợp cho MVP:
- JD text dùng để hiển thị.
- `job_skills` dùng cho matching tin cậy hơn.

---

## 6.4. Công thức matching MVP

Đề xuất:

`FinalScore = SkillScore * 0.60 + ExperienceScore * 0.25 + EducationScore * 0.15`

### SkillScore
Ví dụ:
- required skill match: trọng số 1.0;
- preferred skill match: trọng số 0.5.

Công thức có thể:

`matched required weights / total required weights * 100`

### ExperienceScore
Ví dụ:
- candidate >= required: 100.
- candidate = required - 1 năm: 75.
- candidate = required - 2 năm: 50.
- thấp hơn nhiều: 25 hoặc 0.

Cần ghi rõ công thức trong báo cáo.

### EducationScore
Ví dụ:
- đáp ứng: 100;
- gần tương đương: 70;
- không xác định: 50;
- không đáp ứng: 0.

### Output mẫu

```json
{
  "overallScore": 78.5,
  "skillScore": 83,
  "experienceScore": 75,
  "educationScore": 65,
  "matchedSkills": ["React", "Node.js", "PostgreSQL"],
  "missingSkills": ["Docker"],
  "estimatedExperienceYears": 1.5,
  "requiredExperienceYears": 2,
  "version": "mvp-v1"
}
```

---

# 7. Yêu cầu phi chức năng

## NFR-01 — Hiệu năng
- API CRUD thông thường mục tiêu < 500 ms trong môi trường dev/local hợp lý.
- Matching có thể chạy đồng bộ nếu < vài giây; nếu lâu hơn chuyển background job.
- List endpoint phải pagination.

## NFR-02 — Bảo mật
- Password hash bằng bcrypt/argon2.
- JWT có expiry.
- Không public file path trực tiếp nếu storage private.
- Validate input.
- ORM parameterization chống SQL injection.
- Rate limit auth endpoints nếu có thể.
- Không log password/token.

## NFR-03 — Quyền riêng tư
- CV được xem là dữ liệu nhạy cảm.
- Chỉ candidate sở hữu, recruiter liên quan và admin hợp lệ được truy cập.
- Có chức năng xóa CV hoặc xóa tài khoản ở mức phù hợp.
- Không dùng CV thật của người khác trong demo nếu chưa có quyền.

## NFR-04 — Khả năng bảo trì
- Tách module rõ ràng.
- Có DTO/schema.
- Có migration.
- Có README.
- Có `.env.example`.

## NFR-05 — Khả năng mở rộng
Thiết kế để sau này thêm:
- AI service riêng;
- vector search;
- recommendation;
- ranking;
- notification;
- analytics.

## NFR-06 — Logging
Tối thiểu log:
- request errors;
- auth failures đáng chú ý;
- AI parse failure;
- matching failure.

---

# 8. Kiến trúc đề xuất

## 8.1. Kiến trúc logic

```text
[Browser]
   |
   v
[Next.js Frontend]
   |
   v
[NestJS REST API]
   |-----------|
   |           |
   v           v
[PostgreSQL] [File Storage]
   |
   v
[Basic AI / Parsing Module]
```

Nếu tách Python:

```text
[Next.js]
   |
[NestJS]
   |------ [PostgreSQL]
   |------ [Object Storage]
   |
   +----HTTP----> [FastAPI AI Service]
```

## 8.2. Khuyến nghị giai đoạn 1

Nếu thời gian ngắn:
- giữ AI logic đơn giản;
- ưu tiên ít service;
- không thêm Redis/Kafka/vector DB khi chưa cần.

---

# 9. Thiết kế database MVP

## 9.1. `users`
- id UUID
- email unique
- passwordHash
- role
- status
- createdAt
- updatedAt

## 9.2. `candidate_profiles`
- id
- userId unique FK
- fullName
- phone
- location
- headline
- summary
- yearsOfExperience
- portfolioUrl
- githubUrl
- linkedinUrl
- createdAt
- updatedAt

## 9.3. `recruiter_profiles`
- id
- userId unique FK
- fullName
- phone
- title
- companyId FK
- createdAt
- updatedAt

## 9.4. `companies`
- id
- name
- slug
- description
- industry
- size
- website
- logoUrl
- status
- createdAt
- updatedAt

## 9.5. `jobs`
- id
- companyId FK
- createdBy FK user
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
- minSalary
- maxSalary
- currency
- status
- publishedAt
- closedAt
- createdAt
- updatedAt

## 9.6. `skills`
- id
- name unique
- normalizedName unique
- category optional

## 9.7. `job_skills`
- id
- jobId FK
- skillId FK
- type REQUIRED/PREFERRED
- weight
- unique(jobId, skillId)

## 9.8. `resumes`
- id
- candidateId FK
- originalFileName
- storageKey
- mimeType
- fileSize
- rawText nullable
- parseStatus
- parseError
- isDefault
- uploadedAt

## 9.9. `resume_skills`
- id
- resumeId FK
- skillId FK
- confidence optional
- source optional
- unique(resumeId, skillId)

## 9.10. `applications`
- id
- candidateId FK
- jobId FK
- resumeId FK
- status
- appliedAt
- updatedAt
- unique(candidateId, jobId)

## 9.11. `ai_analyses`
- id
- applicationId unique FK
- version
- overallScore
- skillScore
- experienceScore
- educationScore
- matchedSkills JSONB
- missingSkills JSONB
- details JSONB
- status
- errorMessage
- createdAt
- updatedAt

## 9.12. `application_status_history` — optional nhưng nên có
- id
- applicationId
- oldStatus
- newStatus
- changedBy
- changedAt

---

# 10. API dự kiến

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

## Company
- `GET /recruiter/company`
- `POST /recruiter/company`
- `PATCH /recruiter/company`

## AI
- `POST /internal/resumes/:id/parse`
- `POST /internal/applications/:id/match`
- `GET /applications/:id/analysis`

## Admin
- `GET /admin/users`
- `PATCH /admin/users/:id/status`
- `GET /admin/jobs`
- `PATCH /admin/jobs/:id/status`

---

# 11. Danh sách màn hình

## Public
1. Landing page.
2. Job listing.
3. Job detail.
4. Login.
5. Register.

## Candidate
6. Candidate dashboard.
7. Profile.
8. Resume management.
9. Upload CV.
10. My applications.
11. Application detail + match result.

## Recruiter
12. Recruiter dashboard.
13. Company profile.
14. Job list.
15. Create job.
16. Edit job.
17. Job detail management.
18. Applicants list.
19. Applicant detail + CV + AI score.

## Admin
20. Admin dashboard.
21. User management.
22. Job management.

---

# 12. UX yêu cầu tối thiểu

- Loading state.
- Empty state.
- Error state.
- Confirm dialog cho hành động xóa/đóng.
- Toast notification.
- Form validation.
- Responsive tối thiểu desktop/tablet.
- Status badge rõ ràng.
- Score hiển thị kèm giải thích ngắn, không chỉ một con số.

---

# 13. Cấu trúc repository gợi ý

```text
recruitment-ai/
  apps/
    web/
    api/
    ai/               # optional trong giai đoạn 1
  packages/
    shared-types/
  docs/
    requirements/
    diagrams/
    api/
    testing/
  docker/
  .env.example
  README.md
```

Nếu không dùng monorepo:

```text
recruitment-web/
recruitment-api/
recruitment-ai-service/
```

---

# 14. Chuẩn code

- TypeScript strict mode nếu khả thi.
- ESLint.
- Prettier.
- Naming nhất quán.
- Controller không chứa business logic nặng.
- Business logic trong service/use-case.
- DTO validation.
- Không hard-code secret.
- Migration được commit.
- Seed data có script riêng.
- Mỗi feature có README ngắn hoặc tài liệu trong `/docs`.

---

# 15. Kế hoạch triển khai 12 tuần

## Tuần 1 — Phân tích yêu cầu và chốt phạm vi

### Việc cần làm
- Viết problem statement.
- Xác định actor.
- Chốt chức năng MVP.
- Chốt non-goals.
- Viết use case.
- Xác định input/output AI.
- Xác định stack.
- Tạo backlog.

### Kết quả
- Requirement document.
- Use case diagram.
- Product scope.
- Initial backlog.

### Definition of Done
- Có danh sách chức năng bắt buộc.
- Có danh sách chức năng chưa làm.
- Không còn mơ hồ về luồng demo chính.

---

## Tuần 2 — Thiết kế hệ thống và database

### Việc cần làm
- ERD.
- Database schema.
- API contract v1.
- Wireframe màn hình.
- Architecture diagram.
- Xác định role/permission.
- Xác định data ownership.

### Kết quả
- ERD v1.
- API list.
- Wireframe.
- Architecture diagram.

### DoD
- Có thể giải thích quan hệ giữa user, company, job, resume, application, analysis.

---

## Tuần 3 — Khởi tạo dự án và Auth

### Việc cần làm
- Setup Next.js.
- Setup NestJS.
- Setup PostgreSQL.
- Setup Prisma.
- Migration ban đầu.
- Seed roles/admin.
- Register/login.
- Auth guard.
- Role guard.
- Error handling.

### Kết quả
- Đăng ký/đăng nhập được.
- Candidate và Recruiter vào đúng khu vực.
- Database chạy ổn.

### Test
- Email duplicate.
- Sai password.
- Token hết hạn.
- Role forbidden.

---

## Tuần 4 — Candidate profile + Company + Job CRUD

### Việc cần làm
- Candidate profile.
- Recruiter profile.
- Company CRUD.
- Job CRUD.
- Publish/close.
- Job listing public.

### Kết quả
- Recruiter có thể tạo company và đăng job.
- Candidate có thể xem job.

### DoD
- Job DRAFT không xuất hiện public.
- Job CLOSED không nhận application mới.

---

## Tuần 5 — Resume upload và quản lý file

### Việc cần làm
- Upload PDF.
- Validate file.
- Storage service.
- Resume metadata.
- Resume list.
- Delete/default resume.
- PDF viewer/link bảo mật cơ bản.

### Kết quả
- Candidate upload CV thành công.
- Recruiter chưa thể xem nếu chưa có application.

### Test
- Sai MIME.
- File quá lớn.
- File lỗi.
- Unauthorized download.

---

## Tuần 6 — Application workflow

### Việc cần làm
- Apply job.
- Prevent duplicate.
- Candidate application list.
- Recruiter applicant list.
- Applicant detail.
- Status update.
- Status history nếu có.

### Kết quả
- Luồng Candidate -> Apply -> Recruiter xem được hoàn chỉnh.

### DoD
- Ownership và company permission đúng.

---

## Tuần 7 — CV text extraction và parsing cơ bản

### Việc cần làm
- Extract text.
- Parse status.
- Skill dictionary.
- Alias normalization.
- Experience extraction.
- Education extraction.
- Lưu parsed result.

### Kết quả
- Upload CV -> có parsed text + skill list.

### Test
- 10–20 CV mẫu.
- Theo dõi parse failures.
- Ghi chú các case không xử lý tốt.

---

## Tuần 8 — JD structure + Matching Engine v1

### Việc cần làm
- Job skill selection.
- Required/preferred distinction.
- Implement scoring formula.
- Generate matched/missing skills.
- Lưu analysis result.
- Versioning formula.

### Kết quả
- Application tạo ra match result.

### DoD
- Score reproducible.
- Có công thức rõ trong tài liệu.
- Không phụ thuộc LLM để trả score.

---

## Tuần 9 — UI hoàn thiện cho AI result

### Việc cần làm
- Candidate match view.
- Recruiter applicant detail.
- Score breakdown.
- Matched skills.
- Missing skills.
- Empty/error state.
- Loading state.

### Kết quả
- Demo trực quan và dễ hiểu.

---

## Tuần 10 — Testing + Security + Data seed

### Việc cần làm
- Unit test scoring.
- Integration test API quan trọng.
- E2E smoke test.
- Authorization test.
- Seed dataset.
- Test file access.
- Test invalid inputs.

### Kết quả
- Test report.
- Bug list.
- Fix các bug P0/P1.

---

## Tuần 11 — Deploy + Documentation

### Việc cần làm
- Dockerfile.
- Docker Compose nếu phù hợp.
- `.env.example`.
- Deploy staging/demo.
- README.
- API documentation.
- Database documentation.
- Hướng dẫn cài đặt.
- Hướng dẫn demo.

### Kết quả
- Hệ thống chạy được từ clean environment.
- Có URL demo nếu có server.

---

## Tuần 12 — Hoàn thiện báo cáo và rehearsal

### Việc cần làm
- Chốt screenshot.
- Viết nội dung báo cáo thực tập.
- Chuẩn bị slide.
- Chuẩn bị dữ liệu demo.
- Chuẩn bị câu hỏi phản biện.
- Chạy rehearsal.
- Tag release `internship-v1.0`.

### Kết quả
- Source code.
- Report.
- Slide.
- Demo script.
- Release.
- Backlog chuyển tiếp sang đồ án tốt nghiệp.

---

# 16. Kế hoạch kiểm thử

## 16.1. Unit test
Ưu tiên:
- matching formula;
- skill normalization;
- experience score;
- permission helpers.

## 16.2. Integration test
- register/login;
- create job;
- upload resume;
- apply;
- recruiter list applications;
- status update;
- trigger analysis.

## 16.3. E2E test quan trọng
Scenario:
1. Recruiter register.
2. Create company.
3. Create/publish job.
4. Candidate register.
5. Upload CV.
6. Apply.
7. System calculates score.
8. Recruiter sees result.
9. Recruiter changes status.
10. Candidate sees updated status.

## 16.4. Test data
Tạo ít nhất:
- 3 recruiter.
- 3 company.
- 10–20 job.
- 20–30 candidate.
- 20+ CV mẫu.
- 50+ application nếu có thể seed.

---

# 17. Tiêu chí nghiệm thu giai đoạn thực tập

Giai đoạn 1 được coi là đạt khi:

1. Có thể đăng ký/đăng nhập theo role.
2. Recruiter tạo và publish job.
3. Candidate upload PDF CV.
4. Candidate xem job và apply.
5. Application được lưu đúng.
6. CV được extract text.
7. Skill list được parse.
8. Hệ thống tính được score CV–JD.
9. Recruiter xem được score/matched/missing skills.
10. Recruiter update application status.
11. Candidate xem được status mới.
12. Unauthorized user không truy cập được CV/application không thuộc quyền.
13. Có migration và seed.
14. Có test cho scoring.
15. Có README setup.
16. Có tài liệu kiến trúc.
17. Có báo cáo giới hạn của matching v1.
18. Có backlog rõ ràng cho giai đoạn đồ án hoàn chỉnh.

---

# 18. Demo script đề xuất

## Demo 8–12 phút

### Phần 1 — Recruiter
- Login recruiter.
- Tạo/publish job Full Stack Developer.
- Chọn skills:
  - React required;
  - Node.js required;
  - PostgreSQL required;
  - Docker preferred;
  - 2 years experience.

### Phần 2 — Candidate
- Login candidate.
- Upload CV.
- Hệ thống parse CV.
- Xem job.
- Apply.

### Phần 3 — AI
- Mở application.
- Hiển thị:
  - overall score;
  - skill score;
  - experience score;
  - education score;
  - matched skills;
  - missing skills.

### Phần 4 — Recruiter workflow
- Recruiter xem applicant.
- Update status sang REVIEWING/INTERVIEW.
- Candidate xem trạng thái mới.

### Phần 5 — Kết luận
Nêu rõ:
- Matching hiện tại là rule/keyword-based.
- Đây là baseline.
- Giai đoạn đồ án sẽ nâng cấp sang semantic matching, ranking, recommendation, explainability và evaluation.

---

# 19. Deliverables bắt buộc

## Source
- Frontend repository.
- Backend repository.
- AI module/service nếu có.
- Migration.
- Seed script.
- Docker config nếu có.

## Tài liệu
- Requirement specification.
- Use case diagram.
- Activity/sequence diagrams cho luồng chính.
- ERD.
- Architecture diagram.
- API documentation.
- Test plan.
- Test report.
- Deployment guide.
- User guide ngắn.
- Báo cáo thực tập.

## Demo
- Demo dataset.
- CV mẫu.
- Job mẫu.
- Demo account.
- Demo script.

---

# 20. Rủi ro và phương án xử lý

## R1 — CV parse không ổn định
Giải pháp:
- chỉ hỗ trợ PDF text-based;
- không hứa OCR;
- dùng skill dictionary;
- hiển thị parse status;
- cho phép candidate kiểm tra parsed skills nếu cần.

## R2 — Scope quá lớn
Giải pháp:
- freeze MVP cuối tuần 2;
- mọi feature mới đưa vào backlog giai đoạn 2.

## R3 — AI bị hội đồng hỏi “AI ở đâu?”
Giải pháp:
- giải thích rõ baseline NLP/AI pipeline;
- có extraction, normalization, feature matching, scoring;
- trình bày đây là baseline để so sánh với semantic model ở giai đoạn sau.

## R4 — Score thiếu thuyết phục
Giải pháp:
- score breakdown;
- công thức minh bạch;
- test case;
- versioning;
- không gọi score là “khả năng được tuyển”.

## R5 — File CV gây lộ dữ liệu
Giải pháp:
- private access;
- authorization;
- không public bucket;
- dùng dữ liệu demo có quyền sử dụng.

---

# 21. Những gì phải để lại cho giai đoạn Đồ án tốt nghiệp

Không hoàn thiện quá sớm các hạng mục sau:

- Semantic embedding.
- Vector similarity.
- Candidate ranking.
- Job recommendation.
- AI explanation bằng LLM.
- Evaluation dataset lớn.
- Ranking metrics.
- Fairness analysis.
- Recruiter analytics.
- Recommendation feedback loop.
- Async AI processing hoàn chỉnh.
- Observability nâng cao.
- Production hardening.

Giai đoạn thực tập chỉ cần tạo **baseline đủ tốt để làm mốc so sánh**.

---

# 22. Backlog chuyển tiếp sang giai đoạn 2

Ngay khi kết thúc thực tập, lưu lại:

- hạn chế parser;
- hạn chế keyword matching;
- false positive/false negative;
- alias chưa xử lý;
- các CV layout khó;
- yêu cầu performance;
- feedback của giảng viên;
- feedback của người dùng thử;
- feature requests;
- dữ liệu phục vụ evaluation.

Backlog này là đầu vào chính cho kế hoạch Đồ án tốt nghiệp hoàn chỉnh.

---

# 23. Checklist kết thúc

## Product
- [ ] Auth hoàn chỉnh.
- [ ] Candidate profile.
- [ ] Company.
- [ ] Job CRUD.
- [ ] Resume upload.
- [ ] Application.
- [ ] Recruiter applicant management.
- [ ] Matching v1.
- [ ] Match result UI.
- [ ] Admin basic.

## Engineering
- [ ] Migration.
- [ ] Seed.
- [ ] Validation.
- [ ] Error handling.
- [ ] Logging.
- [ ] Unit test scoring.
- [ ] Integration tests.
- [ ] Authorization tests.
- [ ] `.env.example`.
- [ ] README.
- [ ] Deployment.

## Documentation
- [ ] Requirement.
- [ ] Use case.
- [ ] ERD.
- [ ] Architecture.
- [ ] API.
- [ ] Test report.
- [ ] Demo script.
- [ ] Internship report.
- [ ] Backlog giai đoạn 2.

---

# 24. Định nghĩa “thành công” cho giai đoạn thực tập

Phiên bản thực tập thành công khi có thể chứng minh bằng một demo ổn định:

**Recruiter đăng job -> Candidate upload CV -> Candidate ứng tuyển -> hệ thống phân tích CV và JD -> tạo điểm phù hợp -> Recruiter xem kết quả -> Recruiter cập nhật trạng thái -> Candidate theo dõi trạng thái.**

Không cần giai đoạn này phải có AI phức tạp. Điều quan trọng là có một **baseline rõ ràng, đo được, giải thích được, có dữ liệu lưu trữ và có kiến trúc đủ tốt để nâng cấp ở giai đoạn 2**.
