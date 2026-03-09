import Redis from "ioredis";

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redis;
}

// Create a fresh connection for subscriptions (ioredis requires separate connections for sub)
export function createRedisSubscriber(): Redis {
  return new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
}
