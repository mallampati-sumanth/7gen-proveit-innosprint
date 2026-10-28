"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  (typeof window !== "undefined" && window.location.origin.includes("vercel.app")
    ? ""
    : "http://localhost:8000");

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveAuthSession } = useAuth();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const executedRef = React.useRef(false);

  useEffect(() => {
    if (executedRef.current) return;

    const code = searchParams.get("code");
    const errorParam = searchParams.get("error_description") || searchParams.get("error");

    if (errorParam) {
      executedRef.current = true;
      setStatus("error");
      setErrorMessage(errorParam);
      return;
    }

    if (!code) {
      // Wait for search params to populate without flashing error
      const timeout = setTimeout(() => {
        if (!executedRef.current && !searchParams.get("code")) {
          executedRef.current = true;
          setStatus("error");
          setErrorMessage("No authorization code found in GitHub redirect parameters.");
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }

    executedRef.current = true;

    const exchangeCode = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/github`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || "Failed to exchange GitHub authorization code.");
        }

        // 1. Immediately store credentials & full user object in localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem("proveit_token", data.access_token);
          localStorage.setItem("proveit_user", data.user.username);
          localStorage.setItem("proveit_user_data", JSON.stringify(data.user));
          if (data.github_token) {
            localStorage.setItem("proveit_github_pat", data.github_token);
            if (data.user?.username) {
              localStorage.setItem(`proveit_github_pat_${data.user.username}`, data.github_token);
            }
          }
        }

        // 2. Commit session to React AuthContext
        saveAuthSession(data.access_token, data.user);

        setStatus("success");
        setTimeout(() => {
          // Hard navigation to console ensures full fresh hydration of auth, state & API headers
          window.location.href = "/console";
        }, 500);
      } catch (err: any) {
        setStatus("error");
        setErrorMessage(err.message || "Could not complete GitHub authentication.");
      }
    };

    exchangeCode();
  }, [searchParams, router, saveAuthSession]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1a1512 0%, #0d0f12 70%)",
      padding: "24px",
      fontFamily: "'Inter', sans-serif",
      color: "#f1f5f9",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "rgba(18, 20, 26, 0.95)",
        border: "1px solid rgba(249, 115, 22, 0.25)",
        borderRadius: 18,
        boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(20px)",
        padding: "36px 30px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}>
        {status === "processing" && (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              border: "3px solid #f97316",
              borderTopColor: "transparent",
              animation: "spin 1s linear infinite",
            }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>
              Connecting with GitHub…
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
              Exchanging OAuth credentials and establishing your encrypted ProveIt session.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.15)",
              color: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}>
              ✓
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#22c55e" }}>
              Authenticated with GitHub
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              Redirecting you to your deployment dashboard…
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 800,
            }}>
              ✕
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#ef4444" }}>
              Authentication Failed
            </h2>
            <p style={{ fontSize: 12.5, color: "#fca5a5", margin: 0, lineHeight: 1.4 }}>
              {errorMessage}
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                marginTop: 8,
                padding: "9px 20px",
                borderRadius: 8,
                border: "none",
                background: "#f97316",
                color: "#ffffff",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Return to Sign In
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0d0f12", color: "#f97316" }}>
        Loading…
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
