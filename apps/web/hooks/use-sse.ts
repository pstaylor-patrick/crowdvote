"use client";

import { useEffect, useRef, useState } from "react";
import type { SSEEvent } from "@crowdvote/types";

export function useSSE(sessionId: string | null) {
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      if (cancelled) return;

      const url = `/api/sse/${sessionId}`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onopen = () => setIsConnected(true);

      es.onmessage = (e) => {
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
        reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      eventSourceRef.current?.close();
    };
  }, [sessionId]);

  return { lastEvent, isConnected };
}
