# 📂 Codebase Structure & Module Layout

## 1. Directory Tree Overview

```
Habit Tracker/
├── .planning/                  # GSD planning directory (codebase maps, roadmap, state)
├── ai-habit-tracker/
│   ├── client/                 # React 19 + Vite Frontend SPA
│   │   ├── public/             # Static public assets (icons, manifest)
│   │   ├── src/
│   │   │   ├── assets/         # App graphics, mockups, illustrations
│   │   │   ├── components/     # Reusable modular UI components
│   │   │   ├── context/        # React context providers (Auth, Socket, Gamification)
│   │   │   ├── hooks/          # Custom hooks (ActivityTracker, VisitorTracker)
│   │   │   ├── layout/         # Application shell (MainLayout, Navigation)
│   │   │   ├── pages/          # Top-level view routes
│   │   │   ├── services/       # Client-side services (socket.service.js)
│   │   │   ├── utils/          # API client, date helpers, route guards, notifications
│   │   │   ├── App.css         # Global Nihilism Monochrome styles & CSS variables
│   │   │   ├── App.jsx         # App root router & lazy route boundaries
│   │   │   └── main.jsx        # React root hydration
│   │   ├── .env                # Client environment variables
│   │   ├── package.json        # Client dependencies & scripts
│   │   └── vite.config.js      # Vite build & plugin configuration
│   │
│   └── server/                 # Express 5 REST API & WebSocket Backend
│       ├── python/             # Python ML models, scripts, training data
│       ├── scripts/            # Standalone maintenance & verification scripts
│       ├── src/
│       │   ├── ai/             # AI coach reasoning engine & profile generators
│       │   ├── config/         # Database, Redis, Cloudinary initialization
│       │   ├── controllers/    # API endpoint business logic controllers
│       │   ├── cron/           # Scheduled background tasks (email reminders, streak check)
│       │   ├── middleware/     # Auth, admin, profile completion, upload middlewares
│       │   ├── models/         # Mongoose ODM schemas & database models (28 models)
│       │   ├── routes/         # Express route definitions
│       │   ├── seeds/          # Initial database seed scripts (gamification catalog)
│       │   ├── services/       # Domain business services (email, XP, nutrition, redis)
│       │   ├── socket/         # Socket.IO connection handlers & event listeners
│       │   ├── templates/      # HTML email templates (reminders, streaks, summaries)
│       │   ├── utils/          # IST timezone helpers, AI clients, prompt builders
│       │   ├── validators/     # Zod payload validators
│       │   ├── app.js          # Express app configuration & middleware pipeline
│       │   └── server.js       # HTTP server bootstrapper & socket initialization
│       ├── .env                # Backend environment secrets
│       ├── package.json        # Server dependencies & scripts
│       └── test_runner.js      # CLI test runner for nutrition engine
│
├── PROJECT_CONTEXT.md          # Comprehensive executive & system architecture overview
├── PROJECT_INTERVIEW_PREPARATION.md # In-depth Q&A technical breakdown
├── README.md                   # Public repository documentation & screenshots
└── CONTRIBUTING.md             # Developer guidelines
```

---

## 2. Client Pages & Modules (`client/src/pages/`)

| Page / Route | Directory | Description & Subcomponents |
| :--- | :--- | :--- |
| `/` | `Landing/` | High-impact 3D GSAP landing page with interactive cards, magnetic CTA, live metrics |
| `/login`, `/signup`, `/verify-email` | `Auth/` | User authentication, password reset, email token verification, Google OAuth |
| `/dashboard` | `Dashboard/` | Unified command center: daily habits, completion trends, AI insight cards, quick logs |
| `/add` | `AddHabit/` | Custom habit creator with frequency, time window, category, and target setting |
| `/habit/:id` | `HabitDetail/` | In-depth habit inspection: calendar heatmap, streak stats, adherence probability |
| `/analytics` | `Analytics/` | Long-term habit trends, category distribution, completion charts |
| `/dashboard/reports` | `Reports/` | Printable/exportable PDF summaries and weekly adherence performance reports |
| `/ai` | `AIChat/` | Full-page interactive AI lifestyle and habit coach |
| `/challenge` | `Challenge/` | 21-Day bootcamp enrollment, daily check-in board, adherence heatmaps |
| `/templates` | `HabitTemplates/`| Curated starter habit routines (Productivity, Fitness, Mindfulness) |
| `/journal` | `Journal/` | Growth journal with Pearson correlation engine linking sleep, mood, and habits |
| `/focus` | `Focus/` | Pomodoro focus timer with customized work/break cycles and audio alerts |
| `/calories` | `Calories/` | Calorie and macro tracker (Mifflin-St Jeor), daily meal logs, weekly check-in wizard |
| `/timetable` | `Timetable/` | Workout timetable builder, exercise orders, set/rep targets, daily workout logs |
| `/schedule` | `TimeSchedule/` | Daily/weekly time timetable, time-slot blocking, conflict alerts, live reminders |
| `/profile` | `Profile/` | Biometric profile, target goals, password management, avatar upload |
| `/progression` | `Progression/`| Level tier progress bar, XP transaction history, streak statistics |
| `/achievements` | `Achievements/`| Milestone badges showcase (completed habits, streak master, challenges) |
| `/rewards` | `Rewards/` | Virtual reward redemptions and coin balance manager |
| `/admin/*` | `admin/` | Admin overview, user management, visitor logs, system activity telemetry |

---

## 3. Server Models & Collections (`server/src/models/`)

- **User & Auth:** `User.js`, `UserProfile.js`, `UserSession.js`, `VisitorLog.js`
- **Habits & Tracking:** `Habit.js`, `HabitLog.js`, `HabitTemplate.js`
- **21-Day Challenge:** `Challenge.js`, `ChallengeLog.js`, `UserChallenge.js`
- **Focus & Timetable:** `FocusLog.js`, `Timetable.js`, `WorkoutLog.js`, `ScheduleEvent.js`
- **Nutrition & Calories:** `CalorieProfile.js`, `FoodLog.js`, `UserFoodMemory.js`, `WeeklyCheckIn.js`
- **Journal & Intelligence:** `JournalEntry.js`, `JournalTemplate.js`, `aiChat.js`
- **Gamification & Rewards:** `Achievement.js`, `UserAchievement.js`, `GamificationChallenge.js`, `Reward.js`, `UserReward.js`, `UserGamification.js`, `XPTransaction.js`, `ActivityEvent.js`

