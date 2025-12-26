import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    Book, Play, Zap, Shield, Sword, Target, Trophy, Flame, Star
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans p-4 lg:p-8">
            {/* Gladiator HUD */}
            <div className="max-w-7xl mx-auto space-y-8">

                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-orange-500/5 border border-white/50 dark:border-slate-700 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Trophy className="w-64 h-64 text-yellow-500" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg ring-4 ring-yellow-500/20">
                                <Sword className="w-10 h-10 text-white animate-pulse" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Votre Rang</div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic">{stats.rank}</h1>

                                <div className="mt-3 flex items-center gap-3">
                                    <div className="w-48 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stats.xp / stats.nextRank) * 100}%` }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">{stats.xp} / {stats.nextRank} XP</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex flex-col items-center border border-orange-100 dark:border-orange-500/30">
                                <Flame className="w-6 h-6 text-orange-500 mb-1" />
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.streak}</span>
                                <span className="text-[10px] font-bold text-orange-600 uppercase">Jours Streak</span>
                            </div>
                            <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex flex-col items-center border border-blue-100 dark:border-blue-500/30">
                                <Trophy className="w-6 h-6 text-blue-500 mb-1" />
                                <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.battlesWon}</span>
                                <span className="text-[10px] font-bold text-blue-600 uppercase">Victoires</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Arena Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Training Grounds (Courses) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Book className="w-6 h-6" /> Terrain d'Entraînement
                            </h2>
                            <button className="text-sm font-bold text-blue-500 hover:underline">Voir tout le catalogue</button>
                        </div>

                        <div className="grid gap-4">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-24 bg-white dark:bg-slate-800 animate-pulse rounded-2xl border border-slate-100 dark:border-slate-700" />
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
                                            whileHover={{ scale: 1.01 }}
                                            className={`group relative p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all border border-slate-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-900 overflow-hidden`}
                                        >
                                            <div className={`absolute top-0 bottom-0 left-0 w-2 bg-gradient-to-b ${colorClass}`} />

                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-4">
                                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center text-white shadow-lg overflow-hidden`}>
                                                        {course.cover_image_url ? (
                                                            <img src={course.cover_image_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Icon className="w-6 h-6" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                            {course.title}
                                                        </h3>
                                                        <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                                                            <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {lessonsCount} Leçons</span>
                                                            <span>•</span>
                                                            <span className="font-bold text-orange-600">{course.category}</span>
                                                            {course.rating && course.rating > 0 && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1 text-yellow-500">
                                                                        <Star className="w-3 h-3 fill-current" /> {course.rating.toFixed(1)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Link to={`/academy/lesson/${course.id}`} className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all text-center ${isEnrolled ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 shadow-slate-900/20'}`}>
                                                    {isEnrolled ? (progressPercent >= 100 ? 'Revoir' : 'Reprendre') : 'Commencer'}
                                                </Link>
                                            </div>

                                            {/* Progress Bar */}
                                            {isEnrolled && (
                                                <div className="mt-4 space-y-1">
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <motion.div
                                                            className={`h-full bg-gradient-to-r ${colorClass}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${progressPercent}%` }}
                                                            transition={{ duration: 1, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-right font-bold text-slate-400">{Math.round(progressPercent)}% Complété</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <Book className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-medium">Aucun cours disponible pour le moment.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Quests & Challenges */}
                    <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-50" />

                            <div className="relative z-10">
                                <div className="inline-flex px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold uppercase tracking-wider mb-4">
                                    <Zap className="w-3 h-3 mr-1 text-yellow-400" /> Défi du Jour
                                </div>
                                <h3 className="text-2xl font-black mb-2">Maître Négociateur</h3>
                                <p className="text-indigo-200 text-sm mb-6">
                                    Réussissez le quiz "Psychologie du Vendeur Chinois" avec 100% de réussite.
                                </p>

                                <div className="flex items-center justify-between mb-6">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-yellow-400">+50</div>
                                        <div className="text-[10px] uppercase font-bold text-white/50">XP Gain</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-cyan-400">Rare</div>
                                        <div className="text-[10px] uppercase font-bold text-white/50">Badge</div>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-white text-indigo-900 rounded-xl font-black hover:scale-105 transition-transform">
                                    Accepter le Défi
                                </button>
                            </div>
                        </div>

                        {/* Leaderboard Preview */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-red-500" /> Top Gladiateurs
                            </h3>
                            <div className="space-y-4">
                                {[1, 2, 3].map((pos) => (
                                    <div key={pos} className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${pos === 1 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                                            {pos}
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                                        <div className="flex-1">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">Gladiator_{pos}</div>
                                            <div className="text-xs text-slate-500">2,450 XP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
