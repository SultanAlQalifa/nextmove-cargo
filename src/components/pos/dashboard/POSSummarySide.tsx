import React from "react";
import {
    Ship,
    Plane,
    Zap,
    Package,
    Receipt,
    DollarSign,
    CreditCard,
    QrCode,
    CheckCircle2,
    Printer,
    ArrowRight,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { posService } from "../../../services/posService";

interface POSSummarySideProps {
    activeSession: any;
    formData: any;
    unitLabel: string;
    unitValue: number;
    currentRate: any;
    paymentMethod: "cash" | "mobile";
    setPaymentMethod: (m: "cash" | "mobile") => void;
    lastShipment: any;
    selectedClient: any;
    loading: boolean;
    handleCreateShipment: () => void;
}

export const POSSummarySide: React.FC<POSSummarySideProps> = ({
    activeSession,
    formData,
    unitLabel,
    unitValue,
    currentRate,
    paymentMethod,
    setPaymentMethod,
    lastShipment,
    selectedClient,
    loading,
    handleCreateShipment
}) => {
    return (
        <div className="col-span-12 lg:col-span-5 flex flex-col bg-slate-900 border-l border-white/10 text-white relative overflow-hidden z-20 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.3)]">
            {/* Dark Premium Ambient Glassmorphism */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black pointer-events-none" />
            <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none mix-blend-overlay" />

            {/* Session Info */}
            <div className="px-6 py-5 bg-white/5 dark:bg-slate-800/20 backdrop-blur-md flex items-center justify-between relative z-10 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </div>
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">
                        Session {activeSession ? new Date(activeSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black text-indigo-300">{activeSession?.sales_count || 0} Ventes</span>
                </div>
            </div>

            {/* Summary Content */}
            <div className="flex-1 flex flex-col justify-between p-8 relative z-10 overflow-y-auto">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Aperçu de la commande</p>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>

                    <div className="space-y-1 bg-black/20 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                        {[
                            { label: "Mode de Transport", value: formData.transportMode === 'sea' ? 'Maritime' : 'Aérien', icon: formData.transportMode === 'sea' ? Ship : Plane, color: 'text-blue-400' },
                            { label: "Type de Service", value: formData.serviceType === 'express' ? 'Express' : 'Standard', icon: Zap, color: formData.serviceType === 'express' ? 'text-amber-400' : 'text-slate-400' },
                            { label: `Mesure (${unitLabel})`, value: unitValue + (formData.transportMode === 'sea' ? ' m³' : ' kg'), icon: Package, color: 'text-orange-400' },
                            { label: "Nombre de Colis", value: `${formData.packages}`, icon: Receipt, color: 'text-indigo-400' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded-lg transition-colors">
                                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
                                    <item.icon className={`w-4 h-4 ${item.color}`} />
                                    {item.label}
                                </span>
                                <span className="text-sm font-black text-white">{item.value}</span>
                            </div>
                        ))}
                        {/* Tarif unitaire */}
                        <div className="flex items-center justify-between py-3 mt-2 px-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <span className="text-emerald-400/80 text-xs font-black uppercase tracking-wider flex items-center gap-3">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                Tarif unitaire
                            </span>
                            <span className="text-sm font-black text-emerald-400">
                                {currentRate
                                    ? `${currentRate.price.toLocaleString()} F / ${unitLabel}`
                                    : `${formData.transportMode === 'air' ? '5 500' : '450 000'} F / ${unitLabel}`
                                }
                            </span>
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="pt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">Méthode de Paiement</p>
                        <div className="grid grid-cols-2 gap-3">
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPaymentMethod('cash')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all border-2 ${paymentMethod === 'cash'
                                    ? 'bg-white text-slate-900 border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'
                                    }`}>
                                <CreditCard className="w-6 h-6 mb-1" />
                                <span className="text-xs font-black uppercase tracking-widest">Espèces</span>
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPaymentMethod('mobile')}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all border-2 ${paymentMethod === 'mobile'
                                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                                    : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'
                                    }`}>
                                <QrCode className="w-6 h-6 mb-1" />
                                <span className="text-xs font-black uppercase tracking-widest">Mobile</span>
                            </motion.button>
                        </div>
                    </div>

                    {/* Last Shipment Re-print Actions */}
                    {lastShipment && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 px-2">
                            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 backdrop-blur-md">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Colis #{lastShipment.tracking_number.split('-').pop()}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-400">ENREGISTRÉ</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => posService.generateReceipt(lastShipment)} className="flex items-center justify-center gap-2 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors">
                                        <Printer className="w-3.5 h-3.5" /> Reçu
                                    </button>
                                    <button onClick={() => posService.printLabel(lastShipment)} className="flex items-center justify-center gap-2 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider text-indigo-300 transition-colors">
                                        <QrCode className="w-3.5 h-3.5" /> Étiquette
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* TOTAL + BUTTON */}
                <div className="mt-8 space-y-6">
                    {/* Client mini */}
                    {selectedClient && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-3 p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 backdrop-blur-md">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center text-xs font-black text-white shadow-inner">
                                {(selectedClient.full_name?.[0] || "?").toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest leading-none mb-1">Passager Courant</p>
                                <p className="text-sm font-black text-white truncate">{selectedClient.full_name}</p>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-indigo-400" />
                        </motion.div>
                    )}

                    <div className="text-center py-4 bg-black/20 rounded-3xl border border-white/5 backdrop-blur-md">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total à Encaisser</p>
                        <motion.div key={formData.price} initial={{ scale: 1.1, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-baseline justify-center gap-2">
                            <span className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-sm">{formData.price.toLocaleString()}</span>
                            <span className="text-xl text-slate-500 font-bold uppercase tracking-wider">FCFA</span>
                        </motion.div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading || !selectedClient}
                        onClick={handleCreateShipment}
                        className={`w-full py-6 rounded-3xl font-black text-lg transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${!selectedClient
                            ? 'bg-white/5 text-slate-500 cursor-not-allowed border-2 border-dashed border-white/10'
                            : 'bg-white text-slate-900 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)] border-2 border-white'
                            }`}>
                        {loading ? (
                            <span className="animate-pulse">Création en cours...</span>
                        ) : !selectedClient ? (
                            <span className="tracking-wider uppercase text-xs">Client Requis (Panneau Gauche)</span>
                        ) : (
                            <>
                                {/* Swipe effect on hover */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                                <span className="relative z-10 tracking-widest uppercase">Encaisser & Valider</span>
                                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </motion.button>

                    {/* Session total */}
                    <div className="text-center pt-2">
                        <p className="text-[10px] text-slate-600 font-medium">
                            CA Session : <span className="text-indigo-400 font-bold">{(activeSession?.total_sales || 0).toLocaleString()} FCFA</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
