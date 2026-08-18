from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class SkillDictionaryItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    id: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=200)
    normalized_name: str = Field(min_length=1, max_length=200)

class ResumeSkillExtractionRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    text: str = Field(min_length=1, max_length=500_000)
    skills: list[SkillDictionaryItem] = Field(max_length=5_000)

class ResumeSkillMatch(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    skill_id: str
    matched_text: str
    evidence_text: str
    confidence: float = Field(ge=0, le=1)

class ResumeSkillExtractionResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    skills: list[ResumeSkillMatch]