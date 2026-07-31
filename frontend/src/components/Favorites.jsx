import React, { useState, useEffect } from "react";

export default function Favorites({ token, backendUrl }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load favorites.");
      }

      setFavorites(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Avoid triggering card expansion
    if (!window.confirm("Are you sure you want to remove this hairstyle from favorites?")) return;

    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/saved/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove favorite.");
      }

      setFavorites((prev) => prev.filter((item) => item._id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="list-wrapper">
      <h2 className="serif-title" style={{ fontSize: "28px", marginBottom: "10px" }}>
        Your Favorites
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {favorites.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <span style={{ fontSize: "40px", display: "block", marginBottom: "15px" }}>🤍</span>
          No favorites saved yet. Generate a hairstyle and click "Add to Favorites" to save it here!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {favorites.map((item) => {
            const isExpanded = expandedId === item._id;
            const preferences = item.preferences || {};
            const result = item.result || {};

            return (
              <div
                key={item._id}
                className="glass-card"
                style={{ padding: "24px", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setExpandedId(isExpanded ? null : item._id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="result-meta-pill" style={{ marginBottom: "6px", display: "inline-block" }}>
                      {preferences.occasion || "Hairstyle"} • {preferences.stylingPreference || ""}
                    </span>
                    <h3 style={{ fontSize: "20px", color: "#ffffff" }}>
                      {preferences.hairLength} {preferences.hairType} Style ({result.totalTimeMinutes}m)
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: "8px 12px", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#fca5a5" }}
                    onClick={(e) => handleDelete(e, item._id)}
                  >
                    Remove
                  </button>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: "24px", borderTop: "1px solid var(--card-border)", paddingTop: "20px", textAlign: "left" }}>
                    {/* Steps */}
                    <h4 style={{ color: "var(--color-primary)", marginBottom: "15px", fontSize: "16px" }}>
                      Step-by-Step Instructions:
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "20px" }}>
                      {result.steps?.map((step) => (
                        <div key={step.stepNumber} style={{ background: "rgba(255, 255, 255, 0.01)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.02)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <strong style={{ color: "var(--color-primary)", fontSize: "14px" }}>
                              Step {step.stepNumber}
                            </strong>
                            <span style={{ fontSize: "12px", color: "var(--color-accent)" }}>
                              {step.durationMinutes} min
                            </span>
                          </div>
                          <div style={{ fontSize: "14px", color: "var(--color-text-main)" }}>
                            {step.instruction}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    {result.tips && result.tips.length > 0 && (
                      <div className="tips-container" style={{ margin: "0 0 20px 0" }}>
                        <div className="tips-title">Stylist Pro Tips</div>
                        <ul className="tips-list">
                          {result.tips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* YouTube link */}
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.youtubeSearchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ width: "100%", fontSize: "14px" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      📺 View YouTube Tutorials
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
