import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./review_page.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

/*
 * Google review URL for Madhu Dentocare Clinic.
 *
 * This opens the clinic's Google review interface.
 */
const GOOGLE_REVIEW_URL =
  "https://www.google.com/search?q=madhu+dentocare+clinic&sca_esv=459cc50bc9b1d43b&sxsrf=APpeQnuo6eCjuIeR-Pg22EnJrNG2ZQx5dQ%3A1790149807495&source=hp&ei=r4SzasffG93g4-EPmZfkgQw&iflsig=ABILxe8AAAAAarOSv36j6f5HLon3bydABXoN8BwhXgFo&oq=madhu+den&gs_lp=Egdnd3Mtd2l6IgltYWRodSBkZW4qBAgAGCcyBBAjGCcyBRAAGIAEMg4QLhiABBjHARivARiOBTIFEAAYgAQyBRAAGIAEMgUQABiABDILEC4YgAQYxwEYrwEyCxAuGIAEGMcBGK8BMgUQABiABDIFEAAYgARIpR5Q9QdYyxJwAXgAkAEAmAG9AaAByQuqAQMwLjm4AQHIAQD4AQGYAgqgAvsLqAIKwgIHECMY6gIYJ8ICChAAGIAEGIoFGEPCAg4QLhiABBixAxjHARjRA8ICDRAAGIAEGIoFGEMYsQPCAhAQABiABBiKBRhDGLEDGIMBwgIQEC4YgAQYigUYQxjHARjRA8ICCxAuGIAEGMcBGK8BMgUQABiABDIFEAAYgARIpR5Q9QdYyxJwAXgAkAEAmAG9AaAByQuqAQMwLjm4AQHIAQD4AQGYAgqgAvsLqAIKwgIHECMY6gIYJ8ICChAAGIAEGIoFGEPCAg4QLhiABBixAxjHARjRA8ICDRAAGIAEGIoFGEMYsQPCAhAQLhiABBiKBRhDGLEDGIMBwgILEAAYgAQYsQMYgwHCAhQQLhiABBixAxjHARivARiYBRiOBcICCBAAGIAEGLEDwgIIEAAYgAQYtAfCAgUQLhiABMICCBAuGIAEGLEDwgIOEAAYgAQYyQMYxwEYrwHCAgoQABiABBgCGMsBmAML8QWSZkvkThrMaZIHAzEuOaAHnmqyBwMwLjm4B-8LwgcHMC40LjUuMcgHJYAIAQ&sclient=gws-wiz#lrd=0x390d1b6aef4792d7:0x63380d1c6af10b87,3,,,,";

function ReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    review: initialReview,
    facility = "",
    doctor = "",
    clinicExperience = [],
  } = location.state || {};

  const [review, setReview] = useState(initialReview || "");

  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] =
    useState(false);
  const [isOpeningGoogle, setIsOpeningGoogle] =
    useState(false);
  const [error, setError] = useState("");

  /*
   * Copy the currently displayed review.
   */
  const copyReviewToClipboard = async () => {
    const reviewText = review.trim();

    if (!reviewText) {
      throw new Error("There is no review to copy.");
    }

    await navigator.clipboard.writeText(reviewText);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 2500);
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
   * Regenerate the review using the same customer selections.
   */
  const handleRegenerate = async () => {
    if (
      isRegenerating ||
      !facility ||
      !doctor ||
      clinicExperience.length === 0
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
            facility,
            doctor,
            clinic_experience: clinicExperience,
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
   * Prepare the review for Google.
   *
   * Important:
   * Browsers cannot directly type into Google's review form
   * or select the star rating because Google's page is hosted
   * on a different origin.
   *
   * We can, however:
   *
   * 1. Copy the latest review automatically.
   * 2. Open Google's review page.
   *
   * The customer then selects 5 stars and pastes/submits
   * the review.
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
     * Open the Google page immediately.
     *
     * Opening the window synchronously inside the click
     * handler helps prevent browser popup blocking.
     */
    const googleWindow = window.open(
      GOOGLE_REVIEW_URL,
      "_blank",
      "noopener,noreferrer"
    );

    try {
      /*
       * Copy the exact review currently visible to the user.
       */
      await navigator.clipboard.writeText(reviewText);

      setCopied(true);

      /*
       * If the browser blocked the new tab, inform the user.
       */
      if (!googleWindow) {
        throw new Error(
          "Google could not be opened because the browser blocked the popup."
        );
      }

      /*
       * Give the user a clear indication that the review
       * has been copied and Google has been opened.
       */
      window.setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (googleError) {
      console.error(
        "Unable to prepare Google review:",
        googleError
      );

      /*
       * Google may already be open even if clipboard access
       * failed. Therefore we don't close the tab.
       */
      setError(
        "Google has been opened. Please copy the review manually and paste it into the review box."
      );
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
                <div className="ai-icon">!</div>

                <div>
                  <h3>Review not found</h3>

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
        {/* Header */}
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

        {/* Progress */}
        <div className="progress-wrapper">
          <div className="progress-step completed">
            <div className="progress-circle">
              ✓
            </div>

            <span>Your Experience</span>
          </div>

          <div className="progress-line active"></div>

          <div className="progress-step current">
            <div className="progress-circle">
              2
            </div>

            <span>Review</span>
          </div>

          <div className="progress-line"></div>

          <div className="progress-step">
            <div className="progress-circle">
              3
            </div>

            <span>Google</span>
          </div>
        </div>

        {/* Intro */}
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

        {/* Error */}
        {error && (
          <div
            className="error-message"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Main content */}
        <section className="review-content">
          {/* Left side */}
          <div className="review-main-card">
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

            <div className="rating-row">
              <div className="stars">
                ★★★★★
              </div>

              <span>
                Share your experience
              </span>
            </div>

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
                  }}
                  autoFocus
                  aria-label="Edit your review"
                />
              ) : (
                <p>{review}</p>
              )}
            </div>

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

            {/* Actions */}
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

          {/* Right side */}
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

            {/* Facility */}
            <div className="summary-item">
              <div className="summary-icon">
                +
              </div>

              <div className="summary-detail">
                <span>FACILITY</span>

                <strong>
                  {facility}
                </strong>
              </div>
            </div>

            {/* Doctor */}
            <div className="summary-item">
              <div className="summary-avatar">
                {doctor
                  .replace("Dr. ", "")
                  .charAt(0)
                  .toUpperCase() || "D"}
              </div>

              <div className="summary-detail">
                <span>DOCTOR</span>

                <strong>
                  {doctor}
                </strong>
              </div>
            </div>

            {/* Experience */}
            <div className="summary-item experience-summary-item">
              <div className="summary-icon">
                ♡
              </div>

              <div className="summary-detail">
                <span>YOU LIKED</span>

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

            <div className="summary-divider"></div>

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

        {/* Bottom CTA */}
        <section className="google-section">
          <div className="google-message">
            <div className="google-icon">
              G
            </div>

            <div>
              <strong>
                Ready to share your experience?
              </strong>

              <span>
                Your review will be copied before
                opening Google.
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
        </section>

        {/* Footer */}
        <footer className="review-footer">
          <span>
            Madhu Dentocare Clinic
          </span>

          <span>•</span>

          <span>
            Thank you for sharing your experience
          </span>
        </footer>
      </main>
    </div>
  );
}

export default ReviewPage;