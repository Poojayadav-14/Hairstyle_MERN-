import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import HairstyleGenerator from "./components/HairstyleGenerator";
import HairstyleResult from "./components/HairstyleResult";
import History from "./components/History";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("generate"); // generate, history
  
  // Generation Result State
  const [resultData, setResultData] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");

  useEffect(() => {
    if (token) {
      // Validate token or get user profile
      fetch(`${BACKEND_URL}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Session expired. Please log in again.");
          }
          return res.json();
        })
        .then((data) => {
          setUser(data.data);
        })
        .catch((err) => {
          handleLogout();
        });
    }
  }, [token]);

  const handleAuthSuccess = (userData) => {
    setToken(userData.token);
    setUser({
      _id: userData._id,
      name: userData.name,
      email: userData.email,
    });
    localStorage.setItem("token", userData.token);
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setResultData(null);
    localStorage.removeItem("token");
    setActiveTab("generate");
  };

  if (!token) {
    return (
      <div id="root">
        <header>
          <div className="logo">
            <span>✨</span> Hairstyle <span>AI</span>
          </div>
        </header>
        <Auth onAuthSuccess={handleAuthSuccess} backendUrl={BACKEND_URL} />
        <footer>
          &copy; {new Date().getFullYear()} Hairstyle AI. Powered by Google Gemini. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div id="root">
      {/* Navigation Header */}
      <header>
        <div className="logo" style={{ cursor: "pointer" }} onClick={() => setActiveTab("generate")}>
          <span>✨</span> Hairstyle <span>AI</span>
        </div>
        <nav>
          <button
            type="button"
            className={`nav-link ${activeTab === "generate" ? "active" : ""}`}
            onClick={() => setActiveTab("generate")}
          >
            Generate
          </button>
          <button
            type="button"
            className={`nav-link ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
        </nav>
        {user && (
          <div className="user-badge">
            <span className="user-name">Bonjour, {user.name}!</span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "6px 12px", fontSize: "13px" }}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main>
        {activeTab === "generate" && (
          <div className="dashboard-grid">
            {/* Form Column */}
            <HairstyleGenerator
              token={token}
              backendUrl={BACKEND_URL}
              onGenerationStart={() => {
                setGenLoading(true);
                setGenError("");
                setResultData(null);
              }}
              onGenerationSuccess={(data) => {
                setResultData(data);
                setGenLoading(false);
              }}
              onGenerationError={(errMsg) => {
                setGenError(errMsg);
                setGenLoading(false);
              }}
            />

            {/* Results Column */}
            <div>
              {genLoading && (
                <div className="glass-card loading-container">
                  <div className="loading-spinner"></div>
                  <div className="loading-text">Consulting AI Stylist...</div>
                  <p style={{ color: "var(--color-text-muted)", fontSize: "14px", padding: "0 20px", textAlign: "center" }}>
                    Generating step-by-step instructions and product tips matching your exact hair type. This will take just a few seconds...
                  </p>
                </div>
              )}

              {genError && (
                <div className="glass-card" style={{ padding: "30px", textAlign: "center" }}>
                  <span style={{ fontSize: "40px", display: "block", marginBottom: "15px" }}>⚠️</span>
                  <div className="alert alert-danger">{genError}</div>
                  <p style={{ fontSize: "14px", color: "var(--color-text-muted)" }}>
                    Please verify your connection and try generating again.
                  </p>
                </div>
              )}

              {resultData && (
                <HairstyleResult resultData={resultData} token={token} backendUrl={BACKEND_URL} />
              )}

              {!genLoading && !genError && !resultData && (
                <div className="glass-card" style={{ padding: "60px 40px", textAlign: "center", color: "var(--color-text-muted)" }}>
                  <span style={{ fontSize: "50px", display: "block", marginBottom: "20px" }}>🌟</span>
                  <h3 className="serif-title" style={{ color: "#ffffff", fontSize: "22px", marginBottom: "10px" }}>
                    Your Style Guide Awaits
                  </h3>
                  <p style={{ fontSize: "14px" }}>
                    Select your hair parameters and styling preferences on the left, then click Generate to construct a tailored step-by-step tutorial.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "history" && <History token={token} backendUrl={BACKEND_URL} />}
      </main>

      {/* Footer */}
      <footer>
        &copy; {new Date().getFullYear()} Hairstyle AI. Powered by Google Gemini. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
