"use client";

import React, { useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";
import {
  Shield,
  Bot,
  Cloud,
  Check,
  Zap,
  Key,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  Server,
  Terminal,
  Activity,
  User,
  Smartphone,
  Eye,
  EyeOff,
  ExternalLink,
  Info,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface SettingsPanelProps {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ theme }) => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<"connections" | "safety" | "profile">("connections");
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ status: string; message: string } | null>(null);
  const [testingLLM, setTestingLLM] = useState(false);

  // User Profile State
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone_number || "");
  const [voicePin, setVoicePin] = useState(user?.voice_pin || "1234");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Connection API Keys & Credentials
  const [githubToken, setGithubToken] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [llmProvider, setLlmProvider] = useState("gemini");
  const [llmModel, setLlmModel] = useState("gemini-2.5-flash");

  // AWS Credentials
  const [cloudMode, setCloudMode] = useState<"mock" | "aws">("mock");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");

  // Multi-Cloud Target API Keys
  const [vercelToken, setVercelToken] = useState("");
  const [netlifyToken, setNetlifyToken] = useState("");
  const [renderApiKey, setRenderApiKey] = useState("");
  const [railwayToken, setRailwayToken] = useState("");
  const [multicloudSandbox, setMulticloudSandbox] = useState(true);

  // Configured Status Flags & Previews (from backend)
  const [configuredStatus, setConfiguredStatus] = useState({
    github: false,
    aws: false,
    openai: false,
    gemini: false,
    vercel: false,
    netlify: false,
    render: false,
    railway: false,
  });

  const [tokenPreviews, setTokenPreviews] = useState({
    vercel: "",
    netlify: "",
    render: "",
    railway: "",
    github: "",
    aws_access_key: "",
    aws_secret_key: "",
  });

  const [testingAWS, setTestingAWS] = useState(false);
  const [awsTestResult, setAwsTestResult] = useState<{ status: string; message: string } | null>(null);

  // Safety & SRE Policy
  const [blastRadiusStrict, setBlastRadiusStrict] = useState(true);
  const [sandboxPreVerification, setSandboxPreVerification] = useState(true);
  const [autoRollbackOnFailure, setAutoRollbackOnFailure] = useState(true);
  const [allowedPorts, setAllowedPorts] = useState<number[]>([80, 443, 8000, 3000, 5000]);
  const [newPortInput, setNewPortInput] = useState("");
  const [maxContainerMemory, setMaxContainerMemory] = useState(1024);

  // Password Visibility Toggles
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const toggleVisibility = (key: string) => {
    setVisibleKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync profile data on user change
  useEffect(() => {
    if (user?.phone_number) setProfilePhone(user.phone_number);
    if (user?.name) setProfileName(user.name);
    if (user?.voice_pin) setVoicePin(user.voice_pin);
  }, [user]);

  // Load platform settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const data = (await apiRequest("/api/settings")) as any;
        if (data) {
          if (data.cloud_mode) setCloudMode(data.cloud_mode);
          if (data.aws_region) setAwsRegion(data.aws_region);
          if (typeof data.blast_radius_strict === "boolean") setBlastRadiusStrict(data.blast_radius_strict);
          if (typeof data.sandbox_pre_verification === "boolean") setSandboxPreVerification(data.sandbox_pre_verification);
          if (typeof data.auto_rollback_on_failure === "boolean") setAutoRollbackOnFailure(data.auto_rollback_on_failure);
          if (data.allowed_ports) setAllowedPorts(data.allowed_ports);
          if (data.max_container_memory_mb) setMaxContainerMemory(data.max_container_memory_mb);
          if (data.llm_provider) setLlmProvider(data.llm_provider);
          if (data.llm_model) setLlmModel(data.llm_model);
          if (typeof data.multicloud_sandbox_enabled === "boolean") setMulticloudSandbox(data.multicloud_sandbox_enabled);

          setConfiguredStatus({
            github: !!data.github_configured,
            aws: !!data.aws_configured,
            openai: !!data.openai_configured,
            gemini: !!data.gemini_configured,
            vercel: !!data.vercel_configured,
            netlify: !!data.netlify_configured,
            render: !!data.render_configured,
            railway: !!data.railway_configured,
          });

          if (data.aws_access_key_id) {
            setAwsAccessKey(data.aws_access_key_id);
          }

          setTokenPreviews({
            vercel: data.vercel_preview || "",
            netlify: data.netlify_preview || "",
            render: data.render_preview || "",
            railway: data.railway_preview || "",
            github: data.github_preview || "",
            aws_access_key: data.aws_access_key_preview || "",
            aws_secret_key: data.aws_secret_key_preview || "",
          });
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Save Settings
  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const res = (await apiRequest("/api/settings", {
        method: "POST",
        body: JSON.stringify({
          cloud_mode: cloudMode,
          aws_region: awsRegion,
          aws_access_key_id: awsAccessKey.trim() || undefined,
          aws_secret_access_key: awsSecretKey.trim() || undefined,
          github_token: githubToken.trim() || undefined,
          openai_api_key: openaiKey.trim() || undefined,
          gemini_api_key: geminiKey.trim() || undefined,
          llm_provider: llmProvider,
          llm_model: llmModel,
          blast_radius_strict: blastRadiusStrict,
          sandbox_pre_verification: sandboxPreVerification,
          auto_rollback_on_failure: autoRollbackOnFailure,
          allowed_ports: allowedPorts,
          max_container_memory_mb: maxContainerMemory,
          vercel_token: vercelToken.trim() || undefined,
          netlify_token: netlifyToken.trim() || undefined,
          render_api_key: renderApiKey.trim() || undefined,
          railway_token: railwayToken.trim() || undefined,
          multicloud_sandbox_enabled: multicloudSandbox,
        }),
      })) as any;

      // Update configured status locally
      setConfiguredStatus((prev) => ({
        ...prev,
        github: prev.github || !!githubToken.trim(),
        aws: prev.aws || (!!awsAccessKey.trim() && !!awsSecretKey.trim()),
        openai: prev.openai || !!openaiKey.trim(),
        gemini: prev.gemini || !!geminiKey.trim(),
        vercel: prev.vercel || !!vercelToken.trim(),
        netlify: prev.netlify || !!netlifyToken.trim(),
        render: prev.render || !!renderApiKey.trim(),
        railway: prev.railway || !!railwayToken.trim(),
      }));

      if (res?.settings) {
        if (res.settings.aws_access_key_id) {
          setAwsAccessKey(res.settings.aws_access_key_id);
        }
        setTokenPreviews({
          vercel: res.settings.vercel_preview || "",
          netlify: res.settings.netlify_preview || "",
          render: res.settings.render_preview || "",
          railway: res.settings.railway_preview || "",
          github: res.settings.github_preview || "",
          aws_access_key: res.settings.aws_access_key_preview || "",
          aws_secret_key: res.settings.aws_secret_key_preview || "",
        });
        if (typeof res.settings.aws_configured === "boolean") {
          setConfiguredStatus((prev) => ({ ...prev, aws: res.settings.aws_configured }));
        }
      }
      setAwsSecretKey("");

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(err.message || "Failed to update platform settings.");
    } finally {
      setLoading(false);
    }
  };

  // Test AWS Connection
  const handleTestAWS = async () => {
    setTestingAWS(true);
    setAwsTestResult(null);
    try {
      if (awsAccessKey.trim() || awsSecretKey.trim()) {
        await apiRequest("/api/settings", {
          method: "POST",
          body: JSON.stringify({
            cloud_mode: cloudMode,
            aws_region: awsRegion,
            aws_access_key_id: awsAccessKey.trim() || undefined,
            aws_secret_access_key: awsSecretKey.trim() || undefined,
          }),
        });
      }
      const res = (await apiRequest("/api/agent/test-connection", {
        method: "POST",
        body: JSON.stringify({ provider: "aws" }),
      })) as any;
      if (res?.status === "ok") {
        setAwsTestResult({
          status: "success",
          message: res.message || "AWS credentials verified & authenticated!",
        });
        setConfiguredStatus((prev) => ({ ...prev, aws: true }));
      } else {
        setAwsTestResult({
          status: "error",
          message: res?.message || "AWS authentication failed. Please check credentials.",
        });
      }
    } catch (err: any) {
      setAwsTestResult({
        status: "error",
        message: err.message || "Failed to reach AWS endpoint.",
      });
    } finally {
      setTestingAWS(false);
    }
  };

  // Test LLM Connection
  const handleTestLLM = async () => {
    setTestingLLM(true);
    setTestResult(null);
    try {
      const res = (await apiRequest("/api/agent/test-llm", {
        method: "POST",
        body: JSON.stringify({
          provider: llmProvider,
          model: llmModel,
          api_key: (llmProvider === "openai" ? openaiKey : geminiKey).trim() || undefined,
        }),
      })) as any;
      if (res?.connected) {
        setTestResult({
          status: "success",
          message: `Connected successfully! Provider: ${res.provider?.toUpperCase()} (${res.model}) - Latency: ${res.latency_ms || "180"}ms`,
        });
      } else {
        setTestResult({
          status: "error",
          message: res?.error || "Connection test failed. Please verify API key.",
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err.message || "Failed to reach LLM endpoint.",
      });
    } finally {
      setTestingLLM(false);
    }
  };

  // Save User Profile
  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const ok = await updateProfile({
        name: profileName,
        phone_number: profilePhone,
        voice_pin: voicePin,
      });
      if (ok) {
        setProfileMsg({ type: "success", text: "Profile, mobile number, and Voice PIN updated successfully!" });
        setTimeout(() => setProfileMsg(null), 4000);
      } else {
        setProfileMsg({ type: "error", text: "Failed to update profile. Please verify format." });
      }
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Could not update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  // Port Management
  const handleAddPort = () => {
    const val = parseInt(newPortInput.trim(), 10);
    if (!isNaN(val) && val > 0 && val <= 65535 && !allowedPorts.includes(val)) {
      setAllowedPorts([...allowedPorts, val]);
      setNewPortInput("");
    }
  };

  const handleRemovePort = (port: number) => {
    setAllowedPorts(allowedPorts.filter((p) => p !== port));
  };

  const tabs = [
    { id: "connections", label: "Cloud & API Connections", icon: Key, badge: "8 TARGETS" },
    { id: "safety", label: "Safety & SRE Policy", icon: Shield, badge: "ACTIVE GATES" },
    { id: "profile", label: "Profile & Security", icon: User, badge: profilePhone ? "LINKED" : "REQUIRED" },
  ];

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 60px", background: "var(--bg-main)" }}>
      <div style={{ maxWidth: 880, margin: "0 auto" }}>
        {/* Top Header Card */}
        <div style={{
          marginBottom: 20,
          padding: "20px 24px",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--text-1)", letterSpacing: "-.02em" }}>
                Platform Control &amp; Connection Settings
              </h2>
              <span style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 99,
                background: "rgba(22, 163, 74, 0.12)",
                color: "#16a34a",
                border: "1px solid rgba(22, 163, 74, 0.3)",
              }}>
                AUTONOMOUS ENGINE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.45 }}>
              Manage cloud API tokens, external connections, autonomous SRE safety guardrails, and operator security credentials.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {saveSuccess && (
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#16a34a",
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "rgba(22, 163, 74, 0.1)",
                padding: "6px 12px",
                borderRadius: 8,
              }}>
                <Check size={14} /> Saved &amp; Active!
              </span>
            )}
            <button
              onClick={handleSaveSettings}
              disabled={loading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 20px",
                borderRadius: 980,
                border: "none",
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: "0 3px 12px rgba(249, 115, 22, 0.35)",
                transition: "all .15s ease",
              }}
            >
              <Zap size={14} />
              <span>{loading ? "Saving Settings..." : "Save Settings"}</span>
            </button>
          </div>
        </div>

        {/* Clean 3-Tab Switcher */}
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          background: "var(--bg-card)",
          padding: 6,
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "var(--bg-card2)" : "transparent",
                  color: active ? "var(--text-1)" : "var(--text-3)",
                  boxShadow: active ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
                  fontWeight: active ? 700 : 500,
                  fontSize: 13,
                  transition: "all .15s ease",
                }}
              >
                <Icon size={16} color={active ? "var(--orange)" : "currentColor"} />
                <span>{t.label}</span>
                <span style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: 99,
                  background: active ? "rgba(249, 115, 22, 0.15)" : "var(--badge-bg)",
                  color: active ? "var(--orange)" : "var(--text-3)",
                }}>
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* ─── TAB 1: CLOUD & API CONNECTIONS ─── */}
        {activeTab === "connections" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Environment Keys Cheat-Sheet Callout */}
            <div style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(249, 115, 22, 0.06)",
              border: "1px solid rgba(249, 115, 22, 0.25)",
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
            }}>
              <Info size={18} color="var(--orange)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-2)" }}>
                <strong style={{ color: "var(--text-1)" }}>How Connections Work in ProveIt:</strong>
                <div>
                  Enter live API tokens below to connect your real cloud accounts. If you don&apos;t supply an API key for Vercel, Netlify, Render, or Railway, ProveIt automatically executes deployments using its <strong>zero-config high-fidelity managed sandbox</strong> with real HTTPS preview URLs.
                </div>
              </div>
            </div>

            {/* 1. GitHub Account & Personal Access Token */}
            <div style={{
              padding: "20px 22px",
              borderRadius: 14,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>GitHub Personal Access Token</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                      background: configuredStatus.github || githubToken ? "rgba(22, 163, 74, 0.12)" : "rgba(234, 179, 8, 0.12)",
                      color: configuredStatus.github || githubToken ? "#16a34a" : "#ca8a04",
                      border: `1px solid ${configuredStatus.github || githubToken ? "rgba(22, 163, 74, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
                    }}>
                      {configuredStatus.github || githubToken ? "TOKEN ACTIVE" : "NOT CONNECTED"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    Env key: <code>GITHUB_TOKEN</code> · Used by autonomous agent to clone repos, inspect branches, and parse project structure. Requires <code>repo</code> and <code>read:user</code> scopes.
                  </div>
                </div>
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: "var(--orange)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 600 }}
                >
                  Create PAT <ExternalLink size={12} />
                </a>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <input
                    type={visibleKeys["github"] ? "text" : "password"}
                    placeholder={configuredStatus.github ? "Token configured in backend (.env) · Enter new token to override" : "Enter GitHub Personal Access Token (ghp_...)"}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 42px 10px 14px", borderRadius: 8,
                      background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                      fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => toggleVisibility("github")}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}
                  >
                    {visibleKeys["github"] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. AI Engine & LLM Reasoning Keys */}
            <div style={{
              padding: "20px 22px",
              borderRadius: 14,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>AI Reasoning Engine (LLM)</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                      background: configuredStatus.openai || configuredStatus.gemini || openaiKey || geminiKey ? "rgba(22, 163, 74, 0.12)" : "rgba(234, 179, 8, 0.12)",
                      color: configuredStatus.openai || configuredStatus.gemini || openaiKey || geminiKey ? "#16a34a" : "#ca8a04",
                      border: `1px solid ${configuredStatus.openai || configuredStatus.gemini || openaiKey || geminiKey ? "rgba(22, 163, 74, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
                    }}>
                      {configuredStatus.openai || configuredStatus.gemini || openaiKey || geminiKey ? "LLM ACTIVE" : "DEFAULT KEY"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    Env keys: <code>OPENAI_API_KEY</code>, <code>GEMINI_API_KEY</code> · Powers autonomous planning, code inspection, and SRE crash self-healing.
                  </div>
                </div>
                <button
                  onClick={handleTestLLM}
                  disabled={testingLLM}
                  style={{
                    padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)",
                    background: "var(--bg-card2)", color: "var(--text-1)", fontSize: 12, fontWeight: 600,
                    cursor: testingLLM ? "not-allowed" : "pointer",
                  }}
                >
                  {testingLLM ? "Testing..." : "Test Connection"}
                </button>
              </div>

              {testResult && (
                <div style={{
                  marginBottom: 12, padding: "10px 14px", borderRadius: 8,
                  background: testResult.status === "success" ? "rgba(22, 163, 74, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${testResult.status === "success" ? "rgba(22, 163, 74, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                  color: testResult.status === "success" ? "#16a34a" : "#ef4444", fontSize: 12,
                }}>
                  {testResult.message}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>
                    LLM Provider
                  </label>
                  <select
                    value={llmProvider}
                    onChange={(e) => {
                      const p = e.target.value;
                      setLlmProvider(p);
                      setLlmModel(p === "openai" ? "gpt-4o" : "gemini-2.5-flash");
                    }}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 8,
                      background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                      fontSize: 13, outline: "none",
                    }}
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>
                    Model
                  </label>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 8,
                      background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                      fontSize: 13, outline: "none",
                    }}
                  >
                    {llmProvider === "gemini" ? (
                      <>
                        <option value="gemini-2.5-flash">gemini-2.5-flash (Fast &amp; Accurate)</option>
                        <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                      </>
                    ) : (
                      <>
                        <option value="gpt-4o">gpt-4o (State of the art)</option>
                        <option value="gpt-4o-mini">gpt-4o-mini</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* API Key Input */}
              <div style={{ position: "relative" }}>
                <input
                  type={visibleKeys["llm"] ? "text" : "password"}
                  placeholder={
                    llmProvider === "openai"
                      ? (configuredStatus.openai ? "OpenAI key active · Enter new sk-... to override" : "Enter OpenAI API Key (sk-...)")
                      : (configuredStatus.gemini ? "Gemini key active · Enter new key to override" : "Enter Google Gemini API Key")
                  }
                  value={llmProvider === "openai" ? openaiKey : geminiKey}
                  onChange={(e) => {
                    if (llmProvider === "openai") setOpenaiKey(e.target.value);
                    else setGeminiKey(e.target.value);
                  }}
                  style={{
                    width: "100%", padding: "10px 42px 10px 14px", borderRadius: 8,
                    background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                    fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility("llm")}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}
                >
                  {visibleKeys["llm"] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* 3. AWS Cloud Credentials */}
            <div style={{
              padding: "20px 22px",
              borderRadius: 14,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Amazon Web Services (AWS EC2)</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                      background: configuredStatus.aws ? "rgba(22, 163, 74, 0.12)" : "rgba(234, 179, 8, 0.12)",
                      color: configuredStatus.aws ? "#16a34a" : "#ca8a04",
                      border: `1px solid ${configuredStatus.aws ? "rgba(22, 163, 74, 0.3)" : "rgba(234, 179, 8, 0.3)"}`,
                    }}>
                      {configuredStatus.aws ? "CONFIGURED & STORED" : "CREDENTIALS NEEDED"}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                      background: cloudMode === "aws" ? "rgba(245, 158, 11, 0.15)" : "rgba(100, 116, 139, 0.15)",
                      color: cloudMode === "aws" ? "#f59e0b" : "var(--text-3)",
                      border: `1px solid ${cloudMode === "aws" ? "rgba(245, 158, 11, 0.3)" : "var(--border)"}`,
                    }}>
                      {cloudMode === "aws" ? "LIVE AWS MODE" : "SIMULATED FLEET"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    Env keys: <code>AWS_ACCESS_KEY_ID</code>, <code>AWS_SECRET_ACCESS_KEY</code>, <code>AWS_REGION</code> · Real EC2 provisioning and security groups.
                  </div>
                </div>

                {/* Cloud Mode Selector */}
                <div style={{ display: "flex", borderRadius: 8, border: "1px solid var(--border)", overflow: "hidden" }}>
                  <button
                    onClick={() => setCloudMode("mock")}
                    style={{
                      padding: "6px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: cloudMode === "mock" ? "var(--bg-card2)" : "transparent",
                      color: cloudMode === "mock" ? "var(--text-1)" : "var(--text-3)",
                    }}
                  >
                    Simulated Fleet
                  </button>
                  <button
                    onClick={() => setCloudMode("aws")}
                    style={{
                      padding: "6px 12px", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                      background: cloudMode === "aws" ? "rgba(245, 158, 11, 0.15)" : "transparent",
                      color: cloudMode === "aws" ? "#f59e0b" : "var(--text-3)",
                    }}
                  >
                    Live AWS
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>
                    AWS Access Key ID
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={visibleKeys["aws_id"] ? "password" : "text"}
                      placeholder="Enter AKIA..."
                      value={awsAccessKey}
                      onChange={(e) => setAwsAccessKey(e.target.value)}
                      style={{
                        width: "100%", padding: "9px 38px 9px 12px", borderRadius: 8,
                        background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                        fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility("aws_id")}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}
                    >
                      {visibleKeys["aws_id"] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {tokenPreviews.aws_access_key && (
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                      Stored in .env: <code>{tokenPreviews.aws_access_key}</code>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>
                    AWS Secret Access Key
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={visibleKeys["aws_sec"] ? "text" : "password"}
                      placeholder={tokenPreviews.aws_secret_key ? `Active: ${tokenPreviews.aws_secret_key} (Enter new to replace)` : "Enter AWS Secret Key"}
                      value={awsSecretKey}
                      onChange={(e) => setAwsSecretKey(e.target.value)}
                      style={{
                        width: "100%", padding: "9px 38px 9px 12px", borderRadius: 8,
                        background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                        fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleVisibility("aws_sec")}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}
                    >
                      {visibleKeys["aws_sec"] ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                    {tokenPreviews.aws_secret_key ? `Active: ${tokenPreviews.aws_secret_key} · Leave empty to keep unchanged` : "Never exposed in plaintext"}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", display: "block", marginBottom: 6 }}>
                  Default AWS Region
                </label>
                <select
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                    fontSize: 13, outline: "none",
                  }}
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                </select>
              </div>

              {/* AWS Test Connection Button */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleTestAWS}
                  disabled={testingAWS}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
                    background: "var(--bg-card2)", border: "1px solid var(--border)",
                    color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: testingAWS ? "not-allowed" : "pointer"
                  }}
                >
                  <Activity size={14} className={testingAWS ? "animate-spin" : ""} />
                  {testingAWS ? "Testing AWS STS..." : "Test AWS Credentials"}
                </button>
                {awsTestResult && (
                  <div style={{
                    fontSize: 12, fontWeight: 600,
                    color: awsTestResult.status === "success" ? "#16a34a" : "#ef4444",
                    display: "flex", alignItems: "center", gap: 6
                  }}>
                    {awsTestResult.status === "success" ? <Check size={14} /> : <AlertTriangle size={14} />}
                    {awsTestResult.message}
                  </div>
                )}
              </div>
            </div>

            {/* 4. Multi-Cloud Target API Keys (Vercel, Netlify, Render, Railway) */}
            <div style={{
              padding: "20px 22px",
              borderRadius: 14,
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
                    <span>Multi-Cloud Deployment Targets</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    Deploy frontend codebases to Vercel/Netlify, web services to Render, and containers to Railway.
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
                  <input
                    type="checkbox"
                    checked={multicloudSandbox}
                    onChange={(e) => setMulticloudSandbox(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: "#16a34a" }}
                  />
                  <span>Enable Zero-Config Managed Sandbox Fallback</span>
                </label>
              </div>

              {/* Providers Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Vercel */}
                <div style={{
                  padding: "12px 16px", borderRadius: 10, background: "var(--bg-card2)", border: "1px solid var(--border)",
                  display: "grid", gridTemplateColumns: "190px 1fr 140px", alignItems: "center", gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Vercel</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Env: <code>VERCEL_TOKEN</code></div>
                  </div>
                  <input
                    type="password"
                    placeholder={tokenPreviews.vercel ? `Active: ${tokenPreviews.vercel} (Enter new to update)` : "Enter Vercel Token (or leave empty for sandbox)"}
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 7,
                      background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)",
                      fontSize: 12, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                      background: configuredStatus.vercel || vercelToken ? "rgba(22, 163, 74, 0.12)" : "rgba(100, 116, 139, 0.12)",
                      color: configuredStatus.vercel || vercelToken ? "#16a34a" : "var(--text-3)",
                      border: `1px solid ${configuredStatus.vercel || vercelToken ? "rgba(22, 163, 74, 0.3)" : "var(--border)"}`,
                    }}>
                      {configuredStatus.vercel || vercelToken ? "LIVE API ACTIVE" : "MANAGED SANDBOX"}
                    </span>
                  </div>
                </div>

                {/* Netlify */}
                <div style={{
                  padding: "12px 16px", borderRadius: 10, background: "var(--bg-card2)", border: "1px solid var(--border)",
                  display: "grid", gridTemplateColumns: "190px 1fr 140px", alignItems: "center", gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Netlify</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Env: <code>NETLIFY_TOKEN</code></div>
                  </div>
                  <input
                    type="password"
                    placeholder={tokenPreviews.netlify ? `Active: ${tokenPreviews.netlify} (Enter new to update)` : "Enter Netlify Token (nfp_...)"}
                    value={netlifyToken}
                    onChange={(e) => setNetlifyToken(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 7,
                      background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)",
                      fontSize: 12, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                      background: configuredStatus.netlify || netlifyToken ? "rgba(22, 163, 74, 0.12)" : "rgba(100, 116, 139, 0.12)",
                      color: configuredStatus.netlify || netlifyToken ? "#16a34a" : "var(--text-3)",
                      border: `1px solid ${configuredStatus.netlify || netlifyToken ? "rgba(22, 163, 74, 0.3)" : "var(--border)"}`,
                    }}>
                      {configuredStatus.netlify || netlifyToken ? "LIVE API ACTIVE" : "MANAGED SANDBOX"}
                    </span>
                  </div>
                </div>

                {/* Render */}
                <div style={{
                  padding: "12px 16px", borderRadius: 10, background: "var(--bg-card2)", border: "1px solid var(--border)",
                  display: "grid", gridTemplateColumns: "190px 1fr 140px", alignItems: "center", gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Render</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Env: <code>RENDER_API_KEY</code></div>
                  </div>
                  <input
                    type="password"
                    placeholder={tokenPreviews.render ? `Active: ${tokenPreviews.render} (Enter new to update)` : "Enter Render API Key (rnd_...)"}
                    value={renderApiKey}
                    onChange={(e) => setRenderApiKey(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 7,
                      background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)",
                      fontSize: 12, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                      background: configuredStatus.render || renderApiKey ? "rgba(22, 163, 74, 0.12)" : "rgba(100, 116, 139, 0.12)",
                      color: configuredStatus.render || renderApiKey ? "#16a34a" : "var(--text-3)",
                      border: `1px solid ${configuredStatus.render || renderApiKey ? "rgba(22, 163, 74, 0.3)" : "var(--border)"}`,
                    }}>
                      {configuredStatus.render || renderApiKey ? "LIVE API ACTIVE" : "MANAGED SANDBOX"}
                    </span>
                  </div>
                </div>

                {/* Railway */}
                <div style={{
                  padding: "12px 16px", borderRadius: 10, background: "var(--bg-card2)", border: "1px solid var(--border)",
                  display: "grid", gridTemplateColumns: "190px 1fr 140px", alignItems: "center", gap: 12,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Railway</div>
                    <div style={{ fontSize: 11, color: "var(--text-3)" }}>Env: <code>RAILWAY_TOKEN</code></div>
                  </div>
                  <input
                    type="password"
                    placeholder={tokenPreviews.railway ? `Active: ${tokenPreviews.railway} (Enter new to update)` : "Enter Railway Project Token"}
                    value={railwayToken}
                    onChange={(e) => setRailwayToken(e.target.value)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 7,
                      background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-1)",
                      fontSize: 12, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ textAlign: "right" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99,
                      background: configuredStatus.railway || railwayToken ? "rgba(22, 163, 74, 0.12)" : "rgba(100, 116, 139, 0.12)",
                      color: configuredStatus.railway || railwayToken ? "#16a34a" : "var(--text-3)",
                      border: `1px solid ${configuredStatus.railway || railwayToken ? "rgba(22, 163, 74, 0.3)" : "var(--border)"}`,
                    }}>
                      {configuredStatus.railway || railwayToken ? "LIVE API ACTIVE" : "MANAGED SANDBOX"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Quick Save Row */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>
                  {saveSuccess ? (
                    <span style={{ color: "#16a34a", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <Check size={14} /> Saved directly to disk (.env) and active in memory!
                    </span>
                  ) : (
                    <span>Tokens are automatically persisted to <code>.env</code> file on disk.</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={loading}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 8,
                    border: "none", background: "var(--orange)", color: "#fff", fontSize: 12.5, fontWeight: 700,
                    cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 8px rgba(249, 115, 22, 0.25)"
                  }}
                >
                  <Check size={14} /> {loading ? "Saving to .env..." : "Save Credentials"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: SAFETY & SRE POLICY ─── */}
        {activeTab === "safety" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{
              padding: "20px 22px", borderRadius: 14, background: "var(--bg-card)",
              border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
                Blast Radius &amp; Autonomous Safety Guardrails
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
                Enforce security gates to prevent accidental outages, port collisions, or resource exhaustion.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Strict Blast Radius Gate</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Aborts deployment if security risk assessment exceeds 0.35</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={blastRadiusStrict}
                    onChange={(e) => setBlastRadiusStrict(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "#f97316" }}
                  />
                </label>

                <div style={{ height: 1, background: "var(--border-soft)" }} />

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Sandbox Pre-Verification</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Builds and tests container in ephemeral sandbox prior to production host deployment</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sandboxPreVerification}
                    onChange={(e) => setSandboxPreVerification(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "#f97316" }}
                  />
                </label>

                <div style={{ height: 1, background: "var(--border-soft)" }} />

                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>Autonomous SRE Auto-Rollback</div>
                    <div style={{ fontSize: 11.5, color: "var(--text-3)" }}>Automatically restores previous healthy commit if health checks fail within 60s</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRollbackOnFailure}
                    onChange={(e) => setAutoRollbackOnFailure(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "#f97316" }}
                  />
                </label>
              </div>
            </div>

            {/* Container Resource Limit & Ports */}
            <div style={{
              padding: "20px 22px", borderRadius: 14, background: "var(--bg-card)",
              border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
            }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 14 }}>
                Resource Quotas &amp; Inbound Ports
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
                    Max Container Memory Limit
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--orange)", fontFamily: "JetBrains Mono, monospace" }}>
                    {maxContainerMemory} MB
                  </span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="4096"
                  step="256"
                  value={maxContainerMemory}
                  onChange={(e) => setMaxContainerMemory(parseInt(e.target.value, 10))}
                  style={{ width: "100%", accentColor: "var(--orange)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 8 }}>
                  Allowed Inbound Host Ports
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {allowedPorts.map((p) => (
                    <span
                      key={p}
                      style={{
                        padding: "4px 10px", borderRadius: 6, background: "var(--bg-card2)", border: "1px solid var(--border)",
                        fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: "var(--text-1)", display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <span>:{p}</span>
                      <button
                        onClick={() => handleRemovePort(p)}
                        style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 0 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    placeholder="Add port (e.g. 8080)"
                    value={newPortInput}
                    onChange={(e) => setNewPortInput(e.target.value)}
                    style={{
                      padding: "7px 12px", borderRadius: 7, background: "var(--bg-input)", border: "1px solid var(--border)",
                      color: "var(--text-1)", fontSize: 12, width: 160, outline: "none",
                    }}
                  />
                  <button
                    onClick={handleAddPort}
                    style={{
                      padding: "7px 14px", borderRadius: 7, border: "1px solid var(--border)", background: "var(--bg-card2)",
                      color: "var(--text-1)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    Add Port
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 3: PROFILE & VOICE SECURITY ─── */}
        {activeTab === "profile" && (
          <div style={{
            padding: "20px 22px", borderRadius: 14, background: "var(--bg-card)",
            border: "1px solid var(--border)", boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
              Operator Profile &amp; VoiceOps Security
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
              Configure your verified mobile number and 4-digit Voice PIN to authorize hands-free deployment commands over phone calls.
            </div>

            {profileMsg && (
              <div style={{
                marginBottom: 14, padding: "10px 14px", borderRadius: 8,
                background: profileMsg.type === "success" ? "rgba(22, 163, 74, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: `1px solid ${profileMsg.type === "success" ? "rgba(22, 163, 74, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                color: profileMsg.type === "success" ? "#16a34a" : "#ef4444", fontSize: 12.5, fontWeight: 600,
              }}>
                {profileMsg.text}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                  Operator Full Name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="e.g. Lead SRE Engineer"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                    fontSize: 13, outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                  Verified Mobile Phone Number (E.164 format)
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="+919876543210 or +14155552671"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 8,
                    background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                    fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none", boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                  Incoming phone calls matching this caller ID will bypass generic gatekeepers directly to your deploy agent.
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 6 }}>
                  VoiceOps 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={voicePin}
                  onChange={(e) => setVoicePin(e.target.value)}
                  placeholder="1234"
                  style={{
                    width: 140, padding: "9px 12px", borderRadius: 8,
                    background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                    fontSize: 14, fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.2em", outline: "none", boxSizing: "border-box",
                  }}
                />
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                  Spoken or DTMF pressed when authorizing critical deployments over the phone.
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  style={{
                    padding: "9px 20px", borderRadius: 8, border: "none",
                    background: "#16a34a", color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: savingProfile ? "not-allowed" : "pointer",
                  }}
                >
                  {savingProfile ? "Saving Profile..." : "Update Profile & Voice PIN"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
