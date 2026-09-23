import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./first_page.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const FACILITIES = [
  "RCT",
  "Filling",
  "Cap",
  "Extraction",
  "Ortho",
  "Cleaning",
];

const DOCTORS = [
  "Dr. Bharti Vats",
  "Dr. Dharmendra Kumar",
  "Dr. Megha",
  "Dr. Heena",
];

const EXPERIENCES = [
  "Nice Area",
  "Nice Cleaning",
  "Nice Welcoming",
  "Good Nature",
];

const EXPERIENCE_ICONS = {
  "Nice Area": "⌂",
  "Nice Cleaning": "✦",
  "Nice Welcoming": "♡",
  "Good Nature": "☺",
};

function FirstPage() {
  const navigate = useNavigate();

  const [facility, setFacility] = useState("");
  const [doctor, setDoctor] = useState("");
  const [clinicExperience, setClinicExperience] = useState([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const isComplete =
    Boolean(facility) &&
    Boolean(doctor) &&
    clinicExperience.length > 0;

  const toggleExperience = (experience) => {
    setError("");

    setClinicExperience((current) => {
      if (current.includes(experience)) {
        return current.filter((item) => item !== experience);
      }

      return [...current, experience];
    });
  };

  const handleContinue = async () => {
    if (!isComplete || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setError("");

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
        throw new Error("Invalid review response from server.");
      }

      navigate("/review", {
        state: {
          review: data.review,
          facility,
          doctor,
          clinicExperience,
        },
      });
    } catch (requestError) {
      console.error(
        "Review generation failed:",
        requestError
      );

      setError(
        "Unable to generate your review. Please make sure the backend is running and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="review-page">
      {/* Background decoration */}
      <div className="background-circle circle-one"></div>
      <div className="background-circle circle-two"></div>

      <main className="review-container">
        {/* Header */}
        <header className="clinic-header">
          <div className="clinic-logo">
            <div className="logo-icon">M</div>

            <div className="clinic-name">
              <h1>Madhu Dentocare</h1>
              <span>Dental Clinic</span>
            </div>
          </div>

          <div className="header-badge">
            <span className="badge-dot"></span>
            User Experience
          </div>
        </header>

        {/* Intro */}
        <section className="intro-section">
          <span className="eyebrow">
            YOUR EXPERIENCE MATTERS
          </span>

          <h2>
            Tell us about your
            <span> experience</span>
          </h2>

          <p>
            Answer a few simple questions about your visit.
            We'll use your answers to help create your review.
          </p>
        </section>

        {/* Form */}
        <section className="questions-card">
          {/* Question 1 */}
          <div className="question-section">
            <div className="question-heading">
              <div className="question-number">01</div>

              <div>
                <h3>Which facility did you take?</h3>
                <p>
                  Select the treatment you received.
                </p>
              </div>
            </div>

            <div className="options-grid">
              {FACILITIES.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`option-card ${
                    facility === item ? "selected" : ""
                  }`}
                  onClick={() => {
                    setFacility(item);
                    setError("");
                  }}
                  disabled={isGenerating}
                >
                  <span className="option-icon">+</span>

                  <span>{item}</span>

                  <span className="selection-check">
                    ✓
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider"></div>

          {/* Question 2 */}
          <div className="question-section">
            <div className="question-heading">
              <div className="question-number">02</div>

              <div>
                <h3>Which doctor treated you?</h3>
                <p>
                  Select the doctor who handled your treatment.
                </p>
              </div>
            </div>

            <div className="doctor-grid">
              {DOCTORS.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`doctor-card ${
                    doctor === item ? "selected" : ""
                  }`}
                  onClick={() => {
                    setDoctor(item);
                    setError("");
                  }}
                  disabled={isGenerating}
                >
                  <div className="doctor-avatar">
                    {item
                      .replace("Dr. ", "")
                      .charAt(0)}
                  </div>

                  <div className="doctor-info">
                    <span className="doctor-label">
                      DENTIST
                    </span>

                    <strong>{item}</strong>
                  </div>

                  <span className="selection-check">
                    ✓
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="divider"></div>

          {/* Question 3 */}
          <div className="question-section">
            <div className="question-heading">
              <div className="question-number">03</div>

              <div>
                <h3>How did you like the clinic?</h3>
                <p>
                  Select everything that describes your
                  experience.
                </p>
              </div>
            </div>

            <div className="experience-grid">
              {EXPERIENCES.map((item) => {
                const isSelected =
                  clinicExperience.includes(item);

                return (
                  <button
                    key={item}
                    type="button"
                    className={`experience-card ${
                      isSelected ? "selected" : ""
                    }`}
                    onClick={() =>
                      toggleExperience(item)
                    }
                    disabled={isGenerating}
                  >
                    <span className="experience-icon">
                      {EXPERIENCE_ICONS[item]}
                    </span>

                    <span>{item}</span>

                    <span className="selection-check">
                      ✓
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="action-section">
            <div className="selection-status">
              <div className="status-icon">
                {isComplete ? "✓" : "!"}
              </div>

              <div>
                <strong>
                  {isComplete
                    ? "Ready to generate"
                    : "Almost there"}
                </strong>

                <span>
                  {isComplete
                    ? "Your selections are ready."
                    : "Select your experience above to continue."}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="continue-button"
              disabled={!isComplete || isGenerating}
              onClick={handleContinue}
            >
              <span>
                {isGenerating
                  ? "Generating..."
                  : "OK, Continue"}
              </span>

              <span className="arrow">
                {isGenerating ? "..." : "→"}
              </span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="page-footer">
          <span>Madhu Dentocare Clinic</span>

          <span className="footer-dot">•</span>

          <span>Your feedback helps us improve</span>
        </footer>
      </main>
    </div>
  );
}

export default FirstPage;
