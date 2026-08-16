-- HireSense / Internship / Candidate, Recruiter, Company

CREATE TABLE candidate_profiles (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  headline text,
  summary text,
  city text,
  region text,
  country_code char(2),
  timezone text NOT NULL DEFAULT 'UTC',
  experience_months_declared integer,
  portfolio_url text,
  github_url text,
  linkedin_url text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT candidate_profiles_user_id_uq UNIQUE (user_id),
  CONSTRAINT candidate_profiles_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT candidate_profiles_experience_chk CHECK (
    experience_months_declared IS NULL OR experience_months_declared >= 0
  ),
  CONSTRAINT candidate_profiles_country_code_chk CHECK (
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'
  )
);

CREATE TABLE recruiter_profiles (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  phone text,
  job_title text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT recruiter_profiles_user_id_uq UNIQUE (user_id),
  CONSTRAINT recruiter_profiles_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  website_url text,
  company_size_min integer,
  company_size_max integer,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by_user_id uuid NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  deleted_at timestamptz(6),

  CONSTRAINT companies_slug_uq UNIQUE (slug),
  CONSTRAINT companies_created_by_user_id_fk
    FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT companies_status_chk CHECK (
    status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')
  ),
  CONSTRAINT companies_size_chk CHECK (
    company_size_min IS NULL
    OR company_size_max IS NULL
    OR company_size_max >= company_size_min
  ),
  CONSTRAINT companies_size_min_chk CHECK (
    company_size_min IS NULL OR company_size_min >= 0
  )
);

CREATE TABLE company_memberships (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  joined_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT company_memberships_company_user_uq UNIQUE (company_id, user_id),
  CONSTRAINT company_memberships_company_id_fk
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT,
  CONSTRAINT company_memberships_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT company_memberships_role_chk CHECK (
    role IN ('OWNER', 'ADMIN', 'RECRUITER', 'REVIEWER')
  ),
  CONSTRAINT company_memberships_status_chk CHECK (
    status IN ('ACTIVE', 'INVITED', 'SUSPENDED', 'LEFT')
  )
);

CREATE INDEX companies_status_idx ON companies(status);
CREATE INDEX companies_name_trgm_idx
  ON companies USING gin (name gin_trgm_ops);
CREATE INDEX company_memberships_user_status_idx
  ON company_memberships(user_id, status);

CREATE TRIGGER candidate_profiles_set_updated_at
BEFORE UPDATE ON candidate_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER recruiter_profiles_set_updated_at
BEFORE UPDATE ON recruiter_profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER companies_set_updated_at
BEFORE UPDATE ON companies
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER company_memberships_set_updated_at
BEFORE UPDATE ON company_memberships
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
