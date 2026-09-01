# 🧠 AI Habit Tracker

> A full-stack AI-powered habit tracking application that helps you build and maintain healthy habits through personalized recommendations, real-time progress tracking, and intelligent coaching.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://ai-habit-tracker-eb72.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🎯 Problem Statement

Most habit trackers are passive — they record what you did but offer no intelligent guidance on *what to do next*. AI Habit Tracker combines habit logging with a real AI coach that analyzes your patterns, identifies your strengths and weak spots, and delivers personalized, data-driven recommendations that evolve as you grow.

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure email/password registration with email verification
- JWT-based authentication with 7-day token lifetime
- Role-Based Access Control (RBAC) — `user` and `admin` roles
- Protected routes on both frontend and backend

### 📋 Habit Management
- Create, edit, and delete habits with descriptions and frequency
- Daily habit logging (done / missed) — one log per day enforced
- Automatic streak calculation and longest streak tracking
- Missed habit detection via nightly cron job at 00:01 IST

### 📊 Dashboard
- Today's habits overview with per-habit completion status
- Current streak and personal best streak display
- Weekly progress completion rate
- 30-day activity heatmap
- AI-generated daily recommendation snippet

### 📈 Analytics
- Weekly completion trends (last 7 days)
- Day-of-week performance breakdown (best day identification)
- Habit leaderboard ranked by completion rate
- Consistency score over last 30 days
- Week-over-week performance change indicator

### 🤖 AI Features
- **AI Habit Coach** — Groq-powered personalized insights with full explainability
- **AI Chat Assistant** — conversational guidance for any habit question
- **AI Timetable Generator** — generates a personalized daily schedule
- **AI Fitness Coach** — workout recommendations based on your profile
- **Calorie AI** — nutrition guidance and meal planning assistance
- Graceful heuristic fallback when AI APIs are unavailable

### 📅 21-Day Challenge
- Join structured 21-day habit challenges
- Daily check-ins with streak tracking and milestone celebrations

### 📓 Journal
- Daily habit journal with mood and reflection notes
- AI-analyzed journal entries and weekly check-in templates

### 🍎 Calorie Tracker
- Meal logging with calorie counts
- Daily intake summaries and nutrition recommendations

### ⏱️ Focus Timer
- Pomodoro-style focus sessions with session analytics

### 🔔 Email Notifications
- Daily reminder emails (user-configurable delivery time)
- Weekly progress summary every Sunday
- Streak-lost recovery emails
- Achievement milestone notification emails
- Email verification link on signup (via Brevo transactional API)

### 👑 Admin Dashboard
- User management — view all users, update roles, disable/enable, delete
- Habit template management — create and delete pre-built templates
- Platform-wide analytics

### ⚡ Real-Time (Socket.IO)
- Instant habit completion sync across multiple devices
- Real-time streak milestone notifications
- In-app toast notification system
- JWT-authenticated WebSocket connections

---

## 🏗️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React.js (Vite) | UI framework |
| React Router DOM | Client-side routing |
| Axios | HTTP client with JWT interceptors |
| CSS Modules | Component-scoped styling |
| Chart.js + React ChartJS 2 | Habit analytics charts |
| Highcharts | Advanced data visualizations |
| Socket.IO Client | Real-time updates |
| Lucide React + React Icons | Icon library |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js + Express.js | REST API server |
| MongoDB + Mongoose | Primary database |
| JWT (jsonwebtoken) | Stateless authentication |
| bcryptjs | Secure password hashing |
| Zod | Schema-based request validation |
| Upstash Redis | Serverless response caching |
| Cloudinary + Multer | Profile image upload and CDN |
| Socket.IO | WebSocket server |
| Node-Cron | Scheduled background jobs |
| Brevo API | Transactional email delivery |

### AI
| Technology | Purpose |
|-----------|---------|
| Groq API | Fast AI inference (Llama models) |
| OpenAI API | GPT-based features |

### Deployment
| Service | Usage |
|---------|-------|
| Vercel | Frontend hosting |
| Render | Backend API hosting |
| MongoDB Atlas | Managed cloud database |
| Upstash | Serverless Redis cache |
| Cloudinary | Image storage and CDN |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                    │
│     React + Vite  │  CSS Modules  │  Chart.js           │
│     Socket.IO Client  │  Axios w/ JWT interceptor       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────┐
│                    Backend (Render)                     │
│                                                         │
│   Routes → Auth Middleware → Controllers → Services     │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │  Groq    │  │  Redis   │  │ MongoDB  │            │
│   │  OpenAI  │  │  Cache   │  │  Atlas   │            │
│   └──────────┘  └──────────┘  └──────────┘            │
│                                                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│   │Node-Cron │  │  Brevo   │  │Cloudinary│            │
│   │  Jobs    │  │  Email   │  │  Images  │            │
│   └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Request Flow
```
Browser Request
  → Axios (auto-attaches JWT)
  → Express Route
  → Auth Middleware (JWT verify + User load)
  → Cache Middleware (Redis check)
  → Controller
  → Service / MongoDB
  → Cache set (on MISS)
  → JSON Response
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Upstash Redis account (free tier works)
- Cloudinary account (free tier works)
- Brevo account for transactional email
- Groq API key (free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-habit-tracker.git
cd ai-habit-tracker
```

### 2. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your real credentials
npm run dev
```

The server starts on `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd client
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

The frontend starts on `http://localhost:5173`.

---

## 🔑 Environment Variables

See [`server/.env.example`](server/.env.example) and [`client/.env.example`](client/.env.example) for all required keys. **Never commit real credentials.**

---

## 🔌 API Overview

| Module | Base Path | Auth Required |
|--------|-----------|---------------|
| Auth | `/api/auth` | Partial |
| Profile | `/api/profile` | ✅ |
| Habits | `/api/habits` | ✅ + Profile |
| Dashboard | `/api/dashboard` | ✅ |
| AI Insights | `/api/ai` | ✅ |
| AI Chat | `/api/ai-chat` | ✅ |
| AI Timetable | `/api/ai-timetable` | ✅ |
| Fitness Coach | `/api/coach` | ✅ |
| Calories | `/api/calories` | ✅ |
| Challenge | `/api/challenge` | ✅ |
| Focus | `/api/focus` | ✅ |
| Journal | `/api/journal` | ✅ |
| Reports | `/api/reports` | ✅ |
| Templates | `/api/templates` | ✅ |
| Admin | `/api/admin` | ✅ Admin only |

---

## 🔐 Authentication

All protected routes require the header:
```
Authorization: Bearer <your-jwt-token>
```

Tokens are issued on login and expire after 7 days.

---

## ⚡ Real-Time Events

The Socket.IO server emits targeted events to each user's private room (`user:{userId}`):

| Event | Trigger |
|-------|---------|
| `dashboard:update` | Habit added, logged, or deleted |
| `streak:update` | Streak recalculated after log |
| `notification:new` | Milestone reached (e.g. 7-day streak) |
| `analytics:update` | Analytics cache invalidated |

---

## ⏰ Scheduled Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| Streak Reset | Daily 00:01 IST | Resets streaks for missed habits |
| Daily Reminder | Every hour (IST) | Sends reminder emails at users' configured time |
| Weekly Summary | Sunday 09:00 IST | Weekly progress summary email |

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🔮 Roadmap

- [ ] HTTP security headers (`helmet.js`)
- [ ] Rate limiting on auth routes
- [ ] MongoDB compound indexes for performance
- [ ] Push notifications (Web Push API)
- [ ] Data export (CSV / JSON)
- [ ] Dark mode toggle
- [ ] Habit sharing and social leaderboards
