import { supabase } from "../lib/supabase";

export interface AuditLog {
    id: string;
    created_at: string;
    user_id: string | null;
    action: string;
    resource: string;
    resource_id?: string;
    details?: any;
    ip_address?: string;
    metadata?: any;
    user?: {
        full_name: string;
        email: string;
        role: string;
    };
}

export interface AuditFilters {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
}

export const auditService = {
    /**
     * Log an action to the audit_logs table
     */
    logAction: async (
        action: string,
        resource: string,
        resourceId?: string,
        details?: any,
        metadata?: any
    ): Promise<void> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Even if not authenticated (e.g. system action or login attempt), we might want to log
                // For now, we only log authenticated actions as per RLS
                console.warn("Attempted to log action without authentication", { action, resource });
                return;
            }

            const { error } = await supabase.from("audit_logs").insert({
                user_id: user.id,
                action,
                resource,
                resource_id: resourceId,
                details: details || {},
                metadata: metadata || {},
                // Ip address handling would typically happen on the backend/edge function
            });

            if (error) throw error;
        } catch (error) {
            // We don't want audit logging to break the main application flow
            console.error("Error logging audit action:", error);
        }
    },

    /**
     * Retrieve audit logs with filtering and pagination
     */
    getLogs: async (filters: AuditFilters = {}): Promise<{ data: AuditLog[]; count: number }> => {
        try {
            let query = supabase
                .from("audit_logs")
                .select(`
          *,
          user:profiles (
            full_name,
            email,
            role
          )
        `, { count: 'exact' });

            if (filters.userId) {
                query = query.eq("user_id", filters.userId);
            }

            if (filters.action) {
                query = query.ilike("action", `%${filters.action}%`);
            }

            if (filters.resource) {
                query = query.eq("resource", filters.resource);
            }

            if (filters.startDate) {
                query = query.gte("created_at", filters.startDate);
            }

            if (filters.endDate) {
                query = query.lte("created_at", filters.endDate);
            }

            // Pagination
            const page = filters.page || 1;
            const limit = filters.limit || 50;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            query = query.range(from, to).order("created_at", { ascending: false });

            const { data, error, count } = await query;

            if (error) throw error;

            return {
                data: (data as any[]) || [],
                count: count || 0
            };
        } catch (error) {
            console.error("Error fetching audit logs:", error);
            return { data: [], count: 0 };
        }
    },

    /**
     * Get distinct actions for filter dropdowns
     */
    getActions: async (): Promise<string[]> => {
        try {
            // Supabase distinct implementation usually requires a different approach or RPC
            // For now, we'll return a predefined list mixed with recent ones if possible, but 
            // easiest is to just return common ones or fetch latest 100 and extract unique
            const { data } = await supabase
                .from("audit_logs")
                .select("action")
                .order("created_at", { ascending: false })
                .limit(100);

            if (!data) return [];

            const uniqueActions = new Set(data.map((item: any) => item.action));
            return Array.from(uniqueActions);
        } catch (error) {
            return [];
        }
    }
};
