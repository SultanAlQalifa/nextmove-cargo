import { X, Mail, MessageSquare, Send } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { ForwarderProfile } from "../../services/forwarderService";

interface ContactForwarderModalProps {
  isOpen: boolean;
  onClose: () => void;
  forwarder: ForwarderProfile | null;
  currentUserEmail?: string;
  onSendEmail: (email: string) => void;
  onSendMessage: (
    id: string,
    subject: string,
    message: string,
  ) => Promise<void>;
}

export default function ContactForwarderModal({
  isOpen,
  onClose,
  forwarder,
  currentUserEmail,
  onSendEmail,
  onSendMessage,
}: ContactForwarderModalProps) {
  const { success } = useToast();
  if (!isOpen || !forwarder) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Contacter le transitaire
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => onSendEmail(forwarder.email)}
                className="flex-1 flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Envoyer un email
                  </h4>
                  <p className="text-sm text-gray-500">
                    Ouvrir votre client de messagerie
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(forwarder.email);
                  success("Email copié !");
                }}
                className="px-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all text-gray-500"
                title="Copier l'email"
              >
                <span className="sr-only">Copier</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>

            <button
              onClick={() => {
                onSendMessage(forwarder.id, "", "");
                onClose();
              }}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-left"
            >
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Message interne</h4>
                <p className="text-sm text-gray-500">
                  Discuter directement via le chat
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
