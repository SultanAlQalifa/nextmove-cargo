import { useState } from "react";
import { X, UserPlus, Loader2, Phone, Mail, User } from "lucide-react";
import { posService } from "../../services/posService";
import { useToast } from "../../contexts/ToastContext";

interface QuickClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: any) => void;
}

export default function QuickClientModal({ isOpen, onClose, onSuccess }: QuickClientModalProps) {
    const { success: showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        email: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const newUser = await posService.quickCreateClient(formData);
            showSuccess("Client créé avec succès !");
            onSuccess(newUser);
            onClose();
        } catch (error: any) {
            console.error("Error creating client:", error);
            showError(error.message || "Erreur lors de la création du client");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl w-full max-w-md rounded-3xl shadow-2xl border border-white/40 dark:border-slate-700/50 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                    <div className="flex items-center gap-3 text-white relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
                            <UserPlus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black tracking-wide">Nouveau Passager</h3>
                            <p className="text-[10px] text-indigo-100 uppercase tracking-widest font-bold mt-0.5">Création Express</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
                        title="Fermer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-7 space-y-5 relative">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 block">
                            Nom Complet
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                required
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                className="block w-full pl-12 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700/50 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-medium"
                                placeholder="Ex: Jean Dupont"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 block">
                            Téléphone
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Phone className="h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                            </div>
                            <input
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="block w-full pl-12 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700/50 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-medium"
                                placeholder="Ex: +221 77..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1 block drop-shadow-sm">
                            Email <span className="text-[9px] text-slate-400 normal-case tracking-normal">(Optionnel)</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="block w-full pl-12 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded-2xl outline-none transition-all font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-medium"
                                placeholder="client@email.com"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || !formData.full_name || !formData.phone}
                            className={`w-full py-4 rounded-2xl font-black text-base shadow-xl transition-all flex items-center justify-center gap-3 min-h-[56px] relative overflow-hidden group ${loading || !formData.full_name || !formData.phone
                                ? 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-indigo-500/30 active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {(!loading && formData.full_name && formData.phone) && (
                                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                    )}
                                    <UserPlus className="w-5 h-5 relative z-10" />
                                    <span className="relative z-10 tracking-widest uppercase">Créer le Client</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
