import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CreditCard,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { useDataSync } from "../../../contexts/DataSyncContext";
import TopUpModal from "../../../components/dashboard/TopUpModal";

import { Transaction } from "../../../types/transaction";

export default function ClientWallet() {
  const { user } = useAuth();
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

      {/* Fintech Holographic Wallet Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl shadow-indigo-500/20 group"
      >
        {/* Holographic Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-black z-0"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/30 rounded-full blur-3xl group-hover:bg-primary/40 transition-colors z-0 duration-700"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-indigo-300" />
              <p className="text-indigo-200 font-medium uppercase tracking-widest text-sm">NextMove Card</p>
            </div>
            <p className="text-slate-400 font-medium mb-1 mt-6">Solde Disponible</p>
            <h2 className="text-5xl font-black tracking-tight [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
              {balance.toLocaleString()} <span className="text-2xl text-slate-400 font-medium tracking-normal">FCFA</span>
            </h2>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 bg-white/10 border border-white/5 px-4 py-3 rounded-2xl backdrop-blur-md flex-1 md:flex-none hover:bg-white/20 transition-colors shadow-lg">
              <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 shadow-inner">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-medium">Dernier Dépôt</p>
                <p className="text-sm font-black text-white">
                  {transactions.find((t) => t.amount > 0)
                    ? `+${transactions.find((t) => t.amount > 0)?.amount.toLocaleString()} F`
                    : "--"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 border border-white/5 px-4 py-3 rounded-2xl backdrop-blur-md flex-1 md:flex-none hover:bg-white/20 transition-colors shadow-lg">
              <div className="bg-rose-500/20 p-2 rounded-xl text-rose-400 shadow-inner">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-medium">Dernière Dépense</p>
                <p className="text-sm font-black text-white">
                  {transactions.find((t) => t.amount < 0)
                    ? `${transactions.find((t) => t.amount < 0)?.amount.toLocaleString()} F`
                    : "--"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>


      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 dark:bg-slate-900/90 rounded-3xl border border-slate-200/50 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none backdrop-blur-xl overflow-visible"
      >
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-3xl backdrop-blur-md">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" /> Historique des Transactions
          </h3>
          <button
            onClick={fetchWalletData}
            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all shadow-sm border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800"
            title="Actualiser"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-600 dark:text-slate-300 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-10">
                  Transaction
                </th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Type
                </th>
                <th className="px-6 py-4 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Montant
                </th>
                <th className="px-6 py-4 text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <AnimatePresence>
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-500 font-bold"
                    >
                      Chargement protégé...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-slate-400 font-medium"
                    >
                      Aucune transaction récente.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx, idx) => (
                    <motion.tr
                      key={tx.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform ${tx.amount > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"}`}>
                            {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {tx.description || "Transaction"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(tx.created_at).toLocaleString()}
                              {tx.reference_id && (
                                <>
                                  <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                  <span className="font-mono text-xs">{tx.reference_id}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm
                          ${tx.amount > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 shadow-emerald-500/10" : "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 shadow-slate-500/10"}
                        `}
                        >
                          {tx.amount > 0 ? "Crédit" : "Débit"}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-right ${tx.amount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-900 dark:text-white"
                          }`}
                      >
                        <span className="text-lg font-black tracking-tight flex justify-end items-center gap-1.5">
                          {tx.amount > 0 ? "+" : ""}
                          {Number(tx.amount).toLocaleString()} <span className="text-xs font-bold text-slate-400">FCFA</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm
                          ${tx.status === "completed"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shadow-emerald-500/10"
                              : tx.status === "pending"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 shadow-amber-500/10"
                                : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 shadow-rose-500/10"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-emerald-500' : tx.status === 'pending' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500'}`}></span>
                          {tx.status === "completed"
                            ? "Succès"
                            : tx.status === "pending"
                              ? "En attente"
                              : "Échoué"}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

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
