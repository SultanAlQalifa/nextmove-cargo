import { supabase } from "../lib/supabase";

export const storageService = {
  /**
   * Uploads a file to a specific bucket and path.
   * @param bucket The storage bucket name
   * @param path The file path within the bucket
   * @param file The file to upload
   */
  async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Uploads a user avatar.
   * Path format: {userId}/{timestamp}_{filename}
   */
  async uploadAvatar(userId: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    await this.uploadFile("avatars", filePath, file);

    // Return public URL
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Uploads a document (KYC, Shipment, etc.).
   * Path format: {userId}/{type}/{filename}
   */
  async uploadDocument(userId: string, type: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${userId}/${type}/${fileName}`;

    await this.uploadFile("documents", filePath, file);

    // Return path (not public URL for private docs)
    return filePath;
  },

  /**
   * Uploads a branding asset (Logo, Banner).
   * Path format: {type}/{filename}
   */
  async uploadBrandingAsset(type: "logo" | "banner" | "icon", file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${type}_${Date.now()}.${fileExt}`;
    const filePath = `${type}/${fileName}`;

    await this.uploadFile("branding", filePath, file);

    // Return public URL
    const { data } = supabase.storage.from("branding").getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Gets the public URL for a file.
   */
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  /**
   * Deletes a file.
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error(`Error deleting from ${bucket}:`, error);
      throw error;
    }
  },

  /**
   * Create a signed URL for private documents
   */
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error(`Error creating signed URL for ${path}:`, error);
      throw error;
    }

    return data.signedUrl;
  },

  /**
   * Upload an attachment for emails
   */
  async uploadEmailAttachment(
    file: File,
  ): Promise<{ path: string; fullPath: string; publicUrl: string }> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from("email-attachments")
      .upload(filePath, file);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("email-attachments").getPublicUrl(filePath);

    return {
      path: filePath,
      fullPath: data.path,
      publicUrl,
    };
  },

  /**
   * Uploads a POD photo.
   */
  async uploadPODPhoto(shipmentId: string, file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${shipmentId}/${fileName}`;

    await this.uploadFile("pods", filePath, file);

    const { data } = supabase.storage.from("pods").getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Uploads an APK or IPA file for app distribution.
   */
  async uploadMobileBinary(file: File, platform: "android" | "ios") {
    const fileName = platform === "android" ? "nextmove-cargo.apk" : "nextmove-cargo.ipa";
    const filePath = `latest/${fileName}`;

    await this.uploadFile("apks", filePath, file);

    const { data } = supabase.storage.from("apks").getPublicUrl(filePath);
    return data.publicUrl;
  },

  /**
   * Uploads an image for a blog post.
   */
  async uploadBlogImage(file: File) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `blog/${fileName}`;

    await this.uploadFile("news", filePath, file);

    const { data } = supabase.storage.from("news").getPublicUrl(filePath);
    return data.publicUrl;
  },
};
