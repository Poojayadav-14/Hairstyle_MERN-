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
  const [isSaved, setIsSaved] = useState(
    Boolean(resultData.isSaved || resultData.wasSaved || (resultData._id && !resultData.historyId) || resultData.saved)
  );
  const [saving, setSaving] = useState(false);
  const [salonLocating, setSalonLocating] = useState(false);
  const [salonNotice, setSalonNotice] = useState("");

  useEffect(() => {
    setCompletedSteps({});
    setError("");
    setSuccessMsg("");
    setIsSaved(
      Boolean(resultData.isSaved || resultData.wasSaved || (resultData._id && !resultData.historyId) || resultData.saved)
    );
    setSaving(false);
    setSalonLocating(false);
    setSalonNotice("");
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
      setSalonNotice("Geolocation is not supported by your browser. You can still search for nearby salons using Google Maps below.");
      window.open(fallbackUrl, "_blank");
      return;
    }

    setSalonLocating(true);
    setSalonNotice("");

    let hasResolved = false;

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        setSalonLocating(false);
        setSalonNotice("Location request timed out. You can still search for nearby salons using Google Maps below.");
        window.open(fallbackUrl, "_blank");
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        setSalonLocating(false);
        setSalonNotice("");
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps/search/${encoded}/@${latitude},${longitude},14z`;
        window.open(mapsUrl, "_blank");
      },
      (geoError) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        setSalonLocating(false);

        if (geoError && geoError.code === 1) {
          setSalonNotice("Location access was denied. You can still search for nearby salons using Google Maps below.");
        } else if (geoError && geoError.code === 3) {
          setSalonNotice("Location request timed out. You can still search for nearby salons using Google Maps below.");
        } else {
          setSalonNotice("Unable to detect your precise location. You can still search for nearby salons using Google Maps below.");
        }
        window.open(fallbackUrl, "_blank");
      },
      { timeout: 4500, enableHighAccuracy: false }
    );
  };

  const handleSave = async () => {
    if (isSaved || saving) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    const title =
      resultData.title ||
      `${preferences.hairLength} ${preferences.hairType} Style for ${preferences.occasion}`;

    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          preferences,
          result,
          historyId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save hairstyle.");
      }

      setIsSaved(true);
      setSuccessMsg("Hairstyle saved to your favorites!");
    } catch (err) {
      const msg =
        err.name === "TypeError"
          ? "Network error: unable to save hairstyle. Please check your connection."
          : err.message || "Failed to save hairstyle.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    result.youtubeSearchQuery
  )}`;

  return (
    <div className="glass-card result-card">
      {/* Title & Metadata */}
      <div className="result-header">
        <div>
          <span className="result-meta-pill">
            {preferences.gender ? `${preferences.gender} • ` : ""}{preferences.occasion} • {preferences.stylingPreference}
          </span>
          <h2 className="page-title">
            Your Personalized AI Hairstyle
          </h2>
          <p className="text-muted-sm">
            Designed for {preferences.hairLength} {preferences.hairType} hair.
          </p>
        </div>
        <div className="result-time-block">
          <div className="result-time-val">
            {result.totalTimeMinutes}m
          </div>
          <div className="text-muted-xs">Total Time</div>
        </div>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Featured YouTube Tutorial Card */}
      <div className="glass-card youtube-featured-card">
        <div className="featured-card-title">
          🎥 Watch the Full Tutorial
        </div>
        <div className="featured-card-subtitle">
          {preferences.hairLength} {preferences.hairType} Style for {preferences.occasion}
        </div>
        <div className="featured-card-query">
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
                  <div className="item-step-meta">
                    <div className="step-emoji-badge">
                      {getStepEmoji(step.instruction)}
                    </div>
                    <span className="step-number">Step {step.stepNumber}</span>
                  </div>
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

      {/* Find Nearby Salons Card */}
      <div className="salon-featured-card">
        <div className="featured-card-title">
          💇‍♀️ Prefer a Professional?
        </div>
        <p className="salon-card-desc">
          Let an expert bring this look to life.
        </p>
        <button
          type="button"
          onClick={handleFindSalons}
          disabled={salonLocating}
          className="btn btn-salon"
        >
          {salonLocating ? (
            <>
              <span className="loading-spinner mini"></span>
              Locating Nearby Salons...
            </>
          ) : (
            <>📍 Find Top Salons Near Me</>
          )}
        </button>

        {salonNotice && (
          <div className="salon-notice-box">
            <p className="salon-notice-text">
              ⚠️ {salonNotice}
            </p>
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(
                `salons near me for ${preferences.occasion || "hairstyle"} ${result.youtubeSearchQuery || "hairstyle"}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              🔍 Open Salon Search on Google Maps
            </a>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="result-footer">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isSaved}
          className={`btn ${isSaved ? "btn-secondary" : "btn-primary"}`}
        >
          {saving ? (
            <>
              <span className="loading-spinner mini"></span>
              Saving...
            </>
          ) : isSaved ? (
            <>
              <span>Saved ✓</span>
            </>
          ) : (
            <>
              <span>💾</span> Save Hairstyle
            </>
          )}
        </button>
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary"
        >
          <span>📺</span> Search YouTube Tutorials
        </a>
      </div>
    </div>
  );
}
