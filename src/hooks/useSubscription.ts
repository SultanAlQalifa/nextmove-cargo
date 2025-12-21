import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscriptionService } from "../services/subscriptionService";
import { UserSubscription } from "../types/subscription";

export const useSubscription = () => {
    const { user, loading: authLoading } = useAuth();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const sub = await subscriptionService.getUserSubscription(user.id);
                setSubscription(sub);
            } catch (error) {
                console.error("Error loading subscription:", error);
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchSubscription();
        }
    }, [user, authLoading]);

    const hasFeature = (featureKey: string): boolean => {
        if (!subscription || !subscription.plan) return false;

        const features = subscription.plan.features;
        if (Array.isArray(features)) {
            // Check if feature ID exists and is included
            return (features as any[]).some(f =>
                (typeof f === 'string' ? f === featureKey : f.id === featureKey && f.included)
            );
        }

        return false;
    };

    const isStarter = subscription?.plan?.name?.toLowerCase().includes("starter");
    const isPro = subscription?.plan?.name?.toLowerCase().includes("pro");
    const isElite = subscription?.plan?.name?.toLowerCase().includes("elite") || subscription?.plan?.name?.toLowerCase().includes("enterprise");

    // Derived features from prompt rules
    const groupageEnabled = true; // Enabled for all plans (Starter, Pro, Elite)
    const groupageLimit = isStarter ? 1 : Infinity;
    const apiAccess = isElite;
    const discountPercentage = isElite ? 10 : (isPro ? 5 : 0);
    const rfqsUnlimited = !isStarter;

    return {
        subscription,
        loading: loading || authLoading,
        plan: subscription?.plan,
        checkFeature: hasFeature,
        // Helper flags based on plan name (more robust than feature string parsing for now)
        isStarter,
        isPro,
        isElite,
        features: {
            groupageEnabled,
            groupageLimit,
            apiAccess,
            discountPercentage,
            rfqsUnlimited
        }
    };
};
