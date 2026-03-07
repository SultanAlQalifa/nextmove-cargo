import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { subscriptionService } from "../../services/subscriptionService";
import { UserSubscription } from "../../types/subscription";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
    children: ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
    const { profile, user, loading } = useAuth();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        const checkSubscription = async () => {
            if (!user || loading) return;

            // Check profile-level status first
            if (profile?.subscription_status !== "active") {
                setIsValid(false);
                setChecking(false);
                return;
            }

            // Double-check with actual subscription data (verify end_date)
            try {
                const sub: UserSubscription | null = await subscriptionService.getUserSubscription(user.id);
                if (!sub || sub.status !== "active") {
                    setIsValid(false);
                    setChecking(false);
                    return;
                }

                // Check if subscription has expired by date
                const endDate = new Date(sub.end_date);
                const now = new Date();
                if (endDate < now) {
                    setIsValid(false);
                    setChecking(false);
                    return;
                }

                setIsValid(true);
            } catch {
                // If we can't check, fall back to profile status
                setIsValid(profile?.subscription_status === "active");
            } finally {
                setChecking(false);
            }
        };

        checkSubscription();
    }, [user, profile, loading]);

    if (loading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center space-y-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Vérification de l'abonnement...</p>
                </div>
            </div>
        );
    }

    if (!isValid) {
        return <Navigate to="/dashboard/forwarder/subscription" state={{ from: location, message: "Votre abonnement a expiré ou n'est pas actif. Veuillez renouveler pour continuer." }} replace />;
    }

    return <>{children}</>;
}
