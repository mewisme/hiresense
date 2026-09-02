export const JOB_EDUCATION_LEVELS = ['HIGH_SCHOOL', 'ASSOCIATE', 'BACHELOR', 'MASTER', 'DOCTORATE'] as const;

export type JobEducationLevel = typeof JOB_EDUCATION_LEVELS[number];