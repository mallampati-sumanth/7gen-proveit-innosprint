import React, { useState, useEffect } from "react";
import { API_BASE } from "../types";
import { I } from "../icons";

export const EC2ProvisionWizardModal = ({
  open,
  onClose,
  context,
  onProvisionSuccess,
  onDeployNow,
}: {
  open: boolean;
  onClose: () => void;
  context?: {
    name?: string;
    target_repo?: string;
    app_port?: number;
    framework?: string;
    instance_type?: string;
    region?: string;
  };
  onProvisionSuccess: (newInst: any) => void;
  onDeployNow?: (repo: string, instId: string) => void;
}) => {
  const [stage, setStage] = useState<"config" | "streaming" | "done">("config");
  const [instanceName, setInstanceName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [appPort, setAppPort] = useState(5000);
  const [customizing, setCustomizing] = useState(false);
  const [streamLogs, setStreamLogs] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [provisionedInst, setProvisionedInst] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStage("config");
      setInstanceName(context?.name || `Host-${context?.target_repo?.split("/").pop() || "WebNode"}`);
      setRegion(context?.region || "us-east-1");
      setInstanceType(context?.instance_type || "t3.micro");
      setAppPort(context?.app_port || 5000);
      setCustomizing(false);
      setStreamLogs([]);
      setCurrentStage(1);
      setProvisionedInst(null);
      setError(null);
    }
  }, [open, context]);

  if (!open) return null;

  const handleStartProvision = async () => {
    setError(null);
    setStage("streaming");
    setStreamLogs([
      { stage: 1, title: "IAM & Security Group Verification", log: `Verifying or provisioning proveit-sandbox-sg (Port 22 & ${appPort})...`, status: "RUNNING", ts: "00:01" }
    ]);

    try {
      const res = await fetch(`${API_BASE}/api/agent/ec2/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: instanceName,
          instance_type: instanceType,
          region: region,
          app_port: appPort,
          target_repo: context?.target_repo,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to initiate EC2 provisioning job.");
      }

      const data = await res.json();
      const eventSource = new EventSource(`${API_BASE}${data.stream_url}`);

      eventSource.onmessage = (e) => {
        try {
          const chunk = JSON.parse(e.data);
          setCurrentStage(chunk.stage || 1);
          setStreamLogs(prev => {
            const filtered = prev.filter(p => p.stage !== chunk.stage);
            return [...filtered, { ...chunk, ts: new Date().toLocaleTimeString().split(" ")[0] }];
          });

          if (chunk.stage === 5 && chunk.status === "COMPLETED") {
            setProvisionedInst(chunk.instance);
            setStage("done");
            eventSource.close();
            onProvisionSuccess(chunk.instance);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        eventSource.close();
      };
    } catch (err: any) {
      setError(err.message || "Failed to launch EC2 instance.");
      setStage("config");
    }
  };

  const STAGES = [
    { num: 1, label: "Security Group & IAM Check" },
    { num: 2, label: "Boto3 API Dispatch" },
    { num: 3, label: "IP Allocation & State Check" },
    { num: 4, label: "Deploy Key & Docker Cloud-Init" },
    { num: 5, label: "Fleet Registration" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 20, backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 620, background: "var(--bg-card)",
        border: "1px solid var(--border)", borderRadius: 16,
        padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16,
        boxShadow: "0 20px 40px rgba(0,0,0,0.3)", maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
                {stage === "config" ? " Launch AWS EC2 Instance" : " AWS EC2 Boot-Up Audit Trail"}
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(22, 163, 74, 0.15)", color: "#16a34a", border: "1px solid rgba(22, 163, 74, 0.3)" }}>
                AWS FREE TIER (t3.micro)
              </span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              {stage === "config"
                ? `Auto-sized from repo analysis (${context?.framework || "Web Service"}, Port ${appPort})`
                : "Real-time SSE audit trail streaming cloud-init and host initialization"}
            </div>
          </div>
          {stage !== "streaming" && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><I.X /></button>
          )}
        </div>

        {error && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--red-bg)", border: "1px solid var(--red)", color: "var(--red)", fontSize: 12.5 }}>
            {error}
          </div>
        )}

        {/* STAGE 1: TRANSPARENT CONFIGURATION REVIEW */}
        {stage === "config" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Recommended Settings Card */}
            <div style={{
              padding: "16px 18px", borderRadius: 12, background: "var(--bg-card2)",
              border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", gap: 6 }}>
                <I.Zap /> Recommended Configuration (AWS Free Tier Eligible)
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12.5 }}>
                <div><span style={{ color: "var(--text-3)" }}>Region: </span><strong>{region} (N. Virginia)</strong></div>
                <div><span style={{ color: "var(--text-3)" }}>Instance Type: </span><strong style={{ color: "var(--green)" }}>{instanceType} (2 vCPU, 1 GB RAM)</strong></div>
                <div><span style={{ color: "var(--text-3)" }}>OS Image: </span><strong>Amazon Linux 2023</strong></div>
                <div><span style={{ color: "var(--text-3)" }}>Open Ports: </span><strong>22 (SSH) + {appPort} (App Traffic)</strong></div>
                <div><span style={{ color: "var(--text-3)" }}>Firewall: </span><strong>proveit-sandbox-sg</strong></div>
                <div><span style={{ color: "var(--text-3)" }}>Bootstrap: </span><strong>Docker v26.1 + Compose v2.27</strong></div>
              </div>

              <div style={{ fontSize: 11.5, color: "var(--text-3)", borderTop: "1px solid var(--border-soft)", paddingTop: 8 }}>
                 <strong>Zero-Setup Deploy Key:</strong> ProveIt injects a self-contained in-memory SSH deploy key via cloud-init. No pre-existing AWS key pairs required.
              </div>
            </div>

            {/* Customization Accordion */}
            <div>
              <button
                onClick={() => setCustomizing(!customizing)}
                style={{
                  background: "transparent", border: "none", color: "var(--text-2)", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0,
                }}
              >
                <span>{customizing ? "▼ Hide Custom Settings" : "▶ Customize Settings (Optional)"}</span>
              </button>

              {customizing && (
                <div style={{
                  marginTop: 10, padding: 14, borderRadius: 10, background: "var(--bg-input)",
                  border: "1px solid var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Instance Name</label>
                    <input
                      value={instanceName} onChange={e => setInstanceName(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12.5 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 4 }}>AWS Region</label>
                    <select
                      value={region} onChange={e => setRegion(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12.5 }}
                    >
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Instance Sizing (Locked to Free Tier)</label>
                    <select
                      value={instanceType} onChange={e => setInstanceType(e.target.value)}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12.5 }}
                    >
                      <option value="t3.micro">t3.micro (Free Tier · 2 vCPU, 1GB RAM)</option>
                      <option value="t2.micro">t2.micro (Free Tier · 1 vCPU, 1GB RAM)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Application Port</label>
                    <input
                      type="number" value={appPort} onChange={e => setAppPort(Number(e.target.value))}
                      style={{ width: "100%", padding: "7px 10px", borderRadius: 6, background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12.5 }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button onClick={onClose} style={{
                padding: "10px 18px", borderRadius: 8, border: "1px solid var(--border)",
                background: "transparent", color: "var(--text-2)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                Cancel
              </button>
              <button onClick={handleStartProvision} style={{
                padding: "10px 24px", borderRadius: 8, border: "none",
                background: "var(--orange)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 7,
              }}>
                <I.Zap /> Continue with Recommended Settings
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: LIVE AUDIT TRAIL STREAM */}
        {(stage === "streaming" || stage === "done") && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Step Checkpoints */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6, padding: "10px 0" }}>
              {STAGES.map(s => {
                const isPassed = currentStage > s.num || stage === "done";
                const isCurrent = currentStage === s.num && stage === "streaming";
                return (
                  <div key={s.num} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, textAlign: "center" }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: isPassed ? "var(--green-bg)" : isCurrent ? "var(--orange-bg)" : "var(--badge-bg)",
                      color: isPassed ? "var(--green)" : isCurrent ? "var(--orange)" : "var(--text-3)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                      border: `1px solid ${isPassed ? "var(--green)" : isCurrent ? "var(--orange)" : "var(--border)"}`,
                    }}>
                      {isPassed ? <I.Check /> : isCurrent ? <I.Loader /> : s.num}
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: isCurrent ? 700 : 500, color: isPassed ? "var(--text-1)" : "var(--text-3)", lineHeight: 1.2 }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Real-time Streaming Logs Terminal */}
            <div style={{
              borderRadius: 10, background: "var(--bg-app)", border: "1px solid var(--border)",
              padding: "14px 16px", fontFamily: "JetBrains Mono, monospace", fontSize: 11.5,
              display: "flex", flexDirection: "column", gap: 8, minHeight: 160, maxHeight: 220, overflowY: "auto",
            }}>
              {streamLogs.map((l, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <span style={{ color: "var(--text-3)", flexShrink: 0 }}>[{l.ts || "LIVE"}]</span>
                  <span style={{ color: l.status === "COMPLETED" ? "var(--green)" : "var(--orange)", fontWeight: 700, flexShrink: 0 }}>
                    {l.status === "COMPLETED" ? "[DONE]" : "[AUDIT]"}
                  </span>
                  <span style={{ color: "var(--text-1)" }}>{l.log}</span>
                </div>
              ))}
              {stage === "streaming" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--orange)", fontStyle: "italic", marginTop: 4 }}>
                  <I.Loader /> Streaming live AWS execution telemetry…
                </div>
              )}
            </div>

            {/* Completion View */}
            {stage === "done" && provisionedInst && (
              <div style={{
                padding: "14px 18px", borderRadius: 10, background: "var(--green-bg)",
                border: "1px solid rgba(22, 163, 74, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
                     EC2 Instance Successfully Launched & Online!
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--text-2)", marginTop: 2, fontFamily: "JetBrains Mono, monospace" }}>
                    ID: {provisionedInst.instance_id} · Public IP: <strong>{provisionedInst.public_ip}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={onClose} style={{
                    padding: "8px 14px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--bg-card)", color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  }}>
                    View in Fleet
                  </button>
                  {context?.target_repo && onDeployNow && (
                    <button
                      onClick={() => {
                        onClose();
                        onDeployNow(context.target_repo!, provisionedInst.instance_id);
                      }}
                      style={{
                        padding: "8px 18px", borderRadius: 8, border: "none",
                        background: "var(--orange)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                       Deploy {context.target_repo.split("/").pop()} Now ➔
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
