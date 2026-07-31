import React, { useState, useEffect } from "react";

export default function HairstyleResult({ resultData, token, backendUrl }) {
  const { historyId, preferences, result } = resultData;
  const [completedSteps, setCompletedSteps] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Reset state when new resultData is loaded
  useEffect(() => {
    setCompletedSteps({});
    setIsSaved(false);
    setError("");
    setSuccessMsg("");
  }, [resultData]);

  const toggleStep = (stepNumber) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleSave = async () => {
    if (isSaved) return;
    setSaveLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ historyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save to favorites.");
      }

      setIsSaved(true);
      setSuccessMsg("Added to Favorites successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
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
            {preferences.occasion} • {preferences.stylingPreference}
          </span>
          <h2 className="serif-title" style={{ fontSize: "26px", color: "#ffffff" }}>
            Your Personalized AI Hairstyle
          </h2>
          <p style={{ fontSize: "14px", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Designed for {preferences.hairLength} {preferences.hairType} hair.
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--color-accent)" }}>
            {result.totalTimeMinutes}m
          </div>
          <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Total Time</div>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

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
                  <span className="step-number">Step {step.stepNumber}</span>
                  <span className="step-duration">{step.durationMinutes} min</span>
                </div>
                <div className="step-desc">{step.instruction}</div>
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

      {/* Action Footer */}
      <div className="result-footer">
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
          style={{ display: "inline-flex", gap: "8px" }}
        >
          <span>📺</span> Search YouTube Tutorials
        </a>

        <button
          type="button"
          onClick={handleSave}
          className={`btn ${isSaved ? "btn-secondary" : "btn-primary"}`}
          style={{ opacity: isSaved ? 0.8 : 1 }}
          disabled={saveLoading}
        >
          <span>{isSaved ? "❤️" : "🤍"}</span> {isSaved ? "Saved" : saveLoading ? "Saving..." : "Add to Favorites"}
        </button>
      </div>
    </div>
  );
}
