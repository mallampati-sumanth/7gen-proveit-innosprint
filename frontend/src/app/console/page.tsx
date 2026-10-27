"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

import {
  ThemeMode,
  EnvTarget,
  StepStatus,
  Step,
  Message,
  RepoItem,
  EC2InstanceItem,
  API_BASE,
  THEME_VARS,
  PAGE_META,
  STAGE_META,
} from "@/components/console/types";

import { Header } from "@/components/console/Header";
import { Sidebar } from "@/components/console/Sidebar";

import { GitHubConnectModal } from "@/components/console/modals/GitHubConnectModal";
import { LoginModal } from "@/components/console/modals/LoginModal";
import { EC2ProvisionWizardModal } from "@/components/console/modals/EC2ProvisionWizardModal";
import { DeploymentWizardModal } from "@/components/console/modals/DeploymentWizardModal";

import { AgentChatTab } from "@/components/console/tabs/AgentChatTab";
import { ReposTab } from "@/components/console/tabs/ReposTab";
import { RepoEnvTab } from "@/components/console/tabs/RepoEnvTab";
import { EC2FleetTab } from "@/components/console/tabs/EC2FleetTab";
import { SecretsTab } from "@/components/console/tabs/SecretsTab";
import { RepoAnalyzerTab } from "@/components/console/tabs/RepoAnalyzerTab";
import { InfraTopologyTab } from "@/components/console/tabs/InfraTopologyTab";
import { ActivityTab } from "@/components/console/tabs/ActivityTab";
import { LogsTab } from "@/components/console/tabs/LogsTab";
import { VoiceOpsTab } from "@/components/console/tabs/VoiceOpsTab";
import { LedgerTab } from "@/components/console/tabs/LedgerTab";
import { BenchmarkTab } from "@/components/console/tabs/BenchmarkTab";

/* ─────────── WELCOME AGENT MESSAGE ─────────── */
const WELCOME_MESSAGE: Message = {
  id: "w0",
  role: "agent",
  text: "Hi - I am ProveIt Autonomous Deployment Agent.\n\nConnect your GitHub account or paste any repository URL to inspect manifests, configure and inject custom per-repository .env configurations, and autonomously deploy to your AWS EC2 instances with live SSH handshakes, health checks, and cryptographic ledger proofs.",
  meta: "Gemini 2.5 Flash Agent",
  timestamp: "Ready",
};

function MainApp() {
  const { user, loading, logout } = useAuth();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [view, setView] = useState("chat");
  const [target, setTarget] = useState<EnvTarget>("production");
  const [msgs, setMsgs] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  // Entities state
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [instances, setInstances] = useState<EC2InstanceItem[]>([]);
  const [githubProfile, setGithubProfile] = useState<any>(null);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [selectedInstance, setSelectedInstance] = useState<string>("");

  // Modals state
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [provisionContext, setProvisionContext] = useState<any>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const vars = THEME_VARS[theme];
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const loadData = useCallback(async () => {
    try {
      const [rRes, iRes, pRes] = await Promise.all([
        fetch(`${API_BASE}/api/agent/repos`),
        fetch(`${API_BASE}/api/agent/ec2/instances`),
        fetch(`${API_BASE}/api/agent/github/profile`),
      ]);
      const rData = await rRes.json();
      const iData = await iRes.json();
      const pData = await pRes.json();

      setRepos(rData || []);
      setInstances(iData || []);
      setGithubProfile(pData || { connected: false });

      if (rData && rData.length > 0) {
        // Prioritize repo owned by the logged-in user or connected GitHub account
        const myUsername = (pData?.username || pData?.login || user?.username || "").toLowerCase();
        const myRepo = rData.find((r: any) => myUsername && (r.owner || "").toLowerCase() === myUsername);
        const preferred = myRepo ? myRepo.name : rData[0].name;
        setSelectedRepo(prev => prev || preferred);
      }
      if (iData && iData.length > 0) {
        const realRunning = iData.find((i: any) => !i.instance_id.startsWith("i-0a8f") && !i.instance_id.startsWith("i-0b7e") && i.state === "running" && i.public_ip && i.public_ip.includes(".") && !i.public_ip.startsWith("None"));
        const defaultInstId = realRunning?.instance_id || iData[0].instance_id;
        setSelectedInstance(prev => {
          if (!prev) return defaultInstId;
          const current = iData.find((x: any) => x.instance_id === prev);
          if (current && (current.state === "stopped" || !current.public_ip || current.public_ip.startsWith("None")) && realRunning) {
            return realRunning.instance_id;
          }
          return prev;
        });
      }
    } catch { }
  }, []);

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      fetch(`${API_BASE}/api/agent/ec2/instances`)
        .then(r => r.json())
        .then(d => {
          if (Array.isArray(d)) setInstances(d);
        })
        .catch(() => {});
    }, 6000);
    return () => clearInterval(timer);
  }, [loadData]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const handleDeleteRepo = async (repoId: string) => {
    if (!confirm(`Are you sure you want to disconnect repository ${repoId}?`)) return;
    try {
      await fetch(`${API_BASE}/api/agent/repos/${repoId}`, { method: "DELETE" });
      loadData();
    } catch { }
  };

  /* ─────────── REAL LIVE AGENT SSE STREAMING TO EC2 ─────────── */
  const send = useCallback(async (text?: string, targetRepoParam?: string, targetEc2Param?: string, envParam?: EnvTarget) => {
    const chosenRepo = targetRepoParam || selectedRepo || repos[0]?.name || "";
    const chosenEc2 = targetEc2Param || selectedInstance || instances[0]?.instance_id || "EC2-Target";
    const chosenEnv = envParam || target || "production";
    const t = (text ?? input).trim() || `Deploy ${chosenRepo || "application"} to EC2 in ${chosenEnv} environment`;
    setInput("");

    const isDeploymentIntent = t.toLowerCase().includes("deploy") || t.toLowerCase().includes("launch") || !!targetRepoParam;

    if (!isDeploymentIntent) {
      const userMsgId = `u${Date.now()}`;
      setMsgs(p => [...p, { id: userMsgId, role: "user", text: t, timestamp: "Now" }]);
      setTyping(true);
      try {
        const chatRes = await fetch(`${API_BASE}/api/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: t }),
        });
        const chatData = await chatRes.json();
        setMsgs(p => [...p, {
          id: `a${Date.now()}`,
          role: "agent",
          text: chatData.reply || "Agent acknowledged your command.",
          meta: "ProveIt AI Agent",
          timestamp: "Just now",
        }]);
      } catch {
        setMsgs(p => [...p, {
          id: `err-${Date.now()}`,
          role: "agent",
          text: "Could not reach ProveIt Agent backend.",
          meta: "System",
          timestamp: "Error",
        }]);
      } finally {
        setTyping(false);
      }
      return;
    }

    // ─── AUTONOMOUS DEPLOYMENT EXECUTION ───
    const userMsgId = `u${Date.now()}`;
    const agentMsgId = `agent-${Date.now()}`;
    setMsgs(prev => [
      ...prev,
      { id: userMsgId, role: "user", text: t, timestamp: "Now" }
    ]);
    setTyping(true);

    const initialAgentMsg: Message = {
      id: agentMsgId,
      role: "agent",
      text: `Initiating autonomous deployment of ${chosenRepo} to EC2 (${chosenEc2}) with injected ${chosenEnv} .env...`,
      steps: [],
      meta: "Gemini 2.5 Flash (SSE Streaming)",
      timestamp: "Just now",
    };
    setMsgs(p => [...p, initialAgentMsg]);

    try {
      const deployRes = await fetch(`${API_BASE}/api/agent/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: t,
          target_repo: chosenRepo,
          target_ec2: chosenEc2,
          environment: chosenEnv,
        }),
      });

      if (!deployRes.ok) {
        const errData = await deployRes.json();
        throw new Error(errData.detail || "Failed to start autonomous deployment.");
      }

      const deployData = await deployRes.json();
      const streamUrl = deployData.stream_url ? `${API_BASE}${deployData.stream_url}` : `${API_BASE}/api/agent/stream/${deployData.run_id}`;
      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const chunk = JSON.parse(event.data);

          setMsgs(prev => prev.map(m => {
            if (m.id !== agentMsgId) return m;

            if (chunk.type === "PLAN" || chunk.type === "THOUGHT") {
              return { ...m, thought: chunk.plan || chunk.thought };
            }
            if (chunk.type === "TOOL_START") {
              const meta = STAGE_META[chunk.tool_name];
              const newStep: Step = {
                id: chunk.tool_name,
                label: meta ? meta.title : `Executing ${chunk.tool_name.replace(/_/g, " ")}`,
                status: "running",
                detail: meta ? meta.describeStart(chunk.arguments) : JSON.stringify(chunk.arguments),
                rawJson: JSON.stringify(chunk.arguments, null, 2),
                ts: "Running",
              };
              return { ...m, steps: [...(m.steps || []), newStep] };
            }
            if (chunk.type === "TOOL_RESULT") {
              const meta = STAGE_META[chunk.tool_name];
              const isErr = chunk.result?.status === "error" || chunk.result?.error;
              const updatedSteps = (m.steps || []).map(s => {
                if (s.id === chunk.tool_name) {
                  return {
                    ...s,
                    status: (isErr ? "error" : "done") as StepStatus,
                    detail: isErr ? (chunk.result?.error || "Step failed") : (meta ? meta.describeDone(chunk.result) : JSON.stringify(chunk.result)),
                    rawJson: JSON.stringify(chunk.result, null, 2),
                    ts: isErr ? "Failed" : "Verified ✓",
                  };
                }
                return s;
              });
              return { ...m, steps: updatedSteps };
            }
            if (chunk.type === "RUN_COMPLETE") {
              eventSource.close();
              setTyping(false);
              const summary = chunk.summary || {};
              loadData();
              return {
                ...m,
                text: `Autonomous deployment verified for ${chosenRepo} on EC2 target! Cryptographic proof #${summary.proof_hash || "verified"} committed to immutable audit ledger.`,
                appUrl: summary.app_url,
                proofHash: summary.proof_hash,
              };
            }
            if (chunk.type === "RUN_ERROR") {
              eventSource.close();
              setTyping(false);
              return {
                ...m,
                text: `Deployment Failed: ${chunk.error || "Autonomous execution halted."}`,
                steps: [...(m.steps || []), { id: "err", label: "Agent Execution Error", status: "error" as StepStatus, detail: chunk.error }],
              };
            }
            return m;
          }));
        } catch { }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setTyping(false);
      };
    } catch (err: any) {
      setMsgs(prev => prev.map(m => m.id === agentMsgId ? {
        ...m,
        text: `Deployment Failed: ${err?.message || "Could not connect to deployment backend."}`,
        steps: [
          { id: "s-err", label: "Autonomous deployment error", status: "error" as StepStatus, detail: err?.message || "Execution failed" }
        ],
      } : m));
      setTyping(false);
    }
  }, [input, selectedRepo, selectedInstance, target, repos, instances, loadData]);

  const openDeployForRepo = (repoName: string) => {
    setSelectedRepo(repoName);
    setDeployModalOpen(true);
  };

  const openInjectForRepo = (repoName: string) => {
    if (repoName) {
      setSelectedRepo(repoName);
    }
    setView("repoenv");
  };

  const openDeployForInstance = (inst: EC2InstanceItem) => {
    setSelectedInstance(inst.instance_id);
    setDeployModalOpen(true);
  };

  const handleLaunchFromModal = (repoName: string, instanceId: string, envVal: EnvTarget) => {
    setSelectedRepo(repoName);
    setSelectedInstance(instanceId);
    setTarget(envVal);
    setView("chat");
    setTimeout(() => {
      send(`Deploy ${repoName} to EC2 ${instanceId}`, repoName, instanceId, envVal);
    }, 150);
  };

  const handleOpenProvisionForRepo = (ctx: any) => {
    setProvisionContext(ctx);
    setProvisionModalOpen(true);
  };

  const handleOpenProvisionGeneral = () => {
    const chosen = selectedRepo || (repos[0]?.name ?? "web-app");
    setProvisionContext({
      name: `Host-${chosen.split("/").pop()}`,
      target_repo: chosen,
      app_port: 5000,
      framework: "Dockerized App",
      instance_type: "t3.micro",
      region: "us-east-1",
    });
    setProvisionModalOpen(true);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        fontFamily: "'Inter', sans-serif",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            border: "2px solid #e5e5e5",
            borderTopColor: "#0a0a0a",
            animation: "spin 0.8s linear infinite",
          }} />
          <div style={{ fontSize: 13, fontWeight: 500, color: "#737373", letterSpacing: "-.01em" }}>
            Loading ProveIt Console…
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.3;transform:scale(.7);} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)", color: "var(--text-1)", overflow: "hidden" }}>
        <Header
          view={view}
          setView={setView}
          theme={theme}
          setTheme={setTheme}
          profile={githubProfile}
          onOpenConnect={() => setConnectModalOpen(true)}
          onDeployClick={() => setDeployModalOpen(true)}
          currentUser={user.username}
          onLogout={logout}
          onToggleSidebar={() => setMobileSidebarOpen(prev => !prev)}
        />

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Modular Sidebar with Responsive Mobile Drawer */}
          <Sidebar
            view={view}
            setView={setView}
            selectedInstance={selectedInstance}
            isOpen={mobileSidebarOpen}
            onClose={() => setMobileSidebarOpen(false)}
          />

          {/* Main Workspace Area */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-main)" }}>
            <div style={{
              height: 52, flexShrink: 0, padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px solid var(--border-soft)", background: "var(--bg-card)",
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.02em" }}>{PAGE_META[view]?.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2, fontWeight: 300, letterSpacing: "-.01em" }}>{PAGE_META[view]?.sub}</div>
              </div>
              <span style={{
                fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 980,
                background: "rgba(22,163,74,0.1)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)",
              }}>
                {PAGE_META[view]?.badge}
              </span>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {view === "chat" && (
                <AgentChatTab
                  user={user}
                  githubProfile={githubProfile}
                  repos={repos}
                  instances={instances}
                  selectedRepo={selectedRepo}
                  setSelectedRepo={setSelectedRepo}
                  selectedInstance={selectedInstance}
                  setSelectedInstance={setSelectedInstance}
                  target={target}
                  setTarget={setTarget}
                  input={input}
                  setInput={setInput}
                  typing={typing}
                  send={send}
                  msgs={msgs}
                  bottomRef={bottomRef}
                  setView={setView}
                  onOpenConnect={() => setConnectModalOpen(true)}
                  onInjectEnv={openInjectForRepo}
                />
              )}

              {view === "repos" && (
                <ReposTab
                  repos={repos}
                  profile={githubProfile}
                  onDeploy={openDeployForRepo}
                  onInjectEnv={openInjectForRepo}
                  onRefresh={loadData}
                  onOpenConnect={() => setConnectModalOpen(true)}
                  onDeleteRepo={handleDeleteRepo}
                />
              )}

              {view === "repoenv" && (
                <RepoEnvTab
                  repos={repos}
                  selectedRepo={selectedRepo || (repos[0]?.name ?? "")}
                  setSelectedRepo={setSelectedRepo}
                  activeTarget={target}
                  setActiveTarget={setTarget}
                  onDeployRepo={openDeployForRepo}
                />
              )}

              {view === "ec2" && (
                <EC2FleetTab
                  instances={instances}
                  onDeployToInstance={openDeployForInstance}
                  onRefresh={loadData}
                  onOpenProvision={handleOpenProvisionGeneral}
                />
              )}

              {view === "secrets" && (
                <SecretsTab
                  profile={githubProfile}
                  onOpenConnect={() => setConnectModalOpen(true)}
                />
              )}

              {view === "analyze" && (
                <RepoAnalyzerTab
                  repos={repos}
                  onDeploy={openDeployForRepo}
                  onInjectEnv={openInjectForRepo}
                  onProvisionRecommendedEC2={handleOpenProvisionForRepo}
                />
              )}

              {view === "infra" && <InfraTopologyTab />}

              {view === "activity" && (
                <ActivityTab onDeployClick={() => setDeployModalOpen(true)} />
              )}

              {view === "logs" && <LogsTab />}

              {view === "voice" && (
                <VoiceOpsTab currentUser={user.username} repos={repos} onDeployFromVoice={openDeployForRepo} />
              )}

              {view === "ledger" && <LedgerTab />}

              {view === "benchmark" && <BenchmarkTab />}

              {view === "settings" && <SettingsPanel theme={theme} setTheme={setTheme} />}
            </div>
          </main>
        </div>
      </div>

      {/* Deployment Modal */}
      <DeploymentWizardModal
        open={deployModalOpen}
        onClose={() => setDeployModalOpen(false)}
        repos={repos}
        instances={instances}
        selectedRepo={selectedRepo || (repos[0]?.name ?? "")}
        selectedInstance={selectedInstance || (instances[0]?.instance_id ?? "")}
        onLaunch={handleLaunchFromModal}
      />

      {/* Connect GitHub Account Modal */}
      <GitHubConnectModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        onConnected={loadData}
      />

      {/* 1-Click Provision Modal */}
      <EC2ProvisionWizardModal
        open={provisionModalOpen}
        onClose={() => setProvisionModalOpen(false)}
        context={provisionContext}
        onProvisionSuccess={() => loadData()}
        onDeployNow={(repo, instId) => {
          setSelectedRepo(repo);
          setSelectedInstance(instId);
          setView("chat");
          setTimeout(() => {
            send(`Deploy ${repo} to provisioned EC2 ${instId}`, repo, instId, target);
          }, 150);
        }}
      />

      {/* Login Modal */}
      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={() => loadData()}
      />
    </>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
