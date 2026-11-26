# Security Remediation Plan — AI Habit Tracker

**Date:** 2026-11-26  
**Prerequisite:** Review and approval of `SECURITY_AUDIT_REPORT.md` before any application source code is modified.

---

## Prioritized Remediation Roadmap

### Phase 4A — Critical & High Priority (Immediate)

1. **[CRITICAL] Remove Unverified `jwt.decode()` Fallback in Firebase Auth**
   - **File:** `ai-habit-tracker/server/src/services/firebaseAuth.service.js`
   - **Action:** Delete lines 104–116 (`jwt.decode(idToken)` fallback) so `verifyFirebaseIdToken` fails closed if neither Firebase Admin SDK nor Identity Toolkit verifies the token.

2. **[HIGH] Eliminate `localStorage` JWT/Refresh Token Storage**
   - **Files:** `ai-habit-tracker/client/src/utils/api.js`, `ai-habit-tracker/server/src/controllers/authController.js`
   - **Action:** Stop reading/writing `token` and `refreshToken` in `localStorage`; stop returning `refreshToken` in JSON response bodies; rely exclusively on `HttpOnly` cookies with `withCredentials: true`.

3. **[HIGH] Fix Mass Assignment in `JournalTemplate` Update**
   - **File:** `ai-habit-tracker/server/src/controllers/journalController.js`
   - **Action:** Replace `{ $set: req.body }` with an explicit allowlist of editable fields.

4. **[HIGH] Fix NoSQL `$regex` Injection & ReDoS**
   - **Files:** `ai-habit-tracker/server/src/controllers/journalController.js`, `ai-habit-tracker/server/src/controllers/adminController.js`
   - **Action:** Create a shared `escapeRegex()` helper, cap search query length (max 100 chars), and sanitize `search` before constructing `$regex`.

5. **[HIGH] Fix Rate Limiter Spoofing, Distribution & Missing `/refresh` Limit**
   - **Files:** `ai-habit-tracker/server/src/middleware/rateLimiter.js`, `ai-habit-tracker/server/src/routes/authRoutes.js`, `ai-habit-tracker/server/src/app.js`
   - **Action:**
     - Use Redis-backed rate limiting when Redis is connected (with safe in-memory fallback).
     - Use Express `trust proxy` / rightmost proxy-appended IP instead of `x-forwarded-for.split(",")[0]`.
     - Apply `authLimiter` to `POST /api/auth/refresh`.

6. **[HIGH] Add `Content-Security-Policy` Header**
   - **File:** `ai-habit-tracker/server/src/middleware/securityHeaders.js`
   - **Action:** Set a strict `Content-Security-Policy` header compatible with the API and client origins.

7. **[HIGH] Cap Pagination Limits Across All Endpoints**
   - **Files:** `adminController.js`, `gamificationController.js`, `journalController.js`, `focusController.js`
   - **Action:** Clamp `limit` to `1..100` and `days` to `1..365`.

---

### Phase 4B — Medium & Low Priority Hardening

8. **[MEDIUM] Sanitize & Bound AI Prompt Inputs**
   - **Files:** `aiTimetableController.js`, `aiChatController.js`, `gamificationController.js`
   - **Action:** Enforce max character lengths and wrap user-supplied fields in structured delimiters.

9. **[MEDIUM] HTML-Escape Email Template Variables**
   - **File:** `ai-habit-tracker/server/src/services/email.service.js`
   - **Action:** Escape `<`, `>`, `&`, `"`, `'` on `USER_NAME`, `HABIT_TITLE`, and habit list items before HTML interpolation.

10. **[MEDIUM] Validate `imageUrl` & Numeric Bounds on Focus/Calorie Logs**
    - **Files:** `calorieController.js`, `focusController.js`
    - **Action:** Enforce `https://` URL validation on `imageUrl`; enforce `durationMin` bounds (`1..480` for completed, `0..480` otherwise).

11. **[MEDIUM] Sanitize Production 500 Error Responses**
    - **Files:** `timetableController.js`, `challengeController.js`, `focusController.js`, `workoutLogController.js`, `scheduleController.js`
    - **Action:** Return generic `"Internal server error"` in production (`process.env.NODE_ENV === "production"`) instead of raw `err.message`.

12. **[MEDIUM/LOW] Validate `/api/visitors/track` & `/api/habits/add-bulk`**
    - **Files:** `visitorRoutes.js`, `habitRoutes.js`
    - **Action:** Add Zod validation schemas and rate limiting.

13. **[LOW] Cleanup & Defense-in-Depth**
    - Remove `role` from `signupSchema` (`auth.validator.js`).
    - Remove unused `spawn` import from `modelRetrainController.js`.
    - Add `.env*` ignore rules to root `.gitignore`.
    - Run `npm audit fix` (non-breaking) in both `server` and `client`.

---

## Phase 5 — Security Regression Test Plan

Add automated tests in `ai-habit-tracker/server/tests/` verifying:
1. Unverified / forged JWTs are rejected by `verifyFirebaseIdToken`.
2. Mass assignment fields (`isSystem`, `userId`) are stripped on `JournalTemplate` updates.
3. Regex metacharacters in `search` are safely escaped (no ReDoS / unintended matches).
4. Pagination `limit` > 100 is clamped.
5. `/api/auth/refresh` enforces rate limiting.
6. Focus log negative/excessive durations and invalid `imageUrl` schemes are rejected.
7. Cross-user IDOR attempts on habits, journal, schedule, and workout logs return `404`/`403`.

---

## Deployment Recommendations

- **Render (Backend):** Set `NODE_ENV=production`, `TRUST_PROXY=1`, `FIREBASE_SERVICE_ACCOUNT_KEY` (or project credentials), and Upstash/Redis credentials so rate limiting is shared across instances.
- **Vercel (Frontend):** Ensure `VITE_API_URL` points to the HTTPS Render origin and verify `withCredentials: true` cookie flow works end-to-end across origins (`SameSite=None; Secure` if frontend and backend are on different domains).
