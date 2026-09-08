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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load history.");
      }

      setHistory(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err.message);
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
      <h2 className="serif-title" style={{ fontSize: "28px", marginBottom: "10px" }}>
        Generation History
      </h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {history.length === 0 ? (
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>
          <span style={{ fontSize: "40px", display: "block", marginBottom: "15px" }}>📖</span>
          No history records yet. Generate some styles to see your logs!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                className="glass-card"
                style={{ padding: "24px", cursor: "pointer", transition: "var(--transition-smooth)" }}
                onClick={() => setExpandedId(isExpanded ? null : item._id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span className="result-meta-pill" style={{ marginBottom: "6px", display: "inline-block" }}>
                      {preferences.occasion || "Hairstyle"} • {preferences.stylingPreference || ""}
                    </span>
                    <h3 style={{ fontSize: "18px", color: "#ffffff" }}>
                      {preferences.hairLength} {preferences.hairType} Style ({result.totalTimeMinutes || 0}m)
                    </h3>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                      Generated on {createdDate}
                    </span>
                  </div>
                  <div style={{ color: "var(--color-primary)", fontWeight: "600", fontSize: "14px" }}>
                    {isExpanded ? "▲ Collapse" : "▼ Expand"}
                  </div>
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
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div className="step-emoji-badge" style={{ width: "30px", height: "30px", fontSize: "15px" }}>
                                {getStepEmoji(step.instruction)}
                              </div>
                              <strong style={{ color: "var(--color-primary)", fontSize: "14px" }}>
                                Step {step.stepNumber}
                              </strong>
                            </div>
                            <span style={{ fontSize: "12px", color: "var(--color-accent)" }}>
                              {step.durationMinutes} min
                            </span>
                          </div>
                          <div style={{ fontSize: "14px", color: "var(--color-text-main)", marginTop: "6px" }}>
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
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(result.youtubeSearchQuery || "")}`}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "20px" }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "8px 16px" }}
                disabled={page === 1 || loading}
                onClick={(e) => {
                  e.stopPropagation();
                  setPage((p) => Math.max(p - 1, 1));
                }}
              >
                ◀ Prev
              </button>
              <span style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "8px 16px" }}
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
