"use client";

import React, { useState } from "react";
import { Approval } from "@/lib/types";
import { Check, X, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/api";

interface ApprovalsPanelProps {
  approvals: Approval[];
  onRefresh: () => void;
}

export function ApprovalsPanel({ approvals, onRefresh }: ApprovalsPanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    setProcessingId(id);
    try {
      await apiRequest(`/api/approvals/${id}/${action}`, { method: "POST" });
      onRefresh();
    } catch (err) {
      console.error(`Failed to ${action} approval`, err);
    } finally {
      setProcessingId(null);
    }
  };

  const pending = approvals.filter((a) => a.status === "PENDING");

  if (pending.length === 0) {
    return (
      <div className="enterprise-card rounded-lg p-8 text-center flex flex-col items-center justify-center gap-2">
        <div className="w-8 h-8 rounded bg-[#161c27] border border-[#232a3b] flex items-center justify-center text-slate-400">
          <Check className="w-4 h-4 text-emerald-400" />
        </div>
        <h4 className="text-xs font-semibold text-slate-200">No Pending Approvals</h4>
        <p className="text-xs text-slate-400 max-w-sm">
          Actions with Blast Radius &gt;= 50 require human approval. All current proposals are within autonomous policy limits.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((approval) => (
        <div
          key={approval.approval_id}
          className="enterprise-card rounded-lg p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-amber-400">
                    High Blast Radius ({approval.blast_radius} / 100)
                  </span>
                  <span className="text-xs font-mono text-slate-500">#{approval.approval_id.slice(0, 8)}</span>
                </div>
                <h4 className="text-xs font-medium text-slate-200 mt-0.5">
                  Proposed Tool: <code className="text-blue-400 font-mono">{approval.tool_name}</code>
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(approval.approval_id, "reject")}
                disabled={processingId === approval.approval_id}
                className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reject
              </button>
              <button
                onClick={() => handleAction(approval.approval_id, "approve")}
                disabled={processingId === approval.approval_id}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Authorize
              </button>
            </div>
          </div>

          <div className="mt-3 p-3 rounded bg-[#0a0d13] border border-[#1e2432] font-mono text-xs text-slate-300 overflow-x-auto">
            {approval.arguments_json}
          </div>
        </div>
      ))}
    </div>
  );
}
