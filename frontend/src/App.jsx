import React, { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useNavigate,
} from "react-router-dom";
import Auth from "./components/Auth";
import HairstyleGenerator from "./components/HairstyleGenerator";
import HairstyleResult from "./components/HairstyleResult";
import History from "./components/History";
import SavedStyles from "./components/SavedStyles";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL;

function AppContent() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
          if (res.status === 401 || res.status === 403) {
            throw new Error("UNAUTHORIZED");
          }
          if (!res.ok) {
            throw new Error("SERVER_ERROR");
          }
          return res.json();
        })
        .then((data) => {
          setUser(data.data);
        })
        .catch((err) => {
          if (err.message === "UNAUTHORIZED") {
            handleLogout();
          } else {
            console.warn("Could not verify session profile with server:", err.message);
          }
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
    navigate("/generate");
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    setResultData(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (!token) {
    return (
      <div id="root">
        <header>
          <div className="logo">
            <span>✨</span> Hairstyle <span>AI</span>
          </div>
        </header>
        <Routes>
          <Route
            path="/login"
            element={<Auth onAuthSuccess={handleAuthSuccess} backendUrl={BACKEND_URL} />}
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
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
        <Link to="/generate" className="logo">
          <span>✨</span> Hairstyle <span>AI</span>
        </Link>
        <nav>
          <NavLink
            to="/generate"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Generate
          </NavLink>
          <NavLink
            to="/saved"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            Saved Styles
          </NavLink>
          <NavLink
            to="/history"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            History
          </NavLink>
        </nav>
        {user && (
          <div className="user-badge">
            <span className="user-name">Bonjour, {user.name}!</span>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main>
        <Routes>
          <Route
            path="/generate"
            element={
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
                      <p className="state-card-desc">
                        Generating step-by-step instructions and product tips matching your exact hair type. This will take just a few seconds...
                      </p>
                    </div>
                  )}

                  {genError && (
                    <div className="glass-card state-card">
                      <span className="state-card-icon">⚠️</span>
                      <div className="alert alert-danger">{genError}</div>
                      <p className="state-card-desc">
                        Please verify your parameters and try generating again.
                      </p>
                    </div>
                  )}

                  {resultData && (
                    <HairstyleResult
                      resultData={resultData}
                      token={token}
                      backendUrl={BACKEND_URL}
                    />
                  )}

                  {!genLoading && !genError && !resultData && (
                    <div className="glass-card state-card large">
                      <span className="state-card-icon">🌟</span>
                      <h3 className="state-card-title">
                        Your Style Guide Awaits
                      </h3>
                      <p className="state-card-desc">
                        Select your hair parameters and styling preferences on the left, then click Generate to construct a tailored step-by-step tutorial.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            }
          />
          <Route
            path="/saved"
            element={<SavedStyles token={token} backendUrl={BACKEND_URL} />}
          />
          <Route
            path="/history"
            element={<History token={token} backendUrl={BACKEND_URL} />}
          />
          <Route path="/" element={<Navigate to="/generate" replace />} />
          <Route path="/login" element={<Navigate to="/generate" replace />} />
          <Route path="*" element={<Navigate to="/generate" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer>
        &copy; {new Date().getFullYear()} Hairstyle AI. Powered by Google Gemini. All rights reserved.
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
