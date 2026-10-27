"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";

export default function LoginPage() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      window.location.href = "/console";
    }
  }, [user]);

  return <AuthScreen />;
}
