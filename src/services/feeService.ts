import { supabase } from '../lib/supabase';

export interface FeeConfig {
    id: string;
    name: string;
    type: 'percentage' | 'fixed';
    value: number;
    minAmount?: number;
    maxAmount?: number;
    description?: string;
    isActive: boolean;
    category: 'insurance' | 'guarantee' | 'management' | 'storage' | 'penalty' | 'tax' | 'other';
    target: 'client' | 'forwarder';
    isRecurring?: boolean;
    gracePeriodHours?: number;
    recurringInterval?: 'day';
}

export const feeService = {
    getFees: async (): Promise<FeeConfig[]> => {
        const { data, error } = await supabase
            .from('fee_configs')
            .select('*')
            .order('name');

        if (error) throw error;

        return (data || []).map(mapDbFeeToApp);
    },

    createFee: async (fee: Omit<FeeConfig, 'id'>): Promise<FeeConfig> => {
        const dbFee = mapAppFeeToDb(fee);
        const { data, error } = await supabase
            .from('fee_configs')
            .insert(dbFee)
            .select()
            .single();

        if (error) throw error;
        return mapDbFeeToApp(data);
    },

    updateFee: async (id: string, updates: Partial<FeeConfig>): Promise<FeeConfig> => {
        const dbUpdates = mapAppFeeToDb(updates);
        const { data, error } = await supabase
            .from('fee_configs')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return mapDbFeeToApp(data);
    },

    deleteFee: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('fee_configs')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

function mapDbFeeToApp(dbRecord: any): FeeConfig {
    return {
        id: dbRecord.id,
        name: dbRecord.name,
        type: dbRecord.type,
        value: dbRecord.value,
        minAmount: dbRecord.min_amount,
        maxAmount: dbRecord.max_amount,
        description: dbRecord.description,
        isActive: dbRecord.is_active,
        category: dbRecord.category,
        target: dbRecord.target,
        isRecurring: dbRecord.is_recurring,
        gracePeriodHours: dbRecord.grace_period_hours,
        recurringInterval: dbRecord.recurring_interval
    };
}

function mapAppFeeToDb(appFee: any): any {
    const dbFee: any = {};
    if (appFee.name !== undefined) dbFee.name = appFee.name;
    if (appFee.type !== undefined) dbFee.type = appFee.type;
    if (appFee.value !== undefined) dbFee.value = appFee.value;
    if (appFee.minAmount !== undefined) dbFee.min_amount = appFee.minAmount;
    if (appFee.maxAmount !== undefined) dbFee.max_amount = appFee.maxAmount;
    if (appFee.description !== undefined) dbFee.description = appFee.description;
    if (appFee.isActive !== undefined) dbFee.is_active = appFee.isActive;
    if (appFee.category !== undefined) dbFee.category = appFee.category;
    if (appFee.target !== undefined) dbFee.target = appFee.target;
    if (appFee.isRecurring !== undefined) dbFee.is_recurring = appFee.isRecurring;
    if (appFee.gracePeriodHours !== undefined) dbFee.grace_period_hours = appFee.gracePeriodHours;
    if (appFee.recurringInterval !== undefined) dbFee.recurring_interval = appFee.recurringInterval;
    return dbFee;
}
