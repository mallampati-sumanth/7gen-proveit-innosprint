import React, { useState, useEffect, useRef, useCallback } from "react";
import { I } from "./icons";

export const NAV = [
  {
    section: "AGENT ORCHESTRATION",
    items: [
      { id: "chat", icon: <I.Bot />, label: "AI Cloud Architect", badge: "Live SSE" },
      { id: "pipeline", icon: <I.Activity />, label: "Pipeline Tracker", badge: "Live Flow" },
      { id: "voice", icon: <I.Phone />, label: "VoiceOps Agent", badge: "Voice" },
      { id: "voice-automation", icon: <I.Zap />, label: "Voice Agents Automation", badge: "Live Tasks" },
    ]
  },
  {
    section: "CODE & COMPUTE",
    items: [
      { id: "repos", icon: <I.Github />, label: "Code Repositories" },
      { id: "repoenv", icon: <I.Sliders />, label: "Environment Studio", badge: "Per-Repo" },
      { id: "ec2", icon: <I.Server />, label: "Compute Fleet", badge: "EC2" },
    ]
  },
  {
    section: "SECURITY & ANALYSIS",
    items: [
      { id: "analyze", icon: <I.Scan />, label: "Stack Analyzer", badge: "Inspector" },
      { id: "secrets", icon: <I.Key />, label: "Vault & Credentials", badge: "AES-256" },
    ]
  },
  {
    section: "OBSERVABILITY & SETTINGS",
    items: [
      { id: "logs", icon: <I.Terminal />, label: "System Telemetry", badge: "Live" },
      { id: "activity", icon: <I.ActivityPulse />, label: "Deploy History" },
      { id: "settings", icon: <I.Settings />, label: "Settings & Connections", badge: "Keys" },
    ]
  },
];

const getBadgeStyle = (badge: string, active: boolean) => {
  if (badge === "Live Tasks") {
    return {
      bg: active ? "rgba(168, 85, 247, 0.22)" : "rgba(168, 85, 247, 0.12)",
      color: active ? "#c084fc" : "#a855f7",
      border: "1px solid rgba(168, 85, 247, 0.3)",
    };
  }
  if (badge === "Live Flow" || badge === "Live SSE" || badge === "Live") {
    return {
      bg: active ? "rgba(22, 163, 74, 0.22)" : "rgba(22, 163, 74, 0.12)",
      color: active ? "#22c55e" : "#16a34a",
      border: "1px solid rgba(22, 163, 74, 0.3)",
    };
  }
  if (badge === "Voice") {
    return {
      bg: active ? "rgba(245, 158, 11, 0.22)" : "rgba(245, 158, 11, 0.12)",
      color: active ? "#fbbf24" : "#f59e0b",
      border: "1px solid rgba(245, 158, 11, 0.3)",
    };
  }
  if (badge === "EC2" || badge === "Per-Repo") {
    return {
      bg: active ? "rgba(59, 130, 246, 0.22)" : "rgba(59, 130, 246, 0.12)",
      color: active ? "#60a5fa" : "#3b82f6",
      border: "1px solid rgba(59, 130, 246, 0.3)",
    };
  }
  return {
    bg: active ? "rgba(217, 119, 87, 0.16)" : "var(--badge-bg)",
    color: active ? "var(--sidebar-active-indicator, #d97757)" : "var(--text-4)",
    border: `1px solid ${active ? "rgba(217, 119, 87, 0.3)" : "var(--border-soft)"}`,
  };
};

export const Sidebar = ({
  view,
  setView,
  selectedInstance,
  isOpen = true,
  onClose,
}: {
  view: string;
  setView: (v: string) => void;
  selectedInstance?: string;
  isOpen?: boolean;
  onClose?: () => void;
}) => {
  // Movable resizable slider width (desktop)
  const [width, setWidth] = useState<number>(240);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const widthRef = useRef(width);
  useEffect(() => {
    widthRef.current = width;
  }, [width]);

  // Load persisted width and collapsed state from localStorage
  useEffect(() => {
    try {
      const savedWidth = localStorage.getItem("proveit_sidebar_width");
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= 180 && parsed <= 420) {
          setWidth(parsed);
        }
      }
      const savedCollapsed = localStorage.getItem("proveit_sidebar_collapsed");
      if (savedCollapsed === "true") {
        setIsCollapsed(true);
      }
    } catch {}
  }, []);

  // Handle drag to resize
  const startXRef = useRef(0);
  const startWidthRef = useRef(240);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isCollapsed) return;
    startXRef.current = e.clientX;
    startWidthRef.current = widthRef.current;
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startXRef.current;
      const nextWidth = Math.min(420, Math.max(180, startWidthRef.current + delta));
      setWidth(nextWidth);
      widthRef.current = nextWidth;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      try {
        localStorage.setItem("proveit_sidebar_width", String(widthRef.current));
      } catch {}
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [isCollapsed]);

  const handleDoubleClickResizer = useCallback(() => {
    setWidth(240);
    widthRef.current = 240;
    try {
      localStorage.setItem("proveit_sidebar_width", "240");
    } catch {}
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem("proveit_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  }, []);

  const effectiveWidth = isCollapsed ? 64 : width;

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && onClose && (
        <div
          onClick={onClose}
          className="mobile-sidebar-backdrop"
          style={{
            display: "none",
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}

      <aside
        className={`console-sidebar ${isOpen ? "open" : "closed"} ${isDragging ? "resizing" : ""}`}
        style={{
          width: effectiveWidth,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-soft)",
          position: "relative",
          zIndex: 40,
        }}
      >
        {/* Top Mini Header / Collapse Toggle */}
        <div
          style={{
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: isCollapsed ? "0 8px" : "0 14px",
            borderBottom: "1px solid var(--border-soft)",
            flexShrink: 0,
          }}
        >
          {!isCollapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: "var(--bg-card2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-2)",
                }}
              >
                <I.Layers />
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    color: "var(--text-1)",
                    textTransform: "uppercase",
                  }}
                >
                  Workspace
                </span>
              </div>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand navigation rail (click to expand)" : "Collapse navigation to rail"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "1px solid var(--border-soft)",
              background: "transparent",
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all .16s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = "var(--bg-sidebar-hover)";
              e.currentTarget.style.color = "var(--text-1)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-3)";
              e.currentTarget.style.borderColor = "var(--border-soft)";
            }}
          >
            {isCollapsed ? <I.ChevronRight /> : <I.PanelLeft />}
          </button>
        </div>

        {/* Navigation items list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: isCollapsed ? "12px 8px" : "12px 10px",
          }}
        >
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom: isCollapsed ? 14 : 22 }}>
              {!isCollapsed && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: ".08em",
                    color: "var(--sidebar-section)",
                    padding: "4px 10px 7px",
                    textTransform: "uppercase",
                  }}
                >
                  {group.section}
                </div>
              )}

              {isCollapsed && (
                <div
                  style={{
                    height: 1,
                    background: "var(--border-soft)",
                    margin: "8px 6px 12px",
                  }}
                />
              )}

              {group.items.map(item => {
                const active = view === item.id;
                const badgeStyle = "badge" in item && item.badge ? getBadgeStyle(item.badge, active) : null;

                if (isCollapsed) {
                  return (
                    <div key={item.id} className="sidebar-collapsed-item" style={{ marginBottom: 4 }}>
                      <button
                        onClick={() => {
                          setView(item.id);
                          if (onClose) onClose();
                        }}
                        aria-label={item.label}
                        className={`sidebar-nav-btn ${active ? "active" : ""}`}
                        style={{
                          width: 44,
                          height: 40,
                          margin: "0 auto",
                          padding: 0,
                          justifyContent: "center",
                          borderRadius: 8,
                          position: "relative",
                        }}
                      >
                        {active && <span className="active-indicator" />}
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: active ? "var(--sidebar-active-indicator, #d97757)" : "var(--text-3)",
                            transition: "color .15s ease",
                          }}
                        >
                          {item.icon}
                        </span>
                      </button>

                      {/* Floating tooltip */}
                      <div className="sidebar-tooltip">
                        <span>{item.label}</span>
                        {"badge" in item && item.badge && badgeStyle && (
                          <span
                            style={{
                              fontSize: 9.5,
                              fontWeight: 650,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: badgeStyle.bg,
                              color: badgeStyle.color,
                              border: badgeStyle.border,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      if (onClose) onClose();
                    }}
                    className={`sidebar-nav-btn ${active ? "active" : ""}`}
                    style={{
                      justifyContent: "flex-start",
                      padding: "8px 11px",
                      marginBottom: 2,
                    }}
                  >
                    {/* Active indicator bar */}
                    {active && <span className="active-indicator" />}

                    {/* Icon container */}
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 20,
                        height: 20,
                        color: active ? "var(--sidebar-active-indicator, #d97757)" : "var(--text-3)",
                        opacity: active ? 1 : 0.85,
                        transition: "color .15s, opacity .15s",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </span>

                    <span
                      style={{
                        flex: 1,
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: active ? "var(--text-1)" : "inherit",
                        fontWeight: active ? 600 : 480,
                      }}
                    >
                      {item.label}
                    </span>

                    {"badge" in item && item.badge && badgeStyle && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: 9999,
                          background: badgeStyle.bg,
                          color: badgeStyle.color,
                          border: badgeStyle.border,
                          transition: "all .15s ease",
                          flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>


        {/* Movable Drag Resizer Handle (Desktop only) */}
        {!isCollapsed && (
          <div
            className={`sidebar-resizer ${isDragging ? "dragging" : ""}`}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClickResizer}
            title="Drag to resize · Double-click to reset (240px)"
          >
            <div className="resizer-grip" />
          </div>
        )}
      </aside>
    </>
  );
};
