
import { useState } from "react";
import { X, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { FundCall } from "../../services/fundCallService";

export interface ApprovalDetails {
  note?: string;
  transactionId?: string;
}

interface FundCallApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundCall: FundCall | null;
  requesterBalance?: { amount: number; currency: string } | null;
  onConfirm: (id: string, details: ApprovalDetails) => void;
}

export default function FundCallApprovalModal({ isOpen, onClose, fundCall, requesterBalance, onConfirm }: FundCallApprovalModalProps) {
  const [note, setNote] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [confirmText, setConfirmText] = useState(""); // For High Value

  if (!isOpen || !fundCall) return null;

  const isHighValue = fundCall.amount >= 1000000;
  const isWithdrawal = fundCall.type === 'withdrawal';
  const hasInsufficientFunds = isWithdrawal && requesterBalance ? fundCall.amount > requesterBalance.amount : false;
  const canSubmit = (isHighValue ? confirmText === "CONFIRMER" : true) && !hasInsufficientFunds;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(fundCall.id, { note, transactionId });
    setNote("");
    setTransactionId("");
    setConfirmText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden border-2 ${isHighValue ? "border-amber-500" : isWithdrawal ? "border-purple-500" : "border-transparent"}`}>

        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${isHighValue ? "bg-amber-50 border-amber-100" : isWithdrawal ? "bg-purple-50 border-purple-100" : "border-gray-100"}`}>
          <h3 className={`font-bold flex items-center gap-2 ${isHighValue ? "text-amber-800" : isWithdrawal ? "text-purple-900" : "text-gray-900"}`}>
            {isHighValue ? <AlertTriangle className="w-5 h-5 text-amber-600" /> : <CheckCircle className={`w-5 h-5 ${isWithdrawal ? "text-purple-600" : "text-green-600"}`} />}
            {isHighValue ? "Approbation Haute Valeur" : isWithdrawal ? "Valider le Décaissement" : "Approuver le Financement"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" title="Fermer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Summary */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Montant :</span>
              <span className="font-bold text-gray-900">{fundCall.amount.toLocaleString()} {fundCall.currency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Demandeur :</span>
              <span className="font-medium text-gray-900">{fundCall.requester.name}</span>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type :</span>
                <span className={`font-medium ${fundCall.type === 'withdrawal' ? 'text-purple-700' : 'text-blue-700'}`}>
                  {fundCall.type === 'withdrawal' ? 'Retrait (Décaissement)' : 'Financement (Crédit)'}
                </span>
              </div>
            </div>
            {requesterBalance && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100 mt-2">
                <span className="text-gray-500">Solde Disponible :</span>
                <span className={`font-bold ${fundCall.type === 'withdrawal' && fundCall.amount > requesterBalance.amount ? "text-red-600" : "text-gray-900"}`}>
                  {requesterBalance.amount.toLocaleString()} {requesterBalance.currency}
                </span>
              </div>
            )}
          </div>

          {fundCall.type === 'withdrawal' && requesterBalance && fundCall.amount > requesterBalance.amount && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                <strong>Solde Insuffisant :</strong> Le demandeur ne dispose pas des fonds nécessaires pour ce retrait.
                L'approbation est bloquée.
              </p>
            </div>
          )}

          {isHighValue && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex gap-3 items-start">
              <ShieldCheck className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">
                <strong>Attention sécurité :</strong> Ce montant dépasse le seuil de 1 000 000 FCFA.
                Veuillez vérifier minutieusement les justificatifs avant de valider.
              </p>
            </div>
          )}

          {/* Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Transaction Bancaire (Optionnel)
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder="Ex: WIRE-2024-..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note interne (Privé)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
              placeholder="Ajoutez une note pour l'équipe..."
            />
          </div>

          {/* High Value Confirmation Input */}
          {isHighValue && (
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-1">
                Confirmer l'action
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-amber-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all placeholder:text-gray-300"
                placeholder='Tapez "CONFIRMER"'
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2
                                ${canSubmit
                  ? (isHighValue ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" : isWithdrawal ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20" : "bg-primary hover:bg-primary/90 shadow-primary/30")
                  : "bg-gray-300 cursor-not-allowed shadow-none"
                }`}
            >
              {isHighValue ? <ShieldCheck className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {isHighValue ? "Sécuriser & Confirmer" : isWithdrawal ? "Valider le Retrait" : "Approuver le Crédit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
