import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUI } from "../../contexts/UIContext";
import PaymentModal from "../../components/dashboard/PaymentModal";
import ChatWindow from "../../components/dashboard/ChatWindow";
import { quoteService, QuoteRequest } from "../../services/quoteService";
import { supabase } from "../../lib/supabase";
import PageHeader from "../../components/common/PageHeader";
import {
  Package,
  Truck,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Calculator,
  ArrowUpRight,
  X,
  Activity,
  Sparkles,
  Gift,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import LoyaltyCenter from "../../components/dashboard/LoyaltyCenter";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { ChartGuard } from "../../components/common/ChartGuard";
import { useToast } from "../../contexts/ToastContext";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { useDataSync } from "../../contexts/DataSyncContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useFeature } from "../../contexts/FeatureFlagContext";

export default function ClientDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { openCalculator } = useUI();
  const { settings } = useSettings();
  const showPredictiveAnalytics = useFeature('predictive_analytics');

  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedRequestQuotes, setSelectedRequestQuotes] = useState<any[] | null>(null);
  const [paymentShipment, setPaymentShipment] = useState<any | null>(null);
  const [activeChat, setActiveChat] = useState<{ chatId: string; recipientName: string; } | null>(null);
  const [searchQuery] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRequests(), loadShipments()]);
    } finally {
      setLoading(false);
    }
  };

  // Live Refresh Logic
  useDataSync('shipments', () => loadData());
  useDataSync('quote_requests', () => loadData());
  useDataSync('profiles', () => loadData());

  const loadRequests = async () => {
    if (!user) return;
    try {
      const data = await quoteService.getClientRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  };

  const loadShipments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("shipments")
      .select("*, forwarder:forwarder_id(full_name, company_name), payment:payments(*)")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("Error loading shipments:", error);
    else setShipments(data || []);
  };

  const { success, error: toastError } = useToast();
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    quoteId: string | null;
    requestId: string | null;
  }>({
    isOpen: false,
    quoteId: null,
    requestId: null
  });

  const handleAcceptQuote = (quoteId: string, requestId: string) => {
    setConfirmation({
      isOpen: true,
      quoteId,
      requestId
    });
  };

  const confirmAcceptQuote = async () => {
    if (!confirmation.quoteId || !confirmation.requestId) return;

    try {
      await quoteService.acceptQuote(confirmation.quoteId, confirmation.requestId);
      success("Offre acceptée ! Expédition créée.");
      setSelectedRequestQuotes(null);
      loadData();
    } catch (error) {
      console.error("Error accepting quote:", error);
      toastError("Échec de l'acceptation de l'offre.");
    } finally {
      setConfirmation({ isOpen: false, quoteId: null, requestId: null });
    }
  };

  // Filtered Data
  const filteredRequests = useMemo(() => requests.filter(
    (r) =>
      r.cargo_details.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination_country.toLowerCase().includes(searchQuery.toLowerCase()),
  ), [requests, searchQuery]);

  const filteredShipments = useMemo(() => shipments.filter(
    (s) =>
      s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination_country.toLowerCase().includes(searchQuery.toLowerCase()),
  ), [shipments, searchQuery]);

  // Stats Logic
  const stats = useMemo(() => {
    const activeShipments = shipments.filter((s) => !["completed", "cancelled"].includes(s.status)).length;
    const pendingRequests = requests.filter((r) => r.status === "pending").length;
    const completedShipments = shipments.filter((s) => s.status === "completed").length;
    const totalSpent = shipments.reduce((sum, s) => {
      const paidTx = s.payment?.filter((p: any) => p.status === 'completed') || [];
      return sum + paidTx.reduce((t: number, p: any) => t + (p.amount || 0), 0);
    }, 0);

    // Logistics Impact Score (0-100)
    // Formula: (completed * 10) + (active * 5) + (spent / 10000)
    const impactScore = Math.min(100, (completedShipments * 5) + (activeShipments * 3) + Math.floor(totalSpent / 50000));

    return { activeShipments, pendingRequests, completedShipments, totalSpent, impactScore };
  }, [shipments, requests]);

  // Chart Data (Real Data Aggregation + Forecast)
  const chartData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Initialize counts
    const monthCounts = months.map(m => ({ name: m, expeditions: 0, demandes: 0, prevision: null as number | null }));

    // Aggregate Shipments
    shipments.forEach(s => {
      const d = new Date(s.created_at);
      if (d.getFullYear() === currentYear) {
        monthCounts[d.getMonth()].expeditions++;
      }
    });

    // Aggregate Requests
    requests.forEach(r => {
      if (!r.created_at) return;
      const d = new Date(r.created_at);
      if (d.getFullYear() === currentYear) {
        monthCounts[d.getMonth()].demandes++;
      }
    });

    // Add Forecast for next 2 months
    const avgExp = Math.max(1, Math.ceil(stats.activeShipments / 4));
    for (let i = currentMonth + 1; i < Math.min(12, currentMonth + 3); i++) {
      monthCounts[i].prevision = monthCounts[Math.max(0, i - 1)].expeditions + avgExp;
    }

    return monthCounts;
  }, [shipments, requests, stats.activeShipments]);




  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-slate-500 animate-pulse font-medium">Chargement de votre tableau de bord...</p>
      </div>
    );
  }



  // Founder Pack Banner
  const showFounderBanner = settings?.marketing?.show_founder_offer && !profile?.is_founder;

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title={t("dashboard.menu.dashboard")}
        subtitle={`Ravi de vous revoir, ${profile?.full_name?.split(' ')[0] || "Client"}.`}
        action={{
          label: "Nouvelle Demande",
          onClick: () => (window.location.href = "/dashboard/client/rfq/create"),
          icon: Plus,
        }}
      >
        <div className="flex gap-3">
          <button
            onClick={openCalculator}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white/50 hover:bg-white border border-slate-200 hover:border-primary/20 rounded-xl transition-all shadow-sm hover:shadow-md backdrop-blur-sm group"
          >
            <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline group-hover:text-orange-600 transition-colors">Calculateur</span>
          </button>
          <Link
            to="/dashboard/client/groupage"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Groupage</span>
          </Link>
        </div>
      </PageHeader>

      {/* Founder Pack Banner */}
      {showFounderBanner && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-orange-600 p-8 text-white shadow-xl shadow-amber-500/20 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-40 w-40 rounded-full bg-black/10 blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm mb-3">
                <Sparkles className="h-3 w-3" /> Offre Limitée
              </div>
              <h3 className="mb-2 text-2xl font-bold">Devenez Membre Fondateur</h3>
              <p className="max-w-xl text-amber-100">
                Obtenez le badge exclusif, un support prioritaire à vie et des accès anticipés. Rejoignez le cercle des pionniers.
              </p>
            </div>
            <Link
              to="/dashboard/client/founder-payment"
              className="group whitespace-nowrap rounded-2xl bg-white px-6 py-3 font-bold text-orange-600 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:bg-slate-50"
            >
              Découvrir l'offre
              <ArrowRight className="ml-2 inline-block h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(140px,auto)]">

        {/* 1. Main Stats Chart - Spans 2 cols, 2 rows on large screens */}
        <div className="md:col-span-2 lg:col-span-2 row-span-2 glass-card-premium rounded-3xl p-6 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Activité Mensuelle
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Expéditions vs Demandes</p>
            </div>
            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          {/* eslint-disable-next-line react/forbid-dom-props */}
          <div className="relative z-10 w-full h-[300px]">
            <ChartGuard height={300}>
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#FB923C" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" dataKey="expeditions" stackId="1" stroke="#FB923C" strokeWidth={3} fill="url(#colorExp)" />
                  <Area type="monotone" dataKey="demandes" stackId="1" stroke="#3B82F6" strokeWidth={3} fill="url(#colorReq)" />
                  {showPredictiveAnalytics && <Area type="monotone" dataKey="prevision" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" fill="transparent" />}
                </AreaChart>
              </ResponsiveContainer>
            </ChartGuard>
          </div>
          {/* Decorative bg blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
        </div>

        {/* Referral Promo Card - Replaces Pie Chart */}
        <div className="md:col-span-1 lg:col-span-1 row-span-2 bg-gradient-to-br from-violet-600 to-fuchsia-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-violet-500/20 group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                  +500 pts / ami
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Invitez & Gagnez</h3>
              <p className="text-violet-100 text-sm leading-relaxed">
                Partagez votre code unique avec vos amis. Ils gagnent des réductions et vous recevez 500 points à leur première expédition !
              </p>
            </div>

            <div className="mt-6 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 text-center">
              <p className="text-xs font-medium text-violet-200 mb-1">Votre Code</p>
              <code className="block text-xl font-mono font-bold tracking-widest text-white">
                {profile?.referral_code || "---"}
              </code>
            </div>

            <Link
              to="/dashboard/client/loyalty?tab=referrals"
              className="mt-4 w-full py-3 bg-white text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-colors text-center text-sm shadow-md flex items-center justify-center gap-2 group-hover:gap-3"
            >
              Inviter des amis <ArrowRight className="w-4 h-4 transition-all" />
            </Link>
          </div>
        </div>

        {/* 2. Loyalty Center - Premium Gamified Section (Spans 2 cols on LG) */}
        <div className="lg:col-span-2 md:col-span-2 row-span-2">
          <LoyaltyCenter
            points={profile?.loyalty_points || 0}
            tier={profile?.tier || "Bronze"}
            pointValue={0.5} // Logic: 1 point = 0.5 XOF
            onConvert={() => navigate('/dashboard/client/loyalty?action=convert')}
            onTransfer={() => navigate('/dashboard/client/loyalty?action=transfer')}
          />
        </div>

        {/* 3. Active Shipments */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              Actives
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Expéditions en cours</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.activeShipments}</h3>
          <div className="mt-4 flex -space-x-2 overflow-hidden">
            {/* Fake user avatars/icons representing active shipments agents */}
            {[1, 2, 3].map(i => (
              <div key={i} className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500 dark:text-slate-400">A{i}</div>
            ))}
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-800 bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">+</div>
          </div>
        </div>

        {/* 4. Pending Requests */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
              {stats.pendingRequests} En attente
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Demandes de devis</p>
          <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{stats.pendingRequests}</h3>
          <Link to="/dashboard/client/rfq" className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1">
            Voir les offres <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 5. Smart Impact & Loyalty */}
        {showPredictiveAnalytics && (
          <div className="glass-card-premium rounded-3xl p-6 hover:shadow-xl transition-all duration-300 group relative overflow-hidden animate-delay-400">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl group-hover:bg-primary/20 transition-colors">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Score</span>
                <div className="text-lg font-black text-primary">{stats.impactScore}/100</div>
              </div>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Prochain Palier</p>
            <div className="mt-2 h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.impactScore}%` }}
                className="h-full bg-primary"
              />
            </div>
            <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase italic">Logistique Premium activée</p>
          </div>
        )}

      </div>

      {/* Lists Section - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Active Shipments List */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 dark:border-white/10 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-dark-card/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100/50 rounded-xl">
                <Truck className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Expéditions Actives</h2>
            </div>
            <Link to="/dashboard/client/shipments" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredShipments.slice(0, 4).map(shipment => (
              <div key={shipment.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => navigate(`/dashboard/client/shipments/${shipment.id}`)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{shipment.tracking_number}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{shipment.origin_country} → {shipment.destination_country}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${shipment.status === 'in_transit' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    shipment.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                    {shipment.status}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(shipment.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {filteredShipments.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-slate-400">Aucune expédition en cours</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Requests List */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/40 dark:border-white/10 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-dark-card/40">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100/50 rounded-xl">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Demandes Récentes</h2>
            </div>
            <Link to="/dashboard/client/rfq" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <ArrowUpRight className="w-5 h-5 text-slate-400" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {filteredRequests.slice(0, 4).map(request => (
              <div key={request.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between group cursor-pointer" onClick={() => setSelectedRequestQuotes(request.quotes || null)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">{request.cargo_details.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{request.origin_country} → {request.destination_country}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${request.status === 'quoted' ? 'bg-green-50 text-green-600 border-green-100' :
                    'bg-slate-50 text-slate-600 border-slate-100'
                    }`}>
                    {request.status === 'quoted' ? 'Offre Reçue' : request.status}
                  </span>
                  <span className="text-xs text-slate-400">
                    {request.quotes?.length || 0} offres
                  </span>
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-slate-400">Aucune demande récente</p>
                <button onClick={() => window.location.href = "/dashboard/client/rfq/create"} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                  Créer ma première demande
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedRequestQuotes && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl border border-white/20 dark:border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Offres Disponibles
              </h3>
              <button
                onClick={() => setSelectedRequestQuotes(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            <div className="space-y-4">
              {selectedRequestQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="border border-slate-100 dark:border-slate-700 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-lg transition-all bg-slate-50/50 dark:bg-slate-900/50 group"
                >
                  <div>
                    <p className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      {quote.forwarder?.company_name || "Prestataire"}
                      <div className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Verifié</div>
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Valide jusqu'au: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div className="mt-4 sm:mt-0 text-right">
                    <p className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: quote.currency || 'XOF' }).format(quote.amount)}
                    </p>
                    <button
                      onClick={() => handleAcceptQuote(quote.id, quote.request_id)}
                      className="mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 text-sm font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                      Accepter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paymentShipment && (
        <PaymentModal
          shipment={paymentShipment}
          onClose={() => setPaymentShipment(null)}
          onSuccess={() => {
            setPaymentShipment(null);
            loadData();
          }}
        />
      )}

      {activeChat && (
        <ChatWindow
          chatId={activeChat.chatId}
          recipientName={activeChat.recipientName}
          onClose={() => setActiveChat(null)}
        />
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, quoteId: null, requestId: null })}
        onConfirm={confirmAcceptQuote}
        title="Accepter l'offre"
        message="Êtes-vous sûr de vouloir accepter cette offre ? Cela créera une expédition automatiquement."
        confirmLabel="Accepter et Payer"
      />
    </div>
  );
}
