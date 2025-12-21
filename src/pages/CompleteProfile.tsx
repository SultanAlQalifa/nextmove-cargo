
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { User, Lock, Save, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { useBranding } from "../contexts/BrandingContext";
import { useBranding } from "../contexts/BrandingContext";
import PhoneInputWithCountry from "../components/auth/PhoneInputWithCountry";

// Schema validation

// Improved Schema with refinement that knows about isExternalUser
// However, since zodResolver(schema) doesn't easily take external context, 
// we'll keep the schema broad and handle specific validation if needed, 
// or just use the refinement for password matching.
const getCompleteProfileSchema = (isExternal: boolean) => z.object({
    firstName: z.string().min(2, "Le prénom est requis"),
    lastName: z.string().min(2, "Le nom est requis"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    password: isExternal ? z.string().optional() : z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    confirmPassword: z.string().optional(),
}).refine((data) => {
    if (!isExternal && data.password !== data.confirmPassword) return false;
    return true;
}, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

interface CompleteProfileForm {
    firstName: string;
    lastName: string;
    phone: string;
    password?: string;
    confirmPassword?: string;
}

export default function CompleteProfile() {
    const { user, refreshProfile } = useAuth();
    const { settings } = useBranding();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isExternalUser = user?.app_metadata?.provider === 'google' || user?.app_metadata?.provider === 'phone';

    // Select schema based on auth provider
    const activeSchema = useMemo(() => {
        return getCompleteProfileSchema(isExternalUser);
    }, [isExternalUser]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<any>({
        resolver: zodResolver(activeSchema),
    });

    const phoneValue = watch("phone");

    // Pre-fill name from Google Metadata if available
    useEffect(() => {
        if (user?.user_metadata?.full_name) {
            const parts = user.user_metadata.full_name.split(' ');
            if (parts.length >= 1) setValue("firstName", parts[0]);
            if (parts.length >= 2) setValue("lastName", parts.slice(1).join(' '));
        }
    }, [user, setValue]);


    const onSubmit = async (data: CompleteProfileForm) => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            const fullName = `${data.firstName} ${data.lastName}`.trim();

            // 1. Update Password (ONLY if not External User)
            if (!isExternalUser && data.password) {
                const { error: authError } = await supabase.auth.updateUser({
                    password: data.password,
                    data: { full_name: fullName }
                });
                if (authError) throw authError;
            } else {
                // Just update metadata if no password change needed
                const { error: metaError } = await supabase.auth.updateUser({
                    data: { full_name: fullName }
                });
                if (metaError) throw metaError;
            }

            // 2. Update Profile in DB (Self-healing: Insert if missing)
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
                    })
                    .eq('id', user.id);

                if (profileError) throw profileError;
            } else {
                // Fallback: Create profile if trigger failed
                const { error: createError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        role: 'client',
                        full_name: fullName,
                        phone: data.phone,
                        account_status: 'active'
                    });

                if (createError) throw createError;
            }

            // 3. Refresh Context and Redirect
            await refreshProfile();
            navigate("/dashboard", { replace: true });

        } catch (err: any) {
            console.error("Error completing profile:", err);
            setError(err.message || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex bg-white dark:bg-dark-bg overflow-hidden">
            {/* Left Side - Hero Image (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <img
                    src={
                        settings?.images.login_background ||
                        "https://images.unsplash.com/photo-1566576912906-253c7235575a?q=80&w=2070&auto=format&fit=crop"
                    }
                    alt="Logistics Dashboard"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>

                <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full h-full">
                    <div className="flex items-center space-x-4">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt="Logo" className="h-12 object-contain" />
                        ) : (
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                                <span className="font-bold text-2xl">N</span>
                            </div>
                        )}
                        <span className="text-2xl font-bold tracking-tight">NextMove Cargo</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-4xl font-bold mb-6 leading-tight">
                            Dernière étape avant <br />
                            <span className="text-blue-400">le décollage 🚀</span>
                        </h2>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 font-bold shrink-0">1</div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Connexion validée</h4>
                                    <p className="text-sm text-blue-200">Votre email est vérifié et sécurisé.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-white text-blue-900 flex items-center justify-center font-bold shrink-0 shadow-lg shadow-white/20">2</div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Profil & Sécurité</h4>
                                    <p className="text-sm text-blue-200">Ajoutez vos infos et sécurisez votre accès.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 opacity-50">
                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-500 font-bold shrink-0">3</div>
                                <div>
                                    <h4 className="font-bold text-white mb-1">Accès Dashboard</h4>
                                    <p className="text-sm text-slate-400">Gérez vos expéditions immédiatement.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-gray-950 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

                <div className="flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
                    <div className="mx-auto w-full max-w-sm lg:w-[450px]">

                        <div className="text-center lg:text-left mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                                Finaliser votre profil
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400">
                                Ces informations sont nécessaires pour la facturation et pour vous contacter lors de vos livraisons.
                            </p>
                        </div>

                        <form className="space-y-6" onSubmit={handleSubmit(onSubmit, (e) => console.error("Validation Errors:", e))}>
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl animate-in slide-in-from-top-2">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                        Prénom
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            type="text"
                                            {...register("firstName")}
                                            className="block w-full pl-11 pr-4 py-3.5 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                                            placeholder="Jean"
                                        />
                                    </div>
                                    {errors.firstName && (<p className="ml-1 text-xs text-red-500 font-medium">{errors.firstName.message as any}</p>)}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                        Nom
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            {...register("lastName")}
                                            className="block w-full px-4 py-3.5 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                                            placeholder="Dupont"
                                        />
                                    </div>
                                    {errors.lastName && (<p className="ml-1 text-xs text-red-500 font-medium">{errors.lastName.message as any}</p>)}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                    Numéro de téléphone
                                </label>
                                <PhoneInputWithCountry
                                    value={phoneValue || ""}
                                    onChange={(val) => setValue("phone", val)}
                                    required
                                />
                                {errors.phone && (<p className="ml-1 text-xs text-red-500 font-medium">{errors.phone.message as any}</p>)}
                            </div>

                            {!isExternalUser && (
                                <>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                                        <div className="flex gap-3">
                                            <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                                            <div>
                                                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-1">Sécurisez votre compte</h4>
                                                <p className="text-xs text-blue-700 dark:text-blue-300">
                                                    Définissez un mot de passe pour pouvoir vous connecter sans Google la prochaine fois.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                {...register("password")}
                                                className="block w-full pl-11 pr-4 py-3.5 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                                                placeholder="Nouveau mot de passe"
                                            />
                                        </div>
                                        {errors.password && (<p className="ml-1 text-xs text-red-500 font-medium">{errors.password.message as any}</p>)}

                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <CheckCircle2 className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                type="password"
                                                {...register("confirmPassword")}
                                                className="block w-full pl-11 pr-4 py-3.5 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                                                placeholder="Confirmer mot de passe"
                                            />
                                        </div>
                                        {errors.confirmPassword && (<p className="ml-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message as any}</p>)}
                                    </div>
                                </>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-600/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Finalisation...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-5 w-5" />
                                        Accéder à mon espace
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
