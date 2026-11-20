/**
 * rateLimiter.js — Sliding Window Rate Limiting Middleware
 * 
 * Protects against brute-force, credential stuffing, and API denial-of-service.
 * Tracks requests per IP with sliding window buckets.
 */

// In-memory sliding window store
const memoryBuckets = new Map();

// Periodic cleanup of stale memory records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryBuckets.entries()) {
    if (now > record.resetTime) {
      memoryBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

/**
 * Creates a rate limiter middleware
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests allowed within windowMs
 * @param {string} options.message - Error message when rate limit exceeded
 * @param {string} options.keyPrefix - Prefix for tracking buckets
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = "Too many requests, please try again later.",
  keyPrefix = "rl",
}) {
  return (req, res, next) => {
    // Skip rate limiting in automated test mode
    if (process.env.NODE_ENV === "test" && !req.headers["x-test-ratelimit"]) {
      return next();
    }

    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "unknown-ip";

    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    let record = memoryBuckets.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      memoryBuckets.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec,
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 min per IP
  message: "Too many authentication attempts. Please try again after 15 minutes.",
  keyPrefix: "auth",
});

export const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour per IP
  message: "Too many password reset requests. Please try again later.",
  keyPrefix: "pwd_reset",
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 180, // 180 requests per minute
  message: "API rate limit exceeded. Please throttle your requests.",
  keyPrefix: "api",
});

export const aiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 25, // 25 AI queries per minute
  message: "AI engine rate limit reached. Please wait a moment before sending more prompts.",
  keyPrefix: "ai",
});

export default createRateLimiter;
