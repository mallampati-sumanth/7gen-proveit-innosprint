import React, { useState, useEffect } from "react";
import { API_BASE } from "../types";
import { I } from "../icons";

export const GitHubConnectModal = ({
  open,
  onClose,
  onConnected,
  username,
}: {
  open: boolean;
  onClose: () => void;
  onConnected: () => void;
  username?: string;
}) => {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (open && typeof window !== "undefined") {
      const userKey = username ? `proveit_github_pat_${username}` : "proveit_github_pat";
      const saved = localStorage.getItem(userKey) || (username === "admin" ? localStorage.getItem("proveit_github_pat") : "") || "";
      setToken(saved);
      setError(null);
      setSuccess(null);
    }
  }, [open, username]);

  if (!open) return null;

  const handleDisconnect = () => {
    if (typeof window !== "undefined") {
      if (username) {
        localStorage.removeItem(`proveit_github_pat_${username}`);
      }
      localStorage.removeItem("proveit_github_pat");
    }
    setToken("");
    setSuccess("Disconnected GitHub token from local session.");
    setTimeout(() => {
      onConnected();
      onClose();
    }, 1000);
  };

  const handleConnect = async () => {
    const cleanTok = token.trim();
    if (!cleanTok) {
      setError("Please enter a GitHub Personal Access Token.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const jwtToken = typeof window !== "undefined" ? localStorage.getItem("proveit_token") : "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (jwtToken) {
        headers["Authorization"] = `Bearer ${jwtToken}`;
      }

      const res = await fetch(`${API_BASE}/api/agent/github/connect`, {
        method: "POST",
        headers,
        body: JSON.stringify({ token: cleanTok }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to authenticate with GitHub API.");
      }

      // Persist PAT in user-specific localStorage so refresh never loses the connected profile
      if (typeof window !== "undefined") {
        if (username) {
          localStorage.setItem(`proveit_github_pat_${username}`, cleanTok);
        }
        localStorage.setItem("proveit_github_pat", cleanTok);
      }

      setSuccess(`Connected successfully as @${data.profile?.username || data.profile?.login}! Synced ${data.synced_repos_count || 0} repositories.`);
      setTimeout(() => {
        onConnected();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to validate GitHub token.");
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
        width: "100%", maxWidth: 520, borderRadius: 16, background: "var(--bg-card)",
        border: "1px solid var(--border)", padding: 26, display: "flex", flexDirection: "column", gap: 18,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--badge-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <I.Github />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>Connect GitHub Account</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 1 }}>Authenticate via Personal Access Token (PAT)</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><I.X /></button>
        </div>

        <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.6 }}>
          Generate a token on GitHub at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" style={{ color: "var(--orange)", fontWeight: 600 }}>Settings &gt; Developer settings &gt; Personal access tokens</a> with <code style={{ background: "var(--badge-bg)", padding: "1px 5px", borderRadius: 4, fontFamily: "JetBrains Mono, monospace" }}>repo</code> scope. This enables live access to all your public and private repositories.
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, display: "block" }}>
            Personal Access Token (ghp_... or github_pat_...)
          </label>
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            style={{
              width: "100%", padding: "10px 14px", borderRadius: 8,
              background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
              fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none",
            }}
          />
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", fontSize: 12.5 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "#16a34a", color: "#ffffff", fontSize: 12.5, fontWeight: 600 }}>
            {success}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 4 }}>
          {typeof window !== "undefined" && localStorage.getItem("proveit_github_pat") ? (
            <button
              onClick={handleDisconnect}
              type="button"
              style={{
                padding: "8px 14px", borderRadius: 8, border: "1px solid rgba(239, 68, 68, 0.3)",
                background: "rgba(239, 68, 68, 0.08)", color: "var(--red)", fontSize: 12.5, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Disconnect Token
            </button>
          ) : <div />}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
            <button onClick={handleConnect} disabled={loading} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 8,
              border: "none", background: "var(--orange)", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? <><I.Loader /> Authenticating…</> : "Connect & Sync All Repos"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
