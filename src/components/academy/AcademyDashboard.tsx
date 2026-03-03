import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Book, Play, Zap, Shield, Sword, Target, Trophy, Flame, Star, FileCheck, HelpCircle, HardHat, ArrowRight
} from "lucide-react";
import { useState, useEffect } from "react";
import { academyService } from "../../services/academyService";
import { AcademyCourse } from "../../types/academy";
import { supabase } from "../../lib/supabase";

export default function AcademyDashboard() {
    const [courses, setCourses] = useState<AcademyCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [myEnrollments, setMyEnrollments] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const { data: { user } } = await supabase.auth.getUser();

                const [coursesData, enrollmentsData] = await Promise.all([
                    academyService.getCourses(),
                    user ? academyService.getMyEnrollments(user.id) : Promise.resolve([])
                ]);

                // Filter only published courses for students
                setCourses(coursesData.filter(c => c.status === 'published'));
                setMyEnrollments(enrollmentsData || []);
            } catch (error) {
                console.error("Error loading academy data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const stats = {
        rank: "Gladiateur Novice",
        xp: 350,
        nextRank: 1000,
        streak: 3,
        battlesWon: 12
    };

    const getCourseIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'logistique': return Shield;
            case 'négociation': return Target;
            default: return Sword;
        }
    };

    const getCourseColor = (category: string) => {
        switch (category.toLowerCase()) {
            case 'logistique': return "from-blue-500 to-cyan-600";
            case 'négociation': return "from-purple-500 to-indigo-600";
            default: return "from-orange-500 to-red-600";
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans p-4 lg:p-8 relative overflow-hidden">
            {/* Immersive HUD Overlays */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e293b,transparent)] opacity-40" />
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
                <div className="absolute top-1/4 -left-20 w-full max-w-sm h-96 bg-orange-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-1/4 -right-20 w-full max-w-sm h-96 bg-blue-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Gladiator HUD 2.0 */}
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl border border-white/5 relative overflow-hidden"
                >
                    {/* Tactical Decor */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
                    <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12">
                        <Trophy className="w-80 h-80 text-orange-500" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative w-24 h-24 rounded-full bg-slate-950 flex items-center justify-center border-2 border-white/10 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-transparent animate-pulse" />
                                    <Sword className="w-12 h-12 text-orange-500 relative z-10" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-xl">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        ID: #2026-ELITE
                                    </span>
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
                                    <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Opérationnel</span>
                                </div>
                                <h1 className="text-4xl lg:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">
                                    {stats.rank}
                                </h1>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500">Progression Vers Rang Supérieur</span>
                                        <span className="text-orange-500">{Math.round((stats.xp / stats.nextRank) * 100)}%</span>
                                    </div>
                                    <div className="w-full md:w-80 h-2 bg-slate-950 rounded-full p-0.5 border border-white/5 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stats.xp / stats.nextRank) * 100}%` }}
                                            transition={{ duration: 1.5, ease: "circOut" }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                                        <span>Current: {stats.xp} XP</span>
                                        <span>Target: {stats.nextRank} XP</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:w-auto">
                            <div className="px-8 py-5 bg-slate-950/50 backdrop-blur-xl rounded-3xl flex flex-col items-center border border-white/5 group hover:border-orange-500/30 transition-all duration-500 shadow-xl">
                                <div className="p-2 bg-orange-500/10 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                                    <Flame className="w-6 h-6 text-orange-500" />
                                </div>
                                <span className="text-3xl font-black text-white">{stats.streak}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Séquence active</span>
                            </div>
                            <div className="px-8 py-5 bg-slate-950/50 backdrop-blur-xl rounded-3xl flex flex-col items-center border border-white/5 group hover:border-blue-500/30 transition-all duration-500 shadow-xl">
                                <div className="p-2 bg-blue-500/10 rounded-xl mb-3 group-hover:scale-110 transition-transform">
                                    <Trophy className="w-6 h-6 text-blue-500" />
                                </div>
                                <span className="text-3xl font-black text-white">{stats.battlesWon}</span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Défis Validés</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Arena Grid */}
                <div className="grid lg:grid-cols-3 gap-10">

                    {/* Training Grounds (Courses) */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
                                <div className="p-2 bg-slate-900 rounded-lg border border-white/10">
                                    <Book className="w-6 h-6 text-orange-500" />
                                </div>
                                Terrain d'Entraînement
                            </h2>
                            <button className="text-[10px] font-black text-slate-500 hover:text-orange-500 transition-colors uppercase tracking-[0.3em] flex items-center gap-2">
                                Archives Complètes <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>

                        <div className="grid gap-6">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-32 bg-slate-900/40 animate-pulse rounded-3xl border border-white/5" />
                                ))
                            ) : courses.length > 0 ? (
                                courses.map((course) => {
                                    const Icon = getCourseIcon(course.category);
                                    const colorClass = getCourseColor(course.category);
                                    const lessonsCount = (course.academy_lessons || []).length;

                                    // Calculate progress
                                    const enrollment = myEnrollments.find(e => e.course_id === course.id);
                                    const completedCount = enrollment?.progress?.length || 0;
                                    const progressPercent = lessonsCount > 0 ? (completedCount / lessonsCount) * 100 : 0;
                                    const isEnrolled = !!enrollment;

                                    return (
                                        <motion.div
                                            key={course.id}
                                            whileHover={{ y: -5, x: 2 }}
                                            className="group relative p-8 bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all duration-500 overflow-hidden"
                                        >
                                            {/* Scan Effect Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-[1.5s] ease-linear pointer-events-none" />

                                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorClass} p-0.5 shadow-2xl group-hover:rotate-6 transition-transform duration-500`}>
                                                        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-3">
                                                            {course.cover_image_url ? (
                                                                <img src={course.cover_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                                                            ) : (
                                                                <Icon className="w-full h-full text-white" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isEnrolled ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-slate-800 text-slate-400 border border-white/5'}`}>
                                                                {isEnrolled ? 'Mission Active' : 'Mission Disponible'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{course.category}</span>
                                                        </div>
                                                        <h3 className="text-xl lg:text-2xl font-black text-white group-hover:text-orange-400 transition-colors tracking-tight">
                                                            {course.title}
                                                        </h3>
                                                        <div className="flex items-center gap-4 mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                            <span className="flex items-center gap-1.5"><Play className="w-3 h-3 text-orange-500" /> {lessonsCount} Séquences</span>
                                                            {course.rating && course.rating > 0 && (
                                                                <span className="flex items-center gap-1.5 text-yellow-500/70">
                                                                    <Star className="w-3 h-3 fill-current" /> {course.rating.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px]">
                                                    <Link
                                                        to={`/academy/lesson/${course.id}`}
                                                        className={`w-full group/btn relative px-6 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 overflow-hidden
                                                            ${isEnrolled ? 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-white text-slate-950 hover:bg-orange-500 hover:text-white'}
                                                        `}
                                                    >
                                                        <span className="relative z-10">
                                                            {isEnrolled ? (progressPercent >= 100 ? 'Revoir' : 'Continuer') : 'Déployer'}
                                                        </span>
                                                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                                                    </Link>

                                                    {isEnrolled && (
                                                        <div className="w-full space-y-2">
                                                            <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                                                                <span>Infiltration</span>
                                                                <span>{Math.round(progressPercent)}%</span>
                                                            </div>
                                                            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    className={`h-full bg-gradient-to-r ${colorClass}`}
                                                                    initial={{ width: 0 }}
                                                                    animate={{ width: `${progressPercent}%` }}
                                                                    transition={{ duration: 1.5, ease: "circOut" }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-white/5 backdrop-blur-sm">
                                    <Book className="w-16 h-16 text-slate-800 mx-auto mb-6" />
                                    <p className="text-slate-600 font-black uppercase tracking-widest italic tracking-tighter">Séquence d'entraînement non initialisée.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Quests & Challenges */}
                    <div className="space-y-10">
                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 group"
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

                            <div className="relative z-10">
                                <div className="inline-flex px-4 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-[0.2em] mb-6 text-blue-400">
                                    <Zap className="w-3.5 h-3.5 mr-2 animate-pulse" /> Mission du Jour
                                </div>
                                <h3 className="text-3xl font-black mb-3 tracking-tight italic uppercase">Stratège de Fès</h3>
                                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                    Optimisez le transport de 5 conteneurs depuis Ningbo vers le Port de Dakar avec un budget réduit de 15%.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center">
                                        <div className="text-xl font-black text-amber-500">+120</div>
                                        <div className="text-[8px] uppercase font-black text-slate-600 tracking-widest mt-1">XP Bonus</div>
                                    </div>
                                    <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 text-center">
                                        <div className="text-xl font-black text-blue-400">Élite</div>
                                        <div className="text-[8px] uppercase font-black text-slate-600 tracking-widest mt-1">Niveau Badge</div>
                                    </div>
                                </div>

                                <button className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-orange-600 transition-all hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:scale-[1.02] min-h-[44px]">
                                    Engager le Combat
                                </button>
                            </div>
                        </motion.div>

                        {/* Leaderboard Preview */}
                        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase italic tracking-tight">
                                <Trophy className="w-6 h-6 text-yellow-500" /> Temple de la Renommée
                            </h3>
                            <div className="space-y-6">
                                {[
                                    { rank: 1, name: "Sultan_AlQalifa", xp: 4850, color: "text-yellow-400" },
                                    { rank: 2, name: "Elite_Trader", xp: 3920, color: "text-slate-400" },
                                    { rank: 3, name: "Cargo_Master", xp: 3200, color: "text-amber-600" }
                                ].map((player) => (
                                    <div key={player.rank} className="flex items-center gap-4 group cursor-help">
                                        <div className={`w-8 h-8 rounded-lg ${player.rank === 1 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-slate-800/50 border-white/5'} border flex items-center justify-center font-black text-xs ${player.color}`}>
                                            {player.rank}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-black text-slate-200 group-hover:text-white transition-colors uppercase tracking-tight">{player.name}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-slate-600 w-full opacity-30" />
                                                </div>
                                                <div className="text-[9px] font-black text-slate-500">{player.xp} XP</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Tools Section */}
                        <div className="bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/5">
                            <h3 className="text-xl font-black text-white mb-6 flex items-center gap-3 uppercase italic tracking-tight">
                                <Zap className="w-6 h-6 text-blue-400" /> Arsenal Tactique
                            </h3>
                            <div className="grid gap-4">
                                {[
                                    { title: "Incoterms Finder", desc: "Configuration de contrat optimale", icon: HelpCircle, color: "text-blue-400", bg: "bg-blue-400/10" },
                                    { title: "Check-list Douane", desc: "Audit documentaire complet", icon: FileCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                                    { title: "Normes Emballage", desc: "Standards de cargaison", icon: HardHat, color: "text-orange-400", bg: "bg-orange-400/10" }
                                ].map((tool, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ x: 5, backgroundColor: "rgba(255,255,255,0.02)" }}
                                        className="p-4 bg-slate-950/30 rounded-2xl border border-white/5 cursor-pointer group transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 ${tool.bg} rounded-xl ${tool.color} group-hover:scale-110 transition-transform`}>
                                                <tool.icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-black text-white uppercase tracking-wider">{tool.title}</h4>
                                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">{tool.desc}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
