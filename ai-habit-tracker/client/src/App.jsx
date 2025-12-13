import { Routes, Route } from "react-router-dom";
import "./App.css";

import Login from "./pages/Auth/Login/Login";
import Signup from "./pages/Auth/Signup/Signup";

import Dashboard from "./pages/Dashboard/Dashboard";
import AddHabit from "./pages/AddHabit/AddHabit";
import HabitDetail from "./pages/HabitDetail/HabitDetail";
import Analytics from "./pages/Analytics/Analytics";
import AIChat from "./pages/AIChat/AIChat";

import MainLayout from "./layout/MainLayout";
import ProtectedRoute from "./utils/protectedRoute";
import ProtectedAdminRoute from "./utils/ProtectedAdminRoute";

import ChallengePage from "./pages/Challenge/ChallengePage";
import HabitTemplates from "./pages/HabitTemplates/HabitTemplates";
import AdminTemplates from "./pages/admin/AdminTemplates";
import Pomodoro from "./pages/Focus/Pomodoro";
import About from "./pages/About/About";

function App() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddHabit />} />
          <Route path="/habit/:id" element={<HabitDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai" element={<AIChat />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/templates" element={<HabitTemplates />} />
          <Route path="/focus" element={<Pomodoro />} />
          <Route path="/about" element={<About />} />

          {/* ADMIN ONLY (Hidden from sidebar) */}
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
    </Routes>
  );
}

export default App;
