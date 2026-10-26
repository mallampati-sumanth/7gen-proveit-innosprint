"use client";
import React, { useState, useEffect, useRef } from "react";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; font-size: 16px; }

  body.sai {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #ffffff !important;
    color: #0a0a0a !important;
    overflow-x: hidden;
    overflow-y: auto;
  }

  /* Root isolation - overrides any dark global theme */
  .sai-root {
    background: #ffffff !important;
    color: #0a0a0a !important;
    min-height: 100vh;
  }

  @keyframes sai-up   { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:none } }
  @keyframes sai-in   { from { opacity:0 } to { opacity:1 } }
  @keyframes sai-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

  .sai-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 56px;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border-bottom: 1px solid #f0f0f0;
    display: flex; align-items: center; justify-content: center;
    transition: border-color .3s, box-shadow .3s;
  }
  .sai-nav.scrolled { box-shadow: 0 1px 20px rgba(0,0,0,.06); }
  .sai-nav-inner {
    width: 100%; max-width: 1200px; padding: 0 28px;
    display: flex; align-items: center;
  }
  .sai-logo {
    font-size: 18px; font-weight: 700; color: #0a0a0a;
    text-decoration: none; letter-spacing: -.03em; flex-shrink: 0;
  }
  .sai-logo span { color: #16a34a; }
  .sai-nav-links {
    display: flex; align-items: center; gap: 32px;
    position: absolute; left: 50%; transform: translateX(-50%);
  }
  .sai-nav-link {
    font-size: 13.5px; color: #525252; text-decoration: none;
    font-weight: 400; letter-spacing: -.01em; transition: color .18s;
  }
  .sai-nav-link:hover { color: #0a0a0a; }
  .sai-nav-actions { margin-left: auto; display: flex; align-items: center; gap: 10px; }
  .sai-btn-blk {
    font-size: 13.5px; font-weight: 500; color: #fff;
    background: #0a0a0a; border: none; border-radius: 980px;
    padding: 8px 20px; cursor: pointer; letter-spacing: -.01em;
    text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    transition: background .18s, transform .18s;
  }
  .sai-btn-blk:hover { background: #262626; transform: scale(1.02); }
  .sai-btn-out {
    font-size: 13.5px; font-weight: 400; color: #0a0a0a;
    background: transparent; border: 1.5px solid #e5e5e5; border-radius: 980px;
    padding: 7px 20px; cursor: pointer; letter-spacing: -.01em;
    text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    transition: border-color .18s, background .18s, transform .18s;
  }
  .sai-btn-out:hover { border-color: #a3a3a3; background: #fafafa; transform: scale(1.02); }

  .sai-hero-section {
    min-height: calc(100vh - 56px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
    padding: 60px 28px 80px;
    background: radial-gradient(ellipse 75% 55% at 50% 40%, rgba(22, 163, 74, 0.05), transparent 70%), #ffffff;
    box-sizing: border-box;
  }
  .sai-hero {
    text-align: center;
    max-width: 980px;
    margin: auto 0;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .sai-hero-scroll-cue {
    position: absolute;
    bottom: 22px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: #a3a3a3;
    text-decoration: none;
    letter-spacing: .06em;
    text-transform: uppercase;
    transition: color .2s, transform .2s;
    animation: sai-float 2.5s ease-in-out infinite;
  }
  .sai-hero-scroll-cue:hover { color: #16a34a; }
  @keyframes sai-float {
    0%, 100% { transform: translate(-50%, 0); }
    50% { transform: translate(-50%, 5px); }
  }
  .sai-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #a3a3a3; margin-bottom: 22px; display: inline-block; }
  .sai-hero-h1 { font-size: clamp(40px, 6.5vw, 88px); font-weight: 700; line-height: 1.04; letter-spacing: -.035em; color: #0a0a0a; margin-bottom: 26px; }
  .sai-hero-h1 em { font-style: normal; color: #16a34a; }
  .sai-hero-sub { font-size: 18px; line-height: 1.6; color: #525252; max-width: 520px; margin: 0 auto 40px; font-weight: 300; letter-spacing: -.01em; }
  .sai-hero-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
  .sai-btn-hero {
    font-size: 15px; font-weight: 500; color: #fff;
    background: #0a0a0a; border: none; border-radius: 980px;
    padding: 14px 32px; cursor: pointer; letter-spacing: -.01em;
    text-decoration: none; display: inline-flex; align-items: center; gap: 7px;
    transition: background .18s, transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s;
    box-shadow: 0 4px 20px rgba(0,0,0,.18);
  }
  .sai-btn-hero:hover { background: #262626; transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 28px rgba(0,0,0,.22); }
  .sai-btn-hero-ghost {
    font-size: 15px; font-weight: 400; color: #0a0a0a;
    background: transparent; border: 1.5px solid #d4d4d4; border-radius: 980px;
    padding: 13px 32px; cursor: pointer; letter-spacing: -.01em;
    text-decoration: none; display: inline-flex; align-items: center; gap: 7px;
    transition: border-color .18s, background .18s, transform .2s cubic-bezier(.34,1.56,.64,1);
  }
  .sai-btn-hero-ghost:hover { border-color: #737373; background: #f5f5f5; transform: translateY(-1px); }

  .sai-rule { height: 1px; background: linear-gradient(90deg, transparent, #e5e5e5 25%, #e5e5e5 75%, transparent); max-width: 1200px; margin: 0 auto; }
  .sai-section { padding: 100px 0; position: relative; background: #ffffff !important; color: #0a0a0a !important; }
  .sai-section-alt { padding: 100px 0; position: relative; background: #fafafa !important; color: #0a0a0a !important; }
  .sai-con { max-width: 1200px; margin: 0 auto; padding: 0 28px; }
  .sai-con-sm { max-width: 800px; margin: 0 auto; padding: 0 28px; }

  .sai-label { font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: #a3a3a3 !important; margin-bottom: 14px; }
  .sai-h2 { font-size: clamp(30px, 4vw, 52px); font-weight: 700; line-height: 1.08; letter-spacing: -.03em; color: #0a0a0a !important; }
  .sai-h2 em { font-style: normal; color: #a3a3a3 !important; }
  .sai-body { font-size: 16px; line-height: 1.7; color: #525252 !important; font-weight: 300; letter-spacing: -.01em; }
  .sai-body-sm { font-size: 14px; line-height: 1.65; color: #737373 !important; font-weight: 300; letter-spacing: -.01em; }

  .sai-scroll-wrap { position: relative; padding: 0 28px; max-width: 1200px; margin: 0 auto; }
  .sai-scroll-track {
    display: flex; gap: 14px;
    overflow-x: auto; overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 8px;
    padding-top: 4px;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .sai-scroll-track::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  .sai-nav-arrow {
    width: 32px; height: 32px; border-radius: 50%;
    background: #ffffff; border: 1.5px solid #e5e5e5;
    display: inline-flex; align-items: center; justify-content: center;
    cursor: pointer; color: #525252;
    transition: all .2s cubic-bezier(.16,1,.3,1);
    box-shadow: 0 2px 6px rgba(0,0,0,.04);
  }
  .sai-nav-arrow:hover {
    background: #0a0a0a; color: #ffffff; border-color: #0a0a0a;
    transform: scale(1.05);
  }

  .sai-card {
    flex: 0 0 300px; scroll-snap-align: start;
    background: #fff; border: 1.5px solid #e5e5e5; border-radius: 18px;
    padding: 24px; min-height: 260px; position: relative; overflow: hidden;
    transition: border-color .25s, transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s;
    cursor: default;
  }
  .sai-card:hover { border-color: #b5b5b5; transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,.08); }
  .sai-card-num { font-size: 12px; color: #c7c7c7; font-weight: 500; letter-spacing: .04em; margin-bottom: 16px; }
  .sai-card-title { font-size: 18px; font-weight: 600; color: #0a0a0a; margin-bottom: 8px; letter-spacing: -.02em; }
  .sai-card-desc { font-size: 13.5px; color: #737373; line-height: 1.6; font-weight: 300; }
  .sai-card-phase { margin-top: 20px; display: inline-flex; align-items: center; gap: 5px; font-size: 10.5px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; padding: 4px 10px; border-radius: 980px; border: 1px solid currentColor; opacity: .65; }

  .sai-feat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: center; }
  .sai-feat-visual { border-radius: 22px; overflow: hidden; background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 50%, #86efac 100%); min-height: 380px; position: relative; display: flex; align-items: center; justify-content: center; border: 1.5px solid #bbf7d0; }
  .sai-feat-item { display: flex; gap: 14px; margin-bottom: 24px; align-items: flex-start; }
  .sai-feat-icon { width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; color: #16a34a; }
  .sai-feat-item-title { font-size: 16px; font-weight: 600; color: #0a0a0a; margin-bottom: 4px; letter-spacing: -.02em; }
  .sai-feat-item-desc { font-size: 14px; color: #737373; line-height: 1.6; font-weight: 300; }

  .sai-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
  .sai-cap-card { background: #fafafa; border: 1.5px solid #f0f0f0; border-radius: 18px; padding: 28px; transition: border-color .25s, transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .28s, background .25s; }
  .sai-cap-card:hover { border-color: #d4d4d4; background: #fff; transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,.06); }
  .sai-cap-icon { width: 40px; height: 40px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
  .sai-cap-card:hover .sai-cap-icon { transform: scale(1.1) rotate(-4deg); }
  .sai-cap-title { font-size: 15px; font-weight: 600; color: #0a0a0a; margin-bottom: 8px; letter-spacing: -.02em; }
  .sai-cap-desc { font-size: 13.5px; color: #737373; line-height: 1.6; font-weight: 300; }

  .sai-trace-card { background: #0a0a0a; border-radius: 20px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,.18); }
  .sai-trace-label { font-size: 10px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: rgba(255,255,255,.3); margin-bottom: 22px; }

  .sai-safety-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 14px; }
  .sai-safety-card { background: #fafafa; border: 1.5px solid #f0f0f0; border-radius: 18px; padding: 26px 24px; display: flex; gap: 16px; align-items: flex-start; transition: border-color .25s, transform .28s cubic-bezier(.34,1.56,.64,1), box-shadow .25s, background .25s; }
  .sai-safety-card:hover { border-color: #d4d4d4; background: #fff; transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.06); }
  .sai-safety-icon { width: 38px; height: 38px; border-radius: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; }

  .sai-cta-section { text-align: center; padding: 64px 28px; background: #fafafa; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; }

  .sai-footer { padding: 24px 0 28px; background: #fff; }
  .sai-footer-link { font-size: 13px; color: #737373; text-decoration: none; transition: color .18s; letter-spacing: -.01em; }
  .sai-footer-link:hover { color: #0a0a0a; }

  .sai-progress { position: fixed; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #16a34a, #4ade80); transform-origin: left; z-index: 300; transition: transform .05s linear; }

  @media (max-width: 960px) {
    .sai-nav-links { display: none; }
    .sai-feat-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
    .sai-feat-visual { min-height: 240px !important; }
    .sai-grid-3 { grid-template-columns: repeat(2,1fr) !important; }
    .sai-safety-grid { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 600px) {
    .sai-grid-3 { grid-template-columns: 1fr !important; }
    .sai-hero-h1 { font-size: 38px !important; }
  }
`;

function IcoCheck({ s = 14, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function IcoArrow({ s = 14, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>;
}
function IcoStar({ s = 16, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4.2 2.4-7.3L2 9.4h7.6z" /></svg>;
}
function IcoShield({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function IcoGit({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><path d="M13 6h3a2 2 0 0 1 2 2v7" /><line x1="6" y1="9" x2="6" y2="21" /></svg>;
}
function IcoSearch({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
}
function IcoFlask({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6M9 3v8l-4 8a1 1 0 0 0 .9 1.5h12.2A1 1 0 0 0 19 19l-4-8V3" /></svg>;
}
function IcoLock({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}
function IcoActivity({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
function IcoClip({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /></svg>;
}
function IcoUser({ s = 18, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
function IcoZap({ s = 10, c = "currentColor" }: { s?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
}

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : "translateY(36px) scale(0.98)",
        filter: vis ? "blur(0px)" : "blur(6px)",
        transition: `opacity .85s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .85s cubic-bezier(.16,1,.3,1) ${delay}ms, filter .85s cubic-bezier(.16,1,.3,1) ${delay}ms`,
        willChange: "opacity, transform, filter",
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const wfTrackRef = useRef<HTMLDivElement>(null);
  const APP = "/console";
  const SIGNIN = "/signup";
  const G = "#16a34a";

  const scrollWf = (dir: "left" | "right") => {
    if (wfTrackRef.current) {
      wfTrackRef.current.scrollBy({ left: dir === "left" ? -330 : 330, behavior: "smooth" });
    }
  };

  useEffect(() => {
    document.body.classList.add("sai");
    return () => { document.body.classList.remove("sai"); };
  }, []);

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 10);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const wfSteps = [
    { num: "01", title: "Submit Repo", desc: "Paste a GitHub URL. ProveIt clones, inspects manifests, and prepares your container image.", phase: "Provision", phColor: "#d97706" },
    { num: "02", title: "Inspect Config", desc: "Port mappings, env vars, Dockerfile, and IAM permissions are validated before deployment.", phase: "Provision", phColor: "#d97706" },
    { num: "03", title: "Build Container", desc: "A fresh Docker image is built with full logs. Build errors surface here, not in production.", phase: "Provision", phColor: "#d97706" },
    { num: "04", title: "Deploy to ECS", desc: "The container deploys to AWS ECS Fargate with an ALB using least-privilege IAM.", phase: "Provision", phColor: "#d97706" },
    { num: "05", title: "Monitor Health", desc: "CloudWatch metrics, task status, and target-group health are continuously observed.", phase: "Diagnose", phColor: "#7c3aed" },
    { num: "06", title: "AI Root-Cause", desc: "On failure, the agent gathers evidence then identifies the root cause with cited sources.", phase: "Diagnose", phColor: "#7c3aed" },
    { num: "07", title: "Sandbox Test", desc: "A proposed fix is applied in an ephemeral container and validated. Production is never the test target.", phase: "Verify", phColor: "#16a34a" },
    { num: "08", title: "Policy Gate", desc: "Every change is checked against blast-radius limits and approval rules before being applied.", phase: "Verify", phColor: "#16a34a" },
  ];

  const caps = [
    { Ico: IcoGit, title: "GitHub-native", desc: "Submit any repo. ProveIt handles manifests, build, and deployment without manual config." },
    { Ico: IcoSearch, title: "Evidence diagnosis", desc: "Root-cause analysis backed by CloudWatch logs, ECS state, and live metrics." },
    { Ico: IcoFlask, title: "Sandbox verification", desc: "Every fix runs in an ephemeral container before any production resource is touched." },
    { Ico: IcoActivity, title: "Health monitoring", desc: "Real-time task status, target health, and resource utilisation across the lifecycle." },
    { Ico: IcoLock, title: "Policy enforcement", desc: "Least-privilege IAM, blast-radius limits, and approval gates on every action." },
    { Ico: IcoClip, title: "Audit trail", desc: "Every decision and change recorded in an append-only compliance ledger." },
  ];

  const safetyItems = [
    { Ico: IcoLock, title: "Least-privilege IAM", desc: "Permissions scoped to the minimum required for each individual operation." },
    { Ico: IcoFlask, title: "Sandbox-first", desc: "Candidate fixes run in ephemeral containers. Production is never the first target." },
    { Ico: IcoUser, title: "Human approval gates", desc: "High-impact changes require explicit approval before the agent proceeds." },
    { Ico: IcoShield, title: "Immutable audit trail", desc: "All agent decisions and changes are written to an append-only ledger." },
  ];

  const recoveryTrace = [
    { label: "Failure detected", done: true, color: "#ef4444" },
    { label: "Logs and metrics fetched", done: true, color: "#f59e0b" },
    { label: "Root cause identified", done: true, color: "#f59e0b" },
    { label: "Repair proposed", done: true, color: "#3b82f6" },
    { label: "Sandbox test passed", done: true, color: "#3b82f6" },
    { label: "Policy gates cleared", done: true, color: "#16a34a" },
    { label: "Awaiting approval", done: false, color: "#a3a3a3" },
  ];

  return (
    <div className="sai-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="sai-progress" style={{ transform: `scaleX(${progress})` }} />

      {/* NAV */}
      <nav className={`sai-nav${scrolled ? " scrolled" : ""}`}>
        <div className="sai-nav-inner">
          <a href="/" className="sai-logo">prove<span>it</span></a>
          <div className="sai-nav-links">
            {[["Overview", "#overview"], ["How It Works", "#workflow"], ["Capabilities", "#capabilities"], ["Safety", "#safety"]].map(([l, h]) => (
              <a key={h} className="sai-nav-link" href={h}>{l}</a>
            ))}
          </div>
          <div className="sai-nav-actions">
            <a href={SIGNIN} className="sai-btn-out">Sign In</a>
            <a href={APP} className="sai-btn-blk">Go to Dashboard <IcoArrow s={13} c="#fff" /></a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div className="sai-hero-section">
        <div className="sai-hero">
          <div style={{ animation: "sai-up .9s cubic-bezier(.16,1,.3,1) both" }}>
            <span className="sai-eyebrow">AI-powered deployment assistant</span>
          </div>
          <h1 className="sai-hero-h1" style={{ animation: "sai-up .9s cubic-bezier(.16,1,.3,1) 80ms both" }}>
            Deploy with confidence.<br /><em>Recover with proof.</em>
          </h1>
          <p className="sai-hero-sub" style={{ animation: "sai-up .9s cubic-bezier(.16,1,.3,1) 160ms both" }}>
            From GitHub to a healthy AWS deployment. ProveIt diagnoses failures with real evidence, tests fixes in isolation, and applies only verified changes.
          </p>
          <div className="sai-hero-btns" style={{ animation: "sai-up .9s cubic-bezier(.16,1,.3,1) 240ms both" }}>
            <a href={APP} className="sai-btn-hero">Go to Dashboard <IcoArrow s={14} c="#fff" /></a>
            <a href="#workflow" className="sai-btn-hero-ghost">See how it works</a>
          </div>
        </div>
        <a href="#overview" className="sai-hero-scroll-cue" aria-label="Scroll to explore">
          <span>Scroll to explore</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10l5 5 5-5" /></svg>
        </a>
      </div>

      <div className="sai-rule" />

      {/* OVERVIEW */}
      <section id="overview" className="sai-section">
        <div className="sai-con">
          <div className="sai-feat-grid">
            <Reveal delay={0}>
              <div className="sai-feat-visual">
                <div style={{ padding: 28, width: "100%" }}>
                  <div style={{ background: "#0a0a0a", borderRadius: 14, padding: 20, boxShadow: "0 16px 40px rgba(0,0,0,.25)" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                      {["#ef4444", "#f59e0b", "#22c55e"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#4ade80", lineHeight: 1.9 }}>
                      <div style={{ color: "#525252" }}># ProveIt agent starting...</div>
                      <div>Fetching CloudWatch logs...</div>
                      <div style={{ color: "#fbbf24" }}>WARN  Port mismatch detected</div>
                      <div>Root cause: app listens :8080</div>
                      <div style={{ color: "#525252" }}>       target-group expects :80</div>
                      <div>Proposing fix: update port mapping</div>
                      <div>Running sandbox validation...</div>
                      <div style={{ color: "#4ade80" }}>PASS  Health check returned 200</div>
                    </div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,.92)", borderRadius: 10, padding: "10px 14px", marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: G, animation: "sai-pulse 2s ease-in-out infinite" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#0a0a0a" }}>Deployment healthy - fix verified</span>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div>
                <p className="sai-label">The Problem</p>
                <h2 className="sai-h2" style={{ marginBottom: 24 }}>AI suggests.<br /><em>ProveIt proves.</em></h2>
                <p className="sai-body" style={{ marginBottom: 36 }}>
                  Manual debugging is slow. AI suggestions can be confidently wrong. ProveIt closes the loop: evidence in, verified fix out.
                </p>
                {[
                  { title: "Grounded in real evidence", desc: "Every diagnosis cites CloudWatch logs, ECS task state, and live metrics - not hallucinations." },
                  { title: "Tested before applied", desc: "Each candidate fix runs in an isolated sandbox. If the health check fails, the fix is discarded." },
                  { title: "Bounded by policy", desc: "Blast-radius limits and approval gates prevent the agent from exceeding its authority." },
                ].map((f, i) => (
                  <div key={i} className="sai-feat-item">
                    <div className="sai-feat-icon"><IcoStar s={14} c={G} /></div>
                    <div>
                      <div className="sai-feat-item-title">{f.title}</div>
                      <div className="sai-feat-item-desc">{f.desc}</div>
                    </div>
                  </div>
                ))}
                <a href={APP} className="sai-btn-blk" style={{ marginTop: 10 }}>Go to Dashboard <IcoArrow s={13} c="#fff" /></a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="sai-rule" />

      {/* WORKFLOW SCROLL */}
      <section id="workflow" className="sai-section-alt">
        <div className="sai-con" style={{ marginBottom: 36 }}>
          <Reveal>
            <p className="sai-label">How It Works</p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
              <h2 className="sai-h2">From commit to<br /><em>confidence.</em></h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 13, color: "#a3a3a3" }}>8-step workflow</span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => scrollWf("left")} className="sai-nav-arrow" aria-label="Previous step">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button onClick={() => scrollWf("right")} className="sai-nav-arrow" aria-label="Next step">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <div className="sai-scroll-wrap">
            <div className="sai-scroll-track" ref={wfTrackRef}>
              {wfSteps.map((s, i) => (
                <div key={s.num} className="sai-card">
                  <div className="sai-card-num">{s.num}</div>
                  <div className="sai-card-title">{s.title}</div>
                  <div className="sai-card-desc">{s.desc}</div>
                  <div className="sai-card-phase" style={{ color: s.phColor }}>
                    <IcoZap s={9} c={s.phColor} />
                    {s.phase}
                  </div>
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 56, background: `linear-gradient(to top, ${s.phColor}0D, transparent)`, borderRadius: "0 0 17px 17px", pointerEvents: "none" }} />
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <div className="sai-rule" />

      {/* CAPABILITIES */}
      <section id="capabilities" className="sai-section">
        <div className="sai-con">
          <Reveal>
            <div style={{ maxWidth: 560, marginBottom: 52 }}>
              <p className="sai-label">Capabilities</p>
              <h2 className="sai-h2">AI-assisted recovery,<br /><em>backed by evidence.</em></h2>
            </div>
          </Reveal>
          <div className="sai-grid-3">
            {caps.map((c, i) => (
              <Reveal key={c.title} delay={i * 60}>
                <div className="sai-cap-card">
                  <div className="sai-cap-icon"><c.Ico s={18} c={G} /></div>
                  <div className="sai-cap-title">{c.title}</div>
                  <div className="sai-cap-desc">{c.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <div className="sai-rule" />

      {/* PROOF */}
      <section className="sai-section-alt">
        <div className="sai-con">
          <div className="sai-feat-grid">
            <Reveal>
              <div>
                <p className="sai-label">Verification-first</p>
                <h2 className="sai-h2" style={{ marginBottom: 22 }}>{"Don't suggest."}<br /><em>Prove it works.</em></h2>
                <p className="sai-body" style={{ marginBottom: 30 }}>
                  A candidate repair must demonstrate the failure no longer exists in an isolated environment before any production resource is touched.
                </p>
                <a href={APP}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, fontWeight: 600, color: G, textDecoration: "none", transition: "gap .18s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.gap = "10px"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.gap = "6px"; }}
                >
                  Open the console <IcoArrow s={14} c={G} />
                </a>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="sai-trace-card">
                <div className="sai-trace-label">Recovery trace</div>
                {recoveryTrace.map((s, i) => (
                  <div key={s.label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 2 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: s.done ? `${s.color}22` : "rgba(255,255,255,.05)", border: `1.5px solid ${s.done ? s.color : "rgba(255,255,255,.1)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {s.done && <IcoCheck s={9} c={s.color} />}
                      </div>
                      {i < recoveryTrace.length - 1 && <div style={{ width: 1, height: 16, background: s.done ? `${s.color}28` : "rgba(255,255,255,.07)", margin: "3px 0" }} />}
                    </div>
                    <div style={{ paddingTop: 1, marginBottom: i < recoveryTrace.length - 1 ? 12 : 0 }}>
                      <span style={{ fontSize: 13, fontWeight: s.done ? 500 : 400, color: s.done ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.28)" }}>{s.label}</span>
                      {!s.done && <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 8px", borderRadius: 980, background: "rgba(255,255,255,.06)", color: "rgba(255,255,255,.28)", fontWeight: 500 }}>pending</span>}
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,.07)", fontSize: 11, color: "rgba(255,255,255,.2)", fontStyle: "italic" }}>Illustrative - not live AWS data</div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <div className="sai-rule" />

      {/* SAFETY */}
      <section id="safety" className="sai-section">
        <div className="sai-con">
          <Reveal>
            <div className="sai-feat-grid" style={{ marginBottom: 52 }}>
              <div>
                <p className="sai-label">Safety Controls</p>
                <h2 className="sai-h2">Autonomy bounded<br /><em>by policy.</em></h2>
              </div>
              <p className="sai-body">ProveIt treats every autonomous action as a proposal subject to policy constraints, human oversight, and pre-production verification. The agent cannot exceed its authority.</p>
            </div>
          </Reveal>
          <div className="sai-safety-grid">
            {safetyItems.map((s, i) => (
              <Reveal key={s.title} delay={i * 70}>
                <div className="sai-safety-card">
                  <div className="sai-safety-icon"><s.Ico s={18} c={G} /></div>
                  <div>
                    <div className="sai-cap-title" style={{ marginBottom: 6 }}>{s.title}</div>
                    <div className="sai-cap-desc">{s.desc}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="sai-cta-section" style={{ background: "#fafafa !important" }}>
        <Reveal>
          <p className="sai-label">Get started</p>
          <h2 className="sai-h2" style={{ marginBottom: 20 }}>Ready to deploy <em>with proof?</em></h2>
          <p className="sai-body" style={{ maxWidth: 420, margin: "0 auto 40px" }}>
            Open the ProveIt console and deploy your first GitHub repository in minutes.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={APP} className="sai-btn-hero">Go to Dashboard <IcoArrow s={14} c="#fff" /></a>
            <a href="#workflow" className="sai-btn-hero-ghost">Explore the workflow</a>
          </div>
        </Reveal>
      </div>

      {/* FOOTER */}
      <footer className="sai-footer">
        <div className="sai-con">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <a href="/" style={{ fontSize: 18, fontWeight: 700, color: "#0a0a0a", textDecoration: "none", letterSpacing: "-.03em" }}>prove<span style={{ color: G }}>it</span></a>
              <span style={{ fontSize: 12, color: "#a3a3a3", borderLeft: "1px solid #e5e5e5", paddingLeft: 14 }}>Deploy with confidence. Recover with proof.</span>
            </div>
            <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
              {[["Overview", "#overview"], ["How It Works", "#workflow"], ["Capabilities", "#capabilities"], ["Safety", "#safety"], ["Dashboard", APP], ["GitHub", "https://github.com"]].map(([l, h]) => (
                <a key={l} href={h} className="sai-footer-link">{l}</a>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#a3a3a3" }}>2026 ProveIt - Team 7th Gen, KL University</span>
            <span style={{ fontSize: 12, color: "#a3a3a3" }}>Built with evidence, not assumptions.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
