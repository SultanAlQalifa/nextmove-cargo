
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { User, ArrowRight, Loader2, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";
import { useBranding } from "../contexts/BrandingContext";
import PhoneInputWithCountry from "../components/auth/PhoneInputWithCountry";
import { motion, AnimatePresence } from "framer-motion";

// Schema validation
const completeProfileSchema = z.object({
    firstName: z.string().min(2, "Le prénom est requis"),
    lastName: z.string().min(2, "Le nom est requis"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
});

interface CompleteProfileForm {
    firstName: string;
    lastName: string;
    phone: string;
}

export default function CompleteProfile() {
    const { user, profile, refreshProfile, loading: authLoading } = useAuth();
    const { settings } = useBranding();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        trigger,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(completeProfileSchema),
        defaultValues: {
            usage: 'personal'
        }
    });

    const phoneValue = watch("phone");
    const firstName = watch("firstName");
    const lastName = watch("lastName");
    const usage = watch("usage");

    // Skip for admins and internal staff
    useEffect(() => {
        if (!authLoading && profile) {
            const isInternalRole = ['admin', 'super-admin', 'support', 'manager', 'driver'].includes(profile.role);
            if (isInternalRole) {
                navigate("/dashboard", { replace: true });
            }
        }
    }, [profile, authLoading, navigate]);

    useEffect(() => {
        if (!authLoading && profile) {
            const hasName = profile.full_name && profile.full_name.trim().includes(' ');
            const hasPhone = profile.phone && profile.phone.length >= 8;

            if (hasName && hasPhone) {
                navigate("/dashboard", { replace: true });
                return;
            }

            if (profile.full_name) {
                const parts = profile.full_name.trim().split(' ');
                if (parts.length >= 1) setValue("firstName", parts[0]);
                if (parts.length >= 2) setValue("lastName", parts.slice(1).join(' '));
            }
            if (profile.phone) {
                setValue("phone", profile.phone);
            }
        }

        if (!authLoading && user?.user_metadata?.full_name && !profile?.full_name) {
            const parts = user.user_metadata.full_name.split(' ');
            if (parts.length >= 1) setValue("firstName", parts[0]);
            if (parts.length >= 2) setValue("lastName", parts.slice(1).join(' '));
        }
    }, [user, profile, authLoading, setValue, navigate]);

    const nextStep = async () => {
        let fieldsToValidate: string[] = [];
        if (step === 1) fieldsToValidate = ["firstName", "lastName"];
        if (step === 2) fieldsToValidate = ["phone"];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const onSubmit = async (data: any) => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const fullName = `${data.firstName} ${data.lastName}`.trim();

            const { error: metaError } = await supabase.auth.updateUser({
                data: {
                    full_name: fullName,
                    usage_type: data.usage
                }
            });
            if (metaError) throw metaError;

            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (existingProfile) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        full_name: fullName,
                        phone: data.phone,
                        metadata: { usage_type: data.usage }
                    })
                    .eq('id', user.id);

                if (profileError) throw profileError;
            } else {
                const { error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        role: 'client',
                        full_name: fullName,
                        phone: data.phone,
                        account_status: 'active',
                        metadata: { usage_type: data.usage }
                    });

                if (createError) throw createError;
            }

            await refreshProfile();
            navigate("/dashboard", { replace: true });

        } catch (err: any) {
            console.error("Error completing profile:", err);
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: "Identité", icon: <User className="w-4 h-4" /> },
        { id: 2, title: "Contact", icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 3, title: "Usage", icon: <Sparkles className="w-4 h-4" /> }
    ];

    return (
        <div className="min-h-screen flex bg-white dark:bg-gray-950 overflow-hidden font-sans">
            {/* Left Side - Hero Image */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <motion.img
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    src={
                        settings?.images.login_background ||
                        "https://images.unsplash.com/photo-1566576912906-253c7235575a?q=80&w=2070&auto=format&fit=crop"
                    }
                    alt="Logistics Dashboard"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900/80 to-black/90"></div>

                <div className="relative z-10 flex flex-col justify-between p-20 text-white w-full h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center space-x-4"
                    >
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="h-14 object-contain" />
                        ) : (
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-blue-500/40">
                                <span className="font-black text-3xl italic">N</span>
                            </div>
                        )}
                        <span className="text-3xl font-black tracking-tight uppercase">NextMove <span className="text-blue-400">Cargo</span></span>
                    </motion.div>

                    <div className="mb-8">
                        <motion.h2
                            key={step}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="text-6xl font-black mb-10 leading-[1.1] tracking-tight"
                        >
                            {step === 1 ? "Commençons par" : step === 2 ? "Comment vous" : "Dernière"} <br />
                            <span className="text-blue-500">
                                {step === 1 ? "faire connaissance 👋" : step === 2 ? "contacter ? 📱" : "étape cruciale 🚀"}
                            </span>
                        </motion.h2>

                        <div className="space-y-8">
                            {steps.map((s, i) => (
                                <motion.div
                                    key={s.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: step >= s.id ? 1 : 0.3, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start gap-5"
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 transition-all duration-500 shadow-lg ${step >= s.id ? 'bg-white text-blue-900 scale-110 shadow-white/20' : 'bg-blue-500/20 border border-blue-500/30 text-blue-400'}`}>
                                        {step > s.id ? <CheckCircle2 className="w-6 h-6" /> : s.id}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-xl text-white mb-1 uppercase tracking-wide">{s.title}</h4>
                                        <p className="text-blue-100/60 font-medium">
                                            {s.id === 1 ? "Vos informations civiles de base." : s.id === 2 ? "Numéro pour le suivi WhatsApp." : "Votre profil d'utilisation."}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.p className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
                        Système de Management Logistique v4.0
                    </motion.p>
                </div>
            </div>

            {/* Right Side - Wizard Form */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-gray-950 relative scrollbar-hide">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

                {/* Progress Bar Top */}
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-800 z-50">
                    <motion.div
                        className="h-full bg-blue-600"
                        animate={{ width: `${(step / steps.length) * 100}%` }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                    />
                </div>

                <div className="flex min-h-full flex-col justify-center py-20 px-8 sm:px-12 lg:px-20 xl:px-32 relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="mx-auto w-full max-w-md lg:max-w-xl"
                        >
                            <div className="mb-10 flex justify-between items-end">
                                <div>
                                    <span className="text-blue-600 font-black text-xs uppercase tracking-widest mb-2 block">Étape {step} sur {steps.length}</span>
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {steps[step - 1].title}
                                    </h2>
                                </div>
                                <div className="text-slate-300 dark:text-slate-800 select-none">
                                    {steps[step - 1].icon}
                                </div>
                            </div>

                            <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-5 rounded-r-2xl mb-8 flex items-center gap-3">
                                        <Sparkles className="w-5 h-5 text-red-500 shrink-0" />
                                        <p className="text-sm text-red-700 dark:text-red-400 font-bold">{error}</p>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest">Prénom</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                                    <User className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                                </div>
                                                <input type="text" {...register("firstName")} className="block w-full pl-12 pr-5 py-4.5 border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.25rem] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all font-medium shadow-xl shadow-slate-200/20" placeholder="Jean" />
                                                {errors.firstName && (<p className="mt-2 text-[10px] text-red-500 font-black uppercase tracking-tighter">{errors.firstName.message as any}</p>)}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest">Nom</label>
                                            <input type="text" {...register("lastName")} className="block w-full px-5 py-4.5 border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.25rem] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 transition-all font-medium shadow-xl shadow-slate-200/20" placeholder="Dupont" />
                                            {errors.lastName && (<p className="mt-2 text-[10px] text-red-500 font-black uppercase tracking-tighter">{errors.lastName.message as any}</p>)}
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="space-y-3">
                                            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest">Numéro WhatsApp</label>
                                            <PhoneInputWithCountry value={phoneValue || ""} onChange={(val) => setValue("phone", val)} required />
                                            {errors.phone && (<p className="mt-2 text-[10px] text-red-500 font-black uppercase tracking-tighter">{errors.phone.message as any}</p>)}
                                        </div>
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/30 flex gap-4 items-center">
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-lg">
                                                <ShieldCheck className="text-blue-600 w-5 h-5" />
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                Nous utilisons WhatsApp pour vous envoyer vos notifications de suivi en temps réel et vos factures PDF.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest text-center mb-4">Quel type de client êtes-vous ?</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                { id: 'personal', label: 'Particulier', icon: '👤', desc: 'Livraisons perso' },
                                                { id: 'business', label: 'Business', icon: '💼', desc: 'Gestion d\'entreprise' },
                                                { id: 'ecommerce', label: 'E-commerce', icon: '🛒', desc: 'Sourcing & Vente' }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setValue("usage", opt.id)}
                                                    className={`p-6 rounded-[2rem] border-2 transition-all duration-300 text-left group ${usage === opt.id ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-2xl shadow-blue-500/10' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-slate-700 bg-white dark:bg-slate-900'}`}
                                                >
                                                    <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform">{opt.icon}</span>
                                                    <h4 className={`font-black uppercase tracking-widest text-xs mb-1 ${usage === opt.id ? 'text-blue-600' : 'text-slate-900 dark:text-white'}`}>{opt.label}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold">{opt.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-10 flex gap-4">
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="px-8 py-5 rounded-[1.5rem] border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black uppercase text-xs hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
                                        >
                                            Retour
                                        </button>
                                    )}

                                    {step < steps.length ? (
                                        <button
                                            type="button"
                                            onClick={nextStep}
                                            className="flex-1 flex justify-center items-center py-5 px-8 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all font-black text-xs uppercase tracking-widest group"
                                        >
                                            Continuer
                                            <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    ) : (
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="flex-1 flex justify-center items-center py-5 px-8 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all font-black text-xs uppercase tracking-widest group disabled:opacity-50"
                                        >
                                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                                <>
                                                    Activer mon compte
                                                    <ShieldCheck className="ml-3 w-4 h-4" />
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] pt-8">
                                    Sécurisé par NextMove Global • Version 2025
                                </p>
                            </form>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
