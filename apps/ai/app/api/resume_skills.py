from fastapi import APIRouter
from app.parsers.skill_dictionary import SkillAliasEntry, SkillDictionaryEntry, extract_skill_dictionary_matches
from app.schemas.resume_skill import ResumeSkillExtractionRequest, ResumeSkillExtractionResponse, ResumeSkillMatch

router = APIRouter(prefix='/resume', tags=['resume'])

@router.post('/extract-skills', response_model=ResumeSkillExtractionResponse)
def extract_resume_skills(payload: ResumeSkillExtractionRequest) -> ResumeSkillExtractionResponse:
    dictionary = [
        SkillDictionaryEntry(
            id=skill.id,
            name=skill.name,
            normalized_name=skill.normalized_name,
        )
        for skill in payload.skills
    ]

    aliases = [
        SkillAliasEntry(
            skill_id=alias.skill_id,
            alias=alias.alias,
        )
        for alias in payload.aliases
    ]

    matches = extract_skill_dictionary_matches(payload.text, dictionary, aliases)

    return ResumeSkillExtractionResponse(
        skills=[
            ResumeSkillMatch(
                skill_id=match.skill_id,
                matched_text=match.matched_text,
                evidence_text=match.evidence_text,
                confidence=match.confidence,
            )
            for match in matches
        ]
    )