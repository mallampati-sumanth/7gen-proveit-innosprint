"use client";

import React, { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AuthScreen } from "@/components/AuthScreen";

function SignupInner() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      window.location.href = "/console";
    }
  }, [user]);

  return <AuthScreen />;
}

export default function SignupPage() {
  return (
    <AuthProvider>
      <SignupInner />
    </AuthProvider>
  );
}
