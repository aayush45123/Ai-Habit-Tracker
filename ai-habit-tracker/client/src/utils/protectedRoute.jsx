import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { AppShellSkeleton } from "../components/Skeleton/Skeleton.jsx";

function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) {
    return <AppShellSkeleton />;
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
