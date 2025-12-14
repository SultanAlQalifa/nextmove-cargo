import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";
import {
  SubscriptionPlan,
  UserSubscription,
  CreatePlanData,
  UpdatePlanData,
} from "../types/subscription";
import { profileService } from "./profileService";
import {
  generateSubscriptionContract,
  generateSubscriptionInvoice,
} from "../utils/pdfGenerator";
import { emailService } from "./emailService";

export const subscriptionService = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase.from("subscription_plans").select("*").order("price"),
      );
      return (data || []).map(mapDbPlanToApp);
    } catch (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
  },

  getPlanById: async (id: string): Promise<SubscriptionPlan | undefined> => {
    try {
      const data = await fetchWithRetry<any>(() =>
        supabase.from("subscription_plans").select("*").eq("id", id).single(),
      );
      if (!data) return undefined;
      return mapDbPlanToApp(data);
    } catch (error) {
      console.error("Error fetching plan by ID:", error);
      return undefined;
    }
  },

  createPlan: async (data: CreatePlanData): Promise<SubscriptionPlan> => {
    const dbPlan = mapAppPlanToDb(data);
    try {
      const { data: newPlan, error } = await supabase
        .from("subscription_plans")
        .insert(dbPlan)
        .select()
        .single();

      if (error) throw error;
      return mapDbPlanToApp(newPlan);
    } catch (error) {
      console.error("Error creating plan:", error);
      throw error;
    }
  },

  updatePlan: async (
    id: string,
    data: UpdatePlanData,
  ): Promise<SubscriptionPlan> => {
    const dbUpdates = mapAppPlanToDb(data);
    try {
      const { data: updated, error } = await supabase
        .from("subscription_plans")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDbPlanToApp(updated);
    } catch (error) {
      console.error("Error updating plan:", error);
      throw error;
    }
  },

  deletePlan: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting plan:", error);
      throw error;
    }
  },

  getUserSubscription: async (
    userId: string,
  ): Promise<UserSubscription | null> => {
    try {
      // 1. Get subscription first (without join to avoid 406 errors)
      const subData = await fetchWithRetry<any>(() =>
        supabase
          .from("user_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .maybeSingle(),
      );

      if (!subData) return null;

      // 2. Get plan details if plan_id exists
      let planData = undefined;
      if (subData.plan_id) {
        const pData = await fetchWithRetry<any>(() =>
          supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", subData.plan_id)
            .single(),
        );

        if (pData) {
          planData = mapDbPlanToApp(pData);
        }
      }

      return {
        ...mapDbSubscriptionToApp(subData),
        plan: planData,
      };
    } catch (error) {
      console.error("Error fetching user subscription:", error);
      return null;
    }
  },

  getAllSubscriptions: async (): Promise<any[]> => {
    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase
          .from("user_subscriptions")
          .select(
            `
                        *,
                        user:profiles(full_name, email, company_name),
                        plan:subscription_plans(name, price, currency)
                    `,
          )
          .order("created_at", { ascending: false }),
      );

      return data || [];
    } catch (error) {
      console.error("Error fetching all subscriptions:", error);
      return [];
    }
  },

  subscribeToPlan: async (userId: string, planId: string): Promise<void> => {
    // 1. Get Plan
    const plan = await subscriptionService.getPlanById(planId);
    if (!plan) throw new Error("Plan not found");

    // 2. Get Profile
    const profile = await profileService.getProfile(userId);
    if (!profile) throw new Error("User profile not found");

    try {
      // 3. Create Subscription Record
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          start_date: new Date().toISOString(),
          end_date: calculateEndDate(plan.billing_cycle),
        });

      if (subError) throw subError;

      // 3.5 Update Profile Subscription Status
      // Use standard await here, retry handled by ensuring idempotent logic if we were to wrap,
      // but for simple update, standard try/catch is fine.
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("id", userId);

      if (profileUpdateError) {
        console.error(
          "Error updating profile subscription status:",
          profileUpdateError,
        );
      }

      // 3.6 Record Transaction
      const { error: txnError } = await supabase.from("transactions").insert({
        user_id: userId,
        amount: plan.price,
        currency: plan.currency,
        status: "completed",
        method: "wave", // Default to Wave as it's the primary method now, or 'card' if specified elsewhere
        reference: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        metadata: {
          type: "subscription",
          plan_id: planId,
          plan_name: plan.name,
        },
      });

      if (txnError) {
        console.error("Error recording subscription transaction:", txnError);
      }

      // 4. Generate Invoice and Send Email
      try {
        // Generate Invoice (Download in browser)
        generateSubscriptionInvoice({
          user: {
            company_name: profile.company_name,
            full_name: profile.full_name,
            email: profile.email,
            address: "Adresse non renseignée", // Should come from profile
            country: "Pays non renseigné",
          },
          plan: {
            name: plan.name,
            price: plan.price,
            currency: plan.currency,
            billing_cycle: plan.billing_cycle,
          },
        });

        // Send Confirmation Email
        await emailService.sendSubscriptionConfirmation(
          profile.email,
          profile.full_name || profile.company_name || "Client",
          plan.name,
          plan.price,
          plan.currency,
        );
      } catch (err) {
        console.error("Error generating invoice or sending email:", err);
        // Don't fail the subscription if PDF/Email fails
      }
    } catch (error) {
      console.error("Error subscribing to plan:", error);
      throw error;
    }
  },

  upgradeToForwarder: async (planId: string): Promise<void> => {
    try {
      // Call the RPC function to upgrade role securely with retry
      await fetchWithRetry(() =>
        supabase.rpc("upgrade_to_forwarder", {
          plan_id: planId,
        }),
      );

      // After successful role upgrade, create the subscription record
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await subscriptionService.subscribeToPlan(user.id, planId);
    } catch (error) {
      console.error("Error upgrading to forwarder:", error);
      throw new Error("Failed to upgrade account");
    }
  },
};

function mapDbPlanToApp(dbRecord: any): SubscriptionPlan {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description,
    price: dbRecord.price,
    currency: dbRecord.currency,
    billing_cycle: dbRecord.billing_cycle,
    features: dbRecord.features || [],
    is_active: dbRecord.is_active,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
  };
}

function mapAppPlanToDb(appPlan: any): any {
  const dbPlan: any = {};
  if (appPlan.name !== undefined) dbPlan.name = appPlan.name;
  if (appPlan.description !== undefined)
    dbPlan.description = appPlan.description;
  if (appPlan.price !== undefined) dbPlan.price = appPlan.price;
  if (appPlan.currency !== undefined) dbPlan.currency = appPlan.currency;
  if (appPlan.billing_cycle !== undefined)
    dbPlan.billing_cycle = appPlan.billing_cycle;
  if (appPlan.features !== undefined) dbPlan.features = appPlan.features;
  if (appPlan.is_active !== undefined) dbPlan.is_active = appPlan.is_active;
  return dbPlan;
}

function mapDbSubscriptionToApp(dbRecord: any): UserSubscription {
  return {
    id: dbRecord.id,
    user_id: dbRecord.user_id,
    plan_id: dbRecord.plan_id,
    status: dbRecord.status,
    start_date: dbRecord.start_date,
    end_date: dbRecord.end_date,
    auto_renew: dbRecord.auto_renew,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
    plan: dbRecord.plan ? mapDbPlanToApp(dbRecord.plan) : undefined,
  };
}

function calculateEndDate(
  billingCycle: "monthly" | "quarterly" | "biannual" | "yearly",
): string {
  const date = new Date();
  if (billingCycle === "monthly") {
    date.setMonth(date.getMonth() + 1);
  } else if (billingCycle === "quarterly") {
    date.setMonth(date.getMonth() + 3);
  } else if (billingCycle === "biannual") {
    date.setMonth(date.getMonth() + 6);
  } else if (billingCycle === "yearly") {
    date.setFullYear(date.getFullYear() + 1);
  }
  return date.toISOString();
}
