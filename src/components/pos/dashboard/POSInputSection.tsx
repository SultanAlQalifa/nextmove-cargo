import React from "react";
import {
    DollarSign,
    Ship,
    Plane,
    Zap,
    Shield,
    Package,
    Minus,
    Plus,
    User,
    Search,
    X,
    PlusCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface POSInputSectionProps {
    formData: any;
    setFormData: (f: any | ((prev: any) => any)) => void;
    realRates: any[];
    currentRate: any;
    unitLabel: string;
    dimensions: { length: number; width: number; height: number };
    setDimensions: (d: any | ((prev: any) => any)) => void;
    adjustValue: (delta: number) => void;
    selectedClient: any;
    setSelectedClient: (c: any) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    searchResults: any[];
    setSearchResults: (r: any[]) => void;
    setShowQuickClient: (show: boolean) => void;
}

export const POSInputSection: React.FC<POSInputSectionProps> = ({
    formData,
    setFormData,
    realRates,
    currentRate,
    unitLabel,
    dimensions,
    setDimensions,
    adjustValue,
    selectedClient,
    setSelectedClient,
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    setShowQuickClient
}) => {
    return (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {/* ── RATE MATRIX (Elite) ── */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-700/50 shadow-xl overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-slate-50/80 to-indigo-50/30 dark:from-slate-800/80 dark:to-indigo-900/30 border-b border-indigo-100/50 dark:border-indigo-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest block leading-none">Grille Tarifaire</span>
                            <span className="text-[10px] text-slate-500 font-medium mt-1 uppercase">Sélectionnez mode + service</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200/50 dark:divide-slate-700/50">
                    {/* Maritime */}
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Ship className={`w-5 h-5 ${formData.transportMode === 'sea' ? 'text-indigo-600 dark:text-indigo-400 drop-shadow-md' : 'text-slate-400'}`} />
                            <span className={`text-base font-black ${formData.transportMode === 'sea' ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>Maritime</span>
                        </div>
                        <div className="space-y-3">
                            {['standard', 'express'].map(svc => {
                                const rate = realRates.find(r => r.mode === 'sea' && r.type === svc);
                                const isSelected = formData.transportMode === 'sea' && formData.serviceType === svc;
                                return (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        key={svc}
                                        onClick={() => setFormData((f: any) => ({ ...f, transportMode: 'sea', serviceType: svc as any }))}
                                        className={`w-full p-4 rounded-2xl text-left transition-all border-2 relative overflow-hidden ${isSelected
                                            ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/40 dark:to-slate-800 shadow-md shadow-indigo-500/10'
                                            : 'border-transparent bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />}
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}>
                                                {svc === 'express' && <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500" />}
                                                {svc}
                                            </span>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
                                        </div>
                                        <p className={`text-lg font-black mt-1.5 relative z-10 ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            1 CBM = {rate ? rate.price.toLocaleString() : (svc === 'express' ? '562 500' : '450 000')} <span className="text-[10px] font-bold text-slate-400">FCFA</span>
                                        </p>
                                        {!rate && <p className="text-[10px] text-amber-500/80 font-bold mt-1 relative z-10 flex items-center gap-1"><Shield className="w-3 h-3" /> Tarif par défaut</p>}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                    {/* Aérien */}
                    <div className="p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Plane className={`w-5 h-5 ${formData.transportMode === 'air' ? 'text-sky-500 drop-shadow-md' : 'text-slate-400'}`} />
                            <span className={`text-base font-black ${formData.transportMode === 'air' ? 'text-sky-900 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}`}>Aérien</span>
                        </div>
                        <div className="space-y-3">
                            {['standard', 'express'].map(svc => {
                                const rate = realRates.find(r => r.mode === 'air' && r.type === svc);
                                const isSelected = formData.transportMode === 'air' && formData.serviceType === svc;
                                return (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        key={svc}
                                        onClick={() => setFormData((f: any) => ({ ...f, transportMode: 'air', serviceType: svc as any }))}
                                        className={`w-full p-4 rounded-2xl text-left transition-all border-2 relative overflow-hidden ${isSelected
                                            ? 'border-sky-500 bg-gradient-to-br from-sky-50 to-white dark:from-sky-900/40 dark:to-slate-800 shadow-md shadow-sky-500/10'
                                            : 'border-transparent bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />}
                                        <div className="flex items-center justify-between relative z-10">
                                            <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'text-sky-700 dark:text-sky-400' : 'text-slate-500'}`}>
                                                {svc === 'express' && <Zap className="w-3.5 h-3.5 inline mr-1 text-amber-500" />}
                                                {svc}
                                            </span>
                                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]" />}
                                        </div>
                                        <p className={`text-lg font-black mt-1.5 relative z-10 ${isSelected ? 'text-sky-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            1 KG = {rate ? rate.price.toLocaleString() : (svc === 'express' ? '6 875' : '5 500')} <span className="text-[10px] font-bold text-slate-400">FCFA</span>
                                        </p>
                                        {!rate && <p className="text-[10px] text-amber-500/80 font-bold mt-1 relative z-10 flex items-center gap-1"><Shield className="w-3 h-3" /> Tarif par défaut</p>}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {/* Active rate footer */}
                <div className={`px-4 py-2 border-t flex items-center gap-2 ${currentRate ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50' : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/50'}`}>
                    <Shield className={`w-4 h-4 ${currentRate ? 'text-emerald-600' : 'text-amber-600'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-wider ${currentRate ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'}`}>
                        {currentRate
                            ? `Tarif actif : 1 ${unitLabel} = ${currentRate.price.toLocaleString()} FCFA`
                            : `Tarif par défaut : 1 ${unitLabel} = ${formData.transportMode === 'air' ? '5 500' : '450 000'} FCFA`
                        }
                    </span>
                </div>
            </div>

            {/* ── MEASURES ── */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-700/50 p-5 shadow-xl space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                        <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest block leading-none">Mesures & Colis</span>
                </div>

                {/* Main value */}
                {formData.transportMode === 'sea' ? (
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Dimensions (CM) : Longueur × Largeur × Hauteur</label>
                        <div className="flex items-center gap-2">
                            <input type="number" placeholder="Long" value={dimensions.length || ""} onChange={e => setDimensions((d: any) => ({ ...d, length: Number(e.target.value) }))} className="flex-1 min-w-0 h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-center text-lg font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-inner" />
                            <span className="text-slate-400 font-bold text-sm">×</span>
                            <input type="number" placeholder="Larg" value={dimensions.width || ""} onChange={e => setDimensions((d: any) => ({ ...d, width: Number(e.target.value) }))} className="flex-1 min-w-0 h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-center text-lg font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-inner" />
                            <span className="text-slate-400 font-bold text-sm">×</span>
                            <input type="number" placeholder="Haut" value={dimensions.height || ""} onChange={e => setDimensions((d: any) => ({ ...d, height: Number(e.target.value) }))} className="flex-1 min-w-0 h-14 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-center text-lg font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-inner" />
                        </div>
                        <div className="mt-4 text-center bg-indigo-50 dark:bg-indigo-900/20 py-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                            <span className="text-sm text-indigo-700 dark:text-indigo-400 font-black uppercase tracking-wider">{formData.volume} CBM</span>
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
                            Poids total (KG)
                        </label>
                        <div className="flex items-center gap-3">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => adjustValue(-1)}
                                className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                                <Minus className="w-6 h-6" />
                            </motion.button>
                            <input
                                aria-label="Poids en KG"
                                type="number"
                                step="1"
                                value={formData.weight}
                                onChange={(e) => setFormData((f: any) => ({ ...f, weight: Number(e.target.value) }))}
                                className="flex-1 h-16 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-center text-4xl font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 shadow-inner transition-all"
                            />
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => adjustValue(1)}
                                className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm border border-slate-200/50 dark:border-slate-700/50 transition-colors">
                                <Plus className="w-6 h-6" />
                            </motion.button>
                        </div>
                    </div>
                )}

                {/* Packages */}
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Nombre de colis physiques</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 5, 10].map(n => (
                            <button key={n} onClick={() => setFormData({ ...formData, packages: n })}
                                className={`flex-1 py-4 rounded-2xl font-black text-base transition-all ${formData.packages === n
                                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 border-transparent'
                                    : 'bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700'
                                    }`}>
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── CLIENT ── */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-white/40 dark:border-slate-700/50 p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest block leading-none">Client</span>
                </div>

                {selectedClient ? (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/50 shadow-inner">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-blue-500/20">
                                {(selectedClient.full_name?.[0] || "?").toUpperCase()}
                            </div>
                            <div>
                                <p className="text-base font-black text-slate-900 dark:text-white">{selectedClient.full_name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedClient.phone || selectedClient.email}</p>
                            </div>
                        </div>
                        <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={() => setSelectedClient(null)} className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-800 rounded-full shadow-sm" title="Supprimer">
                            <X className="w-5 h-5" />
                        </motion.button>
                    </motion.div>
                ) : (
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input type="text" placeholder="Rechercher par nom, téléphone ou email..."
                                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl border-2 border-slate-100 dark:border-slate-700/50 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-medium" />
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                                    {searchResults.map(c => (
                                        <button key={c.id} onClick={() => { setSelectedClient(c); setSearchResults([]); setSearchQuery(""); }}
                                            className="w-full px-5 py-4 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-4 transition-colors">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm font-black text-slate-600 dark:text-slate-300">
                                                {(c.full_name?.[0] || "?").toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-base font-black text-slate-800 dark:text-slate-200">{c.full_name}</p>
                                                <p className="text-[11px] font-bold text-slate-400 tracking-wide">{c.phone || c.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={() => setShowQuickClient(true)} className="w-full py-3.5 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-sm uppercase tracking-widest bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-2xl transition-all border border-indigo-100 dark:border-indigo-800/50">
                            <PlusCircle className="w-4 h-4" /> Nouveau Client Passager
                        </motion.button>
                    </div>
                )}
            </div>
        </div>
    );
};
