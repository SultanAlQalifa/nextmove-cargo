import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import { supportService, Ticket, GlobalSearchResult } from "../../../services/supportService";
import {
  MessageSquare,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Box,
  FileText,
  User,
  ExternalLink,
  ChevronRight,
  Loader2
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import UnifiedFilterSegment from "../../../components/dashboard/UnifiedFilterSegment";
import TicketDetailsModal from "../../../components/admin/TicketDetailsModal";
import UserProfileModal from "../../../components/admin/UserProfileModal";
import ShipmentDetailsModal from "../../../components/admin/ShipmentDetailsModal";
import CreateUserModal from "../../../components/admin/CreateUserModal";
import { profileService } from "../../../services/profileService";
import { shipmentService } from "../../../services/shipmentService";
import { supabase } from "../../../lib/supabase";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function AdminSupport() {
  const { error: toastError } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Global Search State
  const [globalQuery, setGlobalQuery] = useState("");
  const [globalResults, setGlobalResults] = useState<GlobalSearchResult[]>([]);
  const [isGlobalSearching, setIsGlobalSearching] = useState(false);

  // Action Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (globalQuery.length >= 2) {
        setIsGlobalSearching(true);
        try {
          const results = await supportService.globalSearch(globalQuery);
          setGlobalResults(results);
        } catch (err) {
          console.error(err);
        } finally {
          setIsGlobalSearching(false);
        }
      } else {
        setGlobalResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [globalQuery]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.getAllTickets();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openActionMenuId &&
        !(event.target as Element).closest(".action-menu-trigger")
      ) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openActionMenuId]);

  const handleResultClick = async (result: GlobalSearchResult) => {
    setActionLoading(true);
    try {
      if (result.entity_type === 'user') {
        const profile = await profileService.getProfile(result.id);
        if (profile) {
          setSelectedUser({
            id: profile.id,
            name: profile.full_name || 'Utilisateur',
            email: profile.email,
            role: profile.role || 'client',
            status: (profile as any).account_status === 'suspended' ? 'Suspendu' : ((profile as any).account_status === 'inactive' ? 'Inactif' : 'Actif'),
            joined_at: (profile as any).created_at || new Date().toISOString(),
            phone: (profile as any).phone,
            company: (profile as any).company_name,
            location: (profile as any).country
          });
        }
      } else if (result.entity_type === 'shipment') {
        const shipment = await shipmentService.getShipmentById(result.id);
        if (shipment) {
          setSelectedShipment({
            id: shipment.id,
            client: shipment.client?.full_name || 'Client',
            origin: `${shipment.origin.port}, ${shipment.origin.country}`,
            destination: `${shipment.destination.port}, ${shipment.destination.country}`,
            status: shipment.status,
            created_at: shipment.created_at,
            weight: `${shipment.cargo.weight} kg`,
            type: shipment.cargo.type
          });
        }
      } else if (result.entity_type === 'ticket') {
        // Try to find in current list first
        const existing = tickets.find(t => t.id === result.id);
        if (existing) {
          setSelectedTicket(existing);
        } else {
          // Fetch explicitly
          const { data } = await supabase.from('tickets').select('*, messages:ticket_messages(*)').eq('id', result.id).single();
          if (data) {
            // Need to map db ticket to app ticket
            // Using a simplified mapping logic inline or needing a helper?
            // Ideally supportService.getTicketById should exist.
            // For now, I'll rely on the fact that admin usually loads all tickets? No, pagination/limit might hide some.
            // I will map manually as best effort
            const mapped: Ticket = {
              ...data,
              messages: data.messages || []
            };
            setSelectedTicket(mapped);
          }
        }
      }
    } catch (e) {
      console.error("Error fetching details", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (
    ticketId: string,
    status: Ticket["status"],
  ) => {
    try {
      await supportService.updateTicketStatus(ticketId, status);
      fetchTickets();
      setOpenActionMenuId(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  const handleDelete = (ticketId: string) => {
    setConfirmation({ isOpen: true, id: ticketId });
  };

  const confirmDeleteTicket = async () => {
    if (confirmation.id) {
      try {
        await supportService.deleteTicket(confirmation.id);
        fetchTickets();
        setOpenActionMenuId(null);
        setConfirmation({ isOpen: false, id: null });
      } catch (error) {
        console.error("Error deleting ticket:", error);
      }
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "all" || ticket.status === activeTab;

    // Time range filtering logic could be added here

    return matchesSearch && matchesTab;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    urgent: tickets.filter(
      (t) => t.priority === "urgent" || t.priority === "high",
    ).length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600 bg-red-50";
      case "high":
        return "text-orange-600 bg-orange-50";
      case "medium":
        return "text-blue-600 bg-blue-50";
      case "low":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & CRM"
        subtitle="Centre de contrôle tickets et recherche globale"
        action={{
          label: "Nouveau Ticket",
          onClick: () => { }, // TODO
          icon: MessageSquare,
        }}
      />

      {/* Global Search Bar */}
      <div className="mb-8 max-w-4xl mx-auto">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Rechercher tout (ServiceNow™ Style) : ID Colis, Email Client, RFQ, N° Tel..."
            className="w-full pl-14 pr-12 py-5 bg-white border-0 rounded-2xl shadow-xl shadow-primary/5 text-lg font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20 text-gray-900 transition-all"
            value={globalQuery}
            onChange={(e) => setGlobalQuery(e.target.value)}
            autoFocus
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {isGlobalSearching || actionLoading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : globalQuery.length > 0 && (
              <button onClick={() => setGlobalQuery('')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400" title="Effacer la recherche">
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Legend */}
        {globalQuery.length < 2 && (
          <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-blue-500" /> Client</span>
            <span className="flex items-center gap-1.5"><Box className="w-3 h-3 text-indigo-500" /> Colis</span>
            <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-purple-500" /> RFQ / Facture</span>
            <span className="flex items-center gap-1.5"><MessageSquare className="w-3 h-3 text-orange-500" /> Ticket</span>
          </div>
        )}
      </div>

      {/* Search Results vs Standard Dashboard */}
      {globalQuery.length >= 2 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="font-semibold text-gray-900">Résultats de recherche ({globalResults.length})</h3>
            {isGlobalSearching && <span className="text-sm text-gray-400">Recherche en cours...</span>}
          </div>

          {globalResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {globalResults.map((result) => (
                <div
                  key={`${result.entity_type}-${result.id}`}
                  onClick={() => handleResultClick(result)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg shrink-0 ${result.entity_type === 'user' ? 'bg-blue-50 text-blue-600' :
                      result.entity_type === 'shipment' ? 'bg-indigo-50 text-indigo-600' :
                        result.entity_type === 'ticket' ? 'bg-orange-50 text-orange-600' :
                          'bg-purple-50 text-purple-600'
                      }`}>
                      {result.entity_type === 'user' && <User className="w-5 h-5" />}
                      {result.entity_type === 'shipment' && <Box className="w-5 h-5" />}
                      {result.entity_type === 'ticket' && <MessageSquare className="w-5 h-5" />}
                      {result.entity_type === 'rfq' && <FileText className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-900 truncate pr-2" title={result.title}>{result.title}</p>
                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-primary transition-colors mt-1 shrink-0" />
                      </div>
                      <p className="text-sm text-gray-500 truncate mb-2" title={result.subtitle}>{result.subtitle}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs font-medium uppercase tracking-wide">
                          {result.entity_type}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-50 text-gray-500 text-xs truncate max-w-[120px]">
                          {result.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isGlobalSearching && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="inline-flex justify-center items-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">Aucun résultat trouvé</h3>
                <p className="text-sm text-gray-500 mt-1">Essayez un autre terme de recherche</p>
              </div>
            )
          )}
        </div>
      ) : (
        // ---------------- STANDARD DASHBOARD VIEW ----------------
        <>
          <UnifiedFilterSegment
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            statusFilter={activeTab}
            setStatusFilter={setActiveTab}
            statusOptions={[
              { value: "all", label: "Tous les statuts" },
              { value: "open", label: "Ouverts" },
              { value: "in_progress", label: "En Cours" },
              { value: "resolved", label: "Résolus" },
              { value: "closed", label: "Fermés" },
            ]}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  +12%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              <p className="text-sm text-gray-500">Total Tickets</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                  Action requise
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.open}</h3>
              <p className="text-sm text-gray-500">Tickets Ouverts</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  +5%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.resolved}</h3>
              <p className="text-sm text-gray-500">Tickets Résolus</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                  Prioritaire
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.urgent}</h3>
              <p className="text-sm text-gray-500">Urgents / Haute Priorité</p>
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Sujet
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Assigné à
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Chargement...
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Aucun ticket trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <MessageSquare className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {ticket.subject}
                                </p>
                                {ticket.is_escalated && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wide border border-red-200">
                                    Escaladé
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                ID: {ticket.id}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                            {ticket.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} capitalize`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} capitalize`}
                          >
                            {ticket.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {ticket.assigned_to ? (
                            <div
                              className="flex items-center gap-2"
                              title={`Assigné à ID: ${ticket.assigned_to}`}
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {ticket.assigned_to === "1"
                                  ? "AD"
                                  : ticket.assigned_to === "2"
                                    ? "SA"
                                    : "FM"}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Non assigné
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative action-menu-trigger">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenActionMenuId(
                                  openActionMenuId === ticket.id ? null : ticket.id,
                                );
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Options du ticket"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>

                            {openActionMenuId === ticket.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1 animate-fade-in">
                                <button
                                  onClick={() => {
                                    setSelectedTicket(ticket);
                                    setOpenActionMenuId(null);
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Voir détails
                                </button>
                                {ticket.status !== "resolved" && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(ticket.id, "resolved")
                                    }
                                    className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Marquer résolu
                                  </button>
                                )}
                                {ticket.status !== "closed" && (
                                  <button
                                    onClick={() =>
                                      handleStatusUpdate(ticket.id, "closed")
                                    }
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Fermer
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDelete(ticket.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>


        </>
      )}

      {/* Modals - Always Rendered */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onEdit={() => setIsEditModalOpen(true)}
          onToggleStatus={async () => {
            try {
              const newStatus = selectedUser.status === 'Actif' ? 'suspended' : 'active';
              await profileService.updateStatus(selectedUser.id, newStatus);
              // Optimistic UI Update
              setSelectedUser({ ...selectedUser, status: newStatus === 'active' ? 'Actif' : 'Suspendu' });
            } catch (e) { console.error(e); toastError("Erreur lors de la mise à jour"); }
          }}
        />
      )}

      {selectedShipment && (
        <ShipmentDetailsModal
          shipment={selectedShipment}
          onClose={() => setSelectedShipment(null)}
          onTrack={() => window.open(`/track/${selectedShipment.id}`, '_blank')}
        />
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            fetchTickets();
            const updated = tickets.find((t) => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
          }}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <CreateUserModal
          user={{
            id: selectedUser.id,
            name: selectedUser.name || selectedUser.full_name,
            email: selectedUser.email,
            role: selectedUser.role
          }}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            // Refresh logic: Update selectedUser state optimistically or re-fetch
            const { profileService } = require("../../../services/profileService");
            // Minimal refresh
            profileService.getProfile(selectedUser.id).then((fresh: any) => {
              if (fresh) {
                setSelectedUser({
                  ...selectedUser,
                  name: fresh.full_name,
                  role: fresh.role,
                  subtitle: fresh.email
                });
              }
            });
          }}
        />
      )}


      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, id: null })}
        onConfirm={confirmDeleteTicket}
        title="Supprimer le ticket"
        message="Êtes-vous sûr de vouloir supprimer ce ticket ? Cette action est irréversible."
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
