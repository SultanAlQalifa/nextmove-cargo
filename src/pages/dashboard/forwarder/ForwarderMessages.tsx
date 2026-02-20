import PageHeader from "../../../components/common/PageHeader";
import { MessageCircle, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function ForwarderMessages() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col relative z-10 w-full max-w-7xl mx-auto space-y-6 pb-6">
      <div className="grain-overlay opacity-[0.02] pointer-events-none" />
      <PageHeader
        title="Messagerie"
        subtitle="Discutez avec vos clients et négociez les offres"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 glass-card-premium rounded-[2rem] border-white/20 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl overflow-hidden flex"
      >
        {/* Sidebar List */}
        <div className="w-80 border-r border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex flex-col relative z-10">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/5 relative">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Discussions</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un client..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
            <MessageCircle className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
            <span className="font-semibold tracking-wide">Aucune conversation active</span>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/30 dark:bg-slate-900/20 relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent dark:from-blue-500/20 rounded-full flex items-center justify-center mb-6 relative"
          >
            <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-[spin_4s_linear_infinite]" />
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-white/5 relative z-10">
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Sélectionnez une conversation
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center font-medium leading-relaxed">
            Vos échanges avec les clients concernant les RFQ et les expéditions
            apparaîtront ici.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
