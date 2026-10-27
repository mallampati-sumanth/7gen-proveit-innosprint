import React from "react";
import { Message, RepoItem, EC2InstanceItem, EnvTarget } from "../types";
import { I } from "../icons";
import { Bubble } from "../chat/ChatMessages";

export const AgentChatTab = ({
  user,
  githubProfile,
  repos,
  instances,
  selectedRepo,
  setSelectedRepo,
  selectedInstance,
  setSelectedInstance,
  target,
  setTarget,
  input,
  setInput,
  typing,
  send,
  msgs,
  bottomRef,
  setView,
  onOpenConnect,
}: {
  user: any;
  githubProfile: any;
  repos: RepoItem[];
  instances: EC2InstanceItem[];
  selectedRepo: string;
  setSelectedRepo: (r: string) => void;
  selectedInstance: string;
  setSelectedInstance: (i: string) => void;
  target: EnvTarget;
  setTarget: (t: EnvTarget) => void;
  input: string;
  setInput: (s: string) => void;
  typing: boolean;
  send: (text?: string, targetRepoParam?: string, targetEc2Param?: string, envParam?: EnvTarget) => void;
  msgs: Message[];
  bottomRef: React.RefObject<any>;
  setView: (v: string) => void;
  onOpenConnect: () => void;
}) => {
  return (
    <>
      <div style={{ padding: "16px 24px 0", flexShrink: 0 }}>
        {/* Compact Workflow Status Ribbon */}
        <div style={{
          marginBottom: 12, padding: "8px 16px", borderRadius: 10,
          background: "var(--bg-card)", border: "1px solid var(--border-soft)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>Authenticated:</span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>@{user?.username}</span>
            </div>

            <div style={{ width: 1, height: 14, background: "var(--border)" }} />

            <div
              onClick={onOpenConnect}
              style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
              title="Click to manage GitHub connection"
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: githubProfile?.connected ? "var(--green)" : "var(--yellow)" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>GitHub:</span>
              <span style={{ fontSize: 12, color: githubProfile?.connected ? "var(--text-2)" : "var(--orange)" }}>
                {githubProfile?.connected ? `@${githubProfile.username || githubProfile.login} (${repos.length} repos)` : "Connect Token ➔"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 980, background: "var(--green-bg)", color: "var(--green)" }}>
              AI Autonomous Agent Ready
            </span>
          </div>
        </div>

        {/* ─── PROMPT & DEPLOY HERO STATION ─── */}
        <div style={{
          padding: "18px 20px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.02em", margin: 0 }}>
                Autonomous Cloud Deployment Station
              </h2>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, margin: 0 }}>
                Choose your target parameters or prompt the AI agent. Deploys with live host handshakes, health checks, and ledger proofs.
              </p>
            </div>

            {/* Quick Links Toolbar */}
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { fn: () => setView("analyze"), icon: <I.Scan />, label: "Stack" },
                { fn: () => setView("repoenv"), icon: <I.Sliders />, label: ".env" },
                { fn: () => setView("ec2"), icon: <I.Server />, label: "Fleet" },
                { fn: () => setView("ledger"), icon: <I.Book />, label: "Ledger" }
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.fn}
                  style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 980,
                    background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-2)",
                    fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s",
                  }}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Selectors with Accessible htmlFor/id Linkages */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <label
                htmlFor="target-repo-select"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".04em" }}
              >
                Target GitHub Repository
              </label>
              <select
                id="target-repo-select"
                value={selectedRepo}
                onChange={e => setSelectedRepo(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                  fontSize: 13, outline: "none", cursor: "pointer",
                }}
              >
                {repos.length === 0 ? (
                  <option value="">No Repos Connected (Click GitHub to connect)</option>
                ) : (
                  repos.map(r => (
                    <option key={r.name} value={r.name}>
                      {r.name} ({r.language || r.framework || "App"})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="target-ec2-select"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".04em" }}
              >
                Target AWS EC2 Host
              </label>
              <select
                id="target-ec2-select"
                value={selectedInstance}
                onChange={e => setSelectedInstance(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                  fontSize: 13, outline: "none", cursor: "pointer",
                }}
              >
                <option value="NEW_INSTANCE">+ Provision New Free Tier EC2 Node in AWS</option>
                {instances.map(i => (
                  <option key={i.instance_id} value={i.instance_id}>
                    {i.name} - {i.public_ip} ({i.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="target-env-select"
                style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".04em" }}
              >
                Environment Target
              </label>
              <select
                id="target-env-select"
                value={target}
                onChange={e => setTarget(e.target.value as any)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 8,
                  background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                  fontSize: 13, outline: "none", cursor: "pointer",
                }}
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          {/* Primary Prompt Input & High-Contrast CTA */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label htmlFor="agent-prompt-input" className="sr-only" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}>
              Deployment Command
            </label>
            <input
              id="agent-prompt-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); }}
              placeholder={`Prompt: 'Deploy ${selectedRepo || "pallets/flask"} to EC2 in ${target} mode with .env injection'…`}
              style={{
                flex: 1, padding: "11px 14px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1.5px solid var(--border)",
                fontSize: 13, outline: "none",
              }}
            />
            <button
              onClick={() => send()}
              disabled={typing}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "11px 22px", borderRadius: 8,
                border: "none", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
                fontSize: 13, fontWeight: 700, cursor: typing ? "not-allowed" : "pointer", flexShrink: 0,
                opacity: typing ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                transition: "transform .18s, background .18s",
              }}
            >
              {typing ? <><I.Loader /> Deploying with AI…</> : <><I.Play /> Deploy to AWS</>}
            </button>
          </div>

          {/* 1-Click Prompt Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, letterSpacing: ".04em", textTransform: "uppercase" }}>Quick:</span>
            {[
              `Deploy ${selectedRepo || "pallets/flask"} to EC2 in ${target} environment`,
              `Run security scan and deploy ${selectedRepo || "flask"} with blast radius check`,
              `Inject custom .env and verify live EC2 health`,
            ].map(q => (
              <button
                key={q}
                onClick={() => send(q)}
                disabled={typing}
                style={{
                  padding: "4px 12px", borderRadius: 980, cursor: "pointer",
                  background: "var(--bg-card2)", border: "1px solid var(--border)",
                  color: "var(--text-2)", fontSize: 12, fontWeight: 500,
                  transition: "all .15s",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SCROLLABLE LIVE STREAM & MESSAGES AREA ─── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {msgs.map(m => <Bubble key={m.id} msg={m} />)}
        {typing && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10,
            background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--orange)", fontSize: 13, fontWeight: 600,
          }}>
            <I.Loader /> Type 4 Autonomous Agent streaming live ReAct tool steps to EC2 target…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </>
  );
};
