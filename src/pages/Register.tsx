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
  Sparkles,
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  Calculator,
  ShieldCheck,
  Headphones
} from "lucide-react";
import { z } from "zod";
import { useBranding } from "../contexts/BrandingContext";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import PhoneInputWithCountry from "../components/auth/PhoneInputWithCountry";
import { motion, AnimatePresence } from "framer-motion";

import { useSettings } from "../contexts/SettingsContext";

export default function Register() {
  const { t } = useTranslation();
  const { settings: _systemSettings } = useSettings();
  const phoneAuthEnabled = true;
  const { settings } = useBranding();
  const { success: showSuccess, error: showError } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Suivi en temps réel",
      description: "Visualisez l'emplacement de vos marchandises à chaque étape, de la Chine à votre entrepôt.",
      icon: <LayoutDashboard className="w-12 h-12 text-blue-400" />,
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
    },
    {
      title: "Calculateur intelligent",
      description: "Obtenez des devis instantanés et optimisez vos coûts de transport en quelques clics.",
      icon: <Calculator className="w-12 h-12 text-emerald-400" />,
      image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?q=80&w=1974&auto=format&fit=crop"
    },
    {
      title: "Gestion sécurisée",
      description: "Centralisez vos documents de douane et factures dans un coffre-fort numérique hautement sécurisé.",
      icon: <ShieldCheck className="w-12 h-12 text-blue-500" />,
      image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
    },
    {
      title: "Assistance 24/7",
      description: "Notre équipe d'experts logistiques est disponible jour et nuit pour vous accompagner.",
      icon: <Headphones className="w-12 h-12 text-amber-400" />,
      image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop"
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);


  const registerSchema = z.object({
    email: z.string().email("Email invalide"),
    referralCode: z.string().optional(),
  });

  const sendOtp = async () => {
    if (!phone || phone.length < 8) {
      throw new Error(t("auth.invalidPhone", "Numéro de téléphone invalide"));
    }
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          full_name: email.split('@')[0],
          role: 'client',
          referral_code_used: referralCode,
        }
      }
    });
    if (otpError) throw otpError;
    setOtpSent(true);
    setResendTimer(60);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (authMethod === 'email') {
      const validation = registerSchema.safeParse({ email, referralCode });
      if (!validation.success) {
        setError(validation.error.issues[0].message);
        setLoading(false);
        return;
      }
    } else {
      if (!phone || phone.length < 8) {
        setError(t("auth.invalidPhone", "Numéro de téléphone invalide"));
        setLoading(false);
        return;
      }
    }

    try {
      if (authMethod === 'phone') {
        if (!otpSent) {
          await sendOtp();
          showSuccess("Code envoyé !");
          setLoading(false);
          return;
        } else {
          if (!otpCode || otpCode.length < 6) {
            throw new Error(t("auth.invalidCode", "Code invalide"));
          }
          const { error: verifyError } = await supabase.auth.verifyOtp({
            phone,
            token: otpCode,
            type: 'sms',
          });
          if (verifyError) throw verifyError;

          navigate("/dashboard");
          return;
        }
      }

      const { data, error: fnError } = await supabase.functions.invoke('public-signup', {
        body: {
          email,
          referral_code_used: referralCode,
          role: 'client',
          logo_url: settings?.logo_url
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
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 text-center border border-slate-100 dark:border-slate-800"
        >
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Vérifiez votre email</h2>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 mb-6 border border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-300">
              Nous avons envoyé un lien magique à <br />
              <span className="font-black text-blue-600 dark:text-blue-400 text-lg tracking-tight">{email}</span>
            </p>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
            Cliquez sur le lien dans l'email pour activer votre compte instantanément. Pas besoin de mot de passe !
          </p>

          <button
            onClick={() => setSuccess(false)}
            className="text-blue-600 hover:text-blue-700 font-bold text-sm tracking-tight border-b-2 border-blue-100 hover:border-blue-600 transition-all"
          >
            Je n'ai rien reçu, renvoyer l'email
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white dark:bg-dark-bg overflow-hidden font-sans">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        {slides.map((slide, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{
              opacity: index === currentSlide ? 1 : 0,
              scale: index === currentSlide ? 1 : 1.1,
            }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay z-10" />
            <img
              src={settings?.images.login_background || slide.image}
              alt={slide.title}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90" />
          </motion.div>
        ))}

        <div className="relative z-20 flex flex-col justify-between p-16 text-white w-full h-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/20">
                <span className="font-bold text-2xl">N</span>
              </div>
            )}
            <span className="text-2xl font-black tracking-tight">NextMove Cargo</span>
          </motion.div>

          {/* Dynamic Content Section */}
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-8 text-blue-300 font-bold tracking-[0.2em] text-[10px] uppercase">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Démonstration des fonctionnalités</span>
            </div>

            <div className="relative h-72">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <div className="mb-6">{slides[currentSlide].icon}</div>
                  <h2 className="text-5xl font-black mb-6 leading-[1.1] tracking-tight text-white">
                    {slides[currentSlide].title}
                  </h2>
                  <p className="text-xl font-medium text-blue-100/70 leading-relaxed max-w-md">
                    {slides[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slider Controls */}
            <div className="mt-12 flex items-center gap-8">
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    title={`Slide ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-500 ${index === currentSlide ? "w-10 bg-blue-500" : "w-2 bg-white/20 hover:bg-white/40"}`}
                  />
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                  title="Précédent"
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                  title="Suivant"
                  className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
                >
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-blue-200/40 font-bold uppercase tracking-widest italic">
            * Solutions de fret NextGen pour l'Afrique
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-gray-950 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-500/10 pointer-events-none" />

        <div className="flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-sm lg:w-96"
          >
            <div className="text-center lg:text-left mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black mb-4 uppercase tracking-tighter">
                <Sparkles size={14} /> Pack Premium Offert
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                Commencer l'aventure
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                Rejoignez 1000+ professionnels.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl overflow-hidden"
                  >
                    <p className="text-sm text-red-700 dark:text-red-400 font-bold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                <div className="relative group/google pt-10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black rounded-full shadow-xl z-20 border-2 border-white dark:border-slate-800 whitespace-nowrap uppercase tracking-widest">
                    Accès Privilégié
                  </div>
                  <GoogleLoginButton
                    text="Continuer avec Google"
                    className="!py-6 !text-lg !px-8 !bg-white dark:!bg-slate-900 !border-2 !border-slate-100 dark:!border-slate-800 shadow-2xl shadow-blue-500/5 hover:!border-blue-500/30 hover:!scale-[1.01] transition-all duration-300"
                  />
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px]">
                    <span className="px-4 bg-slate-50 dark:bg-gray-950 text-slate-400 font-black uppercase tracking-[0.2em]">OU VIA</span>
                  </div>
                </div>

                {phoneAuthEnabled && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl relative">
                    <motion.div
                      layoutId="regToggle"
                      className="absolute inset-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-700 rounded-xl shadow-lg"
                      animate={{ x: authMethod === "email" ? 0 : "100%" }}
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                    <button
                      type="button"
                      onClick={() => { setAuthMethod("email"); setOtpSent(false); }}
                      className={`relative z-10 py-2.5 px-4 rounded-xl text-xs font-black transition-colors ${authMethod === "email" ? "text-blue-600 dark:text-white" : "text-slate-500"}`}
                    >
                      EMAIL
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMethod("phone"); setOtpSent(false); }}
                      className={`relative z-10 py-2.5 px-4 rounded-xl text-xs font-black transition-colors ${authMethod === "phone" ? "text-blue-600 dark:text-white" : "text-slate-500"}`}
                    >
                      MOBILE
                    </button>
                  </div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={authMethod}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    {authMethod === 'email' ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-[11px]">
                          Email Professionnel
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.25rem] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                            placeholder="vous@exemple.com"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {otpSent ? (
                          <div className="space-y-4 animate-in slide-in-from-right-2">
                            <div className="space-y-2">
                              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-[11px]">CODE DE VÉRIFICATION</label>
                              <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                maxLength={6}
                                className="block w-full py-5 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-[1.25rem] text-slate-900 dark:text-white text-center tracking-[1em] text-2xl font-black focus:outline-none shadow-inner"
                                placeholder="000000"
                              />
                            </div>
                            <div className="flex justify-between items-center px-1">
                              <button type="button" onClick={() => setOtpSent(false)} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase">Modifier numéro</button>
                              {resendTimer > 0 ? (
                                <span className="text-[11px] font-bold text-slate-400 uppercase">{resendTimer}S Restantes</span>
                              ) : (
                                <button type="button" onClick={sendOtp} className="text-[11px] font-bold text-blue-600 hover:underline tracking-widest uppercase">Renvoyer le code</button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-[11px]">Numéro de téléphone</label>
                            <PhoneInputWithCountry value={phone} onChange={setPhone} required />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="block text-sm font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-[11px]">Code Parrainage (Optionnel)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="block w-full px-5 py-4 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.25rem] text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                    placeholder="Ex: PROMO2025"
                  />
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-5 px-4 border border-transparent rounded-[1.25rem] shadow-xl shadow-blue-600/20 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 group"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      {authMethod === 'phone' && !otpSent ? "ENVOYER LE CODE" : "ACCÉDER AU DASHBOARD"}
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>

              <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Par inscription, vous acceptez nos <Link to="/legal/terms" className="text-blue-600 hover:underline">Conditions</Link> & <Link to="/legal/privacy" className="text-blue-600 hover:underline">Confidentialité</Link>.
              </p>
            </form>

            <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-900 text-center">
              <p className="text-sm text-slate-400 font-bold uppercase tracking-tighter">
                DÉJÀ CLIENT ?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-500 font-black transition-colors ml-1">
                  SE CONNECTER
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
