import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";

export interface PlatformFeature {
  id: string; // key
  name: string;
  description?: string;
  category: "core" | "usage" | "support" | "integration";
  type: "boolean" | "limit";
  defaultValue: any; // Stored as jsonb in DB, mapped here
  createdAt?: string;
  updatedAt?: string;
}

export const featureService = {
  getAllFeatures: async (): Promise<PlatformFeature[]> => {
    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase
          .from("platform_features")
          .select("*")
          .order("category")
          .order("name"),
      );
      return (data || []).map(mapDbFeatureToApp);
    } catch (error) {
      console.error("Error fetching features:", error);
      throw error;
    }
  },

  createFeature: async (
    feature: Omit<PlatformFeature, "createdAt" | "updatedAt">,
  ): Promise<PlatformFeature> => {
    const dbFeature = mapAppFeatureToDb(feature);
    try {
      const { data, error } = await supabase
        .from("platform_features")
        .insert(dbFeature)
        .select()
        .single();

      if (error) throw error;
      return mapDbFeatureToApp(data);
    } catch (error) {
      console.error("Error creating feature:", error);
      throw error;
    }
  },

  updateFeature: async (
    id: string,
    updates: Partial<PlatformFeature>,
  ): Promise<PlatformFeature> => {
    const dbUpdates = mapAppFeatureToDb(updates);
    try {
      const { data, error } = await supabase
        .from("platform_features")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return mapDbFeatureToApp(data);
    } catch (error) {
      console.error("Error updating feature:", error);
      throw error;
    }
  },

  deleteFeature: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from("platform_features")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting feature:", error);
      throw error;
    }
  },
};

function mapDbFeatureToApp(dbRecord: any): PlatformFeature {
  return {
    id: dbRecord.id,
    name: dbRecord.name,
    description: dbRecord.description,
    category: dbRecord.category,
    type: dbRecord.type,
    defaultValue: dbRecord.default_value,
    createdAt: dbRecord.created_at,
    updatedAt: dbRecord.updated_at,
  };
}

function mapAppFeatureToDb(appFeature: any): any {
  const dbFeature: any = {};
  if (appFeature.id !== undefined) dbFeature.id = appFeature.id;
  if (appFeature.name !== undefined) dbFeature.name = appFeature.name;
  if (appFeature.description !== undefined)
    dbFeature.description = appFeature.description;
  if (appFeature.category !== undefined)
    dbFeature.category = appFeature.category;
  if (appFeature.type !== undefined) dbFeature.type = appFeature.type;
  if (appFeature.defaultValue !== undefined)
    dbFeature.default_value = appFeature.defaultValue;
  return dbFeature;
}
