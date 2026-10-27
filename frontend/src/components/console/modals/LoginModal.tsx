import React, { useState } from "react";
import { API_BASE } from "../types";
import { I } from "../icons";

export const LoginModal = ({
  open,
  onClose,
  onLoginSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (user: string, token: string) => void;
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleLogin = async (u = username, p = password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u.trim(), password: p.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed. Check credentials.");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("proveit_token", data.access_token);
        localStorage.setItem("proveit_user", u.trim());
      }
      onLoginSuccess(u.trim(), data.access_token);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 430, borderRadius: 16, background: "var(--bg-card)",
        border: "1px solid var(--border)", padding: 26, display: "flex", flexDirection: "column", gap: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--orange-bg)", color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I.User />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>Step 1: Sign In</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>Authenticate to manage AWS deployments</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><I.X /></button>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, display: "block" }}>Username</label>
          <input
            value={username} onChange={e => setUsername(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, display: "block" }}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
          />
        </div>

        {error && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          <button onClick={() => handleLogin()} disabled={loading} style={{
            padding: "10px", borderRadius: 8, border: "none", background: "var(--orange)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
          }}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};
