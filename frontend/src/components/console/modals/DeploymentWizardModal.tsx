import React, { useState, useEffect } from "react";
import { RepoItem, EC2InstanceItem, EnvTarget } from "../types";
import { I } from "../icons";

export const DeploymentWizardModal = ({
  open,
  onClose,
  repos,
  instances,
  selectedRepo,
  selectedInstance,
  onLaunch,
}: {
  open: boolean;
  onClose: () => void;
  repos: RepoItem[];
  instances: EC2InstanceItem[];
  selectedRepo: string;
  selectedInstance: string;
  onLaunch: (repo: string, instance: string, env: EnvTarget) => void;
}) => {
  const [repo, setRepo] = useState(selectedRepo || repos[0]?.name || "");
  const [inst, setInst] = useState(selectedInstance || instances[0]?.instance_id || "");
  const [env, setEnv] = useState<EnvTarget>("production");

  useEffect(() => {
    if (selectedRepo) setRepo(selectedRepo);
    else if (repos[0]?.name) setRepo(repos[0].name);
    if (selectedInstance) setInst(selectedInstance);
    else if (instances[0]?.instance_id) setInst(instances[0].instance_id);
  }, [selectedRepo, selectedInstance, repos, instances]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 540, borderRadius: 16, background: "var(--bg-card)",
        border: "1px solid var(--border)", padding: 24, display: "flex", flexDirection: "column", gap: 18,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>Launch Autonomous Deployment</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Deploy GitHub repo directly onto target EC2 instance with injected .env</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><I.X /></button>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block" }}>1. Select Repository</label>
          {repos.length === 0 ? (
            <div style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-input)", border: "1px solid var(--border)", fontSize: 12.5, color: "var(--text-3)" }}>
              No repositories connected yet. Please add a GitHub repository first.
            </div>
          ) : (
            <select
              value={repo} onChange={e => setRepo(e.target.value)}
              style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}
            >
              {repos.map(r => <option key={r.name} value={r.name}>{r.name} ({r.language})</option>)}
            </select>
          )}
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block" }}>2. Select Target EC2 Instance</label>
          <select
            value={inst} onChange={e => setInst(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)", fontSize: 13, fontFamily: "JetBrains Mono, monospace" }}
          >
            <option value="NEW_INSTANCE"> + Launch &amp; Provision New EC2 Node in AWS</option>
            {instances.map(i => <option key={i.instance_id} value={i.instance_id}>{i.name} - {i.public_ip} ({i.region})</option>)}
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-2)", marginBottom: 6, display: "block" }}>3. Injected Environment Target</label>
          <div style={{ display: "flex", gap: 10 }}>
            {(["production", "staging", "development"] as EnvTarget[]).map(t => (
              <button key={t} onClick={() => setEnv(t)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: `1px solid ${env === t ? "var(--orange)" : "var(--border)"}`,
                background: env === t ? "var(--orange-bg)" : "var(--bg-input)",
                color: env === t ? "var(--orange)" : "var(--text-2)",
                fontSize: 12, fontWeight: 700, cursor: "pointer", textTransform: "capitalize",
              }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--bg-card2)", border: "1px solid var(--border)", fontSize: 12, color: "var(--text-2)" }}>
          <strong style={{ color: "var(--green)" }}>Autonomous Pipeline:</strong> Connects to EC2, verifies Docker, injects repository-specific .env, executes container run, performs post-deploy health check, and records proof to the immutable ledger.
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
          <button onClick={onClose} style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={() => { if (repo && inst) { onLaunch(repo, inst, env); onClose(); } }}
            disabled={!repo || !inst || repos.length === 0}
            style={{
              padding: "9px 24px", borderRadius: 8, border: "none",
              background: (!repo || !inst || repos.length === 0) ? "var(--border)" : "var(--orange)",
              color: "#fff", fontSize: 13, fontWeight: 700, cursor: (!repo || !inst || repos.length === 0) ? "not-allowed" : "pointer",
            }}
          >
            Deploy Now
          </button>
        </div>
      </div>
    </div>
  );
};
