import Redis from "ioredis";

let redisInstance: Redis | null = null;

export function getRedis() {
  if (redisInstance) return redisInstance;
  const url = process.env.REDIS_URL;
  if (!url) return null;

  redisInstance = new Redis(url, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true
  });
  return redisInstance;
}
