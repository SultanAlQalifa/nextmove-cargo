import { useState, useEffect } from "react";

import {
  Users,
  Search,
  Check,
  TrendingUp,
  History,
  Crown,
  Gift,
  Sliders,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
          {/* Bento Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-xl group hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Utilisateurs</span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Total Parrainages</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.totalReferrals}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-xl group hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                  <Gift className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Points</span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Points Circulants</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.totalPoints.toLocaleString()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-xl group hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Activité</span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Points Distribués</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.pointsDistributed.toLocaleString()}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/20 dark:border-white/10 shadow-xl group hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Crown className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Elite</span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Top Parrains</h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">{stats.topReferrers.length}</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Top Referrers Table - Elite Style */}
            <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="p-8 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Champions du Parrainage</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Meilleurs recruteurs de la plateforme</p>
                </div>
                <Star className="w-6 h-6 text-amber-500 fill-amber-500/20" />
              </div>
              <div className="overflow-x-auto">
                {stats.topReferrers.length > 0 ? (
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parrain</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Filleuls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {stats.topReferrers.map((referrer: any, index: number) => (
                        <tr key={index} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center font-black text-primary">
                                {referrer.full_name?.charAt(0) || "U"}
                              </div>
                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                {referrer.full_name || "Utilisateur"}
                                {index === 0 && <span className="ml-2">👑</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-sm font-medium text-slate-500">{referrer.email}</td>
                          <td className="px-8 py-5 text-right">
                            <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full font-black text-sm">
                              {referrer.count}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-slate-500 font-bold italic">
                    Aucune activité de parrainage détectée.
                  </div>
                )}
              </div>
            </div>

            {/* Status & Diagnostic - Elite Style */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl p-8">
              <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6">Santé du Système</h3>
              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Programme</p>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Actif & Opérationnel</p>
                </div>
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Dernier Calcul</p>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-200">Il y a quelques instants</p>
                </div>

                {diagnosticHint && (
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-4 flex items-center gap-2">
                      <Activity className="w-3 h-3" /> Diagnostic Détail
                    </p>
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                      <pre className="text-[10px] text-slate-300 whitespace-pre-wrap font-mono leading-relaxed opacity-80">
                        {diagnosticHint.trim().split('\n').filter(l => l.trim()).slice(0, 5).join('\n')}
                        {"\n"}... (Plus d'infos en console)
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      <div className="mt-6">
        {activeTab === 'transactions' && (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                  <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs">
                          {tx.profiles?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{tx.profiles?.full_name || 'Alimou'}</p>
                          <p className="text-[10px] text-slate-500">{tx.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{tx.reason}</td>
                    <td className={`px-8 py-5 text-sm font-black ${tx.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      <span className={`px-3 py-1 rounded-full ${tx.points > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'adjustments' && (
          <div className="max-w-2xl mx-auto bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sliders className="w-32 h-32" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <Crown className="w-6 h-6 text-amber-500" />
              </div>
              Ajustement Manuel de Points
            </h3>

            <div className="space-y-8 relative z-10">
              {/* Search User Autocomplete */}
              <div className="relative">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Cibler un Client</label>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setFoundUser(null);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-white/5 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 dark:text-white"
                    placeholder="Nom, Email ou Téléphone..."
                  />
                  {searchingUser && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <ul
                      className="absolute w-full mt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 max-h-64 overflow-y-auto z-50 p-2"
                    >
                      {suggestions.map((user) => (
                        <li
                          key={user.id}
                          onClick={() => selectUser(user)}
                          className="px-4 py-3 hover:bg-primary/10 rounded-xl cursor-pointer transition-colors group"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{user.full_name || 'Sans nom'}</p>
                              <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-primary">{user.loyalty_points || 0} pts</p>
                              {user.referral_code && <p className="text-[10px] font-bold text-slate-400">#{user.referral_code}</p>}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </AnimatePresence>
              </div>

              {foundUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex justify-between items-center shadow-inner"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary text-xl shadow-lg">
                      {foundUser.full_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-lg">{foundUser.full_name}</p>
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">Solde: {foundUser.loyalty_points} pts</p>
                    </div>
                  </div>
                  <div className="p-2 bg-emerald-500/20 text-emerald-500 rounded-full">
                    <Check className="w-6 h-6" />
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Type d'opération</label>
                  <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-white/5">
                    <button
                      onClick={() => setAdjustForm({ ...adjustForm, type: 'credit' })}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adjustForm.type === 'credit' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
                    >
                      Crédit (+)
                    </button>
                    <button
                      onClick={() => setAdjustForm({ ...adjustForm, type: 'debit' })}
                      className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${adjustForm.type === 'debit' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105' : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'}`}
                    >
                      Débit (-)
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="adjust-amount" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Montant (Points)</label>
                  <input
                    id="adjust-amount"
                    type="number"
                    value={adjustForm.amount}
                    onChange={e => setAdjustForm({ ...adjustForm, amount: parseInt(e.target.value) })}
                    className="w-full px-4 py-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-white/5 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-lg text-slate-900 dark:text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="adjust-reason" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Motif Officiel</label>
                <input
                  id="adjust-reason"
                  type="text"
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="w-full px-4 py-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/20 dark:border-white/5 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-900 dark:text-white"
                  placeholder="Geste commercial, Bonus exceptionnel..."
                />
              </div>

              <button
                onClick={handleAdjustment}
                disabled={!foundUser || loading || !adjustForm.amount || !adjustForm.reason}
                className="w-full py-5 bg-gradient-to-r from-primary to-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-primary/30 transition-all disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed group relative overflow-hidden"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Valider l'Opération
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        )}
        {activeTab === 'config' && (
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-white/20 dark:border-white/10 p-8 lg:p-12 max-w-4xl mx-auto shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Settings className="w-48 h-48" />
            </div>

            <div className="relative z-10">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                Paramètres du Programme
              </h3>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-10 px-1">Gouvernance et règles de fidélité</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Rule Card 1 */}
                <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 shadow-xl group">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <label htmlFor="program_enabled" className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="program_enabled"
                        type="checkbox"
                        aria-label="Activer le parrainage"
                        checked={config.program_enabled}

                        onChange={(e) => setConfig({ ...config, program_enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-14 h-7 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">Mise en Service</h4>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Activer le Parrainage</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    Autoriser les nouveaux utilisateurs à s'inscrire avec un code parrain et générer des récompenses automatiques.
                  </p>
                </div>

                {/* Rule Card 2 */}
                <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 shadow-xl group">
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl w-fit mb-6">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">Bonus de Bienvenue</h4>
                  <label htmlFor="points_per_referral" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Points par Parrainage</label>
                  <div className="relative">
                    <input
                      id="points_per_referral"
                      type="number"
                      value={config.points_per_referral}
                      onChange={(e) => setConfig({ ...config, points_per_referral: Number(e.target.value) })}
                      className="w-full pl-6 pr-12 py-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-transparent focus:border-primary outline-none transition-all font-black text-2xl text-primary"
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 uppercase">Points</span>
                  </div>
                </div>

                {/* Rule Card 3 */}
                <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 shadow-xl group">
                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl w-fit mb-6">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">Taux de Change</h4>
                  <label htmlFor="point_value" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Valeur du Point (FCFA)</label>
                  <div className="relative">
                    <input
                      id="point_value"
                      type="number"
                      value={config.point_value || 50}
                      onChange={(e) => setConfig({ ...config, point_value: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-transparent focus:border-primary outline-none transition-all font-black text-2xl text-amber-500"
                    />
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-amber-500 opacity-50">₣</span>
                  </div>
                </div>

                {/* Rule Card 4 */}
                <div className="p-6 rounded-[2rem] bg-white/40 dark:bg-slate-800/40 border border-white/20 dark:border-white/5 shadow-xl group">
                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl w-fit mb-6">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1">Limitation</h4>
                  <label htmlFor="max_referrals" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Max Filleuls / User</label>
                  <div className="relative">
                    <input
                      id="max_referrals"
                      type="number"
                      value={config.max_referrals_per_user}
                      onChange={(e) => setConfig({ ...config, max_referrals_per_user: Number(e.target.value) })}
                      className="w-full pl-6 pr-4 py-4 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50 border border-transparent focus:border-primary outline-none transition-all font-black text-2xl text-rose-500"
                    />
                  </div>
                </div>

                <div className="lg:col-span-2 p-6 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 flex items-start gap-5">
                  <div className="p-3 bg-blue-500/20 text-blue-500 rounded-2xl shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-blue-900 dark:text-blue-200 text-sm uppercase tracking-widest mb-1">Information Importante</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                      Les modifications s'appliquent uniquement aux futurs parrainages. L'historique n'est pas recalculé rétroactivement pour les anciens dossiers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
