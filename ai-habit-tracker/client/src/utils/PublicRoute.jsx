import { Navigate } from "react-router-dom";

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  // If user is logged in, redirect to dashboard
  return token ? <Navigate to="/dashboard" replace /> : children;
}

export default PublicRoute;
