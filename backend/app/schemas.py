from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    facility: str = Field(..., min_length=1)
    doctor: str = Field(..., min_length=1)
    clinic_experience: list[str] = Field(..., min_length=1)


class ReviewResponse(BaseModel):
    success: bool
    review: str