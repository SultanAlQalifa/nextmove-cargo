import React from "react";
import {
    Layers,
    PlusCircle,
    Truck,
    Minimize,
    Maximize,
    Scan,
    Printer,
    DollarSign,
    BarChart3
} from "lucide-react";
import { motion } from "framer-motion";

interface POSHeaderProps {
    profile: any;
    activeTab: "new" | "cod";
    setActiveTab: (tab: "new" | "cod") => void;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    setShowScanner: (show: boolean) => void;
    setShowPrinterSettings: (show: boolean) => void;
    setShowCashOp: (show: boolean) => void;
    handlePrepareClose: () => void;
    activeSession?: any;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
    profile,
    activeTab,
    setActiveTab,
    isFullscreen,
    toggleFullscreen,
    setShowScanner,
    setShowPrinterSettings,
    setShowCashOp,
    handlePrepareClose,
    activeSession: _activeSession
}) => {
    return (
        <div className="flex items-center justify-between px-5 py-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-20">
            <div className="flex items-center gap-4 hover:scale-[1.02] transition-transform cursor-default">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/20">
                    <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none tracking-tight">Terminal POS</h1>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1 uppercase tracking-widest">{profile?.company_name || profile?.full_name || "Agence Élité"}</p>
                </div>
            </div>

            {/* ── INLINE MODES (Compact) ── */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner border border-slate-200/50 dark:border-slate-700/50 mx-4 flex-1 max-w-sm">
                <button
                    onClick={() => setActiveTab("new")}
                    className={`flex-1 relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'new'
                        ? 'text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>Colis</span>
                </button>

                <button
                    onClick={() => setActiveTab("cod")}
                    className={`flex-1 relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'cod'
                        ? 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <Truck className="w-4 h-4" />
                    <span>Retrait</span>
                </button>
            </div>

            <div className="flex items-center gap-2">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleFullscreen}
                    className="flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm transition-all" title="Plein écran">
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </motion.button>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowScanner(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-xs font-bold" title="Scanner un code-barres">
                    <Scan className="w-4 h-4" />
                    <span className="hidden sm:inline">Scanner</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowPrinterSettings(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/50 hover:text-orange-600 dark:hover:text-orange-400 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-xs font-bold" title="Périphériques (Imprimante, Balance)">
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Périphériques</span>
                </motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCashOp(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/50 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 shadow-sm transition-all text-xs font-bold" title="Faire une entrée ou sortie de caisse">
                    <DollarSign className="w-4 h-4" />
                    <span className="hidden sm:inline">Caisse</span>
                </motion.button>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2" />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handlePrepareClose}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-900/20 dark:shadow-white/20 transition-all text-sm font-black tracking-wide" title="Clôturer la journée et imprimer le Z-Report">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Z-Report</span>
                </motion.button>
            </div>
        </div>
    );
};
