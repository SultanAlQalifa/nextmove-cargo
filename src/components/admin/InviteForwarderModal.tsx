import { useState } from "react";
import { X, Mail, Send } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { forwarderService } from "../../services/forwarderService";

interface InviteForwarderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteForwarderModal({
  isOpen,
  onClose,
}: InviteForwarderModalProps) {
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forwarderService.inviteForwarder(email);
      success(`Invitation envoyée à ${email}`);
      setEmail("");
      onClose();
    } catch (error) {
      console.error("Error inviting forwarder:", error);
      toastError("Erreur lors de l'envoi de l'invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            Inviter un Prestataire
          </h2>
          <button
            onClick={onClose}
            title="Fermer"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-xl flex gap-3 items-start">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                Invitation par email
              </h3>
              <p className="text-xs text-blue-700 mt-1">
                Le prestataire recevra un email contenant un lien sécurisé pour
                créer son compte et soumettre ses documents.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="contact@transport.com"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer l'invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
