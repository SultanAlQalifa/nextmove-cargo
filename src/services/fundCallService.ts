import { supabase } from '../lib/supabase';

export interface FundCall {
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status: 'pending' | 'approved' | 'rejected' | 'paid';
    requester: {
        id: string;
        name: string;
        email: string;
        role: 'forwarder' | 'partner';
    };
    reason: string;
    created_at: string;
    due_date: string;
    attachments: string[];
}

export const fundCallService = {
    getFundCalls: async (): Promise<FundCall[]> => {
        const { data, error } = await supabase
            .from('fund_calls')
            .select(`
                *,
                requester:profiles(id, company_name, email, role)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(mapDbFundCallToApp);
    },

    getForwarderFundCalls: async (): Promise<FundCall[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('fund_calls')
            .select(`
                *,
                requester:profiles(id, company_name, email, role)
            `)
            .eq('requester_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(mapDbFundCallToApp);
    },

    updateStatus: async (id: string, status: FundCall['status'], reason?: string): Promise<void> => {
        const { error } = await supabase
            .from('fund_calls')
            .update({ status }) // In a real app, we might store the rejection reason in a separate column or log
            .eq('id', id);

        if (error) throw error;

        if (reason) {
            // console.log(`Fund call ${id} updated to ${status} with reason: ${reason}`);
        }
    },

    createFundCall: async (fundCall: Partial<FundCall>): Promise<FundCall> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('fund_calls')
            .insert([{
                ...fundCall,
                requester_id: user.id,
                status: 'pending',
                created_at: new Date().toISOString()
            }])
            .select(`
                *,
                requester:profiles(id, company_name, email, role)
            `)
            .single();

        if (error) throw error;

        return mapDbFundCallToApp(data);
    }
};

function mapDbFundCallToApp(dbRecord: any): FundCall {
    return {
        id: dbRecord.id,
        reference: dbRecord.reference,
        amount: dbRecord.amount,
        currency: dbRecord.currency,
        status: dbRecord.status,
        requester: {
            id: dbRecord.requester?.id,
            name: dbRecord.requester?.company_name || 'Unknown',
            email: dbRecord.requester?.email,
            role: dbRecord.requester?.role
        },
        reason: dbRecord.reason,
        created_at: dbRecord.created_at,
        due_date: dbRecord.due_date,
        attachments: dbRecord.attachments || []
    };
}
