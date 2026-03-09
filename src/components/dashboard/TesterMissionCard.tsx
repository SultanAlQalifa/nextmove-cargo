import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    FlaskConical,
    ArrowRight,
    Trophy,
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
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Mission Testeur
                        </span>
                        <div className="flex items-center gap-1 text-orange-500 font-bold text-[10px]">
                            <Trophy className="w-3 h-3" />
                            +{mission.points_reward} Pts
                        </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                        {mission.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                        {mission.description}
                    </p>

                    <button
                        onClick={() => navigate(mission.link)}
                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-all border border-white/10 group/btn"
                    >
                        Commencer
                        <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary/5 rounded-full blur-2xl" />
        </div>
    );
}
