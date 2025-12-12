import { useParams, Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { ArrowLeft } from "lucide-react";

export default function BlogPost() {
    const { id } = useParams();

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <Link to="/blog" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary mb-6 transition-colors font-medium">
                <ArrowLeft className="w-4 h-4" /> Retour au blog
            </Link>
            <PageHeader
                title={`Article #${id}`}
                subtitle="Détail de l'article de blog"
            />

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 min-h-[300px] flex items-center justify-center text-slate-400">
                Contenu de l'article à venir...
            </div>
        </div>
    );
}
