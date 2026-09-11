export const EDUCATION_MIN_DEGREES = [
  'HIGH_SCHOOL',
  'ASSOCIATE',
  'BACHELOR',
  'MASTER',
  'DOCTORATE',
] as const;

export type EducationMinDegree = (typeof EDUCATION_MIN_DEGREES)[number];

export function isEducationMinDegree(
  value: string,
): value is EducationMinDegree {
  return (EDUCATION_MIN_DEGREES as readonly string[]).includes(value);
}
