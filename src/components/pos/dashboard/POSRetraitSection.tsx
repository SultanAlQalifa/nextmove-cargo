import React from "react";
import {
    Truck,
    Hash,
    Search,
    Scan,
    Package,
    CheckCircle2,
    X,
    User,
    MapPin,
    QrCode
} from "lucide-react";
import { motion } from "framer-motion";
import { posService } from "../../../services/posService";
import { SignaturePad } from "../SignaturePad";

interface POSRetraitSectionProps {
    codQuery: string;
    setCodQuery: (s: string) => void;
    handleCodSearch: (q?: string) => void;
    codSearching: boolean;
    setShowScanner: (show: boolean) => void;
    codResults: any[];
    selectedShipment: any;
    setSelectedShipment: (s: any) => void;
    recipientName: string;
    setRecipientName: (s: string) => void;
    codLoading: boolean;
    handleCodConfirm: (signature?: string) => void;
}

export const POSRetraitSection: React.FC<POSRetraitSectionProps> = ({
    codQuery,
    setCodQuery,
    handleCodSearch,
    codSearching,
    setShowScanner,
    codResults,
    selectedShipment,
    setSelectedShipment,
    recipientName,
    setRecipientName,
    codLoading,
    handleCodConfirm
}) => {
    const [showSignaturePad, setShowSignaturePad] = React.useState(false);
    const [signature, setSignature] = React.useState<string | null>(null);
    return (
        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {/* Search bar */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Recherche Expédition</span>
                </div>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                        <input type="text" placeholder="N° de suivi, port d'origine..."
                            value={codQuery}
                            onChange={(e) => setCodQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCodSearch()}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 transition-all text-sm text-slate-900 dark:text-slate-100"
                        />
                    </div>
                    <button onClick={() => handleCodSearch()} disabled={codSearching}
                        className="px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors disabled:opacity-50 flex items-center gap-1.5 min-h-[44px]">
                        <Search className="w-4 h-4" />
                        {codSearching ? '...' : 'Chercher'}
                    </button>
                    <button onClick={() => setShowScanner(true)}
                        className="px-3 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors min-h-[44px]" title="Scanner">
                        <Scan className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Results */}
            {codResults.length > 0 && !selectedShipment && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 overflow-hidden shadow-sm">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-xs font-bold text-slate-500">{codResults.length} résultat(s)</span>
                    </div>
                    {codResults.map(s => (
                        <button key={s.id} onClick={() => setSelectedShipment(s)}
                            className="w-full px-4 py-3 flex items-center justify-between border-b last:border-0 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                                    <Package className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.tracking_number}</p>
                                    <p className="text-[10px] text-slate-400">{s.client?.full_name || 'Client'} • {s.origin_port} → {s.destination_port}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-slate-800 dark:text-slate-200">{(s.price || 0).toLocaleString()} F</p>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${s.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                    s.status === 'in_transit' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                    }`}>{s.status}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {codResults.length === 0 && codQuery.length >= 2 && !codSearching && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-700/50 p-8 text-center shadow-sm">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">Aucune expédition trouvée</p>
                    <p className="text-xs text-slate-400 mt-1">Vérifiez le numéro de suivi</p>
                </div>
            )}

            {/* Selected Shipment Detail */}
            {selectedShipment && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-b border-emerald-100 dark:border-emerald-800/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">Détail Expédition</span>
                            </div>
                            <button onClick={() => setSelectedShipment(null)} className="p-1 text-slate-400 hover:text-red-500" title="Fermer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <Hash className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">N° Suivi</p>
                                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">{selectedShipment.tracking_number}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Client</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedShipment.client?.full_name || 'Non renseigné'}</p>
                                    <p className="text-[10px] text-slate-400">{selectedShipment.client?.phone || selectedShipment.client?.email || ''}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400 font-medium">Trajet</p>
                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {selectedShipment.origin_port || '—'} → {selectedShipment.destination_port || '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                    <p className="text-[10px] text-slate-400 font-medium">Poids</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedShipment.cargo_weight || 0} kg</p>
                                </div>
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                    <p className="text-[10px] text-slate-400 font-medium">Volume</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedShipment.cargo_volume || 0} m³</p>
                                </div>
                                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center">
                                    <p className="text-[10px] text-slate-400 font-medium">Colis</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-slate-200">{selectedShipment.cargo_packages || 0}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Montant à encaisser</p>
                                <p className="text-2xl font-black text-emerald-800 dark:text-emerald-200">{(selectedShipment.price || 0).toLocaleString()} <span className="text-sm text-emerald-500">FCFA</span></p>
                            </div>

                            {/* Recipient Name Input */}
                            <div className="pt-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Nom du réceptionnaire (Requis)</label>
                                <input
                                    type="text"
                                    placeholder="Nom complet du destinataire..."
                                    value={recipientName}
                                    onChange={(e) => setRecipientName(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 outline-none focus:border-indigo-400 text-sm"
                                />
                            </div>

                            {/* Signature Capture */}
                            <div className="pt-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center justify-between">
                                    <span>Preuve de réception (Signature)</span>
                                    {signature && <span className="text-[10px] text-emerald-500 font-bold">Capturée</span>}
                                </label>

                                {!showSignaturePad && !signature ? (
                                    <button
                                        onClick={() => setShowSignaturePad(true)}
                                        className="w-full py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-500 hover:border-indigo-400/50 transition-all flex flex-col items-center justify-center gap-2"
                                    >
                                        <QrCode className="w-6 h-6 opacity-30" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Signer pour réception</span>
                                    </button>
                                ) : showSignaturePad ? (
                                    <SignaturePad
                                        onSave={(sig) => {
                                            setSignature(sig);
                                            setShowSignaturePad(false);
                                        }}
                                        onCancel={() => setShowSignaturePad(false)}
                                    />
                                ) : (
                                    <div className="relative group rounded-xl overflow-hidden border border-emerald-500/30 bg-black/20">
                                        <img src={signature || undefined} alt="Signature" className="w-full h-32 object-contain invert dark:invert-0" />
                                        <button
                                            onClick={() => setSignature(null)}
                                            className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors"
                                            title="Effacer la signature"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* COD Confirm Button */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={() => handleCodConfirm(signature || undefined)}
                                className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 min-h-[48px] transition-all ${selectedShipment.status === 'delivered' || !recipientName.trim()
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
                                    }`}>
                                {codLoading ? (
                                    <span className="animate-pulse">Traitement...</span>
                                ) : selectedShipment.status === 'delivered' ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Déjà livré</>
                                ) : (
                                    <><CheckCircle2 className="w-4 h-4" /> Confirmer Paiement & Livraison</>
                                )}
                            </motion.button>

                            {/* Re-print Label button in COD */}
                            <button
                                onClick={() => posService.printLabel(selectedShipment)}
                                className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700">
                                <QrCode className="w-4 h-4" /> Imprimer Étiquette Colis
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
