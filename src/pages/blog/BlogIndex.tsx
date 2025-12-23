import { Newspaper, Calendar, ArrowRight, Tag } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { blogService, BlogPost } from "../../services/blogService";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function BlogIndex() {
    const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const data = await blogService.getPosts();
                setPosts(data);
            } catch (error) {
                console.error("Error fetching posts:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <PageHeader
                title="Blog & Actualités"
                subtitle="Les dernières tendances de la logistique et du commerce international"
                action={{
                    label: "S'abonner à la newsletter",
                    icon: Newspaper,
                    onClick: () => setIsNewsletterOpen(true),
                }}
            />

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <LoadingSpinner size="lg" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                        <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={post.featured_image || "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800"}
                                    alt={post.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {post.category}
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center gap-2 text-slate-400 text-xs mb-3">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(post.published_at).toLocaleDateString()}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-slate-500 text-sm mb-6 line-clamp-3">
                                    {post.excerpt}
                                </p>

                                <Link to={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all">
                                    Lire l'article <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {isNewsletterOpen && (
                <NewsletterModal onClose={() => setIsNewsletterOpen(false)} />
            )}
        </div>
    );
}
