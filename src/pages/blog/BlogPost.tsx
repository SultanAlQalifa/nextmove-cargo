import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { ArrowLeft, Calendar, Tag, User, Share2 } from "lucide-react";
import { blogService, BlogPost as IBlogPost } from "../../services/blogService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function BlogPost() {
    const { id: slug } = useParams();
    const [post, setPost] = useState<IBlogPost | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            if (!slug) return;
            try {
                const data = await blogService.getPostBySlug(slug);
                setPost(data);
            } catch (error) {
                console.error("Error fetching post:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPost();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Article non trouvé</h2>
                <Link to="/blog" className="text-primary hover:underline">
                    Retour au blog
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-24 px-4 sm:px-6">
            <div className="pt-8 mb-8">
                <Link to="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Retour au blog
                </Link>
            </div>

            <article className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <header className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold uppercase tracking-wider">
                            {post.category}
                        </span>
                        <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.published_at).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </div>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white leading-[1.2] mb-8 tracking-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between py-6 border-y border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">L'équipe NextMove</div>
                                <div className="text-xs text-slate-500">Expert Logistique</div>
                            </div>
                        </div>
                        <button
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="Partager cet article"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="relative aspect-[16/9] mb-12 rounded-[2rem] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800">
                    <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
                    <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-light mb-8 border-l-4 border-primary pl-6 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-r-xl">
                        {post.excerpt}
                    </p>

                    <div
                        className="text-slate-700 dark:text-slate-300 leading-relaxed space-y-6"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />
                </div>

                <footer className="mt-16 pt-8 border-t border-slate-100 dark:border-slate-800">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
                        <h3 className="text-2xl font-bold mb-4">Prêt à simplifier votre logistique ?</h3>
                        <p className="text-blue-100 mb-8 max-w-lg mx-auto">
                            Rejoignez des milliers d'entreprises qui font confiance à NextMove Cargo pour leurs expéditions internationales.
                        </p>
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all transform hover:scale-105"
                        >
                            Commencer maintenant
                        </Link>
                    </div>
                </footer>
            </article>
        </div>
    );
}
