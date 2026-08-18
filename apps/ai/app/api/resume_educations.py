from fastapi import APIRouter
from app.parsers.resume_education import extract_resume_educations
from app.schemas.resume_education import ResumeEducationExtractionRequest, ResumeEducationExtractionResponse, ResumeEducationItem

router = APIRouter(prefix='/resume', tags=['resume'])

@router.post('/extract-educations', response_model=ResumeEducationExtractionResponse)
def extract_educations(payload: ResumeEducationExtractionRequest) -> ResumeEducationExtractionResponse:
    result = extract_resume_educations(payload.text)

    return ResumeEducationExtractionResponse(
        educations=[
            ResumeEducationItem(
                institution_name=item.institution_name,
                degree=item.degree,
                field_of_study=item.field_of_study,
                start_date=item.start_date,
                end_date=item.end_date,
                description=item.description,
                ordinal=item.ordinal,
                confidence=item.confidence,
            )
            for item in result.educations
        ],
        warnings=result.warnings,
    )