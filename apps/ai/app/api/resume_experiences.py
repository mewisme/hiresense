from fastapi import APIRouter
from app.parsers.resume_experience import extract_resume_experiences
from app.schemas.resume_experience import ResumeExperienceExtractionRequest, ResumeExperienceExtractionResponse, ResumeExperienceItem

router = APIRouter(prefix='/resume', tags=['resume'])

@router.post('/extract-experiences', response_model=ResumeExperienceExtractionResponse)
def extract_experiences(payload: ResumeExperienceExtractionRequest) -> ResumeExperienceExtractionResponse:
    result = extract_resume_experiences(payload.text, payload.reference_date)

    return ResumeExperienceExtractionResponse(
        experiences=[
            ResumeExperienceItem(
                company_name=item.company_name,
                job_title=item.job_title,
                start_date=item.start_date,
                end_date=item.end_date,
                is_current=item.is_current,
                description=item.description,
                experience_months=item.experience_months,
                ordinal=item.ordinal,
                confidence=item.confidence,
            )
            for item in result.experiences
        ],
        warnings=result.warnings,
    )