# 🔌 External Integrations & Services

## 1. Primary Integrations Architecture
The platform integrates several cloud-hosted managed services, storage systems, and AI inference providers across client and server.

```
+-----------------------------------------------------------------------------------+
|                                 HabitAI Platform                                  |
+-------------------+--------------------+--------------------+---------------------+
                    |                    |                    |
                    v                    v                    v
          +------------------+ +------------------+ +------------------+
          |  MongoDB Atlas   | |  Upstash Redis   | |    Groq Cloud    |
          |  Primary Storage | |  Distributed     | |  Llama 3.3 70B   |
          |  (Mongoose ODM)  | |  Cache & Limits  | |  AI Coach/Chat   |
          +------------------+ +------------------+ +------------------+
                    |                    |                    |
                    v                    v                    v
          +------------------+ +------------------+ +------------------+
          |  Firebase Auth   | |    Cloudinary    | | Nodemailer/Resend|
          |  Google Identity | |  Profile Avatars | | Email Automation |
          |  & Token Verify  | |  Media Storage   | | & Notifications  |
          +------------------+ +------------------+ +------------------+
```

---

## 2. Integration Details

### 2.1 MongoDB Atlas
- **Purpose:** Primary persistence store for all application data (users, habits, logs, schedules, calories, challenges, gamification state).
- **Configuration:** Managed via `MONGO_URI` environment variable in `server/.env`.
- **Driver:** Mongoose 9.x (`server/src/config/db.js`).
- **Resilience:** Auto-reconnect handling with connection pooling; composite indexing on high-frequency queries.

### 2.2 Upstash Redis
- **Purpose:** Distributed caching layer, session rate limiting, and temporary cache for expensive analytics calculations.
- **Configuration:**
  - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (REST-based HTTP fallback)
  - `REDIS_URL` (direct TCP connection via `ioredis`)
- **Implementation:** `server/src/config/redis.js` and `server/src/services/redis.service.js`.

### 2.3 Groq Cloud AI Engine
- **Purpose:** High-throughput, low-latency LLM inference powering:
  - AI Habit Coach (`/api/coach`)
  - AI Chat Drawer (`/api/ai-chat`)
  - Intelligent Schedule Generator (`/api/ai-timetable`)
  - Journal Reflection Sentiment & Analysis (`/api/journal`)
- **Model:** `llama-3.3-70b-versatile`
- **Configuration:** `GROQ_API_KEY`
- **Fallback Mechanism:** All AI controllers implement graceful rule-based algorithmic fallback returns if Groq API is throttled or offline.

### 2.4 Firebase Authentication & Google Sign-In
- **Purpose:** Seamless passwordless / social sign-in via Google accounts.
- **Client Implementation:** Firebase Web SDK (`client/src/utils/firebase.js`).
- **Server Implementation:** Firebase Admin SDK (`server/src/services/firebaseAuth.service.js`) verifying Google identity tokens server-side before issuing application JWTs.

### 2.5 Cloudinary
- **Purpose:** Cloud media storage and image optimization for user profile pictures and custom avatars.
- **Configuration:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- **Middleware:** `multer-storage-cloudinary` attached to `/api/profile/upload-avatar`.

### 2.6 Resend & Nodemailer Email Engine
- **Purpose:** Automated transactional emails:
  - Account verification emails
  - Daily check-in reminders (via `node-cron` at 08:00 IST)
  - Streak loss alert notifications
  - Weekly progress and nutrition summaries
- **Configuration:** `EMAIL_USER`, `EMAIL_PASS` (SMTP), and optional `RESEND_API_KEY`.
- **Implementation:** `server/src/services/email.service.js`, `server/src/cron/emailReminder.cron.js`, and HTML templates in `server/src/templates/`.

### 2.7 Vercel Web Analytics & Speed Insights
- **Purpose:** Privacy-friendly real-user metrics, web vitals, and error tracking on the production frontend.
- **Implementation:** Mounted in root React tree (`client/src/App.jsx`).

---

## 3. Environment Variables Reference

### Server Environment (`server/.env`)
- `PORT` — API listening port (default: 5000)
- `MONGO_URI` — MongoDB Atlas connection string
- `JWT_SECRET` — Symmetric key for signing JSON Web Tokens
- `GROQ_API_KEY` — API key for Groq Cloud LLM inference
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis credentials
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — Cloudinary config
- `EMAIL_USER` / `EMAIL_PASS` — SMTP credentials for mail delivery
- `CLIENT_URL` — Allowed origins for CORS (e.g. `http://localhost:5173`)

### Client Environment (`client/.env`)
- `VITE_API_URL` — Target Express API base URL
- `VITE_FIREBASE_API_KEY` — Firebase public Web API key
- `VITE_FIREBASE_AUTH_DOMAIN` — Firebase authentication domain
- `VITE_FIREBASE_PROJECT_ID` — Firebase project identifier
- `VITE_FIREBASE_STORAGE_BUCKET` — Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` — Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` — Firebase application ID

