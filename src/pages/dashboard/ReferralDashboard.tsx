import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Copy,
  Users,
  Gift,
  TrendingUp,
  Share2,
  Check,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../lib/supabase";
import { useDataSync } from "../../contexts/DataSyncContext";

interface Referral {
  id: string;
  referred_id: string;
  status: string;
  created_at: string;
  points_earned: number;
  referred_profile?: {
    full_name: string;
    created_at: string;
  };
}

export default function ReferralDashboard() {
  useTranslation();
  const { user, profile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    totalPoints: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [localCode, setLocalCode] = useState<string | null>(null);

  // Wallet & Conversion State
  const [walletBalance, setWalletBalance] = useState(0);
  const [conversionRate, setConversionRate] = useState(50); // Default 50 FCFA
  const [converting, setConverting] = useState(false);

  // Live Sync
  useDataSync("referrals", () => fetchReferralData());
  useDataSync("profiles", () => {
    fetchReferralData();
    fetchWalletData();
  });
  useDataSync("wallets", () => fetchWalletData());

  useEffect(() => {
    if (user) {
      fetchReferralData();
      fetchWalletData();
    }
  }, [user]);

  useEffect(() => {
    // Sync local code with profile if profile updates
    if (profile?.referral_code) {
      setLocalCode(profile.referral_code);
    }
  }, [profile]);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      // Fetch Wallet Balance
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletData) {
        setWalletBalance(Number(walletData.balance));
      }

      // Fetch Conversion Rate
      const { data: settingsData } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "referral")
        .maybeSingle();

      if (settingsData?.value?.point_value) {
        setConversionRate(Number(settingsData.value.point_value));
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
    }
  };
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConvertPoints = async () => {
    if (!user) return;

    setConverting(true);
    try {
      const { error } = await supabase.rpc("convert_points_to_wallet", {
        p_user_id: user.id,
        p_points: stats.totalPoints,
        p_conversion_rate: conversionRate,
      });

      if (error) throw error;

      // Success
      await refreshProfile();
      await fetchReferralData();
      await fetchWalletData();

      setShowConfirm(false);
      success("✅ Conversion réussie ! Votre portefeuille a été crédité.");
    } catch (error: any) {
      console.error("Conversion error:", error);
      toastError("❌ Erreur : " + (error.message || "Erreur inconnue"));
    } finally {
      setConverting(false);
    }
  };

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      // 1. Check if user needs a code generated (Self-Healing)
      let currentCode = profile?.referral_code;

      if (!currentCode && user) {
        const normalizedName = (profile?.full_name || "USR")
          .replace(/[^a-zA-Z]/g, "")
          .toUpperCase();
        const prefix =
          normalizedName.length >= 3
            ? normalizedName.substring(0, 3)
            : (normalizedName + "USR").substring(0, 3);
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newCode = `${prefix}${random} `;

        const { error: updateError } = await supabase
          .from("profiles")
          .update({ referral_code: newCode })
          .eq("id", user.id);

        if (!updateError) {
          currentCode = newCode;
          setLocalCode(newCode); // Force update local display immediately

          // Optional: Trigger profile refresh if context allows, or just rely on local override
        } else {
          console.error("Failed to auto-generate referral code:", updateError);
        }
      } else if (currentCode) {
        setLocalCode(currentCode);
      }

      const { data, error } = await supabase
        .from("referrals")
        .select(
          `
    *,
    referred_profile: profiles!referred_id(full_name, created_at)
                `,
        )
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch latest points directly from DB to ensure it's up to date
      const { data: profileData } = await supabase
        .from("profiles")
        .select("referral_points")
        .eq("id", user!.id)
        .single();

      const refs = data || [];
      setReferrals(refs);
      setStats({
        total: refs.length,
        pending: refs.filter((r) => r.status === "pending").length,
        completed: refs.filter(
          (r) => r.status === "completed" || r.status === "rewarded",
        ).length,
        totalPoints: profileData?.referral_points || 0,
      });
    } catch (error) {
      console.error("Error fetching referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    const codeToUse = localCode || profile?.referral_code;
    if (codeToUse) {
      navigator.clipboard.writeText(codeToUse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferral = async () => {
    const codeToUse = localCode || profile?.referral_code;
    if (navigator.share && codeToUse) {
      try {
        await navigator.share({
          title: "Rejoignez NextMove Cargo",
          text: `Rejoignez - moi sur NextMove Cargo! Utilisez mon code ${codeToUse} pour obtenir des avantages.`,
          url: `${window.location.origin}/register?referral=${codeToUse}`,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.warn("Share failed:", err);
        }
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Programme de Parrainage
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Invitez des amis et collègues pour gagner des points et des avantages
          exclusifs.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Filleuls
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Points Disponibles
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalPoints}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-purple-600 dark:text-purple-400">
              <Gift className="w-6 h-6" />
            </div>
          </div>

          {stats.totalPoints > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-2">
              <p className="text-xs text-gray-500 mb-2">
                Valeur estimée:{" "}
                <span className="font-bold text-green-600">
                  {stats.totalPoints * (conversionRate || 50)} FCFA
                </span>
              </p>

              {!showConfirm ? (
                <button
                  onClick={() => {
                    if (stats.totalPoints < 10) {
                      toastError("Il faut au moins 10 points.");
                      return;
                    }
                    setShowConfirm(true);
                  }}
                  disabled={converting}
                  className="w-full text-sm py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Convertir en Solde
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-bold text-center text-gray-800 dark:text-white">
                    Confirmer la conversion ?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-2 px-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleConvertPoints}
                      disabled={converting}
                      className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center justify-center"
                    >
                      {converting ? "..." : "OUI"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Solde Portefeuille
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {walletBalance.toLocaleString()} FCFA
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-green-600 dark:text-green-400">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 h-full">
            <div className="flex-1 w-full">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Votre Code de Parrainage
              </p>
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-2">
                <code className="flex-1 block text-2xl font-mono font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  {localCode || profile?.referral_code || "---"}
                </code>
                <button
                  onClick={copyCode}
                  className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                  title="Copier le code"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={shareReferral}
                  className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
                  title="Partager"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Derniers Parrainages
          </h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Chargement...</div>
        ) : referrals.length === 0 ? (
          <div className="p-12 text-center">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Vous n'avez pas encore de parrainages.
            </p>
            <p className="text-sm text-blue-500 mt-2">
              Invitez vos amis pour commencer !
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {referrals.map((ref) => (
                  <tr
                    key={ref.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {ref.referred_profile?.full_name || "Utilisateur"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(ref.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${ref.status === "completed" ||
                            ref.status === "rewarded"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                      >
                        {ref.status === "pending" ? "En attente" : "Validé"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {ref.points_earned > 0 ? `+${ref.points_earned}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
