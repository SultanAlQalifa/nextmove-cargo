import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Lock, ArrowRight, Loader2, CheckCircle } from "lucide-react";

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
    // Check if we have a valid session (from the email link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        // If no session, maybe the link is invalid or expired
        setMessage({
          type: "error",
          text: "Lien invalide ou expiré. Veuillez refaire une demande.",
        });
      }
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Nouveau mot de passe
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Entrez votre nouveau mot de passe pour sécuriser votre compte.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin" />
            )}
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {session ? (
          <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Nouveau mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirmer le mot de passe
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Mettre à jour
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">
              Si vous n'avez pas demandé de réinitialisation, vous pouvez
              ignorer cette page.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:text-primary/80 font-medium"
            >
              Retour à la connexion
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
