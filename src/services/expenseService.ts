import { supabase } from "../lib/supabase";

export interface CompanyExpense {
    id: string;
    date: string;
    merchant: string;
    article: string;
    amount: number;
    currency: string;
    category: string;
    payment_method?: string;
    receipt_url?: string;
    raw_content?: string;
    status: string;
    created_at: string;
}

export const expenseService = {
    getExpenses: async (): Promise<CompanyExpense[]> => {
        const { data, error } = await supabase
            .from("company_expenses")
            .select("*")
            .order("date", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    createExpense: async (data: Partial<CompanyExpense>): Promise<CompanyExpense> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { data: result, error } = await supabase
            .from("company_expenses")
            .insert({
                ...data,
                admin_id: user.id
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    deleteExpense: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from("company_expenses")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },

    parseReceiptText: (text: string) => {
        const result: any = {
            merchant: "",
            article: "",
            amount: 0,
            currency: "XOF",
            date: new Date().toISOString(),
            raw_content: text
        };

        // 1. Detect Merchant
        if (text.toLowerCase().includes("google play") || text.toLowerCase().includes("google commerce")) {
            result.merchant = "Google LLC";
            result.category = "software_subscription";
        }

        // 2. Detect Amount (e.g., MAD 119.99 or 119.99 MAD or 119,99)
        // Looking for currency codes or symbols followed by numbers or vice versa
        const amountRegex = /(MAD|XOF|EUR|USD|€|\$)\s?(\d+[\.,]\d{2})|(\d+[\.,]\d{2})\s?(MAD|XOF|EUR|USD|€|\$)/i;
        const matchAmount = text.match(amountRegex);
        if (matchAmount) {
            const amountStr = matchAmount[2] || matchAmount[3];
            result.amount = parseFloat(amountStr.replace(",", "."));
            result.currency = (matchAmount[1] || matchAmount[4]).toUpperCase();

            // Cleanup currency symbols
            if (result.currency === "€") result.currency = "EUR";
            if (result.currency === "$") result.currency = "USD";
        }

        // 3. Detect Article (Google AI Pro (2 TB))
        if (text.includes("Google AI Pro")) {
            const articleRegex = /Google AI Pro \([^)]+\)/;
            const matchArticle = text.match(articleRegex);
            result.article = matchArticle ? matchArticle[0] : "Google AI Pro";
        } else {
            // Fallback for article: look for common patterns like "Article\tPrix\n(...)"
            const genericArticleRegex = /Article\s+Prix\s*\n([^\t\n]+)/i;
            const matchGeneric = text.match(genericArticleRegex);
            if (matchGeneric) result.article = matchGeneric[1].trim();
        }

        // 4. Detect Date (e.g., 5 mars 2026)
        const dateRegex = /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i;
        const matchDate = text.match(dateRegex);
        if (matchDate) {
            const day = parseInt(matchDate[1]);
            const monthMap: any = {
                janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5,
                juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11
            };
            const month = monthMap[matchDate[2].toLowerCase()];
            const year = parseInt(matchDate[3]);
            const date = new Date(year, month, day);
            result.date = date.toISOString();
        }

        return result;
    }
};
