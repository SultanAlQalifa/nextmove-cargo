import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

type UserRole =
  | "client"
  | "forwarder"
  | "admin"
  | "super-admin"
  | "supplier"
  | "driver";

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Admins and super-admins can access all routes
    if (profile.role === "admin" || profile.role === "super-admin") {
      return <Outlet />;
    }

    // Redirect to appropriate dashboard based on role
    if (profile.role === "forwarder")
      return <Navigate to="/dashboard/forwarder" replace />;
    if (profile.role === "driver")
      return <Navigate to="/dashboard/driver" replace />;
    return <Navigate to="/dashboard/client" replace />;
  }

  return <Outlet />;
}
