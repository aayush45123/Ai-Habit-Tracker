// client/src/context/GamificationContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../utils/api";
import { useAuth } from "./AuthContext";
import { onSocketEvent, offSocketEvent } from "../services/socket.service";

const GamificationContext = createContext(null);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within a GamificationProvider");
  }
  return context;
};

export const GamificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [xpToast, setXpToast] = useState(null);
  const [achievementModal, setAchievementModal] = useState(null);

  const fetchOverview = useCallback(async () => {
    if (!token || !user) return;
    try {
      setLoading(true);
      const res = await api.get("/gamification/overview");
      if (res.data?.success) {
        setOverview(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load gamification overview:", err);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (token && user) {
      fetchOverview();
    } else {
      setOverview(null);
    }
  }, [token, user, fetchOverview]);

  // Listen for socket events to update gamification state in real time
  useEffect(() => {
    if (!token || !user) return;

    const handleNotification = (notif) => {
      if (notif.type === "achievement_unlocked" && notif.data?.achievement) {
        setAchievementModal(notif.data.achievement);
        fetchOverview();
      } else if (notif.type === "milestone" || notif.type === "challenge_completed") {
        fetchOverview();
      }
    };

    const handleDashboardUpdate = (data) => {
      if (data.type === "habit:logged") {
        // Refresh overview when habit logged to show latest XP & streak
        fetchOverview();
      }
    };

    onSocketEvent("notification:new", handleNotification);
    onSocketEvent("dashboard:update", handleDashboardUpdate);

    return () => {
      offSocketEvent("notification:new", handleNotification);
      offSocketEvent("dashboard:update", handleDashboardUpdate);
    };
  }, [token, user, fetchOverview]);

  const redeem = async (rewardKey) => {
    try {
      const res = await api.post(`/gamification/rewards/${rewardKey}/redeem`);
      if (res.data?.success) {
        await fetchOverview();
        return { success: true, message: res.data.message || "Reward redeemed!" };
      }
      return { success: false, message: res.data?.message || "Failed to redeem" };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to redeem reward";
      return { success: false, message: msg };
    }
  };

  const join = async (challengeId) => {
    try {
      const res = await api.post(`/gamification/challenges/${challengeId}/join`);
      if (res.data?.success) {
        await fetchOverview();
        return { success: true };
      }
      return { success: false, message: res.data?.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  const generateAI = async () => {
    try {
      const res = await api.post("/gamification/challenges/ai-generate");
      if (res.data?.success) {
        await fetchOverview();
        return { success: true, challenges: res.data.data };
      }
      return { success: false, message: res.data?.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  return (
    <GamificationContext.Provider
      value={{
        overview,
        loading,
        refreshOverview: fetchOverview,
        redeemReward: redeem,
        joinChallenge: join,
        generateAIChallenges: generateAI,
        xpToast,
        setXpToast,
        achievementModal,
        closeAchievementModal: () => setAchievementModal(null),
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};
