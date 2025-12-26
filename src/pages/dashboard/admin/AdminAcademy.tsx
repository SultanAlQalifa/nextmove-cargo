import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Book, Users, Plus, Search, MoreVertical,
    Award, Clock, CheckCircle, Edit, Trash,
    GraduationCap, Video, Music, Image, CloudUpload,
    FileText, Type, ArrowLeft, Save, Eye, Bell,
    Layout, MessageSquare, ChevronRight, Globe, GripVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { showNotification } from "../../../components/common/NotificationToast";
import { supabase } from "../../../lib/supabase";
import { academyService } from "../../../services/academyService";
import { AcademyCourse } from "../../../types/academy";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';

export default function AdminAcademy() {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

    const [activeCourseData, setActiveCourseData] = useState<any>({
        title: "",
        subtitle: "",
        description: "",
        category: "E-commerce",
        coverImage: "",
        lessonsList: []
    });

    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [newLessonType, setNewLessonType] = useState<'video' | 'audio' | 'pdf' | 'text'>('text');
    const [newLessonUrl, setNewLessonUrl] = useState("");
    const [newLessonFileName, setNewLessonFileName] = useState<string | null>(null);
    const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);
    const [editingLessonData, setEditingLessonData] = useState<{ title: string, type: string, url: string, fileName?: string } | null>(null);
    const [dragActiveZone, setDragActiveZone] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

    // Dynamic Data from Supabase
    const [courses, setCourses] = useState<AcademyCourse[]>([]);

    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [reviews, setReviews] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [emailSettings, setEmailSettings] = useState<any>({
        certificate: { subject: '', body: '' },
        reminder: { subject: '', body: '' }
    });
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const [replyContent, setReplyContent] = useState("");
    const [isLoadingSettings, setIsLoadingSettings] = useState(false);
    const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

    useEffect(() => {
        loadCourses();
        loadEnrollments();
        loadReviews();
        loadComments();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await academyService.getAcademySettings();
            const cert = settings.find(s => s.key === 'academy_email_certificate');
            const rem = settings.find(s => s.key === 'academy_email_reminder');

            setEmailSettings({
                certificate: cert ? cert.value : { subject: '', body: '' },
                reminder: rem ? rem.value : { subject: '', body: '' }
            });
        } catch (error) {
            console.error("Error loading academy settings:", error);
        }
    };

    const loadCourses = async () => {
        try {
            setLoading(true);
            const data = await academyService.getCourses();
            setCourses(data);
        } catch (error) {
            console.error("Error loading courses:", error);
            showNotification("Erreur", "Impossible de charger les cours.", "error");
        } finally {
            setLoading(false);
        }
    };

    const loadEnrollments = async () => {
        try {
            const data = await academyService.getEnrollments();
            if (data) {
                setEnrollments(data);
            }
        } catch (error) {
            console.error("Error loading enrollments:", error);
        }
    };

    const loadReviews = async () => {
        try {
            const data = await academyService.getAllReviews();
            if (data) {
                setReviews(data);
            }
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    };

    const loadComments = async () => {
        try {
            const data = await academyService.getAdminComments();
            if (data) {
                setComments(data);
            }
        } catch (error) {
            console.error("Error loading comments:", error);
        }
    };

    const handleInitCreateCourse = () => {
        setEditingCourseId(null);
        setActiveCourseData({
            title: "",
            subtitle: "",
            description: "",
            category: "E-commerce",
            coverImage: "",
            status: "draft",
            lessonsList: [],
            certificate_price: 5000
        });
        setCurrentView('editor');
    };

    const handleInitEditCourse = (course: any) => {
        setEditingCourseId(course.id);
        // Map academy_lessons to lessonsList for internal state consistency
        setActiveCourseData({
            ...course,
            title: course.title,
            lessonsList: course.academy_lessons || [],
            coverImage: course.cover_image_url || "",
            students: course.students || 0,
            rating: course.rating || 0,
            certificate_price: course.certificate_price || 5000
        });
        setCurrentView('editor');
    };


    const handleSaveEmailSettings = async () => {
        try {
            setIsLoadingSettings(true);
            await academyService.updateAcademySetting('academy_email_certificate', emailSettings.certificate);
            await academyService.updateAcademySetting('academy_email_reminder', emailSettings.reminder);
            showNotification("Succès", "Paramètres emails mis à jour.", "success");
        } catch (error) {
            console.error("Error saving settings:", error);
            showNotification("Erreur", "Impossible de sauvegarder les paramètres.", "error");
        } finally {
            setIsLoadingSettings(false);
        }
    };

    const handleReplySubmit = async () => {
        if (!replyingTo || !replyContent.trim()) return;

        try {
            // Re-using addLessonComment as it handles parent_id in the DB now
            await academyService.addLessonComment({
                lesson_id: replyingTo.lesson_id,
                user_id: (await supabase.auth.getUser()).data.user?.id,
                content: replyContent,
                parent_id: replyingTo.id
            });
            showNotification("Succès", "Réponse envoyée.", "success");
            setReplyingTo(null);
            setReplyContent("");
            loadComments();
        } catch (error) {
            console.error("Error replying to comment:", error);
            showNotification("Erreur", "Impossible d'envoyer la réponse.", "error");
        }
    };

    const handleOpenQuizEditor = async (lesson: any) => {
        if (!lesson.id) {
            showNotification("Info", "Veuillez d'abord enregistrer le cours pour activer les quiz.", "info");
            return;
        }
        setIsLoadingQuiz(true);
        setIsQuizModalOpen(true);
        try {
            const quiz = await academyService.getLessonQuiz(lesson.id);
            setActiveQuiz(quiz || {
                lesson_id: lesson.id,
                title: `Quizz : ${lesson.title}`,
                passing_score: 80,
                questions: []
            });
        } catch (error) {
            console.error("Error loading quiz:", error);
            showNotification("Erreur", "Impossible de charger le quizz.", "error");
        } finally {
            setIsLoadingQuiz(false);
        }
    };

    const handleSaveQuiz = async () => {
        try {
            setIsLoadingQuiz(true);
            await academyService.saveQuiz(activeQuiz);
            showNotification("Succès", "Quizz enregistré !", "success");
            setIsQuizModalOpen(false);
        } catch (error) {
            console.error("Error saving quiz:", error);
            showNotification("Erreur", "Impossible d'enregistrer le quizz.", "error");
        } finally {
            setIsLoadingQuiz(false);
        }
    };

    const handleAddQuizQuestion = () => {
        const newQuestion = {
            id: `temp_${Date.now()}`,
            question_text: "",
            order_index: activeQuiz.questions.length,
            options: [
                { option_text: "Option 1", is_correct: true, order_index: 0 },
                { option_text: "Option 2", is_correct: false, order_index: 1 }
            ]
        };
        setActiveQuiz({ ...activeQuiz, questions: [...activeQuiz.questions, newQuestion] });
    };

    const handleIssueCertificate = async (enrollmentId: string) => {
        try {
            await academyService.issueCertificate(enrollmentId);
            showNotification("Succès", "Certificat délivré et envoyé par email !", "success");
            await loadEnrollments();
            setActiveStudentMenu(null);
        } catch (error) {
            console.error("Error issuing certificate:", error);
            showNotification("Erreur", "Impossible de délivrer le certificat.", "error");
        }
    };

    const handleNotifyStudent = async (enrollment: any) => {
        try {
            await academyService.sendReminder(enrollment.id);
            showNotification("Notification", `Rappel envoyé à ${enrollment.profiles?.full_name} pour le cours "${enrollment.academy_courses?.title}".`, "info");
            await loadEnrollments(); // Optional: refresh to show potential last_reminder_sent_at update if displayed
            setActiveStudentMenu(null);
        } catch (error) {
            console.error("Error sending reminder:", error);
            showNotification("Erreur", "Impossible d'envoyer le rappel.", "error");
        }
    };

    const handleCourseMenu = (id: string) => {
        setActiveCourseMenu(activeCourseMenu === id ? null : id);
        setActiveStudentMenu(null);
    };

    const handleStudentMenu = (id: number) => {
        setActiveStudentMenu(activeStudentMenu === id ? null : id);
        setActiveCourseMenu(null);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData("text/plain", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropLessonItems = (e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
        if (sourceIndex === targetIndex) return;

        const newList = [...activeCourseData.lessonsList];
        const [movedItem] = newList.splice(sourceIndex, 1);
        newList.splice(targetIndex, 0, movedItem);

        // Update order_index for each item
        const updatedList = newList.map((item, idx) => ({
            ...item,
            order_index: idx
        }));

        setActiveCourseData((prev: any) => ({
            ...prev,
            lessonsList: updatedList
        }));
    };

    const handleAddLesson = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newLessonTitle.trim() || !newLessonUrl.trim()) {
            showNotification("Info", "Ajoutez un contenu (fichier ou lien) avant de valider ce chapitre.", "info");
            return;
        }

        const newLesson = {
            id: Date.now(),
            title: newLessonTitle.trim(),
            type: newLessonType,
            url: newLessonUrl.trim(),
            fileName: newLessonFileName
        };

        setActiveCourseData((prev: any) => ({
            ...prev,
            lessonsList: [...(prev.lessonsList || []), newLesson]
        }));

        setNewLessonTitle("");
        setNewLessonUrl("");
        setNewLessonFileName(null);
        setNewLessonType('text');
        showNotification("Succès", "Leçon ajoutée au programme !", "success");
    };

    const handleSmartSave = async () => {
        // If there is a draft lesson (title AND content present), add it first
        let currentLessons = [...(activeCourseData.lessonsList || [])];

        if (newLessonTitle.trim() && newLessonUrl.trim()) {
            const newLesson = {
                id: Date.now().toString(), // Temporary ID
                title: newLessonTitle.trim(),
                type: newLessonType,
                url: newLessonUrl.trim(),
                fileName: newLessonFileName
            };

            currentLessons.push(newLesson);

            // Clear inputs
            setNewLessonTitle("");
            setNewLessonUrl("");
            setNewLessonFileName(null);
            setNewLessonType('text');
            showNotification("Leçon ajoutée automatiquement", "Le chapitre en cours a été validé.", "info");
        }

        // Now save the course with updated data
        if (!activeCourseData.title.trim()) {
            showNotification("Erreur", "Le titre du cours est obligatoire.", "error");
            return;
        }

        try {
            setSaving(true);
            await academyService.saveCourse(
                {
                    ...activeCourseData,
                    cover_image_url: activeCourseData.coverImage
                },
                currentLessons
            );

            showNotification("Succès", editingCourseId ? "Cours et chapitres sauvegardés !" : "Nouveau cours créé !", "success");



            await loadCourses();
            setActiveTab('courses');
            setCurrentView('dashboard');
        } catch (error) {
            console.error("Error in Smart Save:", error);
            showNotification("Erreur", "Impossible d'enregistrer le cours.", "error");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCourse = async (courseId: string, title: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le cours "${title}" ?`)) return;

        try {
            await academyService.deleteCourse(courseId);
            showNotification("Supprimé", "Le cours a été retiré de l'académie.", "info");
            await loadCourses();
        } catch (error) {
            console.error("Error deleting course:", error);
            showNotification("Erreur", "Impossible de supprimer le cours.", "error");
        } finally {
            setActiveCourseMenu(null);
        }
    };

    const handleQuickStatusUpdate = async (courseId: string, newStatus: AcademyCourse['status']) => {
        try {
            await academyService.updateCourseStatus(courseId, newStatus);
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: newStatus } : c));
            showNotification("Statut mis à jour", "Le statut du cours a été modifié avec succès.", "success");
        } catch (error) {
            console.error("Error updating status:", error);
            showNotification("Erreur", "Impossible de mettre à jour le statut.", "error");
        }
    };

    const handleToggleCourseSelection = (courseId: string) => {
        setSelectedCourseIds(prev =>
            prev.includes(courseId)
                ? prev.filter(id => id !== courseId)
                : [...prev, courseId]
        );
    };

    const handleToggleAllSelection = () => {
        if (selectedCourseIds.length === courses.length) {
            setSelectedCourseIds([]);
        } else {
            setSelectedCourseIds(courses.map(c => c.id));
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedCourseIds.length) return;
        if (!window.confirm(`Voulez-vous vraiment supprimer les ${selectedCourseIds.length} cours sélectionnés ?`)) return;

        try {
            setLoading(true);
            await academyService.deleteCourses(selectedCourseIds);
            showNotification("Succès", `${selectedCourseIds.length} cours ont été supprimés.`, "info");
            setSelectedCourseIds([]);
            await loadCourses();
        } catch (error) {
            console.error("Bulk delete error:", error);
            showNotification("Erreur", "Impossible de supprimer certains cours.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkStatusUpdate = async (status: AcademyCourse['status']) => {
        if (!selectedCourseIds.length) return;

        try {
            setLoading(true);
            await academyService.updateCoursesStatus(selectedCourseIds, status);
            showNotification("Succès", "Statuts mis à jour pour les cours sélectionnés.", "success");
            setSelectedCourseIds([]);
            await loadCourses();
        } catch (error) {
            console.error("Bulk status update error:", error);
            showNotification("Erreur", "Impossible de mettre à jour les statuts.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditLesson = (idx: number, lesson: any) => {
        setEditingLessonIndex(idx);
        setEditingLessonData({
            title: lesson.title,
            type: lesson.type,
            url: lesson.url || ""
        });
    };

    const handleSaveLesson = (idx: number) => {
        if (!editingLessonData?.title.trim()) return;

        const updatedList = [...activeCourseData.lessonsList];
        updatedList[idx] = {
            ...updatedList[idx],
            title: editingLessonData.title.trim(),
            type: editingLessonData.type,
            url: editingLessonData.url.trim()
        };

        setActiveCourseData((prev: any) => ({
            ...prev,
            lessonsList: updatedList
        }));

        setEditingLessonIndex(null);
        setEditingLessonData(null);
        showNotification("Mis à jour", "L'étape a été modifiée.", "success");
    };

    const handleDeleteLesson = (idx: number) => {
        const updatedList = activeCourseData.lessonsList.filter((_: any, i: number) => i !== idx);
        setActiveCourseData((prev: any) => ({
            ...prev,
            lessonsList: updatedList
        }));
        showNotification("Supprimé", "L'étape a été retirée.", "info");
    };

    const handleDrag = (e: React.DragEvent, zone: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActiveZone(zone);
        } else if (e.type === "dragleave") {
            setDragActiveZone(null);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleFilesUpload = async (files: FileList | File[], zone: 'cover' | 'newLesson' | 'editLesson') => {
        try {
            setUploading(true);
            const fileArray = Array.from(files);

            if (zone === 'cover' && fileArray[0]) {
                const { url } = await academyService.uploadAsset(fileArray[0], 'cover');
                setActiveCourseData({ ...activeCourseData, coverImage: url });
                showNotification("Image ajoutée", "Image de couverture mise à jour", "success");
            } else if (zone === 'newLesson') {
                for (let i = 0; i < fileArray.length; i++) {
                    const file = fileArray[i];
                    const result = await academyService.uploadAsset(file, 'lesson');

                    // Better type detection: MIME + Extension
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    let type: 'video' | 'audio' | 'pdf' | 'text' = 'text';

                    if (file.type.includes('video') || ['mp4', 'mov', 'webm'].includes(ext || '')) type = 'video';
                    else if (file.type.includes('audio') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext || '')) type = 'audio';
                    else if (file.type.includes('pdf') || ext === 'pdf') type = 'pdf';

                    // Use typed title if it's the first file and title is not empty
                    let title = file.name.split('.').slice(0, -1).join('.') || file.name;
                    if (i === 0 && newLessonTitle.trim()) {
                        title = newLessonTitle.trim();
                        setNewLessonTitle(""); // Clear only if used
                    }

                    const newLesson = {
                        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        title: title,
                        type: type,
                        url: result.url,
                        fileName: result.fileName
                    };

                    setActiveCourseData((prev: any) => ({
                        ...prev,
                        lessonsList: [...(prev.lessonsList || []), newLesson]
                    }));
                }
                showNotification("Fichiers ajoutés", `${fileArray.length} chapitre(s) ajouté(s) au programme`, "success");
            } else if (zone === 'editLesson' && fileArray[0]) {
                const { url, fileName } = await academyService.uploadAsset(fileArray[0], 'lesson');
                setEditingLessonData((prev) => prev ? { ...prev, url: url, fileName: fileName } : null);
                showNotification("Fichier remplacé", "Le contenu a été mis à jour.", "success");
            }
        } catch (error) {
            console.error("Upload error:", error);
            showNotification("Erreur", "Impossible d'uploader certain(s) fichier(s).", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent, zone: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActiveZone(null);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesUpload(e.dataTransfer.files, zone as any);
        }
    };

    const [activeTab, setActiveTab] = useState<'courses' | 'students' | 'reviews' | 'interactions' | 'emails'>('courses');
    const [activeCourseMenu, setActiveCourseMenu] = useState<string | null>(null);
    const [activeStudentMenu, setActiveStudentMenu] = useState<number | null>(null);

    if (currentView === 'editor') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 -m-8 p-8">
                {/* Editor Header */}
                <div className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentView('dashboard')}
                            className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all text-slate-500"
                            title="Retour"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                {editingCourseId ? 'Modifier le cours' : 'Nouveau cours'}
                            </h2>
                            <p className="text-sm text-slate-500">Conception de votre programme de formation</p>
                        </div>
                    </div>
                    {/* Actions moved to bottom */}
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Course Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                <Layout className="w-5 h-5 text-orange-500" /> Informations générales
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Titre du cours</label>
                                    <input
                                        value={activeCourseData.title}
                                        onChange={(e) => setActiveCourseData({ ...activeCourseData, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white"
                                        placeholder="Ex: L'Arsenal du Sourcing 🇹🇷"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sous-titre (Courte accroche)</label>
                                    <input
                                        value={activeCourseData.subtitle}
                                        onChange={(e) => setActiveCourseData({ ...activeCourseData, subtitle: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white"
                                        placeholder="Ex: Maîtrisez l'importation de A à Z..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Catégorie</label>
                                        <select
                                            title="Catégorie"
                                            value={activeCourseData.category}
                                            onChange={(e) => setActiveCourseData({ ...activeCourseData, category: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-white"
                                        >
                                            <option>Sourcing</option>
                                            <option>Logistique</option>
                                            <option>E-commerce</option>
                                            <option>Marketing</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Prix du Certificat (XOF)</label>
                                        <input
                                            type="number"
                                            value={activeCourseData.certificate_price}
                                            onChange={(e) => setActiveCourseData({ ...activeCourseData, certificate_price: parseInt(e.target.value) || 0 })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white"
                                            placeholder="5000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Statut de visibilité</label>
                                        <select
                                            title="Statut de visibilité"
                                            value={activeCourseData.status}
                                            onChange={(e) => setActiveCourseData({ ...activeCourseData, status: e.target.value as any })}
                                            className={`w-full h-[48px] px-4 rounded-xl font-bold text-sm outline-none transition-all ${activeCourseData.status === 'published'
                                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-600'
                                                : 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30 text-orange-600'
                                                }`}
                                        >
                                            <option value="draft">Mode Brouillon</option>
                                            <option value="published">Publier le cours</option>
                                            <option value="archived">Archiver</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description complète</label>
                                    <textarea
                                        rows={4}
                                        value={activeCourseData.description}
                                        onChange={(e) => setActiveCourseData({ ...activeCourseData, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white resize-none"
                                        placeholder="Décrivez ce que les étudiants vont apprendre..."
                                    />
                                </div>

                                {/* Cover Image Section */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Image de couverture</label>
                                    {activeCourseData.coverImage ? (
                                        <div className="relative w-full h-48 rounded-xl overflow-hidden group border border-slate-200 dark:border-slate-700">
                                            <img src={activeCourseData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={() => setActiveCourseData({ ...activeCourseData, coverImage: "" })}
                                                    className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash className="w-4 h-4" /> Supprimer
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`w-full h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${dragActiveZone === 'cover'
                                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10'
                                                : 'border-slate-300 dark:border-slate-600 hover:border-orange-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                            onDragEnter={(e) => handleDrag(e, 'cover')}
                                            onDragLeave={(e) => handleDrag(e, 'cover')}
                                            onDragOver={(e) => handleDrag(e, 'cover')}
                                            onDrop={(e) => handleDrop(e, 'cover')}
                                            onClick={() => document.getElementById('cover-upload')?.click()}
                                        >
                                            <input
                                                title="Upload cover image"
                                                type="file"
                                                id="cover-upload"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files.length > 0) {
                                                        handleFilesUpload(e.target.files, 'cover');
                                                    }
                                                }}
                                            />
                                            {uploading ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <p className="text-sm font-bold text-orange-600">Chargement...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400">
                                                        <Image className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500">Glisser une image ou cliquer pour parcourir</p>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Curriculum section */}
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
                            <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                <MessageSquare className="w-5 h-5 text-orange-500" /> Programme du cours
                            </h3>

                            <div className="space-y-3">
                                {activeCourseData.lessonsList.map((lesson: any, idx: number) => {
                                    const Icon = lesson.type === 'video' ? Video :
                                        lesson.type === 'audio' ? Music :
                                            lesson.type === 'pdf' ? FileText : Type;

                                    return (
                                        <div
                                            key={idx}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, idx)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDropLessonItems(e, idx)}
                                            className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3 group cursor-move active:scale-[0.98] transition-all hover:border-orange-200 dark:hover:border-orange-900/40 shadow-sm hover:shadow-md"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-300 group-hover:text-orange-400 transition-colors">
                                                    <GripVertical className="w-4 h-4 cursor-grab active:cursor-grabbing" />
                                                </div>
                                                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 text-orange-600 flex items-center justify-center font-bold text-sm shadow-sm border border-slate-100 dark:border-slate-700">
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                {editingLessonIndex === idx ? (
                                                    <div className="flex-1 space-y-2">
                                                        <input
                                                            autoFocus
                                                            title="Titre de la leçon"
                                                            placeholder="Titre de la leçon"
                                                            value={editingLessonData?.title}
                                                            onChange={(e) => setEditingLessonData(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                            className="w-full bg-white dark:bg-slate-800 border-orange-500 border rounded-lg px-2 py-1 outline-none text-slate-700 dark:text-slate-200 font-bold"
                                                        />

                                                        {/* Clean Edit Mode */}
                                                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg">
                                                            <select
                                                                title="Type de contenu"
                                                                value={editingLessonData?.type}
                                                                onChange={(e) => setEditingLessonData(prev => prev ? { ...prev, type: e.target.value as any } : null)}
                                                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] text-orange-600 outline-none"
                                                            >
                                                                <option value="video">VIDEO</option>
                                                                <option value="audio">AUDIO</option>
                                                                <option value="pdf">PDF</option>
                                                                <option value="text">TEXT</option>
                                                            </select>
                                                            <span className="truncate max-w-[200px]">{editingLessonData?.fileName || editingLessonData?.url || 'Aucun contenu'}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex-1">
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{lesson.title}</p>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                                                            <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${lesson.type === 'video' ? 'bg-blue-100 text-blue-600' :
                                                                lesson.type === 'audio' ? 'bg-purple-100 text-purple-600' :
                                                                    lesson.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'
                                                                }`}>{lesson.type}</span>
                                                            <span className="truncate max-w-[250px]">{lesson.fileName || (lesson.url ? 'Lien externe' : 'Pas de contenu')}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleOpenQuizEditor(lesson)}
                                                        className="p-1 px-2 text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition-colors"
                                                        title="Gérer le Quizz"
                                                    >
                                                        Quizz
                                                    </button>

                                                    {/* View Button */}
                                                    {lesson.url && (
                                                        <a
                                                            href={lesson.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-1 text-slate-400 hover:text-orange-500 rounded-md transition-colors"
                                                            title="Visualiser le contenu"
                                                        >
                                                            <Globe className="w-4 h-4" />
                                                        </a>
                                                    )}

                                                    {editingLessonIndex === idx ? (
                                                        <button onClick={() => handleSaveLesson(idx)} className="p-1 text-green-500 hover:bg-green-50 rounded-md" title="Enregistrer">
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleEditLesson(idx, lesson)} className="p-1 text-slate-400 hover:text-blue-500 rounded-md" title="Modifier">
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteLesson(idx)}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                                title="Supprimer définitivement"
                                                            >
                                                                <Trash className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                <form onSubmit={handleAddLesson} className="mt-8 space-y-4">
                                    {/* 1. Title Input (First) */}
                                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                                        <input
                                            value={newLessonTitle}
                                            onChange={(e) => setNewLessonTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddLesson();
                                                }
                                            }}
                                            placeholder="Titre de la leçon (ex: Introduction au Sourcing)..."
                                            className="w-full py-4 bg-transparent outline-none text-lg font-bold text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    {/* 2. Type & Content Toggle */}
                                    <div className="flex gap-4">
                                        <select
                                            title="Type de contenu"
                                            value={newLessonType}
                                            onChange={(e) => setNewLessonType(e.target.value as any)}
                                            className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-orange-500/20"
                                        >
                                            <option value="text">Texte</option>
                                            <option value="video">Vidéo</option>
                                            <option value="audio">Audio</option>
                                            <option value="pdf">Document PDF</option>
                                        </select>

                                        {newLessonType === 'video' && (
                                            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                                                <input
                                                    value={newLessonUrl}
                                                    onChange={(e) => setNewLessonUrl(e.target.value)}
                                                    placeholder="Coller lien YouTube ou Vimeo (ex: https://youtube.com/watch?v=...)"
                                                    className="w-full py-3 bg-transparent outline-none text-sm font-medium text-slate-700 dark:text-slate-300"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div
                                        className={`relative w-full h-40 rounded-3xl border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 group cursor-pointer overflow-hidden ${dragActiveZone === 'newLesson'
                                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 scale-[1.02] shadow-2xl shadow-orange-500/20'
                                            : newLessonUrl ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-orange-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                        onDragEnter={(e) => handleDrag(e, 'newLesson')}
                                        onDragLeave={(e) => handleDrag(e, 'newLesson')}
                                        onDragOver={(e) => handleDrag(e, 'newLesson')}
                                        onDrop={(e) => handleDrop(e, 'newLesson')}
                                        onClick={() => document.getElementById('lesson-upload')?.click()}
                                    >
                                        <input
                                            title="Upload lesson content"
                                            type="file"
                                            id="lesson-upload"
                                            className="hidden"
                                            multiple
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files.length > 0) {
                                                    handleFilesUpload(e.target.files, 'newLesson');
                                                }
                                            }}
                                        />

                                        {newLessonUrl ? (
                                            <div className="text-center z-10 animate-fade-in relative w-full">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setNewLessonUrl("");
                                                        setNewLessonFileName(null);
                                                        setNewLessonType('text');
                                                    }}
                                                    className="absolute top-0 right-0 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                    title="Supprimer le fichier"
                                                >
                                                    <Trash className="w-5 h-5" />
                                                </button>

                                                <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-xl mb-3 mx-auto w-fit">
                                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                                </div>
                                                <h4 className="text-xl font-black text-slate-800 dark:text-white mb-1">
                                                    Fichier prêt !
                                                </h4>
                                                <p className="font-mono text-sm text-slate-500 bg-white/50 dark:bg-black/20 px-3 py-1 rounded-lg inline-block mb-4">
                                                    {newLessonFileName}
                                                </p>

                                                <div className="flex justify-center gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            document.getElementById('lesson-upload')?.click();
                                                        }}
                                                        className="text-xs font-bold text-slate-500 hover:text-orange-500 underline"
                                                    >
                                                        Changer le fichier
                                                    </button>
                                                </div>

                                                <p className="text-xs text-green-600 font-bold mt-4 uppercase tracking-widest">
                                                    CLIQUEZ SUR "AJOUTER" CI-DESSOUS
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {uploading ? (
                                                    <div className="text-center z-10 space-y-4">
                                                        <div className="w-16 h-16 border-8 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                                        <h4 className="text-xl font-black text-orange-600 animate-pulse">Upload en cours...</h4>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Animated Background Gradient Pulse */}
                                                        <div className={`absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${dragActiveZone === 'newLesson' ? 'animate-pulse opacity-100' : ''}`} />

                                                        {/* Big Icon */}
                                                        <div className={`p-6 rounded-full bg-white dark:bg-slate-800 shadow-xl shadow-slate-200 dark:shadow-slate-900 mb-2 transition-transform duration-300 ${dragActiveZone === 'newLesson' ? 'scale-110 rotate-12' : 'group-hover:scale-110'}`}>
                                                            <CloudUpload className={`w-16 h-16 ${dragActiveZone === 'newLesson' ? 'text-orange-600' : 'text-slate-400 group-hover:text-orange-500'}`} />
                                                        </div>

                                                        <div className="text-center z-10 px-6">
                                                            <h4 className="text-2xl font-black text-slate-700 dark:text-gray-200 mb-2 group-hover:text-orange-600 transition-colors">
                                                                {dragActiveZone === 'newLesson' ? 'Relâchez pour importer !' : 'Glisser votre contenu ici'}
                                                            </h4>
                                                            <p className="text-slate-500 font-medium">
                                                                Vidéo, Audio, PDF ou Documents
                                                            </p>
                                                        </div>

                                                        <p className="text-xs text-slate-400 mt-2">ou collez une URL Youtube/Vimeo directement (bientôt)</p>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* 3. Action Button (Bottom) */}
                                    {/* 3. Action Buttons Group (Bottom) */}
                                    <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => handleAddLesson()}
                                            disabled={saving || !newLessonTitle.trim() || !newLessonUrl.trim()}
                                            className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-5 h-5" /> Ajouter ce chapitre
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSmartSave}
                                            disabled={saving}
                                            className="flex-[2] py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                                    Enregistrement...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" /> Sauvegarder tout le cours
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Preview/Actions */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm sticky top-8">
                            <h4 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4 text-orange-500" /> Aperçu de la carte
                            </h4>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 mb-6">
                                <div className="w-full aspect-video rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mb-4 overflow-hidden relative">
                                    {activeCourseData.coverImage ? (
                                        <img src={activeCourseData.coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-black text-2xl">
                                            {activeCourseData.title ? activeCourseData.title.charAt(0) : '?'}
                                        </div>
                                    )}
                                </div>
                                <h5 className="font-bold text-slate-900 dark:text-white truncate">{activeCourseData.title || 'Titre du cours'}</h5>
                                <p className="text-xs text-slate-500 mb-3">{activeCourseData.lessonsList.length} Chapitres • {activeCourseData.rating ? activeCourseData.rating.toFixed(1) : '0.0'} ★</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200"></div>)}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">+{activeCourseData.students || 0} inscrits</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {activeCourseData.id && !activeCourseData.id.startsWith('temp') ? (
                                    <Link
                                        to={`/academy/lesson/${activeCourseData.id}`}
                                        className="w-full py-3 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        Visualiser comme étudiant <ChevronRight className="w-4 h-4" />
                                    </Link>
                                ) : (
                                    <button
                                        onClick={() => showNotification("Info", "Enregistrez d'abord le cours pour pouvoir le visualiser.", "info")}
                                        className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        Visualiser comme étudiant <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                                <p className="text-[10px] text-center text-slate-400">Dernière sauvegarde automatique il y a quelques secondes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Book className="w-6 h-6 text-orange-500" /> Gestion Académie
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">Gérez vos formations (Actuellement 100% Gratuites).</p>
                </div>
                <button
                    onClick={handleInitCreateCourse}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
                >
                    <Plus className="w-5 h-5" /> Nouveau Cours
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Étudiants", value: `${enrollments.length}`, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "from-blue-500/10 to-blue-600/5 border-blue-200/50 dark:border-blue-800/50" },
                    { label: "Certificats Délivrés", value: `${enrollments.filter(e => e.certified_at).length}`, icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 dark:border-emerald-800/50" },
                    {
                        label: "Taux Complétion",
                        value: `${enrollments.length > 0 ? Math.round(enrollments.reduce((acc, curr) => {
                            const totalLessons = curr.academy_courses?.academy_lessons?.length || 0;
                            const completed = (curr.progress || []).length;
                            return acc + (totalLessons > 0 ? (completed / totalLessons) * 100 : 0);
                        }, 0) / enrollments.length) : 0}%`,
                        icon: Award,
                        color: "text-orange-600 dark:text-orange-400",
                        bg: "from-orange-500/10 to-orange-600/5 border-orange-200/50 dark:border-orange-800/50"
                    }
                ].map((stat, i) => (
                    <div key={i} className={`relative overflow-hidden p-6 rounded-3xl border ${stat.bg.split(' ')[2]} bg-gradient-to-br ${stat.bg.split(' ')[0]} ${stat.bg.split(' ')[1]} backdrop-blur-sm group hover:scale-[1.02] transition-transform duration-300`}>
                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-white/20 ${stat.color}`}>
                                <stat.icon className="w-8 h-8" />
                            </div>
                        </div>
                        {/* Decorative Circle */}
                        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full opacity-10 ${stat.color.replace('text', 'bg')} blur-2xl group-hover:scale-125 transition-transform duration-500`}></div>
                    </div>
                ))}
            </div>

            {/* Content Tabs */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-900/5">
                {/* Tab Header */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('courses')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'courses'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Mes Cours
                        </button>
                        <button
                            onClick={() => setActiveTab('students')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'students'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Étudiants Inscrits
                        </button>
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'reviews'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Avis & Ratings
                        </button>
                        <button
                            onClick={() => setActiveTab('interactions')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'interactions'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Interactions & Q&A
                        </button>
                        <button
                            onClick={() => setActiveTab('emails')}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'emails'
                                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            Paramètres Emails
                        </button>
                    </div>

                    <div className="relative w-full md:w-72 group">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                            title="Rechercher dans l'académie"
                            aria-label="Rechercher des cours ou des étudiants"
                        />
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'courses' ? (
                        loading ? (
                            <div className="flex flex-col items-center justify-center py-20 pointer-events-none">
                                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-slate-500 font-medium">Chargement des cours...</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCourseIds.length === courses.length && courses.length > 0}
                                            onChange={handleToggleAllSelection}
                                            className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                                            title="Tout sélectionner"
                                        />
                                        <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sélectionner tout</span>
                                    </div>
                                    <AnimatePresence>
                                        {selectedCourseIds.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="flex items-center gap-4 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-orange-200 dark:border-orange-900/30 shadow-sm"
                                            >
                                                <span className="text-sm font-bold text-orange-600">{selectedCourseIds.length} sélectionné(s)</span>
                                                <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700" />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleBulkStatusUpdate('published')}
                                                        className="p-1.5 text-slate-500 hover:text-green-600 transition-colors"
                                                        title="Publier la sélection"
                                                    >
                                                        <Globe className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleBulkStatusUpdate('draft')}
                                                        className="p-1.5 text-slate-500 hover:text-orange-600 transition-colors"
                                                        title="Mettre en brouillon"
                                                    >
                                                        <Layout className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleBulkDelete}
                                                        className="p-1.5 text-slate-500 hover:text-red-600 transition-colors"
                                                        title="Supprimer la sélection"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                {courses.map((course) => (
                                    <div key={course.id} className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl hover:bg-white dark:hover:bg-slate-800 transition-all border relative ${selectedCourseIds.includes(course.id) ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10' : 'border-transparent hover:border-slate-100 dark:hover:border-slate-700 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-black/20 bg-slate-50 dark:bg-slate-800/30'} ${activeCourseMenu === course.id ? 'z-[60]' : 'z-0'}`}>
                                        <div className="flex items-start md:items-center gap-5 w-full md:w-auto">
                                            <div className="relative shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCourseIds.includes(course.id)}
                                                    onChange={() => handleToggleCourseSelection(course.id)}
                                                    className={`absolute -top-2 -left-2 w-5 h-5 rounded-md border-2 border-white dark:border-slate-800 text-orange-600 focus:ring-orange-500 cursor-pointer shadow-sm transition-opacity ${selectedCourseIds.includes(course.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                    title="Sélectionner ce cours"
                                                />
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-500 font-bold overflow-hidden shadow-inner">
                                                    {course.cover_image_url ? (
                                                        <img src={course.cover_image_url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    ) : (
                                                        <span className="text-xl">{course.title.charAt(0)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-slate-900 dark:text-white text-lg truncate pr-4 group-hover:text-orange-600 transition-colors">{course.title}</h3>
                                                <div className="flex items-center gap-3 text-xs font-medium text-slate-500 mt-1">
                                                    <span className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">{(course.academy_lessons || []).length} Leçons</span>
                                                    <span className="flex items-center gap-1"><Award className="w-3 h-3 text-yellow-500" /> {course.rating?.toFixed(1) || "5.0"}</span>
                                                    <span className="hidden sm:inline-block">• Mis à jour le {new Date(course.updated_at || Date.now()).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-6 mt-4 md:mt-0 w-full md:w-auto pl-[84px] md:pl-0">
                                            <div className="hidden sm:flex flex-col items-center">
                                                <span className="text-xl font-black text-slate-900 dark:text-white">{course.students}</span>
                                                <span className="text-[10px] uppercase font-bold text-slate-400">Étudiants</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="relative group/status">
                                                    <select
                                                        title="Changer le statut"
                                                        value={course.status}
                                                        onChange={(e) => handleQuickStatusUpdate(course.id, e.target.value as any)}
                                                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border-none outline-none cursor-pointer transition-all ${course.status === 'published'
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                                            : course.status === 'archived'
                                                                ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300'
                                                            }`}
                                                    >
                                                        <option value="draft">BROUILLON</option>
                                                        <option value="published">PUBLIÉ</option>
                                                        <option value="archived">ARCHIVÉ</option>
                                                    </select>
                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <div className={`w-2 h-2 rounded-full ${course.status === 'published' ? 'bg-green-500' : course.status === 'archived' ? 'bg-red-500' : 'bg-slate-400'}`}></div>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <button
                                                        onClick={() => handleCourseMenu(course.id)}
                                                        className={`p-2 rounded-lg transition-colors ${activeCourseMenu === course.id ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'}`}
                                                        title="Plus d'options"
                                                    >
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>

                                                    <AnimatePresence>
                                                        {activeCourseMenu === course.id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setActiveCourseMenu(null)}></div>
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95, y: 10, x: -10 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden py-2"
                                                                >
                                                                    <div className="px-4 py-2 border-b border-slate-50 dark:border-slate-700 mb-1">
                                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</p>
                                                                    </div>
                                                                    <Link
                                                                        to={`/academy/lesson/${course.id}`}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-600 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Eye className="w-4 h-4" /> Voir le cours
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => { handleInitEditCourse(course); setActiveCourseMenu(null); }}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Edit className="w-4 h-4" /> Modifier
                                                                    </button>
                                                                    <div className="h-px bg-slate-100 dark:bg-slate-700 my-1 mx-4"></div>
                                                                    <button
                                                                        onClick={() => handleDeleteCourse(course.id, course.title)}
                                                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                                                                    >
                                                                        <Trash className="w-4 h-4" /> Supprimer
                                                                    </button>
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Empty State Graphic Update */}
                                {courses.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                                        <div className="relative mb-6 group cursor-pointer" onClick={handleInitCreateCourse}>
                                            <div className="absolute inset-0 bg-orange-500 blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
                                            <div className="relative bg-white dark:bg-slate-800 p-6 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 group-hover:border-orange-500 group-hover:scale-110 transition-all duration-300">
                                                <Plus className="w-10 h-10 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Votre académie est vide</h3>
                                        <p className="text-slate-500 max-w-sm mx-auto mb-6">Commencez par créer votre premier cours pour partager votre expertise avec le monde.</p>
                                        <button
                                            onClick={handleInitCreateCourse}
                                            className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all"
                                        >
                                            Créer un cours maintenant
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    ) : activeTab === 'students' ? (
                        <div className="space-y-4">
                            {enrollments.map((enrollment) => {
                                const totalLessons = enrollment.academy_courses?.academy_lessons?.length || 0;
                                const completedLessons = (enrollment.progress || []).length;
                                const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                                const studentName = enrollment.profiles?.full_name || "Étudiant";
                                const courseTitle = enrollment.academy_courses?.title || "Cours inconnu";

                                return (
                                    <div key={enrollment.id} className={`flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 relative ${activeStudentMenu === enrollment.id ? 'z-[60]' : 'z-0'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold overflow-hidden border border-slate-200 dark:border-slate-700">
                                                {enrollment.profiles?.avatar_url ? (
                                                    <img src={enrollment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    studentName.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 dark:text-white">{studentName}</h3>
                                                <p className="text-xs text-slate-500">{courseTitle}</p>
                                            </div>
                                        </div>

                                        <div className="flex-1 max-w-xs mx-8 hidden lg:block">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-500">Progression</span>
                                                <span className="font-bold text-slate-900 dark:text-white">{progressPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-orange-500 rounded-full"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercentage}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    role="img"
                                                    aria-label={`Progression : ${progressPercentage}%`}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm">
                                            <div className="hidden sm:flex items-center gap-1 text-slate-500">
                                                <Clock className="w-3 h-3" /> {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR')}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${enrollment.certified_at ? 'bg-indigo-100 text-indigo-700' : progressPercentage === 100 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {enrollment.certified_at ? 'Certifié' : progressPercentage === 100 ? 'Terminé' : 'En cours'}
                                            </span>
                                            <div className="relative">
                                                <button
                                                    onClick={() => handleStudentMenu(enrollment.id)}
                                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                                                    title="Plus d'options"
                                                    aria-label="Plus d'options"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-slate-500" />
                                                </button>
                                                <AnimatePresence>
                                                    {activeStudentMenu === enrollment.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActiveStudentMenu(null)}></div>
                                                            <motion.div
                                                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 py-1"
                                                            >
                                                                <button
                                                                    onClick={() => {
                                                                        navigate(`/dashboard/admin/users?viewProfile=${enrollment.user_id}`);
                                                                        setActiveStudentMenu(null);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                                >
                                                                    <Users className="w-4 h-4" /> Voir le profil
                                                                </button>
                                                                <button
                                                                    onClick={() => handleNotifyStudent(enrollment)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                                                                >
                                                                    <Bell className="w-4 h-4" /> Envoyer un rappel
                                                                </button>
                                                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                                                <button
                                                                    onClick={() => handleIssueCertificate(enrollment.id)}
                                                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 flex items-center gap-2"
                                                                    disabled={progressPercentage < 100}
                                                                    title={progressPercentage < 100 ? "L'étudiant n'a pas fini le cours" : ""}
                                                                >
                                                                    <Award className="w-4 h-4" /> {enrollment.certified_at ? 'Certificat déjà délivré' : 'Délivrer certificat'}
                                                                </button>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : activeTab === 'reviews' ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Note Moyenne</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">
                                            {reviews.length > 0
                                                ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                                                : "0.0"}
                                        </span>
                                        <Award className="w-5 h-5 text-yellow-500" />
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Total Avis</p>
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{reviews.length}</span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {reviews.map((review) => (
                                    <div key={review.id} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold overflow-hidden border border-slate-200 dark:border-slate-700">
                                                    {review.profiles?.avatar_url ? (
                                                        <img src={review.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        review.profiles?.full_name?.charAt(0) || "U"
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-900 dark:text-white">{review.profiles?.full_name || "Anonyme"}</h4>
                                                    <p className="text-xs text-orange-500 font-medium">Sur : {review.academy_courses?.title || "Cours inconnu"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{review.rating}</span>
                                                <Award className={`w-4 h-4 ${review.rating >= 4 ? 'text-yellow-500' : 'text-slate-400'}`} />
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed bg-white dark:bg-slate-900/50 p-3 rounded-xl border border-slate-50 dark:border-slate-700/50">
                                            "{review.comment || "Aucun commentaire laissé."}"
                                        </p>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{new Date(review.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            <button
                                                onClick={() => navigate(`/dashboard/admin/users?viewProfile=${review.user_id}`)}
                                                className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter hover:underline"
                                            >
                                                Voir l'étudiant
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {reviews.length === 0 && (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500">Aucun avis pour le moment.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'interactions' ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-black text-slate-900 dark:text-white">Dernières questions et commentaires</h3>
                                <div className="text-xs text-slate-500 font-bold">{comments.length} messages au total</div>
                            </div>

                            {comments.map((comment) => (
                                <div key={comment.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                            {comment.profiles?.avatar_url ? (
                                                <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                comment.profiles?.full_name?.charAt(0) || "U"
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h4 className="font-bold text-slate-900 dark:text-white truncate">{comment.profiles?.full_name || "Utilisateur"}</h4>
                                                <span className="text-[10px] text-slate-400 font-mono">{new Date(comment.created_at).toLocaleString('fr-FR')}</span>
                                            </div>
                                            <p className="text-xs font-bold text-orange-500 mb-2">
                                                Sur : {comment.academy_lessons?.academy_courses?.title} • {comment.academy_lessons?.title}
                                            </p>
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 mb-3">
                                                {comment.content}
                                            </div>

                                            {/* Nested Replies Rendering */}
                                            {comments.filter(c => c.parent_id === comment.id).map(reply => (
                                                <div key={reply.id} className="ml-8 mt-2 p-3 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border-l-4 border-indigo-500 text-xs italic">
                                                    <span className="font-bold text-indigo-600 block mb-1">Admin:</span>
                                                    {reply.content}
                                                </div>
                                            ))}

                                            {!comment.parent_id && (
                                                <div className="flex items-center gap-3 mt-4">
                                                    <button
                                                        onClick={() => setReplyingTo(comment)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                                                    >
                                                        <MessageSquare className="w-3 h-3" /> Répondre
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/academy/lesson/${comment.academy_lessons?.course_id}`)}
                                                        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 rounded-lg text-xs font-bold transition-colors"
                                                    >
                                                        <Globe className="w-3 h-3" /> Voir la leçon
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {comments.length === 0 && (
                                <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <div className="p-4 bg-white dark:bg-slate-800 rounded-full w-fit mx-auto mb-4 shadow-sm">
                                        <MessageSquare className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Aucune interaction</h4>
                                    <p className="text-sm text-slate-500">Les questions des étudiants apparaîtront ici.</p>
                                </div>
                            )}
                        </div>
                    ) : activeTab === 'emails' ? (
                        <div className="max-w-4xl space-y-8">
                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                                    <Bell className="w-6 h-6 text-indigo-500" /> Notifications & Emails
                                </h4>
                                <p className="text-sm text-slate-500 mb-8">Personnalisez les messages envoyés automatiquement à vos étudiants.</p>

                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                        <h5 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            Certificat de Réussite
                                        </h5>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sujet de l'email</label>
                                                <input
                                                    title="Sujet"
                                                    type="text"
                                                    value={emailSettings.certificate.subject}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, certificate: { ...emailSettings.certificate, subject: e.target.value } })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Corps du message (Introduction)</label>
                                                <textarea
                                                    title="Description"
                                                    rows={4}
                                                    value={emailSettings.certificate.body}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, certificate: { ...emailSettings.certificate, body: e.target.value } })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                        <h5 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            Email de Rappel (Inactivité)
                                        </h5>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sujet de l'email</label>
                                                <input
                                                    title="Sujet"
                                                    type="text"
                                                    value={emailSettings.reminder.subject}
                                                    onChange={(e) => setEmailSettings({ ...emailSettings, reminder: { ...emailSettings.reminder, subject: e.target.value } })}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            onClick={handleSaveEmailSettings}
                                            disabled={isLoadingSettings}
                                            className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                                        >
                                            <Save className="w-4 h-4" /> {isLoadingSettings ? "Enregistrement..." : "Enregistrer les réglages"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Stats Dashboard */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Certificats Vendu</p>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {enrollments.filter(e => e.certified_at).length}
                                        </h3>
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                                            <Award className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold">VALEUR: {enrollments.filter(e => e.certified_at).length * 5000} XOF</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Nouvelles Inscriptions</p>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {enrollments.length}
                                        </h3>
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                                            <Users className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold">TOTAL HISTORIQUE</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Progression Moyenne</p>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {enrollments.length > 0
                                                ? Math.round(enrollments.reduce((acc, curr) => {
                                                    const total = curr.academy_courses?.academy_lessons?.length || 0;
                                                    const completed = (curr.progress || []).length;
                                                    return acc + (total > 0 ? (completed / total) * 100 : 0);
                                                }, 0) / enrollments.length)
                                                : 0}%
                                        </h3>
                                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-xl">
                                            <Layout className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold">ENGAGEMENT ÉTUDIANT</p>
                                </div>

                                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                    <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Avis Moyens</p>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                                            {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0"}
                                        </h3>
                                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-500 rounded-xl">
                                            <Award className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 font-bold">SATISFACTION GLOBALE</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>
                                <h4 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                                    <Award className="w-6 h-6 text-orange-500" /> Analyse de l'Académie
                                </h4>

                                <div className="h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={courses.map(c => ({ name: c.title.substring(0, 15), students: c.students || 0, rating: c.rating || 5 }))}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                            />
                                            <Bar dataKey="students" fill="#f97316" radius={[10, 10, 0, 0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-orange-500" /> Cours les plus populaires
                                        </h5>
                                        <div className="space-y-3">
                                            {[...courses].sort((a, b) => (b.students || 0) - (a.students || 0)).slice(0, 3).map((c, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{c.title}</span>
                                                    <span className="text-xs font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">{c.students || 0}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Award className="w-4 h-4 text-orange-500" /> Meilleurs Ratings
                                        </h5>
                                        <div className="space-y-3">
                                            {[...courses].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3).map((c, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{c.title}</span>
                                                    <span className="text-xs font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">{(c.rating || 5).toFixed(1)} ★</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Quizz */}
            <AnimatePresence>
                {isQuizModalOpen && activeQuiz && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-[40px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col"
                        >
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                        <Award className="w-6 h-6 text-orange-500" /> Éditeur de Quizz
                                    </h3>
                                    <p className="text-sm text-slate-500">Définissez les questions pour cette leçon.</p>
                                </div>
                                <button
                                    onClick={() => setIsQuizModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
                                    title="Fermer l'éditeur de quizz"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Score de réussite (%)</label>
                                        <input
                                            type="number"
                                            value={activeQuiz.passing_score}
                                            onChange={(e) => setActiveQuiz({ ...activeQuiz, passing_score: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-sm font-bold"
                                            placeholder="Score de réussite (ex: 80)"
                                            title="Score de réussite minimum en pourcentage"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {activeQuiz.questions.map((q: any, qIdx: number) => (
                                        <div key={q.id} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 relative group">
                                            <button
                                                onClick={() => {
                                                    const newQs = [...activeQuiz.questions];
                                                    newQs.splice(qIdx, 1);
                                                    setActiveQuiz({ ...activeQuiz, questions: newQs });
                                                }}
                                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                title="Supprimer cette question"
                                            >
                                                <Trash className="w-4 h-4" />
                                            </button>

                                            <div className="mb-4">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question {qIdx + 1}</label>
                                                <input
                                                    type="text"
                                                    value={q.question_text}
                                                    onChange={(e) => {
                                                        const newQs = [...activeQuiz.questions];
                                                        newQs[qIdx].question_text = e.target.value;
                                                        setActiveQuiz({ ...activeQuiz, questions: newQs });
                                                    }}
                                                    placeholder="Entrez votre question..."
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Options de réponse</label>
                                                {q.options?.map((opt: any, oIdx: number) => (
                                                    <div key={oIdx} className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => {
                                                                const newQs = [...activeQuiz.questions];
                                                                newQs[qIdx].options.forEach((o: any) => o.is_correct = false);
                                                                newQs[qIdx].options[oIdx].is_correct = true;
                                                                setActiveQuiz({ ...activeQuiz, questions: newQs });
                                                            }}
                                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${opt.is_correct ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 dark:border-slate-700'}`}
                                                        >
                                                            {opt.is_correct && <CheckCircle className="w-4 h-4" />}
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={opt.option_text}
                                                            onChange={(e) => {
                                                                const newQs = [...activeQuiz.questions];
                                                                newQs[qIdx].options[oIdx].option_text = e.target.value;
                                                                setActiveQuiz({ ...activeQuiz, questions: newQs });
                                                            }}
                                                            className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs"
                                                            placeholder="Texte de l'option..."
                                                            title={`Option de réponse ${oIdx + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        const newQs = [...activeQuiz.questions];
                                                        newQs[qIdx].options.push({ option_text: "", is_correct: false, order_index: newQs[qIdx].options.length });
                                                        setActiveQuiz({ ...activeQuiz, questions: newQs });
                                                    }}
                                                    className="text-[10px] font-bold text-orange-500 hover:text-orange-600 ml-9"
                                                >
                                                    + Ajouter une option
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={handleAddQuizQuestion}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl text-sm font-bold text-slate-400 hover:border-orange-500 hover:text-orange-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Ajouter une question
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                <button
                                    onClick={() => setIsQuizModalOpen(false)}
                                    className="flex-1 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-bold rounded-2xl border border-slate-200 dark:border-slate-700"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={handleSaveQuiz}
                                    disabled={isLoadingQuiz}
                                    className="flex-1 py-4 bg-orange-600 text-white font-black rounded-2xl shadow-lg shadow-orange-600/20 disabled:opacity-50"
                                >
                                    {isLoadingQuiz ? "Enregistrement..." : "Enregistrer le Quizz"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Réponse */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800"
                        >
                            <div className="p-8">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                                    <MessageSquare className="w-6 h-6 text-indigo-500" /> Répondre à l'étudiant
                                </h3>
                                <p className="text-sm text-slate-500 mb-6 italic">"{replyingTo.content}"</p>

                                <textarea
                                    title="Votre réponse"
                                    rows={5}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Écrivez votre réponse ici..."
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none mb-6"
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setReplyingTo(null)}
                                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-xl text-sm"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        onClick={handleReplySubmit}
                                        className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/20"
                                    >
                                        Envoyer la réponse
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
