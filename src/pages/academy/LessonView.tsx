import { useState, useEffect, useMemo } from "react";
import { academyService } from "../../services/academyService";
import { AcademyCourse, AcademyLesson, AcademyEnrollment, AcademyLessonComment, AcademyReview } from "../../types/academy";
import { User } from "@supabase/supabase-js";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    Play, ArrowLeft, ArrowRight,
    BookOpen, FileText, Download,
    Menu, X, Music, Type,
    Heart, MessageCircle, Star, Send, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showNotification } from "../../components/common/NotificationToast";
import { supabase } from "../../lib/supabase";
import CertificatePaymentModal from "../../components/academy/CertificatePaymentModal";
import { CertificateTemplate } from "../../components/academy/CertificateTemplate";
import { Award, Printer } from "lucide-react";

export default function LessonView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [course, setCourse] = useState<AcademyCourse | null>(null);
    const [currentLesson, setCurrentLesson] = useState<AcademyLesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeContentTab, setActiveContentTab] = useState<'about' | 'discussion' | 'resources'>('about');
    const [user, setUser] = useState<User | null>(null);
    const [likesCount, setLikesCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [comments, setComments] = useState<AcademyLessonComment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<AcademyLessonComment | null>(null);
    const [submittingComment, setSubmittingComment] = useState(false);

    // Course Review state
    const [courseReviews, setCourseReviews] = useState<AcademyReview[]>([]);
    const [userRating, setUserRating] = useState(0);
    const [userReviewComment, setUserReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);

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
        if (id) {
            fetchCourseReviews();
        }
    }, [id]);

    const fetchCourseReviews = async () => {
        if (!id) return;
        try {
            const reviews = await academyService.getCourseReviews(id);
            setCourseReviews(reviews);

            // If user logged in, check if they already reviewed
            if (user) {
                const myReview = reviews.find(r => r.user_id === user.id);
                if (myReview) {
                    setUserRating(myReview.rating);
                    setUserReviewComment(myReview.comment);
                }
            }
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    const handleSaveReview = async () => {
        if (!user || userRating === 0 || !id) return;
        try {
            setSubmittingReview(true);
            await academyService.saveReview({
                course_id: id,
                user_id: user.id,
                rating: userRating,
                comment: userReviewComment
            });
            fetchCourseReviews();
            setShowReviewForm(false);
            showNotification("Merci !", "Votre avis a été enregistré.", "success");
        } catch (error) {
            console.error("Error saving review:", error);
            showNotification("Erreur", "Impossible d'enregistrer votre avis", "error");
        } finally {
            setSubmittingReview(false);
        }
    };

    useEffect(() => {
        if (currentLesson) {
            fetchLessonInteractions();
        }
    }, [currentLesson]);

    const fetchLessonInteractions = async () => {
        if (!currentLesson) return;
        try {
            const [count, commentsData, quizData] = await Promise.all([
                academyService.getLikesCount(currentLesson.id),
                academyService.getLessonComments(currentLesson.id),
                academyService.getLessonQuiz(currentLesson.id)
            ]);
            setLikesCount(count);
            setComments(commentsData);
            setLessonQuiz(quizData);
            setQuizResult(null); // Reset result when changing lesson
            setQuizAnswers({});

            if (user) {
                const { data: like } = await supabase
                    .from('academy_lesson_likes')
                    .select('id')
                    .eq('lesson_id', currentLesson.id)
                    .eq('user_id', user.id)
                    .maybeSingle();
                setIsLiked(!!like);
            }
        } catch (error) {
            console.error("Error fetching interactions:", error);
        }
    };

    const handleToggleLike = async () => {
        if (!user || !currentLesson) {
            showNotification("Compte requis", "Connectez-vous pour liker cette leçon", "info");
            return;
        }
        try {
            const liked = await academyService.toggleLike(currentLesson.id, user.id);
            setIsLiked(liked);
            setLikesCount(prev => liked ? prev + 1 : prev - 1);
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleAddComment = async () => {
        if (!user || !currentLesson || !newComment.trim()) return;
        try {
            setSubmittingComment(true);
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
        } finally {
            setSubmittingComment(false);
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

            if (passed) {
                showNotification("Félicitations !", `Vous avez réussi le quizz avec ${score}%`, "success");
                handleMarkLessonComplete(currentLesson!.id);
            } else {
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

    return (
        <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden font-sans">

            {/* Sidebar (Syllabus) */}
            <AnimatePresence mode="wait">
                {sidebarOpen && (
                    <motion.aside
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 320, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-20"
                    >
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0">
                            <button
                                onClick={() => navigate(-1)}
                                className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center text-sm font-bold gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" /> Retour
                            </button>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="lg:hidden text-slate-500"
                                title="Fermer le menu"
                                aria-label="Fermer le menu"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <h2 className="text-lg font-black text-slate-900 dark:text-white mb-2">{course.title}</h2>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-1">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${lessons.length > 0 ? (completedLessons.length / lessons.length) * 100 : 0}%` }}
                                    className="h-full bg-orange-500 rounded-full"
                                />
                            </div>
                            <p className="text-xs text-slate-500 text-right font-bold">
                                {lessons.length > 0 ? Math.round((completedLessons.length / lessons.length) * 100) : 0}% Complété
                            </p>

                            {isCourseCompleted && (
                                <button
                                    onClick={handleGetCertificate}
                                    className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 animate-pulse"
                                >
                                    <Award className="w-4 h-4" /> Obtenir mon Certificat
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 pt-4">
                            <div className="space-y-1">
                                {lessons.map((lesson) => (
                                    <button
                                        key={lesson.id}
                                        onClick={() => handleSelectLesson(lesson)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${currentLesson?.id === lesson.id
                                            ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-500/30"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${currentLesson?.id === lesson.id
                                            ? "bg-orange-500 text-white"
                                            : completedLessons.includes(lesson.id)
                                                ? "bg-green-100 text-green-600"
                                                : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                            }`}>
                                            {completedLessons.includes(lesson.id) && currentLesson?.id !== lesson.id ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <Play className={`w-3 h-3 fill-current ml-0.5 ${currentLesson?.id === lesson.id ? 'text-white' : ''}`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${currentLesson?.id === lesson.id ? "text-orange-700 dark:text-orange-400" : "text-slate-700 dark:text-slate-300"}`}>{lesson.title}</p>
                                            <p className="text-xs text-slate-500 uppercase">{lesson.type}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main key={currentLesson?.id} className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-y-auto relative">

                {/* Navbar */}
                <header className="h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
                    <div className="flex items-center gap-4">
                        {/* Toggle Menu Button */}
                        {!sidebarOpen && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Ouvrir le menu"
                                aria-label="Ouvrir le menu"
                            >
                                <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                        )}
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate lg:max-w-md">{currentLesson?.title || "Leçon"}</h1>
                        {currentLesson && (
                            <button
                                onClick={handleToggleLike}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isLiked ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}`}
                            >
                                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                                {likesCount} Likes
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-30"
                        >
                            <ArrowLeft className="w-4 h-4" /> Précédent
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentIndex === lessons.length - 1}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-bold hover:opacity-90 transition-opacity shadow-lg shadow-slate-900/10 disabled:opacity-30"
                        >
                            Suivant <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <div className="max-w-5xl mx-auto w-full p-6 lg:p-10 space-y-8">

                    {/* Video / Content Player */}
                    <div className="aspect-video w-full bg-black rounded-3xl overflow-hidden shadow-2xl relative group ring-1 ring-slate-900/5">
                        {currentLesson?.type === 'video' ? (
                            <iframe
                                src={getEmbedUrl(currentLesson.url || "https://www.youtube.com/embed/dQw4w9WgXcQ")}
                                title="Lesson Video"
                                className="w-full h-full"
                                allowFullScreen
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {currentLesson?.type === 'audio' ? <Music className="w-16 h-16 mb-4" /> : currentLesson?.type === 'pdf' ? <FileText className="w-16 h-16 mb-4" /> : <Type className="w-16 h-16 mb-4" />}
                                <p className="font-bold text-lg mb-4">{currentLesson?.title}</p>
                                {currentLesson?.url && (
                                    <a
                                        href={currentLesson.url}
                                        target="_self"
                                        onClick={() => showNotification("Info", "Le contenu est disponible en consultation directe uniquement.", "info")}
                                        className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors inline-block text-center"
                                    >
                                        Consulter le module
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Content Tabs */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 lg:p-8 shadow-sm">
                        <div className="flex items-center gap-8 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveContentTab('about')}
                                className={`flex items-center gap-2 font-bold pb-4 -mb-4.5 transition-all whitespace-nowrap ${activeContentTab === 'about' ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent'}`}
                            >
                                <BookOpen className="w-4 h-4" /> À propos
                            </button>
                            <button
                                onClick={() => setActiveContentTab('discussion')}
                                className={`flex items-center gap-2 font-bold pb-4 -mb-4.5 transition-all whitespace-nowrap ${activeContentTab === 'discussion' ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent'}`}
                            >
                                <MessageCircle className="w-4 h-4" /> Discussion ({comments.length})
                            </button>
                            <button
                                onClick={() => setActiveContentTab('resources')}
                                className={`flex items-center gap-2 font-bold pb-4 -mb-4.5 transition-all whitespace-nowrap ${activeContentTab === 'resources' ? 'text-orange-600 dark:text-orange-400 border-b-2 border-orange-500' : 'text-slate-400 hover:text-slate-900 border-b-2 border-transparent'}`}
                                title="Téléchargement restreint"
                            >
                                <Download className="w-4 h-4 cursor-not-allowed" /> (Privé)
                            </button>
                        </div>

                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            {activeContentTab === 'about' && (
                                <div className="animate-in fade-in duration-300">
                                    {currentLesson?.content ? (
                                        <div
                                            className="lesson-content-html"
                                            dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                                        />
                                    ) : (
                                        <>
                                            <h4 className="text-slate-900 dark:text-white font-bold mb-2">Description du module</h4>
                                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                Contenu de la leçon : {currentLesson?.title}.
                                                {currentLesson?.type === 'pdf' ? ' Ce module contient un document PDF à consulter.' :
                                                    currentLesson?.type === 'video' ? ' Regardez la vidéo ci-dessus pour ce module.' :
                                                        ' Consultez le texte ou l\'audio joint pour ce module.'}
                                            </p>
                                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {course.description || "Aucune description supplémentaire fournie pour ce cours."}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    {/* Quiz Section */}
                                    {lessonQuiz && (
                                        <div className="mt-12 p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 blur-3xl -mr-24 -mt-24"></div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Award className="w-6 h-6 text-orange-500" />
                                                    <h4 className="text-lg font-black text-white">{lessonQuiz.title}</h4>
                                                </div>

                                                <div className="space-y-8 mb-8">
                                                    {lessonQuiz.academy_quiz_questions.map((q: any, idx: number) => (
                                                        <div key={q.id}>
                                                            <p className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
                                                                <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-orange-400 font-mono">{idx + 1}</span>
                                                                {q.question_text}
                                                            </p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-7">
                                                                {q.academy_quiz_options.map((opt: any) => (
                                                                    <button
                                                                        key={opt.id}
                                                                        onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: opt.id })}
                                                                        className={`p-3.5 rounded-xl border transition-all text-left text-xs font-bold ${quizAnswers[q.id] === opt.id
                                                                            ? 'border-orange-500 bg-orange-500/10 text-white'
                                                                            : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                                                                            }`}
                                                                    >
                                                                        {opt.option_text}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                                                    <div>
                                                        {quizResult && (
                                                            <span className={`text-xs font-black p-2 rounded-lg ${quizResult.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                Score: {quizResult.score}% • {quizResult.passed ? 'RÉUSSI' : 'ÉCHEC'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        disabled={submittingQuiz}
                                                        onClick={handleSubmitQuiz}
                                                        className="px-8 py-3 bg-orange-600 text-white rounded-xl font-black text-xs shadow-lg shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-50"
                                                    >
                                                        {submittingQuiz ? "Vérification..." : "Valider mes réponses"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Review Section */}
                                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-slate-900 dark:text-white font-bold">Avis des étudiants</h4>
                                            <button
                                                onClick={() => setShowReviewForm(!showReviewForm)}
                                                className="text-sm font-bold text-orange-600 hover:text-orange-500 transition-colors"
                                            >
                                                {showReviewForm ? "Annuler" : "Laisser un avis"}
                                            </button>
                                        </div>

                                        {showReviewForm && (
                                            <div className="mb-8 p-6 bg-orange-50/50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 animate-in slide-in-from-top-4 duration-300">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white mb-4 text-center">Quelle note donneriez-vous à ce cours ?</p>
                                                <div className="flex justify-center gap-2 mb-6">
                                                    {[1, 2, 3, 4, 5].map((s) => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setUserRating(s)}
                                                            className={`p-2 transition-all hover:scale-110 ${userRating >= s ? 'text-orange-500' : 'text-slate-300'}`}
                                                            title={`Noter ${s} sur 5`}
                                                        >
                                                            <Star className={`w-8 h-8 ${userRating >= s ? 'fill-current' : ''}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                                <textarea
                                                    value={userReviewComment}
                                                    onChange={(e) => setUserReviewComment(e.target.value)}
                                                    placeholder="Dites-nous ce que vous en avez pensé..."
                                                    className="w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:ring-2 focus:ring-orange-500/20 text-sm mb-4 resize-none"
                                                    rows={3}
                                                />
                                                <button
                                                    disabled={submittingReview || userRating === 0}
                                                    onClick={handleSaveReview}
                                                    className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-all disabled:opacity-50"
                                                >
                                                    {submittingReview ? "Enregistrement..." : "Publier mon avis"}
                                                </button>
                                            </div>
                                        )}

                                        <div className="not-prose space-y-4">
                                            {courseReviews.length > 0 ? courseReviews.map((review) => (
                                                <div key={review.id} className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black overflow-hidden border border-slate-100 dark:border-slate-700">
                                                                {review.profiles?.avatar_url ? (
                                                                    <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    review.profiles?.full_name?.charAt(0) || 'U'
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-black text-slate-800 dark:text-slate-200">{review.profiles?.full_name || "Étudiant"}</p>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[1, 2, 3, 4, 5].map((s) => (
                                                                <Star key={s} className={`w-3 h-3 ${review.rating >= s ? 'text-orange-500 fill-current' : 'text-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    {review.comment && <p className="text-sm text-slate-600 dark:text-slate-400 pl-10 italic">"{review.comment}"</p>}
                                                </div>
                                            )) : (
                                                <div className="py-6 text-center text-slate-400">
                                                    <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm italic">Aucun avis pour le moment.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeContentTab === 'discussion' && (
                                <div className="animate-in fade-in duration-300 space-y-6">
                                    <div className="flex flex-col gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                        {replyingTo && (
                                            <div className="flex items-center justify-between px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800/30">
                                                <p className="text-xs text-orange-700 dark:text-orange-400 font-medium flex items-center gap-2">
                                                    <Send className="w-3 h-3" /> Réponse à <span className="font-bold">{replyingTo.profiles?.full_name}</span>
                                                </p>
                                                <button
                                                    onClick={() => setReplyingTo(null)}
                                                    className="text-slate-400 hover:text-slate-600"
                                                    title="Annuler la réponse"
                                                    aria-label="Annuler la réponse"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder={replyingTo ? "Écrivez votre réponse..." : "Partagez vos réflexions ou posez une question..."}
                                            className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-700 dark:text-slate-200 text-sm resize-none"
                                            rows={replyingTo ? 2 : 3}
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                disabled={submittingComment || !newComment.trim()}
                                                onClick={handleAddComment}
                                                className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                                            >
                                                {submittingComment ? "Envoi..." : <><Send className="w-4 h-4" /> {replyingTo ? "Répondre" : "Envoyer"}</>}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4">
                                        {comments.filter(c => !c.parent_id).length > 0 ? comments.filter(c => !c.parent_id).map((comment) => (
                                            <div key={comment.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:border-orange-100 dark:hover:border-orange-900/10">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-black overflow-hidden border border-slate-100 dark:border-slate-700">
                                                        {comment.profiles?.avatar_url ? (
                                                            <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            comment.profiles?.full_name?.charAt(0) || 'U'
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white capitalize">{comment.profiles?.full_name || 'Étudiant'}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">{comment.content}</p>

                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(comment);
                                                                // Focus textarea
                                                                document.querySelector('textarea')?.focus();
                                                            }}
                                                            className="mt-2 text-[10px] font-bold text-slate-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
                                                        >
                                                            <MessageCircle className="w-3 h-3" /> Répondre
                                                        </button>

                                                        {/* Replies Rendering */}
                                                        {comments.filter(c => c.parent_id === comment.id).map(reply => (
                                                            <div key={reply.id} className="mt-4 flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/50">
                                                                <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-[10px] font-black shrink-0">
                                                                    {reply.profiles?.avatar_url ? (
                                                                        <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        reply.profiles?.full_name?.charAt(0) || 'A'
                                                                    )}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className="text-[10px] font-black text-slate-900 dark:text-white">{reply.profiles?.full_name || 'Admin'}</p>
                                                                        <p className="text-[9px] text-slate-400">{new Date(reply.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
                                                                    </div>
                                                                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed italic">{reply.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="py-12 text-center text-slate-400">
                                                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                                <p className="text-sm italic">Soyez le premier à commenter ce chapitre !</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeContentTab === 'resources' && (
                                <div className="animate-in fade-in duration-300 py-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Download className="w-6 h-6 text-slate-300" />
                                    </div>
                                    <h4 className="text-slate-900 dark:text-white font-bold mb-2">Protection du contenu</h4>
                                    <p className="text-slate-500 italic max-w-xs mx-auto text-sm">
                                        Pour protéger la propriété intellectuelle de NextMove Cargo, le téléchargement direct est désactivé. Utilisez l'application pour consulter vos cours hors-ligne.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>

            {/* Certificate Payment Modal */}
            {course && enrollment && (
                <CertificatePaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        // Refresh enrollment to update paid status
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

            {/* Certificate Preview Modal (Printable) */}
            {showCertificatePreview && course && enrollment && (
                <div className="fixed inset-0 z-[100] bg-slate-900/90 flex flex-col items-center justify-center p-4 overflow-y-auto">
                    <div className="w-full max-w-5xl flex justify-between items-center mb-4 text-white">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Award className="w-6 h-6 text-orange-500" /> Votre Certificat
                        </h2>
                        <div className="flex gap-4">
                            <button
                                onClick={generatePDF}
                                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 flex items-center gap-2 print:hidden group"
                            >
                                <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" /> Télécharger (PDF)
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-6 py-2 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-100 flex items-center gap-2 print:hidden"
                            >
                                <Printer className="w-4 h-4" /> Imprimer
                            </button>
                            <button
                                onClick={() => setShowCertificatePreview(false)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors print:hidden"
                                title="Fermer l'aperçu"
                                aria-label="Fermer l'aperçu"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-1 rounded overflow-auto max-h-[85vh] shadow-2xl print:shadow-none print:max-h-none print:overflow-visible print:w-full print:h-full print:fixed print:inset-0 print:z-[200]">
                        <style>{`
                            @media print {
                                body * {
                                    visibility: hidden;
                                }
                                .certificate-container, .certificate-container * {
                                    visibility: visible;
                                }
                                .certificate-container {
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    width: 100%;
                                    height: 100%;
                                    margin: 0;
                                    padding: 0;
                                    transform: scale(1) !important;
                                }
                                /* Hide browser header/footer if possible (depends on browser) */
                                @page {
                                    margin: 0;
                                    size: landscape;
                                }
                            }
                        `}</style>
                        <div className="certificate-container transform scale-[0.6] md:scale-[0.8] lg:scale-100 origin-top-left">
                            <CertificateTemplate
                                studentName={user?.user_metadata?.full_name || "Étudiant"}
                                courseName={course.title}
                                certifiedAt={enrollment.certified_at || new Date().toISOString()}
                                certificateId={enrollment.certificate_payment_id || enrollment.id}
                            />
                        </div>
                    </div>
                    <p className="text-slate-400 mt-4 text-sm print:hidden">Astuce: Dans les options d'impression, choisissez "Enregistrer au format PDF" et cochez "Graphiques d'arrière-plan".</p>
                </div>
            )}
        </div>
    );
}
