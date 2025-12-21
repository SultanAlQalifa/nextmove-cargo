import { supabase } from "../lib/supabase";
import { logger } from "../utils/logger";

export const smsService = {
    /**
     * Sends an SMS via the send-sms Edge Function
     * @param to Phone number in international format (+221...)
     * @param content Message content (max 160 chars for 1 SMS)
     */
    sendSMS: async (to: string | string[], content: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase.functions.invoke("send-sms", {
                body: { to, content },
            });

            if (error) {
                logger.error("SMS skip/error:", error);
                return false;
            }

            if (data?.success) {
                logger.info("SMS sent successfully to:", to);
                return true;
            }

            return false;
        } catch (error) {
            logger.error("Error calling SMS function:", error);
            return false;
        }
    }
};
