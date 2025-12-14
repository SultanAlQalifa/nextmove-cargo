export interface Transaction {
    id: string;
    created_at: string;
    amount: number;
    type: string;
    status: "pending" | "completed" | "failed";
    description: string;
    reference_id?: string;
    user_id: string;
    wallet_id?: string;
    metadata?: Record<string, any>;
}
