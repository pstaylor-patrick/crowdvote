"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { SSEEvent } from "@crowdvote/types";

export function useSSE(sessionId: string | null) {
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string | undefined>(undefined);

  const connect = useCallback(() => {
    if (!sessionId) return;

    const url = `/api/sse/${sessionId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setIsConnected(true);

    es.onmessage = (e) => {
      lastEventIdRef.current = e.lastEventId;
      try {
        const event = JSON.parse(e.data) as SSEEvent;
        setLastEvent(event);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      es.close();
      // Auto-reconnect after 2 seconds
      setTimeout(connect, 2000);
    };
  }, [sessionId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return { lastEvent, isConnected };
}
