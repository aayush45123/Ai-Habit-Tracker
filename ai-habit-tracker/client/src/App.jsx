import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";
import "./App.css";

// ─── PageLoader (tiny, loads immediately) ───────────────────────────────────
import PageLoader from "./components/common/PageLoader/PageLoader";

// ─── Eager (public, tiny) ────────────────────────────────────────────────────
import Landing from "./pages/Landing/Landing";
import Login from "./pages/Auth/Login/Login";
import Signup from "./pages/Auth/Signup/Signup";
import VerifyEmail from "./pages/Auth/VerifyEmail/VerifyEmail";

// ─── Lazy (all authenticated / heavy pages) ─────────────────────────────────
const Dashboard      = lazy(() => import("./pages/Dashboard/Dashboard"));
const AddHabit       = lazy(() => import("./pages/AddHabit/AddHabit"));
const HabitDetail    = lazy(() => import("./pages/HabitDetail/HabitDetail"));
const AnalyticsPage  = lazy(() => import("./pages/Analytics/AnalyticsPage"));
const AIChat         = lazy(() => import("./pages/AIChat/AIChat"));
const ChallengePage  = lazy(() => import("./pages/Challenge/ChallengePage"));
const HabitTemplates = lazy(() => import("./pages/HabitTemplates/HabitTemplates"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const Pomodoro       = lazy(() => import("./pages/Focus/Pomodoro"));
const About          = lazy(() => import("./pages/About/About"));
const Calories       = lazy(() => import("./pages/Calories/Calories"));
const TimetablePage  = lazy(() => import("./pages/Timetable/TimetablePage"));
const Profile        = lazy(() => import("./pages/Profile/Profile"));
const Reports        = lazy(() => import("./pages/Reports/Reports"));
const JournalPage    = lazy(() => import("./pages/Journal/JournalPage"));

// ─── Layout / Guards (small, loaded with shell) ──────────────────────────────
import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./utils/protectedRoute";
import PublicRoute from "./utils/PublicRoute";
import ProtectedAdminRoute from "./utils/ProtectedAdminRoute";
import ProfileRequiredRoute from "./utils/ProfileRequiredRoute";

function App() {
  return (
    <>
      <Analytics />
      <SpeedInsights />

      <Suspense fallback={<PageLoader />}>
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
          <Route
            path="/verify-email"
            element={
              <PublicRoute>
                <VerifyEmail />
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
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/ai" element={<AIChat />} />
                <Route path="/challenge" element={<ChallengePage />} />
                <Route path="/templates" element={<HabitTemplates />} />
                <Route path="/journal" element={<JournalPage />} />
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
      </Suspense>
    </>
  );
}

export default App;
