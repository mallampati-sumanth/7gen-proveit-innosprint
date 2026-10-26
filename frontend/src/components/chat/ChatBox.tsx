"use client";

import React, { useState } from "react";
import { Send, Terminal } from "lucide-react";

interface ChatBoxProps {
  onSendMessage: (message: string) => Promise<void>;
  isLoading: boolean;
}

export function ChatBox({ onSendMessage, isLoading }: ChatBoxProps) {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    await onSendMessage(msg);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="enterprise-card rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-[#1e2432] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-[#161c27] border border-[#232a3b] flex items-center justify-center text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-slate-200">
              Deployment &amp; Remediation Console
            </h2>
            <p className="text-[11px] text-slate-400">Natural language infrastructure planner with sandbox proof</p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-slate-400 bg-[#161c27] px-2 py-0.5 rounded border border-[#232a3b]">
          Adapter: MockCloud / Docker
        </div>
      </div>

      {/* Preset Prompts */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => handleQuickPrompt("Deploy sample application from https://github.com/org/sample-flask on port 3000")}
          className="px-2.5 py-1 rounded bg-[#151924] hover:bg-[#1c2231] border border-[#232a3b] text-slate-300 text-[11px] transition-colors"
        >
          Deploy sample app on port 3000
        </button>
        <button
          onClick={() => handleQuickPrompt("Audit running container status and verify target health path")}
          className="px-2.5 py-1 rounded bg-[#151924] hover:bg-[#1c2231] border border-[#232a3b] text-slate-300 text-[11px] transition-colors"
        >
          Audit infrastructure status
        </button>
      </div>

      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="E.g. Deploy repository from https://github.com/org/demo-repo..."
          disabled={isLoading}
          className="w-full bg-[#0a0d13] border border-[#1e2432] rounded-lg px-3.5 py-2.5 pr-24 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-[11px] font-medium flex items-center gap-1.5 transition-colors"
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Run
              <Send className="w-3 h-3" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
