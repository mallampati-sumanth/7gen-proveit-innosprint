import React, { useState, useEffect, useCallback } from "react";
import { RepoItem, API_BASE } from "../types";
import { I } from "../icons";

export const VoiceOpsTab = ({
  currentUser,
  repos,
  onDeployFromVoice,
}: {
  currentUser: string;
  repos: RepoItem[];
  onDeployFromVoice?: (repo: string) => void;
}) => {
  const [statusData, setStatusData] = useState<any>(null);
  const [phoneNumber, setPhoneNumber] = useState("+919876543210");
  const [voicePin, setVoicePin] = useState("1234");
  const [linking, setLinking] = useState(false);
  const [linkMsg, setLinkMsg] = useState<string | null>(null);

  // Simulator state
  const [simPhone, setSimPhone] = useState("+919876543210");
  const [simPin, setSimPin] = useState("1234");
  const [simPrompt, setSimPrompt] = useState("Deploy pallets/flask to new EC2 instance on AWS");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);

  const fetchStatusAndLogs = useCallback(async () => {
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`${API_BASE}/api/voice/status`),
        fetch(`${API_BASE}/api/voice/logs`),
      ]);
      const sData = await sRes.json();
      const lData = await lRes.json();
      setStatusData(sData);
      if (sData.demo_user_phone) {
        setPhoneNumber(sData.demo_user_phone);
        setSimPhone(sData.demo_user_phone);
      }
      if (sData.demo_user_pin) {
        setVoicePin(sData.demo_user_pin);
        setSimPin(sData.demo_user_pin);
      }
      if (Array.isArray(lData)) setLogs(lData);
    } catch { }
  }, []);

  useEffect(() => {
    fetchStatusAndLogs();
  }, [fetchStatusAndLogs]);

  const handleLinkPhone = async () => {
    setLinking(true);
    setLinkMsg(null);
    try {
      const res = await fetch(`${API_BASE}/api/voice/profile/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: currentUser || "admin",
          phone_number: phoneNumber,
          voice_pin: voicePin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to link phone.");
      setLinkMsg(`Success: Linked phone ${data.phone_number} with PIN ${data.voice_pin}!`);
      fetchStatusAndLogs();
    } catch (err: any) {
      setLinkMsg(`Error: ${err.message}`);
    } finally {
      setLinking(false);
    }
  };

  const handleSimulateCall = async () => {
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/voice/simulate-call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caller_phone: simPhone,
          pin: simPin,
          spoken_prompt: simPrompt,
        }),
      });
      const data = await res.json();
      setSimResult(data);
      fetchStatusAndLogs();
    } catch (err: any) {
      setSimResult({ status: "ERROR", message: err.message });
    } finally {
      setSimulating(false);
    }
  };

  const sarvamSystemPrompt = `You are ProveIt Voice Agent, an autonomous cloud DevOps phone agent powered by Sarvam AI.
You receive telephone calls from verified engineers to deploy applications onto AWS EC2 cloud infrastructure.

WORKFLOW:
1. GREETING & AUTHENTICATION:
   - When a call connects, identify caller by their Caller ID phone number.
   - Request their 4-digit deployment PIN: "Welcome to ProveIt! Please speak or enter your 4-digit deployment PIN."
   - If PIN is incorrect, say: "Security PIN not recognized. Please check your ProveIt dashboard."
   - If PIN is correct, say: "Authentication verified! Welcome [User]. Which repository would you like to deploy?"

2. REPOSITORY & INTENT DETECTION:
   - Listen to the user's spoken command (e.g. "Deploy my flask repo" or "Host my fastapi app on AWS").
   - Match the spoken name against their active connected repositories.
   - Confirm target cloud environment: production / staging.

3. AUTONOMOUS ACTION:
   - Call the webhook tool: deploy_repository(repo_name, target_ec2="NEW_INSTANCE")
   - Respond with confirmation: "Launching a fresh AWS EC2 instance and deploying [repo] now. Live health probe and SHA-256 cryptographic ledger proof are running. An SMS with your live URL will be sent shortly."

TONE & STYLE:
- Clear, professional, concise, and natural Indian-English voice (using Sarvam Bulbul 'meera' speaker).
- Avoid lengthy explanations; keep phone responses under 2-3 sentences.`;

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
            background: "var(--orange)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>
            <I.Phone />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <span>Sarvam AI VoiceOps & Telephony Agent</span>
              <span style={{ fontSize: 10, background: "#16a34a", color: "#ffffff", padding: "2px 8px", borderRadius: 10, fontWeight: 700 }}>
                ACTIVE WEBHOOK
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
              Deploy applications directly to AWS EC2 via phone call with Caller ID authentication and Sarvam STT/TTS.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            padding: "8px 14px", borderRadius: 10, background: "var(--bg-card)",
            border: "1px solid var(--border)", textAlign: "right"
          }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 700, textTransform: "uppercase" }}>Agent Phone Number</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--orange)", fontFamily: "JetBrains Mono, monospace" }}>
              {statusData?.telephony_agent_phone || "+91 80 4736 1820"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {/* Section 1: Phone Linking & 4-Digit Voice PIN */}
        <div style={{
          padding: 22, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 14
        }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <I.Key />
              <span>1. Caller ID & Voice PIN Authentication</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              Bind your personal mobile number to your ProveIt account and set your 4-digit deployment PIN.
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, display: "block" }}>
              Your Mobile Number (Caller ID)
            </label>
            <input
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="+919876543210"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                fontSize: 13, fontFamily: "JetBrains Mono, monospace", outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, display: "block" }}>
              4-Digit Deployment Voice PIN (DTMF Security)
            </label>
            <input
              type="text"
              maxLength={4}
              value={voicePin}
              onChange={e => setVoicePin(e.target.value)}
              placeholder="1234"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                fontSize: 14, fontFamily: "JetBrains Mono, monospace", letterSpacing: ".2em", outline: "none"
              }}
            />
          </div>

          {linkMsg && (
            <div style={{
              padding: "9px 12px", borderRadius: 8, fontSize: 12,
              background: linkMsg.startsWith("Success") ? "var(--green-bg)" : "var(--red-bg)",
              color: linkMsg.startsWith("Success") ? "var(--green)" : "var(--red)",
              border: `1px solid ${linkMsg.startsWith("Success") ? "var(--green)" : "var(--red)"}`
            }}>
              {linkMsg}
            </div>
          )}

          <button
            onClick={handleLinkPhone}
            disabled={linking}
            style={{
              padding: "10px", borderRadius: 8, border: "none", background: "var(--orange)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: linking ? "not-allowed" : "pointer"
            }}
          >
            {linking ? "Updating Account…" : "Save & Verify Mobile Binding"}
          </button>
        </div>

        {/* Section 2: Interactive Voice Call Simulator */}
        <div style={{
          padding: 22, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--orange-border)",
          display: "flex", flexDirection: "column", gap: 14
        }}>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", display: "flex", alignItems: "center", gap: 8 }}>
              <I.Zap />
              <span>2. Interactive Voice Call Simulator</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              Simulate an incoming phone call and test the Sarvam AI voice agent pipeline without dialing.
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, display: "block" }}>Caller Phone</label>
              <input
                value={simPhone}
                onChange={e => setSimPhone(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", outline: "none" }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", marginBottom: 4, display: "block" }}>PIN Entered</label>
              <input
                value={simPin}
                onChange={e => setSimPin(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 12.5, fontFamily: "JetBrains Mono, monospace", outline: "none" }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-2)", marginBottom: 5, display: "block" }}>
              Spoken Voice Utterance (Simulated Voice Input)
            </label>
            <input
              value={simPrompt}
              onChange={e => setSimPrompt(e.target.value)}
              placeholder="e.g. Deploy my flask repository to a new AWS EC2 instance"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 8,
                background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                fontSize: 12.5, outline: "none"
              }}
            />
          </div>

          <button
            onClick={handleSimulateCall}
            disabled={simulating}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px", borderRadius: 8, border: "none", background: "var(--orange)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: simulating ? "not-allowed" : "pointer"
            }}
          >
            {simulating ? <><I.Loader /> Connecting Call & Synthesizing Voice…</> : <><I.Phone /> Simulate Incoming Phone Call</>}
          </button>

          {simResult && (
            <div style={{
              padding: "12px 14px", borderRadius: 10,
              background: simResult.status === "SUCCESS" ? "rgba(34, 197, 94, 0.06)" : "rgba(239, 68, 68, 0.06)",
              border: `1px solid ${simResult.status === "SUCCESS" ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
              display: "flex", flexDirection: "column", gap: 6, fontSize: 12
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: simResult.status === "SUCCESS" ? "var(--green)" : "var(--red)" }}>
                  Call {simResult.status}: {simResult.call_sid}
                </span>
                {simResult.deployment_run_id && (
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "var(--orange)" }}>
                    #{simResult.deployment_run_id}
                  </span>
                )}
              </div>
              <div style={{ color: "var(--text-2)", lineHeight: 1.5 }}>
                {simResult.agent_spoken_reply || simResult.message}
              </div>
              {simResult.matched_repo && (
                <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>
                  Target Repo: <strong style={{ color: "var(--text-1)" }}>{simResult.matched_repo}</strong> ➔ Target EC2: <strong style={{ color: "var(--green)" }}>Provisioned New AWS Node</strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Call History & Telemetry Log */}
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
            No voice calls logged yet. Use the simulator above or dial into the agent phone number to test.
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

      {/* Section 4: Sarvam AI Voice Agent Prompt & Setup */}
      <div style={{ padding: 22, borderRadius: 14, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
          Sarvam AI Voice Agent Setup Guide & System Prompt
        </div>
        <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
          Copy this exact system prompt and webhook configuration directly into your Sarvam AI or Twilio/Exotel console.
        </div>

        <div style={{ position: "relative" }}>
          <pre style={{
            padding: "14px 16px", borderRadius: 8, background: "var(--bg-app)",
            border: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-2)",
            whiteSpace: "pre-wrap", fontFamily: "JetBrains Mono, monospace", maxHeight: 220, overflowY: "auto"
          }}>
            {sarvamSystemPrompt}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sarvamSystemPrompt);
              alert("Sarvam AI System Prompt copied to clipboard!");
            }}
            style={{
              position: "absolute", top: 10, right: 10,
              padding: "4px 10px", borderRadius: 6, background: "var(--orange-bg)",
              border: "1px solid var(--orange-border)", color: "var(--orange)",
              fontSize: 11, fontWeight: 700, cursor: "pointer"
            }}
          >
            Copy Prompt
          </button>
        </div>
      </div>
    </div>
  );
};
