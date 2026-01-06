import { useState, useEffect, useRef } from "react";
import {
    Calculator,
    User,
    Package,
    Scan,
    Save,
    X,
    Search,
    PlusCircle,
    Clock,
    Smartphone,
    CreditCard,
    QrCode,
    Printer
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { shipmentService } from "../../../services/shipmentService";
import { posService } from "../../../services/posService";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import BarcodeScanner from "../../../components/pos/BarcodeScanner";
import QuickClientModal from "../../../components/pos/QuickClientModal";
import PrinterModal from "../../../components/pos/PrinterModal";

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

    const [showQuickClient, setShowQuickClient] = useState(false);
    const [showPrinterSettings, setShowPrinterSettings] = useState(false);
    const [realRates, setRealRates] = useState<any[]>([]);
    const [activeSession, setActiveSession] = useState<any>(null);
    const [initialCash, setInitialCash] = useState(0);
    const [showOpenSession, setShowOpenSession] = useState(false);
    const progressRef = useRef<HTMLDivElement>(null);

    // Load session and rates
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const session = await posService.getActiveSession();
                if (session) {
                    setActiveSession(session);
                } else {
                    // Auto-open session with 0 initial cash for faster workflow
                    const newSession = await posService.openSession(0);
                    setActiveSession(newSession);
                    // success("Session automatique ouverte"); // Quietly open
                }
            } catch (err: any) {
                console.error("Auto-session failed, showing manual modal", err);
                setShowOpenSession(true);
            }

            const rates = await posService.getRealRates();
            setRealRates(rates);
        };
        loadInitialData();
    }, [success]); // Added success to dependencies just in case

    // Search clients when query changes
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

    // Recalculate price logic
    useEffect(() => {
        // Fallback rates
        const DEFAULT_AIR_RATE = 5500;
        const DEFAULT_SEA_RATE = 450000;

        const currentRate = realRates.find(r =>
            r.mode === formData.transportMode &&
            r.type === formData.serviceType
        );

        let total = 0;
        if (currentRate) {
            total = formData.transportMode === "air"
                ? formData.weight * currentRate.price
                : formData.volume * currentRate.price;
        } else {
            // Fallback to defaults
            total = formData.transportMode === "air"
                ? formData.weight * DEFAULT_AIR_RATE
                : formData.volume * DEFAULT_SEA_RATE;

            // Apply express surcharge if manual fallback
            if (formData.serviceType === "express" && !currentRate) {
                total *= 1.25;
            }
        }

        setFormData(prev => ({ ...prev, price: Math.round(total) }));
    }, [formData.weight, formData.volume, formData.transportMode, formData.serviceType, realRates]);

    // Update progress bar without inline styles
    useEffect(() => {
        if (progressRef.current) {
            const percentage = Math.min(100, ((activeSession?.sales_count || 0) / 10) * 100);
            progressRef.current.style.width = `${percentage}%`;
        }
    }, [activeSession?.sales_count]);

    const handleOpenSession = async () => {
        try {
            const session = await posService.openSession(initialCash);
            setActiveSession(session);
            setShowOpenSession(false);
            success("Session ouverte");
        } catch (err: any) {
            error(err.message || "Erreur ouverture session");
        }
    };

    const handleCloseSession = async () => {
        if (!activeSession) return;
        try {
            await posService.closeSession(activeSession.id);
            setActiveSession(null);
            setShowOpenSession(true);
            success("Session clôturée");
        } catch (err: any) {
            error(err.message || "Erreur clôture session");
        }
    };

    const handleCreateShipment = async () => {
        if (!selectedClient) {
            error("Veuillez sélectionner un client");
            return;
        }

        if (paymentMethod === "mobile" && !showPaymentQR) {
            setShowPaymentQR(true);
            return;
        }

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

            // Update session stats locally
            if (activeSession) {
                setActiveSession({
                    ...activeSession,
                    sales_count: (activeSession.sales_count || 0) + 1,
                    total_sales: (activeSession.total_sales || 0) + formData.price
                });
            }

            // Generate Receipt (PDF)
            posService.generateReceipt(shipment);

            // Attempt Hardware Print (Physical)
            try {
                await posService.printToHardware(shipment);
            } catch (printErr) {
                console.warn("Hardware print skipped or failed:", printErr);
                // We don't block the UI if physical print fails because PDF is generated
            }

            // Reset Form partial
            setFormData(prev => ({ ...prev, weight: 1, volume: 0.1, packages: 1 }));
            setSelectedClient(null);
            setSearchQuery("");
            setShowPaymentQR(false);

        } catch (err: any) {
            error(err.message || "Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    const handleBarcodeScan = (code: string) => {
        // In a real scenario, this code would be matched against a package or a client ID
        success(`Code scanné : ${code}`);
        setShowScanner(false);
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 relative">
            {showScanner && (
                <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />
            )}

            <QuickClientModal
                isOpen={showQuickClient}
                onClose={() => setShowQuickClient(false)}
                onSuccess={(client) => {
                    setSelectedClient(client);
                    success("Client sélectionné");
                }}
            />

            <PrinterModal
                isOpen={showPrinterSettings}
                onClose={() => setShowPrinterSettings(false)}
            />

            {showOpenSession && (
                <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full text-center space-y-8 shadow-2xl">
                        <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center text-blue-600">
                            <Clock className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-3xl font-black text-slate-900">Ouvrir une Session</h3>
                            <p className="text-slate-500">Veuillez confirmer le fonds de caisse initial.</p>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-left text-sm font-bold text-slate-400 uppercase tracking-widest">Montant Initial (XOF)</label>
                            <input
                                type="number"
                                value={initialCash}
                                onChange={(e) => setInitialCash(Number(e.target.value))}
                                className="w-full p-5 bg-slate-50 rounded-2xl text-2xl font-black text-center outline-none border-2 border-transparent focus:border-blue-500 transition-all"
                                placeholder="0"
                            />
                        </div>
                        <button
                            onClick={handleOpenSession}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
                        >Démarrer la Session</button>
                    </div>
                </div>
            )}

            {showPaymentQR && (
                <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
                    <div className="bg-white rounded-[40px] p-10 max-w-md w-full text-center space-y-8 shadow-2xl animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-2xl font-black text-slate-900">Paiement Mobile</h3>
                            <button onClick={() => setShowPaymentQR(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors" title="Fermer le paiement mobile">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="bg-slate-50 p-8 rounded-3xl flex justify-center">
                            <QRCodeSVG
                                value={`wave:pay?amount=${formData.price}&ref=${activeSession.id}`}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                        </div>

                        <div className="space-y-2">
                            <p className="text-3xl font-black text-slate-900">{formData.price.toLocaleString()} XOF</p>
                            <p className="text-slate-500 font-medium text-sm">Scannez avec Wave ou Orange Money</p>
                        </div>

                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 animate-[progress_10s_linear_infinite] w-full" />
                        </div>

                        <button
                            onClick={handleCreateShipment}
                            className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-3"
                            title="Confirmer la réception du paiement"
                        >
                            <Smartphone className="w-6 h-6" />
                            Confirmer la Réception
                        </button>

                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Attente de confirmation réseau...</p>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 leading-tight">Terminal POS Express</h1>
                    <p className="text-slate-500 font-medium">Agence : Dakar Plateau | Station : 01</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowPrinterSettings(true)}
                        title="Paramètres d'impression"
                        className="p-3 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Active</p>
                        <p className="text-slate-900 font-bold">
                            {profile?.full_name} • {activeSession ? new Date(activeSession.start_time).toLocaleTimeString() : '--:--'}
                        </p>
                    </div>
                    <button
                        title="Fermer la session"
                        onClick={handleCloseSession}
                        className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left Aspect: Client & Config */}
                <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    {/* Client Selection */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">Client</h3>
                        </div>

                        {selectedClient ? (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <p className="font-bold text-slate-900">{selectedClient.full_name}</p>
                                    <p className="text-xs text-slate-500">{selectedClient.phone || selectedClient.email}</p>
                                </div>
                                <button
                                    title="Retirer le client"
                                    onClick={() => setSelectedClient(null)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un client (Nom, Tel...)"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />

                                {searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden">
                                        {searchResults.map(client => (
                                            <button
                                                key={client.id}
                                                onClick={() => setSelectedClient(client)}
                                                className="w-full px-4 py-3 text-left hover:bg-slate-50 flex flex-col border-b last:border-0"
                                            >
                                                <span className="font-bold text-slate-900">{client.full_name}</span>
                                                <span className="text-xs text-slate-500">{client.phone || client.email}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setShowQuickClient(true)}
                            className="w-full py-3 flex items-center justify-center gap-2 text-blue-600 font-bold hover:bg-blue-50 rounded-2xl transition-colors"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Nouveau Client
                        </button>
                    </div>

                    {/* Transport Config */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                                <Package className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-slate-900 text-lg">Transport</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setFormData({ ...formData, transportMode: 'sea' })}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.transportMode === 'sea' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                            >
                                <Calculator className="w-6 h-6" />
                                <span className="font-bold">Maritime</span>
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, transportMode: 'air' })}
                                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.transportMode === 'air' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                            >
                                <Clock className="w-6 h-6" />
                                <span className="font-bold">Aérien</span>
                            </button>
                        </div>
                    </div>

                    {/* Service Level */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-900">Service</h3>
                        <div className="flex gap-2 p-1 bg-slate-50 rounded-[20px]">
                            <button
                                onClick={() => setFormData({ ...formData, serviceType: 'standard' })}
                                className={`flex-1 py-3 rounded-[16px] font-bold text-sm transition-all ${formData.serviceType === 'standard' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                            >Standard</button>
                            <button
                                onClick={() => setFormData({ ...formData, serviceType: 'express' })}
                                className={`flex-1 py-3 rounded-[16px] font-bold text-sm transition-all ${formData.serviceType === 'express' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}
                            >Express (+25%)</button>
                        </div>
                    </div>
                </div>

                {/* Center: Calculations */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex-1 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900">Mesures</h3>
                            <button
                                onClick={() => setShowScanner(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all"
                            >
                                <Scan className="w-4 h-4" />
                                Scanner Code
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                                    {formData.transportMode === 'sea' ? 'Volume (CBM)' : 'Poids (KG)'}
                                </label>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setFormData(f => ({ ...f, weight: Math.max(0, f.weight - 1), volume: Math.max(0, f.volume - 0.1) }))}
                                        className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-900 hover:bg-slate-200"
                                    > - </button>
                                    <input
                                        aria-label={formData.transportMode === 'sea' ? 'Volume en CBM' : 'Poids en KG'}
                                        type="number"
                                        step={formData.transportMode === 'sea' ? "0.1" : "1"}
                                        value={formData.transportMode === 'sea' ? formData.volume : formData.weight}
                                        onChange={(e) => setFormData(f => ({ ...f, [formData.transportMode === 'sea' ? 'volume' : 'weight']: Number(e.target.value) }))}
                                        className="flex-1 h-16 bg-slate-50 border-none rounded-2xl text-center text-3xl font-black text-slate-900 outline-none"
                                    />
                                    <button
                                        onClick={() => setFormData(f => ({ ...f, weight: f.weight + 1, volume: f.volume + 0.1 }))}
                                        className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-2xl text-slate-900 hover:bg-slate-200"
                                    > + </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 block">Nombre de Colis</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {[1, 2, 5, 10].map(n => (
                                        <button
                                            key={n}
                                            onClick={() => setFormData({ ...formData, packages: n })}
                                            className={`py-4 rounded-2xl font-black text-xl border-2 transition-all ${formData.packages === n ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-100 text-slate-400'}`}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Aspect: Total & Pay */}
                <div className="col-span-12 lg:col-span-3 flex flex-col gap-6">
                    <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div>
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Résumé</p>
                                <div className="h-px bg-slate-800 my-4" />
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between font-bold">
                                    <span className="text-slate-400">Transport</span>
                                    <span>{formData.transportMode === 'sea' ? 'Maritime' : 'Aérien'}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span className="text-slate-400">Service</span>
                                    <span className={formData.serviceType === 'express' ? 'text-blue-400' : ''}>{formData.serviceType.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span className="text-slate-400">Mesure</span>
                                    <span>{formData.transportMode === 'sea' ? formData.volume.toFixed(2) + ' CBM' : formData.weight + ' KG'}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span className="text-slate-400">Colis</span>
                                    <span>x{formData.packages}</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-800 my-4" />

                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all ${paymentMethod === 'cash' ? 'border-white bg-white text-slate-900' : 'border-slate-800 text-slate-500'}`}
                                >
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-xs font-bold">Cash</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('mobile')}
                                    className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all ${paymentMethod === 'mobile' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-800 text-slate-500'}`}
                                >
                                    <QrCode className="w-4 h-4" />
                                    <span className="text-xs font-bold">Mobile</span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="text-center">
                                <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">Total à payer</p>
                                <h2 className="text-5xl font-black tracking-tighter">
                                    {formData.price.toLocaleString()} <span className="text-2xl text-slate-500">XOF</span>
                                </h2>
                            </div>

                            <button
                                disabled={loading || !selectedClient}
                                onClick={handleCreateShipment}
                                className="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-3xl font-black text-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {loading ? (
                                    <span className="animate-pulse">Traitement...</span>
                                ) : (
                                    <>
                                        {paymentMethod === 'cash' ? <Save className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
                                        {paymentMethod === 'cash' ? 'Valider' : 'Générer QR'} & Imprimer
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-500">Dernières ventes</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-slate-900">{(activeSession?.sales_count || 0)} ventes</span>
                                <span className="text-blue-600">{(activeSession?.total_sales || 0).toLocaleString()} XOF</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    ref={progressRef}
                                    className="h-full bg-blue-500 transition-all duration-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
