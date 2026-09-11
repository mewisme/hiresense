# Matching baseline V1

Pipeline code: `matching-baseline-v1`

```text
FinalScore = SkillScore * 0.60 + ExperienceScore * 0.25 + EducationScore * 0.15
```

## Components

| Component  | Weight | Formula version               | Implementation                                                                               |
| ---------- | ------ | ----------------------------- | -------------------------------------------------------------------------------------------- |
| Skill      | 0.60   | `skill-weighted-exact-v1`     | Canonical skill ID match against resume parse skills + evidence; required/preferred coverage |
| Experience | 0.25   | `experience-minimum-v1`       | Quantified resume months vs job `experienceMinMonths`                                        |
| Education  | 0.15   | `education-minimum-degree-v1` | Resume degree text vs job `educationMinDegree`                                               |

Education statuses: `NOT_REQUIRED` / `UNKNOWN` / `MISSING` / `PARTIAL` / `MET`.
If the job has no education minimum, education scores 100 so the 15% weight still participates.

This baseline is **deterministic and explainable**. It is not semantic AI. `MatchSkillResult.similarityScore` exists for Phase II compatibility and is unused by V1 exact matching.

## Trigger

Internship V1: recruiter runs matching via
`POST /api/companies/:companyId/applications/:applicationId/matching/runs`.
Applying to a job does **not** auto-run matching.

## Human-in-the-loop

Scores are a review signal only. Recruiters decide stage transitions; the UI warns that matching does not replace human judgment. Matching never auto-hires or auto-rejects.

## Known V1 limitations

- Experience scoring sums quantified entry months and can over-count overlapping employment periods. Phase II should evaluate interval merge / relevant-experience scoring.
- PDF parsing targets text-based PDFs. Scanned image-only PDFs without OCR are unsupported in V1 and may yield empty text / failed or low-value parses.
- Skill matching is exact canonical-ID matching, not synonym/embedding similarity beyond configured aliases used during extraction.
- Do not mutate an already-used academic pipeline config in place; create a new `AiPipelineVersion` when scoring semantics change.
