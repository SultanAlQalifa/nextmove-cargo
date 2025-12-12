import { useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import { paymentService } from "../../services/paymentService";
import { Smartphone, X, Check, Loader2 } from "lucide-react";

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TopUpModal({
  isOpen,
  onClose,
  onSuccess,
}: TopUpModalProps) {
  const { success, error: toastError } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<
    "input" | "processing" | "success" | "error_timeout"
  >("input");
  const [lastTxId, setLastTxId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRecharge = async () => {
    const val = Number(amount);
    if (!val || val < 500) {
      toastError("Le montant minimum est de 500 FCFA");
      return;
    }

    setLoading(true);
    try {
      // 1. Init Payment
      const { wave_launch_url, transaction_id } =
        await paymentService.initializeWavePayment(val, "XOF");
      setLastTxId(transaction_id);

      // 2. Open Wave
      if (wave_launch_url) window.open(wave_launch_url, "_blank");

      setStep("processing");

      // 3. Poll
      try {
        await paymentService.verifyWavePayment(transaction_id);
        setStep("success");
        success("Rechargement effectué avec succès !");
        onSuccess();
        setTimeout(onClose, 2000);
      } catch (pollError: any) {
        // Determine if it's a timeout or hard failure
        if (pollError.message?.includes("timeout")) {
          setStep("error_timeout");
        } else {
          throw pollError;
        }
      }
    } catch (error: any) {
      console.error("Recharge failed:", error);
      toastError(error.message || "Échec du rechargement");
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!lastTxId) return;
    setLoading(true);
    try {
      await paymentService.verifyWavePayment(lastTxId);
      setStep("success");
      success("Paiement retrouvé et validé !");
      onSuccess();
      setTimeout(onClose, 2000);
    } catch (error) {
      toastError(
        "Paiement toujours en attente ou échoué. Veuillez réessayer dans quelques instants.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full overflow-hidden relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-[#1DA1F2]" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Recharger mon compte
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
            via Wave Mobile Money
          </p>

          {step === "input" && (
            <div className="space-y-4">
              <div>
                <label className="block text-left text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Montant à recharger (FCFA)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 5000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#1DA1F2] focus:ring-2 focus:ring-[#1DA1F2]/20 outline-none text-lg font-bold text-center transition-colors"
                />
              </div>

              <button
                onClick={handleRecharge}
                disabled={loading || !amount}
                className="w-full py-3.5 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Payer avec Wave
              </button>
            </div>
          )}

          {step === "processing" && (
            <div className="py-8">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1DA1F2] rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-900 dark:text-white font-medium">
                Validation du paiement...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Veuillez valider sur votre téléphone
              </p>
            </div>
          )}

          {step === "error_timeout" && (
            <div className="py-8">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-orange-600 dark:text-orange-400 animate-spin" />
              </div>
              <p className="text-gray-900 dark:text-white font-bold text-lg mb-2">
                Vérification en cours...
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                Le paiement met plus de temps que prévu. Vérifiez si vous avez
                bien validé sur votre téléphone.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleCheckStatus()}
                  disabled={loading}
                  className="w-full py-3 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-xl font-bold transition-all"
                >
                  {loading
                    ? "Vérification..."
                    : "Vérifier le statut manuellement"}
                </button>
                <button
                  onClick={() => setStep("input")}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 text-sm font-medium"
                >
                  Recommencer
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-gray-900 dark:text-white font-bold text-lg">
                Succès !
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Votre solde a été mis à jour.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
