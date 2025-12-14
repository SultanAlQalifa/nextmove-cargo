import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import { paymentService } from "../../../services/paymentService";
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Calendar,
  X,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  FileText,
  CheckCircle,
  Clock,
  RefreshCcw,
} from "lucide-react";
import TransactionDetailsModal from "../../../components/admin/TransactionDetailsModal";
import RefundRequestModal from "../../../components/admin/RefundRequestModal";
import { useToast } from "../../../contexts/ToastContext";

export default function AdminPayments() {
  const { success } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "3m" | "1y" | "all" | "custom"
  >("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredTransactions, setFilteredTransactions] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Details Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    volume: { value: 0, trend: "+0%", trendUp: true },
    commissions: { value: 0, trend: "+0%", trendUp: true },
    pending: { value: 0, trend: "0%", trendUp: true },
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getAllTransactions();
      const formattedData = data.map((t) => ({
        id: t.reference || t.id,
        client:
          t.user?.full_name ||
          t.user?.company_name ||
          t.user?.email ||
          "Inconnu",
        amount: t.amount,
        type: t.category === "escrow_deposit" ? "Escrow" : "Paiement",
        status:
          t.release_status === "locked"
            ? "Locked"
            : t.status.charAt(0).toUpperCase() + t.status.slice(1),
        isLocked: t.release_status === "locked",
        shipment_id: t.shipment_id, // Store for release action
        currency: t.currency,
        date: t.created_at,
        method:
          t.method === "mobile_money"
            ? "Mobile Money"
            : t.method === "card"
              ? "Carte Bancaire"
              : t.method,
      }));
      setTransactions(formattedData);
      setFilteredTransactions(formattedData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply Filters
  useEffect(() => {
    let result = [...transactions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.id.toLowerCase().includes(query) ||
          t.client.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "Locked") {
        result = result.filter((t) => t.isLocked);
      } else {
        result = result.filter(
          (t) => t.status.toLowerCase() === statusFilter.toLowerCase(),
        );
      }
    }

    // Time range filtering
    if (timeRange !== "all") {
      const now = new Date();
      let limitDate = new Date();

      if (timeRange === "7d") limitDate.setDate(now.getDate() - 7);
      else if (timeRange === "30d") limitDate.setDate(now.getDate() - 30);
      else if (timeRange === "3m") limitDate.setMonth(now.getMonth() - 3);
      else if (timeRange === "1y") limitDate.setFullYear(now.getFullYear() - 1);

      if (timeRange !== "custom") {
        result = result.filter((t) => new Date(t.date) >= limitDate);
      }
    }

    setFilteredTransactions(result);

    // Update Stats
    const totalVolume = result.reduce((acc, curr) => acc + curr.amount, 0);
    const lockedVolume = result
      .filter((t) => t.isLocked)
      .reduce((acc, curr) => acc + curr.amount, 0);

    setStats({
      volume: {
        value: totalVolume,
        trend: "+0%",
        trendUp: true,
      },
      commissions: {
        value: lockedVolume,
        trend: "Fonds Bloqués",
        trendUp: true,
      },
      pending: {
        value: result
          .filter((t) => t.status.toLowerCase() === "pending")
          .reduce((acc, curr) => acc + curr.amount, 0),
        trend: "0%",
        trendUp: false,
      },
    });
  }, [searchQuery, timeRange, customDateRange, statusFilter, transactions]);

  const handleReleaseFunds = async (trx: any) => {
    if (!trx.shipment_id) return;
    if (
      !window.confirm(
        `Voulez-vous libérer les fonds (${trx.amount} ${trx.currency || "XOF"
        }) pour le transitaire ?`,
      )
    )
      return;

    try {
      setLoading(true);
      await paymentService.releaseFunds(trx.shipment_id);
      success("Fonds libérés avec succès");
      fetchTransactions(); // Refresh
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-XO", {
      style: "currency",
      currency: "XOF",
    }).format(amount);
  };

  const handleDownloadReceipt = (id: string) => {
    // Mock download
    const element = document.createElement("a");
    const file = new Blob(
      [`Reçu pour la transaction ${id}\nDate: ${new Date().toISOString()}`],
      { type: "text/plain" },
    );
    element.href = URL.createObjectURL(file);
    element.download = `recu_${id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Refund State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundPayment, setRefundPayment] = useState<any>(null);

  const openRefundModal = (trx: any) => {
    // Adapter for modal props
    setRefundPayment({
      id: trx.id,
      amount: trx.amount,
      currency: trx.currency || 'XOF', // Assuming default
      reference: trx.id,
      status: trx.status,
      user: {
        full_name: trx.client,
        email: 'client@example.com' // IDK email from table, using mock or need to fetch
      }
    });
    setIsRefundModalOpen(true);
  };

  const handleRefundConfirm = async (paymentId: string, amount: number, reason: string) => {
    try {
      setLoading(true);
      await paymentService.refund(paymentId, amount, reason);

      success(`Remboursement de ${amount} effectué avec succès.`);
      setIsRefundModalOpen(false);
      fetchTransactions();
    } catch (error) {
      console.error("Refund failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion Financière"
        subtitle="Suivi des paiements et Escrow"
        action={{
          label: "Exporter le rapport",
          onClick: () => {
            success("Export du rapport...");
          },
          icon: Download,
        }}
      />

      {/* Unified Filter Segment */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        {/* Time Range Segmented Control */}
        <div className="flex bg-gray-50 rounded-xl p-1">
          {[
            { id: "7d", label: "7J" },
            { id: "30d", label: "30J" },
            { id: "3m", label: "3M" },
            { id: "1y", label: "1A" },
            { id: "all", label: "Tout" },
            { id: "custom", icon: Calendar },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setTimeRange(period.id as any)}
              className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                ${timeRange === period.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }
                            `}
              title={
                period.id === "custom" ? "Période personnalisée" : undefined
              }
            >
              {period.icon ? <period.icon className="w-4 h-4" /> : period.label}
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            title="Filtre Statut"
            aria-label="Filtre Statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="Locked">Escrow (Bloqué)</option>
            <option value="Completed">Complété</option>
            <option value="Pending">En attente</option>
            <option value="Failed">Échoué</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {timeRange === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200 bg-gray-50 p-1 rounded-xl">
            <input
              type="date"
              title="Date de début personnalisée"
              value={customDateRange.start}
              onChange={(e) =>
                setCustomDateRange({
                  ...customDateRange,
                  start: e.target.value,
                })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              title="Date de fin personnalisée"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange({ ...customDateRange, end: e.target.value })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
          </div>
        )}

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            title="Rechercher une transaction"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par ID, client..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.volume.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.volume.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.volume.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Volume Total</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.volume.value)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.commissions.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.commissions.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.commissions.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Commissions</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.commissions.value)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.pending.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.pending.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.pending.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">En Attente</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.pending.value)}
          </p>
        </div>
      </div>

      {/* Transaction List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((trx) => (
              <tr key={trx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {trx.id}
                      </div>
                      <div className="text-xs text-gray-500">{trx.method}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {trx.client}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className={`text-sm font-bold ${trx.type === "Paiement" ? "text-green-600" : "text-red-600"}`}
                  >
                    {trx.type === "Paiement" ? "+" : "-"}
                    {formatCurrency(trx.amount)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${trx.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : trx.status === "Failed"
                          ? "bg-red-100 text-red-800"
                          : trx.status === "Locked"
                            ? "bg-purple-100 text-purple-800 border-purple-200 border"
                            : "bg-green-100 text-green-800"
                      }`}
                  >
                    {trx.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(trx.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      title="Options"
                      onClick={() =>
                        setActiveMenu(activeMenu === trx.id ? null : trx.id)
                      }
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenu === trx.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenu(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                          {trx.isLocked && (
                            <button
                              onClick={() => handleReleaseFunds(trx)}
                              className="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 flex items-center gap-2 font-bold"
                            >
                              <CheckCircle className="w-4 h-4" /> Libérer Fonds
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setSelectedTransaction(trx);
                              setIsDetailsModalOpen(true);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> Voir détails
                          </button>
                          {trx.status === 'Completed' && (
                            <button
                              onClick={() => {
                                openRefundModal(trx);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <RefreshCcw className="w-4 h-4" /> Rembourser
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleDownloadReceipt(trx.id);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Télécharger reçu
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTransactions.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Aucune transaction trouvée</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {isDetailsModalOpen && (
        <TransactionDetailsModal
          transaction={selectedTransaction}
          onClose={() => setIsDetailsModalOpen(false)}
          onDownloadReceipt={handleDownloadReceipt}
        />
      )}

      <RefundRequestModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        payment={refundPayment}
        onConfirm={handleRefundConfirm}
      />
    </div>
  );
}
