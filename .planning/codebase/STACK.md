# 🛠️ Technology Stack

## 1. Overview
The **AI Habit Tracker** is an AI/ML-driven full-stack web application designed to help users track habits, manage daily/weekly time schedules, run workout routines, record nutrition and calories, write growth journals, and participate in 21-day bootcamps. It combines a React 19 single-page application with an Express 5 backend, a MongoDB Atlas database, Upstash Redis caching, real-time Socket.IO synchronization, and multi-tier AI inference (Groq Cloud LLM + classical Python scikit-learn models).

---

## 2. Frontend Stack

| Layer / Concern | Technology | Version | Purpose / Details |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^19.2.0` | UI component library with modern Hooks & concurrent rendering |
| **DOM Renderer** | React DOM | `^19.2.0` | React web rendering engine |
| **Build Tool & Dev Server**| Vite | `^5.4.0` | Ultra-fast HMR, Rollup production bundling |
| **Routing** | React Router DOM | `^7.9.6` | Client-side routing, protected routes, profile gates, admin portals |
| **Styling Architecture** | CSS Modules + Vanilla CSS | Native | Component-scoped CSS modules adhering to a sharp Monochrome Brutalist theme |
| **Animations** | GSAP | `^3.15.0` | 3D scroll triggers, landing page hero showcases, magnetic CTA interactions |
| **Charts & Visualizations**| Recharts & Chart.js | `recharts ^3.10.1`, `chart.js ^4.5.1` | Analytics charts, completion trends, Pearson correlation heatmaps |
| **Iconography** | Lucide React & React Icons | `lucide-react ^0.562.0`, `react-icons ^5.5.0` | UI system icons, category badges, navigation elements |
| **HTTP Client** | Axios | `^1.13.2` | REST API communication with JWT & session ID interceptors |
| **Realtime Client** | Socket.IO Client | `^4.8.3` | Bidirectional websocket events for dashboard sync and achievements |
| **Auth & Social Login** | Firebase Web SDK | `^12.19.0` | Client-side Google Identity authentication provider |
| **Performance & Telemetry**| Vercel Analytics & Speed Insights | `^2.0.1`, `^1.3.1` | Real-user performance tracking and web vitals |

---

## 3. Backend Stack

| Layer / Concern | Technology | Version | Purpose / Details |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | Node.js (LTS) | `v22.x` | Server runtime with native ES modules support (`"type": "module"`) |
| **Web Application Framework**| Express | `^5.2.1` | REST API routing, JSON body parsing, CORS middleware, error handling |
| **Realtime Engine** | Socket.IO | `^4.8.3` | WebSocket server with authenticated user rooms and broadcast channels |
| **Database ODM** | Mongoose | `^9.0.0` | MongoDB schema modeling, indexing, aggregation, document validation |
| **Caching & In-Memory Store**| Upstash Redis & ioredis | `@upstash/redis ^1.38.0`, `ioredis ^5.11.1` | Rate limiting, profile caching, session management |
| **Authentication & Tokens** | JSON Web Tokens (JWT) & bcryptjs | `jsonwebtoken ^9.0.2`, `bcryptjs ^3.0.3` | Stateless Bearer token verification, password hashing |
| **Firebase Admin** | Firebase Admin SDK | `^14.5.0` | Server-side validation of Google OAuth tokens |
| **File Uploads** | Multer & Cloudinary SDK | `multer ^2.2.0`, `cloudinary ^1.41.3` | Profile avatar uploads, cloud asset management |
| **Background Scheduler** | node-cron | `^4.2.1` | Daily midnight streak resets (00:01 IST) and email reminder dispatch |
| **Email Delivery** | Nodemailer & Resend | `nodemailer ^9.0.3`, `resend ^6.20.0` | HTML email dispatch (daily reminders, streak lost alerts, weekly summaries) |
| **Validation** | Zod | `^4.4.3` | Schema validation on API payloads (auth, challenges, profile updates) |
| **PDF Generation** | PDFKit | `^0.19.1` | Exportable analytics and habit reports generation |

---

## 4. Machine Learning & AI Stack

| Layer / Concern | Technology | Purpose / Details |
| :--- | :--- | :--- |
| **Large Language Model (LLM)**| Groq Cloud API (`llama-3.3-70b-versatile`) | High-speed generative AI coach, reflection analysis, daily timetable generator |
| **Classical Machine Learning** | Python 3 + `scikit-learn`, `pandas`, `joblib` | Logistic Regression model trained on habit consistency datasets (`model.pkl`) |
| **Inference Bridge** | Node.js `child_process.spawn` | Subprocess executing `predict.py` passing feature JSON vectors to scikit-learn |
| **Explainable AI (XAI)** | Custom rule & factor weighting engine | Emits deterministic confidence scores, contributing factor weights, and reasons |
| **Algorithmic Fallbacks** | Deterministic rule-based engines | Immediate fallback if Groq API or Python subprocess encounters timeout |

---

## 5. Development & Build Tools

- **Linter:** ESLint 9 (`eslint.config.js`) with React Hooks and React Refresh plugins
- **Development Server:** Vite dev server (port 5173), Express nodemon (port 5000/5099)
- **Deployment Platform:** Frontend on Vercel (`ai-habit-tracker-eb72.vercel.app`), Backend on Render (`ai-habit-tracker-n8w9.onrender.com`)
- **Version Control:** Git & GitHub monorepo structure

