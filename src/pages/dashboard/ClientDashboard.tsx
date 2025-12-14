import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useUI } from "../../contexts/UIContext";
import PaymentModal from "../../components/dashboard/PaymentModal";
import ChatWindow from "../../components/dashboard/ChatWindow";
import { quoteService, QuoteRequest } from "../../services/quoteService";
import { supabase } from "../../lib/supabase";
import PageHeader from "../../components/common/PageHeader";
import DashboardControls from "../../components/dashboard/DashboardControls";
import {
  Package,
  Truck,
  CheckCircle,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  TrendingUp,
  Calculator,
  ArrowUpRight,
  Search,
  X,
  Star,
  Crown,
  Wallet,
  Bell,
  Activity,
  Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { useToast } from "../../contexts/ToastContext";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { Quote } from "../../services/quoteService";

export default function ClientDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { openCalculator } = useUI();

  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedRequestQuotes, setSelectedRequestQuotes] = useState<any[] | null>(null);
  const [paymentShipment, setPaymentShipment] = useState<any | null>(null);
  const [activeChat, setActiveChat] = useState<{ chatId: string; recipientName: string; } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
  const stats = useMemo(() => ({
    activeShipments: shipments.filter((s) => !["completed", "cancelled"].includes(s.status)).length,
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    completedShipments: shipments.filter((s) => s.status === "completed").length,
    totalSpent: shipments.reduce((sum, s) => {
      const paidTx = s.payment?.filter((p: any) => p.status === 'completed') || [];
      return sum + paidTx.reduce((t: number, p: any) => t + (p.amount || 0), 0);
    }, 0)
  }), [shipments, requests]);

  // Chart Data (Mocked but structured for real data) - Stable seed based on stats to avoid random jumps
  const chartData = useMemo(() => {
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    return months.map((month, i) => ({
      name: month,
      expeditions: Math.max(1, (stats.activeShipments + i) % 5), // Deterministic mock
      demandes: Math.max(2, (stats.pendingRequests + i) % 8),   // Deterministic mock
    }));
  }, [stats]);

  // Pie Chart Data
  const pieData = useMemo(() => [
    { name: 'Chine', value: 45, color: '#4F46E5' },
    { name: 'Turquie', value: 25, color: '#F59E0B' },
    { name: 'France', value: 20, color: '#10B981' },
    { name: 'Autres', value: 10, color: '#64748B' },
  ], []);


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
            <div className="p-1 bg-slate-100 rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Calculator className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline">Calculateur</span>
          </button>
          <Link
            to="/dashboard/client/groupage"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Groupage</span>
          </Link>
        </div>
      </PageHeader>

      {/* Founder Pack Banner */}
      {!profile?.is_founder && (
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
        <div className="md:col-span-2 lg:col-span-2 row-span-2 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
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
          <div className="relative z-10 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100} debounce={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#CBD5E1', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="expeditions" stackId="1" stroke="#4F46E5" strokeWidth={3} fill="url(#colorExp)" />
                <Area type="monotone" dataKey="demandes" stackId="1" stroke="#F59E0B" strokeWidth={3} fill="url(#colorReq)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Decorative bg blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
        </div>

        {/* Spend by Origin (Pie Chart) - Replaces Loyalty Card or gets added */}
        <div className="md:col-span-1 lg:col-span-1 row-span-2 bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Volume par Origine</h3>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Loyalty Card - Premium Glass */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-500/20 group transform transition-transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/20 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <Crown className="w-5 h-5 text-yellow-300" fill="currentColor" />
              </div>
              <span className="text-xs font-bold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {profile?.tier || "Bronze"}
              </span>
            </div>
            <p className="text-indigo-100 text-sm font-medium">Points Fidélité</p>
            <h3 className="text-3xl font-bold mt-1 tracking-tight">{profile?.loyalty_points || 0}</h3>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-indigo-100">
              <Star className="w-3 h-3 text-yellow-300" />
              <span>Prochain palier: {(profile?.loyalty_points || 0) + 500} pts</span>
            </div>
          </div>
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

        {/* 5. Total Spent */}
        <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-3xl p-6 border border-white/40 dark:border-white/10 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Dépenses Totales</p>
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(stats.totalSpent)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">Sur {stats.completedShipments} expéditions terminées</p>
        </div>

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
                      {quote.forwarder?.company_name || "Transitaire"}
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
