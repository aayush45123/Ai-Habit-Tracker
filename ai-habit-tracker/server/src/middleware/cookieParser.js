/**
 * cookieParser.js — Zero-Dependency Cookie Parser Middleware
 * 
 * Extracts and decodes cookies from incoming request headers into req.cookies.
 */

export default function cookieParser(req, res, next) {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    const rawCookies = cookieHeader.split(";");
    for (const raw of rawCookies) {
      const idx = raw.indexOf("=");
      if (idx !== -1) {
        const key = raw.slice(0, idx).trim();
        const val = raw.slice(idx + 1).trim();
        try {
          req.cookies[key] = decodeURIComponent(val);
        } catch {
          req.cookies[key] = val;
        }
      }
    }
  }

  next();
}
