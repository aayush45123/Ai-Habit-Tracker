# 📐 Code Conventions & Standards

## 1. UI & Design System: Nihilism Monochrome Theme
The visual identity follows a modern, brutalist, high-contrast monochrome design language defined in `client/src/App.css`.

### 1.1 CSS Variables & Design Tokens
```css
:root {
  /* Colors */
  --color-bg-primary: #ffffff;      /* Pure paper white */
  --color-bg-secondary: #f5f5f5;    /* Off-white card background */
  --color-bg-tertiary: #e6e6e6;     /* Subtle gray hover surface */
  --color-accent-primary: #000000;  /* Pure black for high-contrast actions */
  --color-accent-secondary: #2b2b2b;/* Dark slate gray */
  --color-text-primary: #000000;    /* High-contrast body text */
  --color-text-secondary: #555555;  /* Secondary / caption text */
  --color-border: #000000;          /* Sharp solid border */

  /* Typography */
  --font-primary: "Sora", sans-serif;
  --font-size-base: 16px;

  /* Motion & Elevation */
  --transition-speed: 0.3s;
  --transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 1.2 Component Styling Rules
- **Component Isolation:** Every major component and page uses dedicated CSS Modules (`[Component].module.css`).
- **Borders & Shadows:** Sharp solid borders (`2px solid var(--color-border)` or `3px solid ...`) paired with crisp box-shadows (`4px 4px 0px var(--color-border)`).
- **Interactive Micro-actions:** Buttons translate on hover (`transform: translate(-1px, -1px); box-shadow: 5px 5px 0px ...`) and depress on active click (`transform: translate(2px, 2px); box-shadow: 2px 2px 0px ...`).
- **Responsive Layout:** Mobile navigation overlays and responsive grids (`grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))`) ensure seamless tablet and mobile usage.

---

## 2. JavaScript & Code Style Conventions

### 2.1 General Rules
- **Module System:** ES Modules (`import` / `export`) throughout both client and server.
- **Naming Conventions:**
  - React Components & Files: `PascalCase` (e.g. `TimeSchedulePage.jsx`, `DailyTimelineView.jsx`).
  - Controllers & Services: `camelCase` (e.g. `scheduleController.js`, `gamification.service.js`).
  - Mongoose Models: `PascalCase` (e.g. `ScheduleEvent.js`, `Habit.js`).
  - Helper functions: `camelCase` (e.g. `formatDateISO`, `timeToMinutes`).
- **Defensive Fallback & Resiliency:** External API calls (Groq AI, server requests) should be wrapped in `try/catch` blocks with local cache fallbacks where applicable, preventing unhandled UI crashes.

---

## 3. Backend & API Conventions

### 3.1 RESTful Endpoint Structure
- Singular or plural resource nouns (e.g., `/api/habits`, `/api/schedule`, `/api/calories`).
- Standard HTTP Methods:
  - `GET`: Retrieve resource or collection.
  - `POST`: Create resource or execute non-idempotent action.
  - `PUT`: Complete resource replacement.
  - `PATCH`: Partial update or status toggle.
  - `DELETE`: Resource removal.

### 3.2 Response Payload Format
All endpoints return standard JSON responses:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```
Error responses:
```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": "Detailed technical message (dev only)"
}
```

### 3.3 Authentication & Middleware Flow
1. `authMiddleware`: Extracts and validates Bearer JWT token from `Authorization` header, populating `req.user`.
2. `requireProfileCompleted`: Verifies biometric and setup completion before granting access to analytics, journals, and timetables.
3. `requireAdmin`: Ensures `req.user.role === 'admin'`.

