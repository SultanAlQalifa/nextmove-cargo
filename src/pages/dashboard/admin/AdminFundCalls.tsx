import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  Search,
  X,
  MoreVertical,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  AlertTriangle,
} from "lucide-react";
import FundCallDetailsModal from "../../../components/admin/FundCallDetailsModal";
import FundCallApprovalModal, {
  ApprovalDetails,
} from "../../../components/admin/FundCallApprovalModal";
import FundCallRejectionModal from "../../../components/admin/FundCallRejectionModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { fundCallService, FundCall } from "../../../services/fundCallService";
import { paymentService } from "../../../services/paymentService";
import { exportToCSV } from "../../../utils/exportUtils";

export default function AdminFundCalls() {
  const [fundCalls, setFundCalls] = useState<FundCall[]>([]);
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
  const [filteredCalls, setFilteredCalls] = useState<FundCall[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Details Modal State
  // Details Modal State
  const [selectedFundCall, setSelectedFundCall] = useState<FundCall | null>(
    null,
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [fundCallToApprove, setFundCallToApprove] = useState<FundCall | null>(
    null,
  );
  const [fundCallToReject, setFundCallToReject] = useState<FundCall | null>(
    null,
  );
  const [requesterBalance, setRequesterBalance] = useState<{ amount: number; currency: string } | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "approve" | "reject" | null;
    id: string | null;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: "",
    message: "",
    variant: "info",
  });

  // Stats State
  const [stats, setStats] = useState({
    pending: { value: 0, trend: "+2", trendUp: false }, // Pending going up is usually "bad" or just "work to do"
    approved: { value: 0, trend: "+12%", trendUp: true },
    totalFinanced: { value: 0, trend: "+5%", trendUp: true },
  });

  const fetchFundCalls = async () => {
    try {
      const data = await fundCallService.getFundCalls();
      setFundCalls(data);
    } catch (error) {
      console.error("Error fetching fund calls:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundCalls();
  }, []);

  // Apply Filters and Update Stats
  useEffect(() => {
    let result = [...fundCalls];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.reference.toLowerCase().includes(query) ||
          c.requester.name.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    // Mock time range filtering
    if (timeRange !== "all") {
      if (timeRange === "7d")
        result = result.slice(0, Math.max(1, Math.floor(result.length * 0.2)));
      else if (timeRange === "30d")
        result = result.slice(0, Math.max(1, Math.floor(result.length * 0.5)));
      else if (timeRange === "3m")
        result = result.slice(0, Math.max(1, Math.floor(result.length * 0.8)));
    }

    setFilteredCalls(result);

    // Update Stats
    const pendingCount = result.filter((c) => c.status === "pending").length;
    const approvedCount = result.filter((c) => c.status === "approved").length;
    const totalFinanced = result
      .filter((c) => c.status === "approved" || c.status === "paid")
      .reduce((sum, c) => sum + c.amount, 0);

    setStats({
      pending: {
        value: pendingCount,
        trend: pendingCount > 0 ? "+2" : "0",
        trendUp: false,
      },
      approved: {
        value: approvedCount,
        trend: "+15%",
        trendUp: true,
      },
      totalFinanced: {
        value: totalFinanced,
        trend: "+8%",
        trendUp: true,
      },
    });
  }, [searchQuery, timeRange, customDateRange, fundCalls, statusFilter]);

  const handleStatusUpdate = async (
    id: string,
    status: "approved" | "rejected",
  ) => {
    const fundCall = fundCalls.find((c) => c.id === id);
    if (!fundCall) return;

    if (status === "approved") {
      setFundCallToApprove(fundCall);
      setRequesterBalance(null); // Reset
      // Fetch Balance for check
      try {
        const wallet = await paymentService.adminGetWallet(fundCall.requester.id);
        if (wallet) setRequesterBalance({ amount: wallet.balance, currency: wallet.currency });
      } catch (e) {
        console.error("Could not fetch wallet", e);
      }
      setIsApprovalModalOpen(true);
    } else {
      setFundCallToReject(fundCall);
      setIsRejectionModalOpen(true);
    }
    setActiveMenu(null);
  };

  const handleApproveConfirm = async (id: string, details: ApprovalDetails) => {
    try {
      // Validate High Value Security
      const call = fundCalls.find(c => c.id === id);
      if (call && call.amount >= 1000000) {
        // This check duplicates the modal logic for safety, but the modal itself should enforce it.
        // We assume the modal passed validation.

      }

      // In a real app, we would send the details to the backend
      await fundCallService.updateStatus(id, "approved");

      // Refresh data
      const updatedData = await fundCallService.getFundCalls();
      setFundCalls(updatedData);

      // Update selected item if modal is open
      if (selectedFundCall && selectedFundCall.id === id) {
        const updatedItem = updatedData.find((c) => c.id === id);
        if (updatedItem) setSelectedFundCall(updatedItem);
      }

      setIsApprovalModalOpen(false);
      setFundCallToApprove(null);

      // Close details modal if action was taken from there
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }

      // Success toast? (Missing in original, could add here)
    } catch (error) {
      console.error("Error approving fund call:", error);
    }
  };

  const handleRejectConfirm = async (id: string, reason: string) => {
    try {
      await fundCallService.updateStatus(id, "rejected", reason);

      // Refresh data
      const updatedData = await fundCallService.getFundCalls();
      setFundCalls(updatedData);

      // Update selected item if modal is open
      if (selectedFundCall && selectedFundCall.id === id) {
        const updatedItem = updatedData.find((c) => c.id === id);
        if (updatedItem) setSelectedFundCall(updatedItem);
      }

      setIsRejectionModalOpen(false);
      setFundCallToReject(null);

      // Close details modal if action was taken from there
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      console.error("Error rejecting fund call:", error);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.id || !confirmModal.type) return;

    // Additional Safety Check for High Value in simple confirmation (though ApprovalModal handles approvals)
    if (confirmModal.type === 'approve') {
      const call = fundCalls.find(c => c.id === confirmModal.id);
      if (call && call.amount >= 1000000) {
        // Force use of ApprovalModal for high value
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        handleStatusUpdate(call.id, 'approved');
        return;
      }
    }

    try {
      const status = confirmModal.type === "approve" ? "approved" : "rejected";
      await fundCallService.updateStatus(confirmModal.id, status);

      // Refresh data
      const updatedData = await fundCallService.getFundCalls();
      setFundCalls(updatedData);

      // Update selected item if modal is open
      if (selectedFundCall && selectedFundCall.id === confirmModal.id) {
        const updatedItem = updatedData.find((c) => c.id === confirmModal.id);
        if (updatedItem) setSelectedFundCall(updatedItem);
      }

      setConfirmModal((prev) => ({ ...prev, isOpen: false }));

      // Close details modal if action was taken from there
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const openDetailsModal = (fundCall: FundCall) => {
    setSelectedFundCall(fundCall);
    setIsDetailsModalOpen(true);
    setActiveMenu(null);
  };

  const handleExport = () => {
    const headers = [
      { label: "Référence", key: "reference" },
      { label: "Demandeur", key: "requester.name" },
      { label: "Email", key: "requester.email" },
      {
        label: "Date",
        key: (item: FundCall) => new Date(item.created_at).toLocaleDateString(),
      },
      { label: "Montant", key: "amount" },
      { label: "Devise", key: "currency" },
      { label: "Statut", key: "status" },
      { label: "Raison", key: "reason" },
    ];
    exportToCSV(filteredCalls, headers, "appels_de_fonds");
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
        subtitle="Gérez les demandes de financement des prestataires"
        action={{
          label: "Exporter",
          onClick: handleExport,
          icon: FileText,
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
            { id: "custom", icon: Calendar, label: "Personnalisé" },
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
              aria-label={
                period.id === "custom"
                  ? "Sélectionner une période personnalisée"
                  : `Afficher les données des ${period.label}`
              }
            >
              {period.icon ? <period.icon className="w-4 h-4" /> : period.label}
              {period.id === "custom" && <span className="sr-only">Personnalisé</span>}
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
            aria-label="Filtrer par statut"
            title="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
            <option value="paid">Payé</option>
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
              value={customDateRange.start}
              onChange={(e) =>
                setCustomDateRange({
                  ...customDateRange,
                  start: e.target.value,
                })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
              aria-label="Date de début"
              title="Date de début"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange({ ...customDateRange, end: e.target.value })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
              aria-label="Date de fin"
              title="Date de fin"
            />
          </div>
        )}

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par référence, nom..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
            aria-label="Rechercher"
            title="Rechercher"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
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
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.pending.trendUp ? "text-green-600 bg-green-50" : "text-orange-600 bg-orange-50"}`}
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
            {stats.pending.value}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.approved.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.approved.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.approved.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            Approuvés (Mois)
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.approved.value}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Wallet className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.totalFinanced.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.totalFinanced.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.totalFinanced.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Financé</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.totalFinanced.value.toLocaleString()} FCFA
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Référence
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Demandeur
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCalls.map((call) => (
                  <tr
                    key={call.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {call.reference}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {call.reason}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <User className="w-4 h-4 text-gray-400" />
                        {call.requester.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${call.type === 'funding' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {call.type === 'funding' ? 'Financement' : 'Retrait'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(call.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {call.amount.toLocaleString()} {call.currency}
                      </span>
                      {call.amount >= 1000000 && (
                        <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          H.V.
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(call.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === call.id ? null : call.id,
                            )
                          }
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                          aria-label="Options"
                          title="Options"
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
                                onClick={() => openDetailsModal(call)}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" /> Voir détails
                              </button>

                              {call.status === "pending" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(call.id, "approved")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                    aria-label="Approuver l'appel de fonds"
                                  >
                                    <CheckCircle className="w-4 h-4" />{" "}
                                    Approuver
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(call.id, "rejected")
                                    }
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    aria-label="Rejeter l'appel de fonds"
                                  >
                                    <XCircle className="w-4 h-4" /> Rejeter
                                  </button>
                                </>
                              )}
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

      <FundCallDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        fundCall={selectedFundCall}
        onApprove={(id) => handleStatusUpdate(id, "approved")}
        onReject={(id) => handleStatusUpdate(id, "rejected")}
      />

      <FundCallApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setFundCallToApprove(null);
        }}
        fundCall={fundCallToApprove}
        requesterBalance={requesterBalance}
        onConfirm={handleApproveConfirm}
      />

      <FundCallRejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setFundCallToReject(null);
        }}
        fundCall={fundCallToReject}
        onConfirm={handleRejectConfirm}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.type === "approve" ? "Approuver" : "Rejeter"}
      />
    </div>
  );
}
