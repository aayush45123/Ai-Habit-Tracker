# 📋 Project Requirements

## 1. Functional Requirements

### 1.1 Authentication & Security (AUTH)
- [x] **AUTH-01:** Email/password registration and login with bcryptjs password hashing.
- [x] **AUTH-02:** Email verification via tokenized verification links sent through SMTP.
- [x] **AUTH-03:** Google OAuth integration using Firebase Authentication.
- [x] **AUTH-04:** JWT-based stateless authentication with automatic request interceptors.
- [x] **AUTH-05:** Profile completion onboarding gate (`ProfileRequiredRoute`).
- [x] **AUTH-06:** Role-based access control (Admin vs User) protecting `/admin/*`.

### 1.2 Habit Management & Tracking (HABIT)
- [x] **HABIT-01:** CRUD operations for user habits (title, description, category, frequency, target window).
- [x] **HABIT-02:** Daily check-in logging (`done` / `missed`) enforced with composite unique indexes (`habitId` + `date`).
- [x] **HABIT-03:** Real-time streak calculation (`currentStreak`, `longestStreak`).
- [x] **HABIT-04:** Cross-midnight window support for night habits.
- [x] **HABIT-05:** Automatic midnight streak reset via scheduled cron job (00:01 IST).
- [x] **HABIT-06:** Habit starter templates with 1-click adoption.

### 1.3 21-Day Challenges (CHAL)
- [x] **CHAL-01:** Curated 21-day structured bootcamps with multi-habit requirements.
- [x] **CHAL-02:** Daily progress logging with calendar adherence heatmaps.
- [x] **CHAL-03:** Milestone badge awards upon completing challenges.

### 1.4 Pomodoro Focus & Deep Work (FOCUS)
- [x] **FOCUS-01:** Customizable Pomodoro timer (Work / Short Break / Long Break).
- [x] **FOCUS-02:** Browser audio cues and visual progress circles.
- [x] **FOCUS-03:** Completed session logging with daily and weekly focus analytics.

### 1.5 Calorie & Nutrition Engine (NUTR)
- [x] **NUTR-01:** Biometric profile setup with Mifflin-St Jeor BMR and TDEE calculation.
- [x] **NUTR-02:** Daily food logging with macronutrient breakdown (calories, protein, carbs, fats).
- [x] **NUTR-03:** Intelligent food parsing and nutritional database matching.
- [x] **NUTR-04:** Weekly weight check-in wizard with dynamic caloric target recalibration.

### 1.6 Growth Journal & Pearson Analytics (JOURN)
- [x] **JOURN-01:** Daily multidimensional logging: mood (1-5), energy (1-5), sleep hours, water intake, productivity score, and reflections.
- [x] **JOURN-02:** Mathematical Pearson correlation engine calculating statistical relationships between habits, sleep, and mood.
- [x] **JOURN-03:** AI-assisted qualitative reflection analysis with Groq Llama 3.3.

### 1.7 Timetables & Calendar Scheduling (TIME)
- [x] **TIME-01 (Workout Timetable):** Weekly workout routine builder with exercise orders, sets, reps, rest days, and daily workout logs.
- [x] **TIME-02 (Time Timetable):** Day-by-day time slot scheduling with explicit start time and end time ("from this time to this time").
- [x] **TIME-03:** Multi-view schedule interface: Daily Timeline, Weekly 7-day grid, and Monthly calendar overview.
- [x] **TIME-04:** Real-time time conflict detection warning if two tasks overlap.
- [x] **TIME-05:** Live in-app reminder banner ("Happening Now" / "Up Next") with Web Audio chime alerts and browser notifications.
- [x] **TIME-06:** Daily routine templates (Workday, Study, Wellness) and 1-click day duplication.

### 1.8 Gamification & Progression (GAME)
- [x] **GAME-01:** Experience point (XP) engine awarding points for habit logs, challenges, focus sessions, and journal entries.
- [x] **GAME-02:** 10 progressive level tiers with leveling celebration modals.
- [x] **GAME-03:** Achievement badge catalog and unlockable rewards shop.
- [x] **GAME-04:** Real-time level up and badge unlock broadcasts via WebSockets.

---

## 2. Non-Functional Requirements

- **NFR-01 (Timezone Reliability):** All date boundaries, streaks, and challenge schedules locked to Indian Standard Time (`UTC+5:30`).
- **NFR-02 (AI Resilience):** Multi-tier fallback architecture: primary Groq LLM -> classical scikit-learn ML -> algorithmic rule-based fallback.
- **NFR-03 (Explainable AI):** All AI predictions must include confidence scores, contributing factor weights, and concrete rationales.
- **NFR-04 (Offline Capability):** Critical client workflows (Time Timetable, Workout Timetable) preserve drafts in browser `localStorage`.
- **NFR-05 (Visual Consistency):** Strict adherence to the brutalist Nihilism Monochrome Theme (`--color-bg-primary`, `--color-border: #000000`, 2px/3px sharp borders, box-shadows).

