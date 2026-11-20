# 🗺️ Project Roadmap & Milestone Tracker

## Milestone Overview

| Milestone | Scope / Theme | Status | Completion |
| :--- | :--- | :--- | :--- |
| **Milestone 1: Foundation & Core Habits** | Auth, Habit CRUD, 21-Day Challenges, Streak Engine, IST Normalization | Completed | 100% |
| **Milestone 2: Health & Lifestyle Intelligence** | Calorie Tracker (Mifflin-St Jeor), Nutrition Database, Growth Journal & Pearson Correlation | Completed | 100% |
| **Milestone 3: Gamification & Visual Polish** | XP Engine, Badges, Leveling, Socket.IO Sync, GSAP 3D Landing Page | Completed | 100% |
| **Milestone 4: Dual Timetable Systems** | Workout Timetable Builder, Daily Time Timetable with Live Reminders & Calendar | Completed | 100% |
| **Milestone 5: Production Hardening & Testing** | Automated Test Suites, Monorepo Workspaces, CI/CD, Bundle Optimization | ✅ Completed | 100% |

---

## Completed Phases

### Phase 1: Authentication & Habit Tracking Foundation (Completed)
- [x] JWT authentication, signup/login flows, and profile completion onboarding gate.
- [x] Habit CRUD, categories, frequencies, and target time-windows.
- [x] Composite unique indexing on daily logs, streak calculation algorithm.
- [x] Scheduled midnight streak reset cron job (00:01 IST) and daily reminder emails.

### Phase 2: 21-Day Bootcamps & Deep Work (Completed)
- [x] 21-Day habit challenge system with multi-habit requirements and daily adherence heatmaps.
- [x] Pomodoro focus timer with configurable intervals, audio cues, and session analytics.
- [x] Starter habit template gallery with one-click duplication.

### Phase 3: Nutrition, Journal & Explainable AI (Completed)
- [x] Mifflin-St Jeor BMR & TDEE nutrition profile calculator.
- [x] Daily food logging with macronutrient breakdown, meal categorization, and weekly recalibration.
- [x] Growth journal tracking mood, energy, sleep, water, and notes.
- [x] Pearson correlation engine identifying relationships between lifestyle factors and habit adherence.
- [x] Groq Llama 3.3 70B AI Coach integration with Explainable AI (XAI) confidence metrics and fallback logic.

### Phase 4: Gamification, Polish & Dual Timetable Systems (Completed)
- [x] Gamification system: XP transactions, leveling curve (Levels 1-10), badge catalog, virtual reward shop.
- [x] Real-time WebSocket synchronization for check-ins, level ups, and challenge updates.
- [x] 3D GSAP landing page showcase with interactive cards and micro-animations.
- [x] Workout Timetable: Weekly routine builder, exercise order, set/rep targets, and checkpoint logs.
- [x] Daily Time Timetable (`/schedule`): Calendar-based time-slot scheduling ("from this time to this time"), conflict detection, live reminder banners ("Happening Now" / "Up Next"), Web Audio chime alerts, and pre-built routine templates.

---

## Upcoming Phases (Milestone 5: Production Hardening)

### Phase 5.1: Comprehensive Automated Testing Suite (Completed)
- [x] Set up automated test runner for backend controllers and client utilities (`node --test`).
- [x] Implement in-process Express & Zod validation and auth test harness.
- [x] Add unit test coverage for timetable collision detection, Pearson correlation algorithms, and nutrition calculations.
- [x] 34/34 tests passing across 6 test suites with 100% pass rate.

### Phase 5.2: Monorepo Workspaces & CI/CD Pipeline (Completed)
- [x] Configure npm workspaces for seamless unified monorepo management.
- [x] Add root-level scripts (`npm test`, `npm run build`, `npm run lint`, `npm run lint:server`).
- [x] Create GitHub Actions CI workflow verifying lint, build, and tests on push & pull requests.

### Phase 5.3: Bundle Size & Performance Optimization (Completed ✅)
- [x] Consolidate charting libraries (standardized client on Recharts; removed `chart.js` + `react-chartjs-2` from client; server retains `chartjs-node-canvas` for PDF generation).
- [x] Configure manual chunking in Vite for large vendor bundles (`firebase-vendor`, `animation-vendor`, `recharts-vendor`). Index bundle reduced from 463 kB → 165 kB (−64%).
- [x] Implement server-side MongoDB aggregation pipelines for historical analytics (dashboard heatmap + calorie history) with IST timezone (`+05:30`).

