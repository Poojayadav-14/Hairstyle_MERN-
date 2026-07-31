import React, { useState } from "react";

export default function HairstyleGenerator({ token, backendUrl, onGenerationStart, onGenerationSuccess, onGenerationError }) {
  const [occasion, setOccasion] = useState("Casual");
  const [hairType, setHairType] = useState("Wavy");
  const [hairLength, setHairLength] = useState("Long");
  const [stylingPreference, setStylingPreference] = useState("Heatless");
  const [timeAvailable, setTimeAvailable] = useState(15);
  const [loading, setLoading] = useState(false);

  const occasions = [
    { name: "Casual", icon: "🏠", label: "Casual / Daily" },
    { name: "Wedding", icon: "💍", label: "Wedding / Bridal" },
    { name: "Party", icon: "✨", label: "Party / Night Out" },
    { name: "Work", icon: "💼", label: "Work / Professional" },
  ];

  const hairTypes = [
    { name: "Straight", icon: "💁‍♀️", label: "Straight" },
    { name: "Wavy", icon: "🌊", label: "Wavy" },
    { name: "Curly", icon: "🌀", label: "Curly" },
    { name: "Coily", icon: "🦁", label: "Coily / Kinky" },
  ];

  const hairLengths = [
    { name: "Short", icon: "👩", label: "Short", desc: "Above shoulders" },
    { name: "Medium", icon: "🧑", label: "Medium", desc: "Shoulder length" },
    { name: "Long", icon: "👩‍🦰", label: "Long", desc: "Below shoulders" },
  ];

  const preferences = [
    { name: "Heatless", icon: "🌱", label: "Heatless Style", desc: "No straighteners/dryers" },
    { name: "Heat-based", icon: "🔥", label: "Heat Styling", desc: "Blow dry/curl/straighten" },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onGenerationStart();

    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          occasion,
          hairType,
          hairLength,
          stylingPreference,
          timeAvailableMinutes: Number(timeAvailable),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to generate hairstyle.");
      }

      onGenerationSuccess(data.data);
    } catch (err) {
      onGenerationError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: "30px", textAlign: "left" }}>
      <h2 className="serif-title" style={{ marginBottom: "25px", fontSize: "28px" }}>
        Design Your Hairstyle
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Occasion Section */}
        <div className="generator-section-title">Occasion</div>
        <div className="options-grid">
          {occasions.map((opt) => (
            <button
              key={opt.name}
              type="button"
              className={`option-card ${occasion === opt.name ? "active" : ""}`}
              onClick={() => setOccasion(opt.name)}
            >
              <span className="option-icon">{opt.icon}</span>
              <span className="option-label">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Hair Type Section */}
        <div className="generator-section-title">Hair Type</div>
        <div className="options-grid">
          {hairTypes.map((opt) => (
            <button
              key={opt.name}
              type="button"
              className={`option-card ${hairType === opt.name ? "active" : ""}`}
              onClick={() => setHairType(opt.name)}
            >
              <span className="option-icon">{opt.icon}</span>
              <span className="option-label">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Hair Length Section */}
        <div className="generator-section-title">Hair Length</div>
        <div className="options-grid">
          {hairLengths.map((opt) => (
            <button
              key={opt.name}
              type="button"
              className={`option-card ${hairLength === opt.name ? "active" : ""}`}
              onClick={() => setHairLength(opt.name)}
            >
              <span className="option-icon">{opt.icon}</span>
              <span className="option-label">{opt.label}</span>
              <span className="option-desc">{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* Styling Preference Section */}
        <div className="generator-section-title">Styling Preference</div>
        <div className="options-grid two-cols">
          {preferences.map((opt) => (
            <button
              key={opt.name}
              type="button"
              className={`option-card ${stylingPreference === opt.name ? "active" : ""}`}
              onClick={() => setStylingPreference(opt.name)}
            >
              <span className="option-icon">{opt.icon}</span>
              <span className="option-label">{opt.label}</span>
              <span className="option-desc">{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* Time Available Slider */}
        <div className="generator-section-title">Available Time</div>
        <div className="time-slider-wrapper">
          <div className="time-slider-header">
            <span>Estimated prep time</span>
            <span className="time-slider-value">{timeAvailable} minutes</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            className="slider-input"
            value={timeAvailable}
            onChange={(e) => setTimeAvailable(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: "100%", height: "50px", fontSize: "16px" }}
          disabled={loading}
        >
          {loading ? "Generating Tutorial..." : "Generate Hairstyle with AI"}
        </button>
      </form>
    </div>
  );
}
