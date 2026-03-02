import { CertificateTemplate } from "../../components/academy/CertificateTemplate";
import { FileText, ArrowLeft, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CEOCert() {
    const navigate = useNavigate();

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

    const generatePDF = async () => {
        try {
            const { default: jsPDF } = await import('jspdf');
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1123, 794]
            });

            const studentName = "Cheikh Abdoul Khadre Djeylani DJITTE";
            const courseName = "Expert en Logistique Digitale & Stratégie Premium";
            const certId = "CERT-CEO-NEXTMOVE-2025";
            const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

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

            doc.save(`Certificat_CEO_NextMove_${studentName.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Une erreur est survenue lors de la génération du PDF.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-10 gap-8">
            {/* Ambient Tactical Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
            </div>

            <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col gap-1">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-slate-500 hover:text-sky-400 transition-all mb-2 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Tableau de Commandement</span>
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                            <FileText className="w-6 h-6 text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase tracking-tight">Certification Ambassadeur</h1>
                            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Honorary_Status: Verified</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={generatePDF}
                        className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange-500/20 flex items-center gap-3 group"
                    >
                        <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                        Exporter Archive (PDF)
                        <div className="absolute inset-0 rounded-2xl border border-white/20 animate-pulse" />
                    </button>
                </div>
            </div>

            {/* Certificate Preview HUD */}
            <div className="relative group">
                {/* Glow behind the certificate */}
                <div className="absolute -inset-4 bg-sky-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="relative scale-[0.45] sm:scale-[0.6] md:scale-[0.75] lg:scale-90 xl:scale-100 origin-center shadow-[0_0_100px_rgba(0,0,0,0.5)] rounded-sm overflow-hidden border-2 border-slate-800/50 hover:border-sky-500/30 transition-all duration-700">
                    <CertificateTemplate
                        studentName="Cheikh Abdoul Khadre Djeylani DJITTE"
                        courseName="Expert en Logistique Digitale & Stratégie Premium"
                        certifiedAt={new Date().toISOString()}
                        certificateId="CERT-CEO-NEXTMOVE-2025"
                    />

                    {/* Scanning Line Effect */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-sky-500/20 blur-sm animate-[scan_4s_linear_infinite] pointer-events-none" />
                </div>

                {/* Tactical Corner Overlays */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-sky-500/40 rounded-tl-lg pointer-events-none" />
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-sky-500/40 rounded-tr-lg pointer-events-none" />
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-sky-500/40 rounded-bl-lg pointer-events-none" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-sky-500/40 rounded-br-lg pointer-events-none" />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes scan {
                    0% { top: 0; }
                    100% { top: 100%; }
                }
            `}} />
        </div>
    );
}
