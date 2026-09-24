import React, { useState, useEffect } from "react";

// Helper to match step description to a relevant emoji
function getStepEmoji(text) {
  if (!text) return "💇‍♀️";
  const lowerText = text.toLowerCase();
  if (lowerText.includes("comb") || lowerText.includes("detangle") || lowerText.includes("brush")) return "🪮";
  if (lowerText.includes("twist") || lowerText.includes("braid")) return "🌀";
  if (lowerText.includes("spray") || lowerText.includes("product") || lowerText.includes("mousse") || lowerText.includes("gel")) return "🧴";
  if (lowerText.includes("curl") || lowerText.includes("curling iron")) return "🌪️";
  if (lowerText.includes("pin") || lowerText.includes("clip") || lowerText.includes("bobby pin")) return "📌";
  if (lowerText.includes("dry") || lowerText.includes("blow dry")) return "💨";
  if (lowerText.includes("section") || lowerText.includes("part")) return "✂️";
  if (lowerText.includes("wrap") || lowerText.includes("bun")) return "🎀";
  return "💇‍♀️";
}

export default function HairstyleResult({ resultData, token, backendUrl }) {
  const { historyId, preferences, result } = resultData;
  const [completedSteps, setCompletedSteps] = useState({});
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setCompletedSteps({});
    setError("");
    setSuccessMsg("");
  }, [resultData]);

  const toggleStep = (stepNumber) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleFindSalons = () => {
    const occasion = preferences.occasion || "hairstyle";
    const style = result.youtubeSearchQuery || "hairstyle";
    const encoded = encodeURIComponent(`salons near me for ${occasion} ${style}`);
    const fallbackUrl = `https://www.google.com/maps/search/${encoded}`;

    if (!navigator.geolocation) {
      window.open(fallbackUrl, "_blank");
      return;
    }

    const timer = setTimeout(() => window.open(fallbackUrl, "_blank"), 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps/search/${encoded}/@${latitude},${longitude},14z`;
        window.open(mapsUrl, "_blank");
      },
      () => {
        clearTimeout(timer);
        window.open(fallbackUrl, "_blank");
      },
      { timeout: 4500, enableHighAccuracy: false }
    );
  };

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    result.youtubeSearchQuery
  )}`;

  return (
    <div className="glass-card result-card" style={{ textAlign: "left" }}>
      {/* Title & Metadata */}
      <div className="result-header">
        <div>
          <span className="result-meta-pill" style={{ marginBottom: "10px", display: "inline-block" }}>
            {preferences.gender ? `${preferences.gender} • ` : ""}{preferences.occasion} • {preferences.stylingPreference}
          </span>
          <h2 className="serif-title" style={{ fontSize: "26px" }}>
            Your Personalized AI Hairstyle
          </h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Designed for {preferences.hairLength} {preferences.hairType} hair.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="result-total-time-val">
            {result.totalTimeMinutes}m
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Total Time</div>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Featured YouTube Tutorial Card */}
      <div className="youtube-tutorial-card">
        <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "6px" }}>
          🎥 Watch the Full Tutorial
        </div>
        <div style={{ fontSize: "15px", fontWeight: "600", color: "var(--color-primary)", marginBottom: "4px" }}>
          {preferences.hairLength} {preferences.hairType} Style for {preferences.occasion}
        </div>
        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginBottom: "20px", fontStyle: "italic" }}>
          Search Query: "{result.youtubeSearchQuery}"
        </div>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-youtube"
        >
          <span>▶</span> Watch Tutorial on YouTube
        </a>
      </div>

      {/* Stepper Steps */}
      <div className="generator-section-title">Step-by-Step Instructions</div>
      <div className="steps-container">
        {result.steps.map((step) => {
          const isCompleted = !!completedSteps[step.stepNumber];
          return (
            <div
              key={step.stepNumber}
              className={`step-card ${isCompleted ? "completed" : ""}`}
              onClick={() => toggleStep(step.stepNumber)}
            >
              <div className="step-checkbox">
                {isCompleted && "✓"}
              </div>
              <div className="step-content">
                <div className="step-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="step-emoji-badge">
                      {getStepEmoji(step.instruction)}
                    </div>
                    <span className="step-number">Step {step.stepNumber}</span>
                  </div>
                  <span className="step-duration">{step.durationMinutes} min</span>
                </div>
                <div className="step-desc" style={{ marginTop: "10px" }}>{step.instruction}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {result.tips && result.tips.length > 0 && (
        <div className="tips-container">
          <div className="tips-title">Stylist Pro Tips</div>
          <ul className="tips-list">
            {result.tips.map((tip, idx) => (
              <li key={idx}>{tip}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Find Nearby Salons Card */}
      <div className="salon-finder-card">
        <div style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>
          💇‍♀️ Prefer a Professional?
        </div>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginBottom: "20px", margin: "0 auto 20px", maxWidth: "340px" }}>
          Let an expert bring this look to life.
        </p>
        <button
          type="button"
          onClick={handleFindSalons}
          className="btn btn-primary"
          style={{ width: "100%" }}
        >
          📍 Find Top Salons Near Me
        </button>
      </div>

      {/* Action Footer */}
      <div className="result-footer">
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ display: "inline-flex", gap: "8px", width: "100%" }}
        >
          <span>📺</span> Search YouTube Tutorials
        </a>
      </div>
    </div>
  );
}
