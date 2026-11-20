# 📋 Phase 5.2 Implementation Plan: Monorepo Workspaces & CI/CD Pipeline

## Executive Summary
Phase 5.2 establishes a unified dual-tier npm workspace topology across the repository root (`Habit Tracker/`) and project root (`ai-habit-tracker/`), wires unified multi-package scripts (`npm test`, `npm run build`, `npm run lint`, `npm run dev`), configures an automated GitHub Actions CI workflow (`.github/workflows/ci.yml`) targeting Node.js 22 LTS with Indian Standard Time (`TZ: Asia/Kolkata`) standardization, and updates documentation.

---

## 🎯 Phase Goals & Requirements
1. **Dual-Tier Workspace Configuration:** Support executing commands from both root `Habit Tracker/` and subdirectory `ai-habit-tracker/` without path dissonance.
2. **Unified Command Scripts:**
   - `npm test`: Runs both client unit tests (8 tests) and server unit/integration tests (26 tests) with a single command.
   - `npm run build`: Executes client Vite production bundling.
   - `npm run lint`: Executes ESLint validation on client code.
   - `npm run dev:client` & `npm run dev:server`: Standalone commands for targeting individual tiers.
3. **Automated CI/CD Workflow:**
   - GitHub Actions pipeline triggered on all `push` and `pull_request` events to `main`.
   - Node.js 22 LTS environment on `ubuntu-latest`.
   - Validates code syntax, runs ESLint, executes 34 automated tests, and verifies Vite production bundling.
   - Zero external credentials required in CI (all tests run in-process with `NODE_ENV=test`).
4. **Documentation Synchronization:**
   - Update `README.md` and `CONTRIBUTING.md` with unified workflow commands.

---

## 🌊 Execution Waves & Task Breakdown

### Wave 1: Monorepo Workspace Configuration
- [ ] **Task 1.1: Root Workspace Definition (`package.json`)**
  - Create `package.json` at repository root `Habit Tracker/package.json`.
  - Configure `workspaces: ["ai-habit-tracker/client", "ai-habit-tracker/server"]`.
  - Add root scripts:
    - `"test"`: `"npm --prefix ai-habit-tracker/client test && npm --prefix ai-habit-tracker/server test"`
    - `"test:client"`: `"npm --prefix ai-habit-tracker/client test"`
    - `"test:server"`: `"npm --prefix ai-habit-tracker/server test"`
    - `"build"`: `"npm --prefix ai-habit-tracker/client build"`
    - `"lint"`: `"npm --prefix ai-habit-tracker/client lint"`
- [ ] **Task 1.2: Project-Level Workspace Definition (`ai-habit-tracker/package.json`)**
  - Update `ai-habit-tracker/package.json` with `workspaces: ["client", "server"]`.
  - Add matching workspace scripts (`"test"`, `"build"`, `"lint"`).
- [ ] **Task 1.3: Server Package Script Polish (`ai-habit-tracker/server/package.json`)**
  - Add `"lint"` script for syntax checking (`"node --check src/server.js src/app.js"`).

---

### Wave 2: CI/CD Pipeline Specification
- [ ] **Task 2.1: GitHub Actions CI Workflow (`.github/workflows/ci.yml`)**
  - Create directory `.github/workflows/`.
  - Implement `.github/workflows/ci.yml` with:
    - Triggers: `push` and `pull_request` on branch `main`.
    - OS: `ubuntu-latest`.
    - Node.js: `22.x`.
    - Environment: `NODE_ENV: test`, `TZ: Asia/Kolkata`.
    - Steps:
      1. Checkout code (`actions/checkout@v4`).
      2. Set up Node.js 22 with npm cache.
      3. Install client and server dependencies.
      4. Run linter and syntax checks.
      5. Run full automated test suite (34 tests).
      6. Run production build check.

---

### Wave 3: Documentation & Verification
- [ ] **Task 3.1: Update Developer Documentation**
  - Update root `README.md` Getting Started section with monorepo root commands and CI badge.
  - Update `ai-habit-tracker/CONTRIBUTING.md` with the new unified workspace commands.
- [ ] **Task 3.2: Local Validation Run**
  - Run root `npm test` and verify all 34 tests execute cleanly.
  - Run root `npm run build` and verify Vite production bundle succeeds.
  - Run root `npm run lint` and verify linter passes.
- [ ] **Task 3.3: Verification Report**
  - Generate `VERIFICATION.md` for Phase 5.2.

---

## 🔒 Verification Criteria
1. Root `npm test` runs both client and server test suites, reporting 34/34 passing tests.
2. Root `npm run build` compiles client assets into `ai-habit-tracker/client/dist/` without errors.
3. `.github/workflows/ci.yml` is syntactically valid YAML and conforms to GitHub Actions v4 action standards.
4. No disruption to existing Render backend or Vercel frontend build paths.

