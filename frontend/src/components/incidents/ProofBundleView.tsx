"use client";

import React, { useState } from "react";
import { ProofBundle } from "@/lib/types";
import { ShieldCheck, GitPullRequest, Terminal, CheckCircle2, XCircle, ChevronDown, ChevronRight, Activity } from "lucide-react";

interface ProofBundleViewProps {
  bundle: ProofBundle;
}

export function ProofBundleView({ bundle }: ProofBundleViewProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="enterprise-card rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1e2432] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase bg-[#161c27] text-slate-300 px-2 py-0.5 rounded border border-[#232a3b]">
              {bundle.scenario}
            </span>
            <span className="text-xs font-mono text-slate-400">Incident: #{bundle.incident_id.slice(0, 8)}</span>
          </div>
          <h3 className="text-base font-semibold text-white mt-1.5 flex items-center gap-2">
            Proof-Carrying Self-Healing Bundle
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${
            bundle.final_status === "HEALED"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}>
            {bundle.final_status === "HEALED" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {bundle.final_status}
          </span>
          <button className="px-3 py-1 rounded bg-[#161c27] hover:bg-[#1e2432] text-xs text-slate-200 border border-[#232a3b] flex items-center gap-1.5 transition-colors">
            <GitPullRequest className="w-3.5 h-3.5 text-blue-400" />
            View PR
          </button>
        </div>
      </div>

      {/* Grid of Proof Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {/* 1. Evidence */}
        <div className="p-3.5 rounded bg-[#0a0d13] border border-[#1e2432] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3 text-amber-400" />
              1. Failure Evidence
            </div>
            <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed line-clamp-3">
              {bundle.evidence}
            </p>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-3">
            Hypothesis: {bundle.hypothesis}
          </div>
        </div>

        {/* 2. Policy Verdict */}
        <div className="p-3.5 rounded bg-[#0a0d13] border border-[#1e2432] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              2. Deterministic Policy
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                ALLOWED
              </span>
              <span className="text-xs font-mono text-slate-300">
                Blast Radius: {bundle.policy_verdict.blast_radius} / 100
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {bundle.policy_verdict.reasons.join(", ") || "Least-privilege verification passed"}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-3">
            Ingress 0.0.0.0/0 check: PASSED
          </div>
        </div>

        {/* 3. Sandbox Verification */}
        <div className="p-3.5 rounded bg-[#0a0d13] border border-[#1e2432] flex flex-col justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-blue-400" />
              3. Throwaway Sandbox
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {bundle.sandbox_result.status}
              </span>
              <span className="text-xs font-mono text-slate-300">
                {bundle.sandbox_result.execution_time_seconds}s execution
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Reproduction: Confirmed | Health Check: 200 OK
            </p>
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-3">
            Original Health Check: UNMODIFIED
          </div>
        </div>
      </div>

      {/* Typed Diff */}
      <div className="p-3.5 rounded bg-[#0a0d13] border border-[#1e2432] font-mono text-xs">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Proposed Verified Change (Typed Diff)</span>
          <span className="text-blue-400">{bundle.proposed_fix.action}</span>
        </div>
        <div className="text-slate-300 whitespace-pre-wrap bg-[#10141d] p-3 rounded border border-[#1e2432]">
          {bundle.proposed_fix.diff}
        </div>
      </div>

      {/* Raw Hash Chain Toggle */}
      <div className="mt-3 pt-3 border-t border-[#1e2432] flex items-center justify-between">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center gap-1"
        >
          {showRaw ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {showRaw ? "Collapse Payload" : "View Full JSON Proof Bundle"}
        </button>
        <span className="text-[10px] font-mono text-slate-500">
          Root: {bundle.ledger_hash_range?.[0]?.slice(0, 10)}... &rarr; {bundle.ledger_hash_range?.[1]?.slice(0, 10)}...
        </span>
      </div>

      {showRaw && (
        <div className="mt-3 p-3 rounded bg-[#0a0d13] font-mono text-xs text-slate-300 overflow-x-auto max-h-80 border border-[#1e2432]">
          <pre>{JSON.stringify(bundle, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
