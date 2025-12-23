import { supabase } from "../lib/supabase";

export interface PaymentGateway {
  id: string;
  name: string;
  provider: "wave" | "wallet" | "paytech" | "cinetpay" | "bank_transfer" | "offline";
  is_active: boolean;
  is_test_mode: boolean;
  config: {
    public_key?: string;
    secret_key?: string;
    merchant_id?: string;
    webhook_secret?: string;
    apikey?: string; // For CinetPay/PayTech
    site_id?: string; // For CinetPay
    // Bank Transfer Fields
    bank_name?: string;
    account_name?: string;
    iban?: string;
    swift?: string;
    instructions?: string;
  };
  supported_currencies: string[];
  transaction_fee_percent: number;
}

export const paymentGatewayService = {
  getGateways: async (): Promise<PaymentGateway[]> => {
    const { data, error } = await supabase
      .from("payment_gateways")
      .select("*")
      .order("name");

    if (error) throw error;

    const gateways = (data || []).map(mapDbGatewayToApp);

    // Fallback: If no Wave gateway exists, add a default one (mock/client-side)
    if (!gateways.find((g) => g.provider === "wave")) {
      gateways.push({
        id: "wave-default",
        name: "Wave",
        provider: "wave",
        is_active: true,
        is_test_mode: true,
        config: {
          merchant_id: "",
          secret_key: "",
        },
        supported_currencies: ["XOF"],
        transaction_fee_percent: 1,
      });
    }

    // Fallback: If no Wallet gateway exists, add a default one
    if (!gateways.find((g) => g.provider === "wallet")) {
      gateways.push({
        id: "wallet-default",
        name: "Mon Portefeuille",
        provider: "wallet",
        is_active: true,
        is_test_mode: false,
        config: {},
        supported_currencies: ["XOF", "EUR", "USD"],
        transaction_fee_percent: 0,
      });
    }

    // Fallback: PayTech
    if (!gateways.find((g) => g.provider === "paytech")) {
      gateways.push({
        id: "paytech-default",
        name: "PayTech",
        provider: "paytech",
        is_active: false,
        is_test_mode: true,
        config: { apikey: "", secret_key: "" },
        supported_currencies: ["XOF"],
        transaction_fee_percent: 1.5,
      });
    }

    // Fallback: CinetPay
    if (!gateways.find((g) => g.provider === "cinetpay")) {
      gateways.push({
        id: "cinetpay-default",
        name: "CinetPay",
        provider: "cinetpay",
        is_active: false,
        is_test_mode: true,
        config: { site_id: "", apikey: "" },
        supported_currencies: ["XOF", "XAF", "GNF", "USD"],
        transaction_fee_percent: 2.0,
      });
    }

    // Fallback: Bank Transfer
    if (!gateways.find((g) => g.provider === "bank_transfer")) {
      gateways.push({
        id: "bank-transfer-default",
        name: "Virement Bancaire",
        provider: "bank_transfer",
        is_active: false,
        is_test_mode: false,
        config: {
          bank_name: "Banque Agricole",
          account_name: "",
          iban: "",
          swift: "",
          instructions: "Veuillez effectuer le virement sur le compte ci-dessus.",
        },
        supported_currencies: ["XOF", "EUR", "USD"],
        transaction_fee_percent: 0,
      });
    }

    return gateways;
  },

  updateGateway: async (
    id: string,
    data: Partial<PaymentGateway>,
  ): Promise<PaymentGateway> => {
    const dbUpdates = mapAppGatewayToDb(data);

    if (id === "wave-default") {
      // Create new gateway
      const { data: newGateway, error } = await supabase
        .from("payment_gateways")
        .insert([
          {
            ...dbUpdates,
            name: "Wave",
            provider: "wave",
            is_active: dbUpdates.is_active !== undefined ? dbUpdates.is_active : true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapDbGatewayToApp(newGateway);
    }

    if (id === "wallet-default") {
      // Create new wallet gateway
      const { data: newGateway, error } = await supabase
        .from("payment_gateways")
        .insert([
          {
            ...dbUpdates,
            name: "Mon Portefeuille",
            provider: "wallet",
            is_active: dbUpdates.is_active !== undefined ? dbUpdates.is_active : true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapDbGatewayToApp(newGateway);
    }

    // Generic default handler for new ones
    if (id.endsWith("-default")) {
      const provider = id.replace("-default", "").replace("bank-transfer", "bank_transfer");
      const { data: newGateway, error } = await supabase
        .from("payment_gateways")
        .insert([
          {
            ...dbUpdates,
            provider,
            name: dbUpdates.name || provider.charAt(0).toUpperCase() + provider.slice(1).replace("_", " "),
            is_active: dbUpdates.is_active !== undefined ? dbUpdates.is_active : true,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return mapDbGatewayToApp(newGateway);
    }

    const { data: updated, error } = await supabase
      .from("payment_gateways")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapDbGatewayToApp(updated);
  },

  toggleGateway: async (id: string): Promise<void> => {
    if (id.endsWith("-default")) {
      // If it's a default, we need to create it in the DB to store the preference
      // We'll get the current default state first
      const gateways = await paymentGatewayService.getGateways();
      const current = gateways.find(g => g.id === id);
      if (current) {
        await paymentGatewayService.updateGateway(id, {
          ...current,
          is_active: !current.is_active
        });
      }
      return;
    }

    // First get current status
    const { data: current, error: fetchError } = await supabase
      .from("payment_gateways")
      .select("is_active")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from("payment_gateways")
      .update({ is_active: !current.is_active })
      .eq("id", id);

    if (error) throw error;
  },
};

function mapDbGatewayToApp(dbRecord: any): PaymentGateway {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    provider: dbRecord.provider,
    is_active: dbRecord.is_active,
    is_test_mode: dbRecord.is_test_mode,
    config: dbRecord.config || {},
    supported_currencies: dbRecord.supported_currencies || [],
    transaction_fee_percent: dbRecord.transaction_fee_percent,
  };
}

function mapAppGatewayToDb(appGateway: any): any {
  const dbGateway: any = {};
  if (appGateway.name !== undefined) dbGateway.name = appGateway.name;
  if (appGateway.provider !== undefined)
    dbGateway.provider = appGateway.provider;
  if (appGateway.is_active !== undefined)
    dbGateway.is_active = appGateway.is_active;
  if (appGateway.is_test_mode !== undefined)
    dbGateway.is_test_mode = appGateway.is_test_mode;
  if (appGateway.config !== undefined) dbGateway.config = appGateway.config;
  if (appGateway.supported_currencies !== undefined)
    dbGateway.supported_currencies = appGateway.supported_currencies;
  if (appGateway.transaction_fee_percent !== undefined)
    dbGateway.transaction_fee_percent = appGateway.transaction_fee_percent;
  return dbGateway;
}
