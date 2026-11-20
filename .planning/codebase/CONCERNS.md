# ⚠️ Codebase Concerns & Technical Debt

## 1. High Priority Considerations

### 1.1 Monorepo Orchestration
- **Current State:** The repository contains nested packages (`ai-habit-tracker/client` and `ai-habit-tracker/server`) with individual `package.json` files and separate `node_modules` folders, but does not use npm/pnpm workspaces.
- **Impact:** Running development commands, installing packages, or deploying requires navigating into separate subdirectories manually.
- **Recommendation:** Adopt npm or pnpm workspaces with root-level scripts (`npm run dev:client`, `npm run dev:server`).

### 1.2 Python Runtime Dependency in Production
- **Current State:** Classical ML inference relies on spawning a Python 3 child process (`predict.py`) using `child_process.spawn`.
- **Impact:** Any hosting environment (Render, Railway, Docker) running the backend must install both Node.js 22 and Python 3 with `scikit-learn` and `pandas`.
- **Recommendation:** Containerize the backend with Docker ensuring both runtimes are available, or port the Logistic Regression weights directly to lightweight JavaScript math.

---

## 2. Performance & Bundle Size

### 2.1 Double Charting Libraries
- **Current State:** The client imports both `recharts` (`^3.10.1`) and `chart.js` (`^4.5.1`).
- **Impact:** Both charting libraries are bundled in production, producing chunks over 400 kB as flagged by Rollup.
- **Recommendation:** Standardize exclusively on either `recharts` or `chart.js` across all analytics components, or implement dynamic code splitting for rarely accessed analytics tabs.

### 2.2 Client In-Memory Data Hydration
- **Current State:** Large dataset transformations (e.g. nutrition items, habit historical analytics) are calculated on the client side in several views.
- **Recommendation:** Implement server-side aggregation pipelines using MongoDB aggregation frameworks to offload heavy calculations.

---

## 3. Security & Operational Integrity

### 3.1 Rate Limiting on Authentication Endpoints
- **Current State:** Basic CORS and JWT middleware are configured, but brute-force protection on login/register relies on Upstash Redis availability.
- **Recommendation:** Ensure in-memory fallback rate limiting (`express-rate-limit`) is active if Redis is temporarily unreachable.

### 3.2 Automated CI/CD Pipeline
- **Current State:** Build checks are executed manually via terminal scripts.
- **Recommendation:** Add a GitHub Actions workflow (`.github/workflows/ci.yml`) to automatically run lint and build verification on all pull requests and pushes to `main`.

