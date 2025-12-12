import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Search,
  Package,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import QRScannerModal from "../components/common/QRScannerModal";

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
  const { code } = useParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [trackingInput, setTrackingInput] = useState(code || "");
  const [shipment, setShipment] = useState<PublicShipment | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Effect to handle URL param search
  useEffect(() => {
    if (code) {
      handleSearch(code);
    }
  }, [code]);

  const handleSearch = async (trackingCode: string) => {
    if (!trackingCode.trim()) return;

    setLoading(true);
    setError(null);
    setShipment(null);

    try {
      const { data, error } = await supabase.rpc(
        "get_public_shipment_tracking",
        { tracking_code_input: trackingCode.trim() },
      );

      if (error) throw error;

      if (data && data.length > 0) {
        setShipment(data[0]);
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
    pending: "bg-slate-500",
    picked_up: "bg-blue-500",
    in_transit: "bg-indigo-500",
    customs: "bg-orange-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
  };

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    picked_up: "Pris en charge",
    in_transit: "En transit",
    customs: "En douane",
    delivered: "Livré",
    cancelled: "Annulé",
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (shipment && progressBarRef.current) {
      progressBarRef.current.style.width = `${shipment.progress}%`;
    }
  }, [shipment?.progress, shipment]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col font-sans">
      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Header & Search */}
          <div className="text-center space-y-6">
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Suivre votre <span className="text-blue-600">Colis</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-lg">
              Entrez votre numéro de suivi (ex: NMC-2025-XYZ) pour consulter
              l'état de votre expédition en temps réel.
            </p>

            <div className="max-w-xl mx-auto relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSearch(trackingInput)
                }
                placeholder="Numéro de suivi..."
                className="block w-full pl-12 pr-32 py-5 bg-white dark:bg-gray-800 border-2 border-slate-100 dark:border-gray-700 rounded-2xl text-lg shadow-xl shadow-slate-200/50 dark:shadow-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
              <div className="absolute right-2 top-2 bottom-2 flex gap-2">
                <button
                  onClick={() => setShowScanner(true)}
                  className="aspect-square h-full bg-slate-100 hover:bg-slate-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center transition-all"
                  aria-label="Scanner un QR Code"
                >
                  <QrCode className="w-6 h-6" />
                </button>
                <button
                  onClick={() => handleSearch(trackingInput)}
                  disabled={loading || !trackingInput}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? <Clock className="animate-spin" /> : "Suivre"}
                </button>
              </div>
            </div>
          </div>

          <QRScannerModal
            isOpen={showScanner}
            onClose={() => setShowScanner(false)}
            onScan={(result) => {
              if (result) {
                // Extract code from URL if it's a full URL scan
                const code = result.includes("/tracking/")
                  ? result.split("/tracking/")[1]
                  : result;
                setTrackingInput(code);
                setShowScanner(false);
                handleSearch(code);
              }
            }}
          />

          {/* Result Area */}
          {error && (
            <div className="max-w-xl mx-auto bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-6 rounded-2xl flex items-center gap-4 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="w-8 h-8 flex-shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {shipment && (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
              {/* Status Banner */}
              <div className="bg-slate-50 dark:bg-gray-800/50 p-6 sm:p-10 border-b border-slate-100 dark:border-gray-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider ${statusColors[shipment.status] || "bg-slate-500"}`}
                      >
                        {statusLabels[shipment.status] || shipment.status}
                      </span>
                      <span className="text-slate-400 text-sm font-mono">
                        {shipment.tracking_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                      <span>{shipment.origin_port}</span>
                      <ArrowRight className="text-slate-300" />
                      <span>{shipment.destination_port}</span>
                    </div>
                  </div>

                  <div className="text-right hidden md:block">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      Estimation d'arrivée
                    </p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {shipment.arrival_estimated_date
                        ? new Date(
                            shipment.arrival_estimated_date,
                          ).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Non définie"}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-8">
                  <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                    <span>Départ</span>
                    <span>Arrivée</span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                    <div
                      ref={progressBarRef}
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                    >
                      <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Timeline */}
                <div className="lg:col-span-2 space-y-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-500" />
                    Historique des événements
                  </h3>

                  <div className="relative pl-4 border-l-2 border-slate-100 dark:border-gray-700 space-y-8">
                    {shipment.events && shipment.events.length > 0 ? (
                      shipment.events.map((event, idx) => (
                        <div key={idx} className="relative pl-6 pb-2">
                          {/* Dot */}
                          <div
                            className={`absolute -left-[21px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-gray-800 ${idx === 0 ? "bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/30" : "bg-slate-300 dark:bg-gray-600"}`}
                          ></div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <h4
                                className={`font-bold text-lg ${idx === 0 ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"}`}
                              >
                                {event.description}
                              </h4>
                              <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {event.location}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {new Date(event.timestamp).toLocaleDateString(
                                "fr-FR",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-slate-400 text-sm italic pl-6">
                        Aucun événement enregistré.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    Détails
                  </h3>

                  <div className="bg-slate-50 dark:bg-gray-800/50 rounded-2xl p-6 space-y-4">
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">
                        Origine
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {shipment.origin_country || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">
                        Destination
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {shipment.destination_country || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mb-1">
                        Date de départ
                      </p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {shipment.departure_date
                          ? new Date(
                              shipment.departure_date,
                            ).toLocaleDateString("fr-FR")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                      Besoin d'aide ?
                    </h4>
                    <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mb-4">
                      Si vous avez des questions concernant votre expédition,
                      n'hésitez pas à nous contacter.
                    </p>
                    <a
                      href="/contact"
                      className="text-blue-600 dark:text-blue-400 font-bold text-sm hover:underline"
                    >
                      Contacter le support &rarr;
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
