# 🏛️ Architectural Overview

## 1. System Topology & Pattern
The platform follows a decoupled **Client-Server Architecture** with a single-page React frontend communicating with an Express 5 REST API gateway and a WebSocket server for real-time synchronization.

```
                      +------------------------------------------+
                      |               React 19 SPA               |
                      |   Context State | Hooks | CSS Modules    |
                      +---------------------+--------------------+
                                            |
                         HTTP REST (JSON)   |   WebSocket (Socket.IO)
                         (Axios Interceptor)|   (Live broadcast)
                                            v
                      +------------------------------------------+
                      |         Express 5 API Gateway            |
                      |  Auth JWT | CORS | Rate-limit | Routes   |
                      +-----+----------------+-------------+-----+
                            |                |             |
           +----------------+                |             +-----------------+
           v                                 v                               v
+----------------------+          +--------------------+          +--------------------+
|    MongoDB Atlas     |          |   Upstash Redis    |          |    AI & ML Core    |
| 28 Mongoose Models   |          | Session/Analytics  |          | Groq Llama 3.3 70B |
| Compound Indexes     |          | Cache Layer        |          | Python scikit-learn|
+----------------------+          +--------------------+          +--------------------+
```

---

## 2. Core Architectural Pillars

### 2.1 Timezone Invariant Design (IST Normalization)
- **Problem:** Users logging habits across midnight boundaries or in different time zones frequently encounter streak calculation errors or duplicate check-in bugs.
- **Solution:** All business logic, streak evaluators, daily challenge dates, and cron jobs standardize on Indian Standard Time (`UTC+5:30` / `Asia/Kolkata`) via `server/src/utils/getTodayIST.js`.
- **Cross-Midnight Habits:** Habits with start times before 00:00 and end times after 00:00 are handled through an active-window computation, ensuring check-ins are valid during the user's awake cycle.

### 2.2 Explainable AI (XAI) & Dual-Inference Pipeline
- **Dual Engine:**
  1. **Generative LLM (Groq Llama 3.3 70B):** Handles qualitative recommendations, personalized feedback, natural language chat, and schedule optimization.
  2. **Classical ML (Python + scikit-learn):** Logistic regression model (`model.pkl`) evaluates quantitative probability of habit adherence based on frequency, past completion rate, and category.
- **Explainability:** Predictions are not opaque numbers; the system calculates and delivers contributing factor weights (`factorWeights[]`), rationales (`reasons[]`), and concrete recommendations with confidence metrics.
- **Fault-Tolerant Fallback:** If the external LLM or local Python subprocess encounters any exception, the controller immediately activates deterministic rule-based algorithms to guarantee zero downtime for the end user.

### 2.3 Real-Time State Synchronization (Socket.IO)
- Authenticated users join dedicated room channels (`user:${userId}`).
- Real-time events broadcasted:
  - `dashboard:update`: Triggered when habits are logged, refreshed, or streaks updated.
  - `gamification:update`: Triggered on XP gain, level up, or badge unlock.
  - `challenge:update`: Synchronizes active challenge days.

### 2.4 Gamification & Progression Subsystem
- **XP Transactions:** Every action (habit logged, challenge day complete, journal entry saved, focus session finished) creates an `XPTransaction` log.
- **Leveling Curve:** Exponential XP thresholds scaling up to Level 10.
- **Rewards & Badges:** Gamification catalog (`GamificationChallenge`, `Achievement`, `Reward`) seeds baseline milestones, which users unlock and claim with real-time modal notifications.

---

## 3. Client State Management
- **React Context API:**
  - `AuthContext`: Manages JWT tokens, user credentials, login/logout, and profile completion gate state.
  - `SocketContext`: Manages active WebSocket connections, reconnection logic, and event subscriptions.
  - `GamificationContext`: Tracks user level, total XP, coins, streak freezes, and unlocked badges.
- **Local Fallback Caching:** Key workflows (Time Timetable, Workout Timetable, Growth Journal) cache local drafts in browser `localStorage` (`time_schedule_cache_...`, `workout_log_cache_...`) to provide offline capability.
- **Routing & Route Protection:**
  - `PublicRoute`: Redirects authenticated users to `/dashboard`.
  - `ProtectedRoute`: Ensures active token exists.
  - `ProfileRequiredRoute`: Enforces profile onboarding before granting access to analytics, timetables, and journals.
  - `ProtectedAdminRoute`: Restricts administrative tabs to users with `role: "admin"`.

