import { supabase } from "../lib/supabase";

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    category: string;
    published_at: string;
    created_at: string;
}

export const blogService = {
    async getPosts() {
        const { data, error } = await supabase
            .from("blog_posts")
            .select("*")
            .order("published_at", { ascending: false });

        if (error) throw error;
        return data as BlogPost[];
    },

    async getPostBySlug(slug: string) {
        const { data, error } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("slug", slug)
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    async getRecentPosts(limit = 3) {
        const { data, error } = await supabase
            .from("blog_posts")
            .select("*")
            .order("published_at", { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as BlogPost[];
    },

    async createPost(post: Omit<BlogPost, "id" | "created_at" | "published_at">) {
        const { data, error } = await supabase
            .from("blog_posts")
            .insert([
                {
                    ...post,
                    published_at: new Date().toISOString(),
                },
            ])
            .select()
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    async updatePost(id: string, post: Partial<BlogPost>) {
        const { data, error } = await supabase
            .from("blog_posts")
            .update(post)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as BlogPost;
    },

    async deletePost(id: string) {
        const { error } = await supabase.from("blog_posts").delete().eq("id", id);

        if (error) throw error;
        return true;
    },
};
