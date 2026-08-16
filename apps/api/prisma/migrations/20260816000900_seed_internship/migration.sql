-- HireSense / Internship / Idempotent system seed data

INSERT INTO roles (code, name, description)
SELECT 'CANDIDATE', 'Candidate', 'Job seeker account'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'CANDIDATE');

INSERT INTO roles (code, name, description)
SELECT 'RECRUITER', 'Recruiter', 'Recruiter / hiring team account'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'RECRUITER');

INSERT INTO roles (code, name, description)
SELECT 'ADMIN', 'Administrator', 'HireSense system administrator'
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'ADMIN');

INSERT INTO skill_categories (code, name)
SELECT 'PROGRAMMING_LANGUAGE', 'Programming Language'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'PROGRAMMING_LANGUAGE');

INSERT INTO skill_categories (code, name)
SELECT 'FRONTEND', 'Frontend'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'FRONTEND');

INSERT INTO skill_categories (code, name)
SELECT 'BACKEND', 'Backend'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'BACKEND');

INSERT INTO skill_categories (code, name)
SELECT 'DATABASE', 'Database'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'DATABASE');

INSERT INTO skill_categories (code, name)
SELECT 'CLOUD', 'Cloud'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'CLOUD');

INSERT INTO skill_categories (code, name)
SELECT 'DEVOPS', 'DevOps'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'DEVOPS');

INSERT INTO skill_categories (code, name)
SELECT 'TESTING', 'Testing'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'TESTING');

INSERT INTO skill_categories (code, name)
SELECT 'AI_ML', 'AI / Machine Learning'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'AI_ML');

INSERT INTO skill_categories (code, name)
SELECT 'DATA', 'Data'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'DATA');

INSERT INTO skill_categories (code, name)
SELECT 'SOFT_SKILL', 'Soft Skill'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'SOFT_SKILL');

INSERT INTO skill_categories (code, name)
SELECT 'LANGUAGE', 'Language'
WHERE NOT EXISTS (SELECT 1 FROM skill_categories WHERE code = 'LANGUAGE');

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'APPLIED', 'Applied', 10, false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'APPLIED'
);

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'SCREENING', 'Screening', 20, false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'SCREENING'
);

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'SHORTLISTED', 'Shortlisted', 30, false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'SHORTLISTED'
);

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'INTERVIEW', 'Interview', 40, false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'INTERVIEW'
);

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'OFFER', 'Offer', 50, false, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'OFFER'
);

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'HIRED', 'Hired', 60, true, 'HIRED'
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'HIRED'
);

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'REJECTED', 'Rejected', 70, true, 'REJECTED'
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'REJECTED'
);

INSERT INTO recruitment_stages
  (company_id, code, name, ordinal, is_terminal, terminal_outcome)
SELECT NULL, 'WITHDRAWN', 'Withdrawn', 80, true, 'WITHDRAWN'
WHERE NOT EXISTS (
  SELECT 1 FROM recruitment_stages
  WHERE company_id IS NULL AND code = 'WITHDRAWN'
);

INSERT INTO ai_pipeline_versions
  (code, pipeline_type, semantic_version, config)
SELECT
  'resume-parser-v1',
  'RESUME_PARSER',
  '1.0.0',
  '{"phase":"internship","description":"Baseline CV text/skill/experience/education parser"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM ai_pipeline_versions WHERE code = 'resume-parser-v1'
);

INSERT INTO ai_pipeline_versions
  (code, pipeline_type, semantic_version, config)
SELECT
  'matching-baseline-v1',
  'MATCHING',
  '1.0.0',
  '{"phase":"internship","components":{"skill":0.60,"experience":0.25,"education":0.15}}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM ai_pipeline_versions WHERE code = 'matching-baseline-v1'
);
