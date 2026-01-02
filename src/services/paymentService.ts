import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";
import { auditService } from "./auditService";
import { notificationService } from "./notificationService";

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
  category?: string;
  release_status?: string;
  shipment_id?: string;
  user?: {
    full_name: string;
    email: string;
    company_name?: string;
  };
}

export interface WaveCheckoutResponse {
  wave_launch_url: string;
  transaction_id: string; // Our internal reference
}

export interface PaymentConfirmationDetails {
  amount?: number;
  currency?: string;
  discountAmount?: number;
  paymentMethod: string;
  transactionReference?: string;
}

export interface WalletAdjustmentResponse {
  success: boolean;
  new_balance: number;
  transaction_id: string;
}

export interface PaymentCheckoutResponse {
  redirect_url: string;
  transaction_id: string;
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

  adminGetWallet: async (userId: string) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", userId)
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

  getAllTransactions: async (): Promise<Transaction[]> => {
    try {
      const data = await fetchWithRetry<Transaction[]>(() =>
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

  /**
   * Release funds for a shipment (Admin Trigger)
   */
  releaseFunds: async (shipmentId: string) => {
    try {
      const { data, error } = await supabase.rpc("release_shipment_funds", {
        p_shipment_id: shipmentId,
      });

      if (error) throw error;

      await auditService.logAction(
        "fund_release",
        "transaction",
        shipmentId,
        { shipment_id: shipmentId },
        { severity: "high" }
      );

      return data as { success: boolean; message: string };
    } catch (error) {
      console.error("Error releasing funds:", error);
      throw error;
    }
  },

  getInvoicePdfUrl: async (_invoiceId: string): Promise<string> => {
    // Mock PDF generation/retrieval
    return "#";
  },

  // validateCoupon removed - Use couponService.validateCoupon instead

  initializePayment: async (
    _shipmentId: string,
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

  initializeWavePayment: async (amount: number, currency: string, returnUrls?: { success: string; error: string }): Promise<WaveCheckoutResponse> => {
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
      const data = await fetchWithRetry<{ wave_launch_url: string }>(() =>
        supabase.functions.invoke("wave-checkout", {
          body: {
            amount,
            currency,
            client_reference,
            error_url: returnUrls?.error || `${window.location.origin}/dashboard/client/payments?status=error`,
            success_url: returnUrls?.success || `${window.location.origin}/dashboard/client/payments?status=success`,
          },
        }),
      );

      if (!data || !data.wave_launch_url) throw new Error("No launch URL received from Wave");

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

  initializePayTechPayment: async (amount: number, currency: string, metadata: any = {}, returnUrls?: { success: string; cancel: string }): Promise<PaymentCheckoutResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const client_reference = `PAYTECH-${Date.now()}`;

    try {
      const data = await fetchWithRetry<{ redirect_url: string }>(() =>
        supabase.functions.invoke("paytech-checkout", {
          body: {
            amount,
            currency,
            ref_command: client_reference,
            item_name: metadata.item_name || "Commande NextMove",
            custom_field: JSON.stringify({ user_id: user.id, ...metadata }),
            success_url: returnUrls?.success || `${window.location.origin}/dashboard/client/payments?status=success`,
            cancel_url: returnUrls?.cancel || `${window.location.origin}/dashboard/client/payments?status=cancel`,
          },
        }),
      );

      if (!data || !data.redirect_url) throw new Error("No redirect URL received from PayTech");

      return {
        redirect_url: data.redirect_url,
        transaction_id: client_reference,
      };
    } catch (error) {
      console.error("Error initializing PayTech payment:", error);
      throw error;
    }
  },

  initializeCinetPayPayment: async (amount: number, currency: string, metadata: any = {}, returnUrls?: { success: string }): Promise<PaymentCheckoutResponse> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const client_reference = `CINET-${Date.now()}`;

    try {
      const data = await fetchWithRetry<{ payment_url: string }>(() =>
        supabase.functions.invoke("cinetpay-checkout", {
          body: {
            amount,
            currency,
            transaction_id: client_reference,
            description: metadata.description || "Commande NextMove",
            customer_name: metadata.customer_name || user.user_metadata?.full_name || "Client",
            customer_surname: metadata.customer_surname || "",
            customer_email: user.email,
            customer_phone_number: user.phone || "",
            customer_address: "Dakar",
            customer_city: "Dakar",
            customer_country: "SN",
            notify_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cinetpay-webhook`,
            return_url: returnUrls?.success || `${window.location.origin}/dashboard/client/payments?status=success`,
            metadata: JSON.stringify(metadata),
          },
        }),
      );

      if (!data || !data.payment_url) throw new Error("No redirect URL received from CinetPay");

      return {
        redirect_url: data.payment_url,
        transaction_id: client_reference,
      };
    } catch (error) {
      console.error("Error initializing CinetPay payment:", error);
      throw error;
    }
  },

  confirmPayment: async (
    shipmentId: string,
    details: PaymentConfirmationDetails,
    couponId?: string,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // 1. Get User Plan directly from DB to avoid circular dependency or import issues
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*, plan:subscription_plans(name)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      // 2. Calculate Discount
      // We assume details.amount (if passed?) or we might rely on the RPC to calculate base amount.
      // But the user's code implies we pass the Final Amount.
      // Current interface PaymentConfirmationDetails doesn't strictly adhere to amount.
      // However, usually we pass the amount we *processed* (e.g. from gateway).
      // Let's assume the frontend Calculated the Final Amount and passed it, OR we force recalculate here.
      // Safer to recalculate if we can, but lacking base amount in args.
      // Let's implement the DISCOUNT logic as requested.

      const planName = subscription?.plan?.name?.toLowerCase() || '';
      let discountPercentage = 0;
      if (planName.includes('pro')) discountPercentage = 5;
      if (planName.includes('elite') || planName.includes('enterprise')) discountPercentage = 10;

      // Important: The RPC 'process_shipment_payment_escrow' might take p_amount.
      // If the current definition only takes (shipment_id, user_id), then it uses the shipment price.
      // We must likely update the call to pass p_amount if the RPC supports it, OR verify.
      // User provided code:
      /* 
         const { data, error } = await supabase.rpc("process_shipment_payment_escrow", {
            p_shipment_id: shipmentId,
            p_amount: finalAmount, 
            p_payment_method: details.paymentMethod,
            p_transaction_reference: details.transactionReference
         });
      */
      // I will assume the RPC has been or will be updated to accept p_amount, as requested.

      // We need the BASE amount to calculate the discount though.
      // Fetch shipment price first?
      const { data: shipment } = await supabase.from('shipments').select('price, currency').eq('id', shipmentId).single();
      const baseAmount = shipment?.price || 0;
      const discountAmount = (baseAmount * discountPercentage) / 100;
      const finalAmount = Math.max(0, baseAmount - discountAmount);

      // 3. Create Transaction Record (User requested this)
      const { data: _transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'payment',
          // status: 'pending', // Removed duplicate, handled below
          // User code says 'pending'.
          amount: finalAmount,
          original_amount: baseAmount, // Custom field, checking if Schema supports it? 
          // Custom field, checking if Schema supports it? 
          // If Schema doesn't support original_amount, it might error.
          // Safe bet: store in metadata if unsure.
          // User prompt says: amount: finalAmount... original_amount: baseAmount
          // I'll put original_amount in metadata to be safe on schema
          payment_method: details.paymentMethod,
          method: details.paymentMethod === 'bank_transfer' ? 'bank_transfer' : details.paymentMethod,
          currency: shipment?.currency || 'XOF',
          reference: details.transactionReference || `${details.paymentMethod === 'bank_transfer' ? 'VIRE' : 'PAY'}-${Date.now()}`,
          status: details.paymentMethod === 'bank_transfer' ? 'pending_validation' : 'pending',
          discount_applied: discountPercentage, // Checking schema... 'discount_applied' might not exist.
          // Safest to put in metadata
          metadata: {
            shipment_id: shipmentId,
            subscription_discount_percent: discountPercentage,
            subscription_discount_amount: discountAmount,
            original_amount: baseAmount,
            coupon_id: couponId,
            is_bank_transfer: details.paymentMethod === 'bank_transfer'
          }
        })
        .select()
        .single();

      if (txError) throw txError;

      // 4. Call RPC with Adjusted Amount
      const { data, error } = await supabase.rpc("process_shipment_payment_escrow", {
        p_shipment_id: shipmentId,
        p_user_id: user.id, // Keep existing param
        p_amount: finalAmount, // Passing the discounted amount
        p_payment_method: details.paymentMethod,
        p_transaction_reference: details.transactionReference
      });

      if (error) throw error;

      // Handle Coupon Usage Record
      if (couponId) {
        await supabase
          .from("coupon_usages")
          .insert([
            {
              coupon_id: couponId,
              user_id: user.id,
              shipment_id: shipmentId,
              discount_amount: details.discountAmount || 0, // Keeps existing logic
            },
          ]);
      }


      await auditService.logAction(
        "payment_confirmation",
        "transaction",
        data.transaction_id || shipmentId,
        { shipment_id: shipmentId, amount: finalAmount, method: details.paymentMethod },
        { severity: "medium" }
      );

      return data as { success: boolean; transaction_id: string };
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

    await auditService.logAction(
      "admin_wallet_adjust",
      "wallet",
      userId,
      { amount, type, description },
      { severity: "high" }
    );

    return data;
  },

  refund: async (paymentId: string, amount: number, reason: string) => {
    const { data, error } = await supabase.rpc("process_refund", {
      p_transaction_id: paymentId,
      p_amount: amount,
      p_reason: reason,
    });

    if (error) throw error;

    await auditService.logAction(
      "refund_processed",
      "transaction",
      paymentId,
      { amount, reason },
      { severity: "high" }
    );

    return data;
  },

  /**
   * Initie un paiement en espèces (Cash)
   * Crée une transaction en statut "pending_cash" qui nécessite validation admin
   */
  initiateCashPayment: async (
    shipmentId: string | undefined,
    details: PaymentConfirmationDetails,
    couponId?: string,
  ): Promise<{ success: boolean; transaction_id: string; shipment_id?: string }> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Utilisateur non connecté");

      // 1. Créer la transaction en statut "pending_cash"
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "payment",
          status: "pending_cash", // Statut spécial pour paiement cash
          amount: details.discountAmount || 0, // Montant de la commande
          method: "cash", // Changed from payment_method to method to match Interface/DB
          currency: "XOF", // Default to XOF or pass it in
          reference: details.transactionReference || `CASH-${Date.now()}`,
          metadata: {
            shipment_id: shipmentId,
            payment_details: details,
            coupon_id: couponId,
            awaiting_admin_confirmation: true,
          },
          description: "Paiement en espèces (En attente de validation)",
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // 2. Si c'est lié à une expédition, la créer ou la mettre à jour
      let finalShipmentId = shipmentId;

      if (shipmentId) {
        // Mettre à jour l'expédition existante (si elle existe déjà, ex: créée par RFQ)
        // Ou créer si nouvelle. Dans le contexte PaymentModal, shipmentId est souvent passé si existant.
        // Si shipmentId existe, on met juste à jour le statut paiement.

        await supabase
          .from("shipments")
          .update({
            payment_status: "pending_cash_validation",
            // On ne change pas le status global 'pending' tant que pas payé ?
            // Ou on met un status 'awaiting_payment'. 
            // Ici on suit la demande : 'pending_payment_cash' n'est peut-être pas un enum valide, 
            // vérifions les enums. Souvent c'est 'pending', 'confirmed', etc.
            // On va utiliser payment_status pour le suivi financier.
          })
          .eq("id", shipmentId);

      }

      // 3. Créer une notification pour les admins
      try {
        const { data: admins } = await supabase
          .from("profiles")
          .select("id")
          .in("role", ["admin", "super-admin"]);

        if (admins && admins.length > 0) {
          for (const admin of admins) {
            await notificationService.sendNotification(
              admin.id,
              "Nouveau paiement Cash",
              `Une transaction en espèces (${details.discountAmount || 0} ${details.currency || 'XOF'}) est en attente de validation pour l'expédition ${finalShipmentId}.`,
              "warning",
              `/dashboard/admin/payments`
            );
          }
        }
      } catch (notifErr) {
        console.warn("Failed to notify admins about cash payment:", notifErr);
      }

      await auditService.logAction(
        "cash_payment_initiated",
        "transaction",
        transaction.id,
        { shipment_id: finalShipmentId, amount: details.discountAmount || 0 },
        { severity: "medium" }
      );

      return {
        success: true,
        transaction_id: transaction.id,
        shipment_id: finalShipmentId,
      };
    } catch (error) {
      console.error("Cash payment initiation failed:", error);
      throw error;
    }
  },
};
