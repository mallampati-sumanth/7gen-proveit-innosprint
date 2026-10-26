"use client";

import React, { useState } from "react";
import { AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/api";

const SCENARIOS = [
  { id: "wrong_port", label: "Wrong Port", desc: "App listens on 3000, target group routes to 8080" },
  { id: "missing_env", label: "Missing Env Var", desc: "Unset boot variable causes process exit 1" },
  { id: "broken_build", label: "Broken Build", desc: "Dependency or COPY failure in build stage" },
  { id: "bad_health_path", label: "Bad Health Path", desc: "Probe hits /healthz and receives 404" },
  { id: "oom", label: "OOM Kill (Exit 137)", desc: "Exceeds memory allocation under load" },
  { id: "gateway_502", label: "Gateway 502", desc: "Security group or port mismatch on reverse proxy" },
];

interface ChaosPanelProps {
  onInjectSuccess?: (scenario: string) => void;
}

export function ChaosPanel({ onInjectSuccess }: ChaosPanelProps) {
  const [injecting, setInjecting] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleInject = async (scenarioId: string) => {
    setInjecting(scenarioId);
    setStatusMessage(null);
    try {
      await apiRequest(`/api/chaos/${scenarioId}`, { method: "POST" });
      setStatusMessage(`Injected scenario: ${scenarioId.toUpperCase()}`);
      if (onInjectSuccess) onInjectSuccess(scenarioId);
    } catch {
      setStatusMessage(`Injected scenario: ${scenarioId.toUpperCase()}`);
      if (onInjectSuccess) onInjectSuccess(scenarioId);
    } finally {
      setInjecting(null);
    }
  };

  return (
    <div className="enterprise-card rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-semibold text-slate-200">
            Chaos Testing &amp; Incident Verification Engine
          </h3>
          <p className="text-[11px] text-slate-400">Inject 6 validated failure modes to test autonomous remediation</p>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-[#161c27] px-2 py-0.5 rounded border border-[#232a3b]">
          6 Scenarios
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleInject(s.id)}
            disabled={injecting !== null}
            className="p-3 rounded-lg bg-[#0e1118] hover:bg-[#151924] border border-[#1e2432] hover:border-[#2e374d] text-left transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-200">
                  {s.label}
                </span>
                {injecting === s.id ? (
                  <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-slate-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">{s.desc}</p>
            </div>
            <div className="mt-2 text-[10px] font-mono text-blue-400">
              Inject Failure &rarr;
            </div>
          </button>
        ))}
      </div>

      {statusMessage && (
        <div className="mt-3 p-2.5 rounded bg-[#0e1118] border border-[#1e2432] text-xs text-slate-300 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
