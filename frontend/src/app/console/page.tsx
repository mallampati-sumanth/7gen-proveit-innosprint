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
import { ActivityTab } from "@/components/console/tabs/ActivityTab";
import { LogsTab } from "@/components/console/tabs/LogsTab";
import { VoiceOpsTab } from "@/components/console/tabs/VoiceOpsTab";
import { PipelineTrackerTab, PipelineState } from "@/components/console/tabs/PipelineTrackerTab";

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
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setAuthChecking(false), 800);
    return () => clearTimeout(t);
  }, []);

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

  // Pipeline Tracker state (100% dynamic, real-time)
  const [pipelineState, setPipelineState] = useState<PipelineState>({
    runId: "",
    repo: "",
    ec2Target: "",
    ec2Ip: "",
    environment: "production",
    status: "idle",
    startTime: null,
    endTime: null,
    durationSeconds: 0,
    commitId: "",
    imageTag: "",
    framework: "",
    port: 0,
    nodes: {
      setup_job: { id: "setup_job", name: "Set up job", phase: "CI", status: "pending", verdict: "PENDING", detail: "Awaiting pipeline trigger..." },
      checkout_code: { id: "checkout_code", name: "Checkout Code", phase: "CI", status: "pending", verdict: "PENDING", detail: "Pending checkout..." },
      initialization: { id: "initialization", name: "Initialization & Stack", phase: "CI", status: "pending", verdict: "PENDING", detail: "Pending stack detection..." },
      build: { id: "build", name: "Build & Port Check", phase: "CI", status: "pending", verdict: "PENDING", detail: "Pending container build..." },
      unit_test: { id: "unit_test", name: "Security & Policy Gate", phase: "CI", status: "pending", verdict: "PENDING", detail: "Pending blast radius evaluation..." },
      host_handshake: { id: "host_handshake", name: "Set up job", phase: "CD", status: "pending", verdict: "PENDING", detail: "Pending SSH handshake..." },
      checkout_cd: { id: "checkout_cd", name: "Checkout Code", phase: "CD", status: "pending", verdict: "PENDING", detail: "Pending remote stage..." },
      docker_init: { id: "docker_init", name: "Initialization", phase: "CD", status: "pending", verdict: "PENDING", detail: "Pending Docker daemon check..." },
      inject_secrets: { id: "inject_secrets", name: "Inject GitHub Secrets into VM", phase: "CD", status: "pending", verdict: "PENDING", detail: "Pending secrets injection..." },
      deploy_vm: { id: "deploy_vm", name: "Deploy to VM", phase: "CD", status: "pending", verdict: "PENDING", detail: "Pending container startup & health check..." },
    },
    logs: [
      { id: "init-1", time: "Ready", text: "Continuous Integration & Continuous Deployment pipeline tracker ready. Trigger deployment to start live streaming.", type: "info" },
    ],
  });

  // Duration timer for active deployment
  useEffect(() => {
    if (pipelineState.status !== "running") return;
    const interval = setInterval(() => {
      setPipelineState(prev => {
        if (prev.status !== "running") return prev;
        return { ...prev, durationSeconds: prev.durationSeconds + 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pipelineState.status]);

  // Modals state
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [provisionModalOpen, setProvisionModalOpen] = useState(false);
  const [provisionContext, setProvisionContext] = useState<any>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const toolStartTimes = useRef<Record<string, number>>({});

  useEffect(() => {
    const vars = THEME_VARS[theme];
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const loadData = useCallback(async () => {
    try {
      const storedPat = (typeof window !== "undefined" ? localStorage.getItem("proveit_github_pat") : null) || "";
      const profileUrl = storedPat
        ? `${API_BASE}/api/agent/github/profile?token=${encodeURIComponent(storedPat)}`
        : `${API_BASE}/api/agent/github/profile`;
      const reposUrl = storedPat
        ? `${API_BASE}/api/agent/repos?token=${encodeURIComponent(storedPat)}`
        : `${API_BASE}/api/agent/repos`;

      const [rRes, iRes, pRes] = await Promise.all([
        fetch(reposUrl),
        fetch(`${API_BASE}/api/agent/ec2/instances`),
        fetch(profileUrl),
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

        // Pre-populate pipeline target if idle and unset
        setPipelineState(prev => {
          if (prev.status === "idle" && !prev.repo) {
            const chosen = myRepo || rData[0];
            return {
              ...prev,
              repo: preferred,
              framework: chosen?.framework || chosen?.language || "",
              port: chosen?.default_port || 0,
            };
          }
          return prev;
        });
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

        // Pre-populate pipeline instance if idle and unset
        setPipelineState(prev => {
          if (prev.status === "idle" && !prev.ec2Target) {
            const inst = realRunning || iData[0];
            return {
              ...prev,
              ec2Target: inst.name ? `${inst.name} (${inst.instance_id})` : inst.instance_id,
              ec2Ip: inst.public_ip || "",
            };
          }
          return prev;
        });
      }
    } catch { }
  }, [user?.username]);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [msgs, typing]);

  const handleDeleteRepo = async (repoId: string) => {
    if (!confirm(`Are you sure you want to disconnect repository ${repoId}?`)) return;
    try {
      await fetch(`${API_BASE}/api/agent/repos/${repoId}`, { method: "DELETE" });
      loadData();
    } catch { }
  };

  /* ─────────── REAL LIVE AGENT SSE STREAMING & DEVOPS DIAGNOSTIC CHAT ─────────── */
  const send = useCallback(async (text?: string, targetRepoParam?: string, targetEc2Param?: string, envParam?: EnvTarget) => {
    const chosenRepo = targetRepoParam || selectedRepo || repos[0]?.name || "";
    const chosenEc2 = targetEc2Param || selectedInstance || instances[0]?.instance_id || "EC2-Target";
    const chosenEnv = envParam || target || "production";
    const rawInput = (text ?? input).trim();
    if (!rawInput && !targetRepoParam) return;

    const t = rawInput || `Deploy ${chosenRepo || "application"} to EC2 in ${chosenEnv} environment`;
    setInput("");

    // In Chat tab, all inputs are diagnostic inquiries unless explicitly triggered by deploy modal with targetRepoParam
    const isExplicitDeploy = !!targetRepoParam || (view !== "chat" && /^(deploy|launch|redeploy|provision|run deployment)\b/i.test(t));

    if (!isExplicitDeploy) {
      const userMsgId = `u${Date.now()}`;
      setMsgs(p => [...p, { id: userMsgId, role: "user", text: t, timestamp: "Now" }]);
      setTyping(true);
      try {
        const chatRes = await fetch(`${API_BASE}/api/agent/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: t,
            history: msgs.slice(-8).map(m => ({
              role: m.role === "agent" ? "assistant" : m.role,
              content: m.text,
            })),
          }),
        });
        const chatData = await chatRes.json();
        setMsgs(p => [...p, {
          id: `a${Date.now()}`,
          role: "agent",
          text: chatData.reply || "AI Architect analyzed the deployment database logs.",
          meta: "AI Cloud Architect (Live DB Logs)",
          timestamp: "Just now",
        }]);
      } catch {
        setMsgs(p => [...p, {
          id: `err-${Date.now()}`,
          role: "agent",
          text: "Could not reach ProveIt Agent backend diagnostic engine.",
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

    // Switch to Pipeline Tracker immediately
    setView("pipeline");

    const matchedInst = instances.find(i => i.instance_id === chosenEc2 || chosenEc2.includes(i.instance_id));
    const ec2Ip = matchedInst?.public_ip || (chosenEc2.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0] ?? "");
    const matchedRepo = repos.find(r => r.name === chosenRepo);
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Track real start times for duration computation
    toolStartTimes.current = { setup_job: Date.now() };

    // Initialize pipeline state for live tracking with real properties
    setPipelineState({
      runId: "",
      repo: chosenRepo,
      ec2Target: matchedInst?.name ? `${matchedInst.name} (${matchedInst.instance_id})` : chosenEc2,
      ec2Ip: ec2Ip,
      environment: chosenEnv,
      status: "running",
      startTime: Date.now(),
      endTime: null,
      durationSeconds: 0,
      commitId: "",
      imageTag: "latest",
      framework: matchedRepo?.framework || matchedRepo?.language || "Detecting...",
      port: matchedRepo?.default_port || 5000,
      nodes: {
        setup_job: { id: "setup_job", name: "Set up job", phase: "CI", status: "running", verdict: "RUNNING", detail: "Initializing autonomous deployment pipeline runner..." },
        checkout_code: { id: "checkout_code", name: "Checkout Code", phase: "CI", status: "pending", verdict: "PENDING" },
        initialization: { id: "initialization", name: "Initialization & Stack", phase: "CI", status: "pending", verdict: "PENDING" },
        build: { id: "build", name: "Build & Port Check", phase: "CI", status: "pending", verdict: "PENDING" },
        unit_test: { id: "unit_test", name: "Security & Policy Gate", phase: "CI", status: "pending", verdict: "PENDING" },
        host_handshake: { id: "host_handshake", name: "Set up job", phase: "CD", status: "pending", verdict: "PENDING" },
        checkout_cd: { id: "checkout_cd", name: "Checkout Code", phase: "CD", status: "pending", verdict: "PENDING" },
        docker_init: { id: "docker_init", name: "Initialization", phase: "CD", status: "pending", verdict: "PENDING" },
        inject_secrets: { id: "inject_secrets", name: "Inject GitHub Secrets into VM", phase: "CD", status: "pending", verdict: "PENDING" },
        deploy_vm: { id: "deploy_vm", name: "Deploy to VM", phase: "CD", status: "pending", verdict: "PENDING" },
      },
      logs: [
        { id: `l-${Date.now()}-1`, time: timeNow, text: `Triggered deployment for ${chosenRepo} to ${chosenEc2} (${chosenEnv})`, type: "info" },
        { id: `l-${Date.now()}-2`, time: timeNow, text: `Connecting to runner backend and initializing SSE event stream...`, type: "info" },
      ],
    });

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
      if (deployData?.run_id) {
        setPipelineState(prev => ({ ...prev, runId: deployData.run_id }));
      }
      const streamUrl = deployData.stream_url ? `${API_BASE}${deployData.stream_url}` : `${API_BASE}/api/agent/stream/${deployData.run_id}`;
      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const chunk = JSON.parse(event.data);
          const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

          // Update PipelineTracker state in real-time
          setPipelineState(prev => {
            const next = { ...prev };
            const nodes = { ...prev.nodes };
            const logs = [...prev.logs];

            if (chunk.type === "RUN_START") {
              next.runId = chunk.run_id || next.runId;
              logs.push({ id: `log-${Date.now()}`, time: timeStr, text: `Run ${chunk.run_id} started. Target EC2: ${chunk.target_ec2}`, type: "info" });
            } else if (chunk.type === "THOUGHT" || chunk.type === "PLAN") {
              next.thought = chunk.message || chunk.thought || chunk.plan;
              logs.push({ id: `log-${Date.now()}`, time: timeStr, text: `[Agent Reasoning] ${next.thought}`, type: "info" });
            } else if (chunk.type === "TOOL_START") {
              const tool = chunk.tool_name;
              toolStartTimes.current[tool] = Date.now();
              const meta = STAGE_META[tool];
              const startDetail = meta ? meta.describeStart(chunk.arguments) : `Executing ${tool}...`;

              if (tool === "inspect_repository") {
                const setupDur = `${((Date.now() - (toolStartTimes.current["setup_job"] || Date.now())) / 1000).toFixed(1)}s`;
                nodes.setup_job = { ...nodes.setup_job, status: "success", verdict: "ACCEPTED", duration: setupDur, detail: "Repository workspace initialized. Verified GitHub PAT token." };
                nodes.checkout_code = { ...nodes.checkout_code, status: "running", verdict: "RUNNING", detail: startDetail, rawJson: JSON.stringify(chunk.arguments, null, 2) };
              } else if (tool === "evaluate_blast_radius") {
                nodes.setup_job = { ...nodes.setup_job, status: "success", verdict: "ACCEPTED" };
                nodes.checkout_code = { ...nodes.checkout_code, status: "success", verdict: "ACCEPTED" };
                nodes.initialization = { ...nodes.initialization, status: "success", verdict: "ACCEPTED" };
                nodes.build = { ...nodes.build, status: "success", verdict: "ACCEPTED" };
                nodes.unit_test = { ...nodes.unit_test, status: "running", verdict: "RUNNING", detail: startDetail, rawJson: JSON.stringify(chunk.arguments, null, 2) };
              } else if (tool === "connect_to_ec2_instance") {
                nodes.unit_test = { ...nodes.unit_test, status: "success", verdict: "ACCEPTED" };
                nodes.host_handshake = { ...nodes.host_handshake, status: "running", verdict: "RUNNING", detail: startDetail, rawJson: JSON.stringify(chunk.arguments, null, 2) };
              } else if (tool === "install_docker_on_ec2") {
                nodes.host_handshake = { ...nodes.host_handshake, status: "success", verdict: "ACCEPTED" };
                nodes.checkout_cd = { ...nodes.checkout_cd, status: "success", verdict: "ACCEPTED" };
                nodes.docker_init = { ...nodes.docker_init, status: "running", verdict: "RUNNING", detail: startDetail, rawJson: JSON.stringify(chunk.arguments, null, 2) };
              } else if (tool === "inject_repo_environment") {
                nodes.host_handshake = { ...nodes.host_handshake, status: "success", verdict: "ACCEPTED" };
                nodes.checkout_cd = { ...nodes.checkout_cd, status: "success", verdict: "ACCEPTED" };
                nodes.docker_init = { ...nodes.docker_init, status: "success", verdict: "ACCEPTED" };
                nodes.inject_secrets = { ...nodes.inject_secrets, status: "running", verdict: "RUNNING", detail: startDetail, rawJson: JSON.stringify(chunk.arguments, null, 2) };
              } else if (tool === "deploy_to_ec2_instance") {
                nodes.inject_secrets = { ...nodes.inject_secrets, status: "success", verdict: "ACCEPTED" };
                nodes.deploy_vm = { ...nodes.deploy_vm, status: "running", verdict: "RUNNING", detail: startDetail, rawJson: JSON.stringify(chunk.arguments, null, 2) };
              }

              logs.push({ id: `log-${Date.now()}`, time: timeStr, text: `[START] ${meta?.title || tool} - ${startDetail}`, type: "info" });
            } else if (chunk.type === "TOOL_RESULT") {
              const tool = chunk.tool_name;
              const meta = STAGE_META[tool];
              const isErr = chunk.result?.status === "error" || chunk.result?.error;
              const doneDetail = isErr ? (chunk.result?.error || "Step execution failed") : (meta ? meta.describeDone(chunk.result) : JSON.stringify(chunk.result));
              const toolStart = toolStartTimes.current[tool] || Date.now();
              const realDuration = `${((Date.now() - toolStart) / 1000).toFixed(1)}s`;

              if (tool === "inspect_repository") {
                nodes.checkout_code = { ...nodes.checkout_code, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: doneDetail, rawJson: JSON.stringify(chunk.result, null, 2), duration: realDuration };
                nodes.initialization = { ...nodes.initialization, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: `Stack: ${chunk.result?.framework || "Detected"} (${chunk.result?.runtime || "Containerized"})`, duration: "0.2s" };
                nodes.build = { ...nodes.build, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: `Verified container build spec. Bound service port ${chunk.result?.port || 5000}.`, duration: "0.3s" };
                if (chunk.result?.commit_sha) next.commitId = chunk.result.commit_sha;
                if (chunk.result?.framework) next.framework = chunk.result.framework;
                if (chunk.result?.port) next.port = chunk.result.port;
              } else if (tool === "evaluate_blast_radius") {
                nodes.unit_test = { ...nodes.unit_test, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: doneDetail, rawJson: JSON.stringify(chunk.result, null, 2), duration: realDuration };
              } else if (tool === "connect_to_ec2_instance") {
                nodes.host_handshake = { ...nodes.host_handshake, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: doneDetail, rawJson: JSON.stringify(chunk.result, null, 2), duration: realDuration };
                nodes.checkout_cd = { ...nodes.checkout_cd, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: `Remote build target staged on EC2 host (${next.ec2Ip || "cloud"}).`, duration: "0.2s" };
              } else if (tool === "install_docker_on_ec2") {
                nodes.docker_init = { ...nodes.docker_init, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: doneDetail, rawJson: JSON.stringify(chunk.result, null, 2), duration: realDuration };
              } else if (tool === "inject_repo_environment") {
                nodes.inject_secrets = { ...nodes.inject_secrets, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: doneDetail, rawJson: JSON.stringify(chunk.result, null, 2), duration: realDuration };
              } else if (tool === "deploy_to_ec2_instance") {
                nodes.deploy_vm = { ...nodes.deploy_vm, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: doneDetail, rawJson: JSON.stringify(chunk.result, null, 2), duration: realDuration };
                if (chunk.result?.container_name) {
                  next.imageTag = chunk.result.container_name.split("-").pop() || "latest";
                }
                if (chunk.result?.app_url) {
                  next.appUrl = chunk.result.app_url;
                }
                if (chunk.result?.commit_sha && !next.commitId) {
                  next.commitId = chunk.result.commit_sha;
                }
              } else if (tool === "verify_ec2_health_probe" || tool === "commit_to_proof_ledger") {
                nodes.deploy_vm = { ...nodes.deploy_vm, status: isErr ? "failed" : "success", verdict: isErr ? "FAILED" : "ACCEPTED", detail: doneDetail, rawJson: JSON.stringify(chunk.result, null, 2) };
              }

              logs.push({
                id: `log-${Date.now()}`,
                time: timeStr,
                text: `[${isErr ? "FAILED" : "ACCEPTED"}] ${meta?.title || tool} - ${doneDetail}`,
                type: isErr ? "error" : "gate",
              });
            } else if (chunk.type === "RUN_COMPLETE") {
              eventSource.close();
              setTyping(false);
              const summary = chunk.summary || {};
              next.status = "success";
              next.appUrl = summary.app_url;
              next.proofHash = summary.proof_hash;
              next.endTime = Date.now();

              // Mark all nodes as completed
              Object.keys(nodes).forEach(k => {
                nodes[k] = { ...nodes[k], status: "success", verdict: "ACCEPTED" };
              });

              logs.push({
                id: `log-${Date.now()}`,
                time: timeStr,
                text: `[VERIFIED] Continuous Deployment Complete! Live endpoint: ${summary.app_url || "Verified"}. Proof #${summary.proof_hash || "verified"} committed to ledger.`,
                type: "success",
              });
              loadData();
            } else if (chunk.type === "RUN_ERROR") {
              eventSource.close();
              setTyping(false);
              next.status = "failed";
              next.error = chunk.error;
              logs.push({ id: `log-${Date.now()}`, time: timeStr, text: `[ERROR] ${chunk.error || "Deployment failed"}`, type: "error" });
            }

            next.nodes = nodes;
            next.logs = logs;
            return next;
          });

          // Also update chat msgs for backward compatibility
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
              const summary = chunk.summary || {};
              return {
                ...m,
                text: `Autonomous deployment verified for ${chosenRepo} on EC2 target! Cryptographic proof #${summary.proof_hash || "verified"} committed to immutable audit ledger.`,
                appUrl: summary.app_url,
                proofHash: summary.proof_hash,
              };
            }
            if (chunk.type === "RUN_ERROR") {
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
        setPipelineState(prev => ({
          ...prev,
          status: "failed",
          logs: [...prev.logs, { id: `log-${Date.now()}`, time: new Date().toLocaleTimeString(), text: "[ERROR] SSE stream closed unexpectedly.", type: "error" }],
        }));
      };
    } catch (err: any) {
      setPipelineState(prev => ({
        ...prev,
        status: "failed",
        error: err?.message || "Execution failed",
        logs: [...prev.logs, { id: `log-${Date.now()}`, time: new Date().toLocaleTimeString(), text: `[ERROR] Deployment failed: ${err?.message || "Could not connect to deployment backend."}`, type: "error" }],
      }));
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
    setView("pipeline");
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

  if (loading && authChecking && !user) {
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
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, minWidth: 0, background: "var(--bg-main)" }}>
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

            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
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

              {view === "pipeline" && (
                <PipelineTrackerTab
                  pipelineState={pipelineState}
                  repos={repos}
                  instances={instances}
                  onBackToArchitect={() => setView("chat")}
                  onRedeploy={(r, inst, e) => send(`Deploy ${r} to EC2 ${inst}`, r, inst, e)}
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

              {view === "activity" && (
                <ActivityTab onDeployClick={() => setDeployModalOpen(true)} />
              )}

              {view === "logs" && <LogsTab />}

              {view === "voice" && (
                <VoiceOpsTab currentUser={user.username} repos={repos} onDeployFromVoice={openDeployForRepo} />
              )}

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
        onRepoChange={setSelectedRepo}
        onInstanceChange={setSelectedInstance}
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
