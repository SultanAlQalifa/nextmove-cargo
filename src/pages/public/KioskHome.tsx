import { useState } from "react";
import { Link } from "react-router-dom";
import {
    Scan,
    UserPlus,
    ChevronRight,
    HelpCircle,
    Package,
    CheckCircle2,
    Clock,
    ArrowRight
} from "lucide-react";
import { shipmentService } from "../../services/shipmentService";
import { useToast } from "../../contexts/ToastContext";

export default function KioskHome() {
    const [trackingNumber, setTrackingNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [shipment, setShipment] = useState<any>(null);
    const { error } = useToast();

    const handleTrack = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!trackingNumber) return;

        setLoading(true);
        setShipment(null);
        try {
            const result = await shipmentService.getShipmentByTracking(trackingNumber);
            if (result) {
                setShipment(result);
            } else {
                error("Expédition non trouvée. Vérifiez le numéro.");
            }
        } catch (err: any) {
            error("Erreur technique lors de la recherche.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]" />

            <div className="w-full max-w-4xl z-10 flex flex-col items-center text-center space-y-12">
                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20">
                            <Package className="w-8 h-8" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter">
                            NEXTMOVE <span className="text-blue-500">KIOSK</span>
                        </h1>
                    </div>
                    <p className="text-xl text-slate-400 font-medium">Suivez vos colis ou créez votre compte en un instant.</p>
                </div>

                {shipment ? (
                    <div className="w-full bg-white text-slate-900 rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-start mb-8">
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Numéro de suivi</p>
                                <h2 className="text-2xl font-black">{shipment.tracking_number}</h2>
                            </div>
                            <div className={`px-4 py-2 rounded-xl font-bold text-sm ${shipment.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {shipment.status.toUpperCase()}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Trajet</p>
                                <p className="font-bold">{shipment.origin_city || shipment.origin_country} → {shipment.destination_city || shipment.destination_country}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Détails</p>
                                <p className="font-bold">{shipment.cargo_weight || 0} KG | {shipment.cargo_volume || 0} CBM</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Estimation</p>
                                <p className="font-bold">{shipment.arrival_estimated_date ? new Date(shipment.arrival_estimated_date).toLocaleDateString() : 'A confirmer'}</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            {/* Timeline simple */}
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left border-b border-slate-100 pb-2">
                                    <p className="font-bold">Colis Reçu</p>
                                    <p className="text-sm text-slate-500">Traitement en entrepôt effectué.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 opacity-40">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold">En Transit</p>
                                    <p className="text-sm">En cours d'acheminement vers la destination.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShipment(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                        >
                            Rechercher un autre colis
                        </button>
                    </div>
                ) : (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Tracking Card */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[40px] p-8 space-y-8 flex flex-col justify-between">
                            <div className="text-left space-y-4">
                                <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500">
                                    <Scan className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-black">Suivi Instantané</h3>
                                <p className="text-slate-400 font-medium">Entrez votre numéro ou scannez votre code barre.</p>
                            </div>

                            <form onSubmit={handleTrack} className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Ex: NMC-2023-XXXX"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                                        className="w-full bg-white/10 border-2 border-white/5 rounded-2xl px-6 py-5 text-xl font-black placeholder:text-white/20 outline-none focus:border-blue-500 focus:bg-white/20 transition-all uppercase"
                                    />
                                    <button
                                        disabled={loading}
                                        type="submit"
                                        className="absolute right-3 top-3 bottom-3 px-6 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-500 transition-all flex items-center gap-2"
                                    >
                                        {loading ? "..." : <ArrowRight className="w-6 h-6" />}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl font-bold text-white/50 flex items-center justify-center gap-3 hover:border-white/40 hover:text-white transition-all"
                                >
                                    <Scan className="w-5 h-5" />
                                    Scanner mon Reçu
                                </button>
                            </form>
                        </div>

                        {/* Quick Actions Card */}
                        <div className="grid grid-cols-1 gap-6">
                            <Link
                                to="/register"
                                className="bg-blue-600 rounded-[40px] p-8 text-left group hover:scale-[1.02] transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 text-white/10 group-hover:scale-125 transition-transform">
                                    <UserPlus className="w-32 h-32" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        <UserPlus className="w-6 h-6 text-white" />
                                    </div>
                                    <h3 className="text-2xl font-black">Devenir Client</h3>
                                    <p className="text-blue-100 font-medium max-w-[200px]">Inscrivez-vous en 30 secondes pour expédier.</p>
                                    <div className="flex items-center gap-2 font-bold bg-white/20 w-fit px-4 py-2 rounded-full">
                                        Commencer <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </Link>

                            <Link
                                to="/calculator"
                                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[40px] p-8 text-left flex items-center justify-between group hover:bg-white/10 transition-all"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-slate-300">
                                        <HelpCircle className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold">Besoin d'aide ?</h4>
                                        <p className="text-slate-400">Tarifs et simulateur</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Footer info */}
                <div className="pt-8 text-slate-500 font-bold text-sm tracking-widest flex items-center gap-8">
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> KIOSK MODE ACTIVE</span>
                    <span>v1.2.0</span>
                    <span>SECURED BY NEXTMOVE</span>
                </div>
            </div>
        </div>
    );
}
