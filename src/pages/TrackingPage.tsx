import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  MapPin,
  ArrowRight,
  AlertCircle,
  QrCode,
  Globe,
  Package,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Navigation,
  Ship,
  Plane,
  Truck,
  Calendar,
  CheckCircle2,
  Timer,
  Activity,
  Waves,
} from "lucide-react";
import QRScannerModal from "../components/common/QRScannerModal";
import { shipmentService } from "../services/shipmentService";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";

interface PublicShipment {
  id: string;
  tracking_number: string;
  status: string;
  origin_port: string;
  destination_port: string;
  origin_country: string;
  destination_country: string;
  departure_date: string;
  arrival_estimated_date: string;
  progress: number;
  events: {
    status: string;
    location: string;
    description: string;
    timestamp: string;
  }[];
}

export default function TrackingPage() {
  const { trackingNumber } = useParams<{ trackingNumber: string }>();
  const [trackingInput, setTrackingInput] = useState(trackingNumber || "");
  const [shipment, setShipment] = useState<PublicShipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trackingNumber) {
      handleSearch(trackingNumber);
    }
  }, [trackingNumber]);

  const handleSearch = async (trackingCode: string) => {
    if (!trackingCode.trim()) {
      setError("Veuillez saisir un numéro de suivi.");
      return;
    }

    setLoading(true);
    setError("");
    setShipment(null);

    try {
      const data = await shipmentService.getShipmentByTracking(trackingCode.trim());

      if (data) {
        setShipment(data);
      } else {
        setError("Aucune expédition trouvée avec ce numéro de suivi.");
      }
    } catch (err) {
      console.error("Tracking Error:", err);
      setError(
        "Une erreur est survenue lors de la recherche. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "from-slate-500 to-slate-600",
    picked_up: "from-orange-500 to-orange-600",
    in_transit: "from-orange-500 to-red-500",
    customs: "from-orange-500 to-amber-600",
    delivered: "from-green-500 to-emerald-600",
    cancelled: "from-red-500 to-red-600",
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    picked_up: "Pris en charge",
    in_transit: "En transit",
    customs: "En douane",
    delivered: "Livré",
    cancelled: "Annulé",
  };

  const getTransportIcon = (index: number) => {
    if (index === 0) return Ship;
    if (index === 1) return Plane;
    return Truck;
  };

  const calculateDaysInTransit = () => {
    if (!shipment?.departure_date) return 0;
    const start = new Date(shipment.departure_date);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateEstimatedDaysRemaining = () => {
    if (!shipment?.arrival_estimated_date) return 0;
    const end = new Date(shipment.arrival_estimated_date);
    const now = new Date();
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  useEffect(() => {
    if (shipment && progressBarRef.current) {
      progressBarRef.current.style.width = `${shipment.progress}%`;
    }
  }, [shipment?.progress, shipment]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col font-sans relative">
      <Helmet>
        <title>
          {shipment
            ? `Suivi ${shipment.tracking_number} - NextMove`
            : "Suivi de Colis - NextMove"}
        </title>
      </Helmet>

      <main className="relative flex-grow pt-24 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Hero Section with Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500/5 dark:bg-orange-500/10 rounded-full border border-orange-500/20 mb-4">
              <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 tracking-wide">
                Suivi GPS en temps réel • Précision à 99.9%
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-none">
              <span className="block text-slate-900 dark:text-white">
                Tracez l'invisible,
              </span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-600 to-red-500">
                pilotez le visible
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
              La logistique mondiale à portée de main. Suivez chaque étape de votre expédition avec une transparence totale et une technologie de pointe.
            </p>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              {[
                { icon: Shield, label: "Sécurisé SSL", color: "text-green-600 dark:text-green-400" },
                { icon: Zap, label: "Temps réel", color: "text-yellow-600 dark:text-yellow-400" },
                { icon: CheckCircle2, label: "99.9% Uptime", color: "text-orange-600 dark:text-orange-400" },
              ].map((badge, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
                >
                  <badge.icon className={`w-4 h-4 ${badge.color}`} />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{badge.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Premium Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="relative">
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-200 dark:border-slate-800 p-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-3 pointer-events-none">
                      <Search className="w-5 h-5 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                      <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <input
                      type="text"
                      value={trackingInput}
                      onChange={(e) => setTrackingInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch(trackingInput)}
                      placeholder="N° de suivi (Ex: TRK-5700812)"
                      className="w-full pl-16 sm:pl-20 pr-48 py-5 bg-transparent text-lg font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium outline-none rounded-2xl transition-all"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowScanner(true)}
                        className="relative group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl shadow-lg shadow-orange-200 dark:shadow-none transition-all duration-300 overflow-hidden"
                        aria-label="Scanner QR Code"
                      >
                        <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 skew-x-12 -translate-x-full" />
                        <QrCode className="w-5 h-5" />
                        <span className="text-sm font-black tracking-tight">Scanner</span>
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping opacity-75" />
                      </motion.button>

                      <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700" />
                      <kbd className="hidden sm:inline-flex px-2 py-1 text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        ⏎
                      </kbd>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSearch(trackingInput)}
                    disabled={loading || !trackingInput}
                    className="relative px-10 py-5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      {loading ? (
                        <>
                          <Activity className="w-5 h-5 animate-spin" />
                          <span>Analyse...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-5 h-5" />
                          <span>Localiser mon colis</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </span>
                  </motion.button>
                </div>

                {/* Quick demo */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-5 pb-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Essayez avec un exemple :
                  </span>
                  <button
                    onClick={() => {
                      setTrackingInput("TRK-5700812");
                      handleSearch("TRK-5700812");
                    }}
                    className="group px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-mono font-black text-slate-700 dark:text-slate-200 transition-all flex items-center gap-2 border border-slate-200 dark:border-slate-700"
                  >
                    <Package className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    TRK-5700812
                    <ArrowRight className="w-3.5 h-3.5 text-orange-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          <QRScannerModal
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={(result) => {
              if (result) {
                const code = result.includes("/tracking/")
                  ? result.split("/tracking/")[1]
                  : result;
                setTrackingInput(code);
                setShowScanner(false);
                handleSearch(code);
              }
            }}
          />

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="max-w-3xl mx-auto"
              >
                <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/20 rounded-3xl p-6 flex items-start gap-5">
                  <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-2xl">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-red-900 dark:text-red-200 mb-2">Expédition introuvable</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {shipment && (
              <motion.div
                key={shipment.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 40 }}
                transition={{ duration: 0.8 }}
                className="space-y-8"
              >
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: Timer, label: "Jours en transit", value: calculateDaysInTransit(), suffix: "jrs", color: "text-orange-600", border: "border-orange-100 dark:border-orange-900/30" },
                    { icon: TrendingUp, label: "Progression", value: shipment.progress, suffix: "%", color: "text-orange-600", border: "border-orange-100 dark:border-orange-900/30" },
                    { icon: Calendar, label: "Jours restants", value: calculateEstimatedDaysRemaining(), suffix: "jrs", color: "text-orange-600", border: "border-orange-100 dark:border-orange-900/30" },
                  ].map((stat, i) => (
                    <div key={i} className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border ${stat.border}`}>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{stat.label}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-4xl font-black text-slate-900 dark:text-white">
                          {stat.value}
                          <span className="text-xl text-slate-400 ml-1">{stat.suffix}</span>
                        </p>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Main Status Card */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${statusColors[shipment.status] || "from-slate-500 to-slate-600"}`} />
                  <div className="p-8 sm:p-12">
                    <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-10">
                      <div className="space-y-8 flex-1">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className={`px-5 py-3 bg-gradient-to-r ${statusColors[shipment.status] || "from-slate-500 to-slate-600"} text-white rounded-2xl font-black text-sm flex items-center gap-3`}>
                            <Package className="w-5 h-5" />
                            <span>{statusLabels[shipment.status] || shipment.status}</span>
                          </div>
                          <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-400 uppercase mr-2 tracking-widest">N°</span>
                            <span className="font-mono font-black text-slate-900 dark:text-white uppercase">{shipment.tracking_number}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="flex-1">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Origine</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{shipment.origin_port}</p>
                            <p className="text-sm text-slate-500 font-bold mt-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />{shipment.origin_country}</p>
                          </div>
                          <div className="flex-shrink-0 p-4 bg-orange-100 dark:bg-orange-900/20 rounded-2xl">
                            <ArrowRight className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="flex-1 text-right">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 text-right">Destination</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{shipment.destination_port}</p>
                            <p className="text-sm text-slate-500 font-bold mt-1 flex items-center justify-end gap-1.5"><MapPin className="w-3.5 h-3.5" />{shipment.destination_country}</p>
                          </div>
                        </div>
                      </div>

                      <div className="hidden xl:block w-px h-32 bg-slate-200 dark:bg-slate-800" />

                      <div className="text-center xl:text-left min-w-[200px]">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Estimation</p>
                        <p className="text-6xl font-black text-orange-600 leading-tight">
                          {shipment.arrival_estimated_date ? new Date(shipment.arrival_estimated_date).getDate() : "--"}
                        </p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white uppercase leading-none">
                          {shipment.arrival_estimated_date ? new Date(shipment.arrival_estimated_date).toLocaleDateString("fr-FR", { month: "long" }) : ""}
                        </p>
                      </div>
                    </div>

                    <div className="mt-12 space-y-8">
                      {/* Advanced Progress Stepper */}
                      <div className="relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${shipment.progress}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${statusColors[shipment.status] || "from-orange-500 to-red-500"}`}
                          />
                        </div>

                        <div className="relative z-10 flex justify-between">
                          {[
                            { id: 'pending', icon: Package, label: "Expédié" },
                            { id: 'picked_up', icon: Truck, label: "Transit" },
                            { id: 'in_transit', icon: Ship, label: "Mer/Air" },
                            { id: 'delivered', icon: MapPin, label: "Arrivée" }
                          ].map((step, i) => {
                            const stepProgress = (i / 3) * 100;
                            const isCompleted = shipment.progress >= stepProgress;
                            const isActive = i === Math.floor((shipment.progress / 100) * 3);

                            return (
                              <div key={step.id} className="flex flex-col items-center gap-3">
                                <motion.div
                                  initial={false}
                                  animate={{
                                    scale: isActive ? 1.2 : 1,
                                    backgroundColor: isCompleted ? (isActive ? "rgb(249 115 22)" : "rgb(22 163 74)") : "rgb(241 245 249)",
                                    borderColor: isCompleted ? "transparent" : "rgb(226 232 240)"
                                  }}
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-lg ${isActive ? "ring-4 ring-orange-500/20" : ""}`}
                                >
                                  <step.icon className={`w-5 h-5 ${isCompleted ? "text-white" : "text-slate-400"}`} />
                                </motion.div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{step.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-4 h-4 text-orange-500" /> Progression Globale
                        </span>
                        <span className="text-xl font-black text-orange-600 font-mono">{shipment.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-orange-600 rounded-2xl"><Waves className="w-6 h-6 text-white" /></div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white">Événements</h3>
                    </div>

                    <div className="space-y-6 relative pl-8">
                      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />
                      {shipment.events && shipment.events.length > 0 ? (
                        shipment.events.map((event, idx) => {
                          const Icon = getTransportIcon(idx);
                          return (
                            <div key={idx} className="relative">
                              <div className={`absolute -left-[2.1rem] top-1.5 w-6 h-6 rounded-lg border-2 border-white dark:border-slate-950 flex items-center justify-center ${idx === 0 ? "bg-orange-600" : "bg-slate-300 dark:bg-slate-700"}`}><Icon className={`w-3 h-3 ${idx === 0 ? "text-white" : "text-white opacity-50"}`} /></div>
                              <div className={`p-5 rounded-2xl border ${idx === 0 ? "bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/20" : "bg-slate-50 dark:bg-slate-800/20 border-transparent"}`}>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                  <h4 className="font-black text-slate-900 dark:text-white">{event.description}</h4>
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(event.timestamp).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest"><MapPin className="w-3.5 h-3.5 text-orange-500" />{event.location}</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-10"><Package className="w-12 h-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400 font-bold">Aucun événement</p></div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                      <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-orange-600" />Détails</h4>
                      {[
                        { label: "Origine", value: shipment.origin_country, icon: Globe },
                        { label: "Destination", value: shipment.destination_country, icon: MapPin },
                        { label: "Départ", value: shipment.departure_date ? new Date(shipment.departure_date).toLocaleDateString("fr-FR", { day: 'numeric', month: 'long', year: 'numeric' }) : "--", icon: Calendar }
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl"><item.icon className="w-5 h-5 text-slate-400" /></div>
                          <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p><p className="text-sm font-black text-slate-900 dark:text-white">{item.value}</p></div>
                        </div>
                      ))}
                    </div>

                    <a href="/contact" className="block p-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-3xl text-center text-white space-y-4">
                      <Sparkles className="w-10 h-10 mx-auto" />
                      <h4 className="text-2xl font-black">Besoin d'aide ?</h4>
                      <p className="text-orange-100 text-sm font-bold leading-relaxed">Assistance PRIORITAIRE 24/7 pour vos expéditions.</p>
                      <div className="pt-2"><span className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-black text-sm">Contacter le support <ArrowRight className="w-4 h-4" /></span></div>
                    </a>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!shipment && !loading && (
            <div className="space-y-24 mt-24">
              {/* How it Works Section */}
              <div className="text-center space-y-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/10 rounded-full border border-orange-100 dark:border-orange-900/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Simplicité Absolue</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Comment ça marche ?</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                  <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-orange-200 dark:via-orange-900 to-transparent border-t-2 border-dashed border-orange-200 dark:border-orange-800" />

                  {[
                    { step: "01", title: "Recherche", desc: "Saisissez votre numéro de suivi unique.", icon: Search },
                    { step: "02", title: "Localisation", desc: "Visualisez la position GPS en temps réel.", icon: MapPin },
                    { step: "03", title: "Réception", desc: "Recevez votre colis en toute sécurité.", icon: Package }
                  ].map((item, i) => (
                    <div key={i} className="relative group">
                      <div className="w-24 h-24 mx-auto bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-slate-800 flex items-center justify-center relative z-10 shadow-xl shadow-slate-200/50 dark:shadow-none transition-transform duration-500 group-hover:scale-110 group-hover:border-orange-500/30">
                        <item.icon className="w-10 h-10 text-orange-600" />
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900 font-black text-xs border-2 border-white dark:border-slate-900">{item.step}</div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-8 mb-2">{item.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium px-8">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile App Showcase */}
              <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-12 md:p-24 text-white">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=2029&auto=format&fit=crop')] opacity-10 bg-cover bg-center" />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-900/50" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-16">
                  <div className="flex-1 space-y-8 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs font-bold text-yellow-100 uppercase tracking-wider">Nouvelle Application</span>
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black leading-tight">
                      Le suivi logistique,<br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">réinventé.</span>
                    </h2>
                    <p className="text-lg text-slate-400 max-w-lg leading-relaxed">
                      Téléchargez l'application NextMove pour des notifications push en temps réel, un suivi hors ligne et une gestion centralisée de vos expéditions.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                      <button className="flex items-center gap-3 px-6 py-3.5 bg-white text-slate-900 rounded-2xl font-bold hover:bg-slate-100 transition-colors">
                        <img src="/assets/app-store-badge-fr.svg" alt="App Store" className="h-6 w-auto" />
                        <span className="sr-only">App Store</span>
                      </button>
                      <button className="flex items-center gap-3 px-6 py-3.5 bg-white/10 text-white rounded-2xl font-bold border border-white/20 hover:bg-white/20 transition-colors backdrop-blur-sm">
                        <img src="/assets/google-play-badge.svg" alt="Google Play" className="h-6 w-auto" />
                        <span className="sr-only">Google Play</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 relative">
                    <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-full" />
                    <img
                      src="/assets/nextmove_mobile_app_mockup_1766599576651.png"
                      alt="NextMove App Interface"
                      className="relative z-10 w-full max-w-sm mx-auto transform rotate-[-6deg] hover:rotate-0 transition-transform duration-700 drop-shadow-2xl"
                    />
                  </div>
                </div>
              </div>

              {/* Global Network Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1 relative rounded-[3rem] overflow-hidden aspect-square lg:aspect-auto lg:h-[600px] group">
                  <img
                    src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop"
                    alt="Global Network"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-slate-900/60 group-hover:bg-slate-900/40 transition-colors duration-500" />
                  <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-orange-600 rounded-xl"><Globe className="w-6 h-6 text-white" /></div>
                      <h3 className="text-2xl font-black text-white">Le Pont Chine-Afrique</h3>
                    </div>
                    <p className="text-slate-300 font-medium leading-relaxed">
                      Leader incontesté du corridor logistique sino-africain. Nous connectons les usines de Guangzhou aux marchés de Dakar, Abidjan et Lagos avec une efficacité redoutable.
                    </p>
                  </div>
                </div>

                <div className="order-1 lg:order-2 space-y-8 lg:pl-10">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                    Une présence <span className="text-orange-600">mondiale</span>, une expertise <span className="text-slate-900 dark:text-white">locale</span>.
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">
                    Notre réseau propriétaire et nos partenaires certifiés nous permettent de garantir des délais imbattables et une sécurité maximale pour vos marchandises, du départ à l'arrivée.
                  </p>

                  <div className="space-y-6">
                    {[
                      { title: "Entrepôts Sécurisés", desc: "Stockage sous surveillance 24/7 à Guangzhou & Yiwu.", icon: Shield },
                      { title: "Dédouanement Express", desc: "Expertise locale pour éviter les blocages administratifs.", icon: CheckCircle2 },
                      { title: "Livraison Dernier Kilomètre", desc: "Flotte dédiée pour une remise en main propre.", icon: Truck }
                    ].map((feat, i) => (
                      <div key={i} className="flex gap-5">
                        <div className="flex-shrink-0 w-12 h-12 bg-orange-50 dark:bg-orange-900/20 rounded-2xl flex items-center justify-center">
                          <feat.icon className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white mb-1">{feat.title}</h4>
                          <p className="text-slate-500 dark:text-slate-400">{feat.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Trust & Certifications */}
              <div className="border-y border-slate-100 dark:border-slate-800 py-16">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white">Ils nous font confiance</h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">Certifications internationales et partenaires stratégiques</p>
                </div>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                  {/* Placeholder logos for verification - using text for now to be safe, or simple icons */}
                  <div className="flex items-center gap-2 text-2xl font-black text-slate-400"><Shield className="w-8 h-8" /> ISO 9001</div>
                  <div className="flex items-center gap-2 text-2xl font-black text-slate-400"><Globe className="w-8 h-8" /> IATA Agent</div>
                  <div className="flex items-center gap-2 text-2xl font-black text-slate-400"><CheckCircle2 className="w-8 h-8" /> Bureauitas</div>
                  <div className="flex items-center gap-2 text-2xl font-black text-slate-400"><Shield className="w-8 h-8" /> PCI DSS</div>
                </div>
              </div>

              {/* Strategic Partners (Marquee style) */}
              <div className="space-y-8 overflow-hidden">
                <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">Nos Partenaires Logistiques Mondiaux</p>
                <div className="flex justify-center flex-wrap gap-x-12 gap-y-8 opacity-50">
                  {["MAERSK", "MSC", "COSCO SHIPPING", "AIR FRANCE KLM", "ETHIOPIAN CARGO", "TURKISH CARGO"].map((partner, i) => (
                    <span key={i} className="text-xl md:text-2xl font-black text-slate-300 dark:text-slate-600 select-none cursor-default hover:text-orange-500 transition-colors duration-300">{partner}</span>
                  ))}
                </div>
              </div>

              {/* Testimonials */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    quote: "Depuis que j'utilise NextMove, mes importations de Guangzhou sont simplifiées. Le suivi est incroyable.",
                    author: "Amadou K.",
                    role: "Grossiste à Dakar",
                    bg: "bg-orange-50 dark:bg-orange-900/10"
                  },
                  {
                    quote: "Une transparence totale. Je sais exactement quand ma marchandise arrive à Abidjan. Un vrai game changer.",
                    author: "Sarah L.",
                    role: "E-commerce à Abidjan",
                    bg: "bg-blue-50 dark:bg-slate-800"
                  },
                  {
                    quote: "Le service client est très réactif. Une vraie équipe de professionnels qui maitrise la chaine logistique.",
                    author: "Jean-Marc D.",
                    role: "Importateur à Paris",
                    bg: "bg-slate-50 dark:bg-slate-900"
                  }
                ].map((t, i) => (
                  <div key={i} className={`p-8 rounded-3xl ${t.bg} border border-transparent hover:border-orange-200 dark:hover:border-orange-900/30 transition-all cursor-crosshair`}>
                    <div className="flex gap-1 mb-6">
                      {[1, 2, 3, 4, 5].map((s) => <Sparkles key={s} className="w-4 h-4 text-orange-500 fill-orange-500" />)}
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mb-6 leading-relaxed">"{t.quote}"</p>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white">{t.author}</p>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pro CTA Section */}
              <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 text-white p-12 md:p-20 text-center md:text-left">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <Package className="w-64 h-64 text-white" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                  <div className="space-y-6 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 rounded-full">
                      <TrendingUp className="w-4 h-4 text-white" />
                      <span className="text-xs font-bold uppercase tracking-wider">Business</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black leading-tight">Vous expédiez du volume ?</h2>
                    <p className="text-xl text-slate-300 font-medium">Rejoignez le programme Business et bénéficiez de tarifs préférentiels, d'un Account Manager dédié et de délais de paiement.</p>
                  </div>
                  <button className="flex-shrink-0 px-8 py-5 bg-white text-orange-600 rounded-2xl font-black text-lg hover:bg-orange-50 transition-colors shadow-2xl shadow-white/10">
                    Ouvrir un Compte Pro
                  </button>
                </div>
              </div>

              <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white">Pourquoi NextMove ?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                  {[
                    { icon: Zap, title: "Rapidité", desc: "Suivi en temps réel ultra-précis" },
                    { icon: Shield, title: "Sécurité", desc: "Données protégées et cryptées" },
                    { icon: TrendingUp, title: "Fiabilité", desc: "Logistique mondiale certifiée" }
                  ].map((f, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
                      <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6"><f.icon className="w-7 h-7 text-orange-600" /></div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{f.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-600 rounded-[3rem] p-12 sm:p-16 text-white text-center">
                <h2 className="text-4xl font-black mb-10">NextMove en chiffres</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { v: "150K+", l: "Expéditions", i: Package },
                    { v: "85+", l: "Pays", i: Globe },
                    { v: "99.9%", l: "Clients", i: CheckCircle2 },
                    { v: "24/7", l: "Support", i: Shield }
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                      <s.i className="w-8 h-8 mx-auto mb-2 opacity-60" />
                      <p className="text-4xl font-black">{s.v}</p>
                      <p className="text-xs font-bold uppercase tracking-widest opacity-80">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-black text-center mb-10">FAQ</h2>
                <div className="space-y-4">
                  {[
                    { q: "Mise à jour ?", a: "Toutes les 15 minutes." },
                    { q: "Multi-colis ?", a: "Gérez tout via votre compte." },
                    { q: "Modifier la livraison ?", a: "Possible jusqu'à 24h avant l'arrivée." },
                    { q: "Facturation ?", a: "Disponibles instantanément dans votre espace client." }
                  ].map((faq, i) => (
                    <div key={i} className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <h3 className="font-black text-slate-900 dark:text-white mb-2">{faq.q}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
