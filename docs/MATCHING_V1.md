# Matching baseline V1

Pipeline code: `matching-baseline-v1`

```text
FinalScore = SkillScore * 0.60 + ExperienceScore * 0.25 + EducationScore * 0.15
```

## Components

| Component  | Weight | Implementation                                                                 |
| ---------- | ------ | ------------------------------------------------------------------------------ |
| Skill      | 0.60   | Required/preferred skill match against resume parse skills + evidence          |
| Experience | 0.25   | Declared/parsed months vs job `experienceMinMonths`                            |
| Education  | 0.15   | Resume degree text vs job `educationMinDegree` (`education-minimum-degree-v1`) |

Education statuses: `NOT_REQUIRED` / `UNKNOWN` / `MISSING` / `PARTIAL` / `MET`.
If the job has no education minimum, education scores 100 so the 15% weight still participates.

## Trigger

Internship V1: recruiter runs matching via
`POST /api/companies/:companyId/applications/:applicationId/matching/runs`.
Applying to a job does **not** auto-run matching.

## Human-in-the-loop

Scores are a review signal only. Recruiters decide stage transitions; the UI warns that matching does not replace human judgment.
