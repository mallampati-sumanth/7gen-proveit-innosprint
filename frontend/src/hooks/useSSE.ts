"use client";

import { useEffect, useState } from "react";
import { BACKEND_URL } from "@/lib/api";
import { EventItem } from "@/lib/types";

export function useSSE(runId: string | null) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`${BACKEND_URL}/api/runs/${runId}/events`);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setEvents((prev) => [...prev, parsed]);
      } catch (err) {
        console.error("Failed to parse SSE event", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE disconnected or completed", err);
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [runId]);

  return { events, isConnected, error };
}
