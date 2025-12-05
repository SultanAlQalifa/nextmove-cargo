export type BillingCycle = 'monthly' | 'quarterly' | 'biannual' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'past_due';

export interface SubscriptionFeature {
    id: string;
    name: string;
    type: 'boolean' | 'limit';
    value: string | number | boolean;
    included: boolean;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    billing_cycle: BillingCycle;
    features: SubscriptionFeature[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserSubscription {
    id: string;
    user_id: string;
    plan_id: string;
    status: SubscriptionStatus;
    start_date: string;
    end_date: string;
    auto_renew: boolean;
    created_at: string;
    updated_at: string;
    plan?: SubscriptionPlan; // Joined data
}

export interface CreatePlanData {
    name: string;
    description: string;
    price: number;
    currency: string;
    billing_cycle: BillingCycle;
    features: SubscriptionFeature[];
}

export interface UpdatePlanData extends Partial<CreatePlanData> {
    is_active?: boolean;
}
