import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const ProfileRequiredRoute = () => {
  const { isProfileCompleted, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <div
          style={{
            padding: "2rem",
            border: "3px solid var(--color-border)",
            fontWeight: "bold",
            fontSize: "1.2rem",
            fontFamily: "var(--font-primary)",
            textTransform: "uppercase",
            boxShadow: "6px 6px 0 0 var(--color-border)",
          }}
        >
          Loading Profile Status...
        </div>
      </div>
    );
  }

  return isProfileCompleted ? (
    <Outlet />
  ) : (
    <Navigate to="/profile" replace state={{ forceComplete: true }} />
  );
};

export default ProfileRequiredRoute;
