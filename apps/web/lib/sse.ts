import type { SSEEvent } from "@crowdvote/types";
import { getRedis } from "./redis";

const STREAM_PREFIX = "stream:session:";

export async function publishEvent(sessionId: string, event: SSEEvent) {
  const redis = getRedis();
  const streamKey = `${STREAM_PREFIX}${sessionId}`;
  await redis.xadd(
    streamKey,
    "*",
    "type",
    event.type,
    "data",
    JSON.stringify(event.data)
  );
  // Auto-expire streams after 24 hours
  await redis.expire(streamKey, 86400);
}

export function streamKey(sessionId: string) {
  return `${STREAM_PREFIX}${sessionId}`;
}
