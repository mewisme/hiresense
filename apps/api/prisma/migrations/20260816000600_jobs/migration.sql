-- HireSense / Internship / Job and Immutable Job-Version Foundation

CREATE TABLE jobs (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  first_published_at timestamptz(6),
  closed_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  deleted_at timestamptz(6),

  CONSTRAINT jobs_company_slug_uq UNIQUE (company_id, slug),
  CONSTRAINT jobs_company_id_fk
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT jobs_created_by_user_id_fk
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT jobs_status_chk CHECK (
    status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'ARCHIVED')
  )
);

CREATE TABLE job_versions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  job_id uuid NOT NULL,
  version_no integer NOT NULL,
  version_status text NOT NULL DEFAULT 'DRAFT',

  title text NOT NULL,
  summary text,
  description text NOT NULL,
  responsibilities text,
  benefits text,

  employment_type text,
  workplace_type text,

  experience_min_months integer,
  experience_max_months integer,

  salary_min numeric(19,4),
  salary_max numeric(19,4),
  salary_currency char(3),

  created_by_user_id uuid NOT NULL,
  published_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT job_versions_job_version_uq UNIQUE (job_id, version_no),
  CONSTRAINT job_versions_id_job_uq UNIQUE (id, job_id),
  CONSTRAINT job_versions_job_id_fk
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
  CONSTRAINT job_versions_created_by_user_id_fk
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT job_versions_version_no_chk CHECK (version_no > 0),
  CONSTRAINT job_versions_version_status_chk CHECK (
    version_status IN ('DRAFT', 'PUBLISHED', 'SUPERSEDED')
  ),
  CONSTRAINT job_versions_employment_type_chk CHECK (
    employment_type IS NULL OR employment_type IN (
      'FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP',
      'TEMPORARY', 'FREELANCE', 'OTHER'
    )
  ),
  CONSTRAINT job_versions_workplace_type_chk CHECK (
    workplace_type IS NULL OR workplace_type IN ('ONSITE', 'HYBRID', 'REMOTE')
  ),
  CONSTRAINT job_versions_experience_min_chk CHECK (
    experience_min_months IS NULL OR experience_min_months >= 0
  ),
  CONSTRAINT job_versions_experience_range_chk CHECK (
    experience_max_months IS NULL
    OR experience_min_months IS NULL
    OR experience_max_months >= experience_min_months
  ),
  CONSTRAINT job_versions_salary_range_chk CHECK (
    salary_min IS NULL OR salary_max IS NULL OR salary_max >= salary_min
  ),
  CONSTRAINT job_versions_currency_chk CHECK (
    salary_currency IS NULL OR salary_currency ~ '^[A-Z]{3}$'
  )
);

CREATE TABLE job_version_skills (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  job_version_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  importance smallint NOT NULL DEFAULT 3,
  is_required boolean NOT NULL DEFAULT true,
  weight numeric(7,6) NOT NULL DEFAULT 1.000000,
  min_experience_months integer,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT job_version_skills_version_skill_uq
    UNIQUE (job_version_id, skill_id),
  CONSTRAINT job_version_skills_job_version_id_fk
    FOREIGN KEY (job_version_id) REFERENCES job_versions(id) ON DELETE CASCADE,
  CONSTRAINT job_version_skills_skill_id_fk
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT,
  CONSTRAINT job_version_skills_importance_chk CHECK (importance BETWEEN 1 AND 5),
  CONSTRAINT job_version_skills_weight_chk CHECK (weight BETWEEN 0 AND 1),
  CONSTRAINT job_version_skills_experience_chk CHECK (
    min_experience_months IS NULL OR min_experience_months >= 0
  )
);

ALTER TABLE jobs
  ADD COLUMN current_published_version_id uuid;

ALTER TABLE jobs
  ADD CONSTRAINT jobs_current_published_version_belongs_to_job_fk
  FOREIGN KEY (current_published_version_id, id)
  REFERENCES job_versions(id, job_id)
  ON DELETE RESTRICT;

CREATE INDEX jobs_company_status_idx
  ON jobs(company_id, status);

CREATE INDEX job_versions_job_published_idx
  ON job_versions(job_id, published_at DESC);

CREATE INDEX job_versions_title_trgm_idx
  ON job_versions USING gin (title gin_trgm_ops);

CREATE INDEX job_version_skills_skill_required_idx
  ON job_version_skills(skill_id, is_required);

CREATE TRIGGER jobs_set_updated_at
BEFORE UPDATE ON jobs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
