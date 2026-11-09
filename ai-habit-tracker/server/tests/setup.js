// server/tests/setup.js
// Global test environment configuration

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_jwt_habit_ai_2026_xyz";
process.env.TZ = "Asia/Kolkata"; // Standardize timezone for Indian Standard Time checks

export const TEST_CONFIG = {
  jwtSecret: process.env.JWT_SECRET,
  timezone: process.env.TZ,
};

