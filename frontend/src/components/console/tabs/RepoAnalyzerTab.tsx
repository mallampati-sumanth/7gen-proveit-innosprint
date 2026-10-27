import React, { useState } from "react";
import { RepoItem, API_BASE } from "../types";
import { I } from "../icons";

export const RepoAnalyzerTab = ({
  repos,
  onDeploy,
  onInjectEnv,
  onProvisionRecommendedEC2,
}: {
  repos: RepoItem[];
  onDeploy: (repo: string) => void;
  onInjectEnv: (repo: string) => void;
  onProvisionRecommendedEC2?: (ctx: any) => void;
}) => {
  const [repoInput, setRepoInput] = useState(repos[0]?.name || "https://github.com/fastapi/fastapi");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runAnalysis = async (targetUrl?: string) => {
    const url = (targetUrl || repoInput).trim();
    if (!url) return;
    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/agent/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: url }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.message || "Failed to inspect repository on GitHub.");
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Could not analyze repository.");
      setResult(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyEnv = () => {
    if (!result?.recommended_env) return;
    navigator.clipboard.writeText(result.recommended_env);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      {/* Search & Inspect Box */}
      <div style={{
        marginBottom: 24, padding: "20px 24px", borderRadius: 12, background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 14,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>Dynamic Repository Stack & Manifest Analyzer</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
            Inspect any public or private GitHub repository via GitHub REST API. Detects runtime, web framework, dependencies, exposed ports, Dockerfiles, and generates production .env configurations.
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={repoInput}
            onChange={e => setRepoInput(e.target.value)}
            placeholder="e.g. https://github.com/fastapi/fastapi or owner/repo"
            style={{
              flex: 1, minWidth: 280, padding: "10px 14px", borderRadius: 8,
              background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
              fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none",
            }}
          />
          <button
            onClick={() => runAnalysis()}
            disabled={analyzing}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 8,
              border: "none", background: "var(--orange)", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: analyzing ? "not-allowed" : "pointer",
            }}
          >
            {analyzing ? <><I.Loader /> Inspecting GitHub…</> : <><I.Scan /> Analyze Tech Stack</>}
          </button>
        </div>

        {/* Quick select from connected repos */}
        {repos.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: "var(--text-3)" }}>
            <span>Connected repos:</span>
            {repos.map(r => (
              <button
                key={r.name}
                onClick={() => { setRepoInput(r.name); runAnalysis(r.name); }}
                style={{
                  padding: "3px 10px", borderRadius: 6, border: "1px solid var(--border)",
                  background: "var(--badge-bg)", color: "var(--orange)", fontSize: 11.5,
                  cursor: "pointer", fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}

        {/* Quick public suggestions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 11.5, color: "var(--text-3)" }}>
          <span>Try public repos:</span>
          {[
            "https://github.com/fastapi/fastapi",
            "https://github.com/pallets/flask",
            "https://github.com/vercel/next.js",
          ].map(u => (
            <button
              key={u}
              onClick={() => { setRepoInput(u); runAnalysis(u); }}
              style={{
                padding: "2px 8px", borderRadius: 4, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-2)", fontSize: 11, cursor: "pointer",
              }}
            >
              {u.replace("https://github.com/", "")}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", fontSize: 12.5 }}>
            {error}
          </div>
        )}
      </div>

      {/* Analysis Result Card */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Top Banner */}
          <div style={{
            padding: "18px 22px", borderRadius: 12, background: "var(--bg-card)",
            border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--orange-bg)", border: "1px solid var(--orange-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--orange)" }}>
                <I.Scan />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <a href={result.html_url || `https://github.com/${result.repository}`} target="_blank" rel="noreferrer" style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", textDecoration: "none" }}>
                    {result.repository}
                  </a>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#16a34a", color: "#ffffff" }}>
                    INSPECTED
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
                  Branch: <strong style={{ color: "var(--text-1)" }}>{result.branch}</strong> · Commit: <strong style={{ color: "var(--orange)", fontFamily: "JetBrains Mono, monospace" }}>#{result.commit_sha}</strong> · {result.stars} Stars · {result.forks} Forks
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {onProvisionRecommendedEC2 && (
                <button onClick={() => onProvisionRecommendedEC2({
                  name: `Host-${result.repository.split("/").pop()}`,
                  target_repo: result.repository,
                  app_port: result.port || 5000,
                  framework: result.framework || "Web Framework",
                  instance_type: "t3.micro",
                  region: "us-east-1",
                })} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                  border: "1px solid rgba(22, 163, 74, 0.4)", background: "rgba(22, 163, 74, 0.1)", color: "#16a34a",
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                }}>
                  <I.Zap /> 1-Click AWS EC2 (Free Tier)
                </button>
              )}
              <button onClick={() => onInjectEnv(result.repository)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                <I.Sliders /> Configure .env
              </button>
              <button
                onClick={() => onDeploy(result.repository)}
                title="Deploy to Vercel, Netlify, Render, Railway, or AWS EC2"
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8,
                  border: "none", background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "#fff",
                  fontSize: 12.5, fontWeight: 700, cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(249, 115, 22, 0.25)",
                }}
              >
                <I.Play /> Deploy App (Multi-Cloud)
              </button>
            </div>
          </div>

          {/* AI Architecture & Readiness Card */}
          {result.agent_summary && (
            <div style={{
              padding: "18px 22px", borderRadius: 12, background: "var(--bg-card)",
              border: "1px solid var(--orange-border)", display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: "var(--orange-bg)", color: "var(--orange)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <I.Bot />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Agentic AI Architecture & Deployment Evaluation</span>
                    <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--orange-bg)", color: "var(--orange)" }}>
                      AI AGENT POWERED
                    </span>
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                    background: (result.readiness_score || 90) >= 80 ? "var(--green-bg)" : "var(--yellow-bg)",
                    color: (result.readiness_score || 90) >= 80 ? "var(--green)" : "var(--yellow)",
                  }}>
                    {result.readiness_score || 92}% Autonomous Readiness
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)", marginTop: 8, lineHeight: 1.65 }}>
                  {result.agent_summary}
                </div>
                {result.security_audit && (
                  <div style={{
                    marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "var(--badge-bg)",
                    border: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)", display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{ color: "var(--green)" }}><I.Shield /></span>
                    <span><strong>Security & Blast Radius Audit:</strong> {result.security_audit}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid of Key Stack Specs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
            <div style={{ padding: 16, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Runtime & Language</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--orange)", marginTop: 6 }}>{result.runtime}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>Package Manager: {result.package_manager}</div>
            </div>

            <div style={{ padding: 16, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Framework Detected</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", marginTop: 6 }}>{result.framework}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>Optimized for production containers</div>
            </div>

            <div style={{ padding: 16, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Port & Healthcheck</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", fontFamily: "JetBrains Mono, monospace", marginTop: 6 }}>
                Port {result.port}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>Probe Endpoint: {result.health_endpoint || "/health"}</div>
            </div>

            <div style={{ padding: 16, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Docker Specification</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: result.has_dockerfile ? "var(--green)" : "var(--yellow)", marginTop: 6 }}>
                {result.has_dockerfile ? "Dockerfile Detected" : "Auto-Generated Container"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 4 }}>
                {result.dockerfile_base || "Standard standalone deployment"}
              </div>
            </div>
          </div>

          {/* Dependencies Detected */}
          {result.dependencies && result.dependencies.length > 0 && (
            <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>Key Manifest Dependencies</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.dependencies.map((dep: string) => (
                  <span key={dep} style={{
                    padding: "4px 10px", borderRadius: 6, background: "var(--badge-bg)",
                    border: "1px solid var(--border)", color: "var(--text-1)", fontSize: 12, fontFamily: "JetBrains Mono, monospace",
                  }}>
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended .env Preview */}
          {result.recommended_env && (
            <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--badge-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>Recommended Deployment Environment (.env)</span>
                <button onClick={copyEnv} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 6,
                  border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)",
                  fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                }}>
                  {copied ? <><I.Check /> Copied</> : <><I.Copy /> Copy .env</>}
                </button>
              </div>
              <pre style={{
                margin: 0, padding: 18, background: "var(--bg-input)", color: "var(--text-1)",
                fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, lineHeight: 1.7, overflowX: "auto",
              }}>
                {result.recommended_env}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
