import { useState, useEffect } from "react";
import { X, Printer, Bluetooth, RefreshCw, CheckCircle2, AlertCircle, Unlink } from "lucide-react";
import { printService, PrinterDevice } from "../../services/printService";
import { useToast } from "../../contexts/ToastContext";

interface PrinterModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PrinterModal({ isOpen, onClose }: PrinterModalProps) {
    const { success: showSuccess, error: showError } = useToast();
    const [scanning, setScanning] = useState(false);
    const [connecting, setConnecting] = useState(null as string | null);
    const [devices, setDevices] = useState<PrinterDevice[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [activeAddress, setActiveAddress] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            checkStatus();
        }
    }, [isOpen]);

    const checkStatus = async () => {
        const connected = await printService.isConnected();
        setIsConnected(connected);
        if (connected) {
            setActiveAddress(localStorage.getItem('last_printer_address'));
        }
    };

    const handleScan = async () => {
        setScanning(true);
        try {
            const found = await printService.scan();
            setDevices(found);
            if (found.length === 0) {
                showError("Aucune imprimante Bluetooth trouvée");
            } else {
                showSuccess(`${found.length} imprimante(s) trouvée(s)`);
            }
        } catch (error) {
            showError("Erreur lors du scan Bluetooth");
        } finally {
            setScanning(false);
        }
    };

    const handleConnect = async (address: string) => {
        setConnecting(address);
        try {
            const ok = await printService.connect(address);
            if (ok) {
                showSuccess("Imprimante connectée !");
                setIsConnected(true);
                setActiveAddress(address);
                onClose();
            } else {
                showError("Échec de la connexion");
            }
        } catch (error) {
            showError("Erreur Bluetooth");
        } finally {
            setConnecting(null);
        }
    };

    const handleDisconnect = async () => {
        await printService.disconnect();
        setIsConnected(false);
        setActiveAddress(null);
        showSuccess("Imprimante déconnectée");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <Printer className="w-6 h-6" />
                        <h3 className="text-xl font-bold">Imprimantes Thermiques</h3>
                    </div>
                    <button
                        onClick={onClose}
                        title="Fermer"
                        className="text-white/80 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {isConnected ? (
                        <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-500/20 rounded-2xl p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white">Imprimante Connectée</h4>
                                <p className="text-sm text-slate-500 truncate">{activeAddress}</p>
                            </div>
                            <button
                                onClick={handleDisconnect}
                                title="Déconnecter l'imprimante"
                                className="flex items-center justify-center gap-2 mx-auto text-red-600 font-bold hover:bg-red-50 p-2 rounded-lg transition-colors"
                            >
                                <Unlink className="w-4 h-4" />
                                Déconnecter
                            </button>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center space-y-4">
                            <Bluetooth className="w-12 h-12 text-slate-300 mx-auto" />
                            <div className="space-y-1">
                                <p className="font-bold text-slate-400">Prêt pour l'appairage</p>
                                <p className="text-xs text-slate-500">Activez le Bluetooth sur votre imprimante 80mm</p>
                            </div>
                            <button
                                onClick={handleScan}
                                disabled={scanning}
                                title="Lancer la recherche"
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-2 mx-auto hover:bg-blue-500 transition-all disabled:opacity-50"
                            >
                                {scanning ? <RefreshCw className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                Lancer la recherche
                            </button>
                        </div>
                    )}

                    {!isConnected && devices.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Appareils trouvés</h4>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {devices.map((device) => (
                                    <button
                                        key={device.address}
                                        onClick={() => handleConnect(device.address)}
                                        disabled={connecting !== null}
                                        title={`Se connecter à ${device.name}`}
                                        className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-blue-500 transition-all group"
                                    >
                                        <div className="text-left">
                                            <p className="font-bold text-slate-900 dark:text-white">{device.name}</p>
                                            <p className="text-xs text-slate-500">{device.address}</p>
                                        </div>
                                        {connecting === device.address ? (
                                            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                                        ) : (
                                            <Bluetooth className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-4 rounded-r-xl flex gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
                            Note : Assurez-vous que l'imprimante est allumée et non connectée à un autre appareil. Supporte les modèles ESC/POS de 58mm ou 80mm.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
