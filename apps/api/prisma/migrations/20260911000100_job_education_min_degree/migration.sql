-- HireSense / Internship / JobVersion minimum education degree for baseline matching

ALTER TABLE job_versions
  ADD COLUMN education_min_degree text;

ALTER TABLE job_versions
  ADD CONSTRAINT job_versions_education_min_degree_chk CHECK (
    education_min_degree IS NULL
    OR education_min_degree IN (
      'HIGH_SCHOOL',
      'ASSOCIATE',
      'BACHELOR',
      'MASTER',
      'DOCTORATE'
    )
  );
