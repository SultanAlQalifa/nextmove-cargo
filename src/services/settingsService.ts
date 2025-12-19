import { supabase } from "../lib/supabase";

export interface SystemSettings {
  regionalization: {
    default_currency: string;
    supported_currencies: string[];
    default_language: string;
    supported_languages: string[];
    timezone: string;
    supported_timezones: string[];
  };
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    admin_email: string;
  };
  security: {
    min_password_length: number;
    require_2fa: boolean;
    session_timeout_minutes: number;
    phone_auth_enabled: boolean;
  };
  maintenance: {
    maintenance_mode: boolean;
    debug_mode: boolean;
  };
  email: {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_pass: string;
    from_email: string;
    from_name: string;
  };
  referral: {
    program_enabled: boolean;
    points_per_referral: number;
    point_value: number;
    max_referrals_per_user: number;
    bonus_threshold: number;
  };
  loyalty: {
    point_value: number;
  };
  integrations: {
    whatsapp: {
      enabled: boolean;
      api_key: string;
      phone_number_id: string;
      business_account_id: string;
    };
    ai_chat: {
      enabled: boolean;
      provider: "openai" | "anthropic";
      api_key: string;
      assistant_name: string;
      system_prompt: string;
    };
  };
  marketing: {
    show_founder_offer: boolean;
    founder_offer_title: string;
    founder_offer_price: number;
    founder_offer_description: string;
    news_ticker_enabled: boolean;
    news_ticker_messages: string[];
  };
}

const DEFAULT_SETTINGS: SystemSettings = {
  regionalization: {
    default_currency: "XOF",
    supported_currencies: ["XOF", "EUR", "USD", "CNY", "GBP"],
    default_language: "fr",
    supported_languages: ["fr", "en", "es", "zh"],
    timezone: "Africa/Dakar",
    supported_timezones: ["Africa/Dakar", "UTC"],
  },
  notifications: {
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
    admin_email: "djeylanidjitte@gmail.com",
  },
  security: {
    min_password_length: 8,
    require_2fa: false,
    session_timeout_minutes: 60,
    phone_auth_enabled: true,
  },
  maintenance: {
    maintenance_mode: false,
    debug_mode: false,
  },
  email: {
    smtp_host: "",
    smtp_port: 587,
    smtp_user: "",
    smtp_pass: "",
    from_email: "djeylanidjitte@gmail.com",
    from_name: "NextMove Cargo",
  },
  referral: {
    program_enabled: true,
    points_per_referral: 100,
    point_value: 50,
    max_referrals_per_user: 50,
    bonus_threshold: 1000,
  },
  loyalty: {
    point_value: 10,
  },
  integrations: {
    whatsapp: {
      enabled: false,
      api_key: "",
      phone_number_id: "",
      business_account_id: "",
    },
    ai_chat: {
      enabled: false,
      provider: "openai",
      api_key: "",
      assistant_name: "NextMove Assistant",
      system_prompt: "You are a helpful assistant for a logistics company.",
    },
  },
  marketing: {
    show_founder_offer: false,
    founder_offer_title: "Pack Fondateur",
    founder_offer_price: 5000,
    founder_offer_description: "Soutenez NextMove Cargo et obtenez le statut Membre Fondateur à vie.",
    news_ticker_enabled: true,
    news_ticker_messages: [
      "Bienvenue sur NextMove Cargo – Votre partenaire logistique global.",
      "Obtenez des cotations instantanées pour vos expéditions Aériennes et Maritimes.",
      "Nouveaux partenaires certifiés disponibles !",
      "Service client disponible 24/7 pour vos besoins urgents."
    ],
  },
};

export const settingsService = {
  getSettings: async (): Promise<SystemSettings> => {
    // Fetch both tables in parallel
    const [systemRes, platformRes] = await Promise.all([
      supabase.from("system_settings").select("*"),
      supabase.from("platform_settings").select("*").maybeSingle(),
    ]);

    if (systemRes.error) throw systemRes.error;

    // Merge DB settings with defaults
    const settings = { ...DEFAULT_SETTINGS };

    // Process generic system settings
    (systemRes.data || []).forEach((row: any) => {
      if (row.key in settings) {
        // @ts-ignore
        settings[row.key] = { ...settings[row.key], ...row.value };
      }
    });

    // Process platform settings (Marketing)
    if (platformRes.data) {
      settings.marketing = {
        show_founder_offer: platformRes.data.show_founder_offer,
        founder_offer_title: platformRes.data.founder_offer_title,
        founder_offer_price: platformRes.data.founder_offer_price,
        founder_offer_description: platformRes.data.founder_offer_description,
        news_ticker_enabled: platformRes.data.news_ticker_enabled ?? true,
        news_ticker_messages: platformRes.data.news_ticker_messages || [],
      };
    }

    return settings;
  },

  updateSettings: async (
    category: keyof SystemSettings,
    data: any,
  ): Promise<void> => {
    // Special handling for Marketing (platform_settings table)
    if (category === 'marketing') {
      const { error } = await supabase.from("platform_settings").upsert({
        id: true, // Singleton
        show_founder_offer: data.show_founder_offer,
        founder_offer_title: data.founder_offer_title,
        founder_offer_price: data.founder_offer_price,
        founder_offer_description: data.founder_offer_description,
        news_ticker_enabled: data.news_ticker_enabled,
        news_ticker_messages: data.news_ticker_messages,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      return;
    }

    // Default handling for other settings (system_settings table)
    // First get current value to merge
    const { data: currentData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", category)
      .single();

    const currentValue = currentData?.value || {};
    const newValue = { ...currentValue, ...data };

    const { error } = await supabase.from("system_settings").upsert({
      key: category,
      value: newValue,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
  },
};
