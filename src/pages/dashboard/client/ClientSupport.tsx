import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  MessageCircle,
  Plus,
  Search,
  HelpCircle,
  FileText,
  Phone,
} from "lucide-react";
import { supportService, Ticket } from "../../../services/supportService";
import TicketList from "../../../components/support/TicketList";
import CreateTicketModal from "../../../components/support/CreateTicketModal";

export default function ClientSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const data = await supportService.getClientTickets();
      setTickets(data);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (ticketData: any) => {
    try {
      await supportService.createTicket(ticketData);
      await loadTickets();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating ticket:", error);
    }
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Support Client"
        subtitle="Besoin d'aide ? Notre équipe est là pour vous."
        action={{
          label: "Nouveau Ticket",
          onClick: () => setIsCreateModalOpen(true),
          icon: Plus,
        }}
      />

      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <HelpCircle className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">FAQ</h3>
          <p className="text-sm text-gray-500">
            Consultez nos questions fréquentes pour des réponses rapides.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Documentation</h3>
          <p className="text-sm text-gray-500">
            Guides détaillés sur l'utilisation de la plateforme.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <Phone className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Contact Direct</h3>
          <p className="text-sm text-gray-500">
            Appelez-nous directement pour les urgences.
          </p>
        </div>
      </div>

      {/* Tickets Section */}
      <div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-gray-900">Vos Tickets</h2>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-gray-100 rounded-2xl animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredTickets.length > 0 ? (
          <TicketList tickets={filteredTickets} />
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Aucun ticket</h3>
            <p className="text-gray-500 mt-1">
              Vous n'avez pas encore créé de ticket de support.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 text-primary font-medium hover:underline"
            >
              Créer mon premier ticket
            </button>
          </div>
        )}
      </div>

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
}
