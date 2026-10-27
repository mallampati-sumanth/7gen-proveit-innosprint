import React from "react";
import { I } from "./icons";

export const NAV = [
  {
    section: "DEPLOYMENT AGENT", items: [
      { id: "chat", icon: <I.Bot />, label: "Autonomous Agent", badge: "Live SSE" },
      { id: "voice", icon: <I.Phone />, label: "Sarvam AI VoiceOps", badge: "Phone Call" },
      { id: "repos", icon: <I.Github />, label: "GitHub Repositories" },
      { id: "repoenv", icon: <I.Sliders />, label: "Repo .env Injector", badge: "Per-Repo" },
      { id: "ec2", icon: <I.Server />, label: "EC2 Instances Fleet", badge: "Target" },
    ]
  },
  {
    section: "CLOUD & VAULT", items: [
      { id: "analyze", icon: <I.Scan />, label: "Repo Manifest Analyzer" },
      { id: "infra", icon: <I.Cloud />, label: "AWS Topology" },
      { id: "secrets", icon: <I.Key />, label: "AWS & GitHub Vault" },
    ]
  },
  {
    section: "AUDIT & TELEMETRY", items: [
      { id: "benchmark", icon: <I.Zap />, label: "Benchmark Suite", badge: "LLM vs Proof" },
      { id: "logs", icon: <I.Terminal />, label: "Diagnostic Logs", badge: "Live" },
      { id: "activity", icon: <I.Activity />, label: "Run History" },
      { id: "ledger", icon: <I.Book />, label: "Proof Ledger", badge: "SHA-256" },
      { id: "settings", icon: <I.Settings />, label: "Settings" },
    ]
  },
];

export const Sidebar = ({
  view,
  setView,
  selectedInstance,
}: {
  view: string;
  setView: (v: string) => void;
  selectedInstance: string;
}) => {
  return (
    <aside style={{
      width: 232, flexShrink: 0, display: "flex", flexDirection: "column",
      background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-soft)",
    }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {NAV.map(group => (
          <div key={group.section} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 10.5, fontWeight: 600, letterSpacing: ".1em",
              color: "var(--sidebar-section)", padding: "4px 10px 6px", textTransform: "uppercase",
            }}>
              {group.section}
            </div>
            {group.items.map(item => {
              const active = view === item.id;
              return (
                <button key={item.id} onClick={() => setView(item.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: "7px 10px", borderRadius: 8, cursor: "pointer", border: "none",
                  background: active ? "var(--bg-sidebar-active)" : "transparent",
                  color: active ? "var(--text-1)" : "var(--text-3)",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  letterSpacing: "-.01em",
                  transition: "background .15s, color .15s", marginBottom: 1,
                }}>
                  <span style={{ display: "flex", alignItems: "center", opacity: active ? 1 : 0.7 }}>{item.icon}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 600, padding: "2px 6px", borderRadius: 980,
                      background: active ? "rgba(22,163,74,0.1)" : "var(--bg-card2)",
                      color: active ? "#16a34a" : "var(--text-4)",
                      border: `1px solid ${active ? "rgba(22,163,74,0.2)" : "var(--border-soft)"}`,
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar footer */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--border-soft)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--green)", fontWeight: 500 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulseDot 2s infinite" }} />
            FastAPI Online
          </div>
          <div style={{ fontSize: 10.5, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace", letterSpacing: 0 }}>us-east-1</div>
        </div>
        <div style={{ fontSize: 10.5, color: "var(--text-4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>EC2 Target</span>
          <span style={{ color: "var(--text-2)", fontFamily: "JetBrains Mono, monospace", fontWeight: 500, fontSize: 10.5, letterSpacing: 0 }}>
            {selectedInstance ? selectedInstance.slice(0, 14) + "…" : "AWS EC2"}
          </span>
        </div>
      </div>
    </aside>
  );
};
