from datetime import date
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class ResumeEducationExtractionRequest(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    text: str = Field(min_length=1, max_length=500_000)

class ResumeEducationItem(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    institution_name: str | None = None
    degree: str | None = None
    field_of_study: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    ordinal: int = Field(ge=0)
    confidence: float = Field(ge=0, le=1)

class ResumeEducationExtractionResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    educations: list[ResumeEducationItem]
    warnings: list[str] = Field(default_factory=list)