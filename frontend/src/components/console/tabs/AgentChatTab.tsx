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
  onInjectEnv,
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
  onInjectEnv?: (repo: string) => void;
}) => {
  const activeRepo = repos.find(r => r.name === selectedRepo || r.repo_name === selectedRepo) || repos[0];
  const activeInstance = instances.find(i => i.instance_id === selectedInstance) || instances[0];
  const isConnected = !!githubProfile?.connected;
  const username = githubProfile?.username || githubProfile?.login || user?.username || "developer";
  const displayName = githubProfile?.name || username;

  const handleAskQuestion = (q?: string) => {
    const questionText = q || input;
    if (!questionText.trim() || typing) return;
    send(questionText);
  };

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      overflowY: "auto", minHeight: 0, padding: "20px 24px 28px",
      gap: 20, background: "var(--bg-main)",
      scrollBehavior: "smooth",
    }}>
      {/* ─── TOP SECTION: GITHUB PROFILE & ARCHITECTURE STATISTICS ─── */}
      <div style={{
        padding: "20px 22px", borderRadius: 12,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: 16,
      }}>
        {/* Profile Identity & Navigation Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              {githubProfile?.avatar_url ? (
                <img
                  src={githubProfile.avatar_url}
                  alt={username}
                  style={{
                    width: 48, height: 48, borderRadius: "50%",
                    border: "2px solid var(--border)", objectFit: "cover",
                  }}
                />
              ) : (
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: "var(--bg-card2)", border: "1px solid var(--border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-1)",
                }}>
                  <I.Github />
                </div>
              )}
              <div
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 12, height: 12, borderRadius: "50%",
                  background: isConnected ? "var(--green)" : "var(--yellow)",
                  border: "2px solid var(--bg-card)",
                }}
                title={isConnected ? "GitHub Connected" : "Token Connection Required"}
              />
            </div>

            {/* User Info */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.02em" }}>
                  {displayName}
                </span>
                <a
                  href={githubProfile?.html_url || `https://github.com/${username}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: 12.5, color: "var(--text-3)", textDecoration: "none",
                    display: "inline-flex", alignItems: "center", gap: 3, fontWeight: 500,
                  }}
                >
                  @{username} <I.ExternalLink />
                </a>
                <span style={{
                  fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 980,
                  background: isConnected ? "var(--green-bg)" : "var(--orange-bg)",
                  color: isConnected ? "var(--green)" : "var(--orange)",
                  border: isConnected ? "1px solid rgba(22,163,74,0.2)" : "1px solid rgba(245,158,11,0.2)",
                }}>
                  {isConnected ? "PAT Connected" : "Connect PAT"}
                </span>
              </div>

              <div style={{ fontSize: 12.5, color: "var(--text-2)", marginTop: 4 }}>
                {githubProfile?.bio ? (
                  <span>{githubProfile.bio}</span>
                ) : (
                  <span style={{ color: "var(--text-3)" }}>
                    Connected GitHub account for automated multi-stack AWS cloud deployment and telemetry.
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              onClick={onOpenConnect}
              style={{
                display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 980,
                background: isConnected ? "var(--bg-card2)" : "var(--orange-bg)",
                border: "1px solid var(--border)", color: isConnected ? "var(--text-2)" : "var(--orange)",
                fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s",
              }}
              title="Manage GitHub Token"
            >
              <I.Github /> {isConnected ? "Sync / PAT" : "Connect GitHub"}
            </button>
            {[
              { fn: () => setView("pipeline"), icon: <I.Activity />, label: "Pipeline" },
              { fn: () => setView("repos"), icon: <I.GitBranch />, label: "All Repos" },
              { fn: () => setView("analyze"), icon: <I.Scan />, label: "Stack" },
              { fn: () => { if (onInjectEnv && selectedRepo) onInjectEnv(selectedRepo); else setView("repoenv"); }, icon: <I.Sliders />, label: ".env" },
              { fn: () => setView("ec2"), icon: <I.Server />, label: "Fleet" },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.fn}
                style={{
                  display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 980,
                  background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--text-2)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s",
                }}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4-Card Statistics Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12, paddingTop: 4,
        }}>
          {/* Stat 1: Repositories */}
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "var(--bg-card2)", border: "1px solid var(--border-soft)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8, background: "rgba(59, 130, 246, 0.1)",
              color: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.GitBranch />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>
                {githubProfile?.public_repos ?? repos.length}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>
                GitHub Repositories
              </div>
            </div>
          </div>

          {/* Stat 2: Followers */}
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "var(--bg-card2)", border: "1px solid var(--border-soft)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8, background: "rgba(168, 85, 247, 0.1)",
              color: "#a855f7", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.User />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>
                {githubProfile?.followers ?? 0}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>
                GitHub Followers
              </div>
            </div>
          </div>

          {/* Stat 3: EC2 Fleet Nodes */}
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "var(--bg-card2)", border: "1px solid var(--border-soft)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8, background: "rgba(22, 163, 74, 0.1)",
              color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.Server />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)" }}>
                {instances.length} Nodes
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>
                {instances.filter(i => i.state === "running").length} Running on AWS
              </div>
            </div>
          </div>

          {/* Stat 4: Active Target Host */}
          <div style={{
            padding: "12px 16px", borderRadius: 10,
            background: "var(--bg-card2)", border: "1px solid var(--border-soft)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 8, background: "rgba(249, 115, 22, 0.1)",
              color: "var(--orange)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.Activity />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {activeInstance?.public_ip || "100.62.103.113"}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>
                Host Port 8080 (Healthy)
              </div>
            </div>
          </div>
        </div>

        {/* Repositories Quick Strip */}
        {repos.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, overflowX: "auto", paddingBottom: 2,
            borderTop: "1px solid var(--border-soft)", paddingTop: 12,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".04em", flexShrink: 0 }}>
              Repositories:
            </span>
            {repos.slice(0, 10).map(r => {
              const isSelected = (r.name === selectedRepo) || (r.repo_name === selectedRepo);
              return (
                <button
                  key={r.name}
                  onClick={() => setSelectedRepo(r.name)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 980,
                    background: isSelected ? "var(--text-1)" : "var(--bg-card2)",
                    color: isSelected ? "var(--bg-card)" : "var(--text-2)",
                    border: isSelected ? "1px solid var(--text-1)" : "1px solid var(--border)",
                    fontSize: 12, fontWeight: isSelected ? 700 : 500, cursor: "pointer",
                    whiteSpace: "nowrap", flexShrink: 0, transition: "all .15s",
                  }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: "50%",
                    background: isSelected ? "var(--bg-card)" : "var(--green)",
                  }} />
                  {r.name.includes("/") ? r.name.split("/")[1] : r.name}
                  {r.language && <span style={{ opacity: 0.7, fontSize: 10.5 }}>({r.language})</span>}
                </button>
              );
            })}
            {repos.length > 10 && (
              <button
                onClick={() => setView("repos")}
                style={{
                  fontSize: 11.5, color: "var(--blue)", background: "transparent",
                  border: "none", cursor: "pointer", flexShrink: 0, padding: "2px 8px", fontWeight: 600,
                }}
              >
                +{repos.length - 10} more ➔
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── DOWN SECTION: DEVOPS DIAGNOSTIC & ARCHITECTURAL CHAT INTERFACE ─── */}
      <div style={{
        borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
        boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column",
        overflow: "hidden", minHeight: 480, flexShrink: 0,
      }}>
        {/* Chat Interface Header */}
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid var(--border-soft)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
          background: "var(--bg-card2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "rgba(22, 163, 74, 0.1)",
              color: "var(--green)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <I.Bot />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                AI Cloud Architect & Deployment Diagnostic Chat
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                Ask anything about past deployments, failure reasons, pipeline logs, or infrastructure states.
              </div>
            </div>
          </div>

          <span style={{
            fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 980,
            background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)",
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a" }} />
            Live DB Logs Engine Online
          </span>
        </div>

        {/* Messages Stream */}
        <div style={{
          padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16,
          flex: 1, minHeight: 280, maxHeight: 460, overflowY: "auto",
        }}>
          {msgs.map(m => (
            <Bubble key={m.id} msg={m} />
          ))}

          {typing && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 10,
              background: "var(--bg-card2)", border: "1px solid var(--border)", color: "var(--orange)", fontSize: 13, fontWeight: 600,
            }}>
              <I.Loader /> AI Cloud Architect querying database deployment logs and analyzing telemetry...
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick Diagnostic Prompts & Input Console */}
        <div style={{
          padding: "16px 20px 20px", borderTop: "1px solid var(--border-soft)",
          background: "var(--bg-card)", display: "flex", flexDirection: "column", gap: 12,
        }}>
          {/* Question Chips & 1-Click Demo Trigger */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* 1-Click Live Demo Button */}
            <button
              onClick={() => {
                send(
                  `Deploy ${activeRepo?.name || selectedRepo || "app"} to AWS EC2 with autonomous self-healing for port collision and health probe failure`,
                  activeRepo?.name || selectedRepo || repos[0]?.name,
                  activeInstance?.instance_id || selectedInstance || instances[0]?.instance_id,
                  target
                );
              }}
              disabled={typing}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 14px", borderRadius: 980,
                background: "linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)",
                border: "1.5px solid rgba(239, 68, 68, 0.4)",
                color: "var(--text-1)", fontSize: 12, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.15)",
                transition: "all .18s",
              }}
              title="Triggers live autonomous deployment with intentional port conflict (80/3000) to showcase real-time SRE diagnosis and automatic recovery to port 8080"
            >
              <span style={{ fontSize: 14 }}>🚨</span>
              <span>1-Click Demo: Autonomous Self-Healing (EC2 Port Collision & 502)</span>
              <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(239,68,68,0.2)", color: "#ef4444", fontWeight: 800 }}>
                LIVE DEMO
              </span>
            </button>

            <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", marginLeft: 4 }}>
              Ask About:
            </span>
            {[
              "Why did the latest pipeline run fail or succeed?",
              `What happened in the deployment of ${activeRepo?.name || selectedRepo || "app"}?`,
              "Explain recent anomaly detection & self-healing logs",
              "Which EC2 instances and ports are currently active?",
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => handleAskQuestion(prompt)}
                disabled={typing}
                style={{
                  padding: "4px 12px", borderRadius: 980, cursor: "pointer",
                  background: "var(--bg-card2)", border: "1px solid var(--border)",
                  color: "var(--text-2)", fontSize: 12, fontWeight: 500,
                  transition: "all .15s",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input Field & Send Action */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label htmlFor="agent-chat-input" className="sr-only" style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}>
              Ask Question
            </label>
            <input
              id="agent-chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAskQuestion(); }}
              placeholder="Ask any question about your deployments, pipeline failures, AWS logs, or architecture..."
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1.5px solid var(--border)",
                fontSize: 13.5, outline: "none",
              }}
            />
            <button
              onClick={() => handleAskQuestion()}
              disabled={typing || !input.trim()}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "12px 22px", borderRadius: 8,
                border: "none", background: "var(--btn-primary-bg)", color: "var(--btn-primary-text)",
                fontSize: 13, fontWeight: 700, cursor: (typing || !input.trim()) ? "not-allowed" : "pointer", flexShrink: 0,
                opacity: (typing || !input.trim()) ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                transition: "transform .18s, background .18s",
              }}
            >
              {typing ? <><I.Loader /> Querying DB…</> : <><I.Send /> Ask AI Architect</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
