# HireSense — Database Architecture & Evolution Guide

> **Canonical path trong repository:** `hiresense/docs/DATABASE.md`  
> **Trạng thái:** Source of Truth cho thiết kế database  
> **Project:** HireSense  
> **Database:** PostgreSQL 18 + pgvector  
> **ORM chính:** Prisma  
> **AI Service:** FastAPI  
> **Timezone chuẩn:** UTC  
> **Primary key chuẩn:** UUIDv7 do PostgreSQL sinh  
> **Phạm vi:** Foundation → Thực tập tốt nghiệp → V1 → V2 → Future

---

# 1. Mục tiêu của tài liệu

Tài liệu này định nghĩa kiến trúc database chính thức của HireSense và là nguồn tham chiếu thống nhất khi:

- thiết kế `schema.prisma`;
- tạo Prisma migration;
- viết custom SQL migration;
- xây NestJS service/repository;
- xây FastAPI AI pipeline;
- thiết kế CV parsing;
- thiết kế CV–JD matching;
- triển khai semantic search bằng pgvector;
- triển khai candidate ranking;
- triển khai job recommendation;
- triển khai audit, notification và background jobs;
- viết tài liệu kiến trúc và báo cáo đồ án.

Mục tiêu chính:

1. MVP thực tập triển khai nhanh nhưng không tạo technical debt nghiêm trọng.
2. V1 mở rộng nghiệp vụ tuyển dụng mà không phá schema cũ.
3. V2 thêm embeddings, semantic matching, ranking và recommendation mà không đổi database.
4. Kết quả AI tái lập được theo đúng CV version, JD version, model version và pipeline version.
5. Transactional data được chuẩn hóa và enforce integrity ở database level.
6. AI/vector data là derived data, có thể rebuild.
7. Mọi thời gian backend/database thống nhất theo UTC.

---

# 2. Các giai đoạn database

## 2.1. Phase 0 — Foundation

Foundation là lớp hạ tầng database bắt buộc trước khi triển khai chức năng:

- PostgreSQL 18.
- pgvector.
- UUIDv7.
- UTC.
- required extensions.
- naming convention.
- timestamp convention.
- common functions/triggers.
- migration convention.
- Prisma/custom SQL boundary.

## 2.2. Phase Internship — Thực tập tốt nghiệp

Mục tiêu:

> Hoàn thành luồng tuyển dụng end-to-end và baseline AI matching.

Luồng bắt buộc:

```text
Recruiter
  -> Company
  -> Job + Job Version
  -> Publish

Candidate
  -> Profile
  -> Resume + Resume Version
  -> Apply

System
  -> Parse Resume
  -> Match Resume Version với Job Version
  -> Persist Score

Recruiter
  -> Review Application
  -> Change Stage

Candidate
  -> Track Application
```

Database phải hỗ trợ:

- authentication;
- candidate;
- recruiter/company;
- jobs;
- immutable JD versions;
- CV storage/versioning;
- applications;
- recruitment stages;
- baseline CV parsing;
- baseline CV–JD matching;
- score breakdown;
- audit tối thiểu.

## 2.3. Phase V1 — Recruitment Product

V1 mở rộng sản phẩm sau MVP:

- skill taxonomy đầy đủ;
- skill aliases;
- candidate declared skills;
- structured experience/education;
- JD structured requirements;
- recruiter notes;
- saved jobs;
- interview workflow;
- notifications;
- audit log đầy đủ;
- fuzzy/full-text search;
- AI model/pipeline registry;
- async AI jobs.

## 2.4. Phase V2 — Intelligent Matching Platform

V2 là phần AI nâng cao:

- semantic documents;
- embeddings bằng pgvector;
- semantic similarity;
- hybrid matching;
- AI evidences;
- explainable AI;
- candidate ranking;
- job recommendation;
- AI feedback;
- model/pipeline experimentation;
- vector indexing khi benchmark chứng minh cần.

## 2.5. Future

Chỉ thêm khi thật sự cần:

- multi-tenant organization nâng cao;
- custom hiring pipelines;
- recruiter collaboration nâng cao;
- calendar/email integrations;
- warehouse/OLAP;
- partitioning;
- read replicas;
- RLS;
- CDC;
- external search engine;
- model training datasets lớn.

---

# 3. Quyết định kiến trúc bắt buộc

## 3.1. PostgreSQL + pgvector là Source of Truth

HireSense dùng **một PostgreSQL + pgvector** làm transactional source of truth.

Không tách:

```text
business database
+
vector database
```

trong phạm vi đồ án.

Vector search nằm cùng PostgreSQL để:

- giữ relational integrity;
- giảm operational complexity;
- query business filters cùng semantic score;
- dễ transaction/versioning;
- tránh sync hai database.

## 3.2. Database-generated UUIDv7

Mọi primary key:

```sql
id uuid PRIMARY KEY DEFAULT uuidv7()
```

Không dùng:

- serial;
- bigserial;
- UUIDv4 mặc định;
- ID do frontend sinh;
- custom timestamp-random ID.

Prisma:

```prisma
id String @id @default(dbgenerated("uuidv7()")) @db.Uuid
```

PostgreSQL 18 có `uuidv7()` native, nên **không cần `uuid-ossp`**.

## 3.3. UUID không thay thế timestamp

Dù UUIDv7 time-ordered, entity vẫn phải có:

```sql
created_at timestamptz(6) NOT NULL DEFAULT now()
```

UUID là identifier, không phải business timestamp.

---

# 4. Timezone policy — UTC only

## 4.1. Database event timestamps

Dùng:

```sql
timestamptz(6)
```

cho:

- `created_at`;
- `updated_at`;
- `published_at`;
- `applied_at`;
- `scheduled_start_at`;
- `scheduled_end_at`;
- `expires_at`;
- `deleted_at`;
- AI processing timestamps.

Không dùng `timestamp without time zone` cho business events.

## 4.2. Database timezone

```sql
ALTER DATABASE hiresense SET timezone TO 'UTC';
```

Nếu có app role:

```sql
ALTER ROLE hiresense_app SET timezone TO 'UTC';
```

Kiểm tra:

```sql
SHOW timezone;
```

Expected:

```text
UTC
```

## 4.3. NestJS

API trả ISO-8601 UTC:

```text
2026-08-16T08:30:00.000Z
```

## 4.4. FastAPI

Datetime phải timezone-aware:

```python
datetime.now(timezone.utc)
```

## 4.5. Frontend

Frontend convert UTC instant sang timezone hiển thị của user.

Candidate có thể lưu timezone preference:

```text
Asia/Bangkok
Asia/Ho_Chi_Minh
```

nhưng timestamps trong DB vẫn là UTC.

---

# 5. PostgreSQL extensions

Foundation migration bật toàn bộ extension cần cho roadmap HireSense:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;
```

## 5.1. `vector`

Bắt buộc cho:

- CV embeddings;
- JD embeddings;
- semantic similarity;
- candidate ranking;
- job recommendation;
- semantic search.

## 5.2. `pg_trgm`

Dùng cho:

- fuzzy search;
- typo tolerance;
- job/company/skill search;
- skill alias similarity;
- tăng tốc `LIKE` / `ILIKE` với trigram index.

Ví dụ:

```sql
CREATE INDEX skills_normalized_name_trgm_idx
ON skills
USING gin (normalized_name gin_trgm_ops);
```

## 5.3. `unaccent`

Dùng cho accent-insensitive Vietnamese search.

Ví dụ concept:

```text
lập trình viên
lap trinh vien
```

Canonical data vẫn lưu Unicode nguyên bản.

Không biến dữ liệu lưu thành text đã bỏ dấu.

## 5.4. `citext`

Dùng cho case-insensitive identity đơn giản, đặc biệt email:

```sql
email citext NOT NULL UNIQUE
```

`Mew@example.com` và `mew@example.com` không tạo hai account.

Không dùng `citext` thay skill taxonomy.

## 5.5. `pgcrypto`

Dùng cho:

- `digest()`;
- content hash;
- SHA-256 helpers;
- document dedup/cache keys.

Ví dụ:

```sql
encode(digest(content, 'sha256'), 'hex')
```

Password hashing vẫn ở application layer.

## 5.6. `btree_gist`

Chuẩn bị cho exclusion constraints:

- interview scheduling;
- chống overlapping ranges theo resource/user.

Không nhất thiết dùng trong Internship nhưng bật từ Foundation để schema evolution thống nhất.

## 5.7. Không cần

Không bật nếu không có use case:

```text
uuid-ossp
btree_gin
fuzzystrmatch
hstore
```

`uuid-ossp` không cần vì PostgreSQL 18 có UUIDv7 native.

## 5.8. Verify

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname IN (
  'vector',
  'pg_trgm',
  'unaccent',
  'citext',
  'pgcrypto',
  'btree_gist'
)
ORDER BY extname;
```

---

# 6. Foundation migration

Tên đề xuất:

```text
0000_foundation
```

SQL:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER DATABASE hiresense SET timezone TO 'UTC';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

Extension/custom PostgreSQL features phải nằm trong migration và commit Git.

---

# 7. Naming convention

## Tables

Plural + `snake_case`:

```text
users
candidate_profiles
job_versions
application_match_runs
```

## Columns

```text
created_at
candidate_profile_id
current_stage_id
```

## Primary key

```text
id
```

## Foreign key columns

```text
user_id
company_id
job_version_id
```

## Index

```text
<table>_<purpose>_idx
```

## Unique constraint/index

```text
<table>_<purpose>_uq
```

## Check

```text
<table>_<rule>_chk
```

---

# 8. Common timestamp convention

Mutable entity:

```text
id
created_at
updated_at
```

Soft deletable entity khi thật sự cần:

```text
deleted_at
```

Append-only event:

```text
id
created_at
```

Không có `updated_at`.

---

# 9. Updated-at policy

Mutable tables dùng trigger `set_updated_at()` để không phụ thuộc developer nhớ set timestamp.

Áp dụng cho:

- users;
- candidate_profiles;
- recruiter_profiles;
- companies;
- company_memberships;
- resumes;
- jobs;
- notifications nếu cần.

Không áp dụng:

- audit logs;
- histories;
- completed AI runs.

---

# 10. Delete policy

## CASCADE

Chỉ khi child không có ý nghĩa độc lập.

Ví dụ:

```text
resume_parse_run -> resume_sections
```

## RESTRICT

Dữ liệu lịch sử:

```text
application -> job_version
application -> resume_version
```

Không được xóa một version đã được dùng trong application.

## SET NULL

Optional historical actor/reference khi hợp lý:

```text
audit_logs.actor_user_id
```

---

# 11. Soft delete

Có thể soft-delete:

```text
users
companies
resumes
application_notes
file_objects
```

Không soft-delete history:

```text
application_stage_history
resume_parse_runs
application_match_runs
match_score_components
match_evidences
audit_logs
outbox_events
```

---

# 12. JSONB policy

JSONB dùng cho:

- provider metadata;
- raw AI outputs;
- model config;
- warnings;
- audit before/after;
- variable explanation metadata.

Không dùng JSONB cho dữ liệu cần:

- FK;
- UNIQUE;
- JOIN;
- filter thường xuyên;
- aggregation;
- ranking.

Canonical skills không được lưu chỉ dưới dạng:

```json
["React", "Node.js", "PostgreSQL"]
```

---

# 13. Numeric policy

## Scores

```sql
numeric(5,2)
```

Constraint:

```sql
CHECK (score BETWEEN 0 AND 100)
```

## Weights

```sql
numeric(7,6)
```

Constraint:

```sql
CHECK (weight BETWEEN 0 AND 1)
```

## Money

```sql
numeric(19,4)
```

và:

```text
currency char(3)
```

Không dùng float cho tiền hoặc score nghiệp vụ.

---

# 14. Experience duration

Lưu theo tháng:

```text
experience_months integer
```

Không lưu float year.

Ví dụ:

```text
18 months
```

Frontend render:

```text
1 year 6 months
```

---

# 15. Module Identity & Authentication

## 15.1. `users`

**Phase:** Internship

| Column | Type | Rule |
|---|---|---|
| `id` | uuid | PK, default uuidv7() |
| `email` | citext | NOT NULL, UNIQUE |
| `password_hash` | text | NOT NULL |
| `status` | text | NOT NULL |
| `email_verified_at` | timestamptz(6) | nullable |
| `last_login_at` | timestamptz(6) | nullable |
| `created_at` | timestamptz(6) | default now |
| `updated_at` | timestamptz(6) | default now |
| `deleted_at` | timestamptz(6) | nullable |

Status:

```text
ACTIVE
DISABLED
PENDING_VERIFICATION
DELETED
```

Không lưu role trực tiếp trong `users`.

## 15.2. `roles`

**Phase:** Internship

Seed:

```text
CANDIDATE
RECRUITER
ADMIN
```

Columns:

```text
id
code UNIQUE
name
description
created_at
```

## 15.3. `user_roles`

**Phase:** Internship

```text
id
user_id
role_id
created_at
```

Constraint:

```text
UNIQUE(user_id, role_id)
```

Một user có thể vừa Candidate vừa Recruiter.

## 15.4. `auth_sessions`

**Phase:** Internship

```text
id
user_id
refresh_token_hash
device_name
user_agent
ip_address
expires_at
revoked_at
last_used_at
created_at
```

Index:

```text
(user_id, expires_at)
```

Không lưu raw refresh token.

## 15.5. `auth_tokens`

**Phase:** Internship

Dùng cho:

```text
EMAIL_VERIFICATION
PASSWORD_RESET
```

Columns:

```text
id
user_id
token_type
token_hash
expires_at
consumed_at
created_at
```

---

# 16. Candidate module

## 16.1. `candidate_profiles`

**Phase:** Internship

```text
id
user_id UNIQUE
full_name
phone
headline
summary
city
region
country_code
timezone
experience_months_declared
portfolio_url
github_url
linkedin_url
created_at
updated_at
```

`timezone` là preference hiển thị, không thay UTC DB policy.

## 16.2. `candidate_skills`

**Phase:** V1

Candidate tự khai báo:

```text
id
candidate_profile_id
skill_id
proficiency_level
experience_months
source
created_at
updated_at
```

Unique:

```text
UNIQUE(candidate_profile_id, skill_id)
```

Source:

```text
SELF_DECLARED
VERIFIED
```

Không trộn với `resume_skills` do AI parse.

## 16.3. `candidate_job_preferences`

**Phase:** V2

Có thể gồm:

```text
id
candidate_profile_id UNIQUE
preferred_titles
preferred_employment_types
preferred_workplace_types
preferred_countries
preferred_cities
salary_min
salary_currency
is_open_to_work
created_at
updated_at
```

Preference arrays chấp nhận được nếu query đơn giản. Khi business phức tạp mới normalize.

---

# 17. Recruiter & Company

## 17.1. `recruiter_profiles`

**Phase:** Internship

```text
id
user_id UNIQUE
full_name
phone
job_title
created_at
updated_at
```

Không đặt `company_id` trực tiếp.

## 17.2. `industries`

**Phase:** V1

```text
id
code UNIQUE
name
description
is_active
created_at
```

## 17.3. `companies`

**Phase:** Internship

```text
id
name
slug
description
industry_id
website_url
logo_file_id
company_size_min
company_size_max
status
created_by_user_id
created_at
updated_at
deleted_at
```

Indexes:

```text
slug UNIQUE
status
name trigram
```

## 17.4. `company_memberships`

**Phase:** Internship

```text
id
company_id
user_id
role
status
joined_at
created_at
updated_at
```

Unique:

```text
UNIQUE(company_id, user_id)
```

Role:

```text
OWNER
ADMIN
RECRUITER
REVIEWER
```

Status:

```text
ACTIVE
INVITED
SUSPENDED
LEFT
```

Company authorization phải dựa trên membership, không chỉ role `RECRUITER`.

## 17.5. `company_invitations`

**Phase:** V1

```text
id
company_id
email
role
token_hash
invited_by_user_id
expires_at
accepted_at
created_at
```

---

# 18. Skill Taxonomy

## 18.1. `skill_categories`

**Phase:** Internship/V1

Seed:

```text
PROGRAMMING_LANGUAGE
FRONTEND
BACKEND
DATABASE
CLOUD
DEVOPS
TESTING
AI_ML
DATA
SOFT_SKILL
LANGUAGE
```

Columns:

```text
id
code UNIQUE
name
description
created_at
updated_at
```

## 18.2. `skills`

**Phase:** Internship

```text
id
category_id
name
normalized_name
description
is_active
created_at
updated_at
```

Unique:

```text
normalized_name
```

Trigram index:

```sql
CREATE INDEX skills_normalized_name_trgm_idx
ON skills
USING gin (normalized_name gin_trgm_ops);
```

## 18.3. `skill_aliases`

**Phase:** V1

```text
id
skill_id
alias
normalized_alias
created_at
```

Unique:

```text
normalized_alias
```

Ví dụ:

```text
Postgres
Postgre SQL
pgsql
```

đều map về:

```text
PostgreSQL
```

---

# 19. File Storage

## 19.1. `file_objects`

**Phase:** Internship

Không lưu PDF binary trong PostgreSQL.

```text
id
storage_provider
bucket
object_key
original_filename
mime_type
size_bytes
sha256
uploaded_by_user_id
status
created_at
deleted_at
```

Unique:

```text
UNIQUE(storage_provider, bucket, object_key)
```

File access luôn authorization qua entity sở hữu.

---

# 20. Resume

Resume phải versioned ngay từ Internship.

## 20.1. `resumes`

**Phase:** Internship

Logical resume:

```text
id
candidate_profile_id
name
is_default
current_version_id
created_at
updated_at
deleted_at
```

Partial unique:

```sql
CREATE UNIQUE INDEX resumes_one_default_per_candidate_uq
ON resumes(candidate_profile_id)
WHERE is_default = true
  AND deleted_at IS NULL;
```

## 20.2. `resume_versions`

**Phase:** Internship

```text
id
resume_id
version_no
file_object_id
created_by_user_id
created_at
```

Unique:

```text
UNIQUE(resume_id, version_no)
```

Version đã được application sử dụng là immutable.

## 20.3. Invariant

```text
Candidate apply bằng CV v2
Candidate upload CV v3
```

Application cũ vẫn:

```text
resume_version_id = v2
```

---

# 21. Resume AI Parsing

## 21.1. `resume_parse_runs`

**Phase:** Internship

Mỗi execution tạo một run:

```text
id
resume_version_id
pipeline_version_id
status
raw_text
raw_output jsonb
detected_language
warnings jsonb
started_at
completed_at
error_code
error_message
created_at
```

Status:

```text
PENDING
PROCESSING
SUCCEEDED
FAILED
```

Parser upgrade tạo run mới, không overwrite.

## 21.2. `resume_skills`

**Phase:** Internship

```text
id
parse_run_id
skill_id
confidence
evidence_text
created_at
```

Unique:

```text
UNIQUE(parse_run_id, skill_id)
```

## 21.3. `resume_experiences`

**Phase:** Internship/V1

```text
id
parse_run_id
company_name
job_title
start_date
end_date
is_current
description
experience_months
ordinal
confidence
created_at
```

Work dates dùng `date`, vì là calendar date chứ không phải instant.

## 21.4. `resume_educations`

**Phase:** Internship/V1

```text
id
parse_run_id
institution_name
degree
field_of_study
start_date
end_date
description
ordinal
confidence
created_at
```

## 21.5. `resume_projects`

**Phase:** V1/V2

```text
id
parse_run_id
name
description
start_date
end_date
project_url
ordinal
confidence
created_at
```

## 21.6. `resume_certifications`

**Phase:** V1/V2

```text
id
parse_run_id
name
issuer
issued_date
expires_date
credential_id
credential_url
confidence
created_at
```

## 21.7. `resume_languages`

**Phase:** V1/V2

```text
id
parse_run_id
language_code
proficiency
confidence
created_at
```

## 21.8. `resume_sections`

**Phase:** V2

```text
id
parse_run_id
section_type
ordinal
content
content_hash
token_count
created_at
```

Section types:

```text
SUMMARY
SKILLS
EXPERIENCE
PROJECT
EDUCATION
CERTIFICATION
OTHER
```

Mục tiêu: embedding theo section/chunk thay vì chỉ embedding toàn CV.

---

# 22. Jobs

Job phải versioned ngay từ Internship.

## 22.1. `jobs`

**Phase:** Internship

Identity/lifecycle:

```text
id
company_id
created_by_user_id
slug
status
current_published_version_id
first_published_at
closed_at
created_at
updated_at
deleted_at
```

Status:

```text
DRAFT
PUBLISHED
PAUSED
CLOSED
ARCHIVED
```

Index:

```text
(company_id, status)
```

## 22.2. `job_versions`

**Phase:** Internship

```text
id
job_id
version_no
version_status

title
summary
description
responsibilities
benefits

employment_type
workplace_type

experience_min_months
experience_max_months

salary_min
salary_max
salary_currency

created_by_user_id
published_at
created_at
```

Unique:

```text
UNIQUE(job_id, version_no)
```

Checks:

```text
experience_min_months >= 0

experience_max_months IS NULL
OR experience_max_months >= experience_min_months

salary_min IS NULL
OR salary_max IS NULL
OR salary_max >= salary_min
```

Published version immutable.

## 22.3. Lifecycle

```text
v1 DRAFT
 -> v1 PUBLISHED
 -> recruiter edits
 -> v2 DRAFT
 -> v2 PUBLISHED
```

Không sửa v1 sau publish.

## 22.4. `job_version_locations`

**Phase:** V1

```text
id
job_version_id
country_code
region
city
address_text
is_primary
created_at
```

## 22.5. `job_version_skills`

**Phase:** Internship

```text
id
job_version_id
skill_id
importance
is_required
weight
min_experience_months
created_at
```

Unique:

```text
UNIQUE(job_version_id, skill_id)
```

## 22.6. `job_version_requirements`

**Phase:** V1

```text
id
job_version_id
requirement_type
code
label
description
level
is_required
weight
metadata jsonb
created_at
```

Types:

```text
EDUCATION
LANGUAGE
CERTIFICATION
DOMAIN
OTHER
```

## 22.7. `job_parse_runs`

**Phase:** V2

AI parse JD thành suggestions:

```text
id
job_version_id
pipeline_version_id
status
raw_output jsonb
warnings jsonb
started_at
completed_at
error_code
error_message
created_at
```

AI suggestions không tự overwrite canonical `job_version_skills`.

Recruiter/business layer quyết định canonical requirements.

---

# 23. Application / ATS

## 23.1. `recruitment_stages`

**Phase:** Internship

```text
id
company_id
code
name
ordinal
is_terminal
terminal_outcome
is_active
created_at
updated_at
```

Defaults:

```text
APPLIED
SCREENING
SHORTLISTED
INTERVIEW
OFFER
HIRED
REJECTED
WITHDRAWN
```

System stages:

```text
company_id IS NULL
```

Về sau company có thể custom workflow.

## 23.2. `applications`

**Phase:** Internship

```text
id

job_id
job_version_id

candidate_profile_id
resume_version_id

current_stage_id
current_match_run_id

source
cover_letter

applied_at
withdrawn_at

created_at
updated_at
```

Unique:

```text
UNIQUE(job_id, candidate_profile_id)
```

Application phải giữ:

```text
job_id
job_version_id
resume_version_id
```

`job_version_id` và `resume_version_id` bảo đảm reproducibility.

## 23.3. `application_stage_history`

**Phase:** Internship

Append-only:

```text
id
application_id
from_stage_id
to_stage_id
changed_by_user_id
note
created_at
```

Index:

```text
(application_id, created_at DESC)
```

## 23.4. `application_notes`

**Phase:** V1

```text
id
application_id
author_user_id
content
visibility
created_at
updated_at
deleted_at
```

Visibility:

```text
PRIVATE
TEAM
```

## 23.5. `application_assignees`

**Phase:** V2/Future

```text
id
application_id
user_id
assignment_role
assigned_by_user_id
created_at
```

---

# 24. Interview

## 24.1. `interviews`

**Phase:** V1

```text
id
application_id
interview_type
status
scheduled_start_at
scheduled_end_at
timezone
location
meeting_url
notes
created_by_user_id
created_at
updated_at
```

Check:

```sql
CHECK (scheduled_end_at > scheduled_start_at)
```

Timestamps vẫn UTC.

`timezone` giữ context để hiển thị.

## 24.2. `interview_participants`

**Phase:** V1

```text
id
interview_id
user_id
participant_role
created_at
```

## 24.3. Optional overlap constraint

Khi cần chống double-book interviewer:

```text
btree_gist
+
tstzrange
+
EXCLUDE USING gist
```

---

# 25. Offers

## `offers`

**Phase:** V2/Future

```text
id
application_id
status
salary_amount
salary_currency
start_date
expires_at
sent_at
accepted_at
declined_at
created_by_user_id
created_at
updated_at
```

Không cần trong Internship.

---

# 26. AI Model Registry

## 26.1. `ai_models`

**Phase:** V1/V2

```text
id
code UNIQUE
provider
model_name
model_version
task_type
embedding_dimensions
distance_metric
config jsonb
is_active
created_at
```

Task:

```text
EMBEDDING
LLM
PARSER
RERANKER
CLASSIFIER
```

## 26.2. `ai_pipeline_versions`

**Phase:** Internship

```text
id
code UNIQUE
pipeline_type
semantic_version
code_revision
config jsonb
is_active
created_at
```

Examples:

```text
resume-parser-v1
matching-baseline-v1
matching-hybrid-v2
recommendation-v1
```

Mọi AI result trỏ về pipeline version.

---

# 27. AI Background Jobs

## `ai_jobs`

**Phase:** V1/V2

```text
id
job_type
entity_type
entity_id
pipeline_version_id
status
priority
attempt_count
max_attempts
available_at
started_at
completed_at
error_code
error_message
payload jsonb
created_at
updated_at
```

Status:

```text
PENDING
PROCESSING
SUCCEEDED
FAILED
RETRYING
CANCELLED
```

Không đưa raw CV vào queue payload nếu chỉ cần ID.

---

# 28. Matching

Không dùng `applications.match_score` làm source of truth.

## 28.1. `application_match_runs`

**Phase:** Internship

```text
id
application_id
resume_parse_run_id
job_version_id
pipeline_version_id
status
overall_score
started_at
completed_at
error_code
error_message
created_at
```

Check:

```text
overall_score IS NULL
OR overall_score BETWEEN 0 AND 100
```

Index:

```text
(application_id, created_at DESC)
```

## 28.2. Current match pointer

`applications.current_match_run_id` chỉ là pointer/cache.

Ví dụ:

```text
Application
  +-- baseline-v1 74.50
  +-- semantic-v1 81.20
  +-- hybrid-v2   86.30 <- current
```

## 28.3. `match_score_components`

**Phase:** Internship

```text
id
match_run_id
component_code
raw_score
weight
weighted_score
details jsonb
created_at
```

Unique:

```text
UNIQUE(match_run_id, component_code)
```

Internship components:

```text
SKILL
EXPERIENCE
EDUCATION
```

V2:

```text
SEMANTIC
DOMAIN
CERTIFICATION
LANGUAGE
```

## 28.4. `match_skill_results`

**Phase:** Internship

```text
id
match_run_id
job_version_skill_id
resume_skill_id
status
similarity_score
evidence_text
created_at
```

Status:

```text
MATCHED
PARTIAL
MISSING
```

---

# 29. Explainable AI

## 29.1. `match_evidences`

**Phase:** V2

```text
id
match_run_id
evidence_type
candidate_text
job_text
similarity_score
metadata jsonb
created_at
```

Types:

```text
SKILL
EXPERIENCE
PROJECT
EDUCATION
SEMANTIC
```

## 29.2. `match_explanations`

**Phase:** V2

```text
id
match_run_id
model_id
summary
strengths jsonb
gaps jsonb
warnings jsonb
created_at
```

Quy tắc:

> LLM explanation không tạo overall score.

Score tính trước bằng matching engine.

---

# 30. Semantic / Vector Layer

Không thêm embedding trực tiếp vào:

```text
jobs
job_versions
resumes
resume_versions
applications
```

Vector phụ thuộc vào:

```text
content version
model
dimensions
chunking strategy
pipeline version
```

## 30.1. `semantic_documents`

**Phase:** V2

Derived semantic corpus:

```text
id
source_type
source_id
section_type
ordinal
content
content_hash
metadata jsonb
created_at
```

Sources:

```text
RESUME_SECTION
JOB_VERSION
CANDIDATE_PROFILE
```

`content_hash` hỗ trợ:

- tránh re-embedding unchanged content;
- dedupe;
- cache.

## 30.2. Polymorphic source

`source_type + source_id` được chấp nhận ở semantic layer vì đây là **derived index**, không phải canonical business data.

Nếu bảng semantic mất, có thể rebuild.

## 30.3. `semantic_embeddings`

**Phase:** V2

```text
id
semantic_document_id
model_id
dimensions
embedding vector
created_at
```

Unique:

```text
UNIQUE(semantic_document_id, model_id)
```

## 30.4. Không khóa dimension trong master design

Dùng:

```sql
embedding vector
```

thay vì luôn:

```sql
embedding vector(1536)
```

để thử nhiều model.

Khi production model đã chốt, ANN index có thể cast dimension.

## 30.5. Exact search trước

Dataset đồ án nhỏ:

```text
exact nearest-neighbor
```

trước.

Không tạo ANN index chỉ để “có HNSW”.

## 30.6. HNSW khi benchmark cần

Ví dụ:

```sql
CREATE INDEX semantic_embeddings_model_hnsw_idx
ON semantic_embeddings
USING hnsw (
  (embedding::vector(1536)) vector_cosine_ops
)
WHERE model_id = '<MODEL_UUID>';
```

Một index/model/dimension phù hợp.

## 30.7. Distance metric

Text embeddings mặc định ưu tiên cosine nếu model phù hợp.

Nhưng `ai_models.distance_metric` phải lưu rõ để application không hard-code không kiểm soát.

---

# 31. Prisma + pgvector boundary

Prisma quản lý phần relational thông thường.

Custom SQL/TypedSQL quản lý:

- extensions;
- pgvector;
- HNSW/IVFFlat;
- partial indexes;
- trigram indexes;
- exclusion constraints;
- specialized triggers.

Ví dụ Prisma:

```prisma
model SemanticEmbedding {
  id                 String   @id @default(dbgenerated("uuidv7()")) @db.Uuid
  semanticDocumentId String   @map("semantic_document_id") @db.Uuid
  modelId            String   @map("model_id") @db.Uuid
  dimensions         Int
  embedding          Unsupported("vector")
  createdAt          DateTime @default(now()) @map("created_at") @db.Timestamptz(6)

  @@map("semantic_embeddings")
}
```

Vector query phải được cô lập trong repository chuyên trách.

Không để `$queryRaw` rải rác khắp codebase.

---

# 32. Job Search Strategy

HireSense ưu tiên PostgreSQL trước Elasticsearch.

Ba tầng:

```text
Structured Filters
+
Text/Fuzzy Search
+
Semantic Search
```

## Structured

B-tree:

```text
status
location
employment_type
workplace_type
experience
salary
skills
company
```

## Fuzzy

`pg_trgm`:

```text
job title
company name
skills
aliases
```

## Vietnamese

`unaccent` + lower normalization.

## Semantic

V2:

```text
query text
 -> embedding
 -> semantic_embeddings
 -> top K
 -> business filters/rerank
```

---

# 33. Recommendation

## 33.1. `recommendation_runs`

**Phase:** V2

```text
id
candidate_profile_id
pipeline_version_id
status
started_at
completed_at
created_at
```

## 33.2. `job_recommendations`

**Phase:** V2

```text
id
recommendation_run_id
job_id
job_version_id
rank
overall_score
reasons jsonb
missing_skills jsonb
created_at
```

Unique:

```text
UNIQUE(recommendation_run_id, job_id)
```

Recommendation phải reproducible theo pipeline version.

---

# 34. Candidate Ranking

Không cần bảng ranking riêng ở đầu V2.

Có thể query:

```text
Job
 -> Applications
 -> current_match_run
 -> overall_score DESC
```

Chỉ thêm:

```text
ranking_runs
ranking_items
```

khi cần snapshot ranking phục vụ experiment.

---

# 35. AI Feedback

## `ai_feedback`

**Phase:** V2

```text
id
user_id
match_run_id
recommendation_id
feedback_type
rating
comment
created_at
```

Exactly one target:

```text
match_run_id XOR recommendation_id
```

Feedback:

```text
RELEVANT
NOT_RELEVANT
SCORE_TOO_HIGH
SCORE_TOO_LOW
USEFUL_RECOMMENDATION
NOT_USEFUL_RECOMMENDATION
```

Dùng offline evaluation trước, không auto online-learning.

---

# 36. Saved Jobs

## `saved_jobs`

**Phase:** V1

```text
id
candidate_profile_id
job_id
created_at
```

Unique:

```text
UNIQUE(candidate_profile_id, job_id)
```

---

# 37. Notifications

## `notifications`

**Phase:** V1

```text
id
user_id
notification_type
title
body
data jsonb
read_at
created_at
```

Index:

```text
(user_id, read_at, created_at DESC)
```

DB giữ state unread/read.

Delivery channel có thể là web/email/realtime.

---

# 38. Audit

## `audit_logs`

**Phase:** V1

Append-only:

```text
id
actor_user_id
company_id
action
entity_type
entity_id
request_id
before_data jsonb
after_data jsonb
created_at
```

Audit:

```text
USER_DISABLED
COMPANY_UPDATED
JOB_PUBLISHED
JOB_CLOSED
APPLICATION_STAGE_CHANGED
AI_ANALYSIS_RETRIED
```

Không log secrets.

---

# 39. Transactional Outbox

## `outbox_events`

**Phase:** V2

```text
id
event_type
aggregate_type
aggregate_id
payload jsonb
occurred_at
processed_at
attempt_count
last_error
created_at
```

Ví dụ:

```text
BEGIN
  INSERT application
  INSERT stage history
  INSERT outbox APPLICATION_CREATED
COMMIT
```

Worker xử lý AI/notification/email sau.

---

# 40. Index Strategy

Index phục vụ query cụ thể.

## Identity

```text
users.email UNIQUE
auth_sessions(user_id, expires_at)
```

## Company

```text
companies.slug UNIQUE
companies(status)
company_memberships(company_id, user_id) UNIQUE
company_memberships(user_id, status)
```

## Skill

```text
skills.normalized_name UNIQUE
skill_aliases.normalized_alias UNIQUE
GIN trigram indexes
```

## Jobs

```text
jobs(company_id, status)
job_versions(job_id, version_no) UNIQUE
job_versions(job_id, published_at DESC)
job_version_skills(job_version_id, skill_id) UNIQUE
job_version_skills(skill_id, is_required)
```

## Resume

```text
resumes(candidate_profile_id, deleted_at)
resume_versions(resume_id, version_no) UNIQUE
resume_parse_runs(resume_version_id, created_at DESC)
resume_skills(parse_run_id, skill_id) UNIQUE
```

## Applications

```text
applications(job_id, candidate_profile_id) UNIQUE
applications(job_id, current_stage_id, applied_at DESC)
applications(candidate_profile_id, applied_at DESC)
application_stage_history(application_id, created_at DESC)
```

## AI

```text
application_match_runs(application_id, created_at DESC)
match_score_components(match_run_id, component_code) UNIQUE
match_skill_results(match_run_id, job_version_skill_id)
ai_jobs(status, priority, available_at)
```

## Recommendation

```text
recommendation_runs(candidate_profile_id, created_at DESC)
job_recommendations(recommendation_run_id, rank)
```

---

# 41. Data Ownership

## Candidate

```text
User
 -> CandidateProfile
 -> Resume
 -> ResumeVersion
```

Candidate chỉ quản lý resource thuộc mình.

## Company

```text
User
 -> CompanyMembership
 -> Company
 -> Job
 -> Application
```

Recruiter permission dựa trên active membership.

## Application

Recruiter xem application khi job thuộc company mà recruiter có active membership.

---

# 42. Privacy

CV là sensitive user content.

Không:

- public permanent URL;
- raw CV trong logs;
- raw CV trong analytics không cần thiết;
- recruiter truy cập candidate unrelated nếu product chưa hỗ trợ sourcing.

---

# 43. Retention

## Resume delete

- mark `resumes.deleted_at`;
- file có thể scheduled delete;
- version được application tham chiếu không hard-delete ngay.

## Application

Không hard-delete trong normal workflow.

Withdrawal:

```text
stage = WITHDRAWN
withdrawn_at = now()
```

## Audit

Append-only.

---

# 44. Immutable Records

Sau finalized, các record sau không update nội dung:

```text
published job_versions
resume_versions
completed resume_parse_runs
completed application_match_runs
match_score_components
match_skill_results
match_evidences
audit_logs
```

Thay đổi bằng new version/run.

---

# 45. Reproducibility Invariant

Một match result phải truy được:

```text
Application
  +-- Job Version
  +-- Resume Version
       +-- Resume Parse Run
  +-- Pipeline Version
  +-- Match Run
```

V2 thêm:

```text
AI Model
Embedding Model
Semantic Documents
Embeddings
```

Nếu không reconstruct được exact inputs/version thì result không đạt chuẩn nghiên cứu.

---

# 46. Internship Scope — Tables

Bắt buộc:

```text
users
roles
user_roles
auth_sessions
auth_tokens

candidate_profiles
recruiter_profiles

companies
company_memberships

skill_categories
skills

file_objects

resumes
resume_versions

jobs
job_versions
job_version_skills

recruitment_stages
applications
application_stage_history

ai_pipeline_versions

resume_parse_runs
resume_skills
resume_experiences
resume_educations

application_match_runs
match_score_components
match_skill_results
```

---

# 47. Internship Database Definition of Done

- [ ] Required extensions được enable bằng migration.
- [ ] Database timezone = UTC.
- [ ] Mọi PK dùng DB-generated UUIDv7.
- [ ] Auth schema hoàn chỉnh.
- [ ] Candidate/Recruiter profile tách riêng.
- [ ] Company membership hoạt động.
- [ ] Skill taxonomy tồn tại.
- [ ] Job versioning hoạt động.
- [ ] Resume versioning hoạt động.
- [ ] Application giữ exact Job Version.
- [ ] Application giữ exact Resume Version.
- [ ] Stage history append-only.
- [ ] CV parse result versioned.
- [ ] Match run versioned.
- [ ] Score components normalized.
- [ ] Constraints tồn tại.
- [ ] Query-critical indexes tồn tại.
- [ ] Seed roles/stages/categories/pipelines tồn tại.
- [ ] Migrations chạy từ empty DB thành công.
- [ ] Test DB dùng PostgreSQL + pgvector, không SQLite.

---

# 48. V1 Additions

Thêm:

```text
industries
skill_aliases
candidate_skills
company_invitations

job_version_locations
job_version_requirements

resume_projects
resume_certifications
resume_languages

application_notes

interviews
interview_participants

ai_models
ai_jobs

saved_jobs
notifications
audit_logs
```

---

# 49. V1 Definition of Done

- [ ] Skill aliases canonical hóa.
- [ ] Candidate-declared skills tách AI-extracted skills.
- [ ] Job structured requirements hoàn chỉnh.
- [ ] Multi-location ready.
- [ ] Interview scheduling lưu UTC.
- [ ] Notifications có read state.
- [ ] Audit append-only.
- [ ] AI jobs có retry trace.
- [ ] Search dùng structured + trigram + unaccent.
- [ ] Chưa cần Elasticsearch.

---

# 50. V2 Additions

```text
resume_sections
job_parse_runs

semantic_documents
semantic_embeddings

match_evidences
match_explanations

recommendation_runs
job_recommendations

ai_feedback
outbox_events
```

Optional:

```text
ranking_runs
ranking_items
offers
application_assignees
```

---

# 51. V2 Definition of Done

- [ ] Embeddings nằm ngoài canonical job/resume tables.
- [ ] Embedding gắn model version.
- [ ] Content hash tồn tại.
- [ ] Re-embedding không overwrite lịch sử không kiểm soát.
- [ ] Exact vector search chạy đúng.
- [ ] ANN index chỉ thêm sau benchmark.
- [ ] Hybrid matching lưu component scores.
- [ ] Evidence lưu riêng.
- [ ] Explanation không tạo score.
- [ ] Recommendation versioned theo run.
- [ ] Feedback không auto train online.
- [ ] Baseline/V2 chạy song song để compare.

---

# 52. Migration Roadmap

```text
0000_foundation
0001_identity
0002_profiles_companies
0003_skill_taxonomy
0004_file_resume
0005_jobs
0006_applications
0007_ai_baseline

0008_v1_taxonomy_requirements
0009_v1_interviews_notifications_audit
0010_v1_ai_jobs_models

0011_v2_semantic_documents
0012_v2_embeddings
0013_v2_explainability
0014_v2_recommendations
0015_v2_outbox_feedback
```

Không tạo một migration khổng lồ.

---

# 53. Seed Data

## Roles

```text
CANDIDATE
RECRUITER
ADMIN
```

## Recruitment stages

```text
APPLIED
SCREENING
SHORTLISTED
INTERVIEW
OFFER
HIRED
REJECTED
WITHDRAWN
```

## Skill categories

```text
PROGRAMMING_LANGUAGE
FRONTEND
BACKEND
DATABASE
CLOUD
DEVOPS
TESTING
AI_ML
DATA
SOFT_SKILL
LANGUAGE
```

## Pipelines

```text
resume-parser-v1
matching-baseline-v1
```

Seed phải idempotent.

---

# 54. Prisma Migration Policy

## Prisma quản lý tốt

- normal tables;
- normal columns;
- standard FK;
- standard unique;
- standard indexes;
- relations.

## Custom SQL quản lý

- extensions;
- pgvector;
- partial indexes;
- trigram indexes;
- HNSW/IVFFlat;
- exclusion constraints;
- triggers;
- advanced PostgreSQL-specific constraints.

Không làm database yếu hơn chỉ để mọi feature biểu diễn được hoàn toàn bằng Prisma DSL.

---

# 55. Prisma Conventions

Ví dụ:

```prisma
model User {
  id        String   @id @default(dbgenerated("uuidv7()")) @db.Uuid
  email     String   @unique @db.Citext
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @default(now()) @map("updated_at") @db.Timestamptz(6)

  @@map("users")
}
```

Database naming snake_case.

Application code có thể camelCase.

---

# 56. Transaction Boundaries

## Apply Job

Một transaction:

```text
create application
create APPLIED stage history
create AI job/outbox event
```

## Publish Job Version

```text
validate draft
publish job version
update jobs.current_published_version_id
update job lifecycle
```

## Change Application Stage

```text
update current_stage_id
insert stage history
insert notification/outbox
```

Không tách dependent writes thành independent requests.

---

# 57. Concurrency

Không chỉ kiểm tra bằng application code.

Ví dụ duplicate apply:

```text
UNIQUE(job_id, candidate_profile_id)
```

Database constraint là lớp bảo vệ cuối.

---

# 58. Full-Text Search

Nếu V1 cần FTS:

- PostgreSQL `tsvector`;
- GIN;
- `simple` config cho multi-language;
- `unaccent` trong ingestion/search normalization.

FTS-specific SQL nên nằm trong migration/repository riêng.

---

# 59. Hybrid Search V2

Pipeline:

```text
1. Authorization/business filters
2. Structured filters
3. Text/fuzzy retrieval
4. Vector similarity
5. Optional reranking
```

Không vector-search toàn database rồi mới kiểm tra authorization ở cuối.

---

# 60. Vector Indexing Policy

## Nhỏ

Exact query:

```text
ORDER BY embedding <=> query_vector
LIMIT K
```

## Khi lớn

Benchmark:

- latency;
- recall;
- memory;
- build time.

Sau đó mới thêm HNSW hoặc IVFFlat.

Không over-engineer ANN trong giai đoạn dataset nhỏ.

---

# 61. Test Database

Integration/E2E test phải dùng:

```text
PostgreSQL 18 + pgvector
```

với cùng extensions và UTC.

Không dùng SQLite thay PostgreSQL vì:

- vector;
- citext;
- trigram;
- GiST;
- partial indexes;
- PostgreSQL constraints

không được mô phỏng đúng.

---

# 62. Database Test Cases

## Identity

- email duplicate khác casing bị reject;
- invalid user-role FK reject.

## Company

- duplicate membership reject.

## Resume

- chỉ một default resume/candidate;
- duplicate version number reject;
- referenced resume version không xóa được.

## Job

- duplicate version number reject;
- invalid experience range reject;
- invalid salary range reject.

## Application

- duplicate application reject;
- application thiếu job_version reject;
- application thiếu resume_version reject.

## AI

- score > 100 reject;
- weight > 1 reject;
- duplicate component reject;
- invalid references reject.

---

# 63. Performance Review

## Sau Internship

Benchmark:

- job listing;
- application lists;
- recruiter applicant list;
- parse result writes.

## V1

- fuzzy job/skill search;
- dashboard queries.

## V2

- vector search;
- ranking;
- recommendations.

Dùng:

```sql
EXPLAIN (ANALYZE, BUFFERS)
```

cho query quan trọng.

---

# 64. Partitioning

Không partition sớm.

Chỉ cân nhắc Future với:

```text
audit_logs
notifications
ai_jobs
outbox_events
```

khi volume thực tế yêu cầu.

---

# 65. Row-Level Security

Không bật RLS mặc định trong Internship.

Authorization:

```text
NestJS authentication
+
RBAC
+
resource ownership
+
company membership
```

Schema vẫn giữ ownership columns để Future có thể thêm RLS.

---

# 66. Security Rules

- password hash không trả frontend;
- refresh/reset token chỉ lưu hash;
- CV files private;
- raw CV không vào log;
- DB credentials không commit;
- audit không chứa secret;
- external AI payload tối thiểu cần thiết.

---

# 67. Data Quality

Phân biệt:

```text
NULL = unknown
0 = known zero
```

Ví dụ:

```text
experience_months = NULL
```

không được tự coi là 0 năm kinh nghiệm.

---

# 68. AI Confidence

Nếu lưu confidence:

```text
0..1
```

Chỉ lưu khi pipeline có confidence có nghĩa.

Không fabricate confidence để UI đẹp hơn.

---

# 69. AI Failure

AI failure không rollback application.

```text
Application = CREATED
AI analysis = FAILED
```

Recruiter vẫn xem được hồ sơ.

AI có thể retry.

---

# 70. Model Upgrade

Khi embedding model thay đổi:

```text
new ai_model
new embeddings
```

Không overwrite không trace.

---

# 71. Matching Upgrade

Scoring formula mới:

```text
matching-baseline-v1
matching-baseline-v1.1
matching-hybrid-v2
```

Tạo match run mới.

Không sửa result cũ.

---

# 72. Canonical vs Derived Data

## Canonical

```text
users
candidate_profiles
companies
memberships
jobs
job_versions
job_version_skills
resumes
resume_versions
applications
stage_history
```

## Derived

```text
parse runs
AI extracted skills
semantic documents
embeddings
match runs
recommendations
```

Derived có thể rebuild, nhưng một số history vẫn giữ phục vụ research/audit.

---

# 73. Master Relationship View

```text
User
├── UserRole ───── Role
├── AuthSession
├── CandidateProfile
│   ├── CandidateSkill ───── Skill
│   └── Resume
│       └── ResumeVersion
│           └── ResumeParseRun
│               ├── ResumeSkill ───── Skill
│               ├── ResumeExperience
│               ├── ResumeEducation
│               ├── ResumeProject
│               └── ResumeSection
│
└── RecruiterProfile

User
  └── CompanyMembership
        └── Company
              └── Job
                    └── JobVersion
                          ├── JobVersionSkill ───── Skill
                          ├── JobVersionLocation
                          └── JobVersionRequirement
```

ATS:

```text
CandidateProfile
      |
      v
 Application
      |
      +---- Job
      +---- JobVersion
      +---- ResumeVersion
      +---- RecruitmentStage
      +---- ApplicationStageHistory
      |
      +---- ApplicationMatchRun
              +---- MatchScoreComponent
              +---- MatchSkillResult
              +---- MatchEvidence
              +---- MatchExplanation
```

Semantic:

```text
Canonical Sources
      |
      v
SemanticDocument
      |
      v
SemanticEmbedding
      |
      +---- AIModel
      |
      +---- Matching / Recommendation / Search
```

---

# 74. Recommended Implementation Order

## Step 1 — Foundation

```text
extensions
UTC
uuidv7
updated_at
```

## Step 2 — Identity

```text
users
roles
user_roles
auth_sessions
auth_tokens
```

## Step 3 — Profiles/Company

```text
candidate_profiles
recruiter_profiles
companies
company_memberships
```

## Step 4 — Skills

```text
skill_categories
skills
```

## Step 5 — File/Resume

```text
file_objects
resumes
resume_versions
```

## Step 6 — Jobs

```text
jobs
job_versions
job_version_skills
```

## Step 7 — Applications

```text
recruitment_stages
applications
application_stage_history
```

Recruitment core hoàn thành ở đây.

## Step 8 — AI Baseline

```text
ai_pipeline_versions
resume_parse_runs
resume_skills
resume_experiences
resume_educations
application_match_runs
match_score_components
match_skill_results
```

Đủ database scope cho Thực tập.

## Step 9 — V1

Thêm product features.

## Step 10 — V2

Thêm pgvector semantic layer.

---

# 75. Architecture Decisions không thay đổi tùy tiện

Các quyết định được xem là locked architecture:

1. PostgreSQL + pgvector.
2. PostgreSQL 18+ để dùng native UUIDv7.
3. UUIDv7 database-generated.
4. UTC + `timestamptz`.
5. Job versioning.
6. Resume versioning.
7. Application giữ exact Job/Resume versions.
8. AI result theo versioned runs.
9. Vector layer tách canonical data.
10. Skill taxonomy canonical.
11. Company authorization qua membership.
12. AI chỉ hỗ trợ quyết định.
13. Relational data không nhét tùy tiện vào JSONB.
14. Prisma không làm giảm PostgreSQL capability.

Nếu thay đổi một quyết định, cập nhật tài liệu này trước rồi mới code.

---

# 76. Foundation Verification Script

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER DATABASE hiresense SET timezone TO 'UTC';

SHOW timezone;

SELECT uuidv7();

SELECT
  extname,
  extversion
FROM pg_extension
WHERE extname IN (
  'vector',
  'pg_trgm',
  'unaccent',
  'citext',
  'pgcrypto',
  'btree_gist'
)
ORDER BY extname;
```

Expected:

```text
timezone = UTC
uuidv7() returns valid UUID v7
all six extensions installed
```

---

# 77. Final Target Architecture

```text
PostgreSQL 18 + pgvector
│
├── Native UUIDv7
├── UTC / timestamptz
├── citext identity
├── pg_trgm fuzzy search
├── unaccent Vietnamese search
├── pgcrypto hashing helpers
├── btree_gist advanced constraints
│
├── Normalized Transactional Core
│   ├── Identity
│   ├── Candidate
│   ├── Company
│   ├── Skills
│   ├── Jobs
│   ├── Resumes
│   └── Applications
│
├── Immutable / Versioned Content
│   ├── Job Versions
│   ├── Resume Versions
│   ├── Parse Runs
│   └── Match Runs
│
├── AI Derived Layer
│   ├── Model Registry
│   ├── Pipeline Registry
│   ├── Evidence
│   └── Explanation
│
└── Semantic Layer
    ├── Semantic Documents
    ├── Embeddings
    ├── Vector Search
    ├── Candidate Ranking
    └── Job Recommendation
```

---

# 78. Kết luận

HireSense phải đồng thời là:

1. một recruitment system có relational integrity tốt;
2. một nền tảng nghiên cứu CV–JD matching có khả năng tái lập.

Ba nguyên tắc cốt lõi:

```text
Versioned Job
+
Versioned Resume
+
Versioned AI Runs
```

Semantic/vector data luôn gắn với:

```text
exact content
+
exact model
+
exact pipeline
```

Nhờ vậy:

```text
Internship
  baseline parsing + matching

        ↓

V1
  recruitment product hoàn chỉnh

        ↓

V2
  embeddings + semantic matching
  + ranking + recommendation
  + explainability
```

có thể phát triển liên tục mà không phải phá nền tảng database.
