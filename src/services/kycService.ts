import { supabase } from "../lib/supabase";
import { notificationService } from "./notificationService";

export interface KYCSubmission {
    id_type: string;
    id_number: string;
    dob: string;
    first_name: string;
    last_name: string;
    files: File[];
}

export const kycService = {
    // ... existing functions ...
    checkKYCRequirement: async (amount: number): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        try {
            const { data, error } = await supabase.rpc("check_kyc_required", {
                p_user_id: user.id,
                p_pending_amount: amount
            });

            if (error) throw error;
            return !!data;
        } catch (error) {
            console.error("Error checking KYC requirement:", error);
            return false;
        }
    },

    getMonthlyVolume: async (): Promise<number> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        try {
            const { data, error } = await supabase.rpc("get_monthly_transaction_volume", {
                p_user_id: user.id
            });

            if (error) throw error;
            return Number(data || 0);
        } catch (error) {
            console.error("Error getting monthly volume:", error);
            return 0;
        }
    },

    submitKYC: async (submission: KYCSubmission): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        try {
            // 1. Upload files
            const uploadedUrls: string[] = [];
            for (const file of submission.files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('kyc-documents')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;
                uploadedUrls.push(fileName);
            }

            // 2. Create submission record
            const { error: dbError } = await supabase.from('kyc_submissions').insert({
                user_id: user.id,
                document_type: submission.id_type,
                document_urls: uploadedUrls,
                submitted_data: {
                    id_number: submission.id_number,
                    dob: submission.dob,
                    first_name: submission.first_name,
                    last_name: submission.last_name
                },
                status: 'pending'
            });

            if (dbError) throw dbError;

            // 3. Update profile status
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    kyc_status: 'pending',
                    kyc_data: {
                        id_number: submission.id_number,
                        id_type: submission.id_type,
                        dob: submission.dob,
                        first_name: submission.first_name,
                        last_name: submission.last_name
                    }
                })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 4. Notify Admins
            const { data: admins } = await supabase
                .from('profiles')
                .select('id')
                .in('role', ['admin', 'super-admin']);

            if (admins) {
                for (const admin of admins) {
                    await notificationService.sendNotification(
                        admin.id,
                        "Nouveau dossier KYC soumis",
                        `Le client ${submission.first_name} ${submission.last_name} a soumis ses documents pour vérification.`,
                        "info",
                        "/dashboard/admin/kyc"
                    );
                }
            }

        } catch (error) {
            console.error("KYC Submission error:", error);
            throw error;
        }
    },

    getPendingSubmissions: async () => {
        try {
            const { data, error } = await supabase
                .from('kyc_submissions')
                .select(`
                    *,
                    profiles:user_id (
                        email,
                        full_name,
                        phone
                    )
                `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error getting pending KYC submissions:", error);
            throw error;
        }
    },

    updateKYCStatus: async (submissionId: string, userId: string, status: 'verified' | 'rejected', reason?: string) => {
        try {
            const { error: subError } = await supabase
                .from('kyc_submissions')
                .update({
                    status,
                    rejection_reason: reason,
                    reviewed_at: new Date().toISOString()
                })
                .eq('id', submissionId);

            if (subError) throw subError;

            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    kyc_status: status,
                    kyc_rejection_reason: status === 'rejected' ? reason : null
                })
                .eq('id', userId);

            if (profileError) throw profileError;

            // Notify User
            const title = status === 'verified' ? "KYC Approuvé ✅" : "KYC Rejeté ❌";
            const message = status === 'verified'
                ? "Votre identité a été vérifiée avec succès. Vous pouvez désormais effectuer des transactions sans limite."
                : `Votre dossier KYC a été rejeté. Motif : ${reason}. Veuillez soumettre à nouveau vos documents.`;

            await notificationService.sendNotification(
                userId,
                title,
                message,
                status === 'verified' ? "success" : "error",
                status === 'rejected' ? "/dashboard/client/settings" : "/dashboard"
            );

        } catch (error) {
            console.error("Error updating KYC status:", error);
            throw error;
        }
    },

    getSignedUrl: async (path: string) => {
        try {
            const { data, error } = await supabase.storage
                .from('kyc-documents')
                .createSignedUrl(path, 3600); // 1 hour link

            if (error) throw error;
            return data.signedUrl;
        } catch (error) {
            console.error("Error getting signed URL for KYC document:", error);
            throw error;
        }
    }
};
