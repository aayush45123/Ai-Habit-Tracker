import Redis from "ioredis";

let redisClient = null;
let isRedisConnected = false;

const redisUrl = process.env.REDIS_URL;

if (redisUrl) {
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
      tls: {},
    });

    redisClient.on("ready", async () => {
      isRedisConnected = true;
      try {
        const pong = await redisClient.ping();
        console.log("Redis:", pong);
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
  console.warn("⚠️ REDIS_URL is not set. Operating in cache-bypass mode.");
}

export { redisClient, isRedisConnected };
export default redisClient;
