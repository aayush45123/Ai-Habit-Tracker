import Redis from "ioredis";

let redisClient = null;
let isRedisConnected = false;

const redisHost = process.env.REDIS_HOST || "127.0.0.1";
const redisPort = process.env.REDIS_PORT || 6379;
const redisUrl = process.env.REDIS_URL;

try {
  const connectionOptions = redisUrl
    ? redisUrl
    : {
        host: redisHost,
        port: Number(redisPort),
        password: process.env.REDIS_PASSWORD || undefined,
        retryStrategy(times) {
          if (times > 3) {
            // Stop retrying after 3 attempts in dev/local environments if Redis is unavailable
            console.warn("⚠️ Redis connection failed. Operating in cache-bypass mode.");
            return null;
          }
          return Math.min(times * 200, 1000);
        },
        maxRetriesPerRequest: 1,
      };

  redisClient = new Redis(connectionOptions);

  redisClient.on("connect", () => {
    isRedisConnected = true;
    console.log("✅ Redis Client Connected successfully.");
  });

  redisClient.on("error", (err) => {
    isRedisConnected = false;
    // Silent catch to prevent server crash when Redis server is offline
  });
} catch (err) {
  console.warn("⚠️ Redis initialization error. Bypassing Redis cache.");
  isRedisConnected = false;
}

export { redisClient, isRedisConnected };
export default redisClient;
