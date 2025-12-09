import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "./api";

export default function ProtectedAdminRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const res = await api.get("/auth/me");

      if (res.data.isAdmin === true) {
        setAllowed(true);
      }
    } catch (err) {}

    setLoading(false);
  }

  if (loading) return <div>Checking admin access…</div>;
  if (!allowed) return <Navigate to="/404" replace />;

  return children;
}
