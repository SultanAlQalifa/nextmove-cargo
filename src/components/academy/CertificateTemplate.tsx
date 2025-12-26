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
                <div className="relative z-10 w-full h-full pt-[150px] pb-[130px] px-[220px] flex flex-col items-center justify-between">

                    {/* Platform Logo / Branding */}
                    <div className="mb-6">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center text-4xl font-black tracking-tighter leading-none mb-1">
                                <span className="text-blue-800">NextMove</span>
                                <span className="text-orange-500 ml-1">Académie</span>
                            </div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">
                                Logistique Premium
                            </span>
                        </div>
                    </div>

                    {/* Main Body */}
                    <div className="flex flex-col items-center gap-4">
                        <h1 className="text-4xl font-black uppercase text-slate-900 tracking-tight">Certificat de Réussite</h1>
                        <p className="text-base text-slate-500 uppercase tracking-[0.2em]">Ce document atteste que</p>

                        {/* Student Name */}
                        <div className="relative w-full px-12">
                            <div className="absolute top-1/2 left-0 right-0 h-4 bg-orange-100/40 -rotate-1 -translate-y-1/2 z-0" />
                            <h2 className={`${studentName.length > 30 ? 'text-3xl' : studentName.length > 20 ? 'text-4xl' : 'text-6xl'} font-bold text-orange-600 font-cursive italic p-4 relative z-10 font-serif whitespace-nowrap`}>
                                {studentName}
                            </h2>
                        </div>

                        <p className="text-lg text-slate-500 uppercase tracking-[0.2em]">a complété avec succès le programme de formation</p>

                        {/* Course Name */}
                        <h3 className={`${courseName.length > 50 ? 'text-lg' : courseName.length > 35 ? 'text-xl' : 'text-3xl'} font-bold text-slate-800 max-w-full mx-auto leading-tight px-4 whitespace-nowrap`}>
                            {courseName}
                        </h3>
                    </div>

                    {/* Details Grid (Seals / Signatures) */}
                    <div className="grid grid-cols-2 gap-32 items-end w-full max-w-lg mb-4">
                        <div className="text-center">
                            <div className="mb-2 flex flex-col items-center">
                                <div className="w-20 h-20 relative mb-1">
                                    <img
                                        src="/pwa-512x512.png"
                                        alt="Sceau Officiel"
                                        className="w-full h-full object-contain opacity-95"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.add('bg-orange-100', 'rounded-full', 'flex', 'items-center', 'justify-center');
                                            e.currentTarget.parentElement!.innerHTML = '<svg class="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="h-px bg-slate-300 w-full mb-1" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sceau Officiel</p>
                        </div>

                        <div className="text-center">
                            <div className="mb-2 h-20 flex items-center justify-center">
                                <img
                                    src="/assets/branding/signature.png"
                                    alt="Signature"
                                    className="max-h-full object-contain mix-blend-multiply scale-125"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement!.innerHTML = '<div class="font-cursive text-2xl text-slate-600 italic">Cheikh Abdoul Khadre</div>';
                                    }}
                                />
                            </div>
                            <div className="h-px bg-slate-300 w-full mb-1" />
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Directeur Académique</p>
                        </div>
                    </div>

                    {/* Footer Metadata - Higher inside bottom border */}
                    <div className="flex justify-between w-full text-[8px] text-slate-400 uppercase tracking-widest font-sans font-bold">
                        <span>ID: {certificateId}</span>
                        <span>Délivré le : {new Date(certifiedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>NextMove Académie</span>
                    </div>
                </div>
            </div>
        );
    }
);
export default CertificateTemplate;
