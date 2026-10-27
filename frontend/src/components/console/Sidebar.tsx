import React, { useState, useEffect, useRef, useCallback } from "react";
import { I } from "./icons";

export const NAV = [
  {
    section: "AGENT DEPLOYMENT",
    items: [
      { id: "chat", icon: <I.Bot />, label: "AI Cloud Architect", badge: "Live SSE" },
      { id: "pipeline", icon: <I.Activity />, label: "Pipeline Tracker", badge: "Live Flow" },
      { id: "voice", icon: <I.Phone />, label: "VoiceOps Agent", badge: "Voice" },
      { id: "repos", icon: <I.Github />, label: "Code Repositories" },
      { id: "repoenv", icon: <I.Sliders />, label: "Environment Studio", badge: "Per-Repo" },
      { id: "ec2", icon: <I.Server />, label: "Compute Fleet", badge: "EC2" },
    ]
  },
  {
    section: "INFRASTRUCTURE & CONFIG",
    items: [
      { id: "analyze", icon: <I.Scan />, label: "Stack Analyzer", badge: "Inspector" },
      { id: "secrets", icon: <I.Key />, label: "Vault & Credentials", badge: "AES-256" },
    ]
  },
  {
    section: "OBSERVABILITY & SETTINGS",
    items: [
      { id: "logs", icon: <I.Terminal />, label: "System Telemetry", badge: "Live" },
      { id: "activity", icon: <I.Activity />, label: "Deploy History" },
      { id: "settings", icon: <I.Settings />, label: "Settings & Connections", badge: "Keys" },
    ]
  },
];

export const Sidebar = ({
  view,
  setView,
  selectedInstance,
  isOpen = true,
  onClose,
}: {
  view: string;
  setView: (v: string) => void;
  selectedInstance: string;
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
            display: "none", position: "fixed", inset: 0, zIndex: 60,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)",
            WebkitBackdropFilter: "blur(3px)",
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
        <div style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          padding: isCollapsed ? "0 8px" : "0 14px",
          borderBottom: "1px solid var(--border-soft)",
          flexShrink: 0,
        }}>
          {!isCollapsed && (
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".06em",
              color: "var(--sidebar-section)",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span>Navigation</span>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand sidebar (click to reveal)" : "Collapse sidebar"}
            style={{
              width: 28,
              height: 28,
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
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-3)";
            }}
          >
            {isCollapsed ? <I.ChevronRight /> : <I.PanelLeft />}
          </button>
        </div>

        {/* Navigation items list */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          padding: isCollapsed ? "12px 6px" : "12px 10px",
        }}>
          {NAV.map(group => (
            <div key={group.section} style={{ marginBottom: isCollapsed ? 12 : 20 }}>
              {!isCollapsed && (
                <div style={{
                  fontSize: 10.5,
                  fontWeight: 650,
                  letterSpacing: ".07em",
                  color: "var(--sidebar-section)",
                  padding: "4px 10px 6px",
                  textTransform: "uppercase",
                }}>
                  {group.section}
                </div>
              )}

              {isCollapsed && (
                <div style={{
                  height: 1,
                  background: "var(--border-soft)",
                  margin: "6px 8px 10px",
                }} />
              )}

              {group.items.map(item => {
                const active = view === item.id;
                return (
                  <button
                    key={item.id}
                    title={isCollapsed ? item.label : undefined}
                    onClick={() => {
                      setView(item.id);
                      if (onClose) onClose();
                    }}
                    className={`sidebar-nav-btn ${active ? "active" : ""}`}
                    style={{
                      justifyContent: isCollapsed ? "center" : "flex-start",
                      padding: isCollapsed ? "9px 0" : "8px 10px",
                      marginBottom: 2,
                    }}
                  >
                    {/* Active indicator bar */}
                    {active && <span className="active-indicator" />}

                    <span style={{
                      display: "flex",
                      alignItems: "center",
                      color: active ? "var(--sidebar-active-indicator, #d97757)" : "inherit",
                      opacity: active ? 1 : 0.75,
                      transition: "color .15s, opacity .15s",
                    }}>
                      {item.icon}
                    </span>

                    {!isCollapsed && (
                      <>
                        <span style={{
                          flex: 1,
                          textAlign: "left",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {item.label}
                        </span>

                        {"badge" in item && item.badge && (
                          <span style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            padding: "2px 7px",
                            borderRadius: 980,
                            background: active ? "rgba(217, 119, 87, 0.12)" : "var(--badge-bg)",
                            color: active ? "var(--sidebar-active-indicator, #d97757)" : "var(--text-4)",
                            border: `1px solid ${active ? "rgba(217, 119, 87, 0.28)" : "var(--border-soft)"}`,
                            transition: "all .15s ease",
                            flexShrink: 0,
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Sidebar footer status */}
        <div style={{
          padding: isCollapsed ? "12px 6px" : "12px 14px",
          borderTop: "1px solid var(--border-soft)",
          background: "var(--bg-card2)",
          flexShrink: 0,
        }}>
          {isCollapsed ? (
            <div style={{ display: "flex", justifyContent: "center" }} title="FastAPI Agent Online (us-east-1)">
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "var(--green)",
                animation: "pulseDot 2s infinite",
              }} />
            </div>
          ) : (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--green)", fontWeight: 550 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)", animation: "pulseDot 2s infinite" }} />
                  FastAPI Online
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-4)", fontFamily: "JetBrains Mono, monospace" }}>
                  us-east-1
                </div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-4)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Target Host</span>
                <span
                  title={selectedInstance || "Auto-Select"}
                  style={{
                    color: "var(--text-2)",
                    fontFamily: "JetBrains Mono, monospace",
                    fontWeight: 600,
                    fontSize: 10.5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: Math.max(80, width - 110),
                  }}
                >
                  {selectedInstance ? selectedInstance.slice(0, 13) + "…" : "Auto-Select"}
                </span>
              </div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border-soft)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "var(--text-4)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.03em" }}>Cloud Engines</span>
                <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 600 }}>
                  Multi-Cloud Ready
                </span>
              </div>
            </>
          )}
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
