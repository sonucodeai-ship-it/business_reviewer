import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./review_page.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/*
 * Google review URL for Madhu Dentocare Clinic.
 */
const GOOGLE_REVIEW_URL =
  "https://g.page/r/CYcL8WocDThjEBM/review";

/*
 * Copy text to clipboard.
 *
 * Uses the modern Clipboard API first and falls back
 * to a temporary textarea for older browsers.
 */
const copyTextToClipboard = async (text) => {
  const cleanText = text?.trim();

  if (!cleanText) {
    throw new Error("There is no review to copy.");
  }

  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(cleanText);
    return true;
  }

  const textarea = document.createElement("textarea");

  textarea.value = cleanText;

  textarea.setAttribute("readonly", "");

  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";

  document.body.appendChild(textarea);

  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }

  return true;
};

function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * Data received from first_page.jsx.
   *
   * All four question groups are arrays because
   * every question supports multi-select.
   */
  const {
    review: initialReview,
    facilities = [],
    doctors = [],
    clinicExperience = [],
    overallExperience = [],
  } = location.state || {};

  const [review, setReview] = useState(initialReview || "");

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isOpeningGoogle, setIsOpeningGoogle] = useState(false);
  const [error, setError] = useState("");

  /*
   * Show copied state temporarily.
   */
  const showCopiedState = (duration = 2500) => {
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, duration);
  };

  /*
   * Copy the currently displayed review.
   */
  const copyReviewToClipboard = async () => {
    const reviewText = review.trim();

    if (!reviewText) {
      throw new Error("There is no review to copy.");
    }

    await copyTextToClipboard(reviewText);

    showCopiedState();
  };

  /*
   * Manual copy button.
   */
  const handleCopy = async () => {
    if (!review.trim()) {
      setError("There is no review to copy.");
      return;
    }

    try {
      setError("");

      await copyReviewToClipboard();
    } catch (copyError) {
      console.error(
        "Unable to copy review:",
        copyError
      );

      setError(
        "Unable to copy the review automatically. Please copy it manually."
      );
    }
  };

  /*
   * Regenerate the review using the same four
   * customer selections.
   */
  const handleRegenerate = async () => {
    if (
      isRegenerating ||
      facilities.length === 0 ||
      doctors.length === 0 ||
      clinicExperience.length === 0 ||
      overallExperience.length === 0
    ) {
      return;
    }

    setIsRegenerating(true);
    setError("");
    setCopied(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/reviews/generate`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            facilities,
            doctors,
            clinic_experience: clinicExperience,
            overall_experience: overallExperience,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success || !data.review) {
        throw new Error(
          "Invalid review response from server."
        );
      }

      setReview(data.review);
      setIsEditing(false);
      setCopied(false);
    } catch (regenerateError) {
      console.error(
        "Review regeneration failed:",
        regenerateError
      );

      setError(
        "Unable to regenerate the review. Please try again."
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  /*
   * Copy the review and open Google.
   *
   * Browser security prevents this application from
   * directly typing into Google's review textbox.
   *
   * Flow:
   *
   * 1. Open Google immediately from the click.
   * 2. Copy the current review.
   * 3. User pastes the review into Google.
   */
  const handleGoogleReview = async () => {
    const reviewText = review.trim();

    if (!reviewText) {
      setError(
        "Please generate a review before continuing to Google."
      );

      return;
    }

    if (isOpeningGoogle) {
      return;
    }

    setIsOpeningGoogle(true);
    setError("");

    /*
     * Open Google synchronously from the user click.
     * This helps prevent popup blocking.
     */
    const googleWindow = window.open(
      GOOGLE_REVIEW_URL,
      "_blank",
      "noopener,noreferrer"
    );

    try {
      /*
       * Copy the exact review visible on the page.
       */
      await copyTextToClipboard(reviewText);

      showCopiedState(3500);

      if (!googleWindow) {
        throw new Error(
          "Google could not be opened because the browser blocked the popup."
        );
      }

      /*
       * We intentionally do not access or modify Google's page.
       */
      window.setTimeout(() => {
        setError("");
      }, 500);
    } catch (googleError) {
      console.error(
        "Unable to prepare Google review:",
        googleError
      );

      /*
       * Do not close Google if it already opened.
       */
      if (!googleWindow) {
        setError(
          "Google could not be opened. Please allow pop-ups and try again."
        );
      } else {
        setError(
          "Google is open. Please copy the review manually and paste it into the review box."
        );
      }
    } finally {
      setIsOpeningGoogle(false);
    }
  };

  /*
   * Prevent the page from being used without review data.
   */
  if (!initialReview) {
    return (
      <div className="review-generator-page">
        <main className="review-generator-container">

          <section className="review-main-card">

            <div className="card-top">

              <div className="ai-title">

                <div className="ai-icon">
                  !
                </div>

                <div>
                  <h3>
                    Review not found
                  </h3>

                  <span>
                    Please generate a review first.
                  </span>
                </div>

              </div>

            </div>

            <div className="review-text-box">
              <p>
                Your review session could not be found.
                Please go back and complete your experience
                details.
              </p>
            </div>

            <div className="review-actions">

              <button
                type="button"
                className="copy-button"
                onClick={() => navigate("/")}
              >
                ← Back to Experience
              </button>

            </div>

          </section>

        </main>
      </div>
    );
  }

  return (
    <div className="review-generator-page">

      {/* Background decorations */}
      <div className="review-bg-circle review-circle-one"></div>
      <div className="review-bg-circle review-circle-two"></div>

      <main className="review-generator-container">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="review-page-header">

          <div className="review-brand">

            <div className="review-logo">
              M
            </div>

            <div>
              <h1>Madhu Dentocare</h1>
              <span>Dental Clinic</span>
            </div>

          </div>

          <div className="secure-badge">

            <span className="secure-icon">
              ✓
            </span>

            Your experience

          </div>

        </header>

        {/* =================================================
            PROGRESS
        ================================================= */}

        <div className="progress-wrapper">

          <div className="progress-step completed">

            <div className="progress-circle">
              ✓
            </div>

            <span>
              Your Experience
            </span>

          </div>

          <div className="progress-line active"></div>

          <div className="progress-step current">

            <div className="progress-circle">
              2
            </div>

            <span>
              Review
            </span>

          </div>

          <div className="progress-line"></div>

          <div className="progress-step">

            <div className="progress-circle">
              3
            </div>

            <span>
              Google
            </span>

          </div>

        </div>

        {/* =================================================
            INTRO
        ================================================= */}

        <section className="review-intro">

          <span className="review-eyebrow">
            AI REVIEW ASSISTANT
          </span>

          <h2>
            Here's your
            <span> review</span>
          </h2>

          <p>
            We've turned your experience into a natural
            review. Feel free to edit it before sharing.
          </p>

        </section>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div
            className="error-message"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* =================================================
            MAIN CONTENT
        ================================================= */}

        <section className="review-content">

          {/* =================================================
              AI REVIEW CARD
          ================================================= */}

          <div className="review-main-card">

            {/* Card header */}

            <div className="card-top">

              <div className="ai-title">

                <div className="ai-icon">
                  ✦
                </div>

                <div>
                  <h3>
                    AI-generated review
                  </h3>

                  <span>
                    Based on your experience
                  </span>
                </div>

              </div>

              <div className="generated-badge">

                <span></span>

                Generated

              </div>

            </div>

            {/* Rating */}

            <div className="rating-row">

              <div className="stars">
                ★★★★★
              </div>

              <span>
                Share your experience
              </span>

            </div>

            {/* Review text */}

            <div
              className={`review-text-box ${
                isEditing ? "editing" : ""
              }`}
            >

              {isEditing ? (
                <textarea
                  value={review}
                  onChange={(event) => {
                    setReview(event.target.value);
                    setCopied(false);
                    setError("");
                  }}
                  autoFocus
                  aria-label="Edit your review"
                />
              ) : (
                <p>
                  {review}
                </p>
              )}

            </div>

            {/* Review meta */}

            <div className="review-meta">

              <span>
                {review.length} characters
              </span>

              <span className="meta-dot">
                •
              </span>

              <span>
                Natural & personal
              </span>

            </div>

            {/* =================================================
                GOOGLE CTA
                Moved INSIDE the AI review card
            ================================================= */}

            <div className="google-review-card">

              <div className="google-review-info">

                <div className="google-icon">
                  G
                </div>

                <div>

                  <strong>
                    Ready to share?
                  </strong>

                  <span>
                    Your review will be copied before Google opens.
                  </span>

                </div>

              </div>

              <button
                type="button"
                className="google-button"
                onClick={handleGoogleReview}
                disabled={isOpeningGoogle}
              >

                <span>
                  {isOpeningGoogle
                    ? "Opening Google..."
                    : "Copy & Continue to Google"}
                </span>

                <span className="google-arrow">
                  {isOpeningGoogle
                    ? "..."
                    : "→"}
                </span>

              </button>

            </div>

            {/* =================================================
                SECONDARY ACTIONS
            ================================================= */}

            <div className="review-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setIsEditing(
                    (current) => !current
                  );

                  setError("");
                }}
              >

                <span>
                  {isEditing ? "✓" : "✎"}
                </span>

                {isEditing
                  ? "Save Changes"
                  : "Edit Review"}

              </button>

              <button
                type="button"
                className={`secondary-button ${
                  isRegenerating
                    ? "loading"
                    : ""
                }`}
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >

                <span
                  className={
                    isRegenerating
                      ? "spin"
                      : ""
                  }
                >
                  ↻
                </span>

                {isRegenerating
                  ? "Generating..."
                  : "Regenerate"}

              </button>

              <button
                type="button"
                className="copy-button"
                onClick={handleCopy}
              >

                <span>
                  {copied ? "✓" : "▣"}
                </span>

                {copied
                  ? "Copied!"
                  : "Copy Review"}

              </button>

            </div>

          </div>

          {/* =================================================
              EXPERIENCE SUMMARY
          ================================================= */}

          <aside className="experience-summary">

            <div className="summary-header">

              <div>

                <span className="summary-eyebrow">
                  YOUR INPUT
                </span>

                <h3>
                  Experience summary
                </h3>

              </div>

              <div className="summary-check">
                ✓
              </div>

            </div>

            {/* Facilities */}

            <div className="summary-item">

              <div className="summary-icon">
                +
              </div>

              <div className="summary-detail">

                <span>
                  FACILITIES
                </span>

                <div className="tag-list">

                  {facilities.map((facility) => (
                    <span
                      key={facility}
                      className="experience-tag"
                    >
                      {facility}
                    </span>
                  ))}

                </div>

              </div>

            </div>

            {/* Doctors */}

            <div className="summary-item">

              <div className="summary-avatar">

                {doctors.length > 0
                  ? doctors[0]
                      .replace("Dr. ", "")
                      .charAt(0)
                      .toUpperCase()
                  : "D"}

              </div>

              <div className="summary-detail">

                <span>
                  DOCTORS
                </span>

                <div className="tag-list">

                  {doctors.map((doctor) => (
                    <span
                      key={doctor}
                      className="experience-tag"
                    >
                      {doctor}
                    </span>
                  ))}

                </div>

              </div>

            </div>

            {/* Clinic experience */}

            <div className="summary-item experience-summary-item">

              <div className="summary-icon">
                ♡
              </div>

              <div className="summary-detail">

                <span>
                  YOU LIKED
                </span>

                <div className="tag-list">

                  {clinicExperience.map(
                    (experience) => (
                      <span
                        key={experience}
                        className="experience-tag"
                      >
                        {experience}
                      </span>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* Overall experience */}

            <div className="summary-item experience-summary-item">

              <div className="summary-icon overall-summary-icon">
                ★
              </div>

              <div className="summary-detail">

                <span>
                  OVERALL EXPERIENCE
                </span>

                <div className="tag-list">

                  {overallExperience.map(
                    (experience) => (
                      <span
                        key={experience}
                        className="experience-tag overall-tag"
                      >
                        {experience}
                      </span>
                    )
                  )}

                </div>

              </div>

            </div>

            <div className="summary-divider"></div>

            {/* AI note */}

            <div className="ai-note">

              <div className="note-icon">
                ✦
              </div>

              <div>

                <strong>
                  Made from your answers
                </strong>

                <p>
                  Your review reflects the
                  experience you selected.
                </p>

              </div>

            </div>

          </aside>

        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="review-footer">

          <span>
            Madhu Dentocare Clinic
          </span>

          <span>
            •
          </span>

          <span>
            Thank you for sharing your experience
          </span>

        </footer>

      </main>
    </div>
  );
}

export default ReviewPage;