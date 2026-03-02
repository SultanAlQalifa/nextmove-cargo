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
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col">
            {/* Ambient Tactical Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-slate-500 hover:text-sky-400 transition-all mb-4 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-bold uppercase tracking-widest">Retour au Dashboard</span>
                        </button>
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                                <Award className="w-8 h-8 text-sky-400" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">
                                    Mes Certificats
                                </h1>
                                <p className="text-slate-500 text-sm font-medium mt-1">
                                    Archives officielles des compétences validées
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-sky-500/20 rounded-full" />
                            <div className="absolute inset-0 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="text-slate-500 font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Synchronisation des archives...</p>
                    </div>
                ) : certificates.length === 0 ? (
                    <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl p-16 text-center border border-slate-800/50 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-8 relative">
                            <Award className="w-12 h-12 text-slate-700" />
                            <div className="absolute inset-0 border border-slate-700/50 rounded-2xl animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3 uppercase tracking-tight">
                            Dépôt de Compétences Vide
                        </h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-10 text-sm leading-relaxed">
                            Aucune certification n'est actuellement archivée. Complétez vos missions de formation pour débloquer vos titres officiels.
                        </p>
                        <button
                            onClick={() => navigate('/academy')}
                            className="px-10 py-4 bg-white text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
                        >
                            Démarrer une Mission
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {certificates.map((cert) => (
                            <div
                                key={cert.id}
                                className="bg-slate-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800/50 hover:border-sky-500/30 transition-all duration-500 group relative"
                            >
                                <div className="aspect-[16/9] relative bg-black overflow-hidden">
                                    {cert.academy_courses.cover_image_url ? (
                                        <img
                                            src={cert.academy_courses.cover_image_url}
                                            alt={cert.academy_courses.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60 group-hover:opacity-100"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/10 to-blue-600/10">
                                            <Award className="w-16 h-16 text-sky-500/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                                    <div className="absolute top-4 left-4">
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 backdrop-blur-md border border-sky-500/20 shadow-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">
                                                Validé
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-8">
                                    <h3 className="font-bold text-white line-clamp-2 mb-6 min-h-[3rem] text-lg leading-tight group-hover:text-sky-400 transition-colors">
                                        {cert.academy_courses.title}
                                    </h3>
                                    <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                                        <div className="space-y-1">
                                            <p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Extraction Date</p>
                                            <p className="text-slate-300 font-mono text-xs">
                                                {cert.certified_at ? new Date(cert.certified_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setSelectedCert(cert)}
                                                className="p-3 bg-slate-800/50 hover:bg-sky-500/10 text-slate-400 hover:text-sky-400 border border-slate-700/50 hover:border-sky-500/30 rounded-xl transition-all"
                                                title="Visualiser"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(cert)}
                                                disabled={generating === cert.id}
                                                className="flex items-center gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-sky-500/10"
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
                                {/* Hover Glow Effect */}
                                <div className="absolute -inset-px bg-gradient-to-r from-sky-500/0 via-sky-500/10 to-sky-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Visualization Modal */}
                {selectedCert && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl">
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            <div className="p-6 border-b border-slate-800/50 flex items-center justify-between bg-slate-900/50">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
                                        <Award className="w-5 h-5 text-sky-400" />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-white uppercase tracking-tight text-sm">
                                            Aperçu Tactique
                                        </h2>
                                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Digital_Asset_Preview.exe</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedCert(null)}
                                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all"
                                    title="Fermer"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto p-4 md:p-12 bg-black flex items-center justify-center min-h-0 relative">
                                {/* Visualizer decorative elements */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none">
                                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                                    <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
                                    <div className="absolute top-0 left-40 w-px h-full bg-gradient-to-b from-transparent via-sky-500 to-transparent" />
                                    <div className="absolute top-0 right-40 w-px h-full bg-gradient-to-b from-transparent via-sky-500 to-transparent" />
                                </div>

                                <div className="relative w-full h-full flex items-center justify-center overflow-auto py-8">
                                    <div className="shadow-[0_0_40px_rgba(0,0,0,0.5)] rounded-sm origin-center transition-transform duration-500 scale-[0.4] sm:scale-[0.55] md:scale-[0.8] lg:scale-[0.9] xl:scale-100 p-0 flex-shrink-0 border-2 border-slate-800">
                                        <CertificateTemplate
                                            studentName={formatName(profile?.full_name || user?.email?.split('@')[0] || "Étudiant NextMove")}
                                            courseName={selectedCert.academy_courses.title}
                                            certifiedAt={selectedCert.certified_at || new Date().toISOString()}
                                            certificateId={`CERT-${selectedCert.id.slice(0, 8).toUpperCase()}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-800/50 flex justify-end gap-4 bg-slate-900/50">
                                <button
                                    onClick={() => setSelectedCert(null)}
                                    className="px-8 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    Fermer
                                </button>
                                <button
                                    onClick={() => {
                                        handleDownload(selectedCert);
                                        setSelectedCert(null);
                                    }}
                                    disabled={generating === selectedCert.id}
                                    className="flex items-center gap-3 bg-white text-slate-950 px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50"
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
