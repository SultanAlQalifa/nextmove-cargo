import { useState, useEffect, useMemo } from "react";
import { academyService } from "../../services/academyService";
import { AcademyCourse, AcademyLesson, AcademyEnrollment, AcademyLessonComment } from "../../types/academy";
import { User } from "@supabase/supabase-js";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, ArrowRight, BookOpen, FileText, Download,
    Menu, X, Music, MessageCircle, CheckCircle,
    Shield, Target, Trophy, Lock, RefreshCw
} from "lucide-react";
import { showNotification } from "../../components/common/NotificationToast";
import { supabase } from "../../lib/supabase";
import CertificatePaymentModal from "../../components/academy/CertificatePaymentModal";
import { CertificateTemplate } from "../../components/academy/CertificateTemplate";

export default function LessonView() {
    const { id } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [course, setCourse] = useState<AcademyCourse | null>(null);
    const [currentLesson, setCurrentLesson] = useState<AcademyLesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeContentTab, setActiveContentTab] = useState<'about' | 'discussion' | 'resources'>('about');
    const [user, setUser] = useState<User | null>(null);
    const [comments, setComments] = useState<AcademyLessonComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<AcademyLessonComment | null>(null);

    // Quiz state
    const [lessonQuiz, setLessonQuiz] = useState<any | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [quizResult, setQuizResult] = useState<{ score: number, passed: boolean } | null>(null);
    const [submittingQuiz, setSubmittingQuiz] = useState(false);

    // Progression state
    const [enrollment, setEnrollment] = useState<AcademyEnrollment | null>(null);
    const [completedLessons, setCompletedLessons] = useState<string[]>([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCertificatePreview, setShowCertificatePreview] = useState(false);

    useEffect(() => {
        const loadCourseData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const data = await academyService.getCourseById(id);
                setCourse(data);
                // Sort lessons by order_index
                const sortedLessons = (data.academy_lessons || []).sort((a, b) => a.order_index - b.order_index);
                if (sortedLessons.length > 0) {
                    setCurrentLesson(sortedLessons[0]);
                }
            } catch (error) {
                console.error("Error loading lesson view:", error);
            } finally {
                setLoading(false);
            }
        };
        const loadUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Fetch or Create Enrollment
            if (user && id) {
                try {
                    let enrollData = await academyService.getUserEnrollment(id, user.id);
                    if (!enrollData) {
                        // Auto-enroll if not already enrolled
                        enrollData = await academyService.enrollStudent(id, user.id);
                    }
                    setEnrollment(enrollData);
                    setCompletedLessons(enrollData.progress || []);
                } catch (err) {
                    console.error("Error handling enrollment:", err);
                }
            }
        };
        loadUser();
        loadCourseData();
    }, [id]);


    useEffect(() => {
        if (currentLesson) {
            fetchLessonInteractions();
        }
    }, [currentLesson]);

    const fetchLessonInteractions = async () => {
        if (!currentLesson) return;
        try {
            const [commentsData, quizData] = await Promise.all([
                academyService.getLessonComments(currentLesson.id),
                academyService.getLessonQuiz(currentLesson.id)
            ]);
            setComments(commentsData);
            setLessonQuiz(quizData);
            setQuizResult(null); // Reset result when changing lesson
            setQuizAnswers({});
        } catch (error) {
            console.error("Error fetching interactions:", error);
        }
    };


    const handleAddComment = async () => {
        if (!user || !currentLesson || !newComment.trim()) return;
        try {
            await academyService.addLessonComment({
                lesson_id: currentLesson.id,
                user_id: user.id,
                content: newComment.trim(),
                parent_id: replyingTo?.id
            });
            setNewComment("");
            setReplyingTo(null);
            fetchLessonInteractions();
            showNotification("Succès", "Commentaire ajouté", "success");
        } catch (error) {
            console.error("Error adding comment:", error);
            showNotification("Erreur", "Impossible d'ajouter le commentaire", "error");
        }
    };

    const handleSubmitQuiz = async () => {
        if (!lessonQuiz || !user) return;

        try {
            setSubmittingQuiz(true);
            let correctCount = 0;
            lessonQuiz.academy_quiz_questions.forEach((q: any) => {
                const answerId = quizAnswers[q.id];
                const correctOpt = q.academy_quiz_options.find((o: any) => o.is_correct);
                if (answerId === correctOpt?.id) {
                    correctCount++;
                }
            });

            const score = Math.round((correctCount / lessonQuiz.academy_quiz_questions.length) * 100);
            const passed = score >= (lessonQuiz.passing_score || 80);

            setQuizResult({ score, passed });

            // Persist result
            await academyService.saveQuizAttempt({
                user_id: user.id,
                quiz_id: lessonQuiz.id,
                score,
                passed
            });

            if (passed && currentLesson) {
                showNotification("Félicitations !", `Vous avez réussi le quizz avec ${score}%`, "success");
                handleMarkLessonComplete(currentLesson.id);
            } else if (!passed) {
                showNotification("Dommage", `Votre score de ${score}% est insuffisant. Réessayez !`, "error");
            }
        } catch (error) {
            console.error("Error submitting quiz:", error);
            showNotification("Erreur", "Impossible d'enregistrer le résultat du quiz", "error");
        } finally {
            setSubmittingQuiz(false);
        }
    };

    const handleMarkLessonComplete = async (lessonId: string) => {
        if (!enrollment || completedLessons.includes(lessonId)) return;
        try {
            const updated = await academyService.updateLessonProgress(enrollment.id, lessonId);
            setCompletedLessons(updated.progress || []);
        } catch (error) {
            console.error("Error marking lesson complete:", error);
        }
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return "";

        // YouTube
        const ytMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/);
        if (ytMatch && ytMatch[1]) {
            const id = ytMatch[1].split('&')[0];
            return `https://www.youtube.com/embed/${id}`;
        }

        // Vimeo
        const vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com)\/(.+)/);
        if (vimeoMatch && vimeoMatch[1]) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }

        return url;
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Chargement de votre leçon...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900">
                <p className="text-slate-500 font-medium">Cours introuvable.</p>
                <Link to="/academy" className="mt-4 text-orange-600 font-bold hover:underline">Retour au catalogue</Link>
            </div>
        );
    }

    const lessons = useMemo(() => {
        return [...(course?.academy_lessons || [])].sort((a, b) => a.order_index - b.order_index);
    }, [course?.academy_lessons]);

    const currentIndex = currentLesson ? lessons.findIndex(l => l.id === currentLesson.id) : 0;

    const handleSelectLesson = (lesson: AcademyLesson) => {
        setCurrentLesson(lesson);
        // Scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleNext = () => {
        if (currentIndex < lessons.length - 1) {
            // Auto mark current lesson as complete when clicking Next
            if (currentLesson) {
                handleMarkLessonComplete(currentLesson.id);
            }
            setCurrentLesson(lessons[currentIndex + 1]);
        }
    };

    const isCourseCompleted = lessons.length > 0 && completedLessons.length === lessons.length;

    const handleGetCertificate = () => {
        if (!enrollment) return;
        if (enrollment.is_certificate_paid) {
            setShowCertificatePreview(true);
        } else {
            setShowPaymentModal(true);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentLesson(lessons[currentIndex - 1]);
        }
    };

    const formatName = (name: string) => {
        if (!name) return "";
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 1) return name.toUpperCase();
        const lastName = parts.pop()?.toUpperCase();
        return `${parts.join(" ")} ${lastName}`;
    };

    const generatePDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1123, 794]
            });

            const studentName = formatName(user?.user_metadata?.full_name || "Étudiant NextMove");
            const courseName = course?.title || "Formation NextMove";
            const certId = `CERT-${enrollment?.id?.slice(0, 8).toUpperCase()}`;
            const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

            // Metadata & Properties
            doc.setProperties({
                title: `Certificat - ${courseName}`,
                subject: 'Certificat de Réussite',
                author: 'NextMove Académie',
                keywords: 'certificat, logistique, nextmove',
                creator: 'NextMove Platform'
            });

            // Sanitize filename safer for all OS
            const safeName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

            // Background Image
            try {
                const bgImg = await getImageData('/assets/branding/cert_background.png');
                doc.addImage(bgImg, 'PNG', 0, 0, 1123, 794);
            } catch (e) {
                console.error("PDF Background Error:", e);
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, 1123, 794, 'F');
            }

            // Print Branding - Pushed even further up
            doc.setTextColor(30, 64, 175);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(36);
            const title1 = 'NextMove';
            const title2 = ' Académie';
            const t1Width = doc.getTextWidth(title1);
            const t2Width = doc.getTextWidth(title2);
            const totalWidth = t1Width + t2Width;
            const startX = (1123 - totalWidth) / 2;

            doc.text(title1, startX, 175);
            doc.setTextColor(249, 115, 22);
            doc.text(title2, startX + t1Width, 175);

            doc.setTextColor(156, 163, 175);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('LOGISTIQUE PREMIUM', 561, 190, { align: 'center' });

            // Content - Centered in extreme safe zone
            doc.setTextColor(15, 23, 42);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(32);
            doc.text('CERTIFICAT DE RÉUSSITE', 561, 250, { align: 'center' });

            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(16);
            doc.text('CE DOCUMENT ATTESTE QUE', 561, 280, { align: 'center' });

            doc.setTextColor(249, 115, 22);
            doc.setFont('times', 'bolditalic');
            // Dynamically adjust font size for student name
            let nameFontSize = 55;
            if (studentName.length > 20) nameFontSize = 45;
            if (studentName.length > 30) nameFontSize = 35;
            if (studentName.length > 40) nameFontSize = 25;
            doc.setFontSize(nameFontSize);
            doc.text(studentName, 561, 340, { align: 'center' });

            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(16);
            doc.text('A COMPLÉTÉ AVEC SUCCÈS LE PROGRAMME DE FORMATION', 561, 385, { align: 'center' });

            doc.setTextColor(30, 41, 59);
            doc.setFont('helvetica', 'bold');
            // Dynamically adjust font size for course name
            let courseFontSize = 26;
            if (courseName.length > 35) courseFontSize = 20;
            if (courseName.length > 50) courseFontSize = 16;
            if (courseName.length > 70) courseFontSize = 14;
            doc.setFontSize(courseFontSize);
            // Print on a single line
            doc.text(courseName.toUpperCase(), 561, 430, { align: 'center' });

            // Sceau et Signature - Pushed even higher
            try {
                const sealImg = await getImageData('/pwa-512x512.png');
                doc.addImage(sealImg, 'PNG', 290, 480, 100, 100);

                const signatureImg = await getImageData('/assets/branding/signature.png');
                doc.addImage(signatureImg, 'PNG', 670, 480, 180, 90);
            } catch (e) {
                console.error("PDF Image Error:", e);
            }

            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(1);
            doc.line(260, 580, 420, 580);
            doc.line(650, 580, 850, 580);

            doc.setTextColor(148, 163, 184);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('SCEAU OFFICIEL', 340, 592, { align: 'center' });
            doc.text('DIRECTEUR ACADÉMIQUE', 750, 592, { align: 'center' });

            // Footer Metadata - Also raised
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${certId}`, 230, 660);
            doc.text(`Délivré le : ${date}`, 561, 660, { align: 'center' });
            doc.text('NextMove Académie', 890, 660, { align: 'right' });

            doc.save(`Certificat_NextMove_${safeName}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Une erreur est survenue lors de la génération du PDF. Veuillez essayer l\'option Imprimer.');
        }
    };

    const getImageData = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = url;
        });
    };

    const currentResources = course?.academy_resources?.filter(r => r.lesson_id === currentLesson?.id) || [];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
            {/* Ambient Tactical Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            {/* Navigation Overlay - HUD Style */}
            <nav className="relative z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl px-4 lg:px-8 py-4 shrink-0">
                <div className="max-w-[1920px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/academy/dashboard"
                            className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800/50 transition-all text-slate-400 hover:text-sky-400 group"
                        >
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                    Mission Active
                                </span>
                                <h2 className="text-xs font-medium text-slate-500 truncate max-w-[150px] md:max-w-md">
                                    {course.title}
                                </h2>
                            </div>
                            <h1 className="text-sm md:text-lg font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent truncate max-w-[200px] md:max-w-xl">
                                {currentLesson?.title || "Chargement..."}
                            </h1>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Progression Plan</span>
                            <div className="flex items-center gap-3">
                                <div className="w-32 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
                                        className="h-full bg-gradient-to-r from-sky-500 to-blue-600 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                                    />
                                </div>
                                <span className="text-sm font-black text-sky-400">{Math.round((completedLessons.length / (lessons.length || 1)) * 100)}%</span>
                            </div>
                        </div>
                        {isCourseCompleted && (
                            <button
                                onClick={handleGetCertificate}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-2"
                            >
                                <Trophy className="w-4 h-4" /> Certificat
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50 text-slate-300 hover:text-sky-400 transition-colors"
                    >
                        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* Content Zone (Intelligence Depot) */}
                <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/40 pb-20">
                    <div className="max-w-5xl mx-auto p-4 lg:p-10 space-y-8">
                        {/* Player / Content Section */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 to-blue-600/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />

                            <div className="relative rounded-2xl bg-black border border-slate-800/50 overflow-hidden shadow-2xl">
                                {currentLesson?.type === "video" ? (
                                    <div className="aspect-video w-full bg-slate-900 relative">
                                        <iframe
                                            src={getEmbedUrl(currentLesson.url || "")}
                                            className="w-full h-full"
                                            title={currentLesson.title}
                                            allow="autoplay; fullscreen; picture-in-picture"
                                            allowFullScreen
                                        />
                                        <div className="absolute top-4 left-4 pointer-events-none">
                                            <div className="flex items-center gap-2 px-2 py-1 rounded bg-black/40 backdrop-blur-md border border-white/5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                                <span className="text-[10px] font-mono text-white/70 uppercase tracking-tighter italic">Tactical_Feed_{currentIndex + 1}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : currentLesson?.type === "audio" ? (
                                    <div className="p-12 md:p-20 bg-slate-900/50 flex flex-col items-center justify-center min-h-[400px]">
                                        <div className="w-24 h-24 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-8 relative">
                                            <div className="absolute inset-0 rounded-full border border-sky-500/40 animate-ping opacity-20" />
                                            <Music className="w-10 h-10 text-sky-400" />
                                        </div>
                                        <audio controls src={currentLesson?.url} className="w-full max-w-md h-10" />
                                    </div>
                                ) : currentLesson?.type === "quiz" ? (
                                    <div className="p-12 md:p-20 bg-slate-900/50 flex flex-col items-center justify-center min-h-[400px]">
                                        <Target className="w-16 h-16 text-amber-500 mb-6" />
                                        <h3 className="text-2xl font-black italic tracking-tight mb-2 uppercase">Évaluation Tactique</h3>
                                        <p className="text-slate-400 mb-8 text-center max-w-sm">Validez vos acquis pour débloquer la suite de votre progression.</p>
                                        <button
                                            onClick={() => setActiveContentTab('about')}
                                            className="px-8 py-4 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-all flex items-center gap-3"
                                        >
                                            Effectuer le test <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-12 md:p-20 flex flex-col items-center justify-center min-h-[400px] text-slate-500">
                                        <FileText className="w-16 h-16 mb-4 opacity-20" />
                                        <p className="font-bold">Intelligence File</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Lesson Details Tabs */}
                        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl backdrop-blur-sm overflow-hidden">
                            <div className="flex border-b border-slate-800/50 px-6">
                                {[
                                    { id: 'about', label: 'Dossier Intelligence', icon: BookOpen },
                                    { id: 'discussion', label: 'Briefing Team', icon: MessageCircle },
                                    { id: 'resources', label: 'Assets Tactiques', icon: RefreshCw }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveContentTab(tab.id as any)}
                                        className={`flex items-center gap-2 py-5 px-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeContentTab === tab.id ? 'text-sky-400' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        {activeContentTab === tab.id && (
                                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 md:p-8">
                                <AnimatePresence mode="wait">
                                    {activeContentTab === 'about' && (
                                        <motion.div
                                            key="about"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="prose prose-invert prose-sky max-w-none"
                                        >
                                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                                <div className="w-1 h-8 bg-sky-500 rounded-full" />
                                                {currentLesson?.title}
                                            </h2>

                                            {currentLesson?.content ? (
                                                <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} className="text-slate-300 leading-relaxed" />
                                            ) : (
                                                <p className="text-slate-400 italic">No additional content for this module.</p>
                                            )}

                                            {/* Integrated Quiz if available and tab is about */}
                                            {lessonQuiz && (
                                                <div className="mt-12 p-8 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden group/quiz">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/quiz:opacity-20 transition-opacity">
                                                        <Shield className="w-20 h-20 text-sky-500" />
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                                        <Target className="w-5 h-5 text-amber-500" />
                                                        Skill Test: {lessonQuiz.title}
                                                    </h3>

                                                    <div className="space-y-8">
                                                        {lessonQuiz.academy_quiz_questions.map((q: any, idx: number) => (
                                                            <div key={q.id} className="space-y-4">
                                                                <p className="font-bold flex items-center gap-3">
                                                                    <span className="w-6 h-6 rounded bg-slate-800 text-[10px] flex items-center justify-center font-mono border border-slate-700">{idx + 1}</span>
                                                                    {q.question_text}
                                                                </p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-9">
                                                                    {q.academy_quiz_options.map((opt: any) => (
                                                                        <button
                                                                            key={opt.id}
                                                                            onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt.id })}
                                                                            className={`p-4 rounded-xl text-left text-sm font-medium border transition-all ${quizAnswers[q.id] === opt.id ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                                                                        >
                                                                            {opt.option_text}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="mt-8 pt-8 border-t border-slate-800 flex items-center justify-between">
                                                        {quizResult && (
                                                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs uppercase ${quizResult.passed ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                                                {quizResult.passed ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                                                Score: {quizResult.score}% • {quizResult.passed ? 'Validé' : 'Échec'}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={handleSubmitQuiz}
                                                            disabled={submittingQuiz || Object.keys(quizAnswers).length < lessonQuiz.academy_quiz_questions.length}
                                                            className="ml-auto px-8 py-3 bg-white text-slate-950 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                                                        >
                                                            {submittingQuiz ? "Analyse..." : "Soumettre le Skill Test"}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeContentTab === 'discussion' && (
                                        <motion.div
                                            key="discussion"
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className="space-y-8"
                                        >
                                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                                                <textarea
                                                    value={newComment}
                                                    onChange={e => setNewComment(e.target.value)}
                                                    placeholder="Partagez votre analyse terrain..."
                                                    className="w-full bg-transparent border-none outline-none resize-none text-sm min-h-[100px]"
                                                />
                                                <div className="flex justify-end gap-3 mt-4">
                                                    <button
                                                        onClick={handleAddComment}
                                                        className="px-6 py-2 bg-sky-600 text-white rounded-lg font-bold text-xs hover:bg-sky-500 transition-colors"
                                                    >
                                                        Poster le Brief
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {comments.map(comment => (
                                                    <div key={comment.id} className="flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50">
                                                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400 overflow-hidden">
                                                            {comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} alt={comment.profiles.full_name} className="w-full h-full object-cover" /> : comment.profiles?.full_name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-bold text-sm text-slate-200">{comment.profiles?.full_name}</span>
                                                                <span className="text-[10px] font-mono text-slate-500 uppercase">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                            <p className="text-slate-400 text-sm">{comment.content}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {activeContentTab === 'resources' && (
                                        <motion.div key="resources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {currentResources.length > 0 ? currentResources.map(res => (
                                                <a
                                                    key={res.id} href={res.url} target="_blank"
                                                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 group hover:border-sky-500/50 transition-all flex items-center justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400"><FileText className="w-5 h-5" /></div>
                                                        <span className="font-bold text-sm group-hover:text-sky-400 transition-colors">{res.title}</span>
                                                    </div>
                                                    <Download className="w-4 h-4 text-slate-500 group-hover:translate-y-0.5 transition-transform" />
                                                </a>
                                            )) : (
                                                <div className="col-span-2 py-12 text-center text-slate-500 italic text-sm">Aucun asset tactique disponible pour ce module.</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Tactical Mission Sidebar */}
                <AnimatePresence>
                    {sidebarOpen && (
                        <motion.aside
                            initial={{ x: 320 }}
                            animate={{ x: 0 }}
                            exit={{ x: 320 }}
                            className="absolute lg:relative right-0 top-0 bottom-0 w-[320px] bg-slate-950/80 backdrop-blur-2xl border-l border-slate-800/50 flex flex-col shadow-2xl z-40"
                        >
                            <div className="p-6 border-b border-slate-800/50 overflow-y-auto shrink-0 flex-1">
                                <h3 className="text-[10px] uppercase font-bold tracking-[0.2em] text-sky-400 mb-4 flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Mission Syllabus
                                </h3>
                                <div className="space-y-4">
                                    {lessons.map((lesson, idx) => (
                                        <button
                                            key={lesson.id}
                                            onClick={() => handleSelectLesson(lesson)}
                                            className={`w-full group text-left p-3 rounded-xl border transition-all ${currentLesson?.id === lesson.id ? 'bg-sky-500/10 border-sky-500/50' : 'bg-slate-900/50 border-slate-800/50 hover:bg-slate-800'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[10px] font-bold shrink-0 ${completedLessons.includes(lesson.id) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : currentLesson?.id === lesson.id ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(14,165,233,0.5)]' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                                                    {completedLessons.includes(lesson.id) ? <CheckCircle className="w-3.5 h-3.5" /> : `0${idx + 1}`}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-xs font-bold truncate ${currentLesson?.id === lesson.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                                        {lesson.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] uppercase font-bold text-slate-600">{lesson.type}</span>
                                                        {currentLesson?.id === lesson.id && <span className="w-1 h-1 rounded-full bg-sky-500 animate-pulse" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Course Rewards HUD */}
                            <div className="p-6 border-t border-slate-800/50 bg-slate-900/20">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Récompense Finale</span>
                                    <Shield className={`w-4 h-4 ${isCourseCompleted ? 'text-amber-500' : 'text-slate-700'}`} />
                                </div>
                                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/50 relative overflow-hidden text-center group">
                                    <Trophy className={`w-8 h-8 mx-auto mb-2 transition-transform duration-500 ${isCourseCompleted ? 'text-amber-500 scale-110' : 'text-slate-800'}`} />
                                    <p className={`text-[10px] font-bold uppercase tracking-tighter ${isCourseCompleted ? 'text-amber-500' : 'text-slate-600'}`}>Certificat d'Excellence</p>
                                    {!isCourseCompleted && (
                                        <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Lock className="w-4 h-4 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.aside>
                    )}
                </AnimatePresence>
            </div>

            {/* Pagination HUD (Floating) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800 shadow-2xl">
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    aria-label="Leçon précédente"
                    className="p-3 rounded-xl hover:bg-slate-800 text-slate-400 transition-all disabled:opacity-20"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="px-4 py-1 flex items-center gap-3 border-x border-slate-800">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Séquence</span>
                        <span className="text-xs font-black text-sky-400">{currentIndex + 1} <span className="text-slate-600">/</span> {lessons.length}</span>
                    </div>
                </div>
                <button
                    onClick={handleNext}
                    disabled={currentIndex === lessons.length - 1}
                    aria-label="Leçon suivante"
                    className="p-3 rounded-xl bg-sky-500 text-white hover:bg-sky-400 shadow-lg shadow-sky-500/20 transition-all disabled:opacity-20 translate-x-1"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* Modals */}
            {course && enrollment && (
                <CertificatePaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        if (user) {
                            academyService.getUserEnrollment(course.id, user.id).then(data => {
                                if (data) setEnrollment(data);
                                setShowCertificatePreview(true);
                            });
                        } else {
                            setShowCertificatePreview(true);
                        }
                    }}
                    courseTitle={course.title}
                    enrollmentId={enrollment.id}
                    price={course.certificate_price}
                />
            )}

            {showCertificatePreview && course && enrollment && (
                <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-[1920px] flex justify-between items-center mb-8">
                        <h2 className="text-2xl font-black italic tracking-tight text-white flex items-center gap-3">
                            <Trophy className="w-8 h-8 text-amber-500" /> VOTRE ACCRÉDITATION ELITE
                        </h2>
                        <div className="flex gap-4">
                            <button onClick={generatePDF} className="px-6 py-3 bg-sky-600 text-white rounded-xl font-bold hover:bg-sky-500 transition-all flex items-center gap-2">
                                <FileText className="w-5 h-5" /> PDF
                            </button>
                            <button
                                onClick={() => setShowCertificatePreview(false)}
                                aria-label="Fermer l'aperçu"
                                className="p-3 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="bg-white p-1 rounded-sm shadow-[0_0_50px_rgba(255,255,255,0.1)] scale-75 md:scale-90 lg:scale-100 transition-transform">
                        <CertificateTemplate
                            studentName={user?.user_metadata?.full_name || "Étudiant Elite"}
                            courseName={course.title}
                            certifiedAt={enrollment.certified_at || new Date().toISOString()}
                            certificateId={enrollment.id.substring(0, 8).toUpperCase()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
