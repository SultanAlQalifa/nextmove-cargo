import { AlertTriangle, X, Info, CheckCircle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info" | "success";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "warning",
  isLoading = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      case "warning":
        return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case "success":
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case "info":
      default:
        return <Info className="w-6 h-6 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "danger":
        return "bg-red-50";
      case "warning":
        return "bg-orange-50";
      case "success":
        return "bg-green-50";
      case "info":
      default:
        return "bg-blue-50";
    }
  };

  const getConfirmBtnStyle = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500";
      case "success":
        return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
      case "info":
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl flex-shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-xl shadow-sm transition-all flex items-center gap-2 ${getConfirmBtnStyle()} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
