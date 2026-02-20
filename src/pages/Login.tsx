import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, Sparkles } from "lucide-react";

import { useBranding } from "../contexts/BrandingContext";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import PhoneInputWithCountry from "../components/auth/PhoneInputWithCountry";
import { motion, AnimatePresence } from "framer-motion";

export default function Login() {
  const { t } = useTranslation();
  const { settings } = useBranding();
  const { settings: _systemSettings } = useSettings();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const phoneAuthEnabled = true;

  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const sendOtp = async () => {
    if (!phone || phone.length < 8) {
      throw new Error(t("auth.invalidPhone", "Numéro de téléphone invalide"));
    }
    const res = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    if (res.error) throw res.error;
    setOtpSent(true);
    setResendTimer(60);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (authMethod === 'email') {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginError) throw loginError;
      } else {
        if (!otpSent) {
          await sendOtp();
          setLoading(false);
          return;
        } else {
          if (!otpCode || otpCode.length < 6) {
            throw new Error(t("auth.invalidCode", "Code invalide"));
          }
          const { error: verifyError } = await supabase.auth.verifyOtp({
            phone: phone,
            token: otpCode,
            type: 'sms',
          });
          if (verifyError) throw verifyError;
        }
      }

      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.message === "Invalid login credentials"
          ? t("auth.invalidCredentials")
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + "/reset-password",
      });

      if (error) throw error;
      setResetMessage({
        type: "success",
        text: t("auth.resetSentSuccess"),
      });
    } catch (err: any) {
      setResetMessage({
        type: "error",
        text: err.message || t("auth.resetSentError"),
      });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-white overflow-hidden">
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-slate-100 dark:border-slate-800"
            >
              <button
                onClick={() => setShowForgotPassword(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                <span className="sr-only">{t("common.close", "Fermer")}</span>
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {t("auth.forgotPasswordTitle")}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  {t("auth.forgotPasswordDesc")}
                </p>
              </div>

              {resetMessage && (
                <div
                  className={`mb-6 p-4 rounded-2xl text-sm flex items-center gap-3 ${resetMessage.type === "success"
                    ? "bg-green-50 text-green-700 border border-green-100"
                    : "bg-red-50 text-red-700 border border-red-100"
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${resetMessage.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
                  {resetMessage.text}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-200"
                    placeholder="name@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-500 transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  {resetLoading ? t("auth.sending") : t("auth.sendLink")}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side - Image & Testimonial */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute inset-0"
        >
          <img
            src={
              settings?.images.login_background ||
              "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop"
            }
            alt="Logistics"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-black/90"></div>
        </motion.div>

        <div className="relative z-10 flex flex-col justify-between p-16 text-white w-full h-full">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-4"
          >
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
              {settings?.platform_name || "NextMove Cargo"}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <blockquote className="space-y-8">
              <div className="text-3xl font-medium leading-relaxed font-light tracking-wide italic">
                "{t("auth.testimonial")}"
              </div>
              <footer className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-0.5 shadow-lg shadow-blue-500/20">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-blue-300 font-bold text-lg">
                    AD
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white leading-none mb-1">
                    Amadou Diallo
                  </div>
                  <div className="text-sm text-blue-300 font-medium opacity-80">
                    CEO Global Import SA
                  </div>
                </div>
              </footer>
            </blockquote>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-gray-950 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-500/10 dark:to-transparent pointer-events-none" />

        <div className="flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto w-full max-w-sm lg:w-96"
          >
            <div className="lg:hidden mb-10 text-center">
              <span className="text-3xl font-black text-blue-600 tracking-tighter">
                NextMove<span className="text-slate-900 dark:text-white">Cargo</span>
              </span>
            </div>

            <div className="text-center lg:text-left mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-4">
                <Sparkles size={14} /> {t("auth.secureAccess", "Accès Sécurisé")}
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
                {t("auth.welcomeBack")}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                {t("auth.signInSubtitle")}
              </p>
            </div>

            <div className="mt-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-xl overflow-hidden"
                    >
                      <p className="text-sm text-red-700 dark:text-red-400 font-bold">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-4">
                  <GoogleLoginButton />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-3 bg-slate-50 dark:bg-gray-950 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                        {t("auth.orContinueWith")}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl relative">
                    <motion.div
                      layoutId="authToggle"
                      className="absolute inset-1.5 w-[calc(50%-6px)] bg-white dark:bg-slate-700 rounded-xl shadow-lg border border-slate-100 dark:border-slate-600"
                      initial={false}
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
                    {phoneAuthEnabled && (
                      <button
                        type="button"
                        onClick={() => { setAuthMethod("phone"); setOtpSent(false); }}
                        className={`relative z-10 py-2.5 px-4 rounded-xl text-xs font-black transition-colors ${authMethod === "phone" ? "text-blue-600 dark:text-white" : "text-slate-500"}`}
                      >
                        MOBILE
                      </button>
                    )}
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={authMethod}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {authMethod === 'email' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-[11px]">
                            {t("auth.email")}
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
                              className="block w-full pl-12 pr-4 py-4 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.25rem] text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                              placeholder="votre@email.com"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                              {t("auth.password")}
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors"
                            >
                              {t("auth.forgotPassword")}
                            </button>
                          </div>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                              <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="block w-full pl-12 pr-12 py-4 border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-[1.25rem] text-slate-900 dark:text-white placeholder-slate-300 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-blue-500 transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {otpSent ? (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-[11px]">
                                {t("auth.verificationCode")}
                              </label>
                              <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                maxLength={6}
                                className="block w-full px-4 py-5 border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-[1.25rem] text-slate-900 dark:text-white text-center tracking-[1em] text-2xl font-black focus:outline-none shadow-inner"
                                placeholder="000000"
                              />
                            </div>
                            <div className="flex justify-between items-center px-1">
                              <button type="button" onClick={() => setOtpSent(false)} className="text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors">MODIFIER NUMÉRO</button>
                              {resendTimer > 0 ? (
                                <span className="text-[11px] font-bold text-slate-400">{resendTimer}S RESTANTES</span>
                              ) : (
                                <button type="button" onClick={sendOtp} className="text-[11px] font-bold text-blue-600 hover:underline tracking-wider">RENVOYER LE CODE</button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider text-[11px]">
                              {t("auth.phoneNumber")}
                            </label>
                            <PhoneInputWithCountry value={phone} onChange={setPhone} required />
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-[1.25rem] shadow-xl shadow-blue-500/20 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 focus:outline-none transition-all duration-300 group"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <>
                        {authMethod === 'phone' && !otpSent ? "ENVOYER LE CODE" : "SE CONNECTER"}
                        <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.div>
              </form>

              <div className="mt-12 pt-6 border-t border-slate-100 dark:border-slate-900">
                <div className="text-center group">
                  <p className="text-sm text-slate-400 font-bold mb-4 uppercase tracking-tighter">
                    {t("auth.noAccount")}
                  </p>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center gap-2 text-slate-900 dark:text-white font-black hover:text-blue-600 transition-colors"
                  >
                    {t("auth.createAccount")} <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
