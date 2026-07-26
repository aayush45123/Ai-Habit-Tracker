import { Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";

import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login/Login";
import Signup from "./pages/Auth/Signup/Signup";

import Dashboard from "./pages/Dashboard/Dashboard";
import AddHabit from "./pages/AddHabit/AddHabit";
import HabitDetail from "./pages/HabitDetail/HabitDetail";
import Analytics from "./pages/Analytics/Analytics";
import AIChat from "./pages/AIChat/AIChat";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./utils/protectedRoute";
import PublicRoute from "./utils/PublicRoute"; // NEW
import ProtectedAdminRoute from "./utils/ProtectedAdminRoute";
import ProfileRequiredRoute from "./utils/ProfileRequiredRoute";

import ChallengePage from "./pages/Challenge/ChallengePage";
import HabitTemplates from "./pages/HabitTemplates/HabitTemplates";
import AdminTemplates from "./pages/admin/AdminTemplates";
import Pomodoro from "./pages/Focus/Pomodoro";
import About from "./pages/About/About";
import Calories from "./pages/Calories/Calories";
import TimetablePage from "./pages/Timetable/TimetablePage";
import Profile from "./pages/Profile/Profile";
import Reports from "./pages/Reports/Reports";

function App() {
  return (
    <>
      <Analytics />
      <SpeedInsights />

      <Routes>
        {/* Public Routes - Redirect to dashboard if logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Landing />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />

        {/* Protected Routes - Require authentication */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Directly accessible protected routes (no profile gate required) */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/about" element={<About />} />

            {/* Locked routes - Require profile completion */}
            <Route element={<ProfileRequiredRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add" element={<AddHabit />} />
              <Route path="/habit/:id" element={<HabitDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/ai" element={<AIChat />} />
              <Route path="/challenge" element={<ChallengePage />} />
              <Route path="/templates" element={<HabitTemplates />} />
              <Route path="/focus" element={<Pomodoro />} />
              <Route path="/calories" element={<Calories />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/dashboard/reports" element={<Reports />} />

              {/* ADMIN ONLY */}
              <Route
                path="/admin/templates"
                element={
                  <ProtectedAdminRoute>
                    <AdminTemplates />
                  </ProtectedAdminRoute>
                }
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
