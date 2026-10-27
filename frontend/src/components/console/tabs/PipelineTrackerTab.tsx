import React, { useState, useEffect, useRef } from "react";
import { EnvTarget, RepoItem, EC2InstanceItem, API_BASE } from "../types";
import { I } from "../icons";

export interface PipelineStageNode {
  id: string;
  name: string;
  phase: "CI" | "CD";
  status: "pending" | "running" | "success" | "failed";
  verdict?: "ACCEPTED" | "FAILED" | "PENDING" | "RUNNING";
  duration?: string;
  detail?: string;
  rawJson?: string;
  timestamp?: string;
}

export interface PipelineState {
  runId: string;
  repo: string;
  ec2Target: string;
  ec2Ip: string;
  environment: EnvTarget;
  status: "idle" | "running" | "success" | "failed";
  startTime: number | null;
  endTime: number | null;
  durationSeconds: number;
  commitId: string;
  imageTag: string;
  framework: string;
  port: number;
  appUrl?: string;
  proofHash?: string;
  thought?: string;
  error?: string;
  nodes: Record<string, PipelineStageNode>;
  logs: Array<{ id: string; time: string; text: string; type: "info" | "success" | "warn" | "error" | "gate" }>;
}

export const PipelineTrackerTab = ({
  pipelineState,
  onOpenLiveUrl,
  onRedeploy,
  onBackToArchitect,
  repos,
  instances,
}: {
  pipelineState: PipelineState;
  onOpenLiveUrl?: (url: string) => void;
  onRedeploy?: (repo: string, instance: string, env: EnvTarget) => void;
  onBackToArchitect?: () => void;
  repos: RepoItem[];
  instances: EC2InstanceItem[];
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>("setup_job");
  const [copiedCommit, setCopiedCommit] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal on new logs
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pipelineState.logs]);

  // Set selected node to current running node if available
  useEffect(() => {
    const runningNode = Object.values(pipelineState.nodes).find(n => n.status === "running");
    if (runningNode) {
      setSelectedNodeId(runningNode.id);
    }
  }, [pipelineState.nodes]);

  const copyToClipboard = (text: string, type: "commit" | "proof") => {
    navigator.clipboard.writeText(text);
    if (type === "commit") {
      setCopiedCommit(true);
      setTimeout(() => setCopiedCommit(false), 2000);
    } else {
      setCopiedProof(true);
      setTimeout(() => setCopiedProof(false), 2000);
    }
  };

  const ciNodes = [
    pipelineState.nodes["setup_job"] || { id: "setup_job", name: "Set up job", phase: "CI", status: "pending" },
    pipelineState.nodes["checkout_code"] || { id: "checkout_code", name: "Checkout Code", phase: "CI", status: "pending" },
    pipelineState.nodes["initialization"] || { id: "initialization", name: "Initialization & Stack", phase: "CI", status: "pending" },
    pipelineState.nodes["build"] || { id: "build", name: "Build & Port Check", phase: "CI", status: "pending" },
    pipelineState.nodes["unit_test"] || { id: "unit_test", name: "Security & Policy Gate", phase: "CI", status: "pending" },
  ];

  const cdNodes = [
    pipelineState.nodes["host_handshake"] || { id: "host_handshake", name: "Set up job", phase: "CD", status: "pending" },
    pipelineState.nodes["checkout_cd"] || { id: "checkout_cd", name: "Checkout Code", phase: "CD", status: "pending" },
    pipelineState.nodes["docker_init"] || { id: "docker_init", name: "Initialization", phase: "CD", status: "pending" },
    pipelineState.nodes["inject_secrets"] || { id: "inject_secrets", name: "Inject GitHub Secrets into VM", phase: "CD", status: "pending" },
    pipelineState.nodes["deploy_vm"] || { id: "deploy_vm", name: "Deploy to VM", phase: "CD", status: "pending" },
  ];

  const selectedNode = pipelineState.nodes[selectedNodeId] || ciNodes[0];

  const isCiSuccess = ciNodes.every(n => n.status === "success");
  const isCiRunning = ciNodes.some(n => n.status === "running");
  const isCiFailed = ciNodes.some(n => n.status === "failed");

  const isCdSuccess = cdNodes.every(n => n.status === "success");
  const isCdRunning = cdNodes.some(n => n.status === "running");
  const isCdFailed = cdNodes.some(n => n.status === "failed");

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
      {/* ─── APP & PIPELINE SUMMARY HEADER ─── */}
      <div style={{
        padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
        boxShadow: "var(--shadow-sm)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          {/* Framework Icon Box */}
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: "var(--bg-input)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "var(--text-1)",
          }}>
            <I.Box />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.02em" }}>
                {pipelineState.repo || "Select a Target Repository"}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 980, background: "var(--badge-bg)", color: "var(--text-2)", border: "1px solid var(--border-soft)" }}>
                {pipelineState.framework || (pipelineState.status === "running" ? "Detecting Stack..." : "Docker / Web")}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 980,
                background: pipelineState.environment === "production" ? "var(--orange-bg)" : "var(--badge-bg)",
                color: pipelineState.environment === "production" ? "var(--orange)" : "var(--text-2)",
                textTransform: "uppercase", letterSpacing: ".04em",
              }}>
                {pipelineState.environment}
              </span>
            </div>

            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span>Target: <strong style={{ color: "var(--text-1)" }}>{pipelineState.ec2Target || "No Target Selected"}</strong></span>
              <span>·</span>
              <span>Host IP: <strong style={{ color: "var(--orange)", fontFamily: "JetBrains Mono, monospace" }}>{pipelineState.ec2Ip || "Pending IP"}</strong></span>
              <span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <I.Clock /> Duration: <strong style={{ color: "var(--text-1)", fontFamily: "JetBrains Mono, monospace" }}>{formatTimer(pipelineState.durationSeconds)}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Global Pipeline Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {pipelineState.appUrl && (
            <a
              href={pipelineState.appUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                background: "rgba(22, 163, 74, 0.15)", color: "#16a34a", border: "1px solid rgba(22, 163, 74, 0.35)",
                fontSize: 12.5, fontWeight: 700, textDecoration: "none", cursor: "pointer",
                animation: "pulse 2s infinite ease-in-out",
              }}
            >
              <I.ExternalLink /> Open Live App ➔
            </a>
          )}

          {pipelineState.proofHash && (
            <button
              onClick={() => copyToClipboard(pipelineState.proofHash!, "proof")}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-2)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              <I.Copy /> {copiedProof ? "Proof Copied!" : `Proof #${pipelineState.proofHash.slice(0, 8)}`}
            </button>
          )}

          {onBackToArchitect && (
            <button
              onClick={onBackToArchitect}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8,
                background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-2)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}
            >
              <I.Bot /> AI Architect
            </button>
          )}

          {onRedeploy && (
            <button
              onClick={() => onRedeploy(pipelineState.repo, pipelineState.ec2Target, pipelineState.environment)}
              disabled={pipelineState.status === "running"}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
                border: "none", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
                fontSize: 12.5, fontWeight: 700, cursor: pipelineState.status === "running" ? "not-allowed" : "pointer",
                opacity: pipelineState.status === "running" ? 0.6 : 1,
              }}
            >
              {pipelineState.status === "running" ? <><I.Loader /> Deploying…</> : <><I.Play /> Re-Deploy</>}
            </button>
          )}
        </div>
      </div>

      {/* ─── PHASE 1: CONTINUOUS INTEGRATION (EXACTLY LIKE IMAGE 2) ─── */}
      <div style={{
        borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
        padding: "18px 22px", boxShadow: "var(--shadow-sm)",
      }}>
        {/* CI Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
            Continuous Integration
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 980,
              fontSize: 12, fontWeight: 700,
              background: isCiSuccess ? "rgba(22, 163, 74, 0.12)" : isCiRunning ? "rgba(234, 179, 8, 0.12)" : isCiFailed ? "rgba(220, 38, 38, 0.12)" : "var(--badge-bg)",
              color: isCiSuccess ? "#16a34a" : isCiRunning ? "#d97706" : isCiFailed ? "#dc2626" : "var(--text-3)",
              border: `1px solid ${isCiSuccess ? "rgba(22, 163, 74, 0.3)" : isCiRunning ? "rgba(234, 179, 8, 0.3)" : isCiFailed ? "rgba(220, 38, 38, 0.3)" : "var(--border-soft)"}`,
            }}>
              {isCiSuccess && <I.CheckCircle2 />}
              {isCiRunning && <I.Loader />}
              {isCiFailed && <I.AlertCircle />}
              {!isCiSuccess && !isCiRunning && !isCiFailed && <I.Circle />}
              {isCiSuccess ? "Success" : isCiRunning ? "Running" : isCiFailed ? "Failed" : "Pending"}
            </span>

            <button style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }} title="Pipeline Graph"><I.Network /></button>
            <button style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }} title="Metrics"><I.BarChart /></button>
            <button style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }} title="More"><I.MoreHorizontal /></button>
          </div>
        </div>

        {/* CI Metadata Grid (Build Number, Image Tag, Commit ID, Last Run, Mode) */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14,
          paddingBottom: 16, borderBottom: "1px solid var(--border-soft)", marginBottom: 18,
          fontSize: 12,
        }}>
          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Build Number</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--blue)", fontWeight: 700 }}>
              {pipelineState.runId || "—"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Deployed Image Tag</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--text-2)" }}>
              {pipelineState.imageTag || "—"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Commit ID</div>
            <div
              onClick={() => pipelineState.commitId && copyToClipboard(pipelineState.commitId, "commit")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "JetBrains Mono, monospace", color: pipelineState.commitId ? "var(--blue)" : "var(--text-3)", cursor: pipelineState.commitId ? "pointer" : "default" }}
              title={pipelineState.commitId ? "Click to copy commit hash" : ""}
            >
              {pipelineState.commitId || "—"} {pipelineState.commitId && <I.Copy />}
              {copiedCommit && <span style={{ fontSize: 10, color: "var(--green)" }}>Copied</span>}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Last Run</div>
            <div style={{ color: "var(--text-2)" }}>
              {pipelineState.startTime ? new Date(pipelineState.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Awaiting Run"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Deployment Mode</div>
            <div style={{ color: "var(--blue)", fontWeight: 600 }}>Docker Engine</div>
          </div>
        </div>

        {/* Horizontal Connected Pipeline Flow Track */}
        <div style={{ overflowX: "auto", paddingBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: 680 }}>
            {ciNodes.map((node, idx) => {
              const isSelected = selectedNodeId === node.id;
              const isDone = node.status === "success";
              const isRunning = node.status === "running";
              const isFailed = node.status === "failed";

              return (
                <React.Fragment key={node.id}>
                  {/* Step Pill */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9999,
                      background: isSelected ? "var(--bg-card2)" : "var(--bg-input)",
                      border: `1.5px solid ${isSelected ? "var(--orange)" : isDone ? "rgba(22, 163, 74, 0.35)" : isRunning ? "rgba(234, 179, 8, 0.45)" : isFailed ? "rgba(220, 38, 38, 0.45)" : "var(--border)"}`,
                      boxShadow: isSelected ? "0 0 0 2px var(--orange-bg)" : "none",
                      cursor: "pointer", transition: "all .15s", flexShrink: 0,
                    }}
                    title={`Click to view ${node.name} details & verdict`}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isDone && <I.CheckCircle2 />}
                      {isRunning && <I.Loader />}
                      {isFailed && <I.AlertCircle />}
                      {!isDone && !isRunning && !isFailed && (
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--border)" }} />
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: isSelected || isDone ? 700 : 500, color: isFailed ? "#dc2626" : "var(--text-1)" }}>
                      {node.name}
                    </span>
                    {node.duration && (
                      <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono, monospace", color: "var(--text-3)", marginLeft: 2 }}>
                        {node.duration}
                      </span>
                    )}
                  </div>

                  {/* Connector Line */}
                  {idx < ciNodes.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, minWidth: 24,
                      background: isDone ? "#16a34a" : isRunning ? "var(--yellow)" : isFailed ? "#dc2626" : "var(--border)",
                      transition: "background .3s",
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── PHASE 2: CONTINUOUS DEPLOYMENT (EXACTLY LIKE IMAGE 2) ─── */}
      <div style={{
        borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
        padding: "18px 22px", boxShadow: "var(--shadow-sm)",
      }}>
        {/* CD Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
            Continuous Deployment
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 980,
              fontSize: 12, fontWeight: 700,
              background: isCdSuccess ? "rgba(22, 163, 74, 0.12)" : isCdRunning ? "rgba(234, 179, 8, 0.12)" : isCdFailed ? "rgba(220, 38, 38, 0.12)" : "var(--badge-bg)",
              color: isCdSuccess ? "#16a34a" : isCdRunning ? "#d97706" : isCdFailed ? "#dc2626" : "var(--text-3)",
              border: `1px solid ${isCdSuccess ? "rgba(22, 163, 74, 0.3)" : isCdRunning ? "rgba(234, 179, 8, 0.3)" : isCdFailed ? "rgba(220, 38, 38, 0.3)" : "var(--border-soft)"}`,
            }}>
              {isCdSuccess && <I.CheckCircle2 />}
              {isCdRunning && <I.Loader />}
              {isCdFailed && <I.AlertCircle />}
              {!isCdSuccess && !isCdRunning && !isCdFailed && <I.Circle />}
              {isCdSuccess ? "Success" : isCdRunning ? "Running" : isCdFailed ? "Failed" : "Pending"}
            </span>

            <button style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }} title="Pipeline Graph"><I.Network /></button>
            <button style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }} title="Metrics"><I.BarChart /></button>
            <button style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }} title="More"><I.MoreHorizontal /></button>
          </div>
        </div>

        {/* CD Metadata Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 14,
          paddingBottom: 16, borderBottom: "1px solid var(--border-soft)", marginBottom: 18,
          fontSize: 12,
        }}>
          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Build Number</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--blue)", fontWeight: 700 }}>
              {pipelineState.runId || "—"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Deployed Image Tag</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--text-1)", fontWeight: 600 }}>
              {pipelineState.imageTag || "—"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Commit ID</div>
            <div
              onClick={() => pipelineState.commitId && copyToClipboard(pipelineState.commitId, "commit")}
              style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "JetBrains Mono, monospace", color: pipelineState.commitId ? "var(--blue)" : "var(--text-3)", cursor: pipelineState.commitId ? "pointer" : "default" }}
              title={pipelineState.commitId ? "Click to copy commit hash" : ""}
            >
              {pipelineState.commitId || "—"} {pipelineState.commitId && <I.Copy />}
              {copiedCommit && <span style={{ fontSize: 10, color: "var(--green)" }}>Copied</span>}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Last Run</div>
            <div style={{ color: "var(--text-2)" }}>
              {pipelineState.startTime ? new Date(pipelineState.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Awaiting Run"}
            </div>
          </div>

          <div>
            <div style={{ color: "var(--text-3)", marginBottom: 3 }}>Deployment Mode</div>
            <div style={{ color: "var(--blue)", fontWeight: 600 }}>Docker</div>
          </div>
        </div>

        {/* Horizontal Connected Pipeline Flow Track */}
        <div style={{ overflowX: "auto", paddingBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", minWidth: 720 }}>
            {cdNodes.map((node, idx) => {
              const isSelected = selectedNodeId === node.id;
              const isDone = node.status === "success";
              const isRunning = node.status === "running";
              const isFailed = node.status === "failed";

              return (
                <React.Fragment key={node.id}>
                  {/* Step Pill */}
                  <div
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9999,
                      background: isSelected ? "var(--bg-card2)" : "var(--bg-input)",
                      border: `1.5px solid ${isSelected ? "var(--orange)" : isDone ? "rgba(22, 163, 74, 0.35)" : isRunning ? "rgba(234, 179, 8, 0.45)" : isFailed ? "rgba(220, 38, 38, 0.45)" : "var(--border)"}`,
                      boxShadow: isSelected ? "0 0 0 2px var(--orange-bg)" : "none",
                      cursor: "pointer", transition: "all .15s", flexShrink: 0,
                    }}
                    title={`Click to view ${node.name} details & verdict`}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isDone && <I.CheckCircle2 />}
                      {isRunning && <I.Loader />}
                      {isFailed && <I.AlertCircle />}
                      {!isDone && !isRunning && !isFailed && (
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--border)" }} />
                      )}
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: isSelected || isDone ? 700 : 500, color: isFailed ? "#dc2626" : "var(--text-1)" }}>
                      {node.name}
                    </span>
                    {node.duration && (
                      <span style={{ fontSize: 10.5, fontFamily: "JetBrains Mono, monospace", color: "var(--text-3)", marginLeft: 2 }}>
                        {node.duration}
                      </span>
                    )}
                  </div>

                  {/* Connector Line */}
                  {idx < cdNodes.length - 1 && (
                    <div style={{
                      flex: 1, height: 2, minWidth: 24,
                      background: isDone ? "#16a34a" : isRunning ? "var(--yellow)" : isFailed ? "#dc2626" : "var(--border)",
                      transition: "background .3s",
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── REAL-TIME STEP INSPECTOR & LIVE CONSOLE TERMINAL ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        {/* Step Inspector Panel */}
        <div style={{
          borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
          padding: 18, display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                Step Inspector: {selectedNode.name}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                background: selectedNode.verdict === "ACCEPTED" ? "var(--green-bg)" : selectedNode.verdict === "FAILED" ? "var(--red-bg)" : "var(--badge-bg)",
                color: selectedNode.verdict === "ACCEPTED" ? "var(--green)" : selectedNode.verdict === "FAILED" ? "var(--red)" : "var(--text-3)",
                border: `1px solid ${selectedNode.verdict === "ACCEPTED" ? "rgba(22, 163, 74, 0.3)" : selectedNode.verdict === "FAILED" ? "rgba(220, 38, 38, 0.3)" : "var(--border-soft)"}`,
              }}>
                {selectedNode.verdict || "PENDING"}
              </span>
            </div>

            <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--text-3)" }}>
              Phase: {selectedNode.phase}
            </span>
          </div>

          <div style={{
            padding: "12px 14px", borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border-soft)",
            fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5,
          }}>
            {selectedNode.detail || "Step queued. Waiting for execution runner in autonomous pipeline..."}
          </div>

          {selectedNode.rawJson && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 4, textTransform: "uppercase" }}>
                Step Payload &amp; Response (Raw JSON)
              </div>
              <pre style={{
                margin: 0, padding: "10px 12px", borderRadius: 8, background: "var(--bg-card2)", border: "1px solid var(--border-soft)",
                fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "var(--text-1)", maxHeight: 150, overflowY: "auto",
              }}>
                {selectedNode.rawJson}
              </pre>
            </div>
          )}
        </div>

        {/* Live Streaming Terminal Console */}
        <div style={{
          borderRadius: 12, background: "#0d1117", border: "1px solid #30363d",
          padding: 16, display: "flex", flexDirection: "column", height: 280,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: pipelineState.status === "running" ? "#238636" : "#8b949e" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#f0f6fc", fontFamily: "JetBrains Mono, monospace" }}>
                DEPLOYMENT_STDOUT.log
              </span>
            </div>

            <span style={{ fontSize: 11, color: "#8b949e", fontFamily: "JetBrains Mono, monospace" }}>
              {pipelineState.logs.length} events · SSE 2.5 Flash
            </span>
          </div>

          <div style={{
            flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4,
            fontSize: 11.5, fontFamily: "JetBrains Mono, monospace",
          }}>
            {pipelineState.logs.length === 0 ? (
              <div style={{ color: "#8b949e", padding: "20px 0" }}>
                Ready to stream execution. Launching runner...
              </div>
            ) : (
              pipelineState.logs.map(log => {
                const color = log.type === "success" || log.type === "gate"
                  ? "#3fb950"
                  : log.type === "error"
                  ? "#f85149"
                  : log.type === "warn"
                  ? "#d29922"
                  : "#58a6ff";

                return (
                  <div key={log.id} style={{ display: "flex", gap: 8, lineHeight: 1.45 }}>
                    <span style={{ color: "#8b949e", flexShrink: 0 }}>[{log.time}]</span>
                    <span style={{ color: color, flexShrink: 0 }}>[{log.type.toUpperCase()}]</span>
                    <span style={{ color: "#c9d1d9", wordBreak: "break-all" }}>{log.text}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
