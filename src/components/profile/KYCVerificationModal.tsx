import React, { useState } from 'react';
import {
    ShieldCheck,
    Upload,
    X,
    CheckCircle,
    AlertCircle,
    ArrowRight,
    ArrowLeft,
    Camera,
    FileText,
    User,
    Zap
} from 'lucide-react';
import { kycService } from '../../services/kycService';

interface KYCVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function KYCVerificationModal({ isOpen, onClose, onSuccess }: KYCVerificationModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        dob: '',
        id_type: 'id_card',
        id_number: '',
    });

    const [files, setFiles] = useState<File[]>([]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (files.length === 0) {
            setError("Veuillez ajouter au moins un document justificatif.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await kycService.submitKYC({
                ...formData,
                files
            });
            setSuccess(true);
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 3000);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue lors de la soumission.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative border border-slate-200 dark:border-gray-800">
                {/* Header */}
                <div className="bg-blue-600 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        aria-label="Fermer la modal"
                        className="absolute right-4 top-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-8 h-8" />
                        <h2 className="text-xl font-bold">Vérification d'Identité (KYC)</h2>
                    </div>
                    <p className="text-blue-100 text-sm">
                        Conformément aux régulations AML, une vérification est requise pour les transactions importantes.
                    </p>

                    {/* Progress Bar */}
                    <div className="mt-6 flex gap-2">
                        <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-white' : 'bg-white/30'}`} />
                        <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 3 ? 'bg-white' : 'bg-white/30'}`} />
                    </div>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-8 animate-in zoom-in">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Documents Reçus !</h3>
                            <p className="text-slate-500 dark:text-slate-400">
                                Nos services examinent vos documents. Vous recevrez une notification d'ici 24h à 48h.
                            </p>
                        </div>
                    ) : (
                        <>
                            {step === 1 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold mb-4 uppercase text-xs tracking-wider">
                                        <User className="w-4 h-4" />
                                        Informations Personnelles
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="first_name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Prénom</label>
                                            <input
                                                id="first_name"
                                                type="text"
                                                value={formData.first_name}
                                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                                className="w-full rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-3"
                                                placeholder="Jean"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="last_name" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nom</label>
                                            <input
                                                id="last_name"
                                                type="text"
                                                value={formData.last_name}
                                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                                className="w-full rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-3"
                                                placeholder="Dupont"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="dob" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Date de naissance</label>
                                        <input
                                            id="dob"
                                            type="date"
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                            className="w-full rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-3"
                                        />
                                    </div>
                                    <button
                                        disabled={!formData.first_name || !formData.last_name || !formData.dob}
                                        onClick={() => setStep(2)}
                                        aria-label="Continuer à l'étape suivante"
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all mt-4"
                                    >
                                        Continuer <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold mb-4 uppercase text-xs tracking-wider">
                                        <FileText className="w-4 h-4" />
                                        Type de Document
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'id_card', label: 'Carte Nationale d\'Identité', icon: User },
                                            { id: 'passport', label: 'Passeport International', icon: CheckCircle },
                                            { id: 'driver_license', label: 'Permis de Conduire', icon: Zap }
                                        ].map((doc) => (
                                            <div
                                                key={doc.id}
                                                onClick={() => setFormData({ ...formData, id_type: doc.id })}
                                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${formData.id_type === doc.id
                                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                                    : 'border-slate-100 dark:border-gray-800 hover:border-blue-200'
                                                    }`}
                                            >
                                                <div className={`p-2 rounded-xl ${formData.id_type === doc.id ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-gray-800'}`}>
                                                    <doc.icon className="w-5 h-5" />
                                                </div>
                                                <span className="font-bold text-slate-900 dark:text-white">{doc.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4">
                                        <label htmlFor="id_number" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Numéro de document</label>
                                        <input
                                            id="id_number"
                                            type="text"
                                            value={formData.id_number}
                                            onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                                            className="w-full rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 p-3"
                                            placeholder="Ex: 1547842XXXX"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(1)}
                                            aria-label="Retourner à l'étape précédente"
                                            className="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            disabled={!formData.id_number}
                                            onClick={() => setStep(3)}
                                            aria-label="Continuer à l'étape suivante"
                                            className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
                                        >
                                            Continuer <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="flex items-center gap-2 text-blue-600 font-bold mb-4 uppercase text-xs tracking-wider">
                                        <Camera className="w-4 h-4" />
                                        Photos du Document
                                    </div>

                                    <div
                                        onClick={() => document.getElementById('kyc-file-upload')?.click()}
                                        className="border-2 border-dashed border-slate-200 dark:border-gray-800 rounded-3xl p-8 text-center bg-slate-50/50 dark:bg-gray-800/30 hover:border-blue-400 transition-all cursor-pointer"
                                    >
                                        <label htmlFor="kyc-file-upload" className="sr-only">Upload de documents KYC</label>
                                        <input
                                            id="kyc-file-upload"
                                            type="file"
                                            multiple
                                            hidden
                                            onChange={handleFileChange}
                                            accept="image/*,.pdf"
                                        />
                                        <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                            <Upload className="w-8 h-8 text-blue-600" />
                                        </div>
                                        <p className="font-bold text-slate-900 dark:text-white text-lg">Cliquez pour uploader</p>
                                        <p className="text-slate-500 text-sm">Recto et Verso attendus pour la carte d'identité.</p>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="grid grid-cols-2 gap-3">
                                            {files.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl relative group">
                                                    <span className="text-xs font-bold text-blue-800 dark:text-blue-300 truncate pr-4">
                                                        {file.name}
                                                    </span>
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="text-red-500 hover:bg-red-50 p-1 rounded-full"
                                                        aria-label={`Supprimer le fichier ${file.name}`}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-3 animate-pulse">
                                            <AlertCircle className="w-5 h-5 text-red-600" />
                                            <span className="text-sm font-bold text-red-700 dark:text-red-400">{error}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setStep(2)}
                                            aria-label="Retourner à l'étape précédente"
                                            className="flex-1 bg-slate-100 dark:bg-gray-800 text-slate-600 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            disabled={loading || files.length === 0}
                                            onClick={handleSubmit}
                                            className="flex-[2] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all"
                                        >
                                            {loading ? "Soumission..." : "Finaliser la vérification"}
                                            {!loading && <CheckCircle className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
