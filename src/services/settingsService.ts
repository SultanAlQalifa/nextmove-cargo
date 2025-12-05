import { supabase } from '../lib/supabase';

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
}

const DEFAULT_SETTINGS: SystemSettings = {
    regionalization: {
        default_currency: 'XOF',
        supported_currencies: ['XOF', 'EUR', 'USD', 'CNY', 'GBP'],
        default_language: 'fr',
        supported_languages: ['fr', 'en', 'es', 'zh'],
        timezone: 'Africa/Dakar',
        supported_timezones: ['Africa/Dakar', 'UTC']
    },
    notifications: {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: true,
        admin_email: 'admin@nextemove.com'
    },
    security: {
        min_password_length: 8,
        require_2fa: false,
        session_timeout_minutes: 60
    },
    maintenance: {
        maintenance_mode: false,
        debug_mode: false
    },
    email: {
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
        from_email: 'noreply@nextemove.com',
        from_name: 'NextMove Cargo'
    }
};

export const settingsService = {
    getSettings: async (): Promise<SystemSettings> => {
        const { data, error } = await supabase
            .from('system_settings')
            .select('*');

        if (error) throw error;

        // Merge DB settings with defaults
        const settings = { ...DEFAULT_SETTINGS };
        (data || []).forEach((row: any) => {
            if (row.key in settings) {
                // @ts-ignore
                settings[row.key] = { ...settings[row.key], ...row.value };
            }
        });

        return settings;
    },

    updateSettings: async (category: keyof SystemSettings, data: any): Promise<void> => {
        // First get current value to merge
        const { data: currentData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', category)
            .single();

        const currentValue = currentData?.value || {};
        const newValue = { ...currentValue, ...data };

        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key: category,
                value: newValue,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
    }
};
