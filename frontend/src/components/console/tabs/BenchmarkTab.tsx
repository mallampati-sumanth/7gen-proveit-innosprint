import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../types";
import { BenchmarkView } from "@/components/benchmark/BenchmarkView";

export const BenchmarkTab = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agent/benchmark/results`);
      const data = await res.json();
      if (Array.isArray(data)) setResults(data);
    } catch (err) {
      console.warn("Failed to load benchmark results:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px 40px" }}>
      <BenchmarkView results={results} onRefresh={fetchResults} />
    </div>
  );
};
