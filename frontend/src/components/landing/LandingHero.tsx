"use client";

import React from "react";
import { 
  ShieldCheck, 
  Terminal, 
  Zap, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  GitPullRequest, 
  Box, 
  Server,
  Layers,
  Cpu
} from "lucide-react";

interface LandingHeroProps {
  onLaunchConsole: () => void;
  onExploreChaos: () => void;
}

export function LandingHero({ onLaunchConsole, onExploreChaos }: LandingHeroProps) {
  return (
    <div className="relative border-b border-[#1e2432] bg-[#0c0e14] py-14">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex flex-col items-start max-w-3xl">
          {/* Engineering Track Tag */}
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#151924] border border-[#232a3b] text-slate-400 text-xs font-mono uppercase tracking-wider mb-5">
            <span>Team 7TH GEN • KL University • Agentic AI Track 01</span>
          </div>

          {/* Clean Headline */}
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Autonomous AWS Deployment &amp; Self-Healing Agent
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Do not just suggest the fix. Prove it. ProveIt diagnoses infrastructure incidents, validates each change in an isolated sandbox, verifies deterministic security policies, and generates proof-carrying pull requests.
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button
              onClick={onLaunchConsole}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-2 transition-colors shadow-sm"
            >
              <Terminal className="w-4 h-4" />
              Open Agent Console
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onExploreChaos}
              className="px-5 py-2.5 rounded-lg bg-[#151924] hover:bg-[#1c2231] text-slate-300 border border-[#232a3b] font-medium text-xs flex items-center gap-2 transition-colors"
            >
              <Zap className="w-4 h-4 text-slate-400" />
              View Chaos Test Scenarios
            </button>
          </div>
        </div>

        {/* 4 Engineering Pillars */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-left">
          <div className="enterprise-card p-4 rounded-lg">
            <div className="flex items-center gap-2.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-semibold text-white">Deterministic Policy</div>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Ingress CIDR checks, IAM immutability, and blast radius gates the agent cannot bypass.
            </div>
          </div>

          <div className="enterprise-card p-4 rounded-lg">
            <div className="flex items-center gap-2.5 mb-2">
              <Box className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-semibold text-white">Sandbox Verification</div>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Fix is applied to a throwaway container first. Proven only when original health checks pass.
            </div>
          </div>

          <div className="enterprise-card p-4 rounded-lg">
            <div className="flex items-center gap-2.5 mb-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-semibold text-white">SHA-256 Audit Ledger</div>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Append-only cryptographic hash chain recording all decisions and verifications.
            </div>
          </div>

          <div className="enterprise-card p-4 rounded-lg">
            <div className="flex items-center gap-2.5 mb-2">
              <GitPullRequest className="w-4 h-4 text-blue-400" />
              <div className="text-xs font-semibold text-white">Proof Bundle PR</div>
            </div>
            <div className="text-xs text-slate-400 leading-relaxed">
              Structured JSON artifact and diff attached directly to GitHub Pull Requests.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
