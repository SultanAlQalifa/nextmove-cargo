import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { ArrowRight, Loader2, CheckCircle, Sparkles, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        setMessage({
          type: "error",
          text: "Lien invalide ou expiré. Veuillez refaire une demande.",
        });
      }
    }).catch((err) => {
      console.error("Session retrieval failed:", err);
      setMessage({
        type: "error",
        text: "Une erreur est survenue lors de la vérification de votre session.",
      });
    });
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Le mot de passe doit contenir au moins 6 caractères.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Mot de passe mis à jour avec succès ! Redirection...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Erreur lors de la mise à jour.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 px-4 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full z-10"
      >
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="mx-auto h-16 w-16 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 shadow-inner"
            >
              <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </motion.div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Nouveau mot de passe
            </h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium">
              Sécurisez votre compte avec un nouveau mot de passe.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-3 mb-6 ${message.type === "success"
                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-100 dark:border-red-900/30"
                  }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5 shrink-0" />
                ) : (
                  <Sparkles className="w-5 h-5 shrink-0" />
                )}
                <p className="text-sm font-bold">{message.text}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {session ? (
            <form className="space-y-6" onSubmit={handleUpdatePassword}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-xs font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest"
                  >
                    Mot de passe
                  </label>
                  <div className="relative group">
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full px-5 py-4 border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirm-password"
                    className="block text-xs font-black text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-widest"
                  >
                    Confirmer le mot de passe
                  </label>
                  <div className="relative group">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-5 py-4 border-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-all font-medium"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-5 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-600/20 text-sm font-black text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 group disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      METTRE À JOUR
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Si vous n'avez pas demandé de réinitialisation, vous pouvez
                ignorer cette page ou retourner à l'accueil.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 px-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-sm font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest"
              >
                Retour à la connexion
              </button>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
          NextMove Cargo © 2025 • Protection des données
        </p>
      </motion.div>
    </div>
  );
}
