from datetime import date
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class ResumeExperienceExtractionRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    text: str = Field(min_length=1, max_length=500_000)
    reference_date: date

class ResumeExperienceItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    company_name: str | None = None
    job_title: str | None = None
    start_date: date
    end_date: date | None = None
    is_current: bool
    description: str | None = None
    experience_months: int = Field(ge=0)
    ordinal: int = Field(ge=0)
    confidence: float = Field(ge=0, le=1)

class ResumeExperienceExtractionResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    experiences: list[ResumeExperienceItem]
    warnings: list[str] = Field(default_factory=list)