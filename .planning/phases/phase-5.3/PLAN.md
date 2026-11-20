# 📋 Phase 5.3 Implementation Plan: Bundle Size & Performance Optimization

## Executive Summary
Phase 5.3 optimizes frontend bundle payloads and backend database throughput. It standardizes client charting exclusively on Recharts (removing Chart.js from client dependencies for ~178 kB savings), configures semantic Vite vendor chunking to eliminate bundle size warnings, and implements server-side MongoDB aggregation pipelines for 30-day historical analytics.

---

## 🎯 Phase Goals & Requirements
1. **Frontend Bundle Optimization:**
   - Eliminate Vite's `(!) Some chunks are larger than 400 kB` build warning.
   - Segregate Firebase (`firebase-vendor`) and GSAP (`animation-vendor`) into long-term cacheable chunks.
   - Consolidate all frontend charting onto Recharts; cleanly decommission `chart.js` and `react-chartjs-2` from the client.
2. **Backend Aggregation Optimization:**
   - Convert in-memory looping in `dashboardController.js` (30-day activity heatmap) into a native MongoDB `$group` aggregation pipeline with IST timezone normalization.
   - Convert in-memory looping in `calorieController.js` (`getCalorieHistory`) into a native MongoDB `$group` aggregation pipeline.
3. **Zero Regression Guarantee:**
   - Preserve 100% pass rate on all 34 automated unit and integration tests.
   - Maintain 0 ESLint errors and 0 build errors.
   - Maintain full fidelity of the brutalist Nihilism monochrome design theme.

---

## 🌊 Execution Waves & Task Breakdown

### Wave 1: Vite Manual Chunking & Vendor Partitioning
- [ ] **Task 1.1: Expand Vite Chunk Strategy (`client/vite.config.js`)**
  - Add `firebase-vendor` chunk (`firebase`, `@firebase`).
  - Add `animation-vendor` chunk (`gsap`).
  - Keep `chunkSizeWarningLimit: 400` as a strict regression gate.
- [ ] **Task 1.2: Intermediate Build Verification**
  - Execute `npm run build` and measure the reduction in `index-*.js`.

---

### Wave 2: Client Charting Consolidation onto Recharts
- [ ] **Task 2.1: Recharts Migration for `AnalyticsCharts.jsx`**
  - Refactor `ai-habit-tracker/client/src/pages/Analytics/AnalyticsCharts.jsx` from Chart.js to Recharts.
  - Support Line chart and Pie chart with responsive container, customized tooltips, and brutalist borders.
- [ ] **Task 2.2: Recharts Migration for `TimetableCharts.jsx`**
  - Refactor `ai-habit-tracker/client/src/components/TimetableAnalyticsPanel/TimetableCharts.jsx` from Chart.js to Recharts.
  - Support Bar chart (Weekly completion), Line chart (Adherence trend), and Doughnut/Pie chart (Focus distribution).
- [ ] **Task 2.3: Decommission Client Chart.js Dependencies**
  - Remove `chart.js` and `react-chartjs-2` from `ai-habit-tracker/client/package.json`.
  - Remove `chartjs` manualChunk branch from `ai-habit-tracker/client/vite.config.js`.

---

### Wave 3: Server-Side MongoDB Aggregation Pipelines
- [ ] **Task 3.1: Dashboard Heatmap Aggregation (`server/src/controllers/dashboardController.js`)**
  - Replace `HabitLog.find()` array loops with MongoDB aggregation:
    - Match user habit IDs, past 30 days, status completed.
    - Group by IST date string (`%Y-%m-%d` in `+05:30`).
    - Project clean `{ date, count }` objects.
- [ ] **Task 3.2: Calorie History Aggregation (`server/src/controllers/calorieController.js`)**
  - Replace `FoodLog.find()` array loops in `getCalorieHistory` with MongoDB aggregation:
    - Match `userId` and past 30 days.
    - Group by `date`, summing `calories` and `protein`, pushing items.
    - Sort chronologically.

---

### Wave 4: Verification, Lint & Documentation
- [ ] **Task 4.1: Automated Test Suite Run**
  - Execute root `npm test` (verify all 34 tests pass).
- [ ] **Task 4.2: Lint & Build Verification**
  - Run `npm run lint` and `npm run lint:server` (ensure 0 errors).
  - Run `npm run build` (ensure 0 chunk warnings and verify bundle reduction).
- [ ] **Task 4.3: Verification Report & State Sync**
  - Generate `.planning/phases/phase-5.3/VERIFICATION.md`.
  - Update `ROADMAP.md` and `STATE.md`.

---

## 🔒 Verification Criteria
1. Root `npm run build` produces **zero** chunks exceeding 400 kB and **zero** warnings.
2. `chart.js` and `react-chartjs-2` are absent from `ai-habit-tracker/client/package.json`.
3. 34/34 automated tests pass with 0 failures.
4. Server aggregation pipelines return identical JSON payload structures as previous controller logic.

