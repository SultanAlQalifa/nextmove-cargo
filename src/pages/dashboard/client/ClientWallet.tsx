import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useDataSync } from "../../../contexts/DataSyncContext";
import TopUpModal from "../../../components/dashboard/TopUpModal";

import { Transaction } from "../../../types/transaction";

export default function ClientWallet() {
  const { user } = useAuth();
  const { success } = useToast();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Live Sync
  useDataSync("transactions", () => fetchWalletData());
  useDataSync("profiles", () => fetchWalletData());

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Try to trigger auto-expiry (robust call)
      // We ignore errors here so the page still loads even if the RPC fails (e.g. permissions)
      try {
        await supabase.rpc("clean_old_transactions");
      } catch (rpcError) {
        console.warn(
          "Auto-expiry RPC failed (safe to ignore if permissions pending):",
          rpcError,
        );
      }

      // Fetch Balance
      const { data: walletData } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletData) {
        setBalance(Number(walletData.balance));

        // Fetch Transactions
        const { data: txData } = await supabase
          .from("transactions")
          .select("*")
          .or(`wallet_id.eq.${walletData.id},user_id.eq.${user.id}`)
          .order("created_at", { ascending: false });

        // Client-side expiry fallback: Mark old pending as failed visually if needed
        const processedTransactions = (txData || []).map((tx) => {
          if (tx.status === "pending") {
            const createdTime = new Date(tx.created_at).getTime();
            const now = Date.now();
            // If older than 3 minutes, treat as failed for display
            if (now - createdTime > 3 * 60 * 1000) {
              return { ...tx, status: "failed" };
            }
          }
          return tx;
        });

        setTransactions(processedTransactions);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Mon Portefeuille"
        subtitle="Gérez votre solde et consultez vos transactions"
        action={{
          label: "Recharger",
          onClick: () => setIsTopUpOpen(true),
          icon: CreditCard,
        }}
      />

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Wallet size={120} />
        </div>

        <div className="relative z-10">
          <p className="text-gray-400 font-medium mb-1">Solde Disponible</p>
          <h2 className="text-4xl font-bold mb-6">
            {balance.toLocaleString()} FCFA
          </h2>

          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <div className="bg-green-500/20 p-1 rounded-full">
              <ArrowDownLeft className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Dernier Dépôt</p>
              <p className="text-sm font-semibold">
                {transactions.find((t) => t.amount > 0)
                  ? `+${transactions.find((t) => t.amount > 0)?.amount.toLocaleString()} F`
                  : "--"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
            <div className="bg-red-500/20 p-1 rounded-full">
              <ArrowUpRight className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Dernière Dépense</p>
              <p className="text-sm font-semibold">
                {transactions.find((t) => t.amount < 0)
                  ? `${transactions.find((t) => t.amount < 0)?.amount.toLocaleString()} F`
                  : "--"}
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Historique des Transactions
          </h3>
          <button
            onClick={fetchWalletData}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Actualiser"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-500 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Chargement...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Aucune transaction trouvée.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                      {tx.description || "Transaction"}
                      {tx.reference_id && (
                        <span className="block text-xs text-gray-500 font-mono mt-0.5">
                          {tx.reference_id}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${tx.amount > 0 ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"}
                                            `}
                      >
                        {tx.amount > 0 ? "Crédit" : "Débit"}
                      </span>
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${tx.amount > 0
                        ? "text-green-600"
                        : "text-gray-900 dark:text-white"
                        }`}
                    >
                      {tx.amount > 0 ? "+" : ""}
                      {Number(tx.amount).toLocaleString()} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                ${tx.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : tx.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                      >
                        {tx.status === "completed"
                          ? "Succès"
                          : tx.status === "pending"
                            ? "En attente"
                            : "Échoué"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSuccess={() => {
          fetchWalletData(); // Refresh balance
        }}
      />
    </div >
  );
}
