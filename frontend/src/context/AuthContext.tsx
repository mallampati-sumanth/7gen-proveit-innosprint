"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { setAuthToken } from "../lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AuthUser {
  user_id: string;
  username: string;
  email: string;
  name?: string;
  avatar_url?: string;
  auth_provider: "email" | "github";
  is_admin: boolean;
  phone_number?: string;
  phone_verified?: boolean;
  voice_pin?: string;
  voice_enabled?: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  saveAuthSession: (token: string, user: AuthUser) => void;
  loginWithEmail: (usernameOrEmail: string, password: string) => Promise<boolean>;
  registerWithEmail: (email: string, username: string, password: string, name?: string) => Promise<boolean>;
  loginWithGitHubToken: (token: string) => Promise<boolean>;
  loginWithGitHubOAuth: () => Promise<void>;
  loginAsDemoAdmin: () => Promise<boolean>;
  updateProfile: (data: { name?: string; phone_number?: string; voice_pin?: string; voice_enabled?: boolean }) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedToken = localStorage.getItem("proveit_token");
        const storedUserData = localStorage.getItem("proveit_user_data");
        const storedUser = localStorage.getItem("proveit_user");
        if (storedToken && storedUserData) {
          return JSON.parse(storedUserData);
        }
        if (storedToken && storedUser) {
          return {
            user_id: "usr_cached",
            username: storedUser,
            email: `${storedUser}@proveit.cloud`,
            auth_provider: "github",
            is_admin: storedUser === "admin",
          };
        }
      } catch {}
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const t = localStorage.getItem("proveit_token");
        if (t) setAuthToken(t);
        return t;
      } catch {}
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const saveAuthSession = (t: string, u: AuthUser) => {
    setToken(t);
    setAuthToken(t);
    setUser(u);
    setError(null);
    if (typeof window !== "undefined") {
      const prevUser = localStorage.getItem("proveit_user");
      if (prevUser && prevUser !== u.username) {
        localStorage.removeItem("proveit_github_pat");
      }
      localStorage.setItem("proveit_token", t);
      localStorage.setItem("proveit_user", u.username);
      localStorage.setItem("proveit_user_data", JSON.stringify(u));
      window.dispatchEvent(new Event("proveit_auth_changed"));
    }
  };

  // Validate existing stored token on mount in background
  useEffect(() => {
    let active = true;

    const handleAuthChange = () => {
      if (typeof window === "undefined") return;
      const storedToken = localStorage.getItem("proveit_token");
      const storedUserData = localStorage.getItem("proveit_user_data");
      const storedUser = localStorage.getItem("proveit_user");
      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
        if (storedUserData) {
          try {
            setUser(JSON.parse(storedUserData));
          } catch {
            if (storedUser) {
              setUser({
                user_id: "usr_cached",
                username: storedUser,
                email: `${storedUser}@proveit.cloud`,
                auth_provider: "github",
                is_admin: storedUser === "admin",
              });
            }
          }
        }
      } else {
        setUser(null);
        setToken(null);
        setAuthToken("");
      }
    };

    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("proveit_auth_changed", handleAuthChange);

    // Safety fallback timer: Ensure loading never hangs beyond 1.2s
    const safetyTimer = setTimeout(() => {
      if (active) setLoading(false);
    }, 1200);

    const initAuth = async () => {
      try {
        if (typeof window === "undefined") {
          if (active) setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem("proveit_token");
        const storedUserData = localStorage.getItem("proveit_user_data");
        const storedUser = localStorage.getItem("proveit_user");
        if (!storedToken) {
          if (active) setLoading(false);
          return;
        }

        if (active) {
          if (storedUserData) {
            try {
              setUser(JSON.parse(storedUserData));
            } catch {
              if (storedUser) {
                setUser({
                  user_id: "usr_cached",
                  username: storedUser,
                  email: `${storedUser}@proveit.cloud`,
                  auth_provider: "github",
                  is_admin: storedUser === "admin",
                });
              }
            }
          } else if (storedUser) {
            setUser({
              user_id: "usr_cached",
              username: storedUser,
              email: `${storedUser}@proveit.cloud`,
              auth_provider: "github",
              is_admin: storedUser === "admin",
            });
          }
          setToken(storedToken);
          setAuthToken(storedToken);
          setLoading(false);
        }

        // Background verification with AbortController timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        try {
          const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const userData = await res.json();
            if (active) {
              setUser(userData);
              setToken(storedToken);
              setAuthToken(storedToken);
              localStorage.setItem("proveit_user_data", JSON.stringify(userData));
            }
          } else if (res.status === 401) {
            // Token definitely expired or revoked
            localStorage.removeItem("proveit_token");
            localStorage.removeItem("proveit_user");
            localStorage.removeItem("proveit_user_data");
            if (active) {
              setUser(null);
              setToken(null);
              setAuthToken("");
            }
          }
        } catch (fetchErr) {
          clearTimeout(timeoutId);
          // If network / timeout, keep cached offline user session
        }
      } catch (err) {
        console.warn("Auth initialization notice:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    initAuth();

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("proveit_auth_changed", handleAuthChange);
    };
  }, []);

  const loginWithEmail = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: usernameOrEmail.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Authentication failed. Please check your credentials.");
      }

      saveAuthSession(data.access_token, data.user);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to log in.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    username: string,
    password: string,
    name?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          username: username.trim(),
          password: password.trim(),
          name: name?.trim() || username.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please check inputs.");
      }

      saveAuthSession(data.access_token, data.user);
      return true;
    } catch (err: any) {
      setError(err.message || "Registration error.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGitHubToken = async (ghToken: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/github`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: ghToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Failed to authenticate with GitHub token.");
      }

      saveAuthSession(data.access_token, data.user);
      if (typeof window !== "undefined") {
        if (data.user?.username) {
          localStorage.setItem(`proveit_github_pat_${data.user.username}`, ghToken.trim());
        }
        localStorage.setItem("proveit_github_pat", ghToken.trim());
      }
      return true;
    } catch (err: any) {
      setError(err.message || "GitHub authentication error.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGitHubOAuth = async (): Promise<void> => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/auth/github/url`);
      const data = await res.json();
      if (data.configured && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(
          data.message ||
            "GitHub OAuth app credentials not configured on backend. Please connect with your GitHub Personal Access Token."
        );
      }
    } catch (err: any) {
      setError(err.message || "Could not initialize GitHub OAuth.");
    }
  };

  const loginAsDemoAdmin = async (): Promise<boolean> => {
    return loginWithEmail("admin", "proveit_demo_secret_2026");
  };

  const refreshUser = async () => {
    const storedToken = token || (typeof window !== "undefined" ? localStorage.getItem("proveit_token") : null);
    if (!storedToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      }
    } catch {}
  };

  const updateProfile = async (data: { name?: string; phone_number?: string; voice_pin?: string; voice_enabled?: boolean }): Promise<boolean> => {
    setError(null);
    try {
      const storedToken = token || (typeof window !== "undefined" ? localStorage.getItem("proveit_token") : null);
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(storedToken ? { Authorization: `Bearer ${storedToken}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.detail || "Failed to update profile.");
      }
      setUser(resData);
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to update profile.");
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("proveit_token");
      localStorage.removeItem("proveit_user");
      localStorage.removeItem("proveit_user_data");
      localStorage.removeItem("proveit_github_pat");
      window.dispatchEvent(new Event("proveit_auth_changed"));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        saveAuthSession,
        loginWithEmail,
        registerWithEmail,
        loginWithGitHubToken,
        loginWithGitHubOAuth,
        loginAsDemoAdmin,
        updateProfile,
        refreshUser,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
