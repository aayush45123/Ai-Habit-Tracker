import { redisClient, isRedisConnected } from "../config/redis.js";

/**
 * Get value from Redis cache
 */
export const getCache = async (key) => {
  if (!redisClient || !isRedisConnected) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Redis Get Error [${key}]:`, error.message);
    return null;
  }
};

/**
 * Set value in Redis cache with TTL in seconds
 */
export const setCache = async (key, value, ttlSeconds = 300) => {
  if (!redisClient || !isRedisConnected) return false;
  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redisClient.setex(key, ttlSeconds, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error(`Redis Set Error [${key}]:`, error.message);
    return false;
  }
};

/**
 * Delete a specific key from Redis cache
 */
export const deleteCache = async (key) => {
  if (!redisClient || !isRedisConnected) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error(`Redis Delete Error [${key}]:`, error.message);
    return false;
  }
};

/**
 * Delete keys matching a wildcard pattern (e.g. "dashboard:user123:*")
 */
export const deletePattern = async (pattern) => {
  if (!redisClient || !isRedisConnected) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    console.error(`Redis Delete Pattern Error [${pattern}]:`, error.message);
    return false;
  }
};

export default {
  getCache,
  setCache,
  deleteCache,
  deletePattern,
};
