import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config();

let redisClient = null;
let isRedisConnected = false;
let isUpstashRest = false;

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisUrl = process.env.REDIS_URL;

if (upstashUrl && upstashToken) {
  try {
    redisClient = new UpstashRedis({
      url: upstashUrl,
      token: upstashToken,
    });
    isUpstashRest = true;

    redisClient
      .ping()
      .then((pong) => {
        isRedisConnected = true;
        console.log("Redis (Upstash REST):", pong);
      })
      .catch((err) => {
        isRedisConnected = false;
        if (process.env.NODE_ENV !== "production") {
          console.error("Redis Error:", err.message);
        }
      });
  } catch (err) {
    console.warn("⚠️ Upstash Redis initialization error. Bypassing Redis cache.");
    isRedisConnected = false;
  }
} else if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️ Redis unavailable. Cache disabled.");
          return null;
        }
        return Math.min(times * 200, 1000);
      },
      tls: redisUrl.startsWith("rediss://") ? {} : undefined,
    });

    redisClient.on("ready", async () => {
      isRedisConnected = true;
      try {
        const pong = await redisClient.ping();
        console.log("Redis (TCP):", pong);
      } catch (err) {
        console.warn("⚠️ Redis Ping failed:", err.message);
      }
    });

    redisClient.on("error", (err) => {
      isRedisConnected = false;
      if (process.env.NODE_ENV !== "production") {
        console.error("Redis Error:", err.message);
      }
    });
  } catch (err) {
    console.warn("⚠️ Redis initialization error. Bypassing Redis cache.");
    isRedisConnected = false;
  }
} else {
  console.warn("⚠️ REDIS_URL or UPSTASH_REDIS_REST_URL not configured. Operating in cache-bypass mode.");
}

export { redisClient, isRedisConnected, isUpstashRest };
export default redisClient;
