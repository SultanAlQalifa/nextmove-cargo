import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";

import { useBranding } from "../contexts/BrandingContext";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import PhoneInputWithCountry from "../components/auth/PhoneInputWithCountry";

export default function Login() {
  const { t } = useTranslation();
  const { settings } = useBranding();
  // We use the global settings context for security flags
  const { settings: systemSettings } = useSettings();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const phoneAuthEnabled = true; // Forcé à true pour garantir la visibilité

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
        // Phone Auth
        if (!otpSent) {
          await sendOtp();
          setLoading(false);
          return;
        } else {
          // Verify OTP Step
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
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 relative border border-slate-100 dark:border-slate-800">
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
                {resetMessage.type === "success" ? (
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                )}
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
          </div>
        </div>
      )}

      {/* Left Side - Image & Testimonial (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <img
          src={
            settings?.images.login_background ||
            "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop"
          }
          alt="Logistics"
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
              {settings?.platform_name || "NextMove Cargo"}
            </span>
          </div>

          <div className="mb-8">
            <blockquote className="space-y-8">
              <div className="text-3xl font-medium leading-relaxed font-light tracking-wide">
                "{t("auth.testimonial")}"
              </div>
              <footer className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-blue-300 font-bold text-lg">
                    AD
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white">
                    Amadou Diallo
                  </div>
                  <div className="text-sm text-blue-300 font-medium">
                    CEO Global Import SA
                  </div>
                </div>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-gray-950 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

        <div className="flex min-h-full flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="lg:hidden mb-10 text-center">
              <span className="text-3xl font-bold text-blue-600">
                NextMove Cargo
              </span>
            </div>

            <div className="text-center lg:text-left mb-10">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                {t("auth.welcomeBack")}
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                {t("auth.signInSubtitle")}
              </p>
            </div>

            <div className="mt-8">
              <form onSubmit={handleLogin} className="space-y-6">
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
                  <GoogleLoginButton />
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">
                        {t("auth.orContinueWith")}
                      </span>
                    </div>
                  </div>

                  {/* Auth Method Toggle */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setAuthMethod("email"); setOtpSent(false); }}
                      className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${authMethod === "email"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        }`}
                    >
                      Email
                    </button>
                    {phoneAuthEnabled && (
                      <button
                        type="button"
                        onClick={() => { setAuthMethod("phone"); setOtpSent(false); }}
                        className={`py-2 px-4 rounded-lg text-sm font-bold transition-all ${authMethod === "phone"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                      >
                        {t("auth.phone")}
                      </button>
                    )}
                  </div>
                </div>

                {authMethod === 'email' ? (
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1"
                    >
                      {t("auth.email")}
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
                ) : (
                  <div className="space-y-4">
                    {otpSent ? (
                      <div className="space-y-2 animate-in slide-in-from-right-2 duration-300">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                          {t("auth.verificationCode", "Code de vérification")}
                        </label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            maxLength={6}
                            placeholder="000000"
                            className="block w-full pl-11 pr-4 py-4 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200 text-center tracking-[0.5em] text-xl font-bold"
                          />
                        </div>
                        <div className="flex justify-between items-center px-1">
                          <button
                            type="button"
                            onClick={() => { setOtpSent(false); setOtpCode(""); }}
                            className="text-xs text-slate-500 hover:text-blue-600 transition-colors"
                          >
                            {t("auth.changePhone", "Changer de numéro")}
                          </button>
                          {resendTimer > 0 ? (
                            <span className="text-xs text-slate-400">
                              {t("auth.resendIn", "Renvoyer dans")} {resendTimer}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  setError(null);
                                  await sendOtp();
                                  setOtpCode("");
                                  showSuccess?.(t("auth.otpSent", "Code envoyé !"));
                                } catch (err: any) {
                                  setError(err.message);
                                }
                              }}
                              className="text-xs text-blue-600 font-bold hover:underline"
                            >
                              {t("auth.resendCode", "Renvoyer le code")}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                          {t("auth.phoneNumber")}
                        </label>
                        <PhoneInputWithCountry
                          value={phone}
                          onChange={setPhone}
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                {authMethod === 'email' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                      <label
                        htmlFor="password"
                        className="block text-sm font-bold text-slate-700 dark:text-slate-300"
                      >
                        {t("auth.password")}
                      </label>
                      <div className="text-sm">
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                        >
                          {t("auth.forgotPassword")}
                        </button>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-11 pr-12 py-4 border-2 border-transparent bg-white dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/10 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-200"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-600/30 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-1 active:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        {authMethod === 'phone' && !otpSent ? t("auth.sending", "Envoi...") : t("auth.signingIn")}
                      </>
                    ) : (
                      <>
                        {authMethod === 'phone' && !otpSent ? t("auth.sendCode", "Envoyer le code") : t("auth.signIn")}
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
                      {t("auth.noAccount")}
                    </span>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    to="/register"
                    className="w-full flex justify-center items-center py-4 px-4 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all duration-200 hover:-translate-y-1"
                  >
                    {t("auth.createAccount")}
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
