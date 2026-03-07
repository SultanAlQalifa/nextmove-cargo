import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import { useToast } from "../../../contexts/ToastContext";
import {
    FlaskConical,
    CheckCircle2,
    Circle,
    ArrowRight,
    MessageSquare,
    Trophy,
    AlertCircle,
    Send,
    Loader2
} from "lucide-react";
import { testerService, TesterMission, TesterFeedback } from "../../../services/testerService";

export default function TesterDashboard() {
    const { success, error: toastError } = useToast();
    const [missions, setMissions] = useState<TesterMission[]>([]);
    const [feedback, setFeedback] = useState<TesterFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedbackText, setFeedbackText] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [mList, fList] = await Promise.all([
                testerService.getMissions(),
                testerService.getMyFeedback()
            ]);
            setMissions(mList);
            setFeedback(fList);
        } catch (error) {
            console.error("Error fetching tester data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCompleteMission = async (mission: TesterMission) => {
        if (mission.completed) return;
        try {
            await testerService.completeMission(mission.id);
            success(`Félicitations ! +${mission.points_reward} points gagnés.`);
            fetchData();
            // Redirect to mission link in a real app, 
            // but here we just mark as complete for demo
            if (mission.link.startsWith('/')) {
                window.location.href = mission.link;
            }
        } catch (error: any) {
            toastError(error.message || "Erreur lors de la validation");
        }
    };

    const handleSubmitFeedback = async () => {
        if (!feedbackText.trim()) return;
        try {
            setSubmitting(true);
            await testerService.submitFeedback(feedbackText);
            success("Feedback envoyé avec succès ! Merci pour votre aide.");
            setFeedbackText("");
            fetchData();
        } catch (error: any) {
            toastError("Erreur lors de l'envoi");
        } finally {
            setSubmitting(false);
        }
    };

    const completedMissions = missions.filter(m => m.completed).length;

    return (
        <div className="space-y-6">
            <PageHeader
                title="SultanAlQalifa Actions Centre 🧪"
                subtitle="Aidez-nous à rendre NextMove Cargo parfait et gagnez des récompenses."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Missions Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-500" /> Missions de Test
                            </h3>
                            <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">
                                {completedMissions} / {missions.length} Complétées
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-12 text-center text-gray-400">Chargement des missions...</div>
                            ) : missions.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">Aucune mission disponible pour le moment.</div>
                            ) : (
                                missions.map((mission) => (
                                    <div key={mission.id} className={`p-6 transition-all ${mission.completed ? 'bg-gray-50/50' : 'hover:bg-gray-50 group'}`}>
                                        <div className="flex items-start gap-4">
                                            <div className="mt-1">
                                                {mission.completed ? (
                                                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                                                ) : (
                                                    <Circle className="w-6 h-6 text-gray-300 group-hover:text-primary transition-colors" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={`font-bold ${mission.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                                        {mission.title}
                                                    </h4>
                                                    <span className={`text-sm font-bold ${mission.completed ? 'text-gray-400' : 'text-primary'}`}>
                                                        +{mission.points_reward} pts
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-4">{mission.description}</p>
                                                {!mission.completed && (
                                                    <button
                                                        onClick={() => handleCompleteMission(mission)}
                                                        className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark transition-colors"
                                                    >
                                                        Démarrer la mission <ArrowRight className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Feedback Form */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-primary" /> Remonter un bug ou une suggestion
                        </h3>
                        <div className="relative">
                            <textarea
                                value={feedbackText}
                                onChange={(e) => setFeedbackText(e.target.value)}
                                placeholder="Décrivez le problème rencontré ou votre idée d'amélioration..."
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm mb-4"
                            />
                            <div className="flex justify-between items-center">
                                <p className="text-xs text-gray-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Votre avis aide à construire l'élite logistique.
                                </p>
                                <button
                                    onClick={handleSubmitFeedback}
                                    disabled={!feedbackText.trim() || submitting}
                                    className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Envoyer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    {/* Feedback History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                            <h3 className="font-bold text-sm text-gray-900">Mes retours récents</h3>
                        </div>
                        <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                            {feedback.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Aucun retour envoyé.</div>
                            ) : (
                                feedback.map((f) => (
                                    <div key={f.id} className="p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${f.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                                f.status === 'reviewed' ? 'bg-blue-50 text-blue-600' :
                                                    'bg-green-50 text-green-600'
                                                }`}>
                                                {f.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(f.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-2 italic">"{f.content}"</p>
                                        {f.admin_response && (
                                            <div className="mt-2 p-2 bg-primary/5 rounded border-l-2 border-primary">
                                                <p className="text-xs font-bold text-primary mb-1">Réponse admin :</p>
                                                <p className="text-xs text-gray-600">{f.admin_response}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Pro Tips */}
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white shadow-xl shadow-gray-200">
                        <h4 className="font-bold mb-3 flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-primary" /> Règle des 14 jours
                        </h4>
                        <div className="space-y-4">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                Google exige une activité constante pendant 14 jours consécutifs avec 20 testeurs engagés.
                            </p>
                            <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                                <p className="text-[10px] text-primary font-bold uppercase mb-1">Votre Engagement</p>
                                <p className="text-xs">Chaque mission accomplie prouve à Google que notre application est prête pour la production.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
