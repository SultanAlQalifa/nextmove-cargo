import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import ShipmentDetailsModal from "../../../components/admin/ShipmentDetailsModal";
import TrackingDetailsModal from "../../../components/admin/TrackingDetailsModal";
import ShipmentInvoiceModal from "../../../components/admin/ShipmentInvoiceModal";
import { MessageCircle } from "lucide-react"; // Add icon import
import {
  Package,
  Search,
  Filter,
  Calendar,
  X,
  Truck,
  CheckCircle,
  Clock,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  FileText,
} from "lucide-react";
import { shipmentService } from "../../../services/shipmentService";
import { useToast } from "../../../contexts/ToastContext";

export default function AdminShipments() {
  const { error: toastError } = useToast();
  const [shipments, setShipments] = useState<any[]>([]);
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
  const [filteredShipments, setFilteredShipments] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [showTrackingForShipment, setShowTrackingForShipment] = useState<
    string | null
  >(null);
  const [showInvoiceForShipment, setShowInvoiceForShipment] = useState<
    string | null
  >(null);

  // Status Update State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedShipmentForStatus, setSelectedShipmentForStatus] =
    useState<any>(null);
  const [newStatus, setNewStatus] = useState("");

  // Stats State
  const [stats, setStats] = useState({
    total: { value: 0, trend: "+0%", trendUp: true },
    inTransit: { value: 0, trend: "+0%", trendUp: true },
    delivered: { value: 0, trend: "+0%", trendUp: true },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await shipmentService.getAllShipments();

      // Format data for display
      const formattedShipments = data.map((s) => ({
        id: s.tracking_number || s.id,
        client: s.client?.full_name || "Client",
        clientPhone: s.client?.phone,
        origin: `${s.origin.port}, ${s.origin.country}`,
        destination: `${s.destination.port}, ${s.destination.country}`,
        status:
          s.status === "in_transit"
            ? "En transit"
            : s.status === "delivered"
              ? "Livré"
              : s.status === "pending"
                ? "En attente"
                : s.status,
        rawStatus: s.status, // Keep raw status for logic
        created_at: s.created_at || new Date().toISOString(),
        weight: `${s.cargo.weight} kg`,
        type: s.transport_mode === "air" ? "Aérien" : "Maritime",
      }));

      setShipments(formattedShipments);
      setFilteredShipments(formattedShipments);
    } catch (error) {
      console.error("Error fetching shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (
      normalizedStatus.includes("livré") ||
      normalizedStatus.includes("delivered")
    ) {
      return "bg-green-100 text-green-800";
    } else if (normalizedStatus.includes("transit")) {
      return "bg-blue-100 text-blue-800";
    } else if (
      normalizedStatus.includes("attente") ||
      normalizedStatus.includes("pending")
    ) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  const handleStatusUpdate = () => {
    if (!selectedShipmentForStatus) return;

    // In a real app, call service to update status
    // await shipmentService.updateStatus(selectedShipmentForStatus.id, newStatus);

    const updatedShipments = filteredShipments.map((s) =>
      s.id === selectedShipmentForStatus.id ? { ...s, status: newStatus } : s,
    );

    setFilteredShipments(updatedShipments);
    setIsStatusModalOpen(false);
    setSelectedShipmentForStatus(null);
  };

  const handleWhatsAppNotify = (shipment: any) => {
    if (!shipment.clientPhone) {
      toastError("Numéro de téléphone du client non disponible.");
      return;
    }
    const message = `Bonjour ${shipment.client}, votre colis ${shipment.id} est actuellement : ${shipment.status}. Suivez votre livraison sur notre plateforme.`;
    const url = `https://wa.me/${shipment.clientPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  // Apply Filters
  useEffect(() => {
    let result = [...shipments];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.id.toLowerCase().includes(query) ||
          s.client.toLowerCase().includes(query) ||
          s.destination.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
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
        result = result.filter((s) => new Date(s.created_at) >= limitDate);
      }
    }

    setFilteredShipments(result);

    // Update Stats
    setStats({
      total: {
        value: result.length,
        trend: "+0%",
        trendUp: true,
      },
      inTransit: {
        value: result.filter((s) => s.status === "En transit").length,
        trend: "+0%",
        trendUp: true,
      },
      delivered: {
        value: result.filter((s) => s.status === "Livré").length,
        trend: "+0%",
        trendUp: true,
      },
    });
  }, [searchQuery, timeRange, customDateRange, statusFilter, shipments]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Expéditions"
        subtitle="Supervision globale de toutes les expéditions"
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrer par statut"
            title="Filtrer par statut"
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="En transit">En transit</option>
            <option value="En attente">En attente</option>
            <option value="Livré">Livré</option>
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
              aria-label="Date de début"
              placeholder="Date de début"
              title="Date de début"
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange({ ...customDateRange, end: e.target.value })
              }
              aria-label="Date de fin"
              placeholder="Date de fin"
              title="Date de fin"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par N° de suivi..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
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
              <Package className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.total.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.total.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.total.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            Total Expéditions
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.total.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.inTransit.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.inTransit.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.inTransit.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">En Transit</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.inTransit.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.delivered.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.delivered.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.delivered.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Livrées</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.delivered.value}
          </p>
        </div>
      </div>

      {/* Shipment List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Suivi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
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
            {filteredShipments.map((shipment) => (
              <tr
                key={shipment.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-gray-900">
                      {shipment.id}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 ml-6">
                    {shipment.type} • {shipment.weight}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {shipment.client}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{shipment.origin.split(",")[0]}</span>
                    <span className="text-gray-400">→</span>
                    <span>{shipment.destination.split(",")[0]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(shipment.status)}`}
                  >
                    {shipment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(shipment.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenu(
                          activeMenu === shipment.id ? null : shipment.id,
                        )
                      }
                      aria-label="Plus d'options"
                      title="Plus d'options"
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenu === shipment.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenu(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                          <button
                            onClick={() => {
                              setSelectedShipment(shipment);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> Voir détails
                          </button>
                          <button
                            onClick={() => {
                              setShowInvoiceForShipment(shipment.id);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> Voir Facture
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShipmentForStatus(shipment);
                              setNewStatus(shipment.status);
                              setIsStatusModalOpen(true);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Truck className="w-4 h-4" /> Mettre à jour
                          </button>
                          <button
                            onClick={() => {
                              handleWhatsAppNotify(shipment);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                          >
                            <MessageCircle className="w-4 h-4" /> Notifier
                            (WhatsApp)
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredShipments.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Aucune expédition trouvée</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedShipment && (
        <ShipmentDetailsModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onTrack={() => {
            setShowTrackingForShipment(selectedShipment.id);
            setSelectedShipment(null);
          }}
        />
      )}

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedShipmentForStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Mettre à jour le statut
              </h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                aria-label="Fermer la modale"
                title="Fermer la modale"
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau statut pour {selectedShipmentForStatus.id}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  aria-label="Sélectionner le nouveau statut"
                  title="Sélectionner le nouveau statut"
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="En attente">En attente</option>
                  <option value="En transit">En transit</option>
                  <option value="Livré">Livré</option>
                </select>
              </div>

              <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm">
                <p>
                  Le client sera automatiquement notifié du changement de
                  statut.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm shadow-primary/20 transition-all"
              >
                Mettre à jour
              </button>
            </div>
          </div>
        </div>
      )}

      {showTrackingForShipment && (
        <TrackingDetailsModal
          shipmentId={showTrackingForShipment}
          status={
            shipments.find((s) => s.id === showTrackingForShipment)
              ?.rawStatus || "pending"
          }
          onClose={() => setShowTrackingForShipment(null)}
          onViewDetails={() => {
            setShowInvoiceForShipment(showTrackingForShipment);
            setShowTrackingForShipment(null);
          }}
        />
      )}

      {showInvoiceForShipment && (
        <ShipmentInvoiceModal
          shipment={shipments.find((s) => s.id === showInvoiceForShipment)}
          onClose={() => setShowInvoiceForShipment(null)}
        />
      )}
    </div>
  );
}
