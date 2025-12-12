import { Newspaper, Calendar, ArrowRight, Tag } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import { Link } from "react-router-dom";

export default function BlogIndex() {
    const posts = [
        {
            id: 1,
            title: "Optimiser vos coûts d'importation en 2025",
            excerpt: "Découvrez les nouvelles réglementations douanières au Sénégal et comment le groupage peut réduire vos factures de 30%.",
            date: "12 Déc 2025",
            category: "Conseils",
            image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800",
        },
        {
            id: 2,
            title: "Transport Aérien vs Maritime : Que choisir ?",
            excerpt: "Un guide comparatif complet pour vous aider à prendre la meilleure décision selon l'urgence et le volume de vos marchandises.",
            date: "10 Déc 2025",
            category: "Guide",
            image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&q=80&w=800",
        },
        {
            id: 3,
            title: "L'impact de l'IA sur la logistique africaine",
            excerpt: "Comment NextMove Cargo utilise l'intelligence artificielle pour prédire les délais et sécuriser vos expéditions.",
            date: "05 Déc 2025",
            category: "Technologie",
            image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
        },
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <PageHeader
                title="Blog & Actualités"
                subtitle="Les dernières tendances de la logistique et du commerce international"
                action={{
                    label: "S'abonner à la newsletter",
                    icon: Newspaper,
                    onClick: () => { }, // Todo: Newsletter modal
                }}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.map((post) => (
                    <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-lg transition-all group">
                        <div className="h-48 overflow-hidden relative">
                            <img
                                src={post.image}
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
                                {post.date}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                            </h3>
                            <p className="text-slate-500 text-sm mb-6 line-clamp-3">
                                {post.excerpt}
                            </p>

                            <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:gap-3 transition-all">
                                Lire l'article <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
