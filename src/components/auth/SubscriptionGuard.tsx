import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Loader2, AlertTriangle } from "lucide-react";

interface SubscriptionGuardProps {
    children: ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
    const { profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-gray-500 font-medium animate-pulse">Vérification de l'abonnement...</p>
                </div>
            </div>
        );
    }

    const isActive = profile?.subscription_status === "active";

    if (!isActive) {
        // Redirect to subscription page with a message
        return <Navigate to="/dashboard/forwarder/subscription" state={{ from: location, message: "Souscrivez un abonnement pour accéder à toutes les fonctionnalités" }} replace />;
    }

    return <>{children}</>;
}
