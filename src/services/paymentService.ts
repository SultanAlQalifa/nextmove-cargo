import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: "paid" | "unpaid" | "overdue";
  due_date: string;
  issue_date: string;
  items: {
    description: string;
    amount: number;
  }[];
  shipment_ref?: string;
}

export interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  currency: string;
  method: "bank_transfer" | "card" | "mobile_money";
  status: "completed" | "pending" | "failed";
  reference: string;
  invoice_number?: string;
}

export const paymentService = {
  getClientInvoices: async (): Promise<Invoice[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const data = await fetchWithRetry<Invoice[]>(() =>
        supabase
          .from("invoices")
          .select("*")
          .eq("user_id", user.id)
          .order("issue_date", { ascending: false }),
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return [];
    }
  },

  getClientTransactions: async (): Promise<Transaction[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const data = await fetchWithRetry<Transaction[]>(() =>
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  },

  getWallet: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", user.id)
      .single();

    if (error) throw error;
    return data;
  },

  getForwarderTransactions: async (): Promise<Transaction[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      const data = await fetchWithRetry<Transaction[]>(() =>
        supabase
          .from("transactions")
          .select(
            `
                        *,
                        shipment:shipments!inner(forwarder_id)
                    `,
          )
          .eq("shipment.forwarder_id", user.id)
          .order("created_at", { ascending: false }),
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching forwarder transactions:", error);
      return [];
    }
  },

  getAllTransactions: async (): Promise<any[]> => {
    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase
          .from("transactions")
          .select(
            `
                        *,
                        user:profiles(full_name, email, company_name)
                    `,
          )
          .order("created_at", { ascending: false }),
      );
      return data || [];
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      return [];
    }
  },

  getInvoicePdfUrl: async (invoiceId: string): Promise<string> => {
    // Mock PDF generation/retrieval
    return "#";
  },

  // validateCoupon removed - Use couponService.validateCoupon instead

  initializePayment: async (
    shipmentId: string,
    amount: number,
    currency: string,
  ) => {
    // In a real app, this would call the backend to create a payment intent
    return {
      transactionId: `txn_${Date.now()}`,
      amount,
      currency,
      status: "pending",
    };
  },

  initializeWavePayment: async (amount: number, currency: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const client_reference = `txn_${Date.now()}`;

    try {
      // 1. Get Wallet ID
      const { data: wallet } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!wallet) throw new Error("Portefeuille introuvable");

      // 2. Create pending transaction in DB
      await fetchWithRetry(() =>
        supabase.from("transactions").insert([
          {
            user_id: user.id,
            wallet_id: wallet.id,
            amount,
            currency,
            status: "pending",
            method: "mobile_money",
            type: "deposit", // Deposit means adding money (aligned with DB Enum)
            reference: client_reference,
            metadata: { provider: "wave" },
            description: "Rechargement via Wave",
          },
        ]),
      );

      // 2. Call Wave API
      // Note: We use fetchWithRetry here too for network resilience on the Edge Function call
      const data = await fetchWithRetry<any>(() =>
        supabase.functions.invoke("wave-checkout", {
          body: {
            amount,
            currency,
            client_reference,
            error_url:
              "https://nextmovecargo.com/dashboard/client/payments?status=error",
            success_url:
              "https://nextmovecargo.com/dashboard/client/payments?status=success",
          },
        }),
      );

      if (!data) throw new Error("No data received from Wave Checkout");

      return {
        wave_launch_url: data.wave_launch_url,
        transaction_id: client_reference, // Use our reference for polling
      };
    } catch (error) {
      console.error("Error initializing Wave payment:", error);
      throw error;
    }
  },

  verifyWavePayment: async (transactionId: string) => {
    // Poll for 5 minutes (100 attempts * 3 seconds)
    const maxAttempts = 100;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Check transaction status in DB
        // We use maybeSingle and normal fetch here because we are polling efficiently
        const { data, error } = await supabase
          .from("transactions")
          .select("status")
          .eq("reference", transactionId)
          .maybeSingle();

        if (error) {
          console.warn("Transient error checking status:", error);
          continue; // Skip this poll iteration on error
        }

        if (data?.status === "completed") {
          return { status: "succeeded", transaction_id: transactionId };
        }

        if (data?.status === "failed") {
          throw new Error("Payment failed");
        }
      } catch (err) {
        // Ignore errors during polling unless they are critical, just wait for next poll
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error("Payment timeout. Please check your Wave app.");
  },

  confirmPayment: async (
    shipmentId: string,
    details: any,
    couponId?: string,
  ) => {
    const isOffline = details.method === "offline";
    const status = isOffline ? "pending_offline" : "completed";

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 1. Record transaction
      await fetchWithRetry(() =>
        supabase.from("transactions").insert([
          {
            shipment_id: shipmentId,
            user_id: user?.id,
            amount: details.amount,
            currency: details.currency,
            status: status,
            reference: details.transactionId || `OFFLINE-${Date.now()}`,
            method: isOffline ? "offline" : "gateway",
          },
        ]),
      );

      // 2. Record coupon usage if applicable
      if (couponId && user) {
        // Not critical if this fails, but better to catch
        const { error: couponError } = await supabase
          .from("coupon_usages")
          .insert([
            {
              coupon_id: couponId,
              user_id: user.id,
              shipment_id: shipmentId,
              discount_amount: details.discountAmount || 0,
            },
          ]);

        if (couponError)
          console.error("Error recording coupon usage:", couponError);
      }

      // 3. Update shipment status
      await fetchWithRetry(() =>
        supabase
          .from("shipments")
          .update({ status: isOffline ? "pending_payment" : "pending" })
          .eq("id", shipmentId),
      );
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw error;
    }
  },

  payWithWallet: async (amount: number, refId: string, description: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Utilisateur non connecté");

    return await fetchWithRetry(() =>
      supabase.rpc("pay_with_wallet", {
        p_user_id: user.id,
        p_amount: amount,
        p_ref_id: refId,
        p_description: description,
      }),
    );
  },

  adminAdjustWallet: async (
    userId: string,
    amount: number,
    type: "deposit" | "withdrawal",
    description: string,
  ) => {
    const { data, error } = await supabase.rpc("admin_adjust_wallet", {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description,
    });

    if (error) throw error;
    return data;
  },
};
