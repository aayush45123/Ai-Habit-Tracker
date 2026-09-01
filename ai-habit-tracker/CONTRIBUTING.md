# Contributing to AI Habit Tracker

Thank you for your interest in contributing! This document explains how to get started.

---

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Setting Up the Development Environment](#setting-up-the-development-environment)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Issue Labels](#issue-labels)

---

## Code of Conduct

Be respectful and constructive. Focus on improving the project. Harassment or abuse of any kind will not be tolerated.

---

## How Can I Contribute?

### 🐛 Reporting Bugs

1. Search [existing issues](../../issues) first to avoid duplicates.
2. Open a new issue using the **Bug** label.
3. Include:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser / Node.js version
   - Any relevant console output

### 💡 Suggesting Enhancements

1. Open an issue with the **Enhancement** label.
2. Describe the problem you want to solve, not just the solution.
3. Explain why this would benefit other users.

### 🔧 Submitting Code

1. Fork the repository.
2. Create a branch: `git checkout -b feature/your-feature-name` or `fix/your-bug-description`.
3. Make your changes following the coding standards below.
4. Open a Pull Request targeting `main`.

---

## Setting Up the Development Environment

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/ai-habit-tracker.git
cd ai-habit-tracker
```

### 2. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 3. Configure Environment Variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both files with your development credentials
```

### 4. Start Development Servers

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

---

## Pull Request Process

1. **Keep PRs focused** — one feature or fix per PR.
2. **Write clear commit messages** — use present tense: `"Fix streak reset bug"` not `"Fixed streak reset bug"`.
3. **Update documentation** if you change behavior visible to users.
4. **Do not break existing API contracts** — frontend and backend must stay in sync.
5. **Do not remove existing features** — deprecate before removing.
6. **Do not add unnecessary dependencies** — open an issue to discuss before adding a new npm package.

PRs are reviewed within a few days. Be prepared to make revisions.

---

## Coding Standards

### General
- Use **ES Modules** (`import`/`export`) throughout — no CommonJS `require()`.
- Use `async/await` — avoid raw `.then()` chains.
- All `async` functions must have `try/catch` blocks.
- Never expose `error.message` in HTTP 500 responses — log it server-side.
- Never commit secrets, API keys, or `.env` files.

### Backend (Node.js / Express)
- Follow the existing layered architecture: **Routes → Middleware → Controllers → Services → Models**.
- Do not put business logic directly in route handlers.
- All routes must go through `authMiddleware` for protected endpoints.
- Validate all request bodies with Zod schemas in `/validators/`.
- Return consistent error shapes: `{ message: "User-friendly message" }`.

### Frontend (React)
- Use **CSS Modules** for component styling — no inline styles except for dynamic values.
- All `useEffect` hooks must clean up subscriptions, timers, and socket listeners.
- Use the shared `api` Axios instance from `utils/api.js` — do not create new Axios instances.
- Do not bypass the `AuthContext` for authentication state.

---

## Issue Labels

| Label | Meaning |
|-------|---------|
| `bug` | Something is broken |
| `enhancement` | New feature or improvement |
| `ui/ux` | Visual or usability improvement |
| `documentation` | README, comments, or guides |
| `accessibility` | A11y improvements |
| `performance` | Speed or memory improvements |
| `good first issue` | Suitable for new contributors |
| `security` | Security-related issue |

---

## Questions?

Open a [Discussion](../../discussions) or file an issue — we're happy to help.
