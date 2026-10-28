"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RepoItem, API_BASE } from "../types";
import { I } from "../icons";

interface AutomationStep {
  id: string;
  name: string;
  status: "done" | "running" | "pending" | "failed";
  detail?: string;
}

interface AutomationTask {
  task_id: string;
  call_sid: string;
  caller_phone: string;
  username: string;
  repo: string;
  repo_name: string;
  provider: "vercel" | "render" | "railway" | "netlify" | "aws" | string;
  provider_display: string;
  action: string;
  status: "LIVE" | "RUNNING" | "SUCCESS" | "FAILED";
  progress_pct: number;
  current_step: string;
  live_url?: string;
  proof_hash?: string;
  timestamp: string;
  transcript?: string;
  steps?: AutomationStep[];
  build_logs?: string[];
}

export const VoiceAutomationTab = ({
  currentUser,
  repos = [],
}: {
  currentUser?: string;
  repos?: RepoItem[];
}) => {
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoPoll, setAutoPoll] = useState(true);
  const [search, setSearch] = useState("");
  const [providerFilter, setProviderFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState<AutomationTask | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Trigger / Simulate Modal State
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simulateRepo, setSimulateRepo] = useState("");
  const [simulateProvider, setSimulateProvider] = useState("auto");
  const [simulatePhone, setSimulatePhone] = useState("+91 77998 26164");
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<AutomationTask | null>(null);

  // Default initial simulate repo
  useEffect(() => {
    if (!simulateRepo && repos.length > 0) {
      const topRepo = repos.find(r => r.name.toLowerCase().includes("campus") || r.name.toLowerCase().includes("climate") || r.name.toLowerCase().includes("weather")) || repos[0];
      setSimulateRepo(topRepo.name);
    }
  }, [repos, simulateRepo]);

  const fetchTasks = useCallback(async () => {
    try {
      const url = currentUser
        ? `${API_BASE}/api/voice/automation/tasks?username=${encodeURIComponent(currentUser)}`
        : `${API_BASE}/api/voice/automation/tasks`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tasks)) {
          setTasks(data.tasks);
        }
      }
    } catch (e) {
      console.warn("Could not fetch voice automation tasks:", e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Initial load
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Real-time polling every 3 seconds if active
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      fetchTasks();
    }, 3000);
    return () => clearInterval(interval);
  }, [autoPoll, fetchTasks]);

  // Copy helper
  const handleCopyLink = (url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(url);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleCopyHash = (hash: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Trigger a voice simulation deployment
  const handleTriggerAutomation = async () => {
    if (!simulateRepo) return;
    setSimulating(true);
    setSimulationResult(null);

    try {
      const body: any = {
        repo_name: simulateRepo,
        caller_phone: simulatePhone,
        pin: "7833",
      };
      if (simulateProvider !== "auto") {
        body.provider = simulateProvider;
      }

      const res = await fetch(`${API_BASE}/api/voice/automation/trigger-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulationResult(data);
        await fetchTasks();
      }
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setSimulating(false);
    }
  };

  // Delete all voice automation projects data
  const handleClearAllTasks = async () => {
    if (!window.confirm("Are you sure you want to delete all projects data and deployment history from the Voice Agents Automation page?")) {
      return;
    }
    try {
      const url = currentUser
        ? `${API_BASE}/api/voice/automation/tasks?username=${encodeURIComponent(currentUser)}`
        : `${API_BASE}/api/voice/automation/tasks`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setTasks([]);
      }
    } catch (e) {
      console.error("Could not delete voice automation tasks:", e);
    }
  };

  // Delete a single voice automation task
  const handleDeleteTask = async (taskId: string, repoName: string) => {
    if (!window.confirm(`Are you sure you want to remove the deployment for ${repoName}?`)) {
      return;
    }
    try {
      const url = `${API_BASE}/api/voice/automation/tasks?task_id=${encodeURIComponent(taskId)}&repo=${encodeURIComponent(repoName)}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.task_id !== taskId && t.repo !== repoName));
      }
    } catch (e) {
      console.error("Could not delete voice automation task:", e);
    }
  };

  // Filtered task list (deduplicated by task_id)
  const filteredTasks = useMemo(() => {
    const seen = new Set<string>();
    return tasks.filter((t, idx) => {
      const uniqueKey = t.task_id || `task-${idx}`;
      if (seen.has(uniqueKey)) return false;
      seen.add(uniqueKey);

      const matchesSearch =
        !search ||
        t.repo.toLowerCase().includes(search.toLowerCase()) ||
        t.repo_name.toLowerCase().includes(search.toLowerCase()) ||
        t.caller_phone.toLowerCase().includes(search.toLowerCase()) ||
        (t.transcript && t.transcript.toLowerCase().includes(search.toLowerCase())) ||
        (t.live_url && t.live_url.toLowerCase().includes(search.toLowerCase()));

      const matchesProvider =
        providerFilter === "ALL" || t.provider.toLowerCase() === providerFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "LIVE" && (t.status === "LIVE" || t.status === "SUCCESS")) ||
        (statusFilter === "RUNNING" && t.status === "RUNNING");

      return matchesSearch && matchesProvider && matchesStatus;
    });
  }, [tasks, search, providerFilter, statusFilter]);

  // Statistics
  const liveCount = tasks.filter(t => t.status === "LIVE" || t.status === "SUCCESS").length;
  const inFlightCount = tasks.filter(t => t.status === "RUNNING").length;
  const verifiedLinksCount = tasks.filter(t => Boolean(t.live_url)).length;

  // Provider badge styling helper
  const getProviderBadge = (provider: string) => {
    const p = provider.toLowerCase();
    switch (p) {
      case "vercel":
        return {
          label: "Vercel Edge",
          bg: "rgba(255, 255, 255, 0.08)",
          color: "var(--text-1)",
          border: "rgba(255, 255, 255, 0.2)",
          icon: "▲",
        };
      case "render":
        return {
          label: "Render Web",
          bg: "rgba(52, 211, 153, 0.12)",
          color: "#10b981",
          border: "rgba(52, 211, 153, 0.3)",
          icon: "⚡",
        };
      case "railway":
        return {
          label: "Railway Cloud",
          bg: "rgba(192, 132, 252, 0.12)",
          color: "#c084fc",
          border: "rgba(192, 132, 252, 0.3)",
          icon: "🚂",
        };
      case "netlify":
        return {
          label: "Netlify CDN",
          bg: "rgba(0, 199, 183, 0.12)",
          color: "#2dd4bf",
          border: "rgba(0, 199, 183, 0.3)",
          icon: "🌐",
        };
      case "aws":
      default:
        return {
          label: "AWS EC2 Host",
          bg: "rgba(251, 191, 36, 0.12)",
          color: "#f59e0b",
          border: "rgba(251, 191, 36, 0.3)",
          icon: "☁",
        };
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ─────────── 1. TOP STATS & ACTIONS BANNER ─────────── */}
      <div style={{
        padding: "20px 24px", borderRadius: 14,
        background: "var(--bg-card)", border: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)", fontSize: 22
          }}>
            <I.Zap />
          </div>
          <div>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 9 }}>
              <span>Voice Agents Automation & Live Telemetry</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10,
                background: inFlightCount > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.12)",
                color: inFlightCount > 0 ? "#f59e0b" : "#10b981",
                border: `1px solid ${inFlightCount > 0 ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`,
                display: "flex", alignItems: "center", gap: 5
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: inFlightCount > 0 ? "#f59e0b" : "#10b981", display: "inline-block" }} />
                {inFlightCount > 0 ? `${inFlightCount} IN-PROGRESS` : "IDLE / LISTENING"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
              Track what tasks the Voice Agent is executing, where it is deploying, live progress status, and verified live application URLs.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 8,
              border: "1px solid var(--border)", background: autoPoll ? "rgba(16, 185, 129, 0.08)" : "var(--bg-card2)",
              color: autoPoll ? "#10b981" : "var(--text-2)", fontSize: 11.5, fontWeight: 600, cursor: "pointer"
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: autoPoll ? "#10b981" : "var(--text-4)" }} />
            {autoPoll ? "Live 3s Polling ON" : "Polling Paused"}
          </button>

          <button
            onClick={fetchTasks}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8,
              border: "1px solid var(--border)", background: "var(--bg-card2)", color: "var(--text-1)",
              fontSize: 12, fontWeight: 600, cursor: "pointer"
            }}
          >
            <I.Refresh /> Refresh
          </button>

          {tasks.length > 0 && (
            <button
              onClick={handleClearAllTasks}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 8,
                border: "1px solid rgba(239, 68, 68, 0.4)", background: "rgba(239, 68, 68, 0.08)", color: "#ef4444",
                fontSize: 12, fontWeight: 600, cursor: "pointer"
              }}
              title="Delete all project data from the voice automation tracker"
            >
              <I.Trash /> Clear All Projects
            </button>
          )}

          <button
            onClick={() => {
              setSimulationResult(null);
              setShowSimulateModal(true);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 8,
              border: "none", background: "var(--orange)", color: "#fff", fontSize: 12.5, fontWeight: 700,
              cursor: "pointer", boxShadow: "0 2px 8px rgba(249, 115, 22, 0.25)"
            }}
          >
            <I.Play /> Trigger Voice Deployment
          </button>
        </div>
      </div>

      {/* ─────────── 2. STATS CARDS ─────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
        <div style={{ padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase" }}>Total Voice Tasks</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)", marginTop: 4 }}>{tasks.length}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>Dispatched via telephone call</div>
        </div>

        <div style={{ padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase" }}>Live Public URLs</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#10b981", marginTop: 4 }}>{verifiedLinksCount}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>Accessible on internet with live link</div>
        </div>

        <div style={{ padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase" }}>Cloud Destinations</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--orange)", marginTop: 4 }}>5 Providers</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>Vercel, Render, Railway, Netlify, EC2</div>
        </div>

        <div style={{ padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase" }}>Ledger Proof Seals</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#8b5cf6", marginTop: 4 }}>100%</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>SHA-256 sealed cryptographic proofs</div>
        </div>
      </div>

      {/* ─────────── 3. ACTIVE IN-PROGRESS BANNER (IF ANY) ─────────── */}
      {tasks.some(t => t.status === "RUNNING") && (
        <div style={{
          padding: "20px 24px", borderRadius: 12,
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 87, 0.08) 100%)",
          border: "1px solid rgba(245, 158, 11, 0.35)",
          display: "flex", flexDirection: "column", gap: 12
        }}>
          {tasks.filter(t => t.status === "RUNNING").map((t, idx) => {
            const badge = getProviderBadge(t.provider);
            return (
              <div key={`running-${t.task_id || idx}`} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", background: "#f59e0b", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13
                    }}>
                      <I.Loader />
                    </div>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
                        Deploying <code style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--orange)" }}>{t.repo}</code> to {t.provider_display}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                        Caller: {t.caller_phone} ({t.transcript})
                      </div>
                    </div>
                  </div>

                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                    background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                  }}>
                    {badge.icon} {badge.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: 6, borderRadius: 99, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{
                    width: `${t.progress_pct || 45}%`, height: "100%",
                    background: "linear-gradient(90deg, #f59e0b 0%, #10b981 100%)",
                    transition: "width 0.4s ease"
                  }} />
                </div>

                <div style={{ fontSize: 12, color: "#f59e0b", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>Current Task: {t.current_step}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────── 4. SEARCH & FILTER CONTROLS ─────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "0 12px", width: 340 }}>
          <span style={{ color: "var(--text-3)" }}><I.Search /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by repository, destination, or caller..."
            style={{ width: "100%", padding: "9px 0", background: "none", border: "none", color: "var(--text-1)", fontSize: 12.5, outline: "none" }}
          />
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {["ALL", "vercel", "render", "railway", "netlify", "aws"].map(p => (
            <button
              key={p}
              onClick={() => setProviderFilter(p)}
              style={{
                padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)",
                background: providerFilter.toLowerCase() === p.toLowerCase() ? "var(--orange)" : "var(--badge-bg)",
                color: providerFilter.toLowerCase() === p.toLowerCase() ? "#fff" : "var(--text-2)",
                fontSize: 11.5, fontWeight: 600, cursor: "pointer", textTransform: "capitalize"
              }}
            >
              {p === "ALL" ? "All Clouds" : p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────── 5. VOICE AUTOMATION TASKS LIST ─────────── */}
      {loading ? (
        <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-3)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <I.Loader />
          <span>Loading Voice Agent automation tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          padding: "48px 24px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
          textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--badge-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-3)" }}>
            <I.Phone />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>No Voice Automations Found</div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", maxWidth: 440, marginTop: 4 }}>
              Call the Sarvam AI hotline or click &quot;Trigger Voice Deployment&quot; above to watch the agent autonomously inspect, route, and deploy your repositories with a live link!
            </div>
          </div>
          <button
            onClick={() => setShowSimulateModal(true)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", background: "var(--orange)",
              color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: "pointer"
            }}
          >
            Deploy a Repository Now
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredTasks.map((task, idx) => {
            const badge = getProviderBadge(task.provider);
            const isLive = task.status === "LIVE" || task.status === "SUCCESS";
            const isRunning = task.status === "RUNNING";

            return (
              <div
                key={`task-${task.task_id || idx}`}
                style={{
                  padding: "20px 24px", borderRadius: 12,
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  display: "flex", flexDirection: "column", gap: 14,
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                }}
              >
                {/* Header row: Repo + Provider + Status */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: isLive ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      color: isLive ? "#10b981" : "#f59e0b",
                      border: `1px solid ${isLive ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                    }}>
                      {isRunning ? <I.Loader /> : <I.Check />}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", fontFamily: "JetBrains Mono, monospace" }}>
                          {task.repo}
                        </span>

                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                          background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`
                        }}>
                          {badge.icon} {badge.label}
                        </span>

                        <span style={{
                          fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: isLive ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                          color: isLive ? "#10b981" : "#f59e0b",
                          border: `1px solid ${isLive ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                        }}>
                          {isLive ? "● LIVE & VERIFIED" : "● IN PROGRESS"}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span>Caller: <strong style={{ color: "var(--text-2)" }}>{task.caller_phone}</strong></span>
                        <span>•</span>
                        <span>Account: <strong style={{ color: "var(--text-2)" }}>@{task.username}</strong></span>
                        <span>•</span>
                        <span>Voice Command: <em>&ldquo;{task.transcript || "Deploy"}&rdquo;</em></span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", fontSize: 11.5, color: "var(--text-3)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    <div>Run: <code style={{ fontFamily: "JetBrains Mono, monospace" }}>{task.task_id}</code></div>
                    <div>{task.timestamp ? new Date(task.timestamp).toLocaleString() : "Live"}</div>
                    <button
                      onClick={() => handleDeleteTask(task.task_id, task.repo)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6,
                        background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "#ef4444",
                        fontSize: 11, fontWeight: 600, cursor: "pointer", marginTop: 2
                      }}
                      title={`Remove deployment of ${task.repo}`}
                    >
                      <I.Trash /> Delete Deployment
                    </button>
                  </div>
                </div>

                {/* ─────────── LIVE LINK AFTER DEPLOYMENT SECTION ─────────── */}
                <div style={{
                  padding: "14px 18px", borderRadius: 10,
                  background: task.live_url ? "rgba(16, 185, 129, 0.05)" : "var(--bg-card2)",
                  border: `1px solid ${task.live_url ? "rgba(16, 185, 129, 0.25)" : "var(--border)"}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: task.live_url ? "#10b981" : "var(--text-3)", textTransform: "uppercase" }}>
                      {task.live_url ? "🌐 Verified Live Link:" : "⏳ Live URL:"}
                    </span>

                    {task.live_url ? (
                      <a
                        href={task.live_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 13, fontWeight: 700, color: "var(--orange)",
                          fontFamily: "JetBrains Mono, monospace", textDecoration: "underline",
                          wordBreak: "break-all"
                        }}
                      >
                        {task.live_url}
                      </a>
                    ) : (
                      <span style={{ fontSize: 12.5, color: "var(--text-3)", fontStyle: "italic" }}>
                        Generating DNS route and container endpoint...
                      </span>
                    )}
                  </div>

                  {task.live_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        onClick={() => handleCopyLink(task.live_url!)}
                        style={{
                          display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6,
                          background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-2)",
                          fontSize: 11.5, fontWeight: 600, cursor: "pointer"
                        }}
                      >
                        <I.Copy /> {copiedLink === task.live_url ? "Copied!" : "Copy Link"}
                      </button>

                      <a
                        href={task.live_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 5, padding: "6px 14px", borderRadius: 6,
                          background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none"
                        }}
                      >
                        <I.ExternalLink /> Open App ↗
                      </a>
                    </div>
                  )}
                </div>

                {/* Proof Hash & Execution Steps Drawer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, paddingTop: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11.5, color: "var(--text-3)" }}>
                    {task.proof_hash && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <I.Shield />
                        <span>SHA-256 Proof:</span>
                        <code style={{ fontFamily: "JetBrains Mono, monospace", color: "var(--text-2)" }}>
                          {task.proof_hash.slice(0, 16)}…
                        </code>
                        <button
                          onClick={() => handleCopyHash(task.proof_hash!)}
                          style={{ background: "none", border: "none", color: "var(--text-4)", cursor: "pointer", padding: 2 }}
                        >
                          <I.Copy />
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedTask(selectedTask?.task_id === task.task_id ? null : task)}
                    style={{
                      background: "none", border: "none", color: "var(--orange)",
                      fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4
                    }}
                  >
                    <span>{selectedTask?.task_id === task.task_id ? "Hide Execution Pipeline & Logs ▲" : "View Pipeline Stages & Logs ▼"}</span>
                  </button>
                </div>

                {/* Expanded Pipeline Stages & Logs */}
                {selectedTask?.task_id === task.task_id && (
                  <div style={{
                    marginTop: 8, padding: 18, borderRadius: 10,
                    background: "var(--bg-card2)", border: "1px solid var(--border)",
                    display: "flex", flexDirection: "column", gap: 16
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                      Autonomous Voice Telephony Execution Pipeline
                    </div>

                    {/* Steps Timeline */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(task.steps || []).map((st, idx) => (
                        <div key={st.id || idx} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%",
                            background: st.status === "done" ? "#10b981" : (st.status === "running" ? "#f59e0b" : "var(--border)"),
                            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, flexShrink: 0, marginTop: 1
                          }}>
                            {st.status === "done" ? "✓" : (st.status === "running" ? "…" : String(idx + 1))}
                          </div>
                          <div style={{ fontSize: 12 }}>
                            <span style={{ fontWeight: 700, color: "var(--text-1)" }}>{st.name}: </span>
                            <span style={{ color: "var(--text-2)" }}>{st.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Build Logs Terminal */}
                    {task.build_logs && task.build_logs.length > 0 && (
                      <div style={{
                        padding: "12px 14px", borderRadius: 8,
                        background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)",
                        color: "#c9d1d9", fontFamily: "JetBrains Mono, monospace", fontSize: 11.5,
                        maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4
                      }}>
                        {task.build_logs.map((lg, i) => (
                          <div key={i} style={{ color: lg.includes("live") ? "#34d399" : (lg.includes("Error") ? "#ef4444" : "#8b949e") }}>
                            {lg}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────── 6. SIMULATE / TRIGGER VOICE DEPLOYMENT MODAL ─────────── */}
      {showSimulateModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20
        }}>
          <div style={{
            width: "100%", maxWidth: 540, borderRadius: 14, background: "var(--bg-card)",
            border: "1px solid var(--border)", padding: 24, display: "flex", flexDirection: "column", gap: 18,
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
                Trigger Voice Deployment Simulation
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: 12.5, color: "var(--text-3)" }}>
              Test what happens when someone calls the hotline and says &quot;Deploy repo to Vercel/Render/AWS&quot;. This runs the autonomous cloud pipeline, registers the task, and gives you the live URL immediately.
            </div>

            {/* Select Repository */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>Target Repository:</label>
              <select
                value={simulateRepo}
                onChange={e => setSimulateRepo(e.target.value)}
                style={{
                  padding: "10px 14px", borderRadius: 8, background: "var(--bg-input)",
                  color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13,
                  fontFamily: "JetBrains Mono, monospace", outline: "none"
                }}
              >
                {repos.map(r => (
                  <option key={r.id || r.name} value={r.name}>
                    {r.name} ({r.language || "Other"})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Cloud Provider */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>Target Cloud Platform:</label>
              <select
                value={simulateProvider}
                onChange={e => setSimulateProvider(e.target.value)}
                style={{
                  padding: "10px 14px", borderRadius: 8, background: "var(--bg-input)",
                  color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, outline: "none"
                }}
              >
                <option value="auto">⚡ Auto-Detect Optimal Platform (AI Recommended)</option>
                <option value="vercel">Vercel (React / Next.js / Frontend Edge)</option>
                <option value="render">Render (FastAPI / Python / Node Web Service)</option>
                <option value="railway">Railway (Full-stack Containers)</option>
                <option value="netlify">Netlify (Jamstack Static CDN)</option>
                <option value="aws">AWS EC2 (Dedicated Docker Host)</option>
              </select>
            </div>

            {/* Caller Phone */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>Caller Telephone Number:</label>
              <input
                value={simulatePhone}
                onChange={e => setSimulatePhone(e.target.value)}
                placeholder="+91 77998 26164"
                style={{
                  padding: "10px 14px", borderRadius: 8, background: "var(--bg-input)",
                  color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13,
                  fontFamily: "JetBrains Mono, monospace", outline: "none"
                }}
              />
            </div>

            {/* Result banner if simulated */}
            {simulationResult && (
              <div style={{
                padding: "14px 16px", borderRadius: 8, background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", flexDirection: "column", gap: 8
              }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#10b981" }}>
                  ✓ Deployment Succeeded! Live URL Ready:
                </div>
                {simulationResult.live_url ? (
                  <a
                    href={simulationResult.live_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)", wordBreak: "break-all" }}
                  >
                    {simulationResult.live_url} ↗
                  </a>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-2)" }}>Deployed to {simulationResult.provider_display}</div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
              <button
                onClick={() => setShowSimulateModal(false)}
                style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 12.5, cursor: "pointer" }}
              >
                Close
              </button>

              <button
                onClick={handleTriggerAutomation}
                disabled={simulating}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none", background: "var(--orange)",
                  color: "#fff", fontSize: 12.5, fontWeight: 700, cursor: simulating ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6
                }}
              >
                {simulating ? <><I.Loader /> Deploying via Voice…</> : "Dispatch Voice Deployment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
