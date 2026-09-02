ALTER TABLE job_versions
ADD COLUMN education_min_level text;

ALTER TABLE job_versions
ADD CONSTRAINT job_versions_education_min_level_chk CHECK (
  education_min_level IS NULL
  OR education_min_level IN ('HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE')
);