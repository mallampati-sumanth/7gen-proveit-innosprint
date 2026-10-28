import React, { useState, useEffect, useRef } from "react";
import { PAGE_META } from "./types";
import { I } from "./icons";

interface HeaderProps {
  view: string;
  setView: (v: string) => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  onDeployClick: () => void;
  profile?: any;
  onOpenConnect?: () => void;
  currentUser?: string;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  view,
  setView,
  theme,
  setTheme,
  onDeployClick,
  profile,
  onOpenConnect,
  currentUser,
  onLogout,
  onToggleSidebar,
}) => {
  const meta = PAGE_META[view] ?? PAGE_META.chat;
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Command palette catalog
  const COMMAND_ITEMS = [
    { id: "chat", title: "AI Cloud Architect", category: "Agent Orchestration", icon: <I.Bot />, badge: "Live SSE" },
    { id: "pipeline", title: "Pipeline Tracker", category: "Agent Orchestration", icon: <I.Activity />, badge: "Live Flow" },
    { id: "voice", title: "VoiceOps Agent", category: "Agent Orchestration", icon: <I.Phone />, badge: "Voice" },
    { id: "voice-automation", title: "Voice Agents Automation", category: "Agent Orchestration", icon: <I.Zap />, badge: "Live Tasks" },
    { id: "repos", title: "Code Repositories", category: "Infrastructure", icon: <I.Github />, badge: "GitHub" },
    { id: "repoenv", title: "Environment Studio", category: "Infrastructure", icon: <I.Sliders />, badge: "Per-Repo" },
    { id: "ec2", title: "Compute Fleet (EC2)", category: "Infrastructure", icon: <I.Server />, badge: "Fleet" },
    { id: "analyze", title: "Stack Analyzer", category: "Security & Analysis", icon: <I.Scan />, badge: "Inspector" },
    { id: "secrets", title: "Vault & Credentials", category: "Security & Analysis", icon: <I.Key />, badge: "AES-256" },
    { id: "logs", title: "System Telemetry", category: "Observability", icon: <I.Terminal />, badge: "Live" },
    { id: "activity", title: "Deploy History", category: "Observability", icon: <I.ActivityPulse />, badge: "History" },
    { id: "settings", title: "Settings & Connections", category: "Observability", icon: <I.Settings />, badge: "Keys" },
    { id: "action-deploy", title: "Trigger Multi-Cloud Deploy", category: "Actions", icon: <I.Rocket />, isAction: true, badge: "Launch" },
    { id: "action-theme", title: `Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`, category: "Actions", icon: theme === "dark" ? <I.Sun /> : <I.Moon />, isAction: true },
    { id: "action-github", title: profile?.connected ? "Manage GitHub Integration" : "Connect GitHub Account", category: "Actions", icon: <I.Github />, isAction: true },
  ];

  const filteredCommands = COMMAND_ITEMS.filter(cmd => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(q))
    );
  });

  // Global Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(prev => !prev);
      } else if (e.key === "Escape" && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen]);

  // Focus search input on open
  useEffect(() => {
    if (paletteOpen) {
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [paletteOpen]);

  // Handle Command selection
  const executeCommand = (cmd: typeof COMMAND_ITEMS[0]) => {
    setPaletteOpen(false);
    if (cmd.id === "action-deploy") {
      onDeployClick();
    } else if (cmd.id === "action-theme") {
      setTheme(theme === "dark" ? "light" : "dark");
    } else if (cmd.id === "action-github") {
      if (onOpenConnect) onOpenConnect();
    } else {
      setView(cmd.id);
    }
  };

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  return (
    <>
      <header
        style={{
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 18px",
          gap: 12,
          flexShrink: 0,
          background: "var(--header-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid var(--header-border)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        {/* Mobile Sidebar Hamburger Toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label="Toggle navigation sidebar"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-1)",
              cursor: "pointer",
            }}
            className="mobile-menu-btn"
          >
            <I.Menu />
          </button>
        )}

        {/* Brand Logo & Version Badge */}
        <a
          href="/"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 9,
            flexShrink: 0,
            paddingRight: 4,
          }}
        >
          {/* Glowing Emblem */}
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 0 12px rgba(16, 185, 129, 0.4)",
            }}
          >
            <I.ActivityPulse />
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span
              style={{
                fontSize: 16.5,
                fontWeight: 750,
                color: "var(--text-1)",
                letterSpacing: "-.03em",
              }}
            >
              prove<span style={{ color: "#10b981" }}>it</span>
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "1px 5px",
                borderRadius: 4,
                background: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                textTransform: "uppercase",
              }}
            >
              Pro
            </span>
          </div>
        </a>

        {/* Hairline Divider */}
        <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />

        {/* Workspace Context Pill */}
        <div
          title="Active Production Workspace"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "4px 10px",
            borderRadius: 6,
            background: "var(--bg-card2)",
            border: "1px solid var(--border-soft)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--text-2)",
            cursor: "default",
            userSelect: "none",
          }}
        >
          <span style={{ color: "var(--text-1)", fontWeight: 600 }}>7gen-cloud</span>
          <span style={{ color: "var(--text-4)" }}>/</span>
          <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>production</span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--green)",
              animation: "pulseDot 2s infinite",
            }}
          />
        </div>

        {/* Hairline Divider */}
        <div style={{ width: 1, height: 18, background: "var(--border)", flexShrink: 0 }} />

        {/* Breadcrumb Section Tracker */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}>Console</span>
          <span style={{ color: "var(--text-4)", fontSize: 11, display: "flex", alignItems: "center" }}>
            <I.ChevronRight />
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 650,
              color: "var(--text-1)",
              letterSpacing: "-.01em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta.title}
          </span>
          {meta.badge && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 650,
                padding: "2px 6px",
                borderRadius: 9999,
                background: "rgba(22, 163, 74, 0.1)",
                color: "#16a34a",
                border: "1px solid rgba(22, 163, 74, 0.2)",
                marginLeft: 4,
              }}
            >
              {meta.badge}
            </span>
          )}
        </div>

        {/* Middle Spacer */}
        <div style={{ flex: 1 }} />

        {/* Quick Search & Command Palette Trigger (⌘K) */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="menu-search-trigger"
          title="Search console or press ⌘K"
          aria-label="Open command palette"
        >
          <I.Search />
          <span style={{ display: "inline-block", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Search console or jump...
          </span>
          <kbd>⌘K</kbd>
        </button>

        {/* System Health Monitor Pill */}
        <div
          title="FastAPI Orchestration Engine Operational (Latency ~18ms)"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 11px",
            borderRadius: 9999,
            background: "rgba(22, 163, 74, 0.08)",
            border: "1px solid rgba(22, 163, 74, 0.22)",
            color: "#16a34a",
            fontSize: 11.5,
            fontWeight: 600,
            cursor: "default",
            userSelect: "none",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#16a34a",
              animation: "pulseDot 2s infinite",
            }}
          />
          <span>18ms</span>
        </div>

        {/* GitHub Connection Pill */}
        <button
          onClick={onOpenConnect}
          className="header-pill-btn"
          title={profile?.connected ? `Connected as @${profile.username || profile.login}` : "Connect GitHub Account"}
        >
          <I.Github />
          <span style={{ maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.connected ? `@${profile.username || profile.login}` : "Connect"}
          </span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: profile?.connected ? "var(--green)" : "var(--yellow)",
              flexShrink: 0,
            }}
          />
        </button>

        {/* User Account Avatar Pill */}
        {currentUser && (
          <div
            className="header-pill-btn"
            style={{ cursor: "default" }}
            title={`Logged in as ${currentUser} (System Architect)`}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {currentUser.charAt(0).toUpperCase()}
            </div>
            <span>@{currentUser}</span>
          </div>
        )}

        {/* Theme Switcher Button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          aria-label="Toggle theme"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid var(--border)",
            cursor: "pointer",
            background: "var(--bg-card)",
            color: "var(--text-2)",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "var(--text-3)";
            e.currentTarget.style.color = "var(--text-1)";
            e.currentTarget.style.transform = "rotate(15deg)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "var(--border)";
            e.currentTarget.style.color = "var(--text-2)";
            e.currentTarget.style.transform = "none";
          }}
        >
          {theme === "dark" ? <I.Sun /> : <I.Moon />}
        </button>

        {/* Primary Deploy Action Button */}
        <button
          onClick={onDeployClick}
          className="header-deploy-btn"
          title="Deploy stack to Vercel, Netlify, Render, Railway, or AWS EC2"
        >
          <I.Play />
          <span>Deploy</span>
        </button>

        {/* Sign Out Button */}
        {currentUser && onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 11px",
              borderRadius: 9999,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-3)",
              fontSize: 11.5,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.16s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.35)";
              e.currentTarget.style.color = "var(--red)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.color = "var(--text-3)";
            }}
          >
            Sign Out
          </button>
        )}
      </header>

      {/* ─── Command Palette (⌘K) Modal ─── */}
      {paletteOpen && (
        <div
          className="cmd-palette-backdrop"
          onClick={() => setPaletteOpen(false)}
        >
          <div
            className="cmd-palette-modal"
            onClick={e => e.stopPropagation()}
            onKeyDown={handlePaletteKeyDown}
          >
            {/* Search Input Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
                background: "var(--bg-card)",
              }}
            >
              <span style={{ color: "var(--text-3)", display: "flex", alignItems: "center" }}>
                <I.Search />
              </span>
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Type a command or jump to page... (e.g. voice, ec2, deploy)"
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  fontSize: 14,
                  color: "var(--text-1)",
                  outline: "none",
                }}
              />
              <kbd
                onClick={() => setPaletteOpen(false)}
                style={{
                  fontSize: 10.5,
                  padding: "2px 6px",
                  borderRadius: 4,
                  background: "var(--bg-card2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-3)",
                  cursor: "pointer",
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results List */}
            <div
              style={{
                maxHeight: 380,
                overflowY: "auto",
                padding: "8px 10px",
              }}
            >
              {filteredCommands.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                  No matching console actions or pages found for "{searchQuery}".
                </div>
              ) : (
                filteredCommands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd)}
                      className={`cmd-palette-item ${isSelected ? "selected" : ""}`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            color: isSelected ? "var(--sidebar-active-indicator, #d97757)" : "var(--text-3)",
                            transition: "color 0.15s ease",
                          }}
                        >
                          {cmd.icon}
                        </span>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? "var(--text-1)" : "var(--text-2)" }}>
                            {cmd.title}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-4)" }}>
                            {cmd.category}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {cmd.badge && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: isSelected ? "rgba(217, 119, 87, 0.14)" : "var(--badge-bg)",
                              color: isSelected ? "var(--sidebar-active-indicator, #d97757)" : "var(--text-3)",
                              border: "1px solid var(--border-soft)",
                            }}
                          >
                            {cmd.badge}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "var(--text-4)" }}>↵</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer keyboard hint */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 16px",
                borderTop: "1px solid var(--border-soft)",
                background: "var(--bg-card2)",
                fontSize: 11,
                color: "var(--text-4)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span><kbd style={{ padding: "1px 4px", borderRadius: 3, border: "1px solid var(--border)", background: "var(--bg-card)" }}>↑</kbd> <kbd style={{ padding: "1px 4px", borderRadius: 3, border: "1px solid var(--border)", background: "var(--bg-card)" }}>↓</kbd> Navigate</span>
                <span><kbd style={{ padding: "1px 4px", borderRadius: 3, border: "1px solid var(--border)", background: "var(--bg-card)" }}>↵</kbd> Select</span>
              </div>
              <span>ProveIt Navigation Hub</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
