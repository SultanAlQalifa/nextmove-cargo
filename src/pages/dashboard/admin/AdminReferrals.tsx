import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, Gift, TrendingUp, Search, Download, Check } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import PageHeader from "../../../components/common/PageHeader";

interface ReferralWithProfiles {
  id: string;
  status: string;
  points_earned: number;
  created_at: string;
  referrer: {
    id: string;
    full_name: string;
    email: string;
    referral_code: string;
  };
  referred: {
    id: string;
    full_name: string;
    email: string;
  };
}

export default function AdminReferrals() {
  useTranslation();
  const [stats, setStats] = useState({
    totalReferrals: 0,
    pendingReferrals: 0,
    completedReferrals: 0,
    totalPointsDistributed: 0,
  });
  const [referrals, setReferrals] = useState<ReferralWithProfiles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "config">("overview");
  const [config, setConfig] = useState({
    program_enabled: true,
    points_per_referral: 100,
    point_value: 50, // Value in FCFA per point
    max_referrals_per_user: 50,
    bonus_threshold: 1000,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchReferrals();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "referral")
        .maybeSingle();

      if (data?.value) {
        setConfig(data.value);
      }
    } catch (error) {
      console.error("Error fetching referral settings:", error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("system_settings").upsert({
        key: "referral",
        value: config,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      // Success feedback could be added here
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const fetchReferrals = async () => {
    try {
      setLoading(true);

      // Fetch referrals with profile data
      const { data, error } = await supabase
        .from("referrals")
        .select(
          `
                    *,
                    referrer:profiles!referrer_id(id, full_name, email, referral_code),
                    referred:profiles!referred_id(id, full_name, email)
                `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      const refs = (data || []) as any[]; // casting to handle deep join types roughly

      // Calculate stats
      const total = refs.length;
      const pending = refs.filter((r) => r.status === "pending").length;
      const completed = refs.filter((r) =>
        ["completed", "rewarded"].includes(r.status),
      ).length;
      const points = refs.reduce(
        (acc, curr) => acc + (curr.points_earned || 0),
        0,
      );

      setStats({
        totalReferrals: total,
        pendingReferrals: pending,
        completedReferrals: completed,
        totalPointsDistributed: points,
      });

      setReferrals(refs);
    } catch (error) {
      console.error("Error fetching admin referrals:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReferrals = referrals.filter((ref) => {
    const search = searchTerm.toLowerCase();
    return (
      ref.referrer?.full_name?.toLowerCase().includes(search) ||
      ref.referrer?.referral_code?.toLowerCase().includes(search) ||
      ref.referred?.full_name?.toLowerCase().includes(search)
    );
  });

  return (
    <div>
      <PageHeader
        title="Gestion des Parrainages"
        subtitle="Configurez le programme et suivez les performances"
        action={{
          label:
            activeTab === "config"
              ? saving
                ? "Enregistrement..."
                : "Sauvegarder"
              : "Exporter",
          icon: activeTab === "config" ? Check : Download,
          onClick:
            activeTab === "config" ? saveSettings : () => { },
          disabled: saving,
        }}
      />

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "overview"
            ? "text-primary border-b-2 border-primary"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
        >
          Vue d'ensemble
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === "config"
            ? "text-primary border-b-2 border-primary"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
        >
          Configuration & Règles
        </button>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Parrainages
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalReferrals}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-600 dark:text-blue-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    En Attente
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.pendingReferrals}
                  </p>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-yellow-600 dark:text-yellow-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Validés
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.completedReferrals}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-green-600 dark:text-green-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Points Distribués
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stats.totalPointsDistributed}
                  </p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-purple-600 dark:text-purple-400">
                  <Gift className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par parrain, filleul ou code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-gray-500">
                Chargement des données...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parrain (Referrer)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Filleul (Referred)
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
                    {filteredReferrals.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Aucun parrainage trouvé.
                        </td>
                      </tr>
                    ) : (
                      filteredReferrals.map((ref) => (
                        <tr
                          key={ref.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ref.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {ref.referrer?.full_name || "Inconnu"}
                              </span>
                              <span className="text-xs text-gray-500 font-mono">
                                {ref.referrer?.referral_code}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {ref.referred?.full_name || "Inconnu"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {ref.referred?.email}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                            ${[
                                  "completed",
                                  "rewarded",
                                ].includes(
                                  ref.status,
                                )
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}
                            >
                              {ref.status === "pending"
                                ? "En attente"
                                : "Validé"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {ref.points_earned} pts
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 max-w-2xl">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
            Règles du Programme
          </h3>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Activer le Parrainage
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Autoriser les nouveaux utilisateurs à s'inscrire avec un code
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Activer le programme de parrainage"
                  checked={config.program_enabled}
                  onChange={(e) =>
                    setConfig({ ...config, program_enabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="points_per_referral"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Points par Parrainage
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="points_per_referral"
                    type="number"
                    value={config.points_per_referral}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        points_per_referral: Number(e.target.value),
                      })
                    }
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Points attribués au parrain lors de l'inscription.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="point_value"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Valeur du Point (FCFA)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₣
                  </span>
                  <input
                    id="point_value"
                    type="number"
                    value={config.point_value || 50}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        point_value: Number(e.target.value),
                      })
                    }
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Montant en FCFA crédité pour 1 point converti.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="max_referrals"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Max Filleuls par User
                </label>
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 hidden" />
                <input
                  id="max_referrals"
                  type="number"
                  value={config.max_referrals_per_user}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      max_referrals_per_user: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                />
                <p className="text-xs text-gray-500">
                  Limite de filleuls actifs par parrain.
                </p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-xl text-sm">
              <p className="font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Info
              </p>
              <p className="mt-1">
                Les modifications s'appliquent uniquement aux futurs
                parrainages. L'historique n'est pas recalculé.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
