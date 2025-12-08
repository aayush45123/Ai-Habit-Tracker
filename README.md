# AI Habit Tracker — Full Stack Productivity & Habit-Building Platform

The **AI Habit Tracker** is a full-stack productivity platform designed to help users build habits, track progress, and stay consistent using daily tracking, streaks, and a guided **21-day challenge system**.

This project includes:
- A **React frontend**
- A **Node.js + Express backend**
- Secure authentication
- Habit creation & tracking
- 21-day challenge module
- Clean and scalable architecture

---

## ⭐ Features (Completed Till Now)

### ✅ User Authentication
- Login / Signup system
- Password hashing using bcrypt
- JWT-based authentication
- Retrieves user profile securely

### ✅ Habit Management
- Add new habits with:
  - Name  
  - Category  
  - Description  
  - Daily tracking time  
- Edit and delete habits
- Stores all habits per user

### ✅ Daily Habit Tracking
- Mark habits as **Completed** or **Missed**
- Daily streak calculation
- Resets tracking automatically each day
- Shows daily progress summary

### ✅ Dashboard Overview
- Total habits
- Completed habits today
- Pending habits
- Streaks
- Motivational message section

### ✅ 21-Day Challenge (New Feature)
A complete challenge flow:
- Dedicated challenge page
- Full description of the challenge
- "Start Challenge" button
- User must create **minimum 6 habits**
- Each habit must include a valid time
- Tracks progress for all 21 days
- Shows completed days and streak
- Challenge resets if the streak breaks (future upgrade)

### ✅ Responsive UI
- Clean UI layout
- Mobile & Desktop friendly

### ✅ Secure Environment Handling
- `.env` for client
- `.env` for server
- Both safely ignored through `.gitignore`

---

## 🔧 Tech Stack

### Frontend
- React
- React Router
- Axios
- Context API / Redux (based on your implementation)
- CSS / Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT for authentication
- Bcrypt for password hashing
- dotenv for environment variables

---

## 📂 Folder Structure

```
ai-habit-tracker/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── .env        (ignored)
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── package.json
│   ├── .env        (ignored)
│
├── .gitignore
├── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/aayush45123/Ai-Habit-Tracker.git
cd Ai-Habit-Tracker
```

---

## 2️⃣ Backend Setup (Server)

```bash
cd server
npm install
```

### Create `.env` inside `server/`
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

### Run Backend
```bash
npm start
```
or with nodemon:
```bash
npm run dev
```

---

## 3️⃣ Frontend Setup (Client)

```bash
cd ../client
npm install
```

### Create `.env` inside `client/`
```
VITE_API_URL=http://localhost:5000/api
```

### Start Frontend
```bash
npm run dev
```

---

## 🔌 API Endpoints (Summary)

### Auth Routes
```
POST /api/auth/signup
POST /api/auth/login
GET  /api/auth/me
```

### Habit Routes
```
POST   /api/habits/create
GET    /api/habits/all
PATCH  /api/habits/update/:id
DELETE /api/habits/delete/:id
```

### Tracking Routes
```
POST /api/habits/mark-complete/:id
POST /api/habits/mark-missed/:id
```

### 21-Day Challenge Routes
```
POST /api/challenge/start
GET  /api/challenge/status
POST /api/challenge/update-day
```

---

## 🚀 Roadmap (Upcoming Features)

- AI habit suggestions
- AI motivational quote generator
- Weekly and monthly analytics
- Push notifications / reminders
- Calendar view tracking
- Mood logging system
- Export progress as PDF
- Social/Community Challenges
- UI animation improvements

---

## 🤝 Contributing

1. Fork the repository  
2. Create a new branch  
3. Commit your changes  
4. Open a pull request  

---

## 🛡️ Security Notes

- `.env` files are **never** committed  
- API keys and secrets must remain private  
- Review `.gitignore` before pushing  

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 🎯 Final Notes

The AI Habit Tracker is built to help users build discipline, track routines, and stay committed through a clean design and powerful features.  
Future updates will bring AI tools, analytics, and enhanced productivity systems.

