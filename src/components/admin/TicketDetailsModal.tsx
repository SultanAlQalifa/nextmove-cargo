import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  User,
  Headphones,
  Clock,
  Tag,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import ConfirmationModal from "../common/ConfirmationModal";
import { Ticket, supportService } from "../../services/supportService";

interface TicketDetailsModalProps {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TicketDetailsModal({
  ticket,
  onClose,
  onUpdate,
}: TicketDetailsModalProps) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    action: "escalate" | null;
  }>({ isOpen: false, action: null });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      await supportService.replyToTicket(ticket.id, newMessage);
      setNewMessage("");
      onUpdate();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus: Ticket["status"]) => {
    setUpdatingStatus(true);
    try {
      await supportService.updateTicketStatus(ticket.id, newStatus);
      onUpdate();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdatingStatus(false);
    }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}
              >
                {ticket.status.replace("_", " ").toUpperCase()}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}
              >
                {ticket.priority.toUpperCase()}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(ticket.created_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {ticket.subject}
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {ticket.category}
              </span>
              {ticket.shipment_ref && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Ref: {ticket.shipment_ref}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            title="Fermer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Chat Area */}
          <div className="flex-1 flex flex-col border-r border-gray-100">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {ticket.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-4 ${msg.sender === "support" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === "support"
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600"
                      }`}
                  >
                    {msg.sender === "support" ? (
                      <Headphones className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${msg.sender === "support"
                      ? "bg-primary text-white rounded-tr-none"
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-2 ${msg.sender === "support" ? "text-white/70" : "text-gray-400"}`}
                    >
                      {new Date(msg.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-sm shadow-primary/30"
                >
                  {sending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="w-64 bg-white p-6 flex flex-col gap-6">
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                Actions
              </h4>
              <div className="space-y-2">
                {ticket.status !== "resolved" && (
                  <button
                    onClick={() => handleStatusChange("resolved")}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Marquer Résolu
                  </button>
                )}
                {ticket.status !== "closed" && (
                  <button
                    onClick={() => handleStatusChange("closed")}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium text-sm"
                  >
                    <X className="w-4 h-4" />
                    Fermer le Ticket
                  </button>
                )}
                {ticket.status === "closed" && (
                  <button
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={updatingStatus}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm"
                  >
                    <Headphones className="w-4 h-4" />
                    Rouvrir le Ticket
                  </button>
                )}
                {!ticket.is_escalated &&
                  ticket.status !== "resolved" &&
                  ticket.status !== "closed" && (
                    <button
                      onClick={() => setConfirmation({ isOpen: true, action: "escalate" })}
                      disabled={updatingStatus}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-colors font-medium text-sm mt-2 border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Escalader le Ticket
                    </button>
                  )}
              </div>
            </div>

            {/* Assignment Section */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
                Affectation
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ticket.assigned_to ? "Assigné" : "Non assigné"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {ticket.assigned_to
                        ? `ID: ${ticket.assigned_to}`
                        : "En attente"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    setUpdatingStatus(true);
                    try {
                      // Auto-assign to current user (mock ID '1' for admin)
                      await supportService.assignTicket(ticket.id, "1");
                      onUpdate();
                    } catch (error) {
                      console.error("Error assigning ticket:", error);
                    } finally {
                      setUpdatingStatus(false);
                    }
                  }}
                  disabled={updatingStatus || ticket.assigned_to === "1"}
                  className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ticket.assigned_to === "1"
                    ? "Assigné à vous"
                    : "S'auto-assigner"}
                </button>

                <div className="relative">
                  <select
                    title="Assigner un utilisateur"
                    aria-label="Assigner un utilisateur"
                    onChange={async (e) => {
                      if (e.target.value) {
                        setUpdatingStatus(true);
                        try {
                          await supportService.assignTicket(
                            ticket.id,
                            e.target.value,
                          );
                          onUpdate();
                        } catch (error) {
                          console.error("Error assigning ticket:", error);
                        } finally {
                          setUpdatingStatus(false);
                        }
                      }
                    }}
                    disabled={updatingStatus}
                    value={ticket.assigned_to || ""}
                    className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Assigner à...</option>
                    <option value="1">Admin User</option>
                    <option value="2">Support Agent</option>
                    <option value="3">Finance Manager</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-auto">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h5 className="text-sm font-bold text-blue-900 mb-1">
                  Note Interne
                </h5>
                <p className="text-xs text-blue-700">
                  Les changements de statut notifient automatiquement
                  l'utilisateur par email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, action: null })}
        onConfirm={async () => {
          if (confirmation.action === "escalate") {
            setUpdatingStatus(true);
            try {
              await supportService.escalateTicket(ticket.id);
              onUpdate();
            } catch (error) {
              console.error("Error escalating ticket:", error);
            } finally {
              setUpdatingStatus(false);
              setConfirmation({ isOpen: false, action: null });
            }
          }
        }}
        title="Escalader le ticket"
        message="Êtes-vous sûr de vouloir escalader ce ticket ? Cela le marquera comme urgent."
        variant="danger"
        confirmLabel="Escalader"
      />
    </div>
  );
}
