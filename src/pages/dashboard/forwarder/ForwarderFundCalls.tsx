import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { fundCallService, FundCall } from "../../../services/fundCallService";
import { paymentService } from "../../../services/paymentService";

export default function ForwarderFundCalls() {
  const { error: toastError } = useToast();
  const { profile } = useAuth();
  const [fundCalls, setFundCalls] = useState<FundCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredCalls, setFilteredCalls] = useState<FundCall[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFundCall, setNewFundCall] = useState({
    amount: "",
    currency: "XOF",
    reason: "",
    due_date: "",
  });

  const [wallet, setWallet] = useState<{
    balance: number;
    currency: string;
  } | null>(null);

  useEffect(() => {
    fetchFundCalls();
    fetchWalletAndRates();
  }, []);

  const fetchWalletAndRates = async () => {
    try {
      const walletData = await paymentService.getWallet();
      setWallet(walletData);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const fetchFundCalls = async () => {
    try {
      const data = await fundCallService.getForwarderFundCalls();
      setFundCalls(data);
      setFilteredCalls(data);
    } catch (error) {
      console.error("Error fetching fund calls:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...fundCalls];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.reference.toLowerCase().includes(query) ||
          c.reason.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    setFilteredCalls(result);
  }, [searchQuery, statusFilter, fundCalls]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Conversion Logic (Simplified Fixed Rates for MVP)
      // 1 EUR = 655.957 XOF
      // 1 USD = 600 XOF (Approx)
      let amountInXOF = parseFloat(newFundCall.amount);
      if (newFundCall.currency === "EUR") {
        amountInXOF = amountInXOF * 655.957;
      } else if (newFundCall.currency === "USD") {
        amountInXOF = amountInXOF * 600;
      }

      // Validation: Check Wallet Balance
      if (wallet && amountInXOF > wallet.balance) {
        toastError(
          `Solde insuffisant. Votre solde est de ${wallet.balance.toLocaleString()} FCFA.`,
        );
        return;
      }

      await fundCallService.createFundCall({
        amount: Math.round(amountInXOF), // Store as Integer XOF
        currency: "XOF", // Always store as XOF
        reason: newFundCall.reason,
        due_date: newFundCall.due_date,
        reference: `FC-${Date.now()}`,
      });
      setIsCreateModalOpen(false);
      setNewFundCall({ amount: "", currency: "XOF", reason: "", due_date: "" });
      fetchFundCalls();
      fetchWalletAndRates(); // Refresh balance just in case
    } catch (error) {
      console.error("Error creating fund call:", error);
      toastError("Erreur lors de la création de l'appel de fonds");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Approuvé
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejeté
          </span>
        );
      case "paid":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Payé
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            En attente
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appels de Fonds"
        subtitle="Gérez vos demandes de financement"
        action={{
          label: "Nouvel Appel",
          onClick: () => setIsCreateModalOpen(true),
          icon: Plus,
          disabled: profile?.kyc_status !== "verified",
        }}
      />

      {/* KYC Warning */}
      {profile?.kyc_status !== "verified" && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-orange-800">
              Vérification KYC Requise
            </h3>
            <p className="text-sm text-orange-600 mt-1">
              Vous ne pouvez pas effectuer d'appels de fonds tant que votre
              identité n'a pas été vérifiée. Veuillez compléter votre profil
              dans les paramètres.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
            aria-label="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
            <option value="paid">Payé</option>
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
        </div>
      </div>

      {/* List */}
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
                    Référence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raison
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
                {filteredCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {call.reference}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {call.amount.toLocaleString()} {call.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 truncate max-w-[200px]">
                        {call.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(call.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(call.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === call.id ? null : call.id,
                            )
                          }
                          className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="Options"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {activeMenu === call.id && (
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
                                <Eye className="w-4 h-4" /> Voir détails
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCalls.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>Aucun appel de fonds trouvé</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Nouvel Appel de Fonds</h2>
              {wallet && (
                <p className="text-sm text-gray-500 mt-1">
                  Solde disponible :{" "}
                  <span className="font-bold text-gray-900">
                    {wallet.balance.toLocaleString()} {wallet.currency}
                  </span>
                </p>
              )}
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant
                </label>
                <input
                  type="number"
                  required
                  value={newFundCall.amount}
                  onChange={(e) =>
                    setNewFundCall({ ...newFundCall, amount: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Devise
                </label>
                <select
                  value={newFundCall.currency}
                  onChange={(e) =>
                    setNewFundCall({ ...newFundCall, currency: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  aria-label="Sélectionner la devise"
                >
                  <option value="XOF">XOF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
                {newFundCall.currency !== "XOF" && (
                  <p className="text-xs text-gray-500 mt-1">
                    Conversion automatique en XOF (1 {newFundCall.currency} ≈{" "}
                    {newFundCall.currency === "EUR" ? "655.957" : "600"} XOF)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison
                </label>
                <textarea
                  required
                  value={newFundCall.reason}
                  onChange={(e) =>
                    setNewFundCall({ ...newFundCall, reason: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Pourquoi avez-vous besoin de ces fonds ?"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date souhaitée
                </label>
                <input
                  type="date"
                  required
                  value={newFundCall.due_date}
                  onChange={(e) =>
                    setNewFundCall({ ...newFundCall, due_date: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Sélectionner la date"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
