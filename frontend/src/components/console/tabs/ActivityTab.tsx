import React, { useState, useEffect } from "react";
import { API_BASE } from "../types";
import { I } from "../icons";

export const ActivityTab = ({ onDeployClick }: { onDeployClick: () => void }) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRuns = () => {
    setLoading(true);
    fetch(`${API_BASE}/api/agent/runs`)
      .then(r => r.json())
      .then(d => setRuns(d || []))
      .catch(() => setRuns([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRuns();
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      <div style={{
        marginBottom: 20, padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>Deployment Execution History</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
            Real-time audit log of autonomous runs persisted in database
          </div>
        </div>
        <button onClick={loadRuns} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
          fontSize: 12, fontWeight: 600, cursor: "pointer",
        }}>
          <I.Refresh /> Refresh Runs
        </button>
      </div>

      {runs.length === 0 ? (
        <div style={{
          padding: "60px 20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
          textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
            <I.Activity />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>No Deployment Runs Yet</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", maxWidth: 440 }}>
            No autonomous deployment runs have been recorded in the database yet. Launch a deployment from the Autonomous Agent tab to track runs here.
          </div>
          <button onClick={onDeployClick} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8,
            border: "none", background: "var(--orange)", color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer", marginTop: 4,
          }}>
            <I.Play /> Launch First Deployment
          </button>
        </div>
      ) : (
        <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "130px 1.8fr 1.5fr 110px 110px", padding: "12px 18px", borderBottom: "1px solid var(--border)", background: "var(--badge-bg)", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
            <span>Run ID</span>
            <span>Target Repository</span>
            <span>Compute Host</span>
            <span>Status</span>
            <span style={{ textAlign: "right" }}>Timestamp</span>
          </div>
          {runs.map(r => (
            <div key={r.run_id} style={{ display: "grid", gridTemplateColumns: "130px 1.8fr 1.5fr 110px 110px", padding: "14px 18px", borderBottom: "1px solid var(--border-soft)", alignItems: "center" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, color: "var(--orange)", fontWeight: 700 }}>{r.run_id}</span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 13, color: "var(--text-1)", fontWeight: 600 }}>{r.target_repo}</span>
              <span style={{ fontSize: 12, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>{r.target_ec2}</span>
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4, display: "inline-block", width: "fit-content",
                background: r.status === "PROVEN" || r.status === "HEALED" ? "var(--green-bg)" : "var(--orange-bg)",
                color: r.status === "PROVEN" || r.status === "HEALED" ? "var(--green)" : "var(--orange)",
              }}>
                {r.status}
              </span>
              <span style={{ fontSize: 11, color: "var(--text-3)", textAlign: "right" }}>{r.created_at ? r.created_at.slice(11, 19) : "Just now"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
