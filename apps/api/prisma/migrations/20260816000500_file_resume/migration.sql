-- HireSense / Internship / File Storage and Resume Versioning

CREATE TABLE file_objects (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  storage_provider text NOT NULL,
  bucket text NOT NULL,
  object_key text NOT NULL,
  original_filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  sha256 text,
  uploaded_by_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  deleted_at timestamptz(6),

  CONSTRAINT file_objects_storage_key_uq
    UNIQUE (storage_provider, bucket, object_key),
  CONSTRAINT file_objects_uploaded_by_user_id_fk
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT file_objects_size_chk CHECK (size_bytes >= 0),
  CONSTRAINT file_objects_sha256_chk CHECK (
    sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT file_objects_status_chk CHECK (
    status IN ('ACTIVE', 'DELETED', 'QUARANTINED')
  )
);

CREATE TABLE resumes (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  candidate_profile_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  deleted_at timestamptz(6),

  CONSTRAINT resumes_candidate_profile_id_fk
    FOREIGN KEY (candidate_profile_id)
    REFERENCES candidate_profiles(id)
    ON DELETE RESTRICT
);

CREATE TABLE resume_versions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  resume_id uuid NOT NULL,
  version_no integer NOT NULL,
  file_object_id uuid NOT NULL,
  created_by_user_id uuid NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT resume_versions_resume_version_uq UNIQUE (resume_id, version_no),
  CONSTRAINT resume_versions_id_resume_uq UNIQUE (id, resume_id),
  CONSTRAINT resume_versions_resume_id_fk
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE RESTRICT,
  CONSTRAINT resume_versions_file_object_id_fk
    FOREIGN KEY (file_object_id) REFERENCES file_objects(id) ON DELETE RESTRICT,
  CONSTRAINT resume_versions_created_by_user_id_fk
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT resume_versions_version_no_chk CHECK (version_no > 0)
);

ALTER TABLE resumes
  ADD COLUMN current_version_id uuid;

ALTER TABLE resumes
  ADD CONSTRAINT resumes_current_version_belongs_to_resume_fk
  FOREIGN KEY (current_version_id, id)
  REFERENCES resume_versions(id, resume_id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX resumes_one_default_per_candidate_uq
  ON resumes(candidate_profile_id)
  WHERE is_default = true AND deleted_at IS NULL;

CREATE INDEX resumes_candidate_active_idx
  ON resumes(candidate_profile_id, deleted_at);

CREATE INDEX resume_versions_resume_created_idx
  ON resume_versions(resume_id, created_at DESC);

CREATE TRIGGER resumes_set_updated_at
BEFORE UPDATE ON resumes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
