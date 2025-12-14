import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscriptionService } from "../services/subscriptionService";
import { UserSubscription } from "../types/subscription";

export const useSubscription = () => {
    const { user, profile, loading: authLoading } = useAuth();
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

        // Handle case where features is array of strings (simple) or JSON object (advanced)
        // Current implementation in subscriptionFeatures.ts implies mapping but DB might store strings
        // Let's assume features is an array of strings for simple keys from features list

        // Safely check if features is array
        const features = subscription.plan.features;
        if (Array.isArray(features)) {
            // Basic Check: exact match
            if (features.includes(featureKey)) return true;

            // Advanced Check: implicit inclusion? (e.g. Pro has all Starter)
            // Better to rely on the explicit list in the DB plan.
            return false;
        }

        return false;
    };

    const getFeatureLimit = (featureKey: string): number => {
        // Placeholder for limits if stored in features JSON
        // For now, hardcode based on plan name if needed, or rely on logic
        // Section 7 prompt implies 3 RFQ for Starter, Unlimited for Pro.
        return 0;
    };

    const isStarter = subscription?.plan?.name?.toLowerCase().includes("starter");
    const isPro = subscription?.plan?.name?.toLowerCase().includes("pro");
    const isElite = subscription?.plan?.name?.toLowerCase().includes("elite") || subscription?.plan?.name?.toLowerCase().includes("enterprise");

    // Derived features from prompt rules
    const groupageEnabled = isPro || isElite;
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
            apiAccess,
            discountPercentage,
            rfqsUnlimited
        }
    };
};
