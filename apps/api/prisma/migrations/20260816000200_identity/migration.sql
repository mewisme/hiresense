-- HireSense / Internship / Identity & Authentication

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT roles_code_uq UNIQUE (code),
  CONSTRAINT roles_code_chk CHECK (code ~ '^[A-Z][A-Z0-9_]*$')
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  email citext NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  email_verified_at timestamptz(6),
  last_login_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),
  deleted_at timestamptz(6),

  CONSTRAINT users_email_uq UNIQUE (email),
  CONSTRAINT users_status_chk CHECK (
    status IN ('ACTIVE', 'DISABLED', 'PENDING_VERIFICATION', 'DELETED')
  )
);

CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT user_roles_user_role_uq UNIQUE (user_id, role_id),
  CONSTRAINT user_roles_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_id_fk
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE auth_sessions (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL,
  refresh_token_hash text NOT NULL,
  device_name text,
  user_agent text,
  ip_address inet,
  expires_at timestamptz(6) NOT NULL,
  revoked_at timestamptz(6),
  last_used_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT auth_sessions_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT auth_sessions_expiry_chk CHECK (expires_at > created_at)
);

CREATE TABLE auth_tokens (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  user_id uuid NOT NULL,
  token_type text NOT NULL,
  token_hash text NOT NULL,
  expires_at timestamptz(6) NOT NULL,
  consumed_at timestamptz(6),
  created_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT auth_tokens_user_id_fk
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT auth_tokens_type_chk CHECK (
    token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')
  ),
  CONSTRAINT auth_tokens_expiry_chk CHECK (expires_at > created_at)
);

CREATE INDEX auth_sessions_user_expiry_idx
  ON auth_sessions(user_id, expires_at);

CREATE INDEX auth_tokens_user_type_idx
  ON auth_tokens(user_id, token_type, expires_at);

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
