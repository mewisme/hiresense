-- HireSense / Internship / Baseline AI Parsing and Matching

CREATE TABLE ai_pipeline_versions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  code text NOT NULL,
  pipeline_type text NOT NULL,
  semantic_version text NOT NULL,
  code_revision text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT ai_pipeline_versions_code_uq UNIQUE (code),
  CONSTRAINT ai_pipeline_versions_type_chk CHECK (
    pipeline_type IN ('RESUME_PARSER', 'JOB_PARSER', 'MATCHING', 'RECOMMENDATION')
  )
);

CREATE TABLE resume_parse_runs (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  resume_version_id uuid NOT NULL,
  pipeline_version_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  raw_text text,
  raw_output jsonb,
  detected_language text,
  warnings jsonb,
  started_at timestamptz(6),
  completed_at timestamptz(6),
  error_code text,
  error_message text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT resume_parse_runs_resume_version_id_fk
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE RESTRICT,
  CONSTRAINT resume_parse_runs_pipeline_version_id_fk
    FOREIGN KEY (pipeline_version_id) REFERENCES ai_pipeline_versions(id) ON DELETE RESTRICT,
  CONSTRAINT resume_parse_runs_status_chk CHECK (
    status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')
  ),
  CONSTRAINT resume_parse_runs_time_chk CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
  )
);

CREATE TABLE resume_skills (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  parse_run_id uuid NOT NULL,
  skill_id uuid NOT NULL,
  confidence numeric(7,6),
  evidence_text text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT resume_skills_parse_skill_uq UNIQUE (parse_run_id, skill_id),
  CONSTRAINT resume_skills_parse_run_id_fk
    FOREIGN KEY (parse_run_id) REFERENCES resume_parse_runs(id) ON DELETE CASCADE,
  CONSTRAINT resume_skills_skill_id_fk
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE RESTRICT,
  CONSTRAINT resume_skills_confidence_chk CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  )
);

CREATE TABLE resume_experiences (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  parse_run_id uuid NOT NULL,
  company_name text,
  job_title text,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  description text,
  experience_months integer,
  ordinal integer NOT NULL DEFAULT 0,
  confidence numeric(7,6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT resume_experiences_parse_run_id_fk
    FOREIGN KEY (parse_run_id) REFERENCES resume_parse_runs(id) ON DELETE CASCADE,
  CONSTRAINT resume_experiences_date_chk CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT resume_experiences_months_chk CHECK (
    experience_months IS NULL OR experience_months >= 0
  ),
  CONSTRAINT resume_experiences_confidence_chk CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  ),
  CONSTRAINT resume_experiences_ordinal_chk CHECK (ordinal >= 0)
);

CREATE TABLE resume_educations (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  parse_run_id uuid NOT NULL,
  institution_name text,
  degree text,
  field_of_study text,
  start_date date,
  end_date date,
  description text,
  ordinal integer NOT NULL DEFAULT 0,
  confidence numeric(7,6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT resume_educations_parse_run_id_fk
    FOREIGN KEY (parse_run_id) REFERENCES resume_parse_runs(id) ON DELETE CASCADE,
  CONSTRAINT resume_educations_date_chk CHECK (
    end_date IS NULL OR start_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT resume_educations_confidence_chk CHECK (
    confidence IS NULL OR confidence BETWEEN 0 AND 1
  ),
  CONSTRAINT resume_educations_ordinal_chk CHECK (ordinal >= 0)
);

CREATE TABLE application_match_runs (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  application_id uuid NOT NULL,
  resume_parse_run_id uuid NOT NULL,
  job_version_id uuid NOT NULL,
  pipeline_version_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  overall_score numeric(5,2),
  started_at timestamptz(6),
  completed_at timestamptz(6),
  error_code text,
  error_message text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT application_match_runs_id_application_uq UNIQUE (id, application_id),
  CONSTRAINT application_match_runs_application_id_fk
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT application_match_runs_resume_parse_run_id_fk
    FOREIGN KEY (resume_parse_run_id) REFERENCES resume_parse_runs(id) ON DELETE RESTRICT,
  CONSTRAINT application_match_runs_job_version_id_fk
    FOREIGN KEY (job_version_id) REFERENCES job_versions(id) ON DELETE RESTRICT,
  CONSTRAINT application_match_runs_pipeline_version_id_fk
    FOREIGN KEY (pipeline_version_id) REFERENCES ai_pipeline_versions(id) ON DELETE RESTRICT,
  CONSTRAINT application_match_runs_status_chk CHECK (
    status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED')
  ),
  CONSTRAINT application_match_runs_score_chk CHECK (
    overall_score IS NULL OR overall_score BETWEEN 0 AND 100
  ),
  CONSTRAINT application_match_runs_time_chk CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
  )
);

CREATE TABLE match_score_components (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  match_run_id uuid NOT NULL,
  component_code text NOT NULL,
  raw_score numeric(5,2) NOT NULL,
  weight numeric(7,6) NOT NULL,
  weighted_score numeric(9,6) NOT NULL,
  details jsonb,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT match_score_components_run_component_uq
    UNIQUE (match_run_id, component_code),
  CONSTRAINT match_score_components_match_run_id_fk
    FOREIGN KEY (match_run_id) REFERENCES application_match_runs(id) ON DELETE CASCADE,
  CONSTRAINT match_score_components_raw_score_chk CHECK (
    raw_score BETWEEN 0 AND 100
  ),
  CONSTRAINT match_score_components_weight_chk CHECK (
    weight BETWEEN 0 AND 1
  ),
  CONSTRAINT match_score_components_weighted_score_chk CHECK (
    weighted_score BETWEEN 0 AND 100
  )
);

CREATE TABLE match_skill_results (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  match_run_id uuid NOT NULL,
  job_version_skill_id uuid NOT NULL,
  resume_skill_id uuid,
  status text NOT NULL,
  similarity_score numeric(7,6),
  evidence_text text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT match_skill_results_match_run_skill_uq
    UNIQUE (match_run_id, job_version_skill_id),
  CONSTRAINT match_skill_results_match_run_id_fk
    FOREIGN KEY (match_run_id) REFERENCES application_match_runs(id) ON DELETE CASCADE,
  CONSTRAINT match_skill_results_job_version_skill_id_fk
    FOREIGN KEY (job_version_skill_id) REFERENCES job_version_skills(id) ON DELETE RESTRICT,
  CONSTRAINT match_skill_results_resume_skill_id_fk
    FOREIGN KEY (resume_skill_id) REFERENCES resume_skills(id) ON DELETE RESTRICT,
  CONSTRAINT match_skill_results_status_chk CHECK (
    status IN ('MATCHED', 'PARTIAL', 'MISSING')
  ),
  CONSTRAINT match_skill_results_similarity_chk CHECK (
    similarity_score IS NULL OR similarity_score BETWEEN 0 AND 1
  )
);

-- A match run must use exactly the immutable snapshots owned by its application.
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

ALTER TABLE applications
  ADD COLUMN current_match_run_id uuid;

ALTER TABLE applications
  ADD CONSTRAINT applications_current_match_run_belongs_to_application_fk
  FOREIGN KEY (current_match_run_id, id)
  REFERENCES application_match_runs(id, application_id)
  ON DELETE RESTRICT;

CREATE INDEX resume_parse_runs_version_created_idx
  ON resume_parse_runs(resume_version_id, created_at DESC);

CREATE INDEX resume_skills_skill_idx
  ON resume_skills(skill_id);

CREATE INDEX resume_experiences_parse_ordinal_idx
  ON resume_experiences(parse_run_id, ordinal);

CREATE INDEX resume_educations_parse_ordinal_idx
  ON resume_educations(parse_run_id, ordinal);

CREATE INDEX application_match_runs_application_created_idx
  ON application_match_runs(application_id, created_at DESC);

CREATE INDEX application_match_runs_job_score_idx
  ON application_match_runs(job_version_id, overall_score DESC)
  WHERE status = 'SUCCEEDED';

CREATE INDEX match_skill_results_run_status_idx
  ON match_skill_results(match_run_id, status);
