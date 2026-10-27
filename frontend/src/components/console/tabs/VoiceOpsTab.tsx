import React, { useState, useEffect, useCallback } from "react";
import { RepoItem, API_BASE } from "../types";
import { I } from "../icons";
import { useAuth } from "@/context/AuthContext";

export const VoiceOpsTab = ({
  currentUser,
  repos,
  onDeployFromVoice,
}: {
  currentUser: string;
  repos: RepoItem[];
  onDeployFromVoice?: (repo: string) => void;
}) => {
  const { user, updateProfile } = useAuth();
  const [statusData, setStatusData] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [savingMobile, setSavingMobile] = useState(false);
  const [mobileMsg, setMobileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [toggling, setToggling] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);

  const fetchStatusAndLogs = useCallback(async () => {
    try {
      const usernameParam = currentUser ? `?username=${encodeURIComponent(currentUser)}` : "";
      const [sRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/api/voice/status${usernameParam}`),
        fetch(`${API_BASE}/api/voice/logs`),
      ]);
      const sData = await sRes.json();
      const lData = await lRes.json();
      setStatusData(sData);
      
      const resolved = user?.phone_number || sData.user_phone || sData.demo_user_phone || "";
      if (resolved && resolved !== "+919876543210") {
        setPhoneNumber(resolved);
      }
      if (typeof sData.voice_enabled === "boolean") {
        setVoiceEnabled(sData.voice_enabled);
      }
      if (Array.isArray(lData)) setLogs(lData);
    } catch { }
  }, [currentUser, user?.phone_number]);

  useEffect(() => {
    fetchStatusAndLogs();
  }, [fetchStatusAndLogs]);

  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumber(user.phone_number);
    }
    if (typeof user?.voice_enabled === "boolean") {
      setVoiceEnabled(user.voice_enabled);
    }
  }, [user]);

  // Toggle Sarvam VoiceOps
  const handleToggleVoiceOps = async () => {
    const nextVal = !voiceEnabled;
    setToggling(true);
    try {
      setVoiceEnabled(nextVal);
      await fetch(`${API_BASE}/api/voice/profile/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser || "admin",
          voice_enabled: nextVal,
        }),
      });
      if (updateProfile) {
        await updateProfile({ voice_enabled: nextVal });
      }
      fetchStatusAndLogs();
    } catch {
      setVoiceEnabled(!nextVal);
    } finally {
      setToggling(false);
    }
  };

  // Save User Mobile Number
  const handleSaveMobile = async () => {
    if (!phoneNumber.trim()) {
      setMobileMsg({ type: "error", text: "Please enter a valid mobile number." });
      return;
    }
    setSavingMobile(true);
    setMobileMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/voice/profile/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser || "admin",
          phone_number: phoneNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to save mobile number.");
      if (updateProfile) {
        await updateProfile({ phone_number: phoneNumber });
      }
      setMobileMsg({ type: "success", text: `Mobile number ${phoneNumber} linked successfully!` });
      setTimeout(() => setMobileMsg(null), 3500);
      fetchStatusAndLogs();
    } catch (err: any) {
      setMobileMsg({ type: "error", text: err.message || "Failed to update mobile number." });
    } finally {
      setSavingMobile(false);
    }
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Top Banner */}
      <div style={{
        padding: "20px 24px", borderRadius: 14,
        background: "var(--bg-card)",
        border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 12,
            background: voiceEnabled ? "var(--orange)" : "var(--border)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            transition: "all .2s ease"
          }}>
            <I.Phone />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Sarvam AI VoiceOps & Telephony Agent</span>
              <span style={{
                fontSize: 10,
                background: voiceEnabled ? "rgba(22, 163, 74, 0.12)" : "rgba(115, 115, 115, 0.12)",
                color: voiceEnabled ? "#16a34a" : "var(--text-3)",
                border: `1px solid ${voiceEnabled ? "rgba(22, 163, 74, 0.25)" : "var(--border)"}`,
                padding: "2px 8px", borderRadius: 10, fontWeight: 700
              }}>
                {voiceEnabled ? "VOICEOPS ACTIVE" : "VOICEOPS PAUSED"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
              Deploy applications directly to AWS EC2 via cellular phone call with Caller ID lookup, protected PIN authentication, and Sarvam STT/TTS.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            padding: "8px 14px", borderRadius: 10, background: "var(--bg-card2)",
            border: "1px solid var(--border)", textAlign: "right"
          }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>Telephony Hotline</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--orange)", fontFamily: "JetBrains Mono, monospace" }}>
              {statusData?.telephony_agent_phone || "+91 80 4736 1820"}
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Card: VoiceOps Toggle, User Mobile Number Input & 4-Digit PIN */}
      <div style={{
        padding: "24px", borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: 22
      }}>
        {/* Toggle Switch */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14,
          paddingBottom: 20, borderBottom: "1px solid var(--border)"
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Use Sarvam AI VoiceOps</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                background: voiceEnabled ? "rgba(22, 163, 74, 0.1)" : "rgba(115, 115, 115, 0.1)",
                color: voiceEnabled ? "#16a34a" : "var(--text-3)",
                border: `1px solid ${voiceEnabled ? "rgba(22, 163, 74, 0.25)" : "var(--border)"}`
              }}>
                {voiceEnabled ? "ACTIVE" : "DISABLED"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
              Toggle to enable or disable incoming phone calls and automated voice operations for your account.
            </div>
          </div>

          <button
            onClick={handleToggleVoiceOps}
            disabled={toggling}
            aria-label="Toggle Sarvam VoiceOps"
            style={{
              width: 56, height: 30, borderRadius: 99,
              background: voiceEnabled ? "#16a34a" : "var(--border)",
              border: "none", cursor: toggling ? "not-allowed" : "pointer",
              position: "relative", transition: "background .2s ease",
              padding: 3, display: "flex", alignItems: "center",
              boxShadow: voiceEnabled ? "0 2px 8px rgba(22, 163, 74, 0.3)" : "none"
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: "#ffffff",
              transform: voiceEnabled ? "translateX(26px)" : "translateX(0px)",
              transition: "transform .2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
            }} />
          </button>
        </div>

        {/* User Mobile Number Input (ONLY Input on this page) */}
        <div style={{
          padding: "20px 24px", borderRadius: 12, background: "var(--bg-card2)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 14
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
                <I.Phone />
                <span>Your Mobile Number (Caller ID)</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 4, lineHeight: 1.4 }}>
                When someone calls the agent hotline, the Sarvam AI voice agent matches their incoming Caller ID against this number to look up your account.
              </div>
            </div>

            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
              background: phoneNumber ? "rgba(22, 163, 74, 0.12)" : "rgba(239, 68, 68, 0.12)",
              color: phoneNumber ? "#16a34a" : "#ef4444",
              border: `1px solid ${phoneNumber ? "rgba(22, 163, 74, 0.25)" : "rgba(239, 68, 68, 0.25)"}`
            }}>
              {phoneNumber ? "CALLER ID CONFIGURED" : "NO MOBILE LINKED"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", maxWidth: 540 }}>
            <input
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="Enter mobile number (e.g. +91 77998 26164)"
              style={{
                flex: 1, padding: "11px 16px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                fontSize: 14, fontFamily: "JetBrains Mono, monospace", fontWeight: 600, outline: "none"
              }}
            />

            <button
              onClick={handleSaveMobile}
              disabled={savingMobile}
              style={{
                padding: "11px 22px", borderRadius: 8, border: "none", background: "var(--orange)",
                color: "#fff", fontSize: 13, fontWeight: 700, cursor: savingMobile ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(249, 115, 22, 0.25)"
              }}
            >
              {savingMobile ? <I.Loader /> : <I.Check />}
              <span>{savingMobile ? "Saving…" : "Save Mobile"}</span>
            </button>
          </div>

          {mobileMsg && (
            <div style={{
              fontSize: 12, fontWeight: 600,
              color: mobileMsg.type === "success" ? "var(--green)" : "var(--red)"
            }}>
              {mobileMsg.text}
            </div>
          )}
        </div>

        {/* Security Rule Card */}
        <div style={{
          padding: "14px 18px", borderRadius: 10, background: "rgba(22, 163, 74, 0.06)",
          border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{ color: "#16a34a", fontSize: 18 }}>
            <I.Shield />
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--text-1)" }}>Two-Tier Voice Security & Non-Autonomous Policy:</strong> Whenever anyone calls the hotline, the agent checks the incoming phone number against your linked mobile. Account details are protected and only spoken after the 4-digit password is provided. The user can also state a repository name to deploy—the agent verifies its presence in GitHub and asks the user for explicit confirmation (e.g. creating an EC2 instance and deploying) before taking any action.
          </div>
        </div>
      </div>

      {/* Section 2: Incoming Voice Call History & Telemetry Log */}
      <div style={{ padding: 22, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)" }}>Incoming Voice Call History & Telemetry</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Record of caller IDs, PIN verifications, transcripts, and autonomous deployments.</div>
          </div>
          <button onClick={fetchStatusAndLogs} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 6, background: "var(--badge-bg)", border: "1px solid var(--border)", color: "var(--text-2)", fontSize: 11.5, cursor: "pointer" }}>
            <I.Refresh /> Refresh Calls
          </button>
        </div>

        {logs.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--text-3)", fontSize: 12.5 }}>
            No voice calls logged yet. Dial the hotline (+91 80 4736 1820) to connect with your Sarvam voice agent.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {logs.map(lg => (
              <div key={lg.id || lg.call_sid} style={{
                padding: "10px 14px", borderRadius: 8, background: "var(--bg-card2)", border: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)", fontFamily: "JetBrains Mono, monospace" }}>
                      {lg.caller_phone}
                    </span>
                    <span style={{
                      fontSize: 10, padding: "1px 6px", borderRadius: 10, fontWeight: 700,
                      background: lg.pin_verified ? "var(--green-bg)" : "var(--red-bg)",
                      color: lg.pin_verified ? "var(--green)" : "var(--red)",
                    }}>
                      {lg.pin_verified ? "PIN Verified ✓" : "Unauthorized"}
                    </span>
                    {lg.matched_repo && (
                      <span style={{ fontSize: 11, color: "var(--orange)", fontWeight: 600 }}>
                        {lg.matched_repo}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 3 }}>
                    &ldquo;{lg.transcript || "No transcript"}&rdquo;
                  </div>
                </div>

                <div style={{ textAlign: "right", fontSize: 11, color: "var(--text-3)" }}>
                  <div>{lg.deployment_run_id ? `Run #${lg.deployment_run_id}` : lg.status}</div>
                  <div>{lg.created_at ? new Date(lg.created_at).toLocaleTimeString() : "Just now"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
