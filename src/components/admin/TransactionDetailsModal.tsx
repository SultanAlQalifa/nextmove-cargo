import {
  X,
  Download,
  CreditCard,
  Calendar,
  User,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Transaction {
  id: string;
  client: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  method: string;
}

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDownloadReceipt: (id: string) => void;
}

export default function TransactionDetailsModal({
  transaction,
  onClose,
  onDownloadReceipt,
}: TransactionDetailsModalProps) {
  if (!transaction) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Détails de la transaction
          </h3>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-sm text-gray-500">Montant Total</p>
              <p
                className={`text-2xl font-bold ${transaction.type === "Paiement" ? "text-green-600" : "text-red-600"}`}
              >
                {transaction.type === "Paiement" ? "+" : "-"}
                {new Intl.NumberFormat("fr-XO", {
                  style: "currency",
                  currency: "XOF",
                }).format(transaction.amount)}
              </p>
            </div>
            <div
              className={`p-3 rounded-full ${transaction.status === "Completed" ? "bg-green-100 text-green-600" : transaction.status === "Pending" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"}`}
            >
              {transaction.status === "Completed" ? (
                <CheckCircle className="w-6 h-6" />
              ) : transaction.status === "Pending" ? (
                <Clock className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">ID Transaction</p>
                <p className="text-sm font-medium text-gray-900">
                  {transaction.id}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900">
                  {transaction.client}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(transaction.date).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CreditCard className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Méthode de paiement</p>
                <p className="text-sm font-medium text-gray-900">
                  {transaction.method}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={() => onDownloadReceipt(transaction.id)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm shadow-primary/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Télécharger le reçu
          </button>
        </div>
      </div>
    </div>
  );
}
