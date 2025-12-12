import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import { POD } from "../../services/podService";

interface PODValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  pod: POD | null;
  onConfirm: (id: string, note: string) => Promise<void>;
}

export default function PODValidationModal({
  isOpen,
  onClose,
  pod,
  onConfirm,
}: PODValidationModalProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  if (!isOpen || !pod) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setLoading(true);
    try {
      await onConfirm(pod.id, note);
      onClose();
      setNote("");
    } catch (error) {
      console.error("Error validating POD:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Valider le POD
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-green-50 p-4 rounded-xl flex gap-3">
            <AlertCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Confirmation</p>
              <p className="mt-1">
                L'expédition sera marquée comme livrée. Cette action est
                irréversible.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Note de validation <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all min-h-[100px]"
              placeholder="Ajoutez une note pour cette validation..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !note.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm shadow-green-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? "Traitement..." : "Confirmer la validation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
