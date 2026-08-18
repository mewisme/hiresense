DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM ai_pipeline_versions
    WHERE code = 'resume-parser-v1.1'
      AND pipeline_type = 'RESUME_PARSER'
  ) THEN
    RAISE EXCEPTION 'resume-parser-v1.1 pipeline is required';
  END IF;
END
$$;

UPDATE ai_pipeline_versions
SET is_active = false
WHERE pipeline_type = 'RESUME_PARSER'
  AND is_active = true;

INSERT INTO ai_pipeline_versions (
  code,
  pipeline_type,
  semantic_version,
  code_revision,
  config,
  is_active
)
SELECT
  'resume-parser-v1.2',
  'RESUME_PARSER',
  '1.2.0',
  code_revision,
  config || '{
    "components": [
      "pdf_text",
      "skill_dictionary",
      "skill_aliases",
      "experience",
      "education"
    ],
    "persistence": "atomic"
  }'::jsonb,
  true
FROM ai_pipeline_versions
WHERE code = 'resume-parser-v1.1';