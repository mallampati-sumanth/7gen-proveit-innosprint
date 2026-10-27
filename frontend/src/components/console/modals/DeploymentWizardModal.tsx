import React, { useState, useEffect } from "react";
import { RepoItem, EC2InstanceItem, EnvTarget, API_BASE } from "../types";
import { I } from "../icons";

interface CloudProviderOption {
  id: "vercel" | "render" | "railway" | "aws";
  name: string;
  icon: string;
  category: string;
  description: string;
  badge: string;
}

const PROVIDERS: CloudProviderOption[] = [
  {
    id: "vercel",
    name: "Vercel",
    icon: "▲",
    category: "Edge & Frontend",
    description: "Zero-config edge network for Next.js, React, and serverless APIs.",
    badge: "Next.js / Edge",
  },
  {
    id: "render",
    name: "Render",
    icon: "⬢",
    category: "Web Services & APIs",
    description: "Auto-scaling cloud for FastAPI, Flask, Node, and Docker apps.",
    badge: "FastAPI / Docker",
  },
  {
    id: "railway",
    name: "Railway",
    icon: "🚂",
    category: "Full-Stack & DBs",
    description: "Deploy code, Dockerfiles, and persistent databases effortlessly.",
    badge: "Microservices",
  },
  {
    id: "aws",
    name: "AWS EC2",
    icon: "☁",
    category: "Infrastructure (IaaS)",
    description: "Isolated virtual machines with root Docker daemon access.",
    badge: "Custom VM",
  },
];

export const DeploymentWizardModal = ({
  open,
  onClose,
  repos,
  instances,
  selectedRepo,
  selectedInstance,
  onRepoChange,
  onInstanceChange,
  onLaunch,
}: {
  open: boolean;
  onClose: () => void;
  repos: RepoItem[];
  instances: EC2InstanceItem[];
  selectedRepo: string;
  selectedInstance: string;
  onRepoChange?: (repo: string) => void;
  onInstanceChange?: (inst: string) => void;
  onLaunch: (repo: string, instance: string, env: EnvTarget) => void;
}) => {
  const [activeTab, setActiveTab] = useState<"deploy" | "sre">("deploy");
  const [repo, setRepo] = useState(selectedRepo || repos[0]?.name || "");
  const [provider, setProvider] = useState<"vercel" | "render" | "railway" | "aws">("render");
  const [inst, setInst] = useState(selectedInstance || instances[0]?.instance_id || "NEW_INSTANCE");
  const [env, setEnv] = useState<EnvTarget>("production");

  // AI Recommendation State
  const [recommendation, setRecommendation] = useState<{
    recommended_provider: string;
    confidence: number;
    reason: string;
  } | null>(null);

  // Multi-Cloud Deployment Live State
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<any>(null);

  // SRE Self-Healing Studio State
  const [sreScenario, setSreScenario] = useState<string>("missing_env");
  const [sreLoading, setSreLoading] = useState(false);
  const [sreResult, setSreResult] = useState<any>(null);

  // Fetch AI recommendation when repo changes
  useEffect(() => {
    if (!repo) return;
    const fetchRec = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/multicloud/recommendation?repo_name=${encodeURIComponent(repo)}`);
        if (res.ok) {
          const data = await res.json();
          setRecommendation(data);
          if (data.recommended_provider && ["vercel", "render", "railway", "aws"].includes(data.recommended_provider)) {
            setProvider(data.recommended_provider as any);
          }
        }
      } catch {}
    };
    fetchRec();
  }, [repo]);
  useEffect(() => {
    if (open) {
      const defaultRepo = (selectedRepo && repos.some(r => r.name === selectedRepo))
        ? selectedRepo
        : (repos[0]?.name || selectedRepo || "");
      const defaultInst = (selectedInstance && instances.some(i => i.instance_id === selectedInstance))
        ? selectedInstance
        : (instances[0]?.instance_id || selectedInstance || "");

      setRepo(defaultRepo);
      setInst(defaultInst);
      setEnv("production");
    }
  }, [open]);

  // Fallback for late-loading data without overriding existing user selection
  useEffect(() => {
    if (open) {
      if (!repo && repos.length > 0) {
        setRepo(selectedRepo || repos[0].name);
      }
      if (!inst && instances.length > 0) {
        setInst(selectedInstance || instances[0].instance_id);
      }
    }
  }, [open, repos.length, instances.length]);

  if (!open) return null;

  // Handle Multi-Cloud Deployment
  const handleMultiCloudDeploy = async () => {
    if (provider === "aws") {
      onLaunch(repo, inst, env);
      onClose();
      return;
    }

    setDeploying(true);
    setDeployResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/multicloud/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_name: repo,
          provider: provider,
          branch: "main",
          env_vars: { ENVIRONMENT: env },
        }),
      });
      const data = await res.json();
      setDeployResult(data);
    } catch (err: any) {
      setDeployResult({ status: "ERROR", message: err?.message || "Deployment request failed." });
    } finally {
      setDeploying(false);
    }
  };

  // Trigger SRE Autonomous Self-Healing
  const handleTriggerSRE = async () => {
    setSreLoading(true);
    setSreResult(null);

    let errorLog = "KeyError: 'DATABASE_URL' missing on startup at main.py:42";
    if (sreScenario === "port_collision") {
      errorLog = "Error: listen EADDRINUSE: address already in use :::8000";
    } else if (sreScenario === "oom") {
      errorLog = "Process killed by OOM (Out Of Memory) killer. MemoryLimitExceeded: 1024MB exceeded.";
    } else if (sreScenario === "crash") {
      errorLog = "Fatal error: unhandled exception in commit HEAD. SyntaxError in routes/api.py.";
    }

    try {
      const res = await fetch(`${API_BASE}/api/multicloud/heal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_service: `${provider}:${repo.split("/").pop()}`,
          error_log: errorLog,
          exit_code: 1,
          auto_execute: true,
        }),
      });
      const data = await res.json();
      setSreResult(data);
    } catch (err: any) {
      setSreResult({ status: "FAILED", explanation: err?.message });
    } finally {
      setSreLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.75)",
      backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 680, maxHeight: "90vh", borderRadius: 16, background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", flexDirection: "column",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)", overflow: "hidden",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          background: "var(--bg-card2)",
        }}>
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Multi-Cloud Deployment &amp; SRE Engine</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: "rgba(249, 115, 22, 0.12)", color: "var(--orange)",
                border: "1px solid rgba(249, 115, 22, 0.3)"
              }}>
                MCP AGENTS
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              Deploy to Vercel, Render, Railway, or AWS with AI stack recommendation and autonomous self-healing.
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 18 }}><I.X /></button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <button
            onClick={() => setActiveTab("deploy")}
            style={{
              flex: 1, padding: "11px 16px", border: "none",
              borderBottom: activeTab === "deploy" ? "2px solid var(--orange)" : "2px solid transparent",
              background: activeTab === "deploy" ? "var(--bg-card2)" : "transparent",
              color: activeTab === "deploy" ? "var(--orange)" : "var(--text-3)",
              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s ease",
            }}
          >
            1. Multi-Cloud Target Selector
          </button>
          <button
            onClick={() => setActiveTab("sre")}
            style={{
              flex: 1, padding: "11px 16px", border: "none",
              borderBottom: activeTab === "sre" ? "2px solid var(--green)" : "2px solid transparent",
              background: activeTab === "sre" ? "var(--bg-card2)" : "transparent",
              color: activeTab === "sre" ? "var(--green)" : "var(--text-3)",
              fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all .15s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <I.Activity />
            <span>2. Autonomous SRE Self-Healing Studio</span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "22px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
          {activeTab === "deploy" ? (
            <>
              {/* Step 1: Select Repository */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, display: "block" }}>
                  1. Choose Repository
                </label>
                {repos.length === 0 ? (
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-3)" }}>
                    No repositories connected yet. Please add a GitHub repository in the Repositories tab.
                  </div>
                ) : (
                  <select
                    value={repo}
                    onChange={e => setRepo(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8,
                      background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                      fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none",
                    }}
                  >
                    {repos.map(r => (
                      <option key={r.name} value={r.name}>{r.name} ({r.language})</option>
                    ))}
                  </select>
                )}
              </div>

              {/* AI Recommendation Banner */}
              {recommendation && (
                <div style={{
                  padding: "12px 16px", borderRadius: 10,
                  background: "rgba(249, 115, 22, 0.08)", border: "1px solid rgba(249, 115, 22, 0.25)",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <div style={{ color: "var(--orange)", fontSize: 16, marginTop: 1 }}>⚡</div>
                  <div style={{ fontSize: 12, lineHeight: 1.45 }}>
                    <strong style={{ color: "var(--text-1)" }}>
                      AI Recommendation: {recommendation.recommended_provider.toUpperCase()} ({(recommendation.confidence * 100).toFixed(0)}% Match)
                    </strong>
                    <div style={{ color: "var(--text-3)", marginTop: 2 }}>{recommendation.reason}</div>
                  </div>
                </div>
              )}

              {/* Step 2: Target Cloud Platform Grid */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, display: "block" }}>
                  2. Select Target Cloud Platform
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {PROVIDERS.map(p => {
                    const isSelected = provider === p.id;
                    const isRec = recommendation?.recommended_provider === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setProvider(p.id)}
                        style={{
                          padding: "14px", borderRadius: 10, cursor: "pointer",
                          background: isSelected ? "var(--bg-card2)" : "var(--bg-input)",
                          border: `1.5px solid ${isSelected ? "var(--orange)" : "var(--border)"}`,
                          display: "flex", flexDirection: "column", gap: 6,
                          position: "relative", transition: "all .15s ease",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 16 }}>{p.icon}</span>
                            <span style={{ fontSize: 13.5, fontWeight: 800, color: isSelected ? "var(--text-1)" : "var(--text-2)" }}>{p.name}</span>
                          </div>
                          {isRec && (
                            <span style={{
                              fontSize: 9.5, fontWeight: 800, padding: "2px 6px", borderRadius: 99,
                              background: "rgba(22, 163, 74, 0.15)", color: "#16a34a",
                              border: "1px solid rgba(22, 163, 74, 0.3)"
                            }}>
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.35 }}>{p.description}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Conditional Instance Selector if AWS */}
              {provider === "aws" && (
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, display: "block" }}>
                    Select Target AWS EC2 Node
                  </label>
                  <select
                    value={inst}
                    onChange={e => setInst(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 8,
                      background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                      fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none",
                    }}
                  >
                    <option value="NEW_INSTANCE">+ Launch &amp; Provision New EC2 Node in AWS</option>
                    {instances.map(i => (
                      <option key={i.instance_id} value={i.instance_id}>{i.name} - {i.public_ip} ({i.region})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 4: Environment Target */}
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 6, display: "block" }}>
                  3. Injected Environment Target
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {(["production", "staging", "development"] as EnvTarget[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setEnv(t)}
                      style={{
                        flex: 1, padding: "8px 0", borderRadius: 8,
                        border: `1px solid ${env === t ? "var(--orange)" : "var(--border)"}`,
                        background: env === t ? "var(--orange-bg)" : "var(--bg-input)",
                        color: env === t ? "var(--orange)" : "var(--text-2)",
                        fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Deployment Result Card */}
              {deployResult && (
                <div style={{
                  padding: "16px", borderRadius: 12,
                  background: deployResult.status === "SUCCESS" ? "rgba(22, 163, 74, 0.08)" : "rgba(239, 68, 68, 0.08)",
                  border: `1px solid ${deployResult.status === "SUCCESS" ? "rgba(22, 163, 74, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: deployResult.status === "SUCCESS" ? "#16a34a" : "#ef4444" }}>
                      {deployResult.status === "SUCCESS" ? `✓ Deployed Live to ${provider.toUpperCase()}` : "Deployment Error"}
                    </div>
                    {deployResult.proof_sha256 && (
                      <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono, monospace", color: "var(--text-3)" }}>
                        Proof: {deployResult.proof_sha256.slice(0, 14)}...
                      </span>
                    )}
                  </div>

                  {deployResult.live_url && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--text-2)", fontFamily: "JetBrains Mono, monospace" }}>
                        {deployResult.live_url}
                      </div>
                      <a
                        href={deployResult.live_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: "6px 14px", borderRadius: 6, background: "var(--green)",
                          color: "#fff", fontSize: 11.5, fontWeight: 700, textDecoration: "none",
                        }}
                      >
                        Open Live URL ↗
                      </a>
                    </div>
                  )}

                  {/* Terminal Logs Preview */}
                  {deployResult.build_logs && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 8, background: "#0a0a0a",
                      color: "#10b981", fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                      maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: 3,
                    }}>
                      {deployResult.build_logs.map((lg: string, idx: number) => (
                        <div key={idx}>{lg}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Tab 2: Autonomous SRE Self-Healing Studio */
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{
                padding: "14px 16px", borderRadius: 10,
                background: "var(--bg-card2)", border: "1px solid var(--border)",
                fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5,
              }}>
                <strong style={{ color: "var(--text-1)" }}>Autonomous SRE Agent:</strong> When an application crashes in production, the AI Agent captures error logs, queries the LLM for root-cause diagnosis, executes the remediation (injecting secrets, re-binding ports, or rolling back), and seals cryptographic proof into the ledger.
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 8, display: "block" }}>
                  Select Anomaly Scenario to Simulate:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {[
                    { id: "missing_env", label: "Missing Secret / Env Var", sub: "KeyError: 'DATABASE_URL' on startup" },
                    { id: "port_collision", label: "Port Collision (502)", sub: "listen EADDRINUSE :::8000" },
                    { id: "oom", label: "Kernel OOM Crash", sub: "Process killed by OOM (1024MB exceeded)" },
                    { id: "crash", label: "Fatal Syntax / Code Bug", sub: "Unhandled exception in latest commit" },
                  ].map(sc => (
                    <div
                      key={sc.id}
                      onClick={() => setSreScenario(sc.id)}
                      style={{
                        padding: "12px", borderRadius: 8, cursor: "pointer",
                        background: sreScenario === sc.id ? "var(--bg-card2)" : "var(--bg-input)",
                        border: `1.5px solid ${sreScenario === sc.id ? "var(--green)" : "var(--border)"}`,
                      }}
                    >
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>{sc.label}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>{sc.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleTriggerSRE}
                disabled={sreLoading}
                style={{
                  padding: "11px 20px", borderRadius: 8, border: "none",
                  background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: sreLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {sreLoading ? <I.Loader /> : <I.Activity />}
                <span>{sreLoading ? "LLM Diagnosing & Auto-Healing..." : "Simulate Crash & Run Autonomous Self-Healing"}</span>
              </button>

              {/* SRE Healing Result */}
              {sreResult && (
                <div style={{
                  padding: "16px", borderRadius: 12, background: "rgba(22, 163, 74, 0.08)",
                  border: "1px solid rgba(22, 163, 74, 0.3)", display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>
                      ✓ Service Autonomously Healed ({sreResult.prescribed_action})
                    </span>
                    <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono, monospace", color: "var(--text-3)" }}>
                      Incident #{sreResult.incident_id}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: "var(--text-1)", lineHeight: 1.45 }}>
                    <strong>Root Cause:</strong> {sreResult.root_cause}
                    <div style={{ color: "var(--text-3)", marginTop: 4 }}>{sreResult.explanation}</div>
                  </div>

                  {sreResult.remediation_log && (
                    <div style={{
                      padding: "10px 12px", borderRadius: 8, background: "#0a0a0a",
                      color: "#10b981", fontSize: 11, fontFamily: "JetBrains Mono, monospace",
                      display: "flex", flexDirection: "column", gap: 3,
                    }}>
                      {sreResult.remediation_log.map((lg: string, idx: number) => (
                        <div key={idx}>{lg}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--bg-card2)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            Target: <strong style={{ color: "var(--text-1)" }}>{provider.toUpperCase()}</strong> ({env})
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: "9px 18px", borderRadius: 8, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-2)", fontSize: 13, cursor: "pointer",
              }}
            >
              Close
            </button>

            {activeTab === "deploy" && (
              <button
                onClick={handleMultiCloudDeploy}
                disabled={deploying || !repo || repos.length === 0}
                style={{
                  padding: "9px 24px", borderRadius: 8, border: "none",
                  background: (!repo || repos.length === 0 || deploying) ? "var(--border)" : "var(--orange)",
                  color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: (!repo || repos.length === 0 || deploying) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                }}
              >
                {deploying && <I.Loader />}
                <span>
                  {deploying
                    ? `Deploying to ${provider.toUpperCase()}...`
                    : `Deploy to ${provider.toUpperCase()} ${PROVIDERS.find(p => p.id === provider)?.icon || ""}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
