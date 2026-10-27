import React from "react";
import { PAGE_META } from "./types";
import { I } from "./icons";

export const Header = ({
  view,
  setView,
  theme,
  setTheme,
  onDeployClick,
  profile,
  onOpenConnect,
  currentUser,
  onOpenLogin,
  onLogout,
  onToggleSidebar,
}: any) => {
  const meta = PAGE_META[view] ?? PAGE_META.chat;

  return (
    <header style={{
      height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
      background: "var(--header-bg)", backdropFilter: "blur(16px) saturate(180%)",
      WebkitBackdropFilter: "blur(16px) saturate(180%)",
      borderBottom: "1px solid var(--header-border)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Mobile Sidebar Hamburger Toggle */}
      {onToggleSidebar && (
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          style={{
            display: "none", alignItems: "center", justifyContent: "center",
            width: 34, height: 34, borderRadius: 8,
            border: "1px solid var(--border)", background: "transparent",
            color: "var(--text-1)", cursor: "pointer",
          }}
          className="mobile-menu-btn"
        >
          <I.Menu />
        </button>
      )}

      {/* Logo */}
      <a href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-.03em" }}>
          prove<span style={{ color: "#16a34a" }}>it</span>
        </span>
      </a>

      <div style={{ width: 1, height: 18, background: "var(--border)" }} />

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 400 }}>Console</span>
        <span style={{ color: "var(--text-4)", fontSize: 12 }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", letterSpacing: "-.01em" }}>
          {meta.title.split(" ").slice(0, 3).join(" ")}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {currentUser && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 980,
            border: "1.5px solid var(--border)", background: "transparent", color: "var(--text-1)",
            fontSize: 12, fontWeight: 500,
          }}>
            <I.User />
            <span>@{currentUser}</span>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
          </div>
        )}

        <button onClick={onOpenConnect} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 13px", borderRadius: 980,
          border: "1.5px solid var(--border)", background: "transparent", color: "var(--text-1)",
          fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all .15s",
        }}>
          <I.Github />
          <span>{profile?.connected ? `@${profile.username || profile.login}` : "GitHub"}</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: profile?.connected ? "var(--green)" : "var(--yellow)" }} />
        </button>

        <div style={{ width: 1, height: 18, background: "var(--border)" }} />

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          title="Toggle theme"
          aria-label="Toggle dark and light theme"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 980,
            border: "1.5px solid var(--border)", cursor: "pointer",
            background: "transparent", color: "var(--text-2)",
          }}
        >
          {theme === "dark" ? <I.Sun /> : <I.Moon />}
        </button>

        <button
          onClick={onDeployClick}
          title="Deploy to Vercel, Netlify, Render, Railway, or AWS EC2"
          style={{
            display: "flex", alignItems: "center", gap: 7, padding: "7px 16px", borderRadius: 980,
            border: "none", background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "#ffffff",
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 3px 12px rgba(249, 115, 22, 0.3)",
            transition: "transform .18s cubic-bezier(.34,1.56,.64,1), box-shadow .18s",
          }}
        >
          <I.Play />
          <span>Deploy</span>
        </button>

        {currentUser && onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "5px 12px", borderRadius: 980,
              border: "1.5px solid var(--border)", background: "transparent", color: "var(--text-3)",
              fontSize: 12, fontWeight: 400, cursor: "pointer", transition: "all .15s",
            }}
          >
            Sign Out
          </button>
        )}
      </div>
    </header>
  );
};
