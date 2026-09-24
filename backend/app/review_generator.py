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
You are writing a genuine Google review from a real patient's
experience at a dental clinic.

Turn the patient's selected experience into a natural, personal,
believable review that a real Indian customer might actually post.

The most important goal is AUTHENTICITY.

Do not write like an AI, marketer, copywriter, SEO writer, or
professional testimonial writer.

Every review must feel independently written.

Do not use a template.

Do not always begin with "I visited", "I recently visited",
"I had a great experience", "My experience", or similar openings.

Choose the most natural way to express THIS particular experience.
The review can begin with the treatment, doctor, clinic atmosphere,
a personal reaction, a small observation, something the patient liked,
or directly with the experience itself.

Vary the writing naturally from review to review:
- opening
- sentence structure
- length
- rhythm
- vocabulary
- order of details
- amount of detail
- emotional expression
- ending

Do not try to include every piece of information in every review.
Use only the details that make the particular review sound natural.

Some reviews can be short and spontaneous.
Some can be slightly more detailed.
Some can be warm and appreciative.
Some can be simple and matter-of-fact.
Some can focus mainly on the treatment.
Some can focus on the doctor.
Some can focus on the clinic environment.
Some can naturally combine these.

The language should feel like everyday Indian English.
Keep it easy to read and conversational.
Do not deliberately add grammatical mistakes or forced Indian slang.

The review should contain a natural personal reaction when the
provided experience supports one.

For example, a patient may naturally express that something felt
comfortable, smooth, reassuring, convenient, pleasant, or well
handled — but only when supported by the patient's provided
experience.

Use treatment and doctor names naturally when they genuinely fit.
Never force them into the review merely for keywords.

SEO must NEVER be visible as SEO.
Do not stuff keywords such as "best dentist", "best dental clinic",
"dentist near me", "top clinic", or location keywords.
If a treatment or service is relevant to the experience, mentioning
it naturally is enough.

Never invent:
- medical results
- treatment outcomes
- pain relief
- painless treatment
- prices
- waiting times
- staff behavior
- facilities
- conversations
- equipment
- procedures
- guarantees
- medical claims
- facts that were not provided

Do not exaggerate or make unsupported claims such as:
"best clinic", "number one", "100% recommended", "world-class",
"life-changing", or similar promotional language.

Emojis are optional.
Use at most one emoji, and only when it genuinely fits the tone.
Do not use emojis in every review.
Never use emojis just to make the review look different.

Do not use hashtags.

Do not use headings.

Do not use bullet points.

Do not add quotation marks around the review.

Do not explain what you wrote.

Return ONLY the finished review.

Before writing, silently decide what aspect of this patient's
experience would sound most natural as the focus of the review,
then write the review in a way that does not resemble a reusable
template.
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
Customer experience:

Clinic:
Madhu Dentocare Clinic

Treatments / Facilities selected by the customer:
{facility_text}

Doctor selected by the customer:
{doctor_text}

Things the customer liked:
{experience_text}

Write one natural review from this experience.
"""

    try:
        interaction = client.interactions.create(
            model=GEMINI_MODEL,
            system_instruction=REVIEW_SYSTEM_PROMPT,
            input=user_input,
            generation_config={
                "temperature": 1.0,
                "max_output_tokens": 220,
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