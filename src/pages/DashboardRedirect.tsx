import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardRedirect() {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile) {
      // Redirect based on user role
      switch (profile.role) {
        case "client":
          navigate("/dashboard/client", { replace: true });
          break;
        case "forwarder":
          navigate("/dashboard/forwarder", { replace: true });
          break;
        case "admin":
        case "super-admin":
          navigate("/dashboard/admin", { replace: true });
          break;
        case "driver":
          navigate("/dashboard/driver", { replace: true });
          break;
        case "supplier":
          navigate("/dashboard/client", { replace: true }); // Suppliers use client dashboard for now
          break;
        default:
          navigate("/dashboard/client", { replace: true });
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return null;
}
