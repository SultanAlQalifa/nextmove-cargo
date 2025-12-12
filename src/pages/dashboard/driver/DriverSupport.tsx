import { useState } from "react";
import {
  HelpCircle,
  MessageSquare,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function DriverSupport() {
  const [activeTab, setActiveTab] = useState<"faq" | "tickets">("faq");
  const [tickets, setTickets] = useState([
    {
      id: 1,
      subject: "Problème application GPS",
      status: "open",
      date: "2024-03-10",
      lastMessage: "Le GPS ne se met pas à jour...",
    },
    {
      id: 2,
      subject: "Question sur le paiement",
      status: "closed",
      date: "2024-03-01",
      lastMessage: "Le virement a été effectué.",
    },
  ]);

  const faqs = [
    {
      q: "Comment valider une livraison ?",
      a: "Utilisez le bouton 'Capturer la localisation' puis remplissez le formulaire POD.",
    },
    {
      q: "Que faire si le client est absent ?",
      a: "Contactez le support immédiatement via l'onglet Tickets ou appelez le client.",
    },
    {
      q: "Quand suis-je payé ?",
      a: "Les paiements sont effectués chaque semaine pour les livraisons validées.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <HelpCircle className="text-primary" /> Support Chauffeur
      </h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "faq" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          FAQ
        </button>
        <button
          onClick={() => setActiveTab("tickets")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "tickets" ? "bg-primary text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
        >
          Mes Tickets
        </button>
      </div>

      {activeTab === "faq" ? (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-100"
            >
              <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-gray-900">
              Vos demandes d'assistance
            </h3>
            <button className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Nouveau Ticket
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-medium text-gray-900">
                    {ticket.subject}
                  </h4>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${ticket.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                  >
                    {ticket.status === "open" ? "Ouvert" : "Fermé"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {ticket.lastMessage}
                </p>
                <p className="text-xs text-gray-400">{ticket.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
