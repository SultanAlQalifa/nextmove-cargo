import { supabase } from "../lib/supabase";

export interface Document {
  id: string;
  owner_id: string;
  name: string;
  type: "invoice" | "contract" | "kyc" | "customs" | "other";
  size: number;
  url: string;
  related_id?: string;
  created_at: string;
}

export const documentService = {
  async getDocuments(userId: string): Promise<Document[]> {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async uploadDocument(
    userId: string,
    file: File,
    type: Document["type"],
    relatedId?: string,
  ): Promise<Document> {
    // 1. Upload to Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Create Metadata Record
    const { data, error: dbError } = await supabase
      .from("documents")
      .insert({
        owner_id: userId,
        name: file.name,
        type: type,
        size: file.size,
        url: filePath,
        related_id: relatedId,
      })
      .select()
      .single();

    if (dbError) {
      // Cleanup storage if DB fails
      await supabase.storage.from("documents").remove([filePath]);
      throw dbError;
    }

    return data;
  },

  async deleteDocument(id: string, url: string): Promise<void> {
    // 1. Delete from Storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([url]);

    if (storageError)
      console.error("Error deleting file from storage:", storageError);

    // 2. Delete from DB
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (dbError) throw dbError;
  },

  async getDownloadUrl(path: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 3600); // 1 hour expiry

    return data?.signedUrl || null;
  },
};
