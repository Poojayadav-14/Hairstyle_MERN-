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

export default function SavedStyles({ token, backendUrl }) {
  const [savedStyles, setSavedStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Pagination (limit = 5 matching History)
  const [page, setPage] = useState(1);
  const limit = 5;

  const fetchSavedStyles = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/saved`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load saved hairstyles.");
      }

      setSavedStyles(data.data || []);
    } catch (err) {
      const msg =
        err.name === "TypeError"
          ? "Couldn't load your saved styles — check your connection and try again."
          : err.message || "Failed to load saved hairstyles.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedStyles();
  }, []);

  const handleRemove = async (id) => {
    setDeletingId(id);
    setError("");
    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/saved/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove saved hairstyle.");
      }

      setSavedStyles((prev) => {
        const updated = prev.filter((item) => item._id !== id);
        const newTotalPages = Math.ceil(updated.length / limit) || 1;
        if (page > newTotalPages) {
          setPage(newTotalPages);
        }
        return updated;
      });
    } catch (err) {
      const msg =
        err.name === "TypeError"
          ? "Network error: couldn't remove style. Please check your connection."
          : err.message || "Failed to remove saved hairstyle.";
      setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && savedStyles.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading saved hairstyles...</div>
      </div>
    );
  }

  const totalPages = Math.ceil(savedStyles.length / limit) || 1;
  const paginatedStyles = savedStyles.slice((page - 1) * limit, page * limit);

  return (
    <div className="list-wrapper">
      <h2 className="page-title">
        Saved Hairstyles
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {error && savedStyles.length === 0 ? (
        <div className="glass-card state-card">
          <span className="state-card-icon">⚠️</span>
          <p className="state-card-desc">
            Couldn't load your saved styles — check your connection and try again.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchSavedStyles}
          >
            🔄 Try Again
          </button>
        </div>
      ) : savedStyles.length === 0 ? (
        <div className="glass-card state-card">
          <span className="state-card-icon">⭐</span>
          <p className="state-card-desc">
            You haven't saved any styles yet — generate one and save it to see it here.
          </p>
        </div>
      ) : (
        <div className="card-stack">
          {paginatedStyles.map((item) => {
            const isExpanded = expandedId === item._id;
            const preferences = item.preferences || {};
            const result = item.result || {};
            const createdDate = item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";

            return (
              <div
                key={item._id}
                className="glass-card item-card"
                onClick={() => setExpandedId(isExpanded ? null : item._id)}
              >
                <div className="item-card-header">
                  <div>
                    <span className="result-meta-pill">
                      {preferences.gender ? `${preferences.gender} • ` : ""}
                      {preferences.occasion || "Hairstyle"} • {preferences.stylingPreference || ""}
                    </span>
                    <h3 className="item-card-title">
                      {item.title ||
                        `${preferences.hairLength || ""} ${preferences.hairType || ""} Style (${
                          result.totalTimeMinutes || 0
                        }m)`}
                    </h3>
                    <span className="item-card-date">
                      Saved on {createdDate}
                    </span>
                  </div>
                  <div className="item-card-actions">
                    <button
                      type="button"
                      className="btn btn-danger-outline btn-sm"
                      disabled={deletingId === item._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item._id);
                      }}
                    >
                      {deletingId === item._id ? "Removing..." : "Remove"}
                    </button>
                    <div className="item-card-toggle">
                      {isExpanded ? "▲ Collapse" : "▼ Expand"}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="item-card-body">
                    {/* Steps */}
                    <h4 className="item-section-title">
                      Step-by-Step Instructions:
                    </h4>
                    <div className="item-card-steps">
                      {result.steps?.map((step) => (
                        <div key={step.stepNumber} className="item-step-row">
                          <div className="item-step-header">
                            <div className="item-step-meta">
                              <div className="step-emoji-badge mini">
                                {getStepEmoji(step.instruction)}
                              </div>
                              <strong className="step-number">
                                Step {step.stepNumber}
                              </strong>
                            </div>
                            <span className="step-duration">
                              {step.durationMinutes} min
                            </span>
                          </div>
                          <div className="step-desc">
                            {step.instruction}
                          </div>
                        </div>
                      ))}
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

                    {/* YouTube link */}
                    {result.youtubeSearchQuery && (
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(
                          result.youtubeSearchQuery
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📺 View YouTube Tutorials
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page === 1 || loading}
                onClick={(e) => {
                  e.stopPropagation();
                  setPage((p) => Math.max(p - 1, 1));
                }}
              >
                ◀ Prev
              </button>
              <span className="text-muted-sm">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={page === totalPages || loading}
                onClick={(e) => {
                  e.stopPropagation();
                  setPage((p) => Math.min(p + 1, totalPages));
                }}
              >
                Next ▶
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
