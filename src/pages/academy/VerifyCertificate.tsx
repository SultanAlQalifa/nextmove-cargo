import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { academyService } from "../../services/academyService";
import { XCircle, Award, Calendar, User, BookOpen, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function VerifyCertificate() {
    const { code } = useParams();
    const [loading, setLoading] = useState(true);
    const [enrollment, setEnrollment] = useState<any>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const verify = async () => {
            if (!code) return;
            try {
                setLoading(true);
                const data = await academyService.verifyCertificate(code);
                if (data && data.certified_at) {
                    setEnrollment(data);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error("Verification error:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-bold">Vérification de l'authenticité...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 py-20 font-sans">
            <Link to="/" className="mb-8 group">
                <span className="text-2xl font-black text-slate-900 dark:text-white">NextMove<span className="text-indigo-600">Cargo</span></span>
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
            >
                {error || !enrollment ? (
                    <div className="p-12 text-center">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Certificat Invalide</h1>
                        <p className="text-slate-500 mb-8 max-w-md mx-auto">Nous n'avons trouvé aucun certificat correspondant à ce code de vérification ou il n'est pas encore finalisé.</p>
                        <Link
                            to="/academy"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:opacity-90 transition-all"
                        >
                            Voir nos formations
                        </Link>
                    </div>
                ) : (
                    <div className="relative">
                        {/* Status Header */}
                        <div className="bg-indigo-600 p-10 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl -mr-32 -mt-32"></div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[32px] flex items-center justify-center mb-6 border border-white/20">
                                    <ShieldCheck className="w-10 h-10 text-white" />
                                </div>
                                <h1 className="text-3xl font-black text-white mb-2">Certificat Vérifié</h1>
                                <p className="text-indigo-100 font-bold opacity-80 uppercase tracking-widest text-[10px]">Authenticité garantie par NextMove Académie</p>
                            </div>
                        </div>

                        {/* Certificate Details */}
                        <div className="p-10 lg:p-12 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <User className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Titulaire</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{enrollment.profiles?.full_name}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <BookOpen className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Formation</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">{enrollment.academy_courses?.title}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Calendar className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Délivré le</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white">
                                                {new Date(enrollment.certified_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <Award className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Identifiant</p>
                                            <p className="text-lg font-black text-slate-900 dark:text-white font-mono">{code?.toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                                <Link
                                    to="/academy"
                                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all"
                                >
                                    Catalogue Academy
                                </Link>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
                                >
                                    Imprimer la preuve
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            <p className="mt-8 text-slate-400 text-xs font-medium">© {new Date().getFullYear()} NextMove Cargo - Service de Vérification Officiel</p>
        </div>
    );
}
