import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { isAdmin, Role } from "../utils/authUtils";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: Role[];
  requireActive?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requireActive = true
}: ProtectedRouteProps) {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If profile is not loaded yet but user exists, we might need to wait or it means error.
  // Assuming loading covers profile fetch. If profile is null here, it's an issue.
  if (!profile) {
    return <Navigate to="/login" replace />; // Fail safe
  }

  // Check Account Status
  if (requireActive && profile.account_status !== 'active') {
    // Status check logic
    if (profile.account_status === 'pending_approval') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-950">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </div>
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">Compte en attente</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Votre demande est en cours d'examen par nos équipes.
              Vous recevrez un email dès que votre compte sera validé.
            </p>
            <button
              onClick={() => signOut()}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      );
    }

    if (profile.account_status === 'suspended') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-950">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-800">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Compte suspendu</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Votre accès a été suspendu pour non-respect des conditions d'utilisation.
              Veuillez contacter le support.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:support@nextmovecargo.com"
                className="block px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors w-full"
              >
                Contacter le support
              </a>
              <button
                onClick={() => signOut()}
                className="block px-6 py-3 bg-transparent text-slate-500 font-bold hover:text-slate-700 transition-colors w-full"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role as any)) {
    // Admins and super-admins can access all routes
    if (isAdmin(profile.role)) {
      return children ? <>{children}</> : <Outlet />;
    }

    // Unauthorized View
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-gray-950">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-slate-100 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Accès non autorisé</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Vous n'avez pas les permissions pour accéder à cette section.
          </p>
          <Navigate to={
            profile.role === 'forwarder' ? '/dashboard/forwarder' :
              profile.role === 'driver' ? '/dashboard/driver' :
                '/dashboard/client'
          } replace />
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
}
