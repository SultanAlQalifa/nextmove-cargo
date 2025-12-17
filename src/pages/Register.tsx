import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { useTranslation } from "react-i18next";
import {
  Mail,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { z } from "zod";
import { useBranding } from "../contexts/BrandingContext";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";

export default function Register() {
  useTranslation();
  const { settings } = useBranding();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState(false);

  // Pre-fill
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, []);

  // Redirect if already logged in (and profile complete)
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);


  const registerSchema = z.object({
    email: z.string().email("Email invalide"),
    referralCode: z.string().optional(),
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate
    const validation = registerSchema.safeParse({ email, referralCode });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    try {
      // Use Edge Function to handle signup + custom email delivery
      // This bypasses Supabase default SMTP which is currently unstable
      const { data, error: fnError } = await supabase.functions.invoke('public-signup', {
        body: {
          email,
          referral_code_used: referralCode,
          role: 'client',
          logo_url: settings?.logo_url // Send specific field instead of full object
        }
      });

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      setSuccess(true);
      showSuccess("Lien de connexion envoyé !");

    } catch (err: any) {
      console.error("Registration error:", err);
      let msg = err.message;
      try {
        // Try to parse if it's a JSON string error from Edge Function
        const parsed = JSON.parse(err.message);
        if (parsed.error) msg = parsed.error;
      } catch (e) {
        // ignore
      }

      if (msg?.includes("rate limit")) msg = "Trop de tentatives. Veuillez patienter.";

      setError(msg || "Une erreur est survenue.");
      showError(msg || "Erreur d'envoi.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-screen flex items-center justify-center bg-white dark:bg-dark-bg p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center border border-slate-100 dark:border-slate-800 animate-in zoom-in duration-300">

          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Vérifiez votre email</h2>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
            <p className="text-slate-600 dark:text-slate-300">
              Nous avons envoyé un lien magique à <br />
              <span className="font-bold text-slate-900 dark:text-white text-lg">{email}</span>
            </p>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            Cliquez sur le lien dans l'email pour activer votre compte instantanément. Pas besoin de mot de passe !
          </p>

          <button
            onClick={() => setSuccess(false)}
            className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline"
          >
            Je n'ai rien reçu, renvoyer l'email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-dark-bg overflow-hidden">
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <img
          src={
            settings?.images.login_background ||
            "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
          }
          alt="Logistics Hub"
          className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-1000 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>

        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full h-full">
          <div className="flex items-center space-x-4">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt="Logo"
                className="h-12 object-contain"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                <span className="font-bold text-2xl">N</span>
              </div>
            )}
            <span className="text-2xl font-bold tracking-tight">
              NextMove Cargo
            </span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 text-blue-300 font-medium tracking-wide text-sm uppercase">
              <Sparkles className="w-4 h-4" />
              <span>Rejoignez la révolution</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
              Expédiez plus vite, <br />
              <span className="text-blue-400">sans stress.</span>
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-lg font-light text-blue-100">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Suivi en temps réel de vos colis</span>
              </div>
              <div className="flex items-center gap-3 text-lg font-light text-blue-100">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Tarifs transparents et compétitifs</span>
              </div>
              <div className="flex items-center gap-3 text-lg font-light text-blue-100">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span>Support client dédié 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-gray-950 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

        <div className="flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
          <div className="mx-auto w-full max-w-sm lg:w-96">

            <div className="text-center lg:text-left mb-10">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                Créer un compte
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Commencez en quelques secondes. Sans mot de passe.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl animate-in slide-in-from-top-2">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <GoogleLoginButton text="Continuer avec Google" />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-50 dark:bg-gray-950 text-slate-500 font-medium">Ou avec email</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Email professionnel
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
                      placeholder="vous@exemple.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="referral" className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                    Code de parrainage (Optionnel)
                  </label>
                  <input
                    id="referral"
                    name="referralCode"
                    type="text"
                    autoComplete="off"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="block w-full px-4 py-4 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                    placeholder="Ex: PROMO2025"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-600/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  <>
                    Rejoindre NextMove Cargo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                En continuant, vous acceptez nos <Link to="/legal/terms" className="underline hover:text-blue-500">Conditions d'utilisation</Link> et notre <Link to="/legal/privacy" className="underline hover:text-blue-500">Politique de confidentialité</Link>.
              </p>
            </form>

            <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Vous avez déjà un compte ?{" "}
                <Link to="/login" className="font-bold text-blue-600 hover:text-blue-500 transition-colors">
                  Se connecter
                </Link>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
