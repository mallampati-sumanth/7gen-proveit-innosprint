import React from "react";
import { ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

interface PolicyBadgeProps {
  allowed: boolean;
  requiresApproval?: boolean;
  blastRadius?: number;
}

export function PolicyBadge({ allowed, requiresApproval, blastRadius = 0 }: PolicyBadgeProps) {
  if (!allowed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <ShieldAlert className="w-3 h-3 text-rose-400" />
        BLOCKED BY POLICY
      </span>
    );
  }

  if (requiresApproval) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3 h-3 text-amber-400" />
        APPROVAL REQUIRED ({blastRadius})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <ShieldCheck className="w-3 h-3 text-emerald-400" />
      POLICY ALLOWED ({blastRadius})
    </span>
  );
}
