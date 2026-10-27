import React, { useState, useEffect, useCallback } from "react";
import { RepoItem, RepoEnvVariable, EnvTarget, EnvCategory, API_BASE } from "../types";
import { I } from "../icons";

export const RepoEnvTab = ({
  repos,
  selectedRepo,
  setSelectedRepo,
  activeTarget,
  setActiveTarget,
  onDeployRepo,
}: {
  repos: RepoItem[];
  selectedRepo: string;
  setSelectedRepo: (r: string) => void;
  activeTarget: EnvTarget;
  setActiveTarget: (t: EnvTarget) => void;
  onDeployRepo?: (repo: string) => void;
}) => {
  const [mode, setMode] = useState<"table" | "raw">("table");
  const [vars, setVars] = useState<RepoEnvVariable[]>([]);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);

  // New variable inputs
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newCat, setNewCat] = useState<EnvCategory>("APP");
  const [newSecret, setNewSecret] = useState(false);

  // Load repo envs whenever repo or environment changes
  const loadEnv = useCallback(async () => {
    if (!selectedRepo) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent/repos/${selectedRepo}/env?environment=${activeTarget}`);
      const data = await res.json();
      setVars(data.variables || []);
      setRawText(data.raw_env || "");
    } catch {
      setVars([]);
      setRawText("");
    }
    setLoading(false);
  }, [selectedRepo, activeTarget]);

  useEffect(() => {
    loadEnv();
  }, [loadEnv]);

  if (repos.length === 0) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: "60px 32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: "var(--badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "var(--orange)" }}>
          <I.Sliders />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>No Connected Repositories</div>
        <div style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 460, lineHeight: 1.6 }}>
          Connect your GitHub account or add a repository URL in the <strong>GitHub Repositories</strong> tab before configuring and injecting environment variables.
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = mode === "raw"
        ? { environment: activeTarget, raw_env: rawText }
        : { environment: activeTarget, variables: vars };

      await fetch(`${API_BASE}/api/agent/repos/${selectedRepo}/env`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 8000);
      loadEnv();
    } catch { }
    setSaving(false);
  };

  const handleAddVar = () => {
    if (!newKey.trim()) return;
    const updated = [...vars, { key: newKey.trim(), value: newVal.trim(), category: newCat, secret: newSecret }];
    setVars(updated);
    setNewKey("");
    setNewVal("");
  };

  const handleDeleteVar = (index: number) => {
    setVars(vars.filter((_, i) => i !== index));
  };

  const handleAutoGenerate = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/agent/repos/${selectedRepo}/env/generate`, { method: "POST" });
      const data = await res.json();
      if (data.recommended_env) {
        setRawText(data.recommended_env);
        setMode("raw");
      }
    } catch { }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      {/* Selector Bar */}
      <div style={{
        marginBottom: 20, padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Target Repository:</label>
          <select
            value={selectedRepo}
            onChange={e => setSelectedRepo(e.target.value)}
            style={{
              padding: "7px 14px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)",
              border: "1px solid var(--border)", fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none",
            }}
          >
            {repos.map(r => (
              <option key={r.name} value={r.name}>{r.name} ({r.language})</option>
            ))}
          </select>

          <div style={{ width: 1, height: 20, background: "var(--border)" }} />

          {/* Environment Tabs */}
          <div style={{ display: "flex", background: "var(--badge-bg)", padding: 3, borderRadius: 8, border: "1px solid var(--border)" }}>
            {(["development", "staging", "production"] as EnvTarget[]).map(t => (
              <button key={t} onClick={() => setActiveTarget(t)} style={{
                padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                fontSize: 11.5, fontWeight: activeTarget === t ? 700 : 500,
                background: activeTarget === t ? "var(--orange)" : "transparent",
                color: activeTarget === t ? "#fff" : "var(--text-2)",
                textTransform: "capitalize",
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleAutoGenerate} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
            fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>
            <I.Scan /> Auto-Detect Stack
          </button>

          <button onClick={handleSave} disabled={saving} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 18px", borderRadius: 8,
            border: "none", background: savedSuccess ? "var(--green)" : "var(--orange)", color: "#fff",
            fontSize: 12.5, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
          }}>
            {savedSuccess ? <><I.Check /> Injected Successfully</> : saving ? "Saving…" : "Save & Inject .env"}
          </button>
        </div>
      </div>

      {/* Success & Recommended Next Step Banner */}
      {savedSuccess && (
        <div style={{
          marginBottom: 16, padding: "14px 18px", borderRadius: 10,
          background: "rgba(22, 163, 74, 0.08)", border: "1px solid rgba(22, 163, 74, 0.3)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
              <I.Check /> Environment Variables Successfully Injected for {selectedRepo} ({activeTarget})!
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>
              Configuration encrypted and ready for container injection. Recommended Next Step: Launch autonomous deployment to your EC2 fleet.
            </div>
          </div>
          {onDeployRepo && (
            <button onClick={() => onDeployRepo(selectedRepo)} style={{
              padding: "8px 18px", borderRadius: 8, border: "none", background: "var(--orange)", color: "#fff",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <I.Play /> Deploy {selectedRepo.split("/").pop()} to EC2 ➔
            </button>
          )}
        </div>
      )}

      {/* Mode Switcher */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("table")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${mode === "table" ? "var(--orange)" : "var(--border)"}`,
            background: mode === "table" ? "var(--orange-bg)" : "var(--bg-card)",
            color: mode === "table" ? "var(--orange)" : "var(--text-2)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            <I.Sliders /> Structured Key-Value Table
          </button>
          <button onClick={() => setMode("raw")} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
            border: `1px solid ${mode === "raw" ? "var(--orange)" : "var(--border)"}`,
            background: mode === "raw" ? "var(--orange-bg)" : "var(--bg-card)",
            color: mode === "raw" ? "var(--orange)" : "var(--text-2)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
          }}>
            <I.Code /> Raw .env Code Editor
          </button>
        </div>

        {mode === "table" && (
          <button onClick={() => setShowSecrets(!showSecrets)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-2)",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>
            {showSecrets ? <I.EyeOff /> : <I.Eye />} {showSecrets ? "Mask Secrets" : "Reveal Secrets"}
          </button>
        )}
      </div>

      {/* Editor Content */}
      {mode === "table" ? (
        <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 3.2fr 120px 80px", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--badge-bg)" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Environment Key</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Value</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Category</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", textAlign: "right" }}>Action</span>
          </div>

          {vars.map((v, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "2.2fr 3.2fr 120px 80px", padding: "10px 18px", borderBottom: "1px solid var(--border-soft)", alignItems: "center" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, fontWeight: 600, color: "var(--orange)" }}>{v.key}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, color: "var(--text-1)" }}>
                {v.secret && !showSecrets ? "••••••••••••••••" : v.value}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)" }}>{v.category}</span>
              <div style={{ textAlign: "right" }}>
                <button onClick={() => handleDeleteVar(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: 4 }}>
                  <I.Trash />
                </button>
              </div>
            </div>
          ))}

          {/* Add Row */}
          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 3.2fr 120px 80px", padding: "12px 18px", background: "var(--bg-card2)", gap: 8, alignItems: "center" }}>
            <input
              value={newKey} onChange={e => setNewKey(e.target.value)}
              placeholder="e.g. DATABASE_URL"
              style={{ padding: "6px 10px", borderRadius: 6, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12, fontFamily: "JetBrains Mono, monospace", outline: "none" }}
            />
            <input
              value={newVal} onChange={e => setNewVal(e.target.value)}
              placeholder="e.g. postgresql://user:pass@host:5432/db"
              style={{ padding: "6px 10px", borderRadius: 6, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12, fontFamily: "JetBrains Mono, monospace", outline: "none" }}
            />
            <select
              value={newCat} onChange={e => setNewCat(e.target.value as EnvCategory)}
              style={{ padding: "6px 8px", borderRadius: 6, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 11.5, outline: "none" }}
            >
              <option value="APP">APP</option>
              <option value="DATABASE">DATABASE</option>
              <option value="AWS">AWS</option>
              <option value="AUTH">AUTH</option>
              <option value="LOGS">LOGS</option>
            </select>
            <div style={{ textAlign: "right" }}>
              <button onClick={handleAddVar} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "var(--orange)", color: "#fff", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
                Add
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", background: "var(--badge-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)", fontFamily: "JetBrains Mono, monospace" }}>
              .env.{activeTarget} ({selectedRepo})
            </span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Direct injection format: KEY=VALUE</span>
          </div>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={14}
            style={{
              width: "100%", padding: 18, background: "var(--bg-input)", color: "var(--text-1)",
              border: "none", outline: "none", fontFamily: "JetBrains Mono, monospace", fontSize: 12.5,
              lineHeight: 1.7, resize: "vertical",
            }}
          />
        </div>
      )}
    </div>
  );
};
