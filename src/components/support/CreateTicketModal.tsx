import { useState } from "react";
import { X, AlertCircle, Loader2, Clock, ShieldCheck } from "lucide-react";
import { supportService } from "../../services/supportService";
import { useSubscription } from "../../hooks/useSubscription";

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSubmit?: (data: any) => Promise<void>; // Added for compatibility
}

export default function CreateTicketModal({
  isOpen,
  onClose,
  onSuccess,
  onSubmit
}: CreateTicketModalProps) {
  const { isPro, isElite } = useSubscription();

  const [subject, setSubject] = useState("");
  // Priority is now automatic
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Derive SLA Info
  const getSlaInfo = () => {
    if (isElite) return { time: "4-6h", label: "Support Urgent", color: "text-purple-600 bg-purple-50 border-purple-100" };
    if (isPro) return { time: "24h", label: "Support Prioritaire", color: "text-blue-600 bg-blue-50 border-blue-100" };
    return { time: "48h", label: "Support Standard", color: "text-gray-600 bg-gray-50 border-gray-200" };
  };

  const sla = getSlaInfo();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const ticketData = {
        subject,
        // Priority is auto-assigned by backend trigger based on plan
        category: category as any,
        messages: [
          {
            id: "temp",
            sender: "user" as const,
            content: description,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      if (onSubmit) {
        await onSubmit(ticketData);
      } else {
        await supportService.createTicket(ticketData as any);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating ticket:", err);
      setError(
        err.message || "Une erreur est survenue lors de la création du ticket",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg leading-6 font-bold text-gray-900">
                Nouveau Ticket de Support
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 transition-colors"
                title="Fermer"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* SLA Info Banner */}
              <div className={`p-4 rounded-lg border flex items-center gap-3 ${sla.color}`}>
                <div className="p-2 bg-white/50 rounded-full">
                  {isElite || isPro ? <ShieldCheck className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">{sla.label}</p>
                  <p className="text-xs opacity-90">
                    Réponse garantie sous <strong>{sla.time}</strong> ouvrées
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sujet
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ex: Problème de facturation"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Catégorie
                </label>
                <select
                  id="category"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  aria-label="Sélectionner une catégorie"
                >
                  <option value="other">Autre demande</option>
                  <option value="technical">Problème Technique</option>
                  <option value="billing">Facturation</option>
                  <option value="shipment">Expédition / Logistique</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description détaillée
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  placeholder="Décrivez votre problème en détail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    "Soumettre le ticket"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
