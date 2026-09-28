import React, { useState } from "react";

export default function HairstyleGenerator({ token, backendUrl, onGenerationStart, onGenerationSuccess, onGenerationError }) {
  const [gender, setGender] = useState(null); // null = not yet selected (required)
  const [occasion, setOccasion] = useState("Casual"); // stores backend value
  const [hairType, setHairType] = useState("Wavy");
  const [hairLength, setHairLength] = useState("Long");
  const [stylingPreference, setStylingPreference] = useState("Heatless");
  const [timeAvailable, setTimeAvailable] = useState(15);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const genders = [
    { name: "Male", icon: "👨", label: "Male" },
    { name: "Female", icon: "👩", label: "Female" },
    { name: "Unisex", icon: "🧑", label: "Unisex" },
  ];

  // `value` = exact string the backend expects; `label` = what the user sees
  const occasions = [
    { value: "Casual",  icon: "🏠", label: "Casual / Daily" },
    { value: "Wedding", icon: "💍", label: "Wedding / Bridal" },
    { value: "Party",   icon: "✨", label: "Party / Night Out" },
    { value: "Office",  icon: "💼", label: "Work / Professional" },
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

    // Validate all required fields
    if (!gender) {
      setValidationError("Please select who this style is for (Male, Female, or Unisex) before generating.");
      return;
    }
    if (!occasion) {
      setValidationError("Please select an occasion.");
      return;
    }
    if (!hairType) {
      setValidationError("Please select your hair type.");
      return;
    }
    if (!hairLength) {
      setValidationError("Please select your hair length.");
      return;
    }
    if (!stylingPreference) {
      setValidationError("Please select a styling preference.");
      return;
    }
    if (!timeAvailable || isNaN(Number(timeAvailable)) || Number(timeAvailable) < 5) {
      setValidationError("Please specify at least 5 minutes of available time.");
      return;
    }

    setValidationError("");
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
          gender,
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
      const errorMsg =
        err.name === "TypeError"
          ? "Unable to connect to the server. Please check your internet connection and try again."
          : err.message || "Failed to generate hairstyle.";
      onGenerationError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card card-padded">
      <h2 className="page-title">
        Design Your Hairstyle
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Style For (Gender) Section */}
        <div className="generator-section-title">
          Style For
          <span className="required-badge">*</span>
        </div>
        <div className="options-grid three-cols">
          {genders.map((opt) => (
            <button
              key={opt.name}
              type="button"
              className={`option-card ${gender === opt.name ? "active" : ""}`}
              onClick={() => { setGender(opt.name); setValidationError(""); }}
            >
              <span className="option-icon">{opt.icon}</span>
              <span className="option-label">{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Occasion Section */}
        <div className="generator-section-title">Occasion</div>
        <div className="options-grid">
          {occasions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`option-card ${occasion === opt.value ? "active" : ""}`}
              onClick={() => { setOccasion(opt.value); setValidationError(""); }}
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
              onClick={() => { setHairType(opt.name); setValidationError(""); }}
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
              onClick={() => { setHairLength(opt.name); setValidationError(""); }}
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
              onClick={() => { setStylingPreference(opt.name); setValidationError(""); }}
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

        {validationError && (
          <div className="alert alert-danger">
            ⚠️ {validationError}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full btn-lg"
          disabled={loading}
        >
          {loading ? "Generating Tutorial..." : "Generate Hairstyle with AI"}
        </button>
      </form>
    </div>
  );
}
