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

export default function History({ token, backendUrl }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 5;

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/hairstyles/history?page=${page}&limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await safeJsonParse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to load history.");
      }

      setHistory(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      const msg =
        err.name === "TypeError"
          ? "Couldn't load your generation history — check your connection and try again."
          : err.message || "Failed to load history.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  if (loading && history.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="list-wrapper">
      <h2 className="page-title">
        Generation History
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {error && history.length === 0 ? (
        <div className="glass-card state-card">
          <span className="state-card-icon">⚠️</span>
          <p className="state-card-desc">
            Couldn't load your generation history — check your connection and try again.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchHistory}
          >
            🔄 Try Again
          </button>
        </div>
      ) : history.length === 0 ? (
        <div className="glass-card state-card">
          <span className="state-card-icon">📖</span>
          <p className="state-card-desc">
            No history records yet. Generate some styles to see your logs!
          </p>
        </div>
      ) : (
        <div className="card-stack">
          {history.map((item) => {
            const isExpanded = expandedId === item._id;
            const preferences = item.requestParams || {};
            const result = item.resultSnapshot || {};
            const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }) : "";

            return (
              <div
                key={item._id}
                className="glass-card item-card"
                onClick={() => setExpandedId(isExpanded ? null : item._id)}
              >
                <div className="item-card-header">
                  <div>
                    <span className="result-meta-pill">
                      {preferences.gender ? `${preferences.gender} • ` : ""}{preferences.occasion || "Hairstyle"} • {preferences.stylingPreference || ""}
                    </span>
                    <h3 className="item-card-title">
                      {preferences.hairLength} {preferences.hairType} Style ({result.totalTimeMinutes || 0}m)
                    </h3>
                    <span className="item-card-date">
                      Generated on {createdDate}
                    </span>
                  </div>
                  <div className="item-card-toggle">
                    {isExpanded ? "▲ Collapse" : "▼ Expand"}
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
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.youtubeSearchQuery || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-full"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📺 View YouTube Tutorials
                    </a>
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
