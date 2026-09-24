from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import ReviewRequest, ReviewResponse
from app.review_generator import generate_review


app = FastAPI(
    title="AI Review Generator",
    description="AI-powered Google review generation API",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------
# Allows the React/Vite frontend to communicate
# with the FastAPI backend during development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-reviewer-0ssx.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------
@app.get("/")
def root():
    return {
        "success": True,
        "message": "AI Review Generator API is running",
    }


# ---------------------------------------------------------
# Generate Review
# ---------------------------------------------------------
@app.post(
    "/api/reviews/generate",
    response_model=ReviewResponse,
)
def generate_review_api(
    request: ReviewRequest,
):
    try:
        review = generate_review(
            facilities=request.facilities,
            doctors=request.doctors,
            clinic_experience=request.clinic_experience,
        )

        return {
            "success": True,
            "review": review,
        }

    except RuntimeError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        ) from error

    except Exception as error:
        print(
            f"Unexpected review generation error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate the review. "
                "Please try again."
            ),
        ) from error