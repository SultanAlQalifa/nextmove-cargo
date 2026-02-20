import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Award, Download, Loader2, Eye, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { academyService } from "../../services/academyService";
import { AcademyEnrollment } from "../../types/academy";
import { useToast } from "../../contexts/ToastContext";
import { profileService } from "../../services/profileService";
import CertificateTemplate from "../../components/academy/CertificateTemplate";
import { isAdmin } from "../../utils/authUtils";

interface CertificateItem extends AcademyEnrollment {
    academy_courses: {
        title: string;
        cover_image_url: string;
    };
}

export default function MyCertificates() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { success, error } = useToast();
    const [certificates, setCertificates] = useState<CertificateItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            if (user) {
                const data = await profileService.getProfile(user.id);
                setProfile(data);
                // Load certificates after profile is ready to check roles
                loadCertificates(data);
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            loadCertificates(null);
        }
    };

    const loadCertificates = async (currentProfile?: any) => {
        try {
            setLoading(true);
            const activeProfile = currentProfile || profile;
            if (user) {
                let data = await academyService.getMyCertificates(user.id);

                // For super-admin (CEO), inject the honorary certificate if not already there
                if (isAdmin(activeProfile?.role)) {
                    const honoraryCertId = "CERT-CEO-HONORARY-2025";
                    if (!data.find(c => c.id === honoraryCertId)) {
                        const honoraryCert: CertificateItem = {
                            id: honoraryCertId,
                            user_id: user.id,
                            course_id: "CEO-COURSE-ID",
                            enrolled_at: new Date("2025-01-01").toISOString(),
                            certified_at: new Date("2025-01-01").toISOString(),
                            progress: [],
                            academy_courses: {
                                title: "Expert en Logistique Digitale & Stratégie Premium",
                                cover_image_url: "/assets/branding/cert_background.png" // Use background as cover for honor
                            }
                        };
                        data = [honoraryCert, ...data];
                    }
                }

                setCertificates(data);
            }
        } catch (err) {
            console.error("Error loading certificates:", err);
            error("Erreur lors du chargement des certificats");
        } finally {
            setLoading(false);
        }
    };

    const formatName = (name: string) => {
        if (!name) return "";
        const parts = name.trim().split(/\s+/);
        if (parts.length <= 1) return name.toUpperCase();
        const lastName = parts.pop()?.toUpperCase();
        return `${parts.join(" ")} ${lastName}`;
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

    const handleDownload = async (cert: CertificateItem) => {
        try {
            setGenerating(cert.id);
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1123, 794]
            });

            const studentName = formatName(profile?.full_name || user?.email?.split('@')[0] || "Étudiant NextMove");
            const courseName = cert.academy_courses.title;
            const certId = `CERT-${cert.id.slice(0, 8).toUpperCase()}`;
            const date = cert.certified_at
                ? new Date(cert.certified_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

            // Background Image
            try {
                const bgImg = await getImageData('/assets/branding/cert_background.png');
                doc.addImage(bgImg, 'PNG', 0, 0, 1123, 794);
            } catch (e) {
                console.error("PDF Background Error:", e);
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, 1123, 794, 'F');
            }

            // Print Branding
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

            // Content
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
            let courseFontSize = 26;
            if (courseName.length > 35) courseFontSize = 20;
            if (courseName.length > 50) courseFontSize = 16;
            if (courseName.length > 70) courseFontSize = 14;
            doc.setFontSize(courseFontSize);
            doc.text(courseName.toUpperCase(), 561, 430, { align: 'center' });

            // Sceau et Signature
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

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`ID: ${certId}`, 230, 660);
            doc.text(`Délivré le : ${date}`, 561, 660, { align: 'center' });
            doc.text('NextMove Académie', 890, 660, { align: 'right' });

            doc.save(`Certificat_NextMove_${courseName.replace(/\s+/g, '_')}.pdf`);
            success("Certificat téléchargé avec succès");
        } catch (err) {
            console.error("Error generating PDF:", err);
            error("Erreur lors de la génération du PDF");
        } finally {
            setGenerating(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
            <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Tableau de bord
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <Award className="w-8 h-8 text-orange-500" />
                            Mes certificats
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">
                            Retrouvez et téléchargez vos diplômes NextMove Académie
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                        <p className="text-slate-500">Chargement de vos succès...</p>
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Award className="w-10 h-10 text-slate-400" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                            Aucun certificat pour le moment
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                            Complétez vos formations pour obtenir vos diplômes officiels et booster votre carrière en logistique.
                        </p>
                        <button
                            onClick={() => navigate('/academy')}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
                        >
                            Découvrir les cours
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {certificates.map((cert) => (
                            <div
                                key={cert.id}
                                className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-200 dark:border-slate-700 group"
                            >
                                <div className="aspect-[16/9] relative bg-slate-100 dark:bg-slate-700">
                                    {cert.academy_courses.cover_image_url ? (
                                        <img
                                            src={cert.academy_courses.cover_image_url}
                                            alt={cert.academy_courses.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500/10 to-orange-500/10">
                                            <Award className="w-12 h-12 text-orange-500/50" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-orange-500 border border-orange-500/20 shadow-sm">
                                            DIPLÔMÉ
                                        </span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 mb-4 min-h-[3rem]">
                                        {cert.academy_courses.title}
                                    </h3>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <div className="text-sm">
                                            <p className="text-slate-400 uppercase tracking-wider text-[10px] font-bold">Délivré le</p>
                                            <p className="text-slate-900 dark:text-white font-medium">
                                                {cert.certified_at ? new Date(cert.certified_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedCert(cert)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-all"
                                                title="Visualiser"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(cert)}
                                                disabled={generating === cert.id}
                                                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                            >
                                                {generating === cert.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {/* Visualization Modal */}
                {selectedCert && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Award className="w-5 h-5 text-orange-500" />
                                    <h2 className="font-bold text-slate-900 dark:text-white">
                                        Aperçu du certificat
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setSelectedCert(null)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                    title="Fermer"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-4 md:p-12 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center min-h-0">
                                <div className="relative w-full h-full flex items-center justify-center overflow-auto py-8">
                                    <div className="shadow-2xl rounded-sm origin-center transition-transform duration-500 scale-[0.4] sm:scale-[0.55] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 p-0 flex-shrink-0">
                                        <CertificateTemplate
                                            studentName={formatName(profile?.full_name || user?.email?.split('@')[0] || "Étudiant NextMove")}
                                            courseName={selectedCert.academy_courses.title}
                                            certifiedAt={selectedCert.certified_at || new Date().toISOString()}
                                            certificateId={`CERT-${selectedCert.id.slice(0, 8).toUpperCase()}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-white dark:bg-slate-800">
                                <button
                                    onClick={() => setSelectedCert(null)}
                                    className="px-6 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() => {
                                        handleDownload(selectedCert);
                                        setSelectedCert(null);
                                    }}
                                    disabled={generating === selectedCert.id}
                                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50"
                                >
                                    {generating === selectedCert.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    Télécharger PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
