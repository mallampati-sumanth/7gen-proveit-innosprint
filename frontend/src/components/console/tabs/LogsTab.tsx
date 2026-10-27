import React, { useState, useEffect } from "react";
import { API_BASE } from "../types";

export const LogsTab = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/agent/logs`).then(r => r.json()).then(setLogs).catch(() => { });
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      <div style={{
        borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
        padding: "16px 20px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-2)", lineHeight: 2,
      }}>
        {logs.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ color: "var(--text-3)", width: 68, flexShrink: 0 }}>{l.timestamp}</span>
            <span style={{ color: l.color, width: 60, flexShrink: 0, fontWeight: 700 }}>[{l.level}]</span>
            <span style={{ color: "var(--text-1)" }}>{l.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
