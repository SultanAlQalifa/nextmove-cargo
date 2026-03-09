import { useState, useEffect, useMemo } from "react";
import {
    X,
    Clock,
    Smartphone,
    AlertCircle,
    Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { shipmentService } from "../../../services/shipmentService";
import { posService } from "../../../services/posService";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import BarcodeScanner from "../../../components/pos/BarcodeScanner";
import QuickClientModal from "../../../components/pos/QuickClientModal";
import PrinterModal from "../../../components/pos/PrinterModal";

// Modular Components
import { POSHeader } from "../../../components/pos/dashboard/POSHeader";
import { POSInputSection } from "../../../components/pos/dashboard/POSInputSection";
import { POSRetraitSection } from "../../../components/pos/dashboard/POSRetraitSection";
import { POSSummarySide } from "../../../components/pos/dashboard/POSSummarySide";

export default function POSDashboard() {
    const { profile } = useAuth();
    const { success, error } = useToast();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [showScanner, setShowScanner] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile">("cash");
    const [showPaymentQR, setShowPaymentQR] = useState(false);

    const [formData, setFormData] = useState({
        weight: 1,
        volume: 0.1,
        packages: 1,
        transportMode: "sea" as "sea" | "air",
        serviceType: "standard" as "standard" | "express",
        origin: "Chine",
        destination: "Sénégal",
        price: 0
    });

    const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });

    const [showQuickClient, setShowQuickClient] = useState(false);
    const [showPrinterSettings, setShowPrinterSettings] = useState(false);
    const [realRates, setRealRates] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [initialCash, setInitialCash] = useState(0);

    // Cash operations & Z-Report
    const [showCloseSession, setShowCloseSession] = useState(false);
    const [cashCounted, setCashCounted] = useState<number | "">("");
    const [closingNotes, setClosingNotes] = useState("");
    const [closingReport, setClosingReport] = useState<any>(null);

    const [showCashOp, setShowCashOp] = useState(false);
    const [cashOpType, setCashOpType] = useState<"in" | "out">("out");
    const [cashOpAmount, setCashOpAmount] = useState<number | "">("");
    const [cashOpReason, setCashOpReason] = useState("");
    const [cashOpLoading, setCashOpLoading] = useState(false);

    // COD Lookup tab
    const [activeTab, setActiveTab] = useState<"new" | "cod">("new");
    const [codQuery, setCodQuery] = useState("");
    const [codResults, setCodResults] = useState<any[]>([]);
    const [selectedShipment, setSelectedShipment] = useState<any>(null);
    const [recipientName, setRecipientName] = useState("");
    const [codLoading, setCodLoading] = useState(false);
    const [codSearching, setCodSearching] = useState(false);
    const [showOpenSession, setShowOpenSession] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [lastShipment, setLastShipment] = useState<any>(null);

    // Active rate for current mode + service
    const currentRate = useMemo(() => {
        return realRates.find(r =>
            r.mode === formData.transportMode &&
            r.type === formData.serviceType
        );
    }, [realRates, formData.transportMode, formData.serviceType]);

    const unitLabel = formData.transportMode === "air" ? "KG" : "CBM";
    const unitValue = formData.transportMode === "air" ? formData.weight : formData.volume;

    // Load session and rates
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const session = await posService.getActiveSession();
                if (session) {
                    setActiveSession(session);
                } else {
                    const newSession = await posService.openSession(0);
                    setActiveSession(newSession);
                }
            } catch (err: any) {
                console.error("Auto-session failed, showing manual modal", err);
                setShowOpenSession(true);
            }
            const rates = await posService.getRealRates();
            setRealRates(rates);
        };
        loadInitialData();
    }, [success]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length >= 2) {
                const results = await posService.searchClients(searchQuery);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Recalculate volume and price
    useEffect(() => {
        if (formData.transportMode === "sea") {
            const v = (dimensions.length * dimensions.width * dimensions.height) / 1000000;
            setFormData(f => ({ ...f, volume: v > 0 ? Number(v.toFixed(3)) : 0 }));
        }
    }, [dimensions, formData.transportMode]);

    useEffect(() => {
        const DEFAULT_AIR = 5500, DEFAULT_SEA = 450000;
        let total = 0;
        if (currentRate) {
            total = formData.transportMode === "air"
                ? formData.weight * currentRate.price
                : formData.volume * currentRate.price;
        } else {
            total = formData.transportMode === "air"
                ? formData.weight * DEFAULT_AIR
                : formData.volume * DEFAULT_SEA;
            if (formData.serviceType === "express") total *= 1.25;
        }
        setFormData(prev => ({ ...prev, price: Math.round(total) }));
    }, [formData.weight, formData.volume, formData.transportMode, formData.serviceType, currentRate]);

    const handleOpenSession = async () => {
        try {
            const session = await posService.openSession(initialCash);
            setActiveSession(session);
            setShowOpenSession(false);
            success("Session ouverte");
        } catch (err: any) { error(err.message || "Erreur ouverture session"); }
    };

    const toggleFullscreen = () => {
        try {
            const elem = document.documentElement as any;
            const doc = document as any;
            const isFull = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

            if (!isFull) {
                if (elem.requestFullscreen) {
                    elem.requestFullscreen().catch(() => { });
                } else if (elem.webkitRequestFullscreen) {
                    elem.webkitRequestFullscreen();
                } else if (elem.mozRequestFullScreen) {
                    elem.mozRequestFullScreen();
                } else if (elem.msRequestFullscreen) {
                    elem.msRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                if (doc.exitFullscreen) {
                    doc.exitFullscreen().catch(() => { });
                } else if (doc.webkitExitFullscreen) {
                    doc.webkitExitFullscreen();
                } else if (doc.mozCancelFullScreen) {
                    doc.mozCancelFullScreen();
                } else if (doc.msExitFullscreen) {
                    doc.msExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (err) {
            console.error("Error toggling fullscreen:", err);
            setIsFullscreen(!isFullscreen);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            const doc = document as any;
            const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement);
            setIsFullscreen(isFull);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
            document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
        };
    }, []);

    const handlePrepareClose = async () => {
        if (!activeSession) return;
        try {
            const report = await posService.getZReport(activeSession.id);
            setClosingReport(report);
            setShowCloseSession(true);
        } catch (err: any) { error(err.message || "Erreur calcul Z-Report"); }
    };

    const handleConfirmClose = async () => {
        if (!activeSession || !closingReport) return;
        if (cashCounted === "") { error("Veuillez saisir le montant en caisse"); return; }

        setLoading(true);
        try {
            await posService.closeSession(activeSession.id, {
                cashCounted: Number(cashCounted),
                cashExpected: closingReport.totals.expected,
                difference: Number(cashCounted) - closingReport.totals.expected,
                notes: closingNotes
            });

            const { printService } = await import("../../../services/printService");
            printService.printZReport({
                ...closingReport,
                totals: { ...closingReport.totals, counted: Number(cashCounted), difference: Number(cashCounted) - closingReport.totals.expected }
            });

            setActiveSession(null);
            setShowCloseSession(false);
            setShowOpenSession(true);
            setCashCounted("");
            setClosingNotes("");
            success("Session clôturée avec succès");
        } catch (err: any) { error(err.message || "Erreur clôture session"); }
        finally { setLoading(false); }
    };

    const handleCashOpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeSession || cashOpAmount === "" || !cashOpReason.trim()) return;
        setCashOpLoading(true);
        try {
            await posService.addCashOperation(activeSession.id, cashOpType, Number(cashOpAmount), cashOpReason);

            const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'manager';

            if (cashOpType === 'out') {
                if (isAdminOrManager) {
                    success(`Retrait de caisse enregistré et auto-approuvé.`);
                } else {
                    success(`Demande de retrait enregistrée. En attente de validation.`);
                }
            } else {
                success(`Opération de caisse enregistrée (Entrée)`);
            }
            setShowCashOp(false);
            setCashOpAmount("");
            setCashOpReason("");
        } catch (err: any) { error(err.message || "Erreur lors de l'opération de caisse"); }
        finally { setCashOpLoading(false); }
    };

    const handleCreateShipment = async () => {
        if (!selectedClient) { error("Veuillez sélectionner un client"); return; }
        if (paymentMethod === "mobile" && !showPaymentQR) { setShowPaymentQR(true); return; }
        setLoading(true);
        try {
            const shipment = await shipmentService.createShipment({
                client_id: selectedClient.id,
                cargo_weight: formData.weight,
                cargo_volume: formData.volume,
                cargo_packages: formData.packages,
                transport_mode: formData.transportMode,
                service_type: formData.serviceType,
                price: formData.price,
                origin_country: formData.origin,
                destination_country: formData.destination,
                cargo_type: "Marchandise Générale",
                pos_session_id: activeSession?.id
            });
            success("Expédition créée avec succès");
            if (activeSession) {
                setActiveSession({
                    ...activeSession,
                    sales_count: (activeSession.sales_count || 0) + 1,
                    total_sales: (activeSession.total_sales || 0) + formData.price
                });
            }
            posService.generateReceipt(shipment);
            try {
                await posService.printToHardware(shipment);
                await posService.printLabel(shipment);
            } catch { }
            setLastShipment(shipment);
            setFormData(prev => ({ ...prev, weight: 1, volume: 0.1, packages: 1 }));
            setSelectedClient(null);
            setSearchQuery("");
            setShowPaymentQR(false);
        } catch (err: any) { error(err.message || "Erreur lors de la création"); }
        finally { setLoading(false); }
    };

    const handleBarcodeScan = (code: string) => {
        if (activeTab === "cod") {
            setCodQuery(code);
            handleCodSearch(code);
        } else {
            success(`Code scanné : ${code}`);
        }
        setShowScanner(false);
    };

    const adjustValue = (delta: number) => {
        if (formData.transportMode === "air") {
            setFormData(f => ({ ...f, weight: Math.max(0.5, f.weight + delta) }));
        } else {
            setFormData(f => ({ ...f, volume: Math.max(0.1, +(f.volume + delta * 0.1).toFixed(1)) }));
        }
    };

    // COD Lookup
    const handleCodSearch = async (q?: string) => {
        const query = q || codQuery;
        if (!query || query.length < 2) return;
        setCodSearching(true);
        try {
            const results = await posService.lookupShipment(query);
            setCodResults(results);
            if (results.length === 1) setSelectedShipment(results[0]);
        } catch { setCodResults([]); }
        finally { setCodSearching(false); }
    };

    const handleCodConfirm = async (signature?: string) => {
        if (!selectedShipment) return;
        if (!recipientName.trim()) { error("Veuillez saisir le nom du destinataire"); return; }
        setCodLoading(true);
        try {
            await posService.collectCODPayment(selectedShipment.id, activeSession?.id, recipientName, signature);
            success(`Livraison confirmée — ${selectedShipment.tracking_number}`);
            if (activeSession) {
                setActiveSession({
                    ...activeSession,
                    sales_count: (activeSession.sales_count || 0) + 1,
                    total_sales: (activeSession.total_sales || 0) + (selectedShipment.price || 0)
                });
            }
            setSelectedShipment(null);
            setCodResults([]);
            setCodQuery("");
            setRecipientName("");
        } catch (err: any) { error(err.message || "Erreur lors de la confirmation"); }
        finally { setCodLoading(false); }
    };

    return (
        <div className={`flex flex-col relative font-sans transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100000] w-[100vw] h-[100dvh] m-0 p-4 bg-slate-50 dark:bg-slate-900 overflow-hidden' : 'h-[calc(100vh-100px)] -m-4 md:-m-6 lg:-m-8 pb-4'}`}>
            {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
            <QuickClientModal isOpen={showQuickClient} onClose={() => setShowQuickClient(false)} onSuccess={(c) => { setSelectedClient(c); success("Client sélectionné"); }} />
            <PrinterModal isOpen={showPrinterSettings} onClose={() => setShowPrinterSettings(false)} />

            {/* ═══ SESSION MODAL ═══ */}
            <AnimatePresence>
                {showOpenSession && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <Clock className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Nouvelle Session</h3>
                                <p className="text-slate-400 text-sm">Fonds de caisse initial</p>
                            </div>
                            <input type="number" value={initialCash} onChange={(e) => setInitialCash(Number(e.target.value))}
                                className="w-full p-4 bg-slate-50 rounded-2xl text-2xl font-black text-center outline-none border-2 border-transparent focus:border-indigo-500 transition-all" placeholder="0" />
                            <button onClick={handleOpenSession} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-indigo-500/25 transition-all min-h-[44px]">
                                Démarrer
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ QR PAYMENT MODAL ═══ */}
            <AnimatePresence>
                {showPaymentQR && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black text-slate-900">Paiement Mobile</h3>
                                <button onClick={() => setShowPaymentQR(false)} className="p-1.5 text-slate-400 hover:text-red-500" title="Fermer"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="bg-slate-50 p-6 rounded-2xl inline-flex justify-center">
                                <QRCodeSVG value={`wave:pay?amount=${formData.price}&ref=${activeSession?.id}`} size={160} level="H" includeMargin />
                            </div>
                            <p className="text-2xl font-black text-slate-900">{formData.price.toLocaleString()} <span className="text-slate-400 text-base">FCFA</span></p>
                            <button onClick={handleCreateShipment} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 min-h-[44px]">
                                <Smartphone className="w-5 h-5" /> Confirmer
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ CASH OPERATION MODAL ═══ */}
            <AnimatePresence>
                {showCashOp && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-black text-slate-900">Opération de Caisse</h3>
                                <button onClick={() => setShowCashOp(false)} className="p-1.5 text-slate-400 hover:text-red-500" title="Fermer" aria-label="Fermer"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={handleCashOpSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                                    <button type="button" onClick={() => setCashOpType("in")}
                                        className={`py-2 rounded-lg text-sm font-bold transition-all ${cashOpType === "in" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                                        Entrée (+)
                                    </button>
                                    <button type="button" onClick={() => setCashOpType("out")}
                                        className={`py-2 rounded-lg text-sm font-bold transition-all ${cashOpType === "out" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                                        Sortie (-)
                                    </button>
                                </div>
                                {cashOpType === "out" && (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) && (
                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex gap-2 items-start">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
                                            Les sorties de caisse nécessitent l'approbation d'un Manager. Le montant sera déduit une fois validé.
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Montant (FCFA)</label>
                                    <input type="number" required min="1" value={cashOpAmount} onChange={(e) => setCashOpAmount(e.target.value ? Number(e.target.value) : "")}
                                        title="Montant (FCFA)" placeholder="0"
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 font-black text-xl text-center" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Motif / Justification</label>
                                    <input type="text" required value={cashOpReason} onChange={(e) => setCashOpReason(e.target.value)} placeholder="Ex: Achat fournitures..."
                                        className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-400 text-sm" />
                                </div>
                                <button type="submit" disabled={cashOpLoading}
                                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all ${cashOpType === "in" ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25" : "bg-rose-600 hover:bg-rose-500 shadow-rose-500/25"} disabled:opacity-50`}>
                                    {cashOpLoading ? "Traitement..." : `Enregistrer ${cashOpType === "in" ? "l'entrée" : "la dépense"}`}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Z-REPORT / CLOSE SESSION MODAL ═══ */}
            <AnimatePresence>
                {showCloseSession && closingReport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900">Clôture de Caisse</h3>
                                    <p className="text-xs text-slate-500 font-medium">Bilan & Impression Z-Report</p>
                                </div>
                                <button onClick={() => setShowCloseSession(false)} className="p-1.5 text-slate-400 hover:text-red-500" title="Fermer" aria-label="Fermer"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-5">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500 font-medium">Fonds Initial</span>
                                        <span className="text-sm font-bold text-slate-800">{closingReport.totals.initial.toLocaleString()} F</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500 font-medium">Ventes encaissées</span>
                                        <span className="text-sm font-bold text-indigo-600">+{closingReport.totals.sales.toLocaleString()} F</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-slate-500 font-medium">Entrées manuelles</span>
                                        <span className="text-sm font-bold text-emerald-600">+{closingReport.totals.cashIn.toLocaleString()} F</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                        <span className="text-sm text-slate-500 font-medium">Sorties (Dépenses)</span>
                                        <span className="text-sm font-bold text-rose-600">-{closingReport.totals.cashOut.toLocaleString()} F</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-sm font-bold text-slate-900">Total Attendu</span>
                                        <span className="text-xl font-black text-slate-900">{closingReport.totals.expected.toLocaleString()} F</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                                            <span>Cash compté en caisse</span>
                                            {cashCounted !== "" && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${Number(cashCounted) === closingReport.totals.expected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    Écart : {(Number(cashCounted) - closingReport.totals.expected).toLocaleString()} F
                                                </span>
                                            )}
                                        </label>
                                        <input type="number" required value={cashCounted} onChange={(e) => setCashCounted(e.target.value ? Number(e.target.value) : "")}
                                            title="Cash compté en caisse" placeholder="0"
                                            className={`w-full px-4 py-4 rounded-xl border-2 outline-none font-black text-2xl text-center transition-all ${cashCounted !== "" && Number(cashCounted) !== closingReport.totals.expected ? 'border-rose-300 bg-rose-50 text-rose-900 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20' : 'border-indigo-100 bg-indigo-50 text-indigo-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/20'}`} />
                                    </div>
                                    {(cashCounted !== "" && Number(cashCounted) !== closingReport.totals.expected) && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                            <label className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1.5">Note explicative de l'écart (optionnel)</label>
                                            <input type="text" value={closingNotes} onChange={(e) => setClosingNotes(e.target.value)} placeholder="Raison de l'écart..."
                                                className="w-full px-4 py-3 bg-rose-50/50 rounded-xl border border-rose-200 outline-none focus:border-rose-400 text-sm text-rose-900 placeholder:text-rose-300" />
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <button onClick={handleConfirmClose} disabled={loading || cashCounted === ""}
                                className="w-full mt-6 py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading ? <span className="animate-pulse">Clôture...</span> : <><Printer className="w-5 h-5" /> Confirmer & Imprimer Z-Report</>}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══════════════ MAIN LAYOUT ═══════════════ */}
            <div className="flex-1 grid grid-cols-12 gap-0 min-h-0 overflow-hidden rounded-3xl border border-white/20 shadow-2xl bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl relative">

                {/* ══════ LEFT PANEL: Input ══════ */}
                <div className="col-span-12 lg:col-span-7 flex flex-col overflow-y-auto z-10">
                    <POSHeader
                        profile={profile}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        isFullscreen={isFullscreen}
                        toggleFullscreen={toggleFullscreen}
                        setShowScanner={setShowScanner}
                        setShowPrinterSettings={setShowPrinterSettings}
                        setShowCashOp={setShowCashOp}
                        handlePrepareClose={handlePrepareClose}
                        activeSession={activeSession}
                    />

                    {activeTab === "new" ? (
                        <POSInputSection
                            formData={formData}
                            setFormData={setFormData}
                            realRates={realRates}
                            currentRate={currentRate}
                            unitLabel={unitLabel}
                            dimensions={dimensions}
                            setDimensions={setDimensions}
                            adjustValue={adjustValue}
                            selectedClient={selectedClient}
                            setSelectedClient={setSelectedClient}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            searchResults={searchResults}
                            setSearchResults={setSearchResults}
                            setShowQuickClient={setShowQuickClient}
                        />
                    ) : (
                        <POSRetraitSection
                            codQuery={codQuery}
                            setCodQuery={setCodQuery}
                            handleCodSearch={handleCodSearch}
                            codSearching={codSearching}
                            setShowScanner={setShowScanner}
                            codResults={codResults}
                            selectedShipment={selectedShipment}
                            setSelectedShipment={setSelectedShipment}
                            recipientName={recipientName}
                            setRecipientName={setRecipientName}
                            codLoading={codLoading}
                            handleCodConfirm={handleCodConfirm}
                        />
                    )}
                </div>

                {/* ══════ RIGHT PANEL: Summary ══════ */}
                <POSSummarySide
                    activeSession={activeSession}
                    formData={formData}
                    unitLabel={unitLabel}
                    unitValue={unitValue}
                    currentRate={currentRate}
                    paymentMethod={paymentMethod}
                    setPaymentMethod={setPaymentMethod}
                    lastShipment={lastShipment}
                    selectedClient={selectedClient}
                    loading={loading}
                    handleCreateShipment={handleCreateShipment}
                />
            </div>
        </div>
    );
}
