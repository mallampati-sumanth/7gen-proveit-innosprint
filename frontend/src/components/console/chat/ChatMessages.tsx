import React, { useState } from "react";
import { Step, Message } from "../types";
import { I } from "../icons";

export const StepList = ({ steps }: { steps: Step[] }) => {
  const [openRawId, setOpenRawId] = useState<string | null>(null);

  return (
    <div style={{ marginTop: 14, padding: "14px 16px", borderRadius: 12, background: "var(--bg-card2)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>Autonomous Deployment Stages</span>
        <span>{steps.filter(s => s.status === "done").length} of {steps.length} Verified</span>
      </div>

      {steps.map(st => {
        const isRunning = st.status === "running";
        const isDone = st.status === "done";
        const isError = st.status === "error";

        return (
          <div key={st.id} style={{
            padding: "10px 12px", borderRadius: 8,
            background: isRunning ? "rgba(249, 115, 22, 0.06)" : (isDone ? "rgba(34, 197, 94, 0.04)" : "transparent"),
            border: `1px solid ${isRunning ? "var(--orange-border)" : (isDone ? "rgba(34, 197, 94, 0.2)" : "var(--border)")}`,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: isDone ? "var(--green-bg)" : (isRunning ? "var(--orange-bg)" : "var(--badge-bg)"),
                  color: isDone ? "var(--green)" : (isRunning ? "var(--orange)" : "var(--text-3)"),
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {isDone ? <I.Check /> : (isRunning ? <I.Loader /> : (isError ? <I.X /> : <I.Circle />))}
                </div>
                <div style={{ fontSize: 13, fontWeight: isRunning ? 700 : 600, color: isDone ? "var(--text-1)" : (isRunning ? "var(--orange)" : "var(--text-2)") }}>
                  {st.label}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {st.rawJson && (
                  <button
                    onClick={() => setOpenRawId(openRawId === st.id ? null : st.id)}
                    style={{
                      background: "transparent", border: "1px solid var(--border)", borderRadius: 4,
                      padding: "2px 7px", fontSize: 10, color: "var(--text-3)", cursor: "pointer",
                    }}
                  >
                    {openRawId === st.id ? "Hide JSON" : "Raw JSON"}
                  </button>
                )}
                {st.ts && (
                  <span style={{ fontSize: 10.5, color: isDone ? "var(--green)" : "var(--text-3)", fontWeight: 600 }}>
                    {st.ts}
                  </span>
                )}
              </div>
            </div>

            {st.detail && (
              <div style={{ fontSize: 12, color: isDone ? "var(--text-2)" : "var(--text-3)", paddingLeft: 30, lineHeight: 1.5 }}>
                {st.detail}
              </div>
            )}

            {openRawId === st.id && st.rawJson && (
              <pre style={{
                margin: "4px 0 0 30px", padding: "8px 10px", borderRadius: 6,
                background: "var(--bg-app)", border: "1px solid var(--border)",
                fontSize: 10.5, color: "var(--text-3)", overflowX: "auto", fontFamily: "JetBrains Mono, monospace"
              }}>
                {st.rawJson}
              </pre>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const Bubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 12, flexDirection: isUser ? "row-reverse" : "row", animation: "fadeSlide .2s ease-out" }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "#0a0a0a" : "rgba(22, 163, 74, 0.1)",
        border: `1px solid ${isUser ? "#0a0a0a" : "rgba(22, 163, 74, 0.2)"}`,
        color: isUser ? "#ffffff" : "#16a34a",
      }}>
        {isUser ? <I.User /> : <I.Bot />}
      </div>
      <div style={{ maxWidth: "80%", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexDirection: isUser ? "row-reverse" : "row" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{isUser ? "You" : (msg.meta ?? "ProveIt Agent")}</span>
          {msg.timestamp && <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{msg.timestamp}</span>}
        </div>
        <div style={{
          padding: "16px 20px", borderRadius: 16,
          background: isUser ? "#0a0a0a" : "var(--bg-card)",
          border: `1px solid ${isUser ? "#0a0a0a" : "var(--border)"}`,
          boxShadow: isUser ? "0 2px 8px rgba(0,0,0,0.1)" : "0 2px 8px rgba(0,0,0,0.03)",
          color: isUser ? "#ffffff" : "var(--text-1)", fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
        }}>
          {msg.thought && (
            <div style={{
              marginBottom: 10, padding: "9px 12px", borderRadius: 8,
              background: "var(--orange-bg)", border: "1px solid var(--orange-border)",
              fontSize: 12, color: "var(--text-1)", lineHeight: 1.5,
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--orange)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 3, display: "flex", alignItems: "center", gap: 5 }}>
                <I.Zap /> AI Autonomous Reasoning
              </div>
              {msg.thought}
            </div>
          )}
          {msg.text}
          {msg.proofHash && (
            <div style={{
              marginTop: 14, padding: "14px 18px", borderRadius: 12,
              background: "rgba(22, 163, 74, 0.08)", border: "1px solid rgba(22, 163, 74, 0.3)",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)", display: "flex", alignItems: "center", gap: 6 }}>
                  <I.Check /> Autonomous Deployment Verified & Sealed
                </span>
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, background: "rgba(22,163,74,0.15)", color: "#16a34a", padding: "3px 8px", borderRadius: 4, fontWeight: 700 }}>
                  Proof #{msg.proofHash}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.5 }}>
                Deterministic safety gates passed. Container deployed on EC2 host. Live HTTP 200 OK health check verified. Signed SHA-256 proof committed to tamper-evident ledger.
              </div>
              {msg.appUrl && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-card)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 600 }}>Active Endpoint:</span>
                  <a href={msg.appUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)", display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}>
                    {msg.appUrl} <I.ExternalLink />
                  </a>
                </div>
              )}
            </div>
          )}
          {!msg.proofHash && msg.appUrl && (
            <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "var(--bg-card2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Active on EC2:</span>
              <a href={msg.appUrl} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--orange)", fontSize: 12.5, fontWeight: 700, textDecoration: "none" }}>
                {msg.appUrl} <I.ExternalLink />
              </a>
            </div>
          )}
        </div>
        {msg.steps && msg.steps.length > 0 && <StepList steps={msg.steps} />}
      </div>
    </div>
  );
};
