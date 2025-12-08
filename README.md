AI Habit Tracker — Full Stack Productivity & Habit-Building Platform

The AI Habit Tracker is a full-stack productivity platform designed to help users build habits, track progress, stay consistent with a 21-day challenge system, and improve life through structured routines and intelligent AI assistance.
This project includes:

A React-based client

A Node.js + Express backend

Habit creation, daily tracking, reminders

A dedicated 21-Day Challenge module

Authentication, persistence, and daily progress logging

The goal is to help users stay accountable, build discipline, and track daily actions using a simple and elegant UI.

⭐ Features (Completed Till Now)
✅ 1. User Authentication (Login / Signup)

Users can create an account

Secure password handling (hashed)

Stores user profile and habit details separately

✅ 2. Habit Creation Module

Users can create habits with:

Habit name

Category (Health, Study, Fitness, Sleep, etc.)

Daily time or reminder time

Description (optional)

✅ 3. Daily Habit Tracking

For each habit:

Mark as Completed / Missed

Track streaks

Auto reset next day

Shows progress percentage

✅ 4. Dashboard Overview

Total habits

Completed habits today

Pending habits

Habit streaks

Motivational AI messages (optional)

✅ 5. 21-Day Challenge System (New Feature)

A dedicated page for challenge lovers:

Includes:

Description of the challenge

Rules & purpose

A “Start Challenge” button

User must create minimum 6 habits before starting

Each habit must have a proper time

Tracks daily progress for 21 days

Shows how many days completed

Shows if the streak breaks

Challenge resets if missed too many days (future update)

✅ 6. Responsive UI

Clean minimal design

Light/Dark ready (depending on your styling choices)

✅ 7. Secure Environment Handling

Frontend .env → REACT_APP API key storage

Backend .env → MongoDB URL, JWT secret

Both are ignored via .gitignore

🔧 Tech Stack
Frontend

React (Vite or CRA depending on your setup)

React Router

Context API / Redux (choose based on your existing code)

Axios

CSS / Tailwind (depends on your implementation)

Backend

Node.js

Express.js

MongoDB + Mongoose

JWT Authentication

Bcrypt

dotenv

Other Tools

Git & GitHub

Postman / Thunder Client for API testing

📂 Folder Structure
ai-habit-tracker/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env        (ignored)
│
├── server/
│   ├── src/ or controllers/ models/ routes/
│   ├── package.json
│   ├── .env        (ignored)
│
├── .gitignore
├── README.md

⚙️ Installation & Running Locally
1. Clone the repository
git clone https://github.com/aayush45123/Ai-Habit-Tracker.git
cd Ai-Habit-Tracker

2. Setup the Backend (Server)
cd server
npm install

Create a .env file inside server:
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

Run the server:
npm start


OR if using nodemon:

npm run dev

3. Setup the Frontend (Client)
cd ../client
npm install

Create a .env inside client
VITE_API_URL=http://localhost:5000/api

Start the React app
npm run dev

🔌 API Endpoints Overview
Authentication
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me

Habits
POST   /api/habits/create
GET    /api/habits/all
PATCH  /api/habits/update/:id
DELETE /api/habits/delete/:id

Daily Tracking
POST  /api/habits/mark-complete/:id
POST  /api/habits/mark-missed/:id

21 Day Challenge
POST /api/challenge/start
GET  /api/challenge/status
POST /api/challenge/update-day

🚀 Roadmap (What Will Be Added in Future)
🟦 Planned Features

Smart AI habit suggestions

AI motivational quotes generator

Weekly & monthly analytics page

Habit failure prediction model

Push notifications & reminders

Mood tracking

Calendar view

Export progress as PDF

Leaderboard / Community challenges

UI makeover with animations

🤝 Contributing

If you want to contribute:

Fork the repo

Create a new branch

Commit your changes

Make a pull request

🛡️ Environment & Security Notes

Never upload .env files

Always review .gitignore before commits

Tokens, secrets, API keys must remain private

Use separate production credentials later

📜 License

This project is open-source under the MIT License.

🎯 Final Notes

The AI Habit Tracker is designed to solve real-life problems:

✔ Building discipline
✔ Staying consistent
✔ Tracking daily actions
✔ Challenging yourself for 21 days
✔ Improving health, fitness, and productivity

You can keep expanding this project into a full personal productivity suite.
