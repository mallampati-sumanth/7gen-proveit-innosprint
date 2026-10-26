"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ─────────── TYPES ─────────── */
type MsgRole = "user" | "agent" | "system";
type StepStatus = "pending" | "running" | "done" | "error";
type ThemeMode = "dark" | "light";
type EnvTarget = "development" | "staging" | "production";
type EnvCategory = "ALL" | "AWS" | "GITHUB" | "LOGS" | "AI" | "APP";

interface Step { id: string; label: string; status: StepStatus; detail?: string; ts?: string; }
interface Message { id: string; role: MsgRole; text: string; steps?: Step[]; meta?: string; timestamp?: string; }

/* ─────────── THEME TOKENS ─────────── */
const THEME_VARS: Record<ThemeMode, Record<string, string>> = {
  dark: {
    "--bg-app": "#0e0e10",
    "--bg-sidebar": "#151518",
    "--bg-sidebar-hover": "#1d1d22",
    "--bg-sidebar-active": "rgba(249,115,22,0.12)",
    "--bg-main": "#121215",
    "--bg-card": "#1a1a1f",
    "--bg-card2": "#22222a",
    "--bg-input": "#1f1f26",
    "--border": "#2b2b35",
    "--border-soft": "#21212a",
    "--text-1": "#f4f4f5",
    "--text-2": "#a1a1aa",
    "--text-3": "#71717a",
    "--text-4": "#3f3f46",
    "--orange": "#f97316",
    "--orange-hover": "#ea580c",
    "--orange-bg": "rgba(249,115,22,0.12)",
    "--orange-border": "rgba(249,115,22,0.3)",
    "--green": "#22c55e",
    "--green-bg": "rgba(34,197,94,0.12)",
    "--red": "#ef4444",
    "--red-bg": "rgba(239,68,68,0.12)",
    "--blue": "#3b82f6",
    "--blue-bg": "rgba(59,130,246,0.12)",
    "--yellow": "#eab308",
    "--yellow-bg": "rgba(234,179,8,0.12)",
    "--sidebar-section": "#52525b",
    "--header-bg": "#151518",
    "--header-border": "#2b2b35",
    "--badge-bg": "#22222a",
  },
  light: {
    "--bg-app": "#f8fafc",
    "--bg-sidebar": "#ffffff",
    "--bg-sidebar-hover": "#f1f5f9",
    "--bg-sidebar-active": "rgba(234,88,12,0.08)",
    "--bg-main": "#f8fafc",
    "--bg-card": "#ffffff",
    "--bg-card2": "#f1f5f9",
    "--bg-input": "#ffffff",
    "--border": "#e2e8f0",
    "--border-soft": "#edf2f7",
    "--text-1": "#0f172a",
    "--text-2": "#334155",
    "--text-3": "#64748b",
    "--text-4": "#94a3b8",
    "--orange": "#ea580c",
    "--orange-hover": "#c2410c",
    "--orange-bg": "rgba(234,88,12,0.08)",
    "--orange-border": "rgba(234,88,12,0.28)",
    "--green": "#16a34a",
    "--green-bg": "rgba(22,163,74,0.08)",
    "--red": "#dc2626",
    "--red-bg": "rgba(220,38,38,0.08)",
    "--blue": "#2563eb",
    "--blue-bg": "rgba(37,99,235,0.08)",
    "--yellow": "#d97706",
    "--yellow-bg": "rgba(217,119,6,0.08)",
    "--sidebar-section": "#94a3b8",
    "--header-bg": "#ffffff",
    "--header-border": "#e2e8f0",
    "--badge-bg": "#f1f5f9",
  },
};

/* ─────────── ICONS ─────────── */
const I = {
  Bot: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><line x1="8" y1="16" x2="8" y2="16" strokeWidth="3"/><line x1="16" y1="16" x2="16" y2="16" strokeWidth="3"/></svg>,
  Send: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Github: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>,
  Terminal: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  Cloud: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  Settings: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  User: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Activity: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Book: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  Zap: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Sun: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Moon: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Eye: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  EyeOff: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  Check: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Loader: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  Circle: () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>,
  Plus: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  ChevronDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Bell: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Shield: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Key: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  Database: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Cpu: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  Scan: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10"/></svg>,
  Download: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Copy: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  Upload: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Refresh: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  CheckCircle: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Lock: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  FileCode: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
};

/* ─────────── NAVIGATION CONFIG ─────────── */
const NAV = [
  { section: "WORKSPACE", items: [
    { id: "chat",     icon: <I.Bot />,      label: "Agent Chat",      badge: "AI" },
    { id: "repos",    icon: <I.Github />,   label: "Repositories" },
    { id: "analyze",  icon: <I.Scan />,     label: "Repo Analyzer",   badge: "Auto" },
    { id: "infra",    icon: <I.Cloud />,    label: "Infrastructure" },
  ]},
  { section: "SECRETS & CLOUD", items: [
    { id: "secrets",  icon: <I.Key />,      label: "AWS & GitHub Secrets" },
    { id: "envfiles", icon: <I.Database />, label: "Environment .env" },
  ]},
  { section: "OBSERVABILITY", items: [
    { id: "logs",     icon: <I.Terminal />, label: "Execution Logs",   badge: "Live" },
    { id: "activity", icon: <I.Activity />, label: "Activity Feed" },
    { id: "ledger",   icon: <I.Book />,     label: "Proof Ledger" },
  ]},
  { section: "CONFIGURATION", items: [
    { id: "settings", icon: <I.Settings />, label: "Settings" },
  ]},
];

const PAGE_META: Record<string, { title: string; sub: string; badge: string }> = {
  chat:     { title: "Agent Chat", sub: "Autonomous deployment & self-healing agent powered by Gemini 2.5 Flash", badge: "AI Assistant" },
  repos:    { title: "Connected Repositories", sub: "GitHub repositories with automated CI/CD and self-healing webhooks", badge: "GitHub" },
  analyze:  { title: "Repository Analyzer", sub: "Deep inspection: detects runtime, dependencies, exposed ports & generates deployment .env", badge: "Analysis" },
  infra:    { title: "AWS Infrastructure", sub: "Live AWS cloud topology snapshot across EC2, ECS, ECR, and CloudWatch", badge: "AWS Cloud" },
  secrets:  { title: "AWS & GitHub Secrets", sub: "Encrypted cloud credentials, API keys, and secure log streaming endpoints", badge: "Vault" },
  envfiles: { title: "Environment Variables (.env)", sub: "Target-specific environment configurations for Dev, Staging & Production", badge: "Config" },
  logs:     { title: "Execution Log Stream", sub: "Real-time AWS CloudWatch and agent diagnostic logs", badge: "Streaming" },
  activity: { title: "Audit & Activity Feed", sub: "Complete history of autonomous builds, deployments, and verification checks", badge: "History" },
  ledger:   { title: "Proof Ledger", sub: "Cryptographically verifiable ledger — every applied fix is proven before release", badge: "Verified" },
  settings: { title: "Platform Settings", sub: "Appearance themes, agent safety gates, LLM selection, and region parameters", badge: "Control" },
};

/* ─────────── AGENT RESPONSES ─────────── */
function agentReply(input: string): { text: string; steps?: Step[]; meta?: string } {
  const l = input.toLowerCase();
  if (l.includes("github.com") || l.includes("deploy")) {
    const repo = input.match(/github\.com\/([^\s]+)/)?.[1] ?? "7gen/sample-app";
    return {
      text: `Initiating autonomous deployment pipeline for **${repo}**:\n\n1. Analyzing repository metadata and dependencies\n2. Verifying AWS IAM & ECR repository authorization\n3. Building Docker image in sandboxed container\n4. Injecting verified environment variables\n5. Rolling deploy to ECS Fargate (us-east-1)\n6. Proving health endpoint status (HTTP 200)`,
      meta: "Gemini 2.5 Flash Engine",
      steps: [
        { id: "s1", label: `Cloned ${repo}`, status: "done", detail: "commit 8e41a9f (main)", ts: "0.4s" },
        { id: "s2", label: "Repo Analysis: Node.js 20 + Dockerfile detected", status: "done", detail: "Exposed port: 3000 | Health: /health", ts: "1.1s" },
        { id: "s3", label: "AWS ECR Login (123456789012.dkr.ecr.us-east-1)", status: "done", detail: "Token verified via AWS STS", ts: "1.8s" },
        { id: "s4", label: "Building Docker container image", status: "done", detail: "Image sha256:4b9a... (size: 142MB)", ts: "3.2s" },
        { id: "s5", label: "Deploying to ECS Task proveit-cluster", status: "done", detail: "Task arn:aws:ecs:us-east-1:123456789012:task/a92f", ts: "4.9s" },
        { id: "s6", label: "Proof: Health check HTTP 200 OK verified", status: "done", detail: "Latency: 48ms · Zero restarts recorded", ts: "5.5s" },
      ],
    };
  }
  if (l.includes("heal") || l.includes("fix") || l.includes("failing") || l.includes("error")) {
    return {
      text: "Self-healing protocol engaged. Diagnosing container memory exhaustion (OOMKilled) on worker:\n\n- Detected memory threshold breach (94% utilization at peak)\n- Formulated fix: bumped memory from 512MB to 1024MB in ECS task definition\n- Verified in isolated sandbox container before applying to production\n- Service recovered: 0 restarts over 15 minutes. Proof committed to ledger.",
      meta: "ProveIt Self-Heal",
      steps: [
        { id: "h1", label: "Anomaly detected in CloudWatch logs", status: "done", detail: "Signal: exit code 137 (OOMKilled)", ts: "0.2s" },
        { id: "h2", label: "Gemini Agent reasoning root cause", status: "done", detail: "Memory allocation exceeded 512MB cap", ts: "0.8s" },
        { id: "h3", label: "Patching ECS task definition (memory: 1024MB)", status: "done", detail: "Task revision :4 -> :5 created", ts: "1.4s" },
        { id: "h4", label: "Deploying patched task to AWS ECS", status: "done", detail: "Zero-downtime rolling update", ts: "2.8s" },
        { id: "h5", label: "Proving stabilization in CloudWatch metrics", status: "done", detail: "Memory steady at 38% · Proof hash #9f8c2b", ts: "3.9s" },
      ],
    };
  }
  return {
    text: "I am ready. Paste any GitHub repository URL (e.g. `github.com/my-org/web-service`) to inspect dependencies, generate target `.env` files, and trigger an autonomous verified deployment.",
    meta: "ProveIt Agent",
  };
}

/* ─────────── STEP LIST ─────────── */
const StepList = ({ steps }: { steps: Step[] }) => (
  <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 10, background: "var(--bg-card2)", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 9 }}>
    {steps.map(st => (
      <div key={st.id} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ marginTop: 2, flexShrink: 0 }}>
          {st.status === "done" && <span style={{ color: "var(--green)" }}><I.Check /></span>}
          {st.status === "running" && <span style={{ color: "var(--orange)" }}><I.Loader /></span>}
          {st.status === "error" && <span style={{ color: "var(--red)" }}><I.X /></span>}
          {st.status === "pending" && <span style={{ color: "var(--text-3)" }}><I.Circle /></span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: st.status === "done" ? "var(--text-1)" : "var(--text-2)", fontWeight: st.status === "running" ? 600 : 500 }}>
            {st.label}
          </div>
          {st.detail && (
            <div style={{ fontSize: 11.5, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace", marginTop: 2 }}>
              {st.detail}
            </div>
          )}
        </div>
        {st.ts && <span style={{ fontSize: 11, color: "var(--text-3)", flexShrink: 0 }}>{st.ts}</span>}
      </div>
    ))}
  </div>
);

/* ─────────── CHAT BUBBLE ─────────── */
const Bubble = ({ msg }: { msg: Message }) => {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", gap: 12, flexDirection: isUser ? "row-reverse" : "row", animation: "fadeSlide .2s ease-out" }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "var(--badge-bg)" : "var(--orange-bg)",
        border: `1px solid ${isUser ? "var(--border)" : "var(--orange-border)"}`,
        color: isUser ? "var(--text-2)" : "var(--orange)",
      }}>
        {isUser ? <I.User /> : <I.Bot />}
      </div>
      <div style={{ maxWidth: "78%", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexDirection: isUser ? "row-reverse" : "row" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>{isUser ? "You" : (msg.meta ?? "ProveIt Agent")}</span>
          {msg.timestamp && <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>{msg.timestamp}</span>}
        </div>
        <div style={{
          padding: "12px 16px", borderRadius: 12,
          background: isUser ? "var(--orange-bg)" : "var(--bg-card)",
          border: `1px solid ${isUser ? "var(--orange-border)" : "var(--border)"}`,
          color: "var(--text-1)", fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap",
        }}>
          {msg.text}
        </div>
        {msg.steps && msg.steps.length > 0 && <StepList steps={msg.steps} />}
      </div>
    </div>
  );
};

/* ─────────── SECRETS FIELD ─────────── */
interface SecretInputProps {
  label: string;
  placeholder: string;
  hint?: string;
  type?: "password" | "text" | "select";
  options?: string[];
  initialValue?: string;
}

const SecretFieldRow = ({ label, placeholder, hint, type = "password", options, initialValue = "" }: SecretInputProps) => {
  const [val, setVal] = useState(initialValue);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: "var(--text-3)" }}>{hint}</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {type === "select" ? (
          <select value={val} onChange={e => setVal(e.target.value)} style={{
            flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13,
            background: "var(--bg-input)", color: val ? "var(--text-1)" : "var(--text-3)",
            border: "1px solid var(--border)", outline: "none",
          }}>
            <option value="">{placeholder}</option>
            {options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <div style={{ flex: 1, position: "relative", display: "flex" }}>
            <input
              type={type === "password" && !show ? "password" : "text"}
              value={val}
              onChange={e => setVal(e.target.value)}
              placeholder={placeholder}
              style={{
                width: "100%", padding: "8px 38px 8px 12px", borderRadius: 8, fontSize: 13,
                background: "var(--bg-input)", color: "var(--text-1)",
                border: "1px solid var(--border)", outline: "none",
                fontFamily: type === "password" && !show && val ? "monospace" : "inherit",
              }}
            />
            {type === "password" && (
              <button onClick={() => setShow(!show)} type="button" style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--text-3)",
                display: "flex", alignItems: "center",
              }}>
                {show ? <I.EyeOff /> : <I.Eye />}
              </button>
            )}
          </div>
        )}
        <button onClick={save} type="button" style={{
          padding: "0 16px", borderRadius: 8, border: "none", cursor: "pointer",
          background: saved ? "var(--green)" : "var(--orange)", color: "#ffffff",
          fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
          transition: "background .2s",
        }}>
          {saved ? <><I.Check /> Saved</> : "Save"}
        </button>
      </div>
    </div>
  );
};

/* ─────────── SECRETS PANEL ─────────── */
const SecretsPanel = () => {
  const [testing, setTesting] = useState<Record<string, "idle" | "testing" | "ok" | "fail">>({});

  const testConnection = (target: string) => {
    setTesting(p => ({ ...p, [target]: "testing" }));
    setTimeout(() => {
      setTesting(p => ({ ...p, [target]: "ok" }));
    }, 1200);
  };

  const CardSection = ({ title, icon, badge, testKey, testLabel, testResult, children }: {
    title: string; icon: React.ReactNode; badge?: string; testKey?: string; testLabel?: string; testResult?: string; children: React.ReactNode;
  }) => {
    const status = testKey ? testing[testKey] : undefined;
    return (
      <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, background: "var(--badge-bg)" }}>
          <span style={{ color: "var(--orange)" }}>{icon}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{title}</span>
          {badge && (
            <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--orange-bg)", color: "var(--orange)", border: "1px solid var(--orange-border)" }}>
              {badge}
            </span>
          )}
          <div style={{ flex: 1 }} />
          {testKey && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {status === "ok" && testResult && (
                <span style={{ fontSize: 11.5, color: "var(--green)", fontFamily: "JetBrains Mono, monospace" }}>
                  {testResult}
                </span>
              )}
              <button onClick={() => testConnection(testKey)} type="button" style={{
                display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 7,
                border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {status === "testing" ? <><I.Loader /> Testing…</> : status === "ok" ? <><span style={{ color: "var(--green)" }}><I.Check /></span> Connected</> : testLabel ?? "Test Connection"}
              </button>
            </div>
          )}
        </div>
        <div style={{ padding: "20px 20px 6px" }}>{children}</div>
      </div>
    );
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      {/* Banner */}
      <div style={{
        marginBottom: 24, padding: "12px 18px", borderRadius: 10,
        background: "var(--orange-bg)", border: "1px solid var(--orange-border)",
        display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-1)",
      }}>
        <span style={{ color: "var(--orange)" }}><I.Shield /></span>
        <span>
          <strong>Encrypted Vault:</strong> AWS keys and GitHub secrets are encrypted using KMS / Supabase Vault and injected dynamically into temporary deployment containers. They are never written to disk or logs.
        </span>
      </div>

      {/* 1. AWS Secrets */}
      <CardSection title="AWS Credentials & Cloud Targets" icon={<I.Cloud />} badge="Cloud Infrastructure" testKey="aws" testResult="STS Verified: arn:aws:iam::123456789012 (us-east-1)">
        <SecretFieldRow label="AWS Access Key ID" placeholder="AKIAIOSFODNN7EXAMPLE" initialValue="AKIAIOSFODNN7EXAMPLE" hint="IAM user with EC2, ECS, ECR, CloudWatch permissions" />
        <SecretFieldRow label="AWS Secret Access Key" placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" initialValue="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" />
        <SecretFieldRow label="AWS Session Token (Optional)" placeholder="AQoDYXdzEJr1... (for STS temporary credentials)" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SecretFieldRow label="Default AWS Region" placeholder="Select region" type="select" initialValue="us-east-1" options={["us-east-1", "us-west-2", "eu-west-1", "ap-south-1"]} />
          <SecretFieldRow label="AWS Account ID" placeholder="123456789012" initialValue="123456789012" type="text" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <SecretFieldRow label="Managed ECR Registry URI" placeholder="123456789012.dkr.ecr.us-east-1.amazonaws.com" initialValue="123456789012.dkr.ecr.us-east-1.amazonaws.com" type="text" />
          <SecretFieldRow label="ECS Cluster Name" placeholder="proveit-production-cluster" initialValue="proveit-cluster" type="text" />
        </div>
      </CardSection>

      {/* 2. GitHub Secrets */}
      <CardSection title="GitHub CI/CD & Bot Credentials" icon={<I.Github />} badge="Repository Access" testKey="github" testResult="Octokit: @proveit-bot (4,992/5,000 req/hr)">
        <SecretFieldRow label="GitHub Personal Access Token" placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" initialValue="ghp_mock_personal_token_2026" hint="Required scopes: repo, workflow, read:org" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SecretFieldRow label="Default Organization / Account" placeholder="7gen-engineering" initialValue="7gen-engineering" type="text" />
          <SecretFieldRow label="ProveIt Bot Identity" placeholder="proveit-bot" initialValue="proveit-bot" type="text" hint="Used for automated PR proof comments" />
        </div>
        <SecretFieldRow label="GitHub Webhook HMAC Secret" placeholder="your_github_webhook_secret_here" initialValue="proveit_webhook_secret_dev" hint="Validates webhook events from GitHub to trigger automated deployments" />
      </CardSection>

      {/* 3. Log Stream & Observability */}
      <CardSection title="Observability & Log Connection" icon={<I.Terminal />} badge="Telemetry" testKey="logs" testResult="CloudWatch Logs: 200 OK (stream active)">
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          <SecretFieldRow label="AWS CloudWatch Log Group" placeholder="/aws/proveit/deployments" initialValue="/aws/proveit/deployments" type="text" />
          <SecretFieldRow label="Log Stream Name" placeholder="agent-execution-stream" initialValue="agent-stream" type="text" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SecretFieldRow label="Minimum Log Level" placeholder="Select Level" type="select" initialValue="INFO" options={["DEBUG", "INFO", "WARN", "ERROR"]} />
          <SecretFieldRow label="Datadog API Key (Optional)" placeholder="dd_api_key_xxxxxxxx" />
        </div>
        <SecretFieldRow label="Sentry DSN (Optional)" placeholder="https://examplePublicKey@o0.ingest.sentry.io/0" type="text" hint="Real-time error capture and telemetry alerting" />
      </CardSection>

      {/* 4. AI Engine & Database */}
      <CardSection title="AI Reasoning Engine & Proof Ledger" icon={<I.Zap />} badge="Multi-Agent System" testKey="ai" testResult="Gemini 2.5 Flash: Latency 142ms">
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
          <SecretFieldRow label="Gemini API Key" placeholder="AIzaSy..." initialValue="AIzaSyDEMOKEYFORPROVEIT2026" hint="Powers the autonomous deployment & self-healing reasoning loop" />
          <SecretFieldRow label="Gemini Model" placeholder="Select model" type="select" initialValue="gemini-2.5-flash" options={["gemini-2.5-flash", "gemini-2.0-pro", "gemini-1.5-flash"]} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <SecretFieldRow label="Supabase URL" placeholder="https://xxxx.supabase.co" initialValue="https://proveit-vault.supabase.co" type="text" />
          <SecretFieldRow label="Supabase Service Role Key" placeholder="eyJhbGciOi..." hint="Used for cryptographic ledger proof signatures" />
        </div>
      </CardSection>
    </div>
  );
};

/* ─────────── ENV MANAGER PANEL ─────────── */
interface EnvItem { key: string; value: string; category: EnvCategory; secret?: boolean; }

const DEFAULT_ENV_DATA: Record<EnvTarget, EnvItem[]> = {
  development: [
    { key: "ENVIRONMENT", value: "development", category: "APP" },
    { key: "PORT", value: "8000", category: "APP" },
    { key: "HOST", value: "0.0.0.0", category: "APP" },
    { key: "CLOUD_MODE", value: "mock", category: "AWS" },
    { key: "AWS_REGION", value: "us-east-1", category: "AWS" },
    { key: "AWS_ACCESS_KEY_ID", value: "AKIAIOSFODNN7EXAMPLE", category: "AWS", secret: true },
    { key: "AWS_SECRET_ACCESS_KEY", value: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", category: "AWS", secret: true },
    { key: "AWS_ACCOUNT_ID", value: "123456789012", category: "AWS" },
    { key: "AWS_ECR_REGISTRY", value: "123456789012.dkr.ecr.us-east-1.amazonaws.com", category: "AWS" },
    { key: "AWS_ECS_CLUSTER", value: "proveit-dev-cluster", category: "AWS" },
    { key: "GITHUB_TOKEN", value: "ghp_dev_personal_access_token_2026", category: "GITHUB", secret: true },
    { key: "GITHUB_DEFAULT_ORG", value: "7gen-engineering", category: "GITHUB" },
    { key: "PROVEIT_BOT_NAME", value: "proveit-bot", category: "GITHUB" },
    { key: "CLOUDWATCH_LOG_GROUP", value: "/aws/proveit/deployments", category: "LOGS" },
    { key: "LOG_LEVEL", value: "INFO", category: "LOGS" },
    { key: "LLM_PROVIDER", value: "gemini", category: "AI" },
    { key: "GEMINI_MODEL", value: "gemini-2.5-flash", category: "AI" },
    { key: "GEMINI_API_KEY", value: "AIzaSy_MOCK_FLASH_KEY_2026", category: "AI", secret: true },
    { key: "DATABASE_URL", value: "sqlite:///./proveit.db", category: "APP" },
    { key: "SANDBOX_TIMEOUT_SECONDS", value: "300", category: "APP" },
  ],
  staging: [
    { key: "ENVIRONMENT", value: "staging", category: "APP" },
    { key: "PORT", value: "8000", category: "APP" },
    { key: "HOST", value: "0.0.0.0", category: "APP" },
    { key: "CLOUD_MODE", value: "aws", category: "AWS" },
    { key: "AWS_REGION", value: "us-east-1", category: "AWS" },
    { key: "AWS_ACCESS_KEY_ID", value: "AKIAIOSFODNN7STAGING", category: "AWS", secret: true },
    { key: "AWS_SECRET_ACCESS_KEY", value: "wJalrXUtnFEMI/K7MDENG/STAGINGKEY", category: "AWS", secret: true },
    { key: "AWS_ACCOUNT_ID", value: "987654321098", category: "AWS" },
    { key: "AWS_ECR_REGISTRY", value: "987654321098.dkr.ecr.us-east-1.amazonaws.com", category: "AWS" },
    { key: "AWS_ECS_CLUSTER", value: "proveit-staging-cluster", category: "AWS" },
    { key: "GITHUB_TOKEN", value: "ghp_staging_token_deployer", category: "GITHUB", secret: true },
    { key: "CLOUDWATCH_LOG_GROUP", value: "/aws/proveit/staging", category: "LOGS" },
    { key: "LOG_LEVEL", value: "INFO", category: "LOGS" },
    { key: "LLM_PROVIDER", value: "gemini", category: "AI" },
    { key: "GEMINI_MODEL", value: "gemini-2.5-flash", category: "AI" },
    { key: "REQUIRE_APPROVAL_PROD", value: "false", category: "APP" },
  ],
  production: [
    { key: "ENVIRONMENT", value: "production", category: "APP" },
    { key: "PORT", value: "8000", category: "APP" },
    { key: "HOST", value: "0.0.0.0", category: "APP" },
    { key: "CLOUD_MODE", value: "aws", category: "AWS" },
    { key: "AWS_REGION", value: "us-east-1", category: "AWS" },
    { key: "AWS_ACCESS_KEY_ID", value: "AKIAIOSFODNN7PROD123", category: "AWS", secret: true },
    { key: "AWS_SECRET_ACCESS_KEY", value: "wJalrXUtnFEMI/K7MDENG/PRODSECRETKEY", category: "AWS", secret: true },
    { key: "AWS_ACCOUNT_ID", value: "555544443333", category: "AWS" },
    { key: "AWS_ECR_REGISTRY", value: "555544443333.dkr.ecr.us-east-1.amazonaws.com", category: "AWS" },
    { key: "AWS_ECS_CLUSTER", value: "proveit-production-cluster", category: "AWS" },
    { key: "GITHUB_TOKEN", value: "ghp_prod_locked_token", category: "GITHUB", secret: true },
    { key: "CLOUDWATCH_LOG_GROUP", value: "/aws/proveit/production", category: "LOGS" },
    { key: "LOG_LEVEL", value: "WARN", category: "LOGS" },
    { key: "LLM_PROVIDER", value: "gemini", category: "AI" },
    { key: "GEMINI_MODEL", value: "gemini-2.5-flash", category: "AI" },
    { key: "REQUIRE_APPROVAL_PROD", value: "true", category: "APP" },
  ],
};

const EnvPanel = ({ activeTarget, setActiveTarget }: { activeTarget: EnvTarget; setActiveTarget: (t: EnvTarget) => void }) => {
  const [data, setData] = useState<Record<EnvTarget, EnvItem[]>>(DEFAULT_ENV_DATA);
  const [cat, setCat] = useState<EnvCategory>("ALL");
  const [search, setSearch] = useState("");
  const [showSecrets, setShowSecrets] = useState(false);
  const [copied, setCopied] = useState(false);
  const [synced, setSynced] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [newCat, setNewCat] = useState<EnvCategory>("APP");

  const list = data[activeTarget];

  const filtered = useMemo(() => {
    return list.filter(item => {
      const matchCat = cat === "ALL" || item.category === cat;
      const matchSearch = !search.trim() || item.key.toLowerCase().includes(search.toLowerCase()) || item.value.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [list, cat, search]);

  const rawEnvText = useMemo(() => {
    return `# ProveIt — Target: ${activeTarget.toUpperCase()}\n` +
      list.map(i => `${i.key}=${i.value}`).join("\n");
  }, [list, activeTarget]);

  const copyEnv = () => {
    navigator.clipboard.writeText(rawEnvText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadEnv = () => {
    const blob = new Blob([rawEnvText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `.env.${activeTarget}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const syncToContainer = () => {
    setSynced(true);
    setTimeout(() => setSynced(false), 2500);
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const lines = importText.split("\n");
    const newItems: EnvItem[] = [];
    lines.forEach(l => {
      const clean = l.trim();
      if (!clean || clean.startsWith("#")) return;
      const eqIdx = clean.indexOf("=");
      if (eqIdx !== -1) {
        const k = clean.slice(0, eqIdx).trim();
        const v = clean.slice(eqIdx + 1).trim();
        let c: EnvCategory = "APP";
        if (k.includes("AWS") || k.includes("ECR") || k.includes("ECS")) c = "AWS";
        else if (k.includes("GITHUB")) c = "GITHUB";
        else if (k.includes("LOG") || k.includes("SENTRY") || k.includes("DATADOG")) c = "LOGS";
        else if (k.includes("GEMINI") || k.includes("LLM") || k.includes("GROQ")) c = "AI";
        newItems.push({ key: k, value: v, category: c, secret: k.includes("SECRET") || k.includes("KEY") || k.includes("TOKEN") });
      }
    });

    if (newItems.length > 0) {
      setData(p => ({ ...p, [activeTarget]: newItems }));
      setImportOpen(false);
      setImportText("");
    }
  };

  const updateItem = (key: string, newVal: string) => {
    setData(p => ({
      ...p,
      [activeTarget]: p[activeTarget].map(i => i.key === key ? { ...i, value: newVal } : i),
    }));
  };

  const deleteItem = (key: string) => {
    setData(p => ({
      ...p,
      [activeTarget]: p[activeTarget].filter(i => i.key !== key),
    }));
  };

  const addItem = () => {
    if (!newKey.trim()) return;
    const item: EnvItem = {
      key: newKey.toUpperCase().trim(),
      value: newVal.trim(),
      category: newCat,
      secret: newKey.includes("SECRET") || newKey.includes("KEY") || newKey.includes("TOKEN"),
    };
    setData(p => ({ ...p, [activeTarget]: [...p[activeTarget], item] }));
    setNewKey("");
    setNewVal("");
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      {/* Environment target switcher & action bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        {/* Target Tabs */}
        <div style={{ display: "flex", background: "var(--badge-bg)", padding: 4, borderRadius: 10, border: "1px solid var(--border)" }}>
          {(["development", "staging", "production"] as EnvTarget[]).map(t => (
            <button key={t} onClick={() => setActiveTarget(t)} style={{
              padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer",
              fontSize: 12.5, fontWeight: activeTarget === t ? 700 : 500,
              background: activeTarget === t ? "var(--orange)" : "transparent",
              color: activeTarget === t ? "#ffffff" : "var(--text-2)",
              transition: "all .15s", textTransform: "capitalize",
            }}>
              {t} (.env.{t})
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setShowSecrets(!showSecrets)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)",
            fontSize: 12.5, fontWeight: 500, cursor: "pointer",
          }}>
            {showSecrets ? <I.EyeOff /> : <I.Eye />}
            {showSecrets ? "Hide Secrets" : "Reveal Secrets"}
          </button>
          <button onClick={() => setImportOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)",
            fontSize: 12.5, fontWeight: 500, cursor: "pointer",
          }}>
            <I.Upload /> Import .env
          </button>
          <button onClick={copyEnv} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)",
            fontSize: 12.5, fontWeight: 500, cursor: "pointer",
          }}>
            <I.Copy /> {copied ? "Copied!" : "Copy"}
          </button>
          <button onClick={downloadEnv} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8,
            border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)",
            fontSize: 12.5, fontWeight: 500, cursor: "pointer",
          }}>
            <I.Download /> Export
          </button>
          <button onClick={syncToContainer} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 8,
            border: "none", background: synced ? "var(--green)" : "var(--orange)", color: "#fff",
            fontSize: 12.5, fontWeight: 600, cursor: "pointer", transition: "background .2s",
          }}>
            {synced ? <><I.Check /> Synced to Containers</> : <><I.Refresh /> Sync to Active Agent</>}
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        {/* Category Pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {(["ALL", "AWS", "GITHUB", "LOGS", "AI", "APP"] as EnvCategory[]).map(c => {
            const active = cat === c;
            return (
              <button key={c} onClick={() => setCat(c)} style={{
                padding: "5px 12px", borderRadius: 6, border: `1px solid ${active ? "var(--orange-border)" : "var(--border)"}`,
                background: active ? "var(--orange-bg)" : "var(--bg-card)",
                color: active ? "var(--orange)" : "var(--text-2)",
                fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              }}>
                {c === "ALL" ? `All (${list.length})` : c}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, padding: "0 12px", borderRadius: 8,
          background: "var(--bg-card)", border: "1px solid var(--border)", height: 32, flex: "0 0 240px",
        }}>
          <span style={{ color: "var(--text-3)", display: "flex" }}><I.Search /></span>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter keys or values…"
            style={{ border: "none", outline: "none", background: "transparent", color: "var(--text-1)", fontSize: 12, width: "100%" }}
          />
        </div>
      </div>

      {/* Variables Table */}
      <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2.2fr 3.2fr 100px 70px", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--badge-bg)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Variable Key</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Value</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>Category</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em", textAlign: "right" }}>Action</span>
        </div>

        {filtered.map(item => {
          const isMasked = item.secret && !showSecrets;
          return (
            <div key={item.key} style={{
              display: "grid", gridTemplateColumns: "2.2fr 3.2fr 100px 70px",
              padding: "8px 18px", borderBottom: "1px solid var(--border-soft)", alignItems: "center", gap: 12,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {item.secret && <span style={{ color: "var(--yellow)" }} title="Secret value"><I.Lock /></span>}
                <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12.5, fontWeight: 600, color: "var(--orange)" }}>
                  {item.key}
                </span>
              </div>
              <div>
                <input
                  type={isMasked ? "password" : "text"}
                  value={item.value}
                  onChange={e => updateItem(item.key, e.target.value)}
                  style={{
                    width: "100%", padding: "6px 10px", borderRadius: 6, fontSize: 12.5,
                    background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
                    fontFamily: "JetBrains Mono, monospace", outline: "none",
                  }}
                />
              </div>
              <div>
                <span style={{
                  fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                  background: item.category === "AWS" ? "var(--orange-bg)" : item.category === "GITHUB" ? "var(--blue-bg)" : item.category === "LOGS" ? "var(--yellow-bg)" : "var(--badge-bg)",
                  color: item.category === "AWS" ? "var(--orange)" : item.category === "GITHUB" ? "var(--blue)" : item.category === "LOGS" ? "var(--yellow)" : "var(--text-2)",
                  border: "1px solid var(--border)",
                }}>
                  {item.category}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                <button onClick={() => deleteItem(item.key)} title="Delete variable" style={{
                  background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "4px 8px", borderRadius: 4,
                }}>
                  <I.X />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Variable Row */}
      <div style={{
        padding: "16px 20px", borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      }}>
        <input
          value={newKey} onChange={e => setNewKey(e.target.value)}
          placeholder="VARIABLE_NAME"
          style={{
            flex: "1 1 200px", padding: "8px 12px", borderRadius: 8, fontSize: 12.5,
            background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
            outline: "none", fontFamily: "JetBrains Mono, monospace",
          }}
        />
        <input
          value={newVal} onChange={e => setNewVal(e.target.value)}
          placeholder="Value (e.g. true, https://..., us-east-1)"
          style={{
            flex: "2 1 280px", padding: "8px 12px", borderRadius: 8, fontSize: 12.5,
            background: "var(--bg-input)", color: "var(--text-1)", border: "1px solid var(--border)",
            outline: "none",
          }}
        />
        <select value={newCat} onChange={e => setNewCat(e.target.value as EnvCategory)} style={{
          padding: "8px 12px", borderRadius: 8, fontSize: 12, background: "var(--bg-input)",
          color: "var(--text-1)", border: "1px solid var(--border)", outline: "none",
        }}>
          {(["APP", "AWS", "GITHUB", "LOGS", "AI"] as EnvCategory[]).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={addItem} style={{
          padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--orange)",
          color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
        }}>
          <I.Plus /> Add Variable
        </button>
      </div>

      {/* Import Modal */}
      {importOpen && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 100, backdropFilter: "blur(4px)",
        }}>
          <div style={{
            width: "90%", maxWidth: 620, background: "var(--bg-card)", borderRadius: 14,
            border: "1px solid var(--border)", padding: 24, boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>
                Import .env for {activeTarget.toUpperCase()}
              </div>
              <button onClick={() => setImportOpen(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}>
                <I.X />
              </button>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text-2)", marginBottom: 12 }}>
              Paste standard KEY=VALUE lines below. Existing keys with the same name will be overwritten.
            </p>
            <textarea
              value={importText} onChange={e => setImportText(e.target.value)}
              placeholder="AWS_REGION=us-east-1&#10;PORT=8000&#10;LOG_LEVEL=DEBUG"
              rows={10}
              style={{
                width: "100%", padding: 12, borderRadius: 8, background: "var(--bg-input)",
                color: "var(--text-1)", border: "1px solid var(--border)", fontFamily: "JetBrains Mono, monospace",
                fontSize: 12.5, resize: "vertical", outline: "none", marginBottom: 16,
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setImportOpen(false)} style={{
                padding: "8px 16px", borderRadius: 8, border: "1px solid var(--border)",
                background: "var(--bg-card2)", color: "var(--text-2)", cursor: "pointer", fontSize: 12.5,
              }}>
                Cancel
              </button>
              <button onClick={handleImport} style={{
                padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--orange)",
                color: "#fff", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
              }}>
                Import & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────── REPO ANALYZER ─────────── */
interface AnalysisResult {
  runtime: string;
  framework: string;
  dockerfile: boolean;
  packageManager: string;
  port: string;
  healthEndpoint: string;
  recommendation: string;
  generatedEnv: string;
}

const RepoAnalyzer = ({ onDeploy }: { onDeploy: (repoUrl: string) => void }) => {
  const [repoUrl, setRepoUrl] = useState("github.com/7gen/react-dashboard");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const startAnalysis = () => {
    if (!repoUrl.trim()) return;
    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const isPython = repoUrl.includes("fastapi") || repoUrl.includes("python");
      const r: AnalysisResult = {
        runtime: isPython ? "Python 3.11 (FastAPI)" : "Node.js 20 (Next.js 14)",
        framework: isPython ? "FastAPI + Uvicorn + Pydantic" : "Next.js App Router + React 18",
        dockerfile: true,
        packageManager: isPython ? "pip / requirements.txt" : "npm / package-lock.json",
        port: isPython ? "8000" : "3000",
        healthEndpoint: "/health",
        recommendation: "AWS ECR + ECS Fargate Container Service",
        generatedEnv: `# Auto-generated deployment .env for ${repoUrl}
PORT=${isPython ? "8000" : "3000"}
RUNTIME=${isPython ? "python311" : "nodejs20"}
AWS_REGION=us-east-1
AWS_ECR_REPO=proveit-${repoUrl.split("/").pop() ?? "service"}
AWS_ECS_CLUSTER=proveit-production-cluster
CONTAINER_CPU=512
CONTAINER_MEMORY=1024
HEALTHCHECK_PATH=/health
LOG_STREAM_ENABLED=true
AUTOSCALING_MIN=1
AUTOSCALING_MAX=3`,
      };
      setResult(r);
      setAnalyzing(false);
    }, 1500);
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      {/* Top Input Bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
          borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)",
        }}>
          <span style={{ color: "var(--text-3)" }}><I.Github /></span>
          <input
            value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
            placeholder="github.com/organization/repository-name"
            style={{
              flex: 1, padding: "12px 0", fontSize: 13.5, background: "none", border: "none",
              outline: "none", color: "var(--text-1)", fontFamily: "JetBrains Mono, monospace",
            }}
          />
        </div>
        <button onClick={startAnalysis} disabled={analyzing} style={{
          padding: "0 24px", borderRadius: 10, border: "none", background: "var(--orange)",
          color: "#fff", fontSize: 13, fontWeight: 600, cursor: analyzing ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          {analyzing ? <><I.Loader /> Inspecting…</> : <><I.Scan /> Analyze Repo</>}
        </button>
      </div>

      {/* Suggested Quick Repos */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>Quick inspect:</span>
        {["github.com/7gen/react-dashboard", "github.com/7gen/fastapi-backend", "github.com/7gen/data-worker"].map(r => (
          <button key={r} onClick={() => { setRepoUrl(r); }} style={{
            padding: "4px 10px", borderRadius: 6, border: "1px solid var(--border)",
            background: "var(--badge-bg)", color: "var(--text-2)", fontSize: 11.5, cursor: "pointer",
          }}>
            {r.split("/").pop()}
          </button>
        ))}
      </div>

      {/* Scanning status */}
      {analyzing && (
        <div style={{
          padding: 24, borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
          display: "flex", flexDirection: "column", gap: 12,
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--orange)", display: "flex", alignItems: "center", gap: 8 }}>
            <I.Loader /> Scanning repository structure and dependency manifest…
          </div>
          {[
            "Resolving repository branch and latest commit hash",
            "Inspecting package.json / requirements.txt / Dockerfile",
            "Detecting exposed container ports & healthcheck probes",
            "Synthesizing required environment variables for AWS deployment",
          ].map((msg, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-2)" }}>
              <span style={{ color: "var(--green)" }}><I.Check /></span> {msg}
            </div>
          ))}
        </div>
      )}

      {/* Analysis Results */}
      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Metrics grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { l: "Runtime Engine", v: result.runtime, c: "var(--green)" },
              { l: "Framework", v: result.framework, c: "var(--blue)" },
              { l: "Dockerfile Status", v: result.dockerfile ? "Valid (Multi-stage)" : "Missing", c: "var(--green)" },
              { l: "Exposed Port", v: result.port, c: "var(--orange)" },
              { l: "Health Probe", v: result.healthEndpoint, c: "var(--green)" },
              { l: "AWS Recommendation", v: result.recommendation, c: "var(--orange)" },
            ].map(m => (
              <div key={m.l} style={{ padding: "16px 18px", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>{m.l}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: m.c, fontFamily: "JetBrains Mono, monospace" }}>{m.v}</div>
              </div>
            ))}
          </div>

          {/* Generated .env block */}
          <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
            <div style={{
              padding: "12px 18px", borderBottom: "1px solid var(--border)", display: "flex",
              justifyContent: "space-between", alignItems: "center", background: "var(--badge-bg)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                Tailored Deployment Environment File (.env)
              </span>
              <button onClick={() => navigator.clipboard.writeText(result.generatedEnv)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", borderRadius: 6,
                border: "1px solid var(--border)", background: "var(--bg-card)", color: "var(--text-1)",
                fontSize: 11.5, cursor: "pointer",
              }}>
                <I.Copy /> Copy .env
              </button>
            </div>
            <pre style={{
              padding: 16, fontFamily: "JetBrains Mono, monospace", fontSize: 12,
              lineHeight: 1.8, color: "var(--text-2)", background: "var(--bg-input)", margin: 0, overflow: "auto",
            }}>
              {result.generatedEnv}
            </pre>
          </div>

          {/* Deploy CTA */}
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button onClick={() => onDeploy(repoUrl)} style={{
              padding: "12px 28px", borderRadius: 10, border: "none", background: "var(--orange)",
              color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            }}>
              <I.Zap /> Launch Autonomous Deployment
            </button>
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              The agent will build, deploy to AWS ECS Fargate, and prove health check stability.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────── REPOS LIST ─────────── */
const REPOS = [
  { name: "7gen/react-dashboard", lang: "TypeScript / Next.js", status: "healthy", region: "us-east-1", ago: "12m ago" },
  { name: "7gen/fastapi-backend", lang: "Python / FastAPI", status: "healthy", region: "us-east-1", ago: "2h ago" },
  { name: "7gen/data-worker", lang: "Node.js / Express", status: "healed", region: "us-east-1", ago: "5h ago" },
  { name: "7gen/analytics-pipeline", lang: "Python / Celery", status: "healthy", region: "us-west-2", ago: "1d ago" },
];

const ReposPanel = ({ onDeploy }: { onDeploy: (r: string) => void }) => (
  <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Active Repositories</div>
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>Repositories linked with automated deployment hooks</div>
      </div>
      <button style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
        border: "none", background: "var(--orange)", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
      }}>
        <I.Plus /> Connect GitHub Repository
      </button>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {REPOS.map(r => (
        <div key={r.name} style={{
          display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 12,
          background: "var(--bg-card)", border: "1px solid var(--border)",
        }}>
          <span style={{ color: "var(--text-2)" }}><I.Github /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
              {r.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
              {r.lang} · {r.region} · last active {r.ago}
            </div>
          </div>
          <span style={{
            fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
            background: r.status === "healthy" ? "var(--green-bg)" : "var(--orange-bg)",
            color: r.status === "healthy" ? "var(--green)" : "var(--orange)",
            border: `1px solid ${r.status === "healthy" ? "var(--green)" : "var(--orange)"}33`,
          }}>
            {r.status === "healthy" ? "● Healthy" : "● Self-Healed"}
          </span>
          <button onClick={() => onDeploy(r.name)} style={{
            padding: "7px 18px", borderRadius: 8, border: "1px solid var(--orange-border)",
            background: "var(--orange-bg)", color: "var(--orange)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
          }}>
            Deploy
          </button>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────── INFRA PANEL ─────────── */
const InfraPanel = () => (
  <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginBottom: 24 }}>
      {[
        { l: "EC2 Instances", v: "2 Running", sub: "t3.small · us-east-1", c: "var(--green)", i: <I.Cpu /> },
        { l: "ECS Fargate Services", v: "3 Active", sub: "100% desired tasks", c: "var(--green)", i: <I.Zap /> },
        { l: "ECR Repositories", v: "4 Images", sub: "Scan vulnerability: 0 high", c: "var(--blue)", i: <I.Database /> },
        { l: "CloudWatch Alarms", v: "0 Firing", sub: "All targets healthy", c: "var(--text-3)", i: <I.Activity /> },
        { l: "Autonomous Deploys", v: "14 Verified", sub: "100% success rate", c: "var(--orange)", i: <I.Cloud /> },
        { l: "Self-Heal Interventions", v: "3 Proven", sub: "Mean recovery: 2.1m", c: "var(--orange)", i: <I.Shield /> },
      ].map(c => (
        <div key={c.l} style={{ padding: 18, borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--text-3)" }}>
            {c.i}
            <span style={{ fontSize: 12, fontWeight: 500 }}>{c.l}</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: c.c, fontFamily: "JetBrains Mono, monospace" }}>{c.v}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{c.sub}</div>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────── LOGS PANEL ─────────── */
const LogsPanel = () => (
  <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
    <div style={{
      borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)",
      padding: "16px 20px", fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-2)", lineHeight: 2,
    }}>
      {[
        ["INFO", "Agent runner initiated (Gemini Flash 2.5)", "var(--blue)"],
        ["INFO", "Connected to AWS CloudWatch Log Group /aws/proveit/deployments", "var(--blue)"],
        ["INFO", "Verified GitHub access token (@proveit-bot)", "var(--green)"],
        ["DEBUG", "AWS STS GetCallerIdentity -> account 123456789012 (us-east-1)", "var(--text-3)"],
        ["INFO", "ECS Cluster state: 3 services healthy, 0 failing tasks", "var(--green)"],
        ["WARN", "Memory utilization warning on worker-02 (78%) -> watching", "var(--yellow)"],
        ["INFO", "Proof ledger synchronized: 14 total cryptographic proofs verified", "var(--blue)"],
      ].map(([lvl, msg, col], i) => (
        <div key={i} style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ color: "var(--text-3)", width: 68, flexShrink: 0 }}>10:4{i}:12</span>
          <span style={{ color: col as string, width: 60, flexShrink: 0, fontWeight: 700 }}>[{lvl}]</span>
          <span style={{ color: "var(--text-1)" }}>{msg}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────── ACTIVITY PANEL ─────────── */
const ActivityPanel = () => (
  <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
    {[
      { action: "Deployed service", target: "7gen/react-dashboard", result: "HTTP 200 Proven", time: "12m ago", c: "var(--green)" },
      { action: "Self-healed container", target: "7gen/data-worker (OOMKilled)", result: "Memory patched to 1024MB", time: "5h ago", c: "var(--orange)" },
      { action: "ECR Image Pushed", target: "7gen/fastapi-backend:v1.4", result: "Image vulnerability scan clean", time: "2h ago", c: "var(--blue)" },
    ].map((item, i, arr) => (
      <div key={i} style={{ display: "flex", gap: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.c, marginTop: 4, flexShrink: 0 }} />
          {i < arr.length - 1 && <div style={{ width: 1, flex: 1, background: "var(--border)", marginTop: 6 }} />}
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>
            {item.action} — <span style={{ fontFamily: "JetBrains Mono, monospace" }}>{item.target}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{item.result} · {item.time}</div>
        </div>
      </div>
    ))}
  </div>
);

/* ─────────── PROOF LEDGER PANEL ─────────── */
const LedgerPanel = () => (
  <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
    <div style={{ borderRadius: 12, background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontSize: 13, fontWeight: 700, color: "var(--text-1)", background: "var(--badge-bg)" }}>
        Immutable Proof Ledger — Cryptographically Signed Fixes
      </div>
      {[
        { run: "run-0042", action: "Deploy 7gen/react-dashboard", evidence: "Health 200 OK · p99 < 85ms", hash: "4a7f9c2d1b", time: "12m ago" },
        { run: "run-0041", action: "Self-heal 7gen/data-worker", evidence: "OOM fixed: 0 restarts over 30min", hash: "8b1e4c3a9f", time: "5h ago" },
        { run: "run-0040", action: "Deploy 7gen/fastapi-backend", evidence: "Uvicorn worker healthy on port 8000", hash: "f3c2a1e94b", time: "2h ago" },
      ].map(r => (
        <div key={r.run} style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-soft)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--orange)", fontWeight: 700 }}>{r.run}</span>
              <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{r.action}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{r.evidence}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11.5, color: "var(--text-2)", background: "var(--badge-bg)", padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border)" }}>
              #{r.hash}
            </span>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>{r.time}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ─────────── SETTINGS PANEL ─────────── */
const SettingsPanel = ({ theme, setTheme }: { theme: ThemeMode; setTheme: (t: ThemeMode) => void }) => {
  const [approval, setApproval] = useState(true);
  const [sandbox, setSandbox] = useState(true);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      <div style={{ maxWidth: 680 }}>
        {/* Appearance */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
            Theme & Appearance
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <button onClick={() => setTheme("light")} style={{
              padding: "16px 20px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${theme === "light" ? "var(--orange)" : "var(--border)"}`,
              background: "#ffffff", color: "#0f172a", textAlign: "left",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <I.Sun />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>Pure White (SaaS Light)</div>
                <div style={{ fontSize: 11.5, color: "#64748b" }}>Crisp high-contrast white & slate</div>
              </div>
            </button>
            <button onClick={() => setTheme("dark")} style={{
              padding: "16px 20px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${theme === "dark" ? "var(--orange)" : "var(--border)"}`,
              background: "#151518", color: "#ffffff", textAlign: "left",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <I.Moon />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>Midnight Charcoal (Dark)</div>
                <div style={{ fontSize: 11.5, color: "#a1a1aa" }}>Sleek dark mode with orange accents</div>
              </div>
            </button>
          </div>
        </div>

        {/* Safety */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
            Safety & Deployment Guardrails
          </div>
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>Require Human Approval for Production</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Gate production container promotions behind approval prompt</div>
            </div>
            <button onClick={() => setApproval(!approval)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: approval ? "var(--orange)" : "var(--border)", position: "relative", transition: "background .2s",
            }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: approval ? 23 : 3, transition: "left .2s" }} />
            </button>
          </div>
          <div style={{ padding: "14px 18px", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>Isolated Sandbox Container Verification</div>
              <div style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>Always test repairs in sandbox before updating production tasks</div>
            </div>
            <button onClick={() => setSandbox(!sandbox)} style={{
              width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
              background: sandbox ? "var(--orange)" : "var(--border)", position: "relative", transition: "background .2s",
            }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: sandbox ? 23 : 3, transition: "left .2s" }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────── TOP HEADER ─────────── */
interface HeaderProps {
  view: string;
  setView: (v: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  target: EnvTarget;
  setTarget: (t: EnvTarget) => void;
  onDeployClick: () => void;
}

const Header = ({ view, setView, theme, setTheme, target, setTarget, onDeployClick }: HeaderProps) => {
  const meta = PAGE_META[view] ?? PAGE_META.chat;

  return (
    <header style={{
      height: 56, display: "flex", alignItems: "center", padding: "0 20px", gap: 14, flexShrink: 0,
      background: "var(--header-bg)", borderBottom: "1px solid var(--header-border)",
      position: "sticky", top: 0, zIndex: 50,
    }}>
      {/* Brand logo & Live status beacon */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, background: "var(--orange)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "JetBrains Mono, monospace",
        }}>
          P
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)", letterSpacing: "-.02em" }}>ProveIt</span>
            <div style={{
              display: "flex", alignItems: "center", gap: 4, padding: "1px 6px", borderRadius: 10,
              background: "var(--green-bg)", color: "var(--green)", fontSize: 9.5, fontWeight: 700,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--green)", animation: "pulseDot 2s infinite" }} />
              LIVE
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "var(--border)" }} />

      {/* Breadcrumb navigator */}
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ fontSize: 12.5, color: "var(--text-3)", fontWeight: 500 }}>App</span>
        <span style={{ color: "var(--text-4)", fontSize: 12 }}>/</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{meta.title}</span>
      </div>

      <div style={{ flex: 1 }} />

      {/* Status Badges: AWS, GitHub, Logs */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* AWS Status Pill */}
        <button onClick={() => setView("secrets")} title="AWS Connection: Active in us-east-1 (Click to manage)" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--badge-bg)", color: "var(--text-1)",
          fontSize: 11.5, fontWeight: 600, cursor: "pointer",
        }}>
          <span style={{ color: "var(--orange)" }}><I.Cloud /></span>
          <span>AWS: us-east-1</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
        </button>

        {/* GitHub Status Pill */}
        <button onClick={() => setView("repos")} title="GitHub Connected: @proveit-bot (Click to view repos)" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--badge-bg)", color: "var(--text-1)",
          fontSize: 11.5, fontWeight: 600, cursor: "pointer",
        }}>
          <I.Github />
          <span>@proveit-bot</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--green)" }} />
        </button>

        {/* Logs Connection Pill */}
        <button onClick={() => setView("logs")} title="CloudWatch Log Stream Connected" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 8,
          border: "1px solid var(--border)", background: "var(--badge-bg)", color: "var(--text-1)",
          fontSize: 11.5, fontWeight: 600, cursor: "pointer",
        }}>
          <span style={{ color: "var(--blue)" }}><I.Terminal /></span>
          <span>Logs OK</span>
        </button>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "var(--border)" }} />

      {/* Target Environment Switcher (DEV / STG / PROD) */}
      <div style={{ display: "flex", background: "var(--badge-bg)", padding: 2, borderRadius: 8, border: "1px solid var(--border)" }}>
        {(["development", "staging", "production"] as EnvTarget[]).map(t => {
          const short = t === "development" ? "DEV" : t === "staging" ? "STG" : "PROD";
          const active = target === t;
          return (
            <button key={t} onClick={() => setTarget(t)} title={`Switch active target to ${t}`} style={{
              padding: "4px 9px", borderRadius: 6, border: "none", cursor: "pointer",
              fontSize: 10.5, fontWeight: 700,
              background: active ? "var(--orange)" : "transparent",
              color: active ? "#ffffff" : "var(--text-3)",
              transition: "all .15s",
            }}>
              {short}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "var(--border)" }} />

      {/* White / Light Theme Toggle Button */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        title={theme === "dark" ? "Switch to Pure White SaaS Theme" : "Switch to Midnight Charcoal Dark Theme"}
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 8,
          border: "1px solid var(--border)", cursor: "pointer",
          background: "var(--badge-bg)", color: "var(--text-1)",
          fontSize: 12, fontWeight: 600, transition: "all .15s",
        }}
      >
        {theme === "dark" ? (
          <>
            <span style={{ color: "var(--yellow)" }}><I.Sun /></span>
            <span>White Theme</span>
          </>
        ) : (
          <>
            <span style={{ color: "var(--blue)" }}><I.Moon /></span>
            <span>Dark Theme</span>
          </>
        )}
      </button>

      {/* Quick Deploy CTA button */}
      <button onClick={onDeployClick} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
        border: "none", background: "var(--orange)", color: "#fff",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
      }}>
        <I.Zap />
        <span>Deploy Repo</span>
      </button>

      {/* User Avatar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "3px 8px 3px 6px",
        borderRadius: 8, border: "1px solid var(--border)", background: "var(--badge-bg)", cursor: "pointer",
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: "50%", background: "var(--orange)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 800, color: "#fff",
        }}>
          7G
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>7th Gen</span>
      </div>
    </header>
  );
};

/* ─────────── MAIN APPLICATION PAGE ─────────── */
const WELCOME_MESSAGE: Message = {
  id: "w0",
  role: "agent",
  text: "Hi — I am ProveIt.\n\nPaste any GitHub repo URL to inspect build dependencies, configure AWS/GitHub secrets, generate production `.env` files, and launch autonomous self-healing deployments.\n\nI will plan, build, deploy, verify, and prove every step.",
  meta: "Gemini 2.5 Flash Agent",
  timestamp: "Ready",
};

export default function Page() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [view, setView] = useState("chat");
  const [target, setTarget] = useState<EnvTarget>("development");
  const [msgs, setMsgs] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync theme to CSS custom properties & data-theme attribute
  useEffect(() => {
    const vars = THEME_VARS[theme];
    Object.entries(vars).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing]);

  const send = useCallback((text?: string) => {
    const t = (text ?? input).trim();
    if (!t) return;
    setInput("");
    setMsgs(p => [...p, { id: `u${Date.now()}`, role: "user", text: t, timestamp: "Now" }]);
    setTyping(true);

    setTimeout(() => {
      const reply = agentReply(t);
      setMsgs(p => [...p, { id: `a${Date.now()}`, role: "agent", ...reply, timestamp: "Just now" }]);
      setTyping(false);
    }, 900);
  }, [input]);

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const deployFromPanel = (repoUrl: string) => {
    setView("chat");
    setTimeout(() => send(`Deploy ${repoUrl}`), 100);
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.3;transform:scale(.7);} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);} }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-app)", color: "var(--text-1)", overflow: "hidden" }}>
        {/* Top Header */}
        <Header
          view={view}
          setView={setView}
          theme={theme}
          setTheme={setTheme}
          target={target}
          setTarget={setTarget}
          onDeployClick={() => setView("analyze")}
        />

        {/* Main Body: Sidebar + Content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar */}
          <aside style={{
            width: 240, flexShrink: 0, display: "flex", flexDirection: "column",
            background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)",
          }}>
            {/* Navigation links */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
              {NAV.map(group => (
                <div key={group.section} style={{ marginBottom: 12 }}>
                  <div style={{
                    fontSize: 10.5, fontWeight: 700, letterSpacing: ".08em",
                    color: "var(--sidebar-section)", padding: "6px 10px 4px", textTransform: "uppercase",
                  }}>
                    {group.section}
                  </div>
                  {group.items.map(item => {
                    const active = view === item.id;
                    return (
                      <button key={item.id} onClick={() => setView(item.id)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: "none",
                        background: active ? "var(--bg-sidebar-active)" : "transparent",
                        color: active ? "var(--orange)" : "var(--text-2)",
                        fontSize: 13, fontWeight: active ? 700 : 500,
                        outline: active ? "1px solid var(--orange-border)" : "none",
                        transition: "all .12s", marginBottom: 2,
                      }}>
                        <span style={{ display: "flex", alignItems: "center" }}>{item.icon}</span>
                        <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                        {"badge" in item && item.badge && (
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                            background: active ? "var(--orange)" : "var(--badge-bg)",
                            color: active ? "#fff" : "var(--text-3)",
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--green)", fontWeight: 600 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--green)", animation: "pulseDot 2s infinite" }} />
                  Agent Online
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "JetBrains Mono, monospace" }}>us-east-1</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                Target: <strong style={{ color: "var(--orange)" }}>{target.toUpperCase()}</strong>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--bg-main)" }}>
            {/* Sub-header title */}
            <div style={{
              padding: "12px 32px", borderBottom: "1px solid var(--border)",
              background: "var(--bg-sidebar)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{PAGE_META[view]?.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>{PAGE_META[view]?.sub}</div>
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                background: "var(--orange-bg)", color: "var(--orange)", border: "1px solid var(--orange-border)",
              }}>
                {PAGE_META[view]?.badge}
              </span>
            </div>

            {/* Active view renderer */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {view === "chat" && (
                <>
                  <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
                    {msgs.map(m => <Bubble key={m.id} msg={m} />)}
                    {typing && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)", fontSize: 12.5 }}>
                        <I.Loader /> ProveIt reasoning through AWS deployment graph…
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {msgs.length <= 1 && (
                    <div style={{ padding: "0 32px 14px", display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        "Deploy github.com/7gen/react-dashboard",
                        "Diagnose OOMKilled worker on ECS",
                        "Show AWS infrastructure status",
                        "Generate deployment .env for Next.js",
                      ].map(q => (
                        <button key={q} onClick={() => send(q)} style={{
                          padding: "6px 14px", borderRadius: 8, cursor: "pointer",
                          background: "var(--bg-card)", border: "1px solid var(--border)",
                          color: "var(--text-2)", fontSize: 12, fontWeight: 500,
                        }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid var(--border)", padding: "14px 32px", background: "var(--bg-sidebar)", flexShrink: 0 }}>
                    <div style={{
                      display: "flex", gap: 10, alignItems: "flex-end", background: "var(--bg-input)",
                      border: "1px solid var(--border)", borderRadius: 12, padding: "10px 10px 10px 16px",
                    }}>
                      <textarea
                        ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
                        rows={1} placeholder="Paste a GitHub URL or describe a failing service to diagnose…"
                        style={{
                          flex: 1, resize: "none", border: "none", outline: "none", background: "transparent",
                          color: "var(--text-1)", fontSize: 13.5, lineHeight: 1.5, maxHeight: 120, fontFamily: "inherit",
                        }}
                      />
                      <button onClick={() => send()} disabled={!input.trim() || typing} style={{
                        width: 34, height: 34, borderRadius: 8, border: "none", flexShrink: 0,
                        cursor: input.trim() && !typing ? "pointer" : "not-allowed",
                        background: input.trim() && !typing ? "var(--orange)" : "var(--border)",
                        color: input.trim() && !typing ? "#fff" : "var(--text-3)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <I.Send />
                      </button>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-3)" }}>
                      Press Enter to send · Shift+Enter for newline · Powered by <strong style={{ color: "var(--orange)" }}>Gemini 2.5 Flash</strong> + AWS CloudFormation
                    </div>
                  </div>
                </>
              )}

              {view === "repos" && <ReposPanel onDeploy={deployFromPanel} />}
              {view === "analyze" && <RepoAnalyzer onDeploy={deployFromPanel} />}
              {view === "infra" && <InfraPanel />}
              {view === "secrets" && <SecretsPanel />}
              {view === "envfiles" && <EnvPanel activeTarget={target} setActiveTarget={setTarget} />}
              {view === "logs" && <LogsPanel />}
              {view === "activity" && <ActivityPanel />}
              {view === "ledger" && <LedgerPanel />}
              {view === "settings" && <SettingsPanel theme={theme} setTheme={setTheme} />}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
