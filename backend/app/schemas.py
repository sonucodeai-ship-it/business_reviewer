from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    facilities: list[str] = Field(..., min_length=1)
    doctors: list[str] = Field(..., min_length=1)
    clinic_experience: list[str] = Field(..., min_length=1)


class ReviewResponse(BaseModel):
    success: bool
    review: str