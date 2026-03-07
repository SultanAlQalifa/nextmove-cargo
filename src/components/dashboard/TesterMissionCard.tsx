import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FlaskConical,
    ArrowRight,
    Trophy,
    CheckCircle2,
    X
} from "lucide-react";
import { testerService, TesterMission } from "../../services/testerService";

export default function TesterMissionCard() {
    const navigate = useNavigate();
    const [mission, setMission] = useState<TesterMission | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const fetchMission = async () => {
            try {
                const missions = await testerService.getMissions();
                const nextMission = missions.find(m => !m.completed);
                if (nextMission) {
                    setMission(nextMission);
                }
            } catch (error) {
                console.error("Error fetching next mission:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMission();
    }, []);

    if (loading || !mission || dismissed) return null;

    return (
        <div className="bg-white rounded-2xl shadow-lg border-2 border-primary/20 p-4 relative animate-in slide-in-from-right-10 duration-500 overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                    title="Fermer"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>

            <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                    <FlaskConical className="w-5 h-5 shadow-sm" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Mission du jour</span>
                        <div className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="text-[10px] font-bold text-yellow-500 flex items-center gap-1">
                            <Trophy className="w-2.5 h-2.5" /> +{mission.points_reward} pts
                        </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{mission.title}</h4>
                    <p className="text-[11px] text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                        {mission.description}
                    </p>
                    <button
                        onClick={() => navigate('/dashboard/tester/dashboard')}
                        className="w-full py-2 bg-gray-900 text-white text-[11px] font-bold rounded-lg hover:bg-black transition-all flex items-center justify-center gap-2 group/btn"
                    >
                        Relevez le défi <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
