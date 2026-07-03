<div align="center">

# AI Habit Tracker

A full-stack, AI-powered habit tracking platform built with the MERN stack, a Python machine learning model, and the Groq LLM API. Designed to help users build consistency through explainable AI insights, structured challenges, and detailed analytics.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Python](https://img.shields.io/badge/Python-scikit--learn-3776AB?logo=python&logoColor=white)](https://scikit-learn.org/)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-orange)](https://groq.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](#license)

[Live Application](https://ai-habit-tracker-eb72.vercel.app) &nbsp;·&nbsp; [Report an Issue](../../issues) &nbsp;·&nbsp; [Request a Feature](../../issues)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Screenshots](#screenshots)
3. [Features](#features)
4. [Architecture](#architecture)
5. [AI and Machine Learning](#ai-and-machine-learning)
6. [Technology Stack](#technology-stack)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [API Overview](#api-overview)
11. [Deployment](#deployment)
12. [Technical Highlights](#technical-highlights)
13. [Roadmap](#roadmap)
14. [Contributing](#contributing)
15. [License](#license)
16. [Author](#author)

---

## Overview

AI Habit Tracker is a production-grade habit tracking application that goes beyond simple check-boxes. It combines a React frontend, a Node.js/Express backend, MongoDB for persistence, a Python machine learning model for risk prediction, and the Groq Llama 3.3 API for generating natural-language insights.

A core design principle of the project is **explainability**: rather than only surfacing conclusions such as risk levels or recommendations, the application also exposes the underlying reasoning, contributing factors, and confidence levels behind each AI-driven insight.

The interface follows a distinctive brutalist design language, characterized by heavy borders, solid box shadows, and uppercase typography, applied consistently across every screen.

---

## Screenshots

| Dashboard | 
| ![Dashboard](./ai-habit-tracker/client/src/assets/dashboard.png) |

| Analytics | AI Insights |
|---|---|
| ![Analytics](./ai-habit-tracker/client/src/assets/analytics.png) | ![AI Insights](./ai-habit-tracker/client/src/assets/ai_insights.png) |

| 21-Day Challenge | Challenge Heatmap |
|---|---|
| ![Challenge](./ai-habit-tracker/client/src/assets/21.png) | ![Heatmap](./ai-habit-tracker/client/src/assets/heatmap.png) |

| Pomodoro / Focus Mode | Habit Templates |
|---|---|
| ![Pomodoro](./ai-habit-tracker/client/src/assets/pomodoro.png) | ![Templates](./ai-habit-tracker/client/src/assets/templates.png) |

| Calorie Tracker | Workout Timetable |
|---|---|
| ![Calorie Tracker](./ai-habit-tracker/client/src/assets/calorie.png) | ![Timetable](./ai-habit-tracker/client/src/assets/workout.png) |

---

## Features

### AI Powered

- AI-generated habit recommendations with explainable reasoning
- Groq Llama 3.3 powered daily and weekly insights
- Random Forest based risk prediction engine
- Factor-weighted explainability panel (reasons, confidence, trend, contributing data points)
- AI-assisted workout and habit timetable generation

### Analytics

- Weekly and monthly progress summaries
- Completion rate charts and trend lines
- Habit-specific streak tracking
- Calendar and heatmap visualizations
- Comparative analytics across habit categories

### Productivity

- Pomodoro-based focus sessions
- 21-Day Habit Challenge system with full history tracking
- Ability to restart a challenge with the same habits
- Ability to start a new challenge with a fresh set of habits, archiving the previous one
- Pre-built habit templates for quick setup

### Health Tracking

- Calorie tracking
- Water intake logging
- Protein and macro goal tracking
- Workout planning and scheduling

### Security

- JWT-based authentication
- Protected API routes with middleware
- Password hashing
- MongoDB Atlas with restricted network access

---

## Architecture

```
                  React (Vite) Frontend
                          │
                          ▼
                 Express REST API (Node.js)
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
        MongoDB Atlas   Python ML     Groq API
        (Persistence)   (Random       (Llama 3.3
                         Forest)      Insights)
```

- The React frontend communicates with the Express backend exclusively through a versioned REST API.
- The backend delegates risk prediction to a Python service running a trained Random Forest classifier.
- The backend delegates natural-language insight generation to the Groq API, using structured prompts that return explainability metadata alongside the generated text.
- MongoDB Atlas stores users, habits, challenge data, logs, and historical analytics.

---

## AI and Machine Learning

### Risk Prediction Engine

- **Language:** Python
- **Library:** scikit-learn
- **Model:** RandomForestClassifier
- **Serialization:** joblib
- **Serving:** Exposed to the Node.js backend as an internal service

The model is trained on historical habit completion data and outputs a risk classification along with feature importances, which the backend maps into human-readable `reasons[]` and `factorWeights[]` for the explainable AI panel in the UI.

### Insight Generation

- **Provider:** Groq
- **Model:** Llama 3.3
- **Purpose:** Converts structured habit and risk data into natural-language daily briefs, recommendations, and action suggestions

Every AI response returned to the frontend includes an `explainability` object containing the reasoning path, confidence score, and the specific data points that influenced the output, rather than a single opaque conclusion.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, CSS Modules |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| Machine Learning | Python, scikit-learn, Random Forest |
| Generative AI | Groq API, Llama 3.3 |
| Charts | Chart.js / Recharts |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## Project Structure

```
Ai-Habit-Tracker
└── ai-habit-tracker
    ├── client
    │   └── src
    │       ├── assets
    │       ├── components
    │       │   ├── ChallengeHeatMap
    │       │   ├── ChallengeTrend
    │       │   └── RiskAlerts
    │       ├── pages
    │       │   ├── Dashboard
    │       │   ├── ChallengePage
    │       │   ├── Analytics
    │       │   ├── AIInsights
    │       │   ├── FocusMode
    │       │   ├── HabitTemplates
    │       │   └── CalorieTracker
    │       └── utils
    ├── server
    │   ├── src
    │   │   ├── controllers
    │   │   │   ├── habitController.js
    │   │   │   ├── challengeController.js
    │   │   │   ├── riskAnalysisController.js
    │   │   │   ├── recommendationController.js
    │   │   │   └── aiController.js
    │   │   ├── models
    │   │   │   ├── Challenge.js
    │   │   │   ├── ChallengeLog.js
    │   │   │   └── User.js
    │   │   ├── routes
    │   │   ├── middleware
    │   │   └── utils
    │   └── ml
    │       ├── model.pkl
    │       └── train.py
    └── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 22 or later
- npm
- MongoDB Atlas account (or local MongoDB instance)
- Python 3.10 or later (for the ML service, if run locally)

### 1. Clone the repository

```bash
git clone https://github.com/aayush45123/Ai-Habit-Tracker.git
cd Ai-Habit-Tracker/ai-habit-tracker
```

### 2. Backend setup

```bash
cd server
npm install
npm start
```

The backend runs by default at `http://localhost:10000`.

### 3. Frontend setup

```bash
cd ../client
npm install
npm run dev
```

The frontend runs by default at `http://localhost:5173`.

---

## Environment Variables

### Backend (`server/.env`)

```
PORT=10000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
```

### Frontend (`client/.env`)

```
VITE_API_BASE_URL=https://ai-habit-tracker-n8w9.onrender.com
```

---

## API Overview

All endpoints are prefixed with `/api` and require a valid JWT unless otherwise noted.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Authenticate and receive a JWT |

### Habits

| Method | Endpoint | Description |
|---|---|---|
| GET | `/habits` | List all habits for the authenticated user |
| POST | `/habits` | Create a new habit |
| PUT | `/habits/:id` | Update an existing habit |
| DELETE | `/habits/:id` | Delete a habit |

### 21-Day Challenge

| Method | Endpoint | Description |
|---|---|---|
| POST | `/challenge/start` | Start a new 21-day challenge |
| POST | `/challenge/restart` | Archive the current challenge and start a new one |
| GET | `/challenge/current` | Get the active challenge and day-by-day status |
| PUT | `/challenge/update/:id` | Update habits on the active challenge |
| POST | `/challenge/done/:id/:index` | Mark a habit as completed for the current day |
| GET | `/challenge/heatmap` | Get heatmap data for the most recent challenge |
| GET | `/challenge/history` | Get a summary of all past challenges |
| DELETE | `/challenge/:id` | Delete a completed challenge |

### AI and Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/ai/risk-analysis` | Get risk predictions with explainability data |
| GET | `/ai/recommendations` | Get AI-generated habit recommendations |
| GET | `/ai/daily-brief` | Get an AI-generated daily summary |
| GET | `/analytics/summary` | Get aggregated analytics for the dashboard |

---

## Deployment

### Frontend (Vercel)

- Root Directory: `ai-habit-tracker/client`
- Build Command: `npm run build`
- Output Directory: `dist`

### Backend (Render)

- Root Directory: `ai-habit-tracker/server`
- Build Command: `npm install`
- Start Command: `npm start`

### Notes

- CORS is configured to allow `localhost` during development and all Vercel deployment URLs in production
- Environment variables are managed separately per environment and are never committed to the repository
- The frontend build is optimized through Vite for production
- The stack is compatible with Node.js 22

---

## Technical Highlights

- Explainable AI layer that surfaces `reasons[]`, `factorWeights[]`, `confidence`, and `actionSuggestion` alongside every prediction and recommendation, rather than a single opaque output
- Custom-built collapsible XAI panel with animated factor progress bars and filterable views
- Midnight-spanning time window logic for accurately tracking habits scheduled across day boundaries
- Consistent brutalist design system applied across all pages and components
- Modular controller structure separating risk analysis, recommendations, and general AI insight generation

---

## Roadmap

- Habit Health Score combining multiple signals into a single trackable metric
- AI-generated Daily Brief delivered each morning
- Automated weekly AI-generated PDF reports
- Smart trend analytics with anomaly detection
- Automated model retraining pipeline
- Dedicated ML dashboard for monitoring model performance
- Model versioning and rollback support
- Push notifications and reminders
- Data export functionality
- Custom domain support

---

## Contributing

Contributions, issues, and feature requests are welcome. Please open an issue to discuss significant changes before submitting a pull request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to the branch
5. Open a pull request

---

## License

This project is licensed under the MIT License.

---

## Author

**Aayush**
AI and Data Science Student, Full-Stack Developer

[GitHub](https://github.com/aayush45123) &nbsp;·&nbsp; [LinkedIn](https://www.linkedin.com/)

If this project was useful to you, consider starring the repository.
