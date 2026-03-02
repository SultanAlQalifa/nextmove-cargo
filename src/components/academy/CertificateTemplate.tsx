import { forwardRef } from "react";

interface CertificateTemplateProps {
    studentName: string;
    courseName: string;
    certifiedAt: string;
    certificateId: string;
}

export const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
    ({ studentName, courseName, certifiedAt, certificateId }, ref) => {
        return (
            <div
                ref={ref}
                className="w-[1123px] h-[794px] bg-slate-50 relative overflow-hidden flex flex-col items-center justify-center font-serif text-center"
            >
                {/* High-Res Background Image */}
                <img
                    src="/assets/branding/cert_background.png"
                    className="absolute inset-0 w-full h-full object-cover"
                    alt="Certificate Background"
                />

                {/* Content Overlay - Extreme Safe Zone (Margins to avoid the thick borders) */}
                <div className="relative z-10 w-full h-full pt-[140px] pb-[120px] px-[220px] flex flex-col items-center justify-between">

                    {/* Platform Logo / Branding */}
                    <div className="mb-4">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center text-4xl font-black tracking-tighter leading-none mb-1">
                                <span className="bg-gradient-to-r from-blue-900 to-sky-700 bg-clip-text text-transparent">NextMove</span>
                                <span className="bg-gradient-to-r from-orange-500 to-amber-600 bg-clip-text text-transparent ml-2">Académie</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                                Digital Hub & Strategic Asset
                            </span>
                        </div>
                    </div>

                    {/* Main Body */}
                    <div className="flex flex-col items-center gap-3">
                        <h1 className="text-5xl font-black uppercase text-slate-900 tracking-tight mb-2">Certificat de Réussite</h1>
                        <p className="text-sm text-slate-400 uppercase tracking-[0.3em] font-bold">Ce document officiel atteste que</p>

                        {/* Student Name */}
                        <div className="relative w-full px-12 my-2">
                            <div className="absolute top-1/2 left-0 right-0 h-4 bg-orange-100/30 -rotate-1 -translate-y-1/2 z-0" />
                            <h2 className={`${studentName.length > 30 ? 'text-4xl' : studentName.length > 20 ? 'text-5xl' : 'text-7xl'} font-bold text-orange-600 font-cursive italic p-4 relative z-10 whitespace-nowrap drop-shadow-sm`}>
                                {studentName}
                            </h2>
                        </div>

                        <p className="text-sm text-slate-400 uppercase tracking-[0.2em] font-bold">a complété avec succès le programme de formation stratégique</p>

                        {/* Course Name */}
                        <h3 className={`${courseName.length > 50 ? 'text-xl' : courseName.length > 35 ? 'text-2xl' : 'text-4xl'} font-black text-slate-800 max-w-full mx-auto leading-tight px-4 uppercase tracking-tight`}>
                            {courseName}
                        </h3>
                    </div>

                    {/* Details Grid (Seals / Signatures) */}
                    <div className="grid grid-cols-2 gap-40 items-end w-full max-w-xl mb-6">
                        <div className="text-center">
                            <div className="mb-2 flex flex-col items-center">
                                <div className="w-24 h-24 relative mb-1">
                                    <img
                                        src="/pwa-512x512.png"
                                        alt="Sceau Officiel"
                                        className="w-full h-full object-contain opacity-95 grayscale hover:grayscale-0 transition-all duration-500"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.add('bg-orange-100', 'rounded-full', 'flex', 'items-center', 'justify-center');
                                            e.currentTarget.parentElement!.innerHTML = '<svg className="w-12 h-12 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="h-px bg-slate-300 w-full mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sceau Officiel</p>
                        </div>

                        <div className="text-center">
                            <div className="mb-2 h-24 flex items-center justify-center">
                                <img
                                    src="/assets/branding/signature.png"
                                    alt="Signature"
                                    className="max-h-full object-contain mix-blend-multiply scale-125"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div className="font-cursive text-3xl text-slate-600 italic">C. A. K. D. Djitte</div>';
                                    }}
                                />
                            </div>
                            <div className="h-px bg-slate-300 w-full mb-2" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direction Académique</p>
                        </div>
                    </div>

                    {/* Footer Metadata */}
                    <div className="flex justify-between w-full text-[9px] text-slate-400 uppercase tracking-[0.2em] font-mono font-bold">
                        <span>Archive_ID: {certificateId}</span>
                        <span>Délivré le : {new Date(certifiedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>Logistique_Nexus_V2026</span>
                    </div>
                </div>
            </div>
        );
    }
);
export default CertificateTemplate;
