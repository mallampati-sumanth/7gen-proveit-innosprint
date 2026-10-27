import React, { useState } from "react";
import { EC2InstanceItem, API_BASE } from "../types";
import { I } from "../icons";

export const EC2FleetTab = ({
  instances,
  onDeployToInstance,
  onRefresh,
  onOpenProvision,
}: {
  instances: EC2InstanceItem[];
  onDeployToInstance: (inst: EC2InstanceItem) => void;
  onRefresh: () => void | Promise<void>;
  onOpenProvision?: () => void;
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { status: string; message: string }>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newSshUser, setNewSshUser] = useState("ubuntu");
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [powerActionId, setPowerActionId] = useState<string | null>(null);
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const handlePowerAction = async (instId: string, action: "start" | "stop") => {
    setPowerActionId(instId);
    try {
      await fetch(`${API_BASE}/api/agent/ec2/instances/${instId}/${action}`, { method: "POST" });
      await onRefresh();
    } catch {}
    setPowerActionId(null);
  };

  const handleTerminate = async (inst: EC2InstanceItem) => {
    const isMock = inst.instance_id.startsWith("i-0a8f") || inst.instance_id.startsWith("i-0b7e");
    const promptMsg = isMock
      ? `Remove simulated node ${inst.name} (${inst.instance_id}) from fleet?`
      : `⚠️ PERMANENT AWS ACTION:\nAre you sure you want to terminate and permanently delete instance ${inst.name} (${inst.instance_id}) in AWS region ${inst.region}?\nThis action cannot be undone.`;
    if (!confirm(promptMsg)) return;

    setTerminatingId(inst.instance_id);
    try {
      await fetch(`${API_BASE}/api/agent/ec2/instances/${inst.instance_id}/terminate`, { method: "POST" });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || "Failed to terminate instance.");
    } finally {
      setTerminatingId(null);
    }
  };

  const testInstance = async (inst: EC2InstanceItem) => {
    setTestingId(inst.instance_id);
    try {
      const res = await fetch(`${API_BASE}/api/agent/ec2/instances/${inst.instance_id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult(p => ({
        ...p,
        [inst.instance_id]: {
          status: data.status || "HEALTHY",
          message: data.message || `${data.latency_ms}ms · SSH Port 22 OK`,
        }
      }));
    } catch {
      setTestResult(p => ({
        ...p,
        [inst.instance_id]: {
          status: "UNREACHABLE",
          message: "Failed to connect to EC2 port 22.",
        }
      }));
    }
    setTestingId(null);
  };

  const handleAddInstance = async () => {
    if (!newIp.trim()) return;
    setAdding(true);
    try {
      await fetch(`${API_BASE}/api/agent/ec2/instances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newInstanceName.trim() || `EC2-${newIp.trim()}`,
          public_ip: newIp.trim(),
          ssh_user: newSshUser.trim() || "ubuntu",
        }),
      });
      setNewInstanceName("");
      setNewIp("");
      setShowAdd(false);
      onRefresh();
    } catch { }
    setAdding(false);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      {/* Top Banner */}
      <div style={{
        marginBottom: 20, padding: "14px 20px", borderRadius: 12, background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Active AWS EC2 Fleet</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            Connected compute targets for autonomous container deployment & .env injection. Simulated nodes allow offline testing without AWS cost; use "Connect EC2 Instance" to attach a real AWS host.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={handleManualRefresh} disabled={refreshing} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
            fontSize: 12, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer",
          }}>
            {refreshing ? <><I.Loader /> Syncing AWS…</> : <><I.Refresh /> Refresh Fleet</>}
          </button>
          {onOpenProvision && (
            <button onClick={onOpenProvision} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
              border: "1px solid rgba(22, 163, 74, 0.4)", background: "rgba(22, 163, 74, 0.1)", color: "#16a34a",
              fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            }}>
              <I.Zap /> 1-Click Provision EC2
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "none", background: "var(--orange)", color: "#fff",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer",
          }}>
            <I.Plus /> Connect EC2 Instance
          </button>
        </div>
      </div>

      {/* Add Instance Form */}
      {showAdd && (
        <div style={{ marginBottom: 20, padding: 18, borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--orange-border)" }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 10 }}>Register New EC2 Instance</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              value={newInstanceName} onChange={e => setNewInstanceName(e.target.value)}
              placeholder="Instance Name (e.g. Production Web Host)"
              style={{ flex: 1, minWidth: 200, padding: "9px 14px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
            />
            <input
              value={newIp} onChange={e => setNewIp(e.target.value)}
              placeholder="Public IP or Host (e.g. 54.210.14.88)"
              style={{ flex: 1, minWidth: 180, padding: "9px 14px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none" }}
            />
            <input
              value={newSshUser} onChange={e => setNewSshUser(e.target.value)}
              placeholder="SSH User (default: ubuntu)"
              style={{ width: 140, padding: "9px 14px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, outline: "none" }}
            />
            <button onClick={handleAddInstance} disabled={adding} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--orange)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: adding ? "not-allowed" : "pointer" }}>
              {adding ? "Registering…" : "Register EC2"}
            </button>
            <button onClick={() => setShowAdd(false)} style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 13, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid of EC2 Instances */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {instances.map(inst => {
          const isMock = inst.instance_id.startsWith("i-0a8f") || inst.instance_id.startsWith("i-0b7e");
          const isRunning = inst.state.toLowerCase() === "running";
          const isStopped = inst.state.toLowerCase() === "stopped";
          const pingInfo = testResult[inst.instance_id];

          return (
            <div key={inst.instance_id} style={{
              borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
              padding: 20, display: "flex", flexDirection: "column", gap: 14,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>{inst.name}</span>
                    {isMock ? (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(234, 179, 8, 0.15)", color: "#d97706", border: "1px solid rgba(234, 179, 8, 0.3)" }} title="Offline mock node for sandbox unit testing">
                        SIMULATED NODE
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 4, background: "rgba(22, 163, 74, 0.15)", color: "#16a34a", border: "1px solid rgba(22, 163, 74, 0.3)" }} title="Active AWS EC2 node">
                        LIVE AWS NODE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
                    {inst.instance_id} · {inst.region}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                  background: isRunning ? "#16a34a" : isStopped ? "rgba(220, 38, 38, 0.15)" : "rgba(234, 179, 8, 0.15)",
                  color: isRunning ? "#ffffff" : isStopped ? "#dc2626" : "#d97706",
                  border: isRunning ? "none" : `1px solid ${isStopped ? "rgba(220,38,38,0.3)" : "rgba(234,179,8,0.3)"}`,
                }}>
                  {inst.state.toUpperCase()}
                </span>
              </div>

              <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border-soft)", fontSize: 12, fontFamily: "JetBrains Mono, monospace", display: "flex", flexDirection: "column", gap: 4 }}>
                <div><span style={{ color: "var(--text-3)" }}>Public IP: </span><strong style={{ color: "var(--orange)" }}>{inst.public_ip}</strong></div>
                <div><span style={{ color: "var(--text-3)" }}>Type: </span>{inst.instance_type}</div>
                <div><span style={{ color: "var(--text-3)" }}>SSH Target: </span>{inst.ssh_user}@{inst.public_ip}:22</div>
                <div><span style={{ color: "var(--text-3)" }}>Docker Engine: </span>{inst.docker_installed ? "Installed & Enabled" : "Missing"}</div>
              </div>

              {pingInfo && (
                <div style={{
                  fontSize: 11.5, fontFamily: "JetBrains Mono, monospace", padding: "7px 10px", borderRadius: 6,
                  background: pingInfo.status === "HEALTHY" ? "var(--green-bg)" : "var(--red-bg)",
                  color: pingInfo.status === "HEALTHY" ? "var(--green)" : "var(--red)",
                  border: `1px solid ${pingInfo.status === "HEALTHY" ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
                }}>
                  {pingInfo.message}
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: "auto" }}>
                <button onClick={() => testInstance(inst)} disabled={testingId === inst.instance_id} style={{
                  padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
                  background: "var(--bg-card2)", color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  {testingId === inst.instance_id ? <><I.Loader /> Ping…</> : <><I.Terminal /> Ping</>}
                </button>

                {isRunning ? (
                  <>
                    <button onClick={() => onDeployToInstance(inst)} style={{
                      flex: 1, minWidth: 80, padding: "8px 12px", borderRadius: 8, border: "none",
                      background: "var(--orange)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <I.Play /> Deploy
                    </button>
                    <button onClick={() => handlePowerAction(inst.instance_id, "stop")} disabled={powerActionId === inst.instance_id} style={{
                      padding: "8px 12px", borderRadius: 8, border: "1px solid var(--orange-border)",
                      background: "var(--orange-bg)", color: "var(--orange)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      {powerActionId === inst.instance_id ? <><I.Loader /> Stopping…</> : "Stop Node"}
                    </button>
                  </>
                ) : isStopped ? (
                  <button onClick={() => handlePowerAction(inst.instance_id, "start")} disabled={powerActionId === inst.instance_id} style={{
                    flex: 1, minWidth: 100, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--green)",
                    background: "var(--green-bg)", color: "var(--green)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    {powerActionId === inst.instance_id ? <><I.Loader /> Starting…</> : <><I.Play /> Start Node</>}
                  </button>
                ) : (
                  <button disabled style={{
                    flex: 1, minWidth: 100, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--bg-input)", color: "var(--text-3)", fontSize: 12, fontWeight: 600,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                    <I.Loader /> Updating…
                  </button>
                )}

                <button
                  onClick={() => handleTerminate(inst)}
                  disabled={terminatingId === inst.instance_id}
                  title="Terminate & Delete EC2 Node"
                  style={{
                    padding: "8px 10px", borderRadius: 8,
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    background: "rgba(239, 68, 68, 0.08)",
                    color: "var(--red)",
                    fontSize: 12, fontWeight: 700, cursor: terminatingId === inst.instance_id ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}
                >
                  {terminatingId === inst.instance_id ? <I.Loader /> : <I.Trash />}
                  <span style={{ fontSize: 11 }}>Terminate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
