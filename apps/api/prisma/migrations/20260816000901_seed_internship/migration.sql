INSERT INTO skill_categories (
  code,
  name,
  description
)
VALUES
  (
    'PROGRAMMING_LANGUAGE',
    'Programming Language',
    'Programming languages used in software development.'
  ),
  (
    'FRONTEND',
    'Frontend',
    'Frontend frameworks, libraries, and browser technologies.'
  ),
  (
    'BACKEND',
    'Backend',
    'Backend frameworks, runtimes, and server-side technologies.'
  ),
  (
    'DATABASE',
    'Database',
    'Relational, document, key-value, and other database technologies.'
  ),
  (
    'CLOUD',
    'Cloud',
    'Cloud platforms and cloud-native services.'
  ),
  (
    'DEVOPS',
    'DevOps',
    'CI/CD, containers, infrastructure, and operational tooling.'
  ),
  (
    'TESTING',
    'Testing',
    'Software testing frameworks, techniques, and tooling.'
  ),
  (
    'AI_ML',
    'AI / Machine Learning',
    'Artificial intelligence and machine learning technologies.'
  ),
  (
    'DATA',
    'Data',
    'Data engineering, analytics, and data processing technologies.'
  ),
  (
    'SOFT_SKILL',
    'Soft Skill',
    'Non-technical professional and interpersonal skills.'
  ),
  (
    'LANGUAGE',
    'Language',
    'Natural language proficiency and communication languages.'
  )
ON CONFLICT (code)
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;