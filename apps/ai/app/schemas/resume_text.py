from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class ResumeTextExtractionResponse(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    text: str
    page_count: int
    text_length: int
    warnings: list[str] = Field(default_factory=list)