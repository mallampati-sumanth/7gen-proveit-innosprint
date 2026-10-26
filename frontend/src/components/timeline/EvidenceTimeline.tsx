"use client";

import React from "react";
import { EventItem } from "@/lib/types";
import { EventCard } from "./EventCard";
import { Activity, Radio } from "lucide-react";

interface EvidenceTimelineProps {
  events: EventItem[];
  isLive?: boolean;
}

export function EvidenceTimeline({ events, isLive = false }: EvidenceTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 border border-white/5 text-center flex flex-col items-center justify-center gap-3 min-h-[320px]">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-500">
          <Activity className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-slate-300">No Execution Events Yet</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Issue a command above or trigger a Chaos Injection scenario to watch real-time planning, policy evaluation, and sandbox proof verification.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>Live Evidence & Verification Timeline</span>
          <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
            {events.length} Events
          </span>
        </h3>
        {isLive && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            STREAMING (SSE)
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {events.map((event, idx) => (
          <EventCard key={event.id || idx} event={event} />
        ))}
      </div>
    </div>
  );
}
