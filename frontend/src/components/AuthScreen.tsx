"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const AuthScreen: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGitHubToken,
    loginWithGitHubOAuth,
    loginAsDemoAdmin,
    loading,
    error,
    clearError,
  } = useAuth();

  const [tab, setTab] = useState<"signin" | "register" | "github">("signin");

  // Sign in fields
  const [loginIdentifier, setLoginIdentifier] = useState("admin");
  const [loginPassword, setLoginPassword] = useState("proveit_demo_secret_2026");

  // Register fields
  const [regEmail, setRegEmail] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // GitHub token field
  const [ghToken, setGhToken] = useState("");

  const handleTabChange = (nextTab: "signin" | "register" | "github") => {
    clearError();
    setTab(nextTab);
  };

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;
    await loginWithEmail(loginIdentifier, loginPassword);
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regUsername || !regPassword) return;
    await registerWithEmail(regEmail, regUsername, regPassword, regName);
  };

  const submitGitHubToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghToken) return;
    await loginWithGitHubToken(ghToken);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1a1512 0%, #0d0f12 70%)",
      padding: "24px 16px",
      fontFamily: "'Inter', sans-serif",
      color: "var(--text-1, #f1f5f9)",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 480,
        background: "rgba(18, 20, 26, 0.95)",
        border: "1px solid rgba(249, 115, 22, 0.25)",
        borderRadius: 18,
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(249, 115, 22, 0.08)",
        backdropFilter: "blur(20px)",
        padding: "36px 32px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 22,
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px",
            borderRadius: 20,
            background: "rgba(249, 115, 22, 0.12)",
            border: "1px solid rgba(249, 115, 22, 0.3)",
            fontSize: 12,
            fontWeight: 700,
            color: "#f97316",
            marginBottom: 14,
            letterSpacing: ".04em",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f97316", display: "inline-block", boxShadow: "0 0 10px #f97316" }} />
            AUTHENTICATION REQUIRED
          </div>

          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-.02em",
            margin: "0 0 6px",
            background: "linear-gradient(135deg, #ffffff 40%, #fdba74 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            ProveIt Cloud Console
          </h1>
          <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
            Autonomous AWS EC2 Deployment & Deterministic Proof Engine. Sign in to access your cloud infrastructure.
          </p>
        </div>

        {/* 1-Click Demo Admin Button */}
        <button
          type="button"
          onClick={() => loginAsDemoAdmin()}
          disabled={loading}
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: 10,
            border: "1px solid rgba(249, 115, 22, 0.4)",
            background: "linear-gradient(135deg, rgba(249,115,22,0.2) 0%, rgba(180,83,9,0.25) 100%)",
            color: "#fdba74",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            transition: "all .15s ease",
          }}
        >
          ⚡ 1-Click Sign In as Demo Admin
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
          <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>or continue with</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
        </div>

        {/* Auth Mode Tabs */}
        <div style={{
          display: "flex",
          background: "rgba(10, 12, 16, 0.7)",
          padding: 4,
          borderRadius: 10,
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}>
          <button
            type="button"
            onClick={() => handleTabChange("signin")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: tab === "signin" ? "#f97316" : "transparent",
              color: tab === "signin" ? "#ffffff" : "#94a3b8",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .15s ease",
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("register")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: tab === "register" ? "#f97316" : "transparent",
              color: tab === "register" ? "#ffffff" : "#94a3b8",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .15s ease",
            }}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("github")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 8,
              border: "none",
              background: tab === "github" ? "#f97316" : "transparent",
              color: tab === "github" ? "#ffffff" : "#94a3b8",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all .15s ease",
            }}
          >
            GitHub
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(239, 68, 68, 0.12)",
            border: "1px solid rgba(239, 68, 68, 0.35)",
            color: "#fca5a5",
            fontSize: 12.5,
            lineHeight: 1.4,
          }}>
            {error}
          </div>
        )}

        {/* Tab 1: Sign In */}
        {tab === "signin" && (
          <form onSubmit={submitLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                Username or Email Address
              </label>
              <input
                type="text"
                value={loginIdentifier}
                onChange={e => setLoginIdentifier(e.target.value)}
                placeholder="admin or user@domain.com"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(10, 12, 16, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  background: "rgba(10, 12, 16, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "11px",
                borderRadius: 8,
                border: "none",
                background: "#f97316",
                color: "#ffffff",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
              }}
            >
              {loading ? "Authenticating…" : "Sign In to Console"}
            </button>
          </form>
        )}

        {/* Tab 2: Register with Email */}
        {tab === "register" && (
          <form onSubmit={submitRegister} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 5 }}>
                Email Address
              </label>
              <input
                type="email"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="lead@developer.com"
                required
                style={{
                  width: "100%",
                  padding: "9px 13px",
                  borderRadius: 8,
                  background: "rgba(10, 12, 16, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 5 }}>
                  Username
                </label>
                <input
                  type="text"
                  value={regUsername}
                  onChange={e => setRegUsername(e.target.value)}
                  placeholder="clouddev"
                  required
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: 8,
                    background: "rgba(10, 12, 16, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 5 }}>
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Alex Rivers"
                  style={{
                    width: "100%",
                    padding: "9px 13px",
                    borderRadius: 8,
                    background: "rgba(10, 12, 16, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 5 }}>
                Password (min 6 characters)
              </label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                minLength={6}
                style={{
                  width: "100%",
                  padding: "9px 13px",
                  borderRadius: 8,
                  background: "rgba(10, 12, 16, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#ffffff",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "11px",
                borderRadius: 8,
                border: "none",
                background: "#f97316",
                color: "#ffffff",
                fontSize: 13.5,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 4px 15px rgba(249, 115, 22, 0.3)",
              }}
            >
              {loading ? "Creating Account…" : "Register & Sign In"}
            </button>
          </form>
        )}

        {/* Tab 3: GitHub OAuth & Personal Token */}
        {tab === "github" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* OAuth Direct Button */}
            <button
              type="button"
              onClick={() => loginWithGitHubOAuth()}
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 8,
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: "#24292e",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              Continue with GitHub OAuth
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>OR CONNECT WITH ACCESS TOKEN</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255, 255, 255, 0.08)" }} />
            </div>

            {/* Token Form */}
            <form onSubmit={submitGitHubToken} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#cbd5e1", marginBottom: 6 }}>
                  GitHub Personal Access Token (classic or fine-grained)
                </label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={e => setGhToken(e.target.value)}
                  placeholder="ghp_••••••••••••••••••••••••••••••••••••"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    background: "rgba(10, 12, 16, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    color: "#ffffff",
                    fontSize: 13,
                    fontFamily: "JetBrains Mono, monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Requires <code>repo</code> and <code>read:user</code> scopes to clone repos and deploy to EC2.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px",
                  borderRadius: 8,
                  border: "none",
                  background: "#f97316",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Verifying with GitHub…" : "Sign In with GitHub Token"}
              </button>
            </form>
          </div>
        )}

        {/* Footer Security Badge */}
        <div style={{
          marginTop: 10,
          paddingTop: 16,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#64748b",
        }}>
          <span>🔒 AES-256 JWT Signed Sessions</span>
          <span>AWS Hackathon 2026 · 7th Gen</span>
        </div>
      </div>
    </div>
  );
};
