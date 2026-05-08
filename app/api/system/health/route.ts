import { NextResponse } from "next/server";
import { getNatsConnection } from "@/lib/infra/events";
import { getRedis } from "@/lib/infra/redis";

export async function GET() {
  const redis = getRedis();
  const nats = await getNatsConnection();

  let redisOk = false;
  if (redis) {
    try {
      redisOk = (await redis.ping()) === "PONG";
    } catch {
      redisOk = false;
    }
  }

  return NextResponse.json({
    status: "ok",
    services: {
      redis: redis ? (redisOk ? "up" : "down") : "not-configured",
      nats: nats ? "up" : "not-configured"
    },
    timestamp: new Date().toISOString()
  });
}
