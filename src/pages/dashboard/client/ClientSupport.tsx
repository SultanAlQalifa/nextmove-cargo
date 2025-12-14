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
import { useSubscription } from "../../../hooks/useSubscription";
import { Link } from "react-router-dom";
import { supportService, Ticket } from "../../../services/supportService";
import TicketList from "../../../components/support/TicketList";
import CreateTicketModal from "../../../components/support/CreateTicketModal";
import Chatbot from "../../../components/support/Chatbot";

export default function ClientSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { isStarter, isPro, isElite } = useSubscription();

  const supportConfig = {
    starter: {
      sla: '48h ouvrées',
      badge: 'Support Standard',
      badgeColor: 'bg-gray-200 text-gray-700',
      priority: 'normal',
      channels: ['Email']
    },
    pro: {
      sla: '24h ouvrées',
      badge: 'Support Prioritaire',
      badgeColor: 'bg-blue-100 text-blue-700',
      priority: 'high',
      channels: ['Email', 'Téléphone']
    },
    enterprise: {
      sla: '4h ouvrées',
      badge: 'Support Premium',
      badgeColor: 'bg-purple-100 text-purple-700',
      priority: 'critical',
      channels: ['Email', 'Téléphone', 'Chat Direct']
    }
  };

  const currentPlan = isElite ? 'enterprise' : (isPro ? 'pro' : 'starter');
  const config = supportConfig[currentPlan];

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

  // Modal handles submission internally, just refresh on success
  const handleTicketCreated = async () => {
    await loadTickets();
    setIsCreateModalOpen(false);
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

      {/* Dynamic SLA Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Niveau de Support</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.badgeColor
            }`}>
            {config.badge}
          </span>
        </div>

        <div className="flex items-center text-gray-600 dark:text-gray-300 mb-6">
          <HelpCircle className="w-5 h-5 mr-2" />
          <span>Temps de réponse garanti : <strong>{config.sla}</strong></span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {config.channels.includes('Email') && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50">
              <FileText className="w-6 h-6 mb-2 text-blue-500" />
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-sm text-gray-500">support@nextmovecargo.com</p>
            </div>
          )}

          {config.channels.includes('Téléphone') && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50">
              <Phone className="w-6 h-6 mb-2 text-green-500" />
              <h3 className="font-semibold mb-1">Téléphone</h3>
              <p className="text-sm text-gray-500">+33 1 23 45 67 89</p>
            </div>
          )}

          {config.channels.includes('Chat Direct') && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50">
              <MessageCircle className="w-6 h-6 mb-2 text-purple-500" />
              <h3 className="font-semibold mb-1">Chat Direct</h3>
              <span className="text-sm text-purple-600 underline cursor-pointer">Démarrer</span>
            </div>
          )}
        </div>

        {isStarter && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Besoin d'une réponse plus rapide ? Le plan Pro offre un support prioritaire.
            </p>
            <Link
              to="/subscription/plans"
              className="text-blue-600 font-medium underline mt-2 inline-block text-sm"
            >
              Découvrir le plan Pro →
            </Link>
          </div>
        )}
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
        onSuccess={handleTicketCreated}
      />

      {/* AI Assistant */}
      <Chatbot />
    </div>
  );
}
