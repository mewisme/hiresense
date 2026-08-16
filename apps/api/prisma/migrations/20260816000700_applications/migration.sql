-- HireSense / Internship / Application Tracking System

CREATE TABLE recruitment_stages (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id uuid,
  code text NOT NULL,
  name text NOT NULL,
  ordinal integer NOT NULL,
  is_terminal boolean NOT NULL DEFAULT false,
  terminal_outcome text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT recruitment_stages_company_id_fk
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT recruitment_stages_code_chk CHECK (code ~ '^[A-Z][A-Z0-9_]*$'),
  CONSTRAINT recruitment_stages_ordinal_chk CHECK (ordinal >= 0),
  CONSTRAINT recruitment_stages_terminal_outcome_chk CHECK (
    terminal_outcome IS NULL OR terminal_outcome IN ('HIRED', 'REJECTED', 'WITHDRAWN')
  )
);

-- NULLS NOT DISTINCT gives system stages (company_id NULL) the same uniqueness
-- behavior as company-specific stages.
CREATE UNIQUE INDEX recruitment_stages_company_code_uq
  ON recruitment_stages(company_id, code) NULLS NOT DISTINCT;

CREATE TABLE applications (
  id uuid PRIMARY KEY DEFAULT uuidv7(),

  job_id uuid NOT NULL,
  job_version_id uuid NOT NULL,

  candidate_profile_id uuid NOT NULL,
  resume_version_id uuid NOT NULL,

  current_stage_id uuid NOT NULL,

  source text NOT NULL DEFAULT 'DIRECT',
  cover_letter text,

  applied_at timestamptz(6) NOT NULL DEFAULT now(),
  withdrawn_at timestamptz(6),

  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT applications_job_candidate_uq
    UNIQUE (job_id, candidate_profile_id),
  CONSTRAINT applications_job_id_fk
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE RESTRICT,
  CONSTRAINT applications_job_version_id_fk
    FOREIGN KEY (job_version_id) REFERENCES job_versions(id) ON DELETE RESTRICT,
  CONSTRAINT applications_candidate_profile_id_fk
    FOREIGN KEY (candidate_profile_id)
    REFERENCES candidate_profiles(id)
    ON DELETE RESTRICT,
  CONSTRAINT applications_resume_version_id_fk
    FOREIGN KEY (resume_version_id) REFERENCES resume_versions(id) ON DELETE RESTRICT,
  CONSTRAINT applications_current_stage_id_fk
    FOREIGN KEY (current_stage_id) REFERENCES recruitment_stages(id) ON DELETE RESTRICT,
  CONSTRAINT applications_source_chk CHECK (
    source IN ('DIRECT', 'REFERRAL', 'IMPORT', 'OTHER')
  )
);

CREATE TABLE application_stage_history (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  application_id uuid NOT NULL,
  from_stage_id uuid,
  to_stage_id uuid NOT NULL,
  changed_by_user_id uuid,
  note text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT application_stage_history_application_id_fk
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  CONSTRAINT application_stage_history_from_stage_id_fk
    FOREIGN KEY (from_stage_id) REFERENCES recruitment_stages(id) ON DELETE RESTRICT,
  CONSTRAINT application_stage_history_to_stage_id_fk
    FOREIGN KEY (to_stage_id) REFERENCES recruitment_stages(id) ON DELETE RESTRICT,
  CONSTRAINT application_stage_history_changed_by_user_id_fk
    FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Enforce that the immutable snapshots referenced by an application actually
-- belong to the selected Job and Candidate.
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

CREATE INDEX applications_job_stage_applied_idx
  ON applications(job_id, current_stage_id, applied_at DESC);

CREATE INDEX applications_candidate_applied_idx
  ON applications(candidate_profile_id, applied_at DESC);

CREATE INDEX application_stage_history_application_created_idx
  ON application_stage_history(application_id, created_at DESC);

CREATE TRIGGER recruitment_stages_set_updated_at
BEFORE UPDATE ON recruitment_stages
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER applications_set_updated_at
BEFORE UPDATE ON applications
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
