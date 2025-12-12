import { supabase } from "./supabase";
import { logger } from "../utils/logger";

export const supabaseWrapper = {
  async query<T>(
    operation: () => Promise<{ data: T | null; error: any }>,
  ): Promise<T | null> {
    try {
      const { data, error } = await operation();

      if (error) {
        logger.error("Supabase error:", error);
        return null;
      }

      return data;
    } catch (err) {
      logger.error("Supabase exception:", err);
      return null;
    }
  },
};
