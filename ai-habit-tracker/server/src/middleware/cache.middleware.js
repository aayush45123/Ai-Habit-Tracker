import { getCache, setCache } from "../services/redis.service.js";

/**
 * Cache Middleware
 * Intercepts GET requests to check Redis before hitting database controllers.
 *
 * @param {string} keyPrefix - Prefix for Redis key namespace (e.g. 'dashboard', 'analytics')
 * @param {number} durationSeconds - Cache expiration TTL in seconds (default: 300 = 5 mins)
 */
export const cacheMiddleware = (keyPrefix, durationSeconds = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const userId = req.user?._id || req.user?.id || "guest";
    const cacheKey = `${keyPrefix}:${userId}:${req.originalUrl || req.url}`;

    try {
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cachedData);
      }

      res.setHeader("X-Cache", "MISS");

      // Capture res.json payload to store in Redis
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode === 200 && body) {
          setCache(cacheKey, body, durationSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Cache Middleware Error:", error.message);
      next();
    }
  };
};

export default cacheMiddleware;
