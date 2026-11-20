# 📋 Phase 5.1 Plan: Comprehensive Automated Testing Suite

## Phase Metadata
- **Phase:** 5.1
- **Name:** Comprehensive Automated Testing Suite
- **Milestone:** Milestone 5 (Production Hardening & Testing)
- **Status:** Ready for Execution
- **Dependencies:** Milestone 1–4 Features Active

---

## 1. Phase Goal
Establish an automated, high-speed test suite using **Vitest** across client and server. Cover core mathematical algorithms (Pearson correlation, timetable collision detection, date utilities, nutrition parsing), streak integrity logic (IST midnight resets), and critical API endpoints (auth, habits, schedule) with zero-configuration in-memory database isolation.

---

## 2. Requirements & Traceability

| Requirement | Description | Test Scope | Target File |
| :--- | :--- | :--- | :--- |
| **TEST-01** | Test Runner Setup | Configure Vitest, scripts, and test environment | `server/package.json`, `client/package.json` |
| **TEST-02** | Date & Time Utilities | Unit tests for time conversions, duration, and week days | `client/src/utils/dateHelpers.test.js` |
| **TEST-03** | Schedule Collision Engine | Interval overlap checks, adjacent slot boundary tests | `server/tests/unit/scheduleCollision.test.js` |
| **TEST-04** | Pearson Correlation Engine | Mathematical coefficient tests, zero-variance handling | `server/tests/unit/pearsonCorrelation.test.js` |
| **TEST-05** | Nutrition Parser Engine | Food name parsing, macro summation, edge cases | `server/tests/unit/nutritionParser.test.js` |
| **TEST-06** | Auth API Integration | Zod validation rejections, password hashing, JWT issue | `server/tests/integration/auth.test.js` |
| **TEST-07** | Schedule API Integration | Event CRUD, conflict warnings, status toggles | `server/tests/integration/schedule.test.js` |
| **TEST-08** | Streak & Habit Logic | One-log-per-day enforcement, streak increment | `server/tests/integration/habits.test.js` |

---

## 3. Execution Waves & Task Breakdown

### Wave 1: Test Runner & Environment Setup
- **Task 1.1: Server Test Harness Setup**
  - Install `vitest` and `supertest` as dev dependencies in `server/package.json`.
  - Add test script: `"test": "vitest run"` and `"test:watch": "vitest"`.
  - Create `server/vitest.config.js` configuring environment (`node`), timezone (`Asia/Kolkata`), and test match patterns (`tests/**/*.test.js`).
- **Task 1.2: Client Test Harness Setup**
  - Add test script to `client/package.json`: `"test": "vitest run"`.
  - Configure `client/vitest.config.js` or integrate test options into `vite.config.js`.

### Wave 2: Pure Domain Algorithm Unit Tests (Fast & Isolated)
- **Task 2.1: Client Date & Timetable Utility Tests**
  - Create `client/src/utils/__tests__/dateHelpers.test.js`.
  - Test `formatDateISO`, `formatTime12`, `timeToMinutes`, `minutesToTime`, `calculateDuration`, `getWeekDays`, and `isCurrentTimeInRange`.
- **Task 2.2: Schedule Collision Detection Unit Tests**
  - Create `server/tests/unit/scheduleCollision.test.js`.
  - Test interval overlap formula:
    - Overlapping intervals trigger `hasConflict: true`.
    - Adjacent intervals (e.g. 09:00–10:00 and 10:00–11:00) do NOT trigger conflict.
    - Contained intervals (e.g. 09:30–10:30 inside 09:00–11:00) trigger conflict.
- **Task 2.3: Pearson Correlation Engine Unit Tests**
  - Create `server/tests/unit/pearsonCorrelation.test.js`.
  - Test calculation of correlation coefficient between lifestyle metrics and habit success.
  - Test edge cases: perfect correlation ($r = 1.0$), inverse correlation ($r = -1.0$), zero variance ($r = 0.0$), empty dataset.
- **Task 2.4: Nutrition Engine & Food Parser Unit Tests**
  - Create `server/tests/unit/nutritionParser.test.js`.
  - Validate extraction of quantities, units, and macronutrients across complex food strings.

### Wave 3: API Integration Tests (Express + In-Memory Mock)
- **Task 3.1: In-Memory Database / Mock Test Setup**
  - Create `server/tests/setup.js` for setting up test environment variables (`JWT_SECRET="test_secret"`, `MONGO_URI` test database).
- **Task 3.2: Authentication Endpoints Integration Tests**
  - Create `server/tests/integration/auth.test.js`.
  - Test Zod validation failures on invalid signup payloads.
  - Test valid user signup, duplicate email rejection, and successful login with token verification.
- **Task 3.3: Schedule Endpoints Integration Tests**
  - Create `server/tests/integration/schedule.test.js`.
  - Test `POST /api/schedule`, `GET /api/schedule`, `PATCH /api/schedule/:id/status`, and `DELETE /api/schedule/:id`.
  - Verify conflict response returned when creating overlapping events.

---

## 4. Threat Model & Safety Guardrails
- **Production Safety:** Tests must NEVER connect to the production MongoDB Atlas cluster or live Redis cluster. Ensure `MONGO_URI` in test environments defaults to a local/memory test instance or mock.
- **Environment Isolation:** Set test-specific `JWT_SECRET` and mock third-party external APIs (Groq Cloud, Cloudinary, Nodemailer) to prevent real email dispatch or billable AI calls during tests.

---

## 5. Verification & Definition of Done
1. **Server Unit & Integration Tests:**
   ```bash
   npm --prefix ai-habit-tracker/server test
   ```
   *Expected:* All unit tests and integration tests pass with 0 failures.
2. **Client Utility Tests:**
   ```bash
   npm --prefix ai-habit-tracker/client test
   ```
   *Expected:* All date and time helper tests pass.
3. **No Regressions on Build:**
   ```bash
   npm --prefix ai-habit-tracker/client run build
   ```
   *Expected:* Production build completes cleanly.

