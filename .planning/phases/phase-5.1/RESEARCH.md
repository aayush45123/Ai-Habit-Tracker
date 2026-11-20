# 🔬 Phase 5.1 Research: Comprehensive Automated Testing Suite

## 1. Domain & Context
**AI Habit Tracker** currently relies on manual testing, a CLI test runner (`test_runner.js`) for nutrition estimations, and a one-off script (`test-phase1-phase2.js`). There is no automated test runner configured in `package.json`, no CI test gate, and no standardized assertion/mocking framework.

Both the client and server use native ES Modules (`"type": "module"`):
- Client: React 19, Vite 5
- Server: Node.js 22 LTS, Express 5, Mongoose 9

---

## 2. Technology Selection & Trade-Offs

### 2.1 Test Runner: Vitest vs. Jest
| Dimension | Jest | Vitest (Recommended) |
| :--- | :--- | :--- |
| **ESM Compatibility** | Requires experimental VM flags, custom transforms, or Babel for native ESM | Native out-of-the-box ESM support with no transforms required |
| **Vite Integration** | Independent runner; duplicates alias/path resolution | Reuses existing `vite.config.js` settings and plugins |
| **Speed & Performance** | Slower startup with thread pooling overhead | Extremely fast startup via Vite HMR and worker threads |
| **Node.js 22 Support** | Known issues with mock hoisting in Node 22 ESM | Seamless execution in Node 22 LTS |
| **Verdict** | High configuration friction | **Selected for both Client and Server** |

### 2.2 Database Mocking: In-Memory MongoDB vs Docker / Real DB
- **Selected:** `mongodb-memory-server`
- **Rationale:** Spawns an ephemeral in-memory `mongod` binary per test run.
  - Zero external cloud latency (avoids hitting MongoDB Atlas during local testing or CI).
  - Perfect isolation: tests create, assert, and drop collections per test suite without data contamination.
  - No Docker daemon prerequisite for contributors.

### 2.3 HTTP API Testing: Supertest
- **Selected:** `supertest`
- **Rationale:** Standard de-facto library for testing Express applications via lightweight in-process HTTP requests without binding to real system network ports.

---

## 3. High-Leverage Test Targets

### Target 1: Core Pure Mathematical & Domain Algorithms
- **Pearson Correlation Engine (`journalAnalytics.service.js`):**
  - Verify Pearson correlation coefficient $r = \frac{\sum (x - \bar{x})(y - \bar{y})}{\sqrt{\sum (x - \bar{x})^2 \sum (y - \bar{y})^2}}$.
  - Ensure behavior with zero variance (e.g. all days have identical mood) returns `0` rather than `NaN`.
- **Time Collision & Interval Calculation (`dateHelpers.js` & `scheduleController.js`):**
  - Overlap condition: `max(startA, startB) < min(endA, endB)`.
  - Boundary condition: `09:00 - 10:00` and `10:00 - 11:00` must NOT trigger a conflict.
  - 24-hour and 12-hour conversion functions.
- **Nutrition Parsing Engine (`nutritionEngine.js`):**
  - Text normalization ("2 boiled eggs", "4 chapati", "50g cooked rice").
  - Macronutrient accumulation (calories, protein, carbs, fats).

### Target 2: Critical Business Logic & Streak Integrity
- **Midnight Streak Engine (`habitController.js` & `getTodayIST.js`):**
  - Normalization to Indian Standard Time (`UTC+5:30`).
  - Active check-in window logic for midnight-spanning habits.
  - Automated streak increment and streak loss on missed days.

### Target 3: API Integration Tests
- **Auth Routes (`/api/auth`):**
  - Zod payload validation rejection (weak password, invalid email format, short name).
  - Successful registration, password hashing verification, and JWT issuance.
- **Schedule Routes (`/api/schedule`):**
  - CRUD operations, conflict warnings on overlapping entries, status toggling.
- **Habit Check-in Routes (`/api/habits`):**
  - Duplicate check-in on the same day blocked by unique compound index (`habitId` + `date`).

---

## 4. Potential Pitfalls & Mitigations
1. **MongoDB In-Memory Download Latency:**
   - *Pitfall:* `mongodb-memory-server` downloads the `mongod` binary on first execution, which can timeout on slow networks.
   - *Mitigation:* Allow fallback mock or timeout extension (`hookTimeout: 60000`).
2. **Open Handles / Database Connections:**
   - *Pitfall:* Vitest hanging after test completion if MongoDB or Redis connections remain open.
   - *Mitigation:* Explicit `afterAll` hook disconnecting Mongoose via `mongoose.disconnect()` and closing Redis clients.
3. **Timezone Flakiness in CI:**
   - *Pitfall:* Tests run on UTC GitHub runners failing IST assertions.
   - *Mitigation:* Set `process.env.TZ = "Asia/Kolkata"` in Vitest global setup.

