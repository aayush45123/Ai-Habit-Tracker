# 🔬 Phase 5.2 Research: Monorepo Workspaces & CI/CD Pipeline

## 1. Domain & Context
The repository is currently organized as a multi-package repository containing two distinct applications:
- Frontend: `ai-habit-tracker/client` (React 19, Vite 5)
- Backend: `ai-habit-tracker/server` (Express 5, Node 22 LTS)

However, developers must navigate into subdirectories manually to run linting, tests, builds, or dev servers. Furthermore, there is no automated CI pipeline to validate pull requests or commits against regressions before code is pushed to production.

---

## 2. Technology Selection & Trade-Offs

### 2.1 Workspace Manager: npm Workspaces vs. Turborepo / Lerna / pnpm
| Dimension | Turborepo / Lerna | Native npm Workspaces (Selected) |
| :--- | :--- | :--- |
| **Tooling Overhead** | Requires extra global CLIs, complex configuration schemas, cache demons | Built directly into npm 7+ with zero additional dependencies |
| **Compatibility** | Can conflict with Vercel and Render auto-detection | Fully recognized by Vercel, Render, and GitHub Actions out of the box |
| **Learning Curve** | High | Standard npm commands (`npm run ...`) |
| **Verdict** | Overkill for a 2-package monorepo | **Selected for simplicity and zero external overhead** |

### 2.2 Dual-Tier Root & Subdirectory Orchestration
Because developers or tools might execute commands from either the repository root (`Habit Tracker/`) or the project directory (`ai-habit-tracker/`), configuring npm scripts and workspaces at both levels ensures maximum developer ergonomics:
- **Repo Root (`package.json`):** Points workspaces to `ai-habit-tracker/client` and `ai-habit-tracker/server`.
- **Project Root (`ai-habit-tracker/package.json`):** Points workspaces to `client` and `server`.

### 2.3 CI/CD Platform: GitHub Actions
- **Workflow:** `.github/workflows/ci.yml`
- **Runner:** `ubuntu-latest`
- **Node.js:** `22.x` (matching development and production runtime)
- **Timezone Standardization:** `TZ: Asia/Kolkata` ensuring time-dependent streak logic behaves consistently across local and cloud environments.
- **Fail-Fast Stages:**
  1. Syntax validation (`node --check`)
  2. Code quality & linting (`npm run lint`)
  3. Server automated tests (`npm test` — 26 tests)
  4. Client automated tests (`npm test` — 8 tests)
  5. Production bundling verification (`npm run build`)

---

## 3. Potential Pitfalls & Mitigations

1. **Vercel & Render Build Directory Drift:**
   - *Pitfall:* Modifying package paths could break Vercel's root directory detection (`ai-habit-tracker/client`) or Render's root directory (`ai-habit-tracker/server`).
   - *Mitigation:* Preserve independent `package.json` files in `client/` and `server/`. npm workspaces will wrap them non-destructively without modifying internal relative paths or vercel.json.
2. **Missing Environment Variables in CI:**
   - *Pitfall:* Server tests or builds failing in GitHub Actions if `.env` is absent.
   - *Mitigation:* Tests are already designed to run in-process with fallback test environment variables (`process.env.NODE_ENV = 'test'`), requiring zero external cloud secrets in CI.
3. **Cross-Platform Path Separators (Windows vs. Linux CI):**
   - *Pitfall:* Scripts using backslashes `\` failing on Linux `ubuntu-latest` CI runners.
   - *Mitigation:* Always use standard forward slashes `/` or `npm --prefix` syntax in `package.json` scripts.

