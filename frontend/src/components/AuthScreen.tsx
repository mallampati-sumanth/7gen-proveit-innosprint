"use client";

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export const AuthScreen: React.FC = () => {
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGitHubToken,
    loginWithGitHubOAuth,
    loading,
    error,
    clearError,
  } = useAuth();

  const [tab, setTab] = useState<"signin" | "register" | "github">("signin");

  // Sign in fields
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

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
    const ok = await loginWithEmail(loginIdentifier, loginPassword);
    if (ok) {
      window.location.href = "/console";
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regEmail || !regUsername || !regPassword) return;
    const ok = await registerWithEmail(regEmail, regUsername, regPassword, regName);
    if (ok) {
      window.location.href = "/console";
    }
  };

  const submitGitHubToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ghToken) return;
    const ok = await loginWithGitHubToken(ghToken);
    if (ok) {
      window.location.href = "/console";
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse 75% 55% at 50% 30%, rgba(22, 163, 74, 0.05), transparent 70%), #ffffff",
      padding: "32px 16px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#0a0a0a",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 460,
        background: "#ffffff",
        border: "1px solid #e5e5e5",
        borderRadius: 20,
        boxShadow: "0 20px 50px -12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)",
        padding: "36px 32px 30px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}>
        {/* Navigation & Brand Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
          <a
            href="/"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0a0a0a",
              textDecoration: "none",
              letterSpacing: "-.03em",
            }}
          >
            prove<span style={{ color: "#16a34a" }}>it</span>
          </a>
          <a
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12.5,
              color: "#71717a",
              textDecoration: "none",
              fontWeight: 500,
              transition: "color .18s",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#16a34a")}
            onMouseLeave={e => (e.currentTarget.style.color = "#71717a")}
          >
            ← Back to Landing
          </a>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "4px 12px",
            borderRadius: 980,
            background: "rgba(22, 163, 74, 0.08)",
            border: "1px solid rgba(22, 163, 74, 0.22)",
            fontSize: 11,
            fontWeight: 600,
            color: "#16a34a",
            marginBottom: 14,
            letterSpacing: ".06em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
            AUTHENTICATION REQUIRED
          </div>

          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "-.03em",
            margin: "0 0 6px",
            color: "#0a0a0a",
          }}>
            ProveIt Cloud Console
          </h1>
          <p style={{ fontSize: 13, color: "#71717a", margin: 0, lineHeight: 1.55 }}>
            Autonomous AWS EC2 Deployment &amp; Deterministic Proof Engine. Sign in to access your cloud infrastructure.
          </p>
        </div>

        {/* Auth Mode Tabs */}
        <div style={{
          display: "flex",
          background: "#f4f4f5",
          padding: 3,
          borderRadius: 10,
          border: "1px solid #e5e5e5",
        }}>
          <button
            type="button"
            onClick={() => handleTabChange("signin")}
            style={{
              flex: 1,
              padding: "7px 0",
              borderRadius: 8,
              border: "none",
              background: tab === "signin" ? "#ffffff" : "transparent",
              color: tab === "signin" ? "#0a0a0a" : "#71717a",
              boxShadow: tab === "signin" ? "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)" : "none",
              fontSize: 12.5,
              fontWeight: 600,
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
              padding: "7px 0",
              borderRadius: 8,
              border: "none",
              background: tab === "register" ? "#ffffff" : "transparent",
              color: tab === "register" ? "#0a0a0a" : "#71717a",
              boxShadow: tab === "register" ? "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)" : "none",
              fontSize: 12.5,
              fontWeight: 600,
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
              padding: "7px 0",
              borderRadius: 8,
              border: "none",
              background: tab === "github" ? "#ffffff" : "transparent",
              color: tab === "github" ? "#0a0a0a" : "#71717a",
              boxShadow: tab === "github" ? "0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)" : "none",
              fontSize: 12.5,
              fontWeight: 600,
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
            borderRadius: 9,
            background: "rgba(220, 38, 38, 0.08)",
            border: "1px solid rgba(220, 38, 38, 0.25)",
            color: "#dc2626",
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
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0a0a0a", marginBottom: 6 }}>
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
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1.5px solid #e5e5e5",
                  color: "#0a0a0a",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#16a34a";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#e5e5e5";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0a0a0a", marginBottom: 6 }}>
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
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1.5px solid #e5e5e5",
                  color: "#0a0a0a",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color .15s, box-shadow .15s",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#16a34a";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#e5e5e5";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "11px",
                borderRadius: 980,
                border: "none",
                background: "#0a0a0a",
                color: "#ffffff",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                transition: "background .15s, transform .15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "#262626";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.01)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "#0a0a0a";
                (e.currentTarget as HTMLElement).style.transform = "none";
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
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0a0a0a", marginBottom: 5 }}>
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
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1.5px solid #e5e5e5",
                  color: "#0a0a0a",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#16a34a";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#e5e5e5";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0a0a0a", marginBottom: 5 }}>
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
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1.5px solid #e5e5e5",
                    color: "#0a0a0a",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#16a34a";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.12)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0a0a0a", marginBottom: 5 }}>
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
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1.5px solid #e5e5e5",
                    color: "#0a0a0a",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#16a34a";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.12)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0a0a0a", marginBottom: 5 }}>
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
                  borderRadius: 10,
                  background: "#ffffff",
                  border: "1.5px solid #e5e5e5",
                  color: "#0a0a0a",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#16a34a";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.12)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#e5e5e5";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "11px",
                borderRadius: 980,
                border: "none",
                background: "#0a0a0a",
                color: "#ffffff",
                fontSize: 13.5,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                transition: "background .15s, transform .15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "#262626";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.01)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "#0a0a0a";
                (e.currentTarget as HTMLElement).style.transform = "none";
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
                borderRadius: 980,
                border: "1.5px solid #e5e5e5",
                background: "#ffffff",
                color: "#0a0a0a",
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 9,
                transition: "all .18s ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = "#fafafa";
                (e.currentTarget as HTMLElement).style.borderColor = "#a3a3a3";
                (e.currentTarget as HTMLElement).style.transform = "scale(1.01)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = "#ffffff";
                (e.currentTarget as HTMLElement).style.borderColor = "#e5e5e5";
                (e.currentTarget as HTMLElement).style.transform = "none";
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              Continue with GitHub OAuth
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
              <span style={{ fontSize: 10.5, color: "#71717a", fontWeight: 600, letterSpacing: ".04em" }}>OR CONNECT WITH ACCESS TOKEN</span>
              <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
            </div>

            {/* Token Form */}
            <form onSubmit={submitGitHubToken} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0a0a0a", marginBottom: 6 }}>
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
                    borderRadius: 10,
                    background: "#ffffff",
                    border: "1.5px solid #e5e5e5",
                    color: "#0a0a0a",
                    fontSize: 13,
                    fontFamily: "JetBrains Mono, monospace",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "#16a34a";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(22, 163, 74, 0.12)";
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>
                  Requires <code style={{ background: "#f4f4f5", padding: "1px 5px", borderRadius: 4, color: "#0a0a0a" }}>repo</code> and <code style={{ background: "#f4f4f5", padding: "1px 5px", borderRadius: 4, color: "#0a0a0a" }}>read:user</code> scopes to clone repos and deploy to EC2.
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "10px",
                  borderRadius: 980,
                  border: "none",
                  background: "#0a0a0a",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                }}
              >
                {loading ? "Verifying with GitHub…" : "Sign In with GitHub Token"}
              </button>
            </form>
          </div>
        )}

        {/* Footer Security Badge */}
        <div style={{
          marginTop: 6,
          paddingTop: 16,
          borderTop: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#a3a3a3",
        }}>
          <span>AES-256 JWT Signed Sessions</span>
          <span>AWS Hackathon 2026 · 7th Gen</span>
        </div>
      </div>
    </div>
  );
};
