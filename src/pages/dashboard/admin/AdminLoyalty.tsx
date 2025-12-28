import { useState, useEffect } from "react";

import {
  Users,
  Search,
  Check,
  TrendingUp,
  History,
  Crown,
  Gift,
  Sliders
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import PageHeader from "../../../components/common/PageHeader";
import { showNotification } from "../../../components/common/NotificationToast";

export default function AdminLoyalty() {

  // Tabs
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "adjustments" | "config">("overview");

  // Data States
  const [stats, setStats] = useState({
    totalPoints: 0,
    totalReferrals: 0,
    pendingReferrals: 0,
    pointsDistributed: 0,
    topReferrers: [] as any[]
  });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [config, setConfig] = useState<any>({});

  // Adjustment Form State
  const [adjustForm, setAdjustForm] = useState({
    email: "",
    amount: 100,
    reason: "",
    type: "credit" as "credit" | "debit"
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [diagnosticHint, setDiagnosticHint] = useState("");
  const [searchingUser, setSearchingUser] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);

  // Search Autocomplete
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchConfig();
  }, []);

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [activeTab]);

  // Levenshtein distance for fuzzy matching
  const getLevenshteinDistance = (a: string, b: string) => {
    const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        if (a[i - 1] === b[j - 1]) matrix[i][j] = matrix[i - 1][j - 1];
        else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[a.length][b.length];
  };

  const fetchStats = async () => {
    // 1. Fetch Profiles & Referrals
    const [profilesRes, referralsRes] = await Promise.all([
      supabase.from('profiles').select('loyalty_points, referral_points, id, full_name, email, referred_by, referral_code').order('created_at', { ascending: false }).limit(2000),
      supabase.from('referrals').select('referrer_id, referred_id, status')
    ]);

    const profiles = profilesRes.data || [];
    const referrals = referralsRes.data || [];
    const validCodes = profiles.filter(p => !!p.referral_code).map(p => p.referral_code!.toUpperCase());

    const totalPoints = profiles.reduce((acc, curr) => acc + (curr.loyalty_points || 0), 0) || 0;
    const totalRefPoints = profiles.reduce((acc, curr) => acc + (curr.referral_points || 0), 0) || 0;

    // 2. Compute Referrals (Hybrid Logic)
    let refCount = 0;
    const referrerMap = new Map();

    // Map profiles for quick lookup
    const idToProfile = new Map();
    profiles.forEach(p => idToProfile.set(p.id, p));

    const codeToProfile = new Map();
    profiles.forEach(p => {
      if (p.referral_code) codeToProfile.set(p.referral_code.trim().toUpperCase(), p);
    });

    // Strategy 1: Data from 'referrals' table (Explicit tracking)
    referrals.forEach(r => {
      refCount++;
      referrerMap.set(r.referrer_id, (referrerMap.get(r.referrer_id) || 0) + 1);
    });

    // Strategy 2: Data from 'profiles.referred_by' (Implicit tracking)
    const seenPairs = new Set(referrals.map(r => `${r.referrer_id}:${r.referred_id}`));
    const invalidCodes = new Map<string, number>();

    profiles.forEach(p => {
      if (!p.referred_by) return;

      let referrerId: string | undefined;
      const val = p.referred_by.trim();

      if (val.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        if (idToProfile.has(val)) referrerId = val;
      } else {
        const referrerProfile = codeToProfile.get(val.toUpperCase());
        if (referrerProfile) {
          referrerId = referrerProfile.id;
        } else {
          invalidCodes.set(val, (invalidCodes.get(val) || 0) + 1);
        }
      }

      if (referrerId && !seenPairs.has(`${referrerId}:${p.id}`)) {
        refCount++;
        referrerMap.set(referrerId, (referrerMap.get(referrerId) || 0) + 1);
        seenPairs.add(`${referrerId}:${p.id}`);
      }
    });

    // Format Top Referrers
    const topReferrers = Array.from(referrerMap.entries())
      .map(([referrerId, count]) => {
        const user = idToProfile.get(referrerId);
        return {
          full_name: user?.full_name || 'Inconnu',
          email: user?.email || 'N/A',
          count
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      totalPoints,
      totalReferrals: refCount,
      pendingReferrals: referrals.filter(r => r.status === 'pending').length,
      pointsDistributed: totalRefPoints,
      topReferrers
    });

    // Suggestions for invalid codes
    const invalidList = Array.from(invalidCodes.entries())
      .map(([code, count]) => {
        // Find closest valid code
        let closest = "";
        let minDistance = 999;
        const searchVal = code.toUpperCase();

        if (validCodes.length > 0) {
          validCodes.forEach(vc => {
            const dist = getLevenshteinDistance(searchVal, vc);
            if (dist < minDistance && dist <= 2) { // Dist max 2 for relevance
              minDistance = dist;
              closest = vc;
            }
          });
        }

        return `${code} (${count}x)${closest ? ` -> Probable: ${closest}` : ""}`;
      })
      .join('\n        - ');

    setDiagnosticHint(`
        - ${profiles.length} profils chargés
        - ${refCount} parrainages validés
        - Codes invalides (SAISIE ERRONÉE ?) :
        - ${invalidList || 'Aucun'}
        
        Note : Si un code est dans la liste "Invalide", c'est qu'il ne correspond à aucun parrain existant.
    `);
  };

  const fetchConfig = async () => {
    try {
      const { settingsService } = await import("../../../services/settingsService");
      const settings = await settingsService.getSettings();
      setConfig(settings.referral || {});
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('point_history')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) setTransactions(data);
    setLoading(false);
  };

  // Debounced Autocomplete Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      // Don't search if we already selected this user
      if (foundUser && (searchTerm === foundUser.email || searchTerm === foundUser.full_name)) {
        return;
      }

      setSearchingUser(true);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, loyalty_points, referred_by, referral_code')
        .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`)
        .limit(5);

      if (data) {
        setSuggestions(data);
        setShowSuggestions(true);
      }
      setSearchingUser(false);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const selectUser = (user: any) => {
    setFoundUser(user);
    setSearchTerm(user.email || user.full_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleAdjustment = async () => {
    if (!foundUser || !adjustForm.amount || !adjustForm.reason) return;
    setLoading(true);

    const finalAmount = adjustForm.type === 'debit' ? -Math.abs(adjustForm.amount) : Math.abs(adjustForm.amount);

    try {
      const { error } = await supabase.rpc('award_points', {
        p_user_id: foundUser.id,
        p_amount: finalAmount,
        p_reason: `[Admin] ${adjustForm.reason}`,
        p_source: 'admin_adjustment'
      });

      if (error) throw error;

      showNotification("Succès", "Points ajustés avec succès", "success");
      setAdjustForm({ email: "", amount: 100, reason: "", type: "credit" });
      setFoundUser(null);
      fetchTransactions(); // Refresh history if visible
    } catch (err: any) {
      showNotification("Erreur", err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      const { settingsService } = await import("../../../services/settingsService");
      await settingsService.updateSettings("referral", config);
      showNotification("Sauvegardé", "Configuration mise à jour", "success");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Fidélité & Parrainage"
        subtitle="Gestion centralisée du programme de points"
        action={activeTab === 'config' ? {
          label: loading ? "Enregistrement..." : "Sauvegarder",
          icon: Check,
          onClick: saveConfig,
          disabled: loading
        } : undefined}
      />

      {/* Navigation Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { id: 'overview', label: "Vue d'ensemble", icon: TrendingUp },
          { id: 'transactions', label: "Historique Transactions", icon: History },
          { id: 'adjustments', label: "Ajustement Manuel", icon: Sliders }, // Removed Sliders import above, using Users/Crown instead or just text
          { id: 'config', label: "Configuration", icon: Check } // Icon placeholder
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total Parrainages</h3>
                  <p className="text-3xl font-bold mt-1">{stats.totalReferrals}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600">
                  <Gift className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Points en Circulation</h3>
                  <p className="text-3xl font-bold mt-1">{stats.totalPoints.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4">Top Parrains</h3>
            {stats.topReferrers.length > 0 ? (
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="py-3 font-medium text-gray-500">Parrain</th>
                    <th className="py-3 font-medium text-gray-500">Email</th>
                    <th className="py-3 font-medium text-gray-500 text-right">Filleuls Recrutés</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {stats.topReferrers.map((referrer: any, index: number) => (
                    <tr key={index}>
                      <td className="py-3 font-medium">
                        {referrer.full_name || "Utilisateur"}
                        {index === 0 && <span className="ml-2 text-yellow-500">👑</span>}
                      </td>
                      <td className="py-3 text-gray-500">{referrer.email}</td>
                      <td className="py-3 font-bold text-right">{referrer.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-4 text-gray-500 italic">
                Aucun top parrain identifié pour le moment.
              </div>
            )}

            {/* Diagnostic report always visible at bottom of overview */}
            {diagnosticHint && (
              <div className="mt-12 pt-6 border-t border-gray-100 dark:border-gray-700">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                  <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    🔍 Diagnostic des Parrainages & Erreurs de Saisie
                  </h4>
                  <pre className="text-xs text-blue-800 dark:text-blue-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {diagnosticHint}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        {activeTab === 'transactions' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.profiles?.full_name || 'Alimou'}</p>
                      <p className="text-xs text-gray-500">{tx.profiles?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{tx.reason}</td>
                    <td className={`px-6 py-4 text-sm font-bold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {
          activeTab === 'adjustments' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Créditer ou Débiter un Client
              </h3>

              <div className="space-y-6">
                {/* Search User */}

                {/* Search User Autocomplete */}
                <div className="relative z-20">
                  <label className="block text-sm font-medium mb-1">Rechercher un client (Nom, Email, Tel)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setFoundUser(null); // Reset selection on edit
                      }}
                      onFocus={() => {
                        if (suggestions.length > 0) setShowSuggestions(true);
                      }}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="Tapez pour rechercher..."
                    />
                    {searchingUser && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute w-full mt-1 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 max-h-60 overflow-y-auto z-50">
                      {suggestions.map((user) => (
                        <li
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.full_name || 'Sans nom'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                              <p>{user.loyalty_points || 0} pts</p>
                              {/* DEBUG DISPLAY */}
                              {user.referred_by && (
                                <p className="text-blue-500" title={user.referred_by}>
                                  Parrain: {user.referred_by.substring(0, 6)}...
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {foundUser && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-bold text-blue-900 dark:text-blue-200">{foundUser.full_name}</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Solde actuel: {foundUser.loyalty_points} pts</p>
                  </div>
                  <Check className="text-green-500" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type d'opération</label>
                  <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                      onClick={() => setAdjustForm({ ...adjustForm, type: 'credit' })}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${adjustForm.type === 'credit' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Crédit (+)
                    </button>
                    <button
                      onClick={() => setAdjustForm({ ...adjustForm, type: 'debit' })}
                      className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${adjustForm.type === 'debit' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                    >
                      Débit (-)
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="adjust-amount" className="block text-sm font-medium mb-1">Montant (Points)</label>
                  <input
                    id="adjust-amount"
                    type="number"
                    placeholder="0"
                    value={adjustForm.amount}
                    onChange={e => setAdjustForm({ ...adjustForm, amount: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="adjust-reason" className="block text-sm font-medium mb-1">Motif (Visible par le client)</label>
                <input
                  id="adjust-reason"
                  type="text"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Ex: Geste commercial, Bonus anniversaire..."
                />
              </div>

              <button
                onClick={handleAdjustment}
                disabled={!foundUser || loading}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Traitement..." : "Valider l'opération"}
              </button>
            </div>
          )}

        {
          activeTab === 'config' && (
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
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                    </div>
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
    </div>
  );
}
