import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Truck, Package, Anchor, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import GoogleLoginButton from '../components/auth/GoogleLoginButton';

export default function Register() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('client');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [success, setSuccess] = useState(false);

    // Pre-fill email from URL if present (e.g. coming from BecomeForwarder)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        const roleParam = params.get('role');

        if (emailParam) setEmail(emailParam);
        if (roleParam) setRole(roleParam);
    }, []);

    useEffect(() => {
        if (!authLoading && user) {
            navigate('/dashboard');
        }
    }, [user, authLoading, navigate]);

    const roles = [
        { id: 'client', icon: User, label: t('auth.roles.client') },
        { id: 'forwarder', icon: Anchor, label: t('auth.roles.forwarder') },
    ];

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            setLoading(false);
            return;
        }

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: role,
                    },
                },
            });

            if (signUpError) throw signUpError;

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                // User already exists
                setError("Un compte existe déjà avec cette adresse email. Veuillez vous connecter.");
                setLoading(false);
                return;
            }

            if (data.user) {
                // Profile is now created automatically by DB trigger 'on_auth_user_created'

                // If session is null, email confirmation is required
                if (!data.session) {
                    setSuccess(true);
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            if (err.message.includes('already registered')) {
                setError("Un compte existe déjà avec cette adresse email. Veuillez vous connecter.");
            } else {
                setError(err.message || "Une erreur est survenue lors de l'inscription.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="h-screen flex bg-white overflow-hidden">
                {/* Left Side - Image (Same as before) */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <img
                        src="https://images.unsplash.com/photo-1494412651409-ae1c40e5f16b?q=80&w=2070&auto=format&fit=crop"
                        alt="Logistics Hub"
                        className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>
                    <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full h-full">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                                <span className="font-bold text-2xl">N</span>
                            </div>
                            <span className="text-2xl font-bold tracking-tight">NextMove Cargo</span>
                        </div>
                        <div className="mb-8">
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                                {t('hero.title')}
                            </h2>
                            <p className="text-xl text-blue-100 max-w-md font-light leading-relaxed">
                                {t('hero.subtitle')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Success Message */}
                <div className="flex-1 flex flex-col justify-center items-center p-4 bg-slate-50 dark:bg-gray-950">
                    <div className="max-w-md w-full text-center space-y-8">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                            <Mail className="w-10 h-10" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Vérifiez votre email</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed">
                                Un lien de confirmation a été envoyé à <span className="font-bold text-slate-900 dark:text-white">{email}</span>.
                            </p>
                            <p className="text-slate-500 dark:text-slate-500 mt-2">
                                Veuillez cliquer sur le lien pour activer votre compte et accéder à la plateforme.
                            </p>
                        </div>
                        <div className="pt-4 space-y-4">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors w-full"
                            >
                                Retour à la connexion
                            </Link>

                            <button
                                onClick={async () => {
                                    try {
                                        setLoading(true);
                                        const { error } = await supabase.auth.resend({
                                            type: 'signup',
                                            email: email,
                                        });
                                        if (error) throw error;
                                        alert('Email renvoyé avec succès !');
                                    } catch (err: any) {
                                        alert(err.message || 'Erreur lors du renvoi.');
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                                className="inline-flex items-center justify-center px-8 py-3 border border-slate-200 dark:border-slate-800 text-base font-medium rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Renvoyer l'email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-white overflow-hidden">
            {/* Left Side - Image & Testimonial (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <img
                    src="https://images.unsplash.com/photo-1494412651409-ae1c40e5f16b?q=80&w=2070&auto=format&fit=crop"
                    alt="Logistics Hub"
                    className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-1000 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>

                <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full h-full">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                            <span className="font-bold text-2xl">N</span>
                        </div>
                        <span className="text-2xl font-bold tracking-tight">NextMove Cargo</span>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
                            {t('hero.title')}
                        </h2>
                        <p className="text-xl text-blue-100 max-w-md font-light leading-relaxed">
                            {t('hero.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-gray-950 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

                <div className="flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
                    <div className="mx-auto w-full max-w-md">
                        <div className="lg:hidden mb-10 text-center">
                            <span className="text-3xl font-bold text-blue-600">NextMove Cargo</span>
                        </div>

                        <div className="text-center lg:text-left mb-10">
                            <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                                {t('auth.createAccount')}
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400">
                                {t('auth.signUpSubtitle')}
                            </p>
                        </div>

                        <div className="mt-8">
                            <form onSubmit={handleRegister} className="space-y-8">
                                {error && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl animate-in slide-in-from-top-2">
                                        <div className="flex">
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <GoogleLoginButton text="S'inscrire avec Google" />
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                                        </div>
                                        <div className="relative flex justify-center text-sm">
                                            <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Ou s'inscrire avec email</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Role Selection Cards */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider ml-1">
                                        {t('auth.roleSelection')}
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {roles.map((r) => {
                                            const Icon = r.icon;
                                            const isSelected = role === r.id;
                                            return (
                                                <div
                                                    key={r.id}
                                                    onClick={() => setRole(r.id)}
                                                    className={`relative flex items-center p-4 cursor-pointer rounded-2xl border-2 transition-all duration-200 group ${isSelected
                                                        ? 'border-blue-500 bg-white dark:bg-slate-900 ring-1 ring-blue-500 shadow-lg shadow-blue-500/10'
                                                        : 'border-transparent bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-slate-700 shadow-sm'
                                                        }`}
                                                >
                                                    <div className={`flex-shrink-0 p-3 rounded-xl transition-colors ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-500'}`}>
                                                        <Icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="ml-3">
                                                        <span className={`block text-sm font-bold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                            {r.label}
                                                        </span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-2 right-2 text-blue-500 animate-in zoom-in duration-200">
                                                            <CheckCircle2 className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                            {t('auth.email')}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                id="email"
                                                name="email"
                                                type="email"
                                                autoComplete="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-4 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                                                placeholder="name@company.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                            {t('auth.password')}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                id="password"
                                                name="password"
                                                type="password"
                                                autoComplete="new-password"
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="block w-full pl-11 pr-4 py-4 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="confirmPassword" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                                            Confirmer le mot de passe
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            </div>
                                            <input
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                type="password"
                                                autoComplete="new-password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className={`block w-full pl-11 pr-4 py-4 border-2 ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-transparent focus:border-blue-500/20 focus:ring-blue-500/10'} bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200`}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        {confirmPassword && password !== confirmPassword && (
                                            <p className="text-sm text-red-500 font-medium animate-in slide-in-from-top-1 ml-1">
                                                Les mots de passe ne correspondent pas
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-600/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                                {t('auth.signingUp')}
                                            </>
                                        ) : (
                                            <>
                                                {t('auth.signUp')}
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-10">
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-slate-50 dark:bg-gray-950 text-slate-500 font-medium">
                                            {t('auth.hasAccount')}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <Link
                                        to="/login"
                                        className="w-full flex justify-center items-center py-4 px-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 hover:-translate-y-1"
                                    >
                                        {t('auth.signIn')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
