import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
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
  Clock,
} from "lucide-react";
import { paymentService, Transaction } from "../../../services/paymentService";
import { useToast } from "../../../contexts/ToastContext";

export default function ForwarderPayments() {
  const { success } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const data = await paymentService.getForwarderTransactions();
      setTransactions(data);
      setFilteredTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...transactions];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.reference.toLowerCase().includes(query) ||
          (t.invoice_number || "").toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    setFilteredTransactions(result);
  }, [searchQuery, statusFilter, transactions]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("fr-XO", {
      style: "currency",
      currency: currency || "XOF",
    }).format(amount);
  };

  const stats = {
    totalVolume: filteredTransactions.reduce(
      (acc, curr) => acc + curr.amount,
      0,
    ),
    pendingVolume: filteredTransactions
      .filter((t) => t.status === "pending")
      .reduce((acc, curr) => acc + curr.amount, 0),
    completedCount: filteredTransactions.filter((t) => t.status === "completed")
      .length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paiements"
        subtitle="Suivi des paiements pour vos expéditions"
        action={{
          label: "Exporter le rapport",
          onClick: () => {
            success("Export du rapport...");
          },
          icon: Download,
        }}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +15%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Volume Total</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.totalVolume, "XOF")}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +8%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            Transactions Complétées
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.completedCount}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowDownRight className="w-3 h-3" /> -5%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">En Attente</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.pendingVolume, "XOF")}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="completed">Complété</option>
            <option value="pending">En attente</option>
            <option value="failed">Échoué</option>
          </select>
        </div>

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par référence..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
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
                  <tr
                    key={trx.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {trx.reference}
                          </div>
                          <div className="text-xs text-gray-500">
                            {trx.method}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(trx.amount, trx.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${
                                                  trx.status === "pending"
                                                    ? "bg-yellow-100 text-yellow-800"
                                                    : trx.status === "failed"
                                                      ? "bg-red-100 text-red-800"
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
                          onClick={() =>
                            setActiveMenu(activeMenu === trx.id ? null : trx.id)
                          }
                          className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
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
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => setActiveMenu(null)}
                              >
                                <FileText className="w-4 h-4" /> Voir détails
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => setActiveMenu(null)}
                              >
                                <Download className="w-4 h-4" /> Télécharger
                                reçu
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
                      colSpan={5}
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
        )}
      </div>
    </div>
  );
}
