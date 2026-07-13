import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AppShellSkeleton } from "../components/Skeleton/Skeleton.jsx";

const ProfileRequiredRoute = () => {
  const { isProfileCompleted, loading } = useAuth();

  if (loading) {
    return <AppShellSkeleton />;
  }

  return isProfileCompleted ? (
    <Outlet />
  ) : (
    <Navigate to="/profile" replace state={{ forceComplete: true }} />
  );
};

export default ProfileRequiredRoute;
