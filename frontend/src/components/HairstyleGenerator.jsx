import React, { useState, useEffect } from "react";

// Safely parse JSON responses — guards against Render cold-start HTML errors
async function safeJsonParse(res) {
  if (res.status === 502 || res.status === 503 || res.status === 504) {
    throw new Error("Stylist server is waking up. Please retry in 10-15 seconds.");
  }
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Stylist server is waking up. Please retry in 10-15 seconds.");
  }
  return res.json();
}

const optionsByGender = {
  Male: {
    occasions: [
      { value: "Casual", icon: "🏠", label: "Casual / Daily" },
      { value: "Wedding", icon: "🤵", label: "Wedding / Groom" },
      { value: "Party", icon: "✨", label: "Party / Night Out" },
      { value: "Office", icon: "💼", label: "Work / Professional" },
    ],
    hairTypes: [
      { name: "Straight", icon: "💇‍♂️", label: "Straight" },
      { name: "Wavy", icon: "🌊", label: "Wavy" },
      { name: "Curly", icon: "🌀", label: "Curly" },
      { name: "Coily", icon: "🦁", label: "Coily / Kinky" },
    ],
    hairLengths: [
      { name: "Buzz", icon: "✂️", label: "Buzz Cut", desc: "Very short, under 0.5 inch" },
      { name: "Short", icon: "👨", label: "Short", desc: "Above ears / collar" },
      { name: "Medium", icon: "🧑", label: "Medium", desc: "Collar length" },
      { name: "Long", icon: "👨‍🦰", label: "Long", desc: "Below collar / shoulders" },
    ],
    preferences: [
      { name: "Heatless", icon: "🌱", label: "Heatless Style", desc: "No straighteners / dryers" },
      { name: "Heat-based", icon: "🔥", label: "Heat Styling", desc: "Blow dry / trimmers / styling tools" },
    ],
  },
  Female: {
    occasions: [
      { value: "Casual", icon: "🏠", label: "Casual / Daily" },
      { value: "Wedding", icon: "💍", label: "Wedding / Bridal" },
      { value: "Party", icon: "✨", label: "Party / Night Out" },
      { value: "Office", icon: "💼", label: "Work / Professional" },
    ],
    hairTypes: [
      { name: "Straight", icon: "💁‍♀️", label: "Straight" },
      { name: "Wavy", icon: "🌊", label: "Wavy" },
      { name: "Curly", icon: "🌀", label: "Curly" },
      { name: "Coily", icon: "🦁", label: "Coily / Kinky" },
    ],
    hairLengths: [
      { name: "Short", icon: "👩", label: "Short", desc: "Above shoulders" },
      { name: "Medium", icon: "🧑", label: "Medium", desc: "Shoulder length" },
      { name: "Long", icon: "👩‍🦰", label: "Long", desc: "Below shoulders" },
      { name: "ExtraLong", icon: "👸", label: "Extra Long", desc: "Waist length or longer" },
    ],
    preferences: [
      { name: "Heatless", icon: "🌱", label: "Heatless Style", desc: "No straighteners / dryers" },
      { name: "Heat-based", icon: "🔥", label: "Heat Styling", desc: "Blow dry / curl / straighten" },
    ],
  },
};

export default function HairstyleGenerator({
  token,
  backendUrl,
  gender: controlledGender,
  onGenderChange,
  onGenerationStart,
  onGenerationSuccess,
  onGenerationError,
}) {
  const [internalGender, setInternalGender] = useState(null);
  const gender = controlledGender !== undefined ? controlledGender : internalGender;

  const [occasion, setOccasion] = useState("Casual");
  const [hairType, setHairType] = useState("Wavy");
  const [hairLength, setHairLength] = useState("Short");
  const [stylingPreference, setStylingPreference] = useState("Heatless");
  const [timeAvailable, setTimeAvailable] = useState(15);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  const handleGenderSelect = (selectedGender) => {
    if (onGenderChange) {
      onGenderChange(selectedGender);
    } else {
      setInternalGender(selectedGender);
    }
    setValidationError("");

    if (selectedGender && optionsByGender[selectedGender]) {
      const newOptions = optionsByGender[selectedGender];
      if (!newOptions.occasions.some((o) => o.value === occasion)) {
        setOccasion(newOptions.occasions[0].value);
      }
      if (!newOptions.hairTypes.some((h) => h.name === hairType)) {
        setHairType(newOptions.hairTypes[0].name);
      }
      if (!newOptions.hairLengths.some((l) => l.name === hairLength)) {
        setHairLength(newOptions.hairLengths[0].name);
      }
      if (!newOptions.preferences.some((p) => p.name === stylingPreference)) {
        setStylingPreference(newOptions.preferences[0].name);
      }
    }
  };

  // Sync state if gender changes externally
  useEffect(() => {
    if (gender && optionsByGender[gender]) {
      const newOptions = optionsByGender[gender];
      if (!newOptions.occasions.some((o) => o.value === occasion)) {
        setOccasion(newOptions.occasions[0].value);
      }
      if (!newOptions.hairTypes.some((h) => h.name === hairType)) {
        setHairType(newOptions.hairTypes[0].name);
      }
      if (!newOptions.hairLengths.some((l) => l.name === hairLength)) {
        setHairLength(newOptions.hairLengths[0].name);
      }
      if (!newOptions.preferences.some((p) => p.name === stylingPreference)) {
        setStylingPreference(newOptions.preferences[0].name);
      }
    }
  }, [gender]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required gender
    if (!gender || (gender !== "Male" && gender !== "Female")) {
      setValidationError("Please select who this style is for (Male or Female) before generating.");
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

      const data = await safeJsonParse(response);

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

  // 1. Landing / Selection Screen (When no gender is chosen yet)
  if (!gender) {
    return (
      <div className="gender-landing-card-wrapper">
        <div className="gender-landing-header">
          <div className="gender-landing-badge">
            <span>✨</span> AI-Powered Hairstyle Engine
          </div>
          <h2 className="serif-title gender-landing-title">
            Who are you styling today?
          </h2>
          <p className="gender-landing-subtitle">
            Select a style profile to access personalized hair textures, lengths, occasions, and AI-tailored step-by-step tutorials.
          </p>
        </div>

        <div className="gender-landing-grid">
          {/* Male Card */}
          <button
            type="button"
            className="gender-choice-card male-card"
            onClick={() => handleGenderSelect("Male")}
            id="select-male-btn"
          >
            <div className="gender-choice-glow"></div>
            <div className="gender-choice-icon-wrap">
              <span className="gender-choice-icon">👨</span>
            </div>
            <h3 className="gender-choice-name">Male</h3>
            <p className="gender-choice-desc">
              Precision fades, pompadours, buzz cuts, textured crops & modern men's grooming routines.
            </p>
            <div className="gender-choice-action">
              <span>Select Male Styles</span>
              <span className="gender-choice-arrow">→</span>
            </div>
          </button>

          {/* Female Card */}
          <button
            type="button"
            className="gender-choice-card female-card"
            onClick={() => handleGenderSelect("Female")}
            id="select-female-btn"
          >
            <div className="gender-choice-glow"></div>
            <div className="gender-choice-icon-wrap">
              <span className="gender-choice-icon">👩</span>
            </div>
            <h3 className="gender-choice-name">Female</h3>
            <p className="gender-choice-desc">
              Layered waves, updos, intricate braids, bridal glamour & versatile everyday women's styles.
            </p>
            <div className="gender-choice-action">
              <span>Select Female Styles</span>
              <span className="gender-choice-arrow">→</span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // 2. Full Generator Form Screen (When Male or Female is chosen)
  const currentOptions = optionsByGender[gender];

  return (
    <div className="glass-card generator-form-card card-padded">
      {/* Top Header with Back / Change Button */}
      <div className="generator-top-nav">
        <div>
          <h2 className="page-title generator-title">
            Design Your Hairstyle
          </h2>
          <p className="generator-subtitle">
            Tailored options for <strong>{gender}</strong> styling.
          </p>
        </div>

        <div className="generator-nav-controls">
          <div className="selected-gender-badge">
            <span className="selected-gender-icon">{gender === "Male" ? "👨" : "👩"}</span>
            <span>{gender}</span>
          </div>
          <button
            type="button"
            className="btn-change-gender"
            onClick={() => handleGenderSelect(null)}
            title="Switch back to profile selection"
            id="back-to-gender-btn"
          >
            ← Change
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="generator-form">
        {/* Occasion Section */}
        <div className="generator-section-title">Occasion</div>
        <div className="options-grid">
          {currentOptions.occasions.map((opt) => (
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
          {currentOptions.hairTypes.map((opt) => (
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
          {currentOptions.hairLengths.map((opt) => (
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
          {currentOptions.preferences.map((opt) => (
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
          id="generate-hairstyle-btn"
        >
          {loading ? "Generating Tutorial..." : "Generate Hairstyle with AI"}
        </button>
      </form>
    </div>
  );
}
