"use client";

import React, { useState } from "react";
import { EventItem } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { PolicyBadge } from "./PolicyBadge";
import { ChevronDown, ChevronRight, Activity, Terminal, Shield, CheckCircle2, AlertCircle } from "lucide-react";

interface EventCardProps {
  event: EventItem;
}

export function EventCard({ event }: EventCardProps) {
  const [expanded, setExpanded] = useState(false);

  let details: any = null;
  try {
    details = JSON.parse(event.details_json);
  } catch {
    details = event.details_json;
  }

  const getIcon = () => {
    switch (event.event_type) {
      case "PLAN":
        return <Activity className="w-3.5 h-3.5 text-blue-400" />;
      case "TOOL_CALL":
        return <Terminal className="w-3.5 h-3.5 text-sky-400" />;
      case "POLICY_VERDICT":
        return <Shield className="w-3.5 h-3.5 text-amber-400" />;
      case "PROOF_RESULT":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="enterprise-card enterprise-card-hover rounded-lg p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 p-1.5 rounded bg-[#161c27] border border-[#232a3b] flex items-center justify-center">
            {getIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 bg-[#161c27] px-1.5 py-0.5 rounded border border-[#232a3b]">
                {event.event_type}
              </span>
              <span className="text-xs font-mono text-slate-500">
                {formatTime(event.created_at)}
              </span>
            </div>
            <h4 className="text-xs font-medium text-slate-200 mt-1">{event.summary}</h4>
          </div>
        </div>

        {details?.policy_verdict && (
          <PolicyBadge
            allowed={details.policy_verdict.allowed}
            requiresApproval={details.policy_verdict.requires_approval}
            blastRadius={details.policy_verdict.blast_radius}
          />
        )}
      </div>

      {details && (
        <div className="mt-2.5 pt-2 border-t border-[#1e2432]">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? "Hide Evidence Payload" : "View Details & Payload"}
          </button>

          {expanded && (
            <div className="mt-2 p-2.5 rounded bg-[#0a0d13] border border-[#1e2432] font-mono text-xs text-slate-300 overflow-x-auto max-h-64">
              <pre>{JSON.stringify(details, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
