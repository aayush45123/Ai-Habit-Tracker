import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const loadUserAndProfile = async (authToken) => {
    try {
      setLoading(true);
      // Fetch current user details
      const userRes = await api.get("/auth/me");
      setUser(userRes.data);

      // Fetch user profile details
      try {
        const profileRes = await api.get("/profile");
        setProfile(profileRes.data);
      } catch (profileErr) {
        // If profile is not found (404), it means profile is incomplete
        if (profileErr.response?.status === 404) {
          setProfile(null);
        } else {
          console.error("Error loading user profile:", profileErr);
        }
      }
    } catch (err) {
      console.error("Authentication error loading user:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUserAndProfile(token);
    } else {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  }, [token]);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const userRes = await api.get("/auth/me");
      setUser(userRes.data);
    } catch (err) {
      console.error("Error refreshing user details:", err);
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profileRes = await api.get("/profile");
      setProfile(profileRes.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setProfile(null);
      } else {
        console.error("Error refreshing profile:", err);
      }
    }
  };

  // Profile is complete if it exists and has all required fields populated
  const isProfileCompleted = !!(
    profile &&
    profile.age &&
    profile.height &&
    profile.weight &&
    profile.gender &&
    profile.activityLevel &&
    profile.goal
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        profile,
        loading,
        isProfileCompleted,
        login,
        logout,
        refreshUser,
        refreshProfile,
        setUser,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
