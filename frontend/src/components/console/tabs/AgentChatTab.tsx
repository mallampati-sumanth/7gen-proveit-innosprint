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
      <div style={{ padding: "16px 32px 0", flexShrink: 0 }}>
        {/* ─── 3-STEP WORKFLOW PROGRESS BAR ─── */}
        <div style={{
          marginBottom: 14, padding: "12px 20px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border-soft)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          {/* Step 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "rgba(22,163,74,0.1)", color: "#16a34a",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid rgba(22,163,74,0.2)",
            }}>
              <I.Check />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-.01em" }}>Step 1: Authenticated</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 300 }}>
                @{user?.username} ({user?.email})
              </div>
            </div>
          </div>

          <div style={{ width: 28, height: 1, background: "var(--border-soft)" }} />

          {/* Step 2 */}
          <div
            onClick={onOpenConnect}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: githubProfile?.connected ? "rgba(22,163,74,0.1)" : "var(--bg-card2)",
              color: githubProfile?.connected ? "#16a34a" : "var(--text-3)",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11,
              border: `1px solid ${githubProfile?.connected ? "rgba(22,163,74,0.2)" : "var(--border-soft)"}`,
            }}>
              {githubProfile?.connected ? <I.Check /> : "2"}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-.01em" }}>Step 2: GitHub</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 300 }}>
                {githubProfile?.connected ? `@${githubProfile.username || githubProfile.login} · ${repos.length} repos` : "Click to connect token"}
              </div>
            </div>
          </div>

          <div style={{ width: 28, height: 1, background: "var(--border-soft)" }} />

          {/* Step 3 */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: "#0a0a0a", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: 11,
            }}>
              3
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-.01em" }}>Step 3: Prompt &amp; Deploy</div>
              <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 500 }}>AI Autonomous Agent</div>
            </div>
          </div>
        </div>

        {/* ─── PROMPT & DEPLOY HERO STATION ─── */}
        <div style={{
          padding: "18px 22px", borderRadius: 14,
          background: "var(--bg-card)", border: "1px solid var(--border-soft)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.02em" }}>
                Autonomous AWS Cloud Deployment Station
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                Enter your deployment prompt or choose target parameters. The AI agent autonomously inspects, verifies, and deploys.
              </div>
            </div>

            {/* Quick links */}
            <div style={{ display: "flex", gap: 6 }}>
              {[
                { fn: () => setView("analyze"), icon: <I.Scan />, label: "Scan Stack" },
                { fn: () => setView("repoenv"), icon: <I.Sliders />, label: "Inject .env" },
                { fn: () => setView("ec2"), icon: <I.Server />, label: "EC2 Fleet" },
                { fn: () => setView("ledger"), icon: <I.Book />, label: "Ledger" }
              ].map(btn => (
                <button key={btn.label} onClick={btn.fn} style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 980,
                  background: "transparent", border: "1.5px solid var(--border)", color: "var(--text-2)",
                  fontSize: 11.5, fontWeight: 400, cursor: "pointer", letterSpacing: "-.01em",
                  transition: "border-color .15s, color .15s",
                }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".04em" }}>
                Target GitHub Repository
              </label>
              <select
                value={selectedRepo}
                onChange={e => setSelectedRepo(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border-soft)",
                  fontSize: 12.5, outline: "none", cursor: "pointer", letterSpacing: "-.01em",
                }}
              >
                {repos.length === 0 ? (
                  <option value="">No Repos Connected (Click Step 2)</option>
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
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".04em" }}>
                Target AWS EC2 Host
              </label>
              <select
                value={selectedInstance}
                onChange={e => setSelectedInstance(e.target.value)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border-soft)",
                  fontSize: 12.5, outline: "none", cursor: "pointer", letterSpacing: "-.01em",
                }}
              >
                <option value="NEW_INSTANCE"> + Launch &amp; Provision New EC2 Node in AWS</option>
                {instances.map(i => (
                  <option key={i.instance_id} value={i.instance_id}>
                    {i.name} - {i.public_ip} ({i.state})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", marginBottom: 5, display: "block", textTransform: "uppercase", letterSpacing: ".04em" }}>
                Environment
              </label>
              <select
                value={target}
                onChange={e => setTarget(e.target.value as any)}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  background: "var(--bg-card)", color: "var(--text-1)", border: "1px solid var(--border-soft)",
                  fontSize: 12.5, outline: "none", cursor: "pointer", letterSpacing: "-.01em",
                }}
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          {/* Primary Prompt Input */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") send(); }}
              placeholder={`Prompt: 'Deploy ${selectedRepo || "pallets/flask"} to EC2 in ${target} mode with .env injection'…`}
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1.5px solid var(--border-soft)",
                fontSize: 13, outline: "none", letterSpacing: "-.01em",
                transition: "border-color .15s",
              }}
            />
            <button
              onClick={() => send()}
              disabled={typing}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: 980,
                border: "none", background: "#0a0a0a", color: "#fff",
                fontSize: 13, fontWeight: 600, cursor: typing ? "not-allowed" : "pointer", flexShrink: 0,
                opacity: typing ? 0.6 : 1,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s",
              }}
            >
              {typing ? <><I.Loader /> Deploying with AI…</> : <><I.Play /> Deploy to AWS</>}
            </button>
          </div>

          {/* 1-Click Prompt Chips */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
            <span style={{ fontSize: 10.5, color: "var(--text-4)", fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase" }}>Quick:</span>
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
                  padding: "4px 11px", borderRadius: 980, cursor: "pointer",
                  background: "transparent", border: "1.5px solid var(--border)",
                  color: "var(--text-3)", fontSize: 11, fontWeight: 400, letterSpacing: "-.01em",
                  transition: "border-color .15s, color .15s",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SCROLLABLE LIVE STREAM & MESSAGES AREA ─── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 32px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {msgs.map(m => <Bubble key={m.id} msg={m} />)}
        {typing && (
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10,
            background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--orange)", fontSize: 12.5, fontWeight: 600,
          }}>
            <I.Loader /> Type 4 Autonomous Agent streaming live ReAct tool steps to EC2 target…
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </>
  );
};
