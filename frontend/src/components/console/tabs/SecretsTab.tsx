import React, { useState, useEffect } from "react";
import { API_BASE } from "../types";
import { I } from "../icons";

export const SecretsTab = ({ profile, onOpenConnect }: { profile?: any; onOpenConnect?: () => void }) => {
  const [testing, setTesting] = useState<Record<string, "idle" | "testing" | "ok" | "fail">>({});
  const [testResult, setTestResult] = useState<Record<string, string>>({});
  const [vault, setVault] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/agent/vault`)
      .then(r => r.json())
      .then(setVault)
      .catch(() => {});
  }, []);

  const testConnection = async (target: string) => {
    setTesting(p => ({ ...p, [target]: "testing" }));
    try {
      const res = await fetch(`${API_BASE}/api/agent/test-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: target }),
      });
      const data = await res.json();
      setTesting(p => ({ ...p, [target]: res.ok && data.status !== "error" ? "ok" : "fail" }));
      setTestResult(p => ({ ...p, [target]: data.message }));
    } catch {
      setTesting(p => ({ ...p, [target]: "fail" }));
      setTestResult(p => ({ ...p, [target]: "Failed to reach agent backend." }));
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      <div style={{
        marginBottom: 20, padding: "12px 18px", borderRadius: 10,
        background: "var(--orange-bg)", border: "1px solid var(--orange-border)",
        display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-1)",
      }}>
        <span style={{ color: "var(--orange)" }}><I.Shield /></span>
        <span>
          <strong>Encrypted Vault:</strong> Live connection tests verify GitHub REST API token authentication and AWS IAM infrastructure credentials managed securely on the backend.
        </span>
      </div>

      {/* GitHub Credentials Card */}
      <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--badge-bg)" }}>
          <span style={{ color: "var(--orange)" }}><I.Github /></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>GitHub Connection & Personal Access Token</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => testConnection("github")} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {testing["github"] === "testing" ? "Testing…" : testing["github"] === "ok" ? "Connected" : "Test GitHub API"}
          </button>
          {onOpenConnect && (
            <button onClick={onOpenConnect} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "var(--orange)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {profile?.connected ? "Update Token" : "Connect Token"}
            </button>
          )}
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Connected Account</div>
          <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: profile?.connected ? "var(--green)" : "var(--yellow)", fontWeight: 700, marginBottom: 14 }}>
            {profile?.connected ? `@${profile.username || profile.login} (${profile.name || "Authenticated"})` : "Not connected - No token active"}
          </div>
          {testResult["github"] && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: testing["github"] === "ok" ? "var(--green-bg)" : "var(--red-bg)", color: testing["github"] === "ok" ? "var(--green)" : "var(--red)", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
              {testResult["github"]}
            </div>
          )}
        </div>
      </div>

      {/* AWS Cloud Credentials Card */}
      <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--badge-bg)" }}>
          <span style={{ color: "var(--orange)" }}><I.Cloud /></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>AWS Credentials & Cloud Targets</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => testConnection("aws")} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {testing["aws"] === "testing" ? "Testing…" : testing["aws"] === "ok" ? "Connected" : "Test AWS STS"}
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>AWS Access Key ID</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text-1)" }}>
                {vault?.aws?.access_key_masked || "AKIA••••••••IBPA"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>AWS Region</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text-1)" }}>
                {vault?.aws?.region || "us-east-1"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Cloud Execution Mode</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: vault?.aws?.cloud_mode === "aws" ? "var(--green)" : "var(--yellow)", fontWeight: 700 }}>
                {(vault?.aws?.cloud_mode || "mock").toUpperCase()}
              </div>
            </div>
          </div>
          {testResult["aws"] && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: testing["aws"] === "ok" ? "var(--green-bg)" : "var(--red-bg)", color: testing["aws"] === "ok" ? "var(--green)" : "var(--red)", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
              {testResult["aws"]}
            </div>
          )}
        </div>
      </div>

      {/* AI LLM Provider Card */}
      <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--badge-bg)" }}>
          <span style={{ color: "var(--orange)" }}><I.Bot /></span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Autonomous AI Engine & LLM Provider</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => testConnection("ai")} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {testing["ai"] === "testing" ? "Testing…" : testing["ai"] === "ok" ? "Connected" : "Test AI Model"}
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Active Provider</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text-1)", textTransform: "uppercase" }}>
                {vault?.llm?.provider || "gemini"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Configured Model</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text-1)" }}>
                {vault?.llm?.model || "gemini-2.5-flash"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 4 }}>Key Status</div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: vault?.llm?.configured ? "var(--green)" : "var(--yellow)", fontWeight: 700 }}>
                {vault?.llm?.configured ? "CONFIGURED" : "PENDING (Set in .env)"}
              </div>
            </div>
          </div>
          {testResult["ai"] && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: testing["ai"] === "ok" ? "var(--green-bg)" : "var(--red-bg)", color: testing["ai"] === "ok" ? "var(--green)" : "var(--red)", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
              {testResult["ai"]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
