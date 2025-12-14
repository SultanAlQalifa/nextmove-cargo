import { Link, useNavigate } from "react-router-dom";
import { MoveLeft, Home, Map, FileQuestion } from "lucide-react";

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">

                {/* Visual Element */}
                <div className="relative inline-block">
                    <div className="absolute inset-0 bg-red-100 rounded-full scale-150 animate-pulse opacity-50"></div>
                    <div className="relative bg-white p-6 rounded-full shadow-xl border border-gray-100">
                        <Map className="w-16 h-16 text-primary" />
                        <div className="absolute -bottom-2 -right-2 bg-red-500 text-white p-2 rounded-full border-4 border-white">
                            <FileQuestion className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight">
                        404
                        <span className="block text-2xl md:text-3xl text-gray-500 font-medium mt-2">
                            Page Introuvable
                        </span>
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto text-lg">
                        Oups ! Il semblerait que vous ayez perdu votre chemin.
                        La page que vous ne cherchez n'existe pas ou a été déplacée.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 group"
                    >
                        <MoveLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Retour
                    </button>

                    <Link
                        to="/"
                        className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Retour à l'accueil
                    </Link>
                </div>

                {/* Footer Links */}
                <div className="pt-8 border-t border-gray-200/50 mt-8">
                    <p className="text-sm text-gray-500 mb-4">Raccourcis utiles :</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm font-medium">
                        <Link to="/dashboard" className="px-4 py-2 bg-white rounded-lg border border-gray-100 text-gray-600 hover:text-primary hover:border-primary/20 transition-all">
                            Tableau de bord
                        </Link>
                        <Link to="/tracking" className="px-4 py-2 bg-white rounded-lg border border-gray-100 text-gray-600 hover:text-primary hover:border-primary/20 transition-all">
                            Suivi de colis
                        </Link>
                        <Link to="/contact" className="px-4 py-2 bg-white rounded-lg border border-gray-100 text-gray-600 hover:text-primary hover:border-primary/20 transition-all">
                            Support
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
