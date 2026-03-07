import { supabase } from "../lib/supabase";

export interface ServiceBranch {
    id: string;
    parent_id: string | null;
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    is_active: boolean;
    position: number;
    created_at?: string;
    updated_at?: string;
    children?: ServiceBranch[];
}

export const serviceBranchService = {
    getAllBranches: async (): Promise<ServiceBranch[]> => {
        const { data, error } = await supabase
            .from("service_branches")
            .select("*")
            .order("position");

        if (error) throw error;
        return data || [];
    },

    getTree: async (): Promise<ServiceBranch[]> => {
        const branches = await serviceBranchService.getAllBranches();

        const buildTree = (items: ServiceBranch[], parentId: string | null = null): ServiceBranch[] => {
            return items
                .filter(item => item.parent_id === parentId)
                .map(item => ({
                    ...item,
                    children: buildTree(items, item.id)
                }))
                .sort((a, b) => a.position - b.position);
        };

        return buildTree(branches);
    },

    createBranch: async (branch: Omit<ServiceBranch, "id" | "created_at" | "updated_at">): Promise<ServiceBranch> => {
        const { data, error } = await supabase
            .from("service_branches")
            .insert(branch)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateBranch: async (id: string, updates: Partial<ServiceBranch>): Promise<ServiceBranch> => {
        const { data, error } = await supabase
            .from("service_branches")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deleteBranch: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from("service_branches")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    reorderBranches: async (orders: { id: string; position: number }[]): Promise<void> => {
        const { error } = await supabase.rpc('reorder_service_branches', {
            orders
        });

        if (error) {
            // Fallback: update one by one if RPC doesn't exist yet
            for (const order of orders) {
                await supabase
                    .from("service_branches")
                    .update({ position: order.position })
                    .eq("id", order.id);
            }
        }
    }
};
