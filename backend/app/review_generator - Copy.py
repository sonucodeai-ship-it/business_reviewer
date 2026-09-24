import os

from dotenv import load_dotenv
from google import genai


# ---------------------------------------------------------
# Environment
# ---------------------------------------------------------

load_dotenv()


# ---------------------------------------------------------
# Gemini Configuration
# ---------------------------------------------------------

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-3.5-flash-lite",
)


# ---------------------------------------------------------
# Review Generation Prompt
# ---------------------------------------------------------

REVIEW_SYSTEM_PROMPT = """
Write a short Google review based on the customer's experience.

Make it sound like a real Indian customer naturally wrote it after
visiting the clinic. Use simple, everyday Indian English.

Be conversational and human. Do not make the writing too polished,
formal, promotional, or repetitive.

Use only the information provided. Do not invent any treatment results,
medical claims, prices, waiting times, staff behavior, conversations,
facilities, or other experiences.

Naturally include the treatment, doctor, and things the customer liked,
but choose the wording and structure yourself.

Every review should feel different. Vary the opening, sentence structure,
wording, length, and ending. Do not use a fixed template.

Avoid exaggerated praise, advertising language, generic AI phrases, and
repetitive expressions.

Write in first person.

Return only the review text.
Do not include headings, quotes, emojis, hashtags, bullet points,
explanations, or alternatives.
"""


# ---------------------------------------------------------
# Gemini Client
# ---------------------------------------------------------

def get_gemini_client() -> genai.Client:
    """
    Create and return a Gemini client using the API key
    configured in the environment.
    """

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. "
            "Add GEMINI_API_KEY to the backend .env file."
        )

    return genai.Client(api_key=api_key)


# ---------------------------------------------------------
# Generate Review
# ---------------------------------------------------------

def generate_review(
    facilities: list[str],
    doctors: list[str],
    clinic_experience: list[str],
) -> str:
    
    """
    Generate a natural Google review from the customer's
    selected treatment, doctor, and clinic experiences.
    """

    client = get_gemini_client()

    facility_text = "\n".join(
        f"- {facility}"
        for facility in facilities
    )

    doctor_text = "\n".join(
        f"- {doctor}"
        for doctor in doctors
    )

    experience_text = "\n".join(
        f"- {experience}"
        for experience in clinic_experience
    )

    user_input = f"""
    Write a natural Google review for this customer.

    Business:
    Madhu Dentocare Clinic

    Treatments / Facilities:
    {facility_text}

    Doctors:
    {doctor_text}

    What the customer liked:
    {experience_text}
    """

    try:
        interaction = client.interactions.create(
            model=GEMINI_MODEL,
            system_instruction=REVIEW_SYSTEM_PROMPT,
            input=user_input,
            generation_config={
                "temperature": 0.95,
                "max_output_tokens": 180,
            },
        )

    except Exception as error:
        print(f"Gemini API error: {error}")

        raise RuntimeError(
            f"Gemini API request failed: {error}"
        ) from error

    review = (
        getattr(interaction, "output_text", None) or ""
    ).strip()

    if not review:
        raise RuntimeError(
            "Gemini returned an empty review."
        )

    # Remove accidental surrounding quotation marks.
    if (
        len(review) >= 2
        and review.startswith('"')
        and review.endswith('"')
    ):
        review = review[1:-1].strip()

    return review