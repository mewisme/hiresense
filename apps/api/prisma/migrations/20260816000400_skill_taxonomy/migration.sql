-- HireSense / Internship / Canonical Skill Taxonomy

CREATE TABLE skill_categories (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT skill_categories_code_uq UNIQUE (code),
  CONSTRAINT skill_categories_code_chk CHECK (code ~ '^[A-Z][A-Z0-9_]*$')
);

CREATE TABLE skills (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  category_id uuid,
  name text NOT NULL,
  normalized_name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz(6) NOT NULL DEFAULT now(),
  updated_at timestamptz(6) NOT NULL DEFAULT now(),

  CONSTRAINT skills_normalized_name_uq UNIQUE (normalized_name),
  CONSTRAINT skills_category_id_fk
    FOREIGN KEY (category_id) REFERENCES skill_categories(id) ON DELETE SET NULL,
  CONSTRAINT skills_normalized_name_chk CHECK (
    normalized_name = lower(btrim(normalized_name))
    AND length(normalized_name) > 0
  )
);

CREATE INDEX skills_category_active_idx
  ON skills(category_id, is_active);

CREATE INDEX skills_normalized_name_trgm_idx
  ON skills USING gin (normalized_name gin_trgm_ops);

CREATE TRIGGER skill_categories_set_updated_at
BEFORE UPDATE ON skill_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER skills_set_updated_at
BEFORE UPDATE ON skills
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
