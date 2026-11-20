# 🧠 Project Brief: AI Habit Tracker

## 1. Vision & Mission
**AI Habit Tracker** is an intelligent, full-stack, AI & ML-driven habit, fitness, and lifestyle optimization platform. Unlike passive checklist applications, it combines predictive machine learning, generative AI coaching with explainable reasoning (XAI), real-time WebSockets, time-series health correlation analytics, and an integrated gamification system to guide users proactively toward long-term behavior change.

---

## 2. Target Users & Core Value Proposition
- **Self-improvers & Professionals:** Want a unified system tracking daily routines, focus blocks, and nutrition without disjointed single-purpose apps.
- **Students & Lifelong Learners:** Need structured daily study blocks, Pomodoro cycles, and progress analytics.
- **Health & Fitness Enthusiasts:** Require macro-balanced meal tracking, weight recalibration, workout scheduling, and habit consistency.

---

## 3. System Architecture & Tech Highlights
- **Frontend:** React 19 Single Page Application with Vite 5, React Router v7, Recharts, and Chart.js, styled with scoped CSS Modules following a brutalist Nihilism Monochrome Theme.
- **Backend:** Node.js 22 LTS / Express 5 API gateway exposing REST endpoints and managing bidirectional real-time communication via Socket.IO.
- **Data & Caching:** MongoDB Atlas via Mongoose 9 for document storage; Upstash Redis for distributed TTL response caching and pattern invalidation.
- **AI & ML Engine:**
  - **Generative AI:** Groq Cloud Llama 3.3 70B for conversational lifestyle coaching and intelligent timetable generation.
  - **Classical Machine Learning:** Python 3 + `scikit-learn` Logistic Regression / Random Forest predicting habit adherence probability.
  - **Explainable AI (XAI):** Clear factor weights, confidence scores, and rationales accompanying every AI recommendation.
  - **Algorithmic Fallbacks:** Rule-based fallback mechanisms guaranteeing 100% uptime if external AI services fail.
- **Timezone Invariance (IST):** All day boundaries, streak evaluations, and challenge timeframes are locked to Indian Standard Time (`UTC+5:30`), preventing timezone drift and cross-midnight logging bugs.

---

## 4. Key Functional Modules
1. **Habit Tracking & Streak Engine:** Daily/weekly habits with frequency, time-windows, streak calculations, and completion histories.
2. **21-Day Habit Challenge:** Structured habit bootcamps with adherence heatmaps and milestone celebrations.
3. **Pomodoro Focus Timer:** Deep work timer with configurable intervals, ambient sound, and productivity analytics.
4. **Calorie & Macro Tracker:** Mifflin-St Jeor BMR/TDEE calculation, food item parsing, macronutrient breakdown, and weekly check-in recalibrations.
5. **Growth Journal & Pearson Correlation:** Daily mood, energy, sleep, and hydration logs with statistical Pearson correlation against habit success.
6. **Workout Timetable & Daily Time Timetable:**
   - **Workout Timetable:** Exercise orders, sets, reps, rest days, and workout execution checkpoints.
   - **Time Timetable:** Calendar-based day schedule ("from this time to this time"), conflict detection, live reminder banners, and web audio chime notifications.
7. **Gamification & Progression:** XP engine, 10 progression levels, unlockable badges, coin economy, and virtual reward shop.
8. **Admin Portal & Visitor Telemetry:** User management, session tracking, visitor logs, and system analytics.

