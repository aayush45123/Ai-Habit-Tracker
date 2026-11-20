# 🧪 Testing Infrastructure & Verification

## 1. Automated Testing Baseline (Phase 5.1 Completed)

| Test Target | Runner / Harness | Location | Tests / Coverage |
| :--- | :--- | :--- | :---: |
| **Authentication & Zod Validation** | Node 22 native `node:test` | `server/tests/integration/auth.test.js` | 6 tests: Zod schemas, validation middleware, JWT rejection |
| **Schedule Controller & Presets** | Node 22 native `node:test` | `server/tests/integration/schedule.test.js` | 5 tests: Routine presets, window validation, clone-day logic |
| **Schedule Collision Engine** | Node 22 native `node:test` | `server/tests/unit/scheduleCollision.test.js` | 5 tests: Interval overlap math, boundary condition, disjoint slots |
| **Pearson Correlation Engine** | Node 22 native `node:test` | `server/tests/unit/pearsonCorrelation.test.js` | 5 tests: Statistical correlation, zero variance guardrails |
| **Nutrition Database & Parser** | Node 22 native `node:test` | `server/tests/unit/nutritionParser.test.js` | 5 tests: Canonical keys, piece vs gram math, linear scaling |
| **Client Date & Timetable Helpers** | Node 22 native `node:test` | `client/src/utils/__tests__/dateHelpers.test.js` | 8 tests: ISO dates, 12h formatting, week days, duration math |
| **Frontend Production Bundling** | Vite Build (`rollup`) | `client/package.json` (`npm run build`) | Validates full JSX syntax, CSS modules, dynamic imports |
| **Frontend Code Quality** | ESLint 9 Flat Config | `client/eslint.config.js` (`npm run lint`) | Verifies React Hooks dependencies, unused variables |

---

## 2. Test Execution Commands

### Client Tests
```bash
# Run automated client unit tests
npm --prefix ai-habit-tracker/client test

# Run lint check
npm --prefix ai-habit-tracker/client run lint

# Run production build validation
npm --prefix ai-habit-tracker/client run build
```

### Server Tests
```bash
# Run all server unit and integration tests
npm --prefix ai-habit-tracker/server test

# Run standalone nutrition engine CLI harness
node ai-habit-tracker/server/test_runner.js
```

---

## 3. Testing Gaps & Quality Priorities
- **Unit Testing Framework:** Introduce Jest or Vitest for unit testing backend controllers and client custom hooks.
- **Mocking Strategy:** Implement MongoDB in-memory (`mongodb-memory-server`) to enable fast CI/CD execution without external database connections.
- **End-to-End Testing:** Add Playwright or Cypress tests covering key user journeys: signup -> habit creation -> check-in -> gamification level-up.

