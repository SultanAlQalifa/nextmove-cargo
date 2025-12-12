import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  User,
  Search,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  X,
  Eye,
  UserPlus,
  Check,
  Clock,
  UserCheck,
  AlertCircle,
} from "lucide-react";
import {
  connectionService,
  UserConnection,
} from "../../../services/connectionService";
import AddClientModal from "../../../components/dashboard/AddClientModal";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";

import ClientDetailsModal from "../../../components/dashboard/forwarder/ClientDetailsModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function ForwarderClients() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<"clients" | "pending">("clients");

  // Data
  const [clients, setClients] = useState<any[]>([]); // Using any for profile object from connectionService
  const [pendingRequests, setPendingRequests] = useState<UserConnection[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);

  // Client Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "clients") {
        const data = await connectionService.getAcceptedConnections();
        setClients(data);
        setFilteredClients(data);
      } else {
        const requests = await connectionService.getPendingRequests();
        setPendingRequests(requests || []);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "clients") {
      let result = [...clients];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (c) =>
            (c.full_name?.toLowerCase() || "").includes(query) ||
            (c.email?.toLowerCase() || "").includes(query) ||
            (c.company_name?.toLowerCase() || "").includes(query),
        );
      }
      setFilteredClients(result);
    }
  }, [searchQuery, clients, activeTab]);

  const handleApprove = async (connectionId: string) => {
    try {
      await connectionService.approveRequest(connectionId);
      success("Demande acceptée !");
      fetchData(); // Refresh list
    } catch (err) {
      console.error(err);
      error("Erreur lors de l'acceptation");
    }
  };

  const handleReject = (connectionId: string) => {
    setConfirmation({ isOpen: true, id: connectionId });
  };

  const confirmReject = async () => {
    if (!confirmation.id) return;
    try {
      await connectionService.rejectRequest(confirmation.id);
      success("Demande refusée");
      fetchData();
    } catch (err) {
      console.error(err);
      error("Erreur lors du refus");
    } finally {
      setConfirmation({ isOpen: false, id: null });
    }
  };

  const handleViewDetails = (client: any) => {
    setSelectedClient(client);
    setIsDetailsOpen(true);
    setActiveMenu(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Clients & Contacts"
        subtitle="Gérez votre réseau de clients et vos demandes de connexion."
        action={{
          label: "Ajouter un Client",
          icon: UserPlus,
          onClick: () => setIsAddClientModalOpen(true),
        }}
      />

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("clients")}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === "clients"
            ? "text-primary border-b-2 border-primary"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4" />
            Clients & Contacts
            <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
              {clients.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`pb-3 px-1 text-sm font-medium transition-colors relative ${activeTab === "pending"
            ? "text-primary border-b-2 border-primary"
            : "text-gray-500 hover:text-gray-700"
            }`}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Demandes en attente
            {pendingRequests.length > 0 && (
              <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold animate-pulse">
                {pendingRequests.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === "clients" && (
        <>
          {/* Filters */}
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, email..."
                className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Clients List */}
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
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localisation
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr
                        key={client.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                              {client.avatar_url ? (
                                <img
                                  src={client.avatar_url}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <User className="h-5 w-5 text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {client.full_name || "Sans nom"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.company_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Phone className="w-3 h-3" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {client.address ||
                              client.country ||
                              "Non renseigné"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenu(
                                  activeMenu === client.id ? null : client.id,
                                )
                              }
                              aria-label="Options"
                              className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            {activeMenu === client.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() => setActiveMenu(null)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                                  <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    onClick={() => handleViewDetails(client)}
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
                    {filteredClients.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <div className="p-4 bg-gray-50 rounded-full mb-3">
                              <Search className="w-8 h-8 text-gray-400" />
                            </div>
                            <p>Aucun client trouvé</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "pending" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[300px]">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <div className="p-4 bg-gray-50 rounded-full mb-3">
                <Check className="w-8 h-8 text-gray-400" />
              </div>
              <p>Aucune demande en attente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {req.requester?.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {req.requester?.full_name || "Utilisateur inconnu"}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {req.requester?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Reçu le {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReject(req.id)}
                      className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors shadow-sm flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Accepter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(false)}
        onSuccess={() => {
          fetchData(); // Refresh list
          setIsAddClientModalOpen(false);
          success("Demande envoyée ! Le client doit maintenant l'approuver.");
        }}
      />

      {/* Client Details Modal */}
      <ClientDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        client={selectedClient}
      />
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, id: null })}
        onConfirm={confirmReject}
        title="Refuser la demande"
        message="Voulez-vous vraiment refuser cette demande de connexion ?"
        variant="danger"
        confirmLabel="Refuser"
      />
    </div>
  );
}
