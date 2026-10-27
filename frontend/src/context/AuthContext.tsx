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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Validate existing stored token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window === "undefined") {
          setLoading(false);
          return;
        }

        const storedToken = localStorage.getItem("proveit_token");
        const storedUser = localStorage.getItem("proveit_user");
        if (!storedToken) {
          setLoading(false);
          return;
        }

        if (storedUser) {
          setUser({
            user_id: "usr_cached",
            username: storedUser,
            email: `${storedUser}@proveit.cloud`,
            auth_provider: "email",
            is_admin: storedUser === "admin",
          });
          setToken(storedToken);
          setAuthToken(storedToken);
        }

        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          setToken(storedToken);
          setAuthToken(storedToken);
        } else {
          // Token invalid or expired
          localStorage.removeItem("proveit_token");
          localStorage.removeItem("proveit_user");
          setUser(null);
          setToken(null);
          setAuthToken("");
        }
      } catch (err) {
        console.warn("Failed to verify authentication session:", err);
        // Fallback to offline stored state if backend is momentarily unreachable
        const storedUser = localStorage.getItem("proveit_user");
        const storedToken = localStorage.getItem("proveit_token");
        if (storedToken && storedUser) {
          setUser({
            user_id: "usr_cached",
            username: storedUser,
            email: `${storedUser}@proveit.cloud`,
            auth_provider: "email",
            is_admin: storedUser === "admin",
          });
          setToken(storedToken);
          setAuthToken(storedToken);
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveAuthSession = (t: string, u: AuthUser) => {
    setToken(t);
    setAuthToken(t);
    setUser(u);
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("proveit_token", t);
      localStorage.setItem("proveit_user", u.username);
    }
  };

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
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
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
