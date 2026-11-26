/**
 * securityHeaders.js — Production-Grade HTTP Security Headers Middleware
 * 
 * Replaces helmet with a zero-dependency, high-performance middleware:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Content-Type-Options (nosniff)
 * - X-Frame-Options (DENY)
 * - X-XSS-Protection (0 - modern standard)
 * - Referrer-Policy (strict-origin-when-cross-origin)
 * - Permissions-Policy
 * - Disables X-Powered-By
 */

export default function securityHeaders(req, res, next) {
  // Remove sensitive fingerprinting headers
  res.removeHeader("X-Powered-By");

  // Prevent MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Clickjacking protection
  res.setHeader("X-Frame-Options", "DENY");

  // Content Security Policy
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; font-src 'self' data:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );

  // Modern Cross-site scripting filter behavior
  res.setHeader("X-XSS-Protection", "0");

  // Strict Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Cross-Origin policies
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  // Restrict browser features and APIs
  res.setHeader(
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
  );

  // Enforce HTTPS in production via HSTS (1 year + subdomains)
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  next();
}
