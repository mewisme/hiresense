-- HireSense baseline init
-- PostgreSQL 18 + pgvector

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  EXECUTE format(
    'ALTER DATABASE %I SET timezone TO %L',
    current_database(),
    'UTC'
  );
END
$$;

SET TIME ZONE 'UTC';

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION set_updated_at()
IS 'HireSense standard trigger function for mutable-row updated_at timestamps.';
-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "device_name" TEXT,
    "user_agent" TEXT,
    "ip_address" INET,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "token_type" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "consumed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country_code" CHAR(2),
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "experience_months_declared" INTEGER,
    "portfolio_url" TEXT,
    "github_url" TEXT,
    "linkedin_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruiter_profiles" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "user_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "job_title" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruiter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website_url" TEXT,
    "company_size_min" INTEGER,
    "company_size_max" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_memberships" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joined_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_categories" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "normalized_name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_objects" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "storage_provider" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256" TEXT,
    "uploaded_by_user_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "file_objects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_storage_chunks" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "channel_id" VARCHAR(32) NOT NULL,
    "sha256" VARCHAR(64) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'UPLOADING',
    "message_id" VARCHAR(32),
    "attachment_id" VARCHAR(32),
    "attachment_filename" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "discord_storage_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_file_parts" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "file_object_id" UUID NOT NULL,
    "chunk_id" UUID NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discord_file_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "candidate_profile_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "current_version_id" UUID,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "resume_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "file_object_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID NOT NULL,
    "created_by_user_id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "first_published_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "current_published_version_id" UUID,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_versions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "job_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "version_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT,
    "benefits" TEXT,
    "employment_type" TEXT,
    "workplace_type" TEXT,
    "experience_min_months" INTEGER,
    "experience_max_months" INTEGER,
    "education_min_degree" TEXT,
    "salary_min" DECIMAL(19,4),
    "salary_max" DECIMAL(19,4),
    "salary_currency" CHAR(3),
    "created_by_user_id" UUID NOT NULL,
    "published_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_version_skills" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "job_version_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "importance" SMALLINT NOT NULL DEFAULT 3,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "weight" DECIMAL(7,6) NOT NULL DEFAULT 1.000000,
    "min_experience_months" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_version_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recruitment_stages" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "company_id" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ordinal" INTEGER NOT NULL,
    "is_terminal" BOOLEAN NOT NULL DEFAULT false,
    "terminal_outcome" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "job_id" UUID NOT NULL,
    "job_version_id" UUID NOT NULL,
    "candidate_profile_id" UUID NOT NULL,
    "resume_version_id" UUID NOT NULL,
    "current_stage_id" UUID NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'DIRECT',
    "cover_letter" TEXT,
    "applied_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_match_run_id" UUID,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_stage_history" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "application_id" UUID NOT NULL,
    "from_stage_id" UUID,
    "to_stage_id" UUID NOT NULL,
    "changed_by_user_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_stage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_pipeline_versions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "code" TEXT NOT NULL,
    "pipeline_type" TEXT NOT NULL,
    "semantic_version" TEXT NOT NULL,
    "code_revision" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_pipeline_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_parse_runs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "resume_version_id" UUID NOT NULL,
    "pipeline_version_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "raw_text" TEXT,
    "raw_output" JSONB,
    "detected_language" TEXT,
    "warnings" JSONB,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_parse_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_skills" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "parse_run_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "confidence" DECIMAL(7,6),
    "evidence_text" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_experiences" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "parse_run_id" UUID NOT NULL,
    "company_name" TEXT,
    "job_title" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "experience_months" INTEGER,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "confidence" DECIMAL(7,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_educations" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "parse_run_id" UUID NOT NULL,
    "institution_name" TEXT,
    "degree" TEXT,
    "field_of_study" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "description" TEXT,
    "ordinal" INTEGER NOT NULL DEFAULT 0,
    "confidence" DECIMAL(7,6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_match_runs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "application_id" UUID NOT NULL,
    "resume_parse_run_id" UUID NOT NULL,
    "job_version_id" UUID NOT NULL,
    "pipeline_version_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "overall_score" DECIMAL(5,2),
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "error_code" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_match_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_score_components" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "match_run_id" UUID NOT NULL,
    "component_code" TEXT NOT NULL,
    "raw_score" DECIMAL(5,2) NOT NULL,
    "weight" DECIMAL(7,6) NOT NULL,
    "weighted_score" DECIMAL(9,6) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_score_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_skill_results" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "match_run_id" UUID NOT NULL,
    "job_version_skill_id" UUID NOT NULL,
    "resume_skill_id" UUID,
    "status" TEXT NOT NULL,
    "similarity_score" DECIMAL(7,6),
    "evidence_text" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_skill_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_uq" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_uq" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_role_uq" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "auth_sessions_user_expiry_idx" ON "auth_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "auth_tokens_user_type_idx" ON "auth_tokens"("user_id", "token_type", "expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_profiles_user_id_uq" ON "candidate_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruiter_profiles_user_id_uq" ON "recruiter_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_uq" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_name_trgm_idx" ON "companies" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "company_memberships_user_status_idx" ON "company_memberships"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "company_memberships_company_user_uq" ON "company_memberships"("company_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skill_categories_code_uq" ON "skill_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalized_name_uq" ON "skills"("normalized_name");

-- CreateIndex
CREATE INDEX "skills_category_active_idx" ON "skills"("category_id", "is_active");

-- CreateIndex
CREATE INDEX "skills_normalized_name_trgm_idx" ON "skills" USING GIN ("normalized_name" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "file_objects_storage_key_uq" ON "file_objects"("storage_provider", "bucket", "object_key");

-- CreateIndex
CREATE INDEX "discord_storage_chunks_status_idx" ON "discord_storage_chunks"("status");

-- CreateIndex
CREATE INDEX "discord_storage_chunks_message_idx" ON "discord_storage_chunks"("channel_id", "message_id");

-- CreateIndex
CREATE UNIQUE INDEX "discord_storage_chunks_channel_sha256_uq" ON "discord_storage_chunks"("channel_id", "sha256");

-- CreateIndex
CREATE INDEX "discord_file_parts_chunk_id_idx" ON "discord_file_parts"("chunk_id");

-- CreateIndex
CREATE UNIQUE INDEX "discord_file_parts_file_ordinal_uq" ON "discord_file_parts"("file_object_id", "ordinal");

-- CreateIndex
CREATE UNIQUE INDEX "resumes_one_default_per_candidate_uq" ON "resumes"("candidate_profile_id") WHERE ((is_default = true) AND (deleted_at IS NULL));

-- CreateIndex
CREATE INDEX "resumes_candidate_active_idx" ON "resumes"("candidate_profile_id", "deleted_at");

-- CreateIndex
CREATE INDEX "resume_versions_resume_created_idx" ON "resume_versions"("resume_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "resume_versions_id_resume_uq" ON "resume_versions"("id", "resume_id");

-- CreateIndex
CREATE UNIQUE INDEX "resume_versions_resume_version_uq" ON "resume_versions"("resume_id", "version_no");

-- CreateIndex
CREATE INDEX "jobs_company_status_idx" ON "jobs"("company_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_company_slug_uq" ON "jobs"("company_id", "slug");

-- CreateIndex
CREATE INDEX "job_versions_job_published_idx" ON "job_versions"("job_id", "published_at" DESC);

-- CreateIndex
CREATE INDEX "job_versions_title_trgm_idx" ON "job_versions" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "job_versions_id_job_uq" ON "job_versions"("id", "job_id");

-- CreateIndex
CREATE UNIQUE INDEX "job_versions_job_version_uq" ON "job_versions"("job_id", "version_no");

-- CreateIndex
CREATE INDEX "job_version_skills_skill_required_idx" ON "job_version_skills"("skill_id", "is_required");

-- CreateIndex
CREATE UNIQUE INDEX "job_version_skills_version_skill_uq" ON "job_version_skills"("job_version_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "recruitment_stages_company_code_uq" ON "recruitment_stages"("company_id", "code");

-- CreateIndex
CREATE INDEX "applications_candidate_applied_idx" ON "applications"("candidate_profile_id", "applied_at" DESC);

-- CreateIndex
CREATE INDEX "applications_job_stage_applied_idx" ON "applications"("job_id", "current_stage_id", "applied_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "applications_job_candidate_uq" ON "applications"("job_id", "candidate_profile_id");

-- CreateIndex
CREATE INDEX "application_stage_history_application_created_idx" ON "application_stage_history"("application_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ai_pipeline_versions_code_uq" ON "ai_pipeline_versions"("code");

-- CreateIndex
CREATE INDEX "resume_parse_runs_version_created_idx" ON "resume_parse_runs"("resume_version_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "resume_skills_skill_idx" ON "resume_skills"("skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "resume_skills_parse_skill_uq" ON "resume_skills"("parse_run_id", "skill_id");

-- CreateIndex
CREATE INDEX "resume_experiences_parse_ordinal_idx" ON "resume_experiences"("parse_run_id", "ordinal");

-- CreateIndex
CREATE INDEX "resume_educations_parse_ordinal_idx" ON "resume_educations"("parse_run_id", "ordinal");

-- CreateIndex
CREATE INDEX "application_match_runs_application_created_idx" ON "application_match_runs"("application_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "application_match_runs_job_score_idx" ON "application_match_runs"("job_version_id", "overall_score" DESC) WHERE (status = 'SUCCEEDED'::text);

-- CreateIndex
CREATE UNIQUE INDEX "application_match_runs_id_application_uq" ON "application_match_runs"("id", "application_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_score_components_run_component_uq" ON "match_score_components"("match_run_id", "component_code");

-- CreateIndex
CREATE INDEX "match_skill_results_run_status_idx" ON "match_skill_results"("match_run_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "match_skill_results_match_run_skill_uq" ON "match_skill_results"("match_run_id", "job_version_skill_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recruiter_profiles" ADD CONSTRAINT "recruiter_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "company_memberships" ADD CONSTRAINT "company_memberships_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "skills" ADD CONSTRAINT "skills_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "skill_categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "file_objects" ADD CONSTRAINT "file_objects_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discord_file_parts" ADD CONSTRAINT "discord_file_parts_chunk_fk" FOREIGN KEY ("chunk_id") REFERENCES "discord_storage_chunks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "discord_file_parts" ADD CONSTRAINT "discord_file_parts_file_object_fk" FOREIGN KEY ("file_object_id") REFERENCES "file_objects"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_candidate_profile_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_current_version_belongs_to_resume_fk" FOREIGN KEY ("current_version_id", "id") REFERENCES "resume_versions"("id", "resume_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_file_object_id_fk" FOREIGN KEY ("file_object_id") REFERENCES "file_objects"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_id_fk" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_current_published_version_belongs_to_job_fk" FOREIGN KEY ("current_published_version_id", "id") REFERENCES "job_versions"("id", "job_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_versions" ADD CONSTRAINT "job_versions_created_by_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_versions" ADD CONSTRAINT "job_versions_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_version_skills" ADD CONSTRAINT "job_version_skills_job_version_id_fk" FOREIGN KEY ("job_version_id") REFERENCES "job_versions"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_version_skills" ADD CONSTRAINT "job_version_skills_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recruitment_stages" ADD CONSTRAINT "recruitment_stages_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_profile_id_fk" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profiles"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_current_match_run_belongs_to_application_fk" FOREIGN KEY ("current_match_run_id", "id") REFERENCES "application_match_runs"("id", "application_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_current_stage_id_fk" FOREIGN KEY ("current_stage_id") REFERENCES "recruitment_stages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_version_id_fk" FOREIGN KEY ("job_version_id") REFERENCES "job_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_version_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "resume_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_changed_by_user_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_from_stage_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "recruitment_stages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_stage_history" ADD CONSTRAINT "application_stage_history_to_stage_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "recruitment_stages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_parse_runs" ADD CONSTRAINT "resume_parse_runs_pipeline_version_id_fk" FOREIGN KEY ("pipeline_version_id") REFERENCES "ai_pipeline_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_parse_runs" ADD CONSTRAINT "resume_parse_runs_resume_version_id_fk" FOREIGN KEY ("resume_version_id") REFERENCES "resume_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_skills" ADD CONSTRAINT "resume_skills_parse_run_id_fk" FOREIGN KEY ("parse_run_id") REFERENCES "resume_parse_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_skills" ADD CONSTRAINT "resume_skills_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_experiences" ADD CONSTRAINT "resume_experiences_parse_run_id_fk" FOREIGN KEY ("parse_run_id") REFERENCES "resume_parse_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "resume_educations" ADD CONSTRAINT "resume_educations_parse_run_id_fk" FOREIGN KEY ("parse_run_id") REFERENCES "resume_parse_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_match_runs" ADD CONSTRAINT "application_match_runs_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_match_runs" ADD CONSTRAINT "application_match_runs_job_version_id_fk" FOREIGN KEY ("job_version_id") REFERENCES "job_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_match_runs" ADD CONSTRAINT "application_match_runs_pipeline_version_id_fk" FOREIGN KEY ("pipeline_version_id") REFERENCES "ai_pipeline_versions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "application_match_runs" ADD CONSTRAINT "application_match_runs_resume_parse_run_id_fk" FOREIGN KEY ("resume_parse_run_id") REFERENCES "resume_parse_runs"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_score_components" ADD CONSTRAINT "match_score_components_match_run_id_fk" FOREIGN KEY ("match_run_id") REFERENCES "application_match_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_skill_results" ADD CONSTRAINT "match_skill_results_job_version_skill_id_fk" FOREIGN KEY ("job_version_skill_id") REFERENCES "job_version_skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_skill_results" ADD CONSTRAINT "match_skill_results_match_run_id_fk" FOREIGN KEY ("match_run_id") REFERENCES "application_match_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "match_skill_results" ADD CONSTRAINT "match_skill_results_resume_skill_id_fk" FOREIGN KEY ("resume_skill_id") REFERENCES "resume_skills"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- updated_at triggers
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER candidate_profiles_set_updated_at BEFORE UPDATE ON candidate_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER recruiter_profiles_set_updated_at BEFORE UPDATE ON recruiter_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER companies_set_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER company_memberships_set_updated_at BEFORE UPDATE ON company_memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER skill_categories_set_updated_at BEFORE UPDATE ON skill_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER skills_set_updated_at BEFORE UPDATE ON skills FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER resumes_set_updated_at BEFORE UPDATE ON resumes FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER jobs_set_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER recruitment_stages_set_updated_at BEFORE UPDATE ON recruitment_stages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER applications_set_updated_at BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER discord_storage_chunks_set_updated_at BEFORE UPDATE ON discord_storage_chunks FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- SQL-only invariants (not fully expressible in Prisma DSL)

DROP INDEX IF EXISTS "recruitment_stages_company_code_uq";
CREATE UNIQUE INDEX "recruitment_stages_company_code_uq"
  ON "recruitment_stages"("company_id", "code") NULLS NOT DISTINCT;

ALTER TABLE "roles"
  ADD CONSTRAINT "roles_code_chk" CHECK (code ~ '^[A-Z][A-Z0-9_]*$');

ALTER TABLE "users"
  ADD CONSTRAINT "users_status_chk" CHECK (
    status IN ('ACTIVE', 'DISABLED', 'PENDING_VERIFICATION', 'DELETED')
  );

ALTER TABLE "auth_sessions"
  ADD CONSTRAINT "auth_sessions_expiry_chk" CHECK (expires_at > created_at);

ALTER TABLE "auth_tokens"
  ADD CONSTRAINT "auth_tokens_type_chk" CHECK (
    token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')
  ),
  ADD CONSTRAINT "auth_tokens_expiry_chk" CHECK (expires_at > created_at);

ALTER TABLE "candidate_profiles"
  ADD CONSTRAINT "candidate_profiles_experience_chk" CHECK (
    experience_months_declared IS NULL OR experience_months_declared >= 0
  ),
  ADD CONSTRAINT "candidate_profiles_country_code_chk" CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  );

ALTER TABLE "companies"
  ADD CONSTRAINT "companies_status_chk" CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')
  ),
  ADD CONSTRAINT "companies_size_chk" CHECK (
    company_size_min IS NULL
    OR company_size_max IS NULL
    OR company_size_max >= company_size_min
  ),
  ADD CONSTRAINT "companies_size_min_chk" CHECK (
    company_size_min IS NULL OR company_size_min >= 0
  );

ALTER TABLE "company_memberships"
  ADD CONSTRAINT "company_memberships_role_chk" CHECK (
    role IN ('OWNER', 'ADMIN', 'RECRUITER', 'REVIEWER')
  ),
  ADD CONSTRAINT "company_memberships_status_chk" CHECK (
    status IN ('ACTIVE', 'INVITED', 'SUSPENDED', 'LEFT')
  );

ALTER TABLE "skill_categories"
  ADD CONSTRAINT "skill_categories_code_chk" CHECK (code ~ '^[A-Z][A-Z0-9_]*$');

ALTER TABLE "skills"
  ADD CONSTRAINT "skills_normalized_name_chk" CHECK (
    normalized_name = lower(btrim(normalized_name))
    AND length(normalized_name) > 0
  );

ALTER TABLE "file_objects"
  ADD CONSTRAINT "file_objects_size_chk" CHECK (size_bytes >= 0),
  ADD CONSTRAINT "file_objects_sha256_chk" CHECK (
    sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'
  ),
  ADD CONSTRAINT "file_objects_status_chk" CHECK (
    status IN ('UPLOADING', 'ACTIVE', 'FAILED', 'DELETED')
  );

ALTER TABLE "resume_versions"
  ADD CONSTRAINT "resume_versions_version_no_chk" CHECK (version_no > 0);

ALTER TABLE "jobs"
  ADD CONSTRAINT "jobs_status_chk" CHECK (
    status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED')
  );

ALTER TABLE "job_versions"
  ADD CONSTRAINT "job_versions_version_no_chk" CHECK (version_no > 0),
  ADD CONSTRAINT "job_versions_version_status_chk" CHECK (
    version_status IN ('DRAFT', 'PUBLISHED', 'SUPERSEDED')
  ),
  ADD CONSTRAINT "job_versions_employment_type_chk" CHECK (
    employment_type IS NULL OR employment_type IN (
      'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP',
      'TEMPORARY', 'FREELANCE', 'OTHER'
    )
  ),
  ADD CONSTRAINT "job_versions_workplace_type_chk" CHECK (
    workplace_type IS NULL OR workplace_type IN ('ONSITE', 'HYBRID', 'REMOTE')
  ),
  ADD CONSTRAINT "job_versions_experience_min_chk" CHECK (
    experience_min_months IS NULL OR experience_min_months >= 0
  ),
  ADD CONSTRAINT "job_versions_experience_range_chk" CHECK (
    experience_max_months IS NULL
    OR experience_min_months IS NULL
    OR experience_max_months >= experience_min_months
  ),
  ADD CONSTRAINT "job_versions_salary_range_chk" CHECK (
    salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min
  ),
  ADD CONSTRAINT "job_versions_currency_chk" CHECK (
    salary_currency IS NULL OR salary_currency ~ '^[A-Z]{3}$'
  ),
  ADD CONSTRAINT "job_versions_education_min_degree_chk" CHECK (
    education_min_degree IS NULL
    OR education_min_degree IN (
      'HIGH_SCHOOL',
      'ASSOCIATE',
      'BACHELOR',
      'MASTER',
      'DOCTORATE'
    )
  );

ALTER TABLE "job_version_skills"
  ADD CONSTRAINT "job_version_skills_importance_chk" CHECK (importance BETWEEN 1 AND 5),
  ADD CONSTRAINT "job_version_skills_weight_chk" CHECK (weight BETWEEN 0 AND 1),
  ADD CONSTRAINT "job_version_skills_experience_chk" CHECK (
    min_experience_months IS NULL OR min_experience_months >= 0
  );

ALTER TABLE "recruitment_stages"
  ADD CONSTRAINT "recruitment_stages_code_chk" CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
  ADD CONSTRAINT "recruitment_stages_ordinal_chk" CHECK (ordinal >= 0),
  ADD CONSTRAINT "recruitment_stages_terminal_outcome_chk" CHECK (
    terminal_outcome IS NULL OR terminal_outcome IN ('HIRED', 'REJECTED', 'WITHDRAWN')
  );

ALTER TABLE "applications"
  ADD CONSTRAINT "applications_source_chk" CHECK (
    source IN ('DIRECT', 'REFERRAL', 'IMPORT', 'OTHER')
  );

ALTER TABLE "ai_pipeline_versions"
  ADD CONSTRAINT "ai_pipeline_versions_type_chk" CHECK (
    pipeline_type IN ('RESUME_PARSER', 'JOB_PARSER', 'MATCHING', 'RECOMMENDATION')
  );

ALTER TABLE "resume_parse_runs"
  ADD CONSTRAINT "resume_parse_runs_status_chk" CHECK (
    status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')
  ),
  ADD CONSTRAINT "resume_parse_runs_time_chk" CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
  );

ALTER TABLE "resume_skills"
  ADD CONSTRAINT "resume_skills_confidence_chk" CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  );

ALTER TABLE "resume_experiences"
  ADD CONSTRAINT "resume_experiences_date_chk" CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  ),
  ADD CONSTRAINT "resume_experiences_months_chk" CHECK (
    experience_months IS NULL OR experience_months >= 0
  ),
  ADD CONSTRAINT "resume_experiences_confidence_chk" CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  ),
  ADD CONSTRAINT "resume_experiences_ordinal_chk" CHECK (ordinal >= 0);

ALTER TABLE "resume_educations"
  ADD CONSTRAINT "resume_educations_date_chk" CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  ),
  ADD CONSTRAINT "resume_educations_confidence_chk" CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  ),
  ADD CONSTRAINT "resume_educations_ordinal_chk" CHECK (ordinal >= 0);

ALTER TABLE "application_match_runs"
  ADD CONSTRAINT "application_match_runs_status_chk" CHECK (
    status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')
  ),
  ADD CONSTRAINT "application_match_runs_score_chk" CHECK (
    overall_score IS NULL OR overall_score BETWEEN 0 AND 100
  ),
  ADD CONSTRAINT "application_match_runs_time_chk" CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
  );

ALTER TABLE "match_score_components"
  ADD CONSTRAINT "match_score_components_raw_score_chk" CHECK (
    raw_score BETWEEN 0 AND 100
  ),
  ADD CONSTRAINT "match_score_components_weight_chk" CHECK (
    weight BETWEEN 0 AND 1
  ),
  ADD CONSTRAINT "match_score_components_weighted_score_chk" CHECK (
    weighted_score BETWEEN 0 AND 100
  );

ALTER TABLE "match_skill_results"
  ADD CONSTRAINT "match_skill_results_status_chk" CHECK (
    status IN ('MATCHED', 'PARTIAL', 'MISSING')
  ),
  ADD CONSTRAINT "match_skill_results_similarity_chk" CHECK (
    similarity_score IS NULL OR similarity_score BETWEEN 0 AND 1
  );

ALTER TABLE "discord_storage_chunks"
  ADD CONSTRAINT "discord_storage_chunks_size_chk" CHECK (size_bytes > 0),
  ADD CONSTRAINT "discord_storage_chunks_sha256_chk" CHECK (
    sha256 ~ '^[0-9a-f]{64}$'
  ),
  ADD CONSTRAINT "discord_storage_chunks_status_chk" CHECK (
    status IN ('UPLOADING', 'ACTIVE', 'FAILED', 'MISSING', 'DELETED')
  ),
  ADD CONSTRAINT "discord_storage_chunks_active_locator_chk" CHECK (
    status <> 'ACTIVE'
    OR (
      message_id IS NOT NULL
      AND attachment_id IS NOT NULL
    )
  );

ALTER TABLE "discord_file_parts"
  ADD CONSTRAINT "discord_file_parts_ordinal_chk" CHECK (ordinal >= 0);

CREATE OR REPLACE FUNCTION validate_application_snapshot_refs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM job_versions jv
    WHERE jv.id = NEW.job_version_id
      AND jv.job_id = NEW.job_id
  ) THEN
    RAISE EXCEPTION
      'job_version_id % does not belong to job_id %',
      NEW.job_version_id,
      NEW.job_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM resume_versions rv
    JOIN resumes r ON r.id = rv.resume_id
    WHERE rv.id = NEW.resume_version_id
      AND r.candidate_profile_id = NEW.candidate_profile_id
  ) THEN
    RAISE EXCEPTION
      'resume_version_id % does not belong to candidate_profile_id %',
      NEW.resume_version_id,
      NEW.candidate_profile_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER applications_validate_snapshot_refs
BEFORE INSERT OR UPDATE OF job_id, job_version_id, candidate_profile_id, resume_version_id
ON applications
FOR EACH ROW
EXECUTE FUNCTION validate_application_snapshot_refs();

CREATE OR REPLACE FUNCTION validate_application_match_run_refs()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  expected_resume_version_id uuid;
  expected_job_version_id uuid;
  actual_resume_version_id uuid;
BEGIN
  SELECT a.resume_version_id, a.job_version_id
  INTO expected_resume_version_id, expected_job_version_id
  FROM applications a
  WHERE a.id = NEW.application_id;

  SELECT rpr.resume_version_id
  INTO actual_resume_version_id
  FROM resume_parse_runs rpr
  WHERE rpr.id = NEW.resume_parse_run_id;

  IF expected_resume_version_id IS NULL THEN
    RAISE EXCEPTION 'application_id % does not exist', NEW.application_id;
  END IF;

  IF NEW.job_version_id <> expected_job_version_id THEN
    RAISE EXCEPTION
      'match job_version_id % differs from application job_version_id %',
      NEW.job_version_id,
      expected_job_version_id;
  END IF;

  IF actual_resume_version_id IS DISTINCT FROM expected_resume_version_id THEN
    RAISE EXCEPTION
      'resume_parse_run_id % does not belong to application resume_version_id %',
      NEW.resume_parse_run_id,
      expected_resume_version_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER application_match_runs_validate_refs
BEFORE INSERT OR UPDATE OF application_id, resume_parse_run_id, job_version_id
ON application_match_runs
FOR EACH ROW
EXECUTE FUNCTION validate_application_match_run_refs();
