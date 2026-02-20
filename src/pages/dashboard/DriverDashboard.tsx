import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useCurrency } from "../../contexts/CurrencyContext";
import { shipmentService } from "../../services/shipmentService";
import { supabase } from "../../lib/supabase";
import PageHeader from "../../components/common/PageHeader";
import DashboardControls from "../../components/dashboard/DashboardControls";
import QRScannerModal from "../../components/common/QRScannerModal";
import {
  Truck,
  MapPin,
  CheckCircle,
  Camera,
  Navigation,
  Package,
  Clock,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Star,
  X,
  Loader2,
} from "lucide-react";
import { storageService } from "../../services/storageService";

export default function DriverDashboard() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const { currency } = useCurrency();

  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [podForm, setPodForm] = useState({
    recipient_name: "",
    notes: "",
    photo: null as File | null,
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [activeTrackingShipment, setActiveTrackingShipment] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (user) loadShipments();
  }, [user]);

  const loadShipments = async () => {
    try {
      const data = await shipmentService.getShipmentsForDriver(user!.id);
      setShipments(data || []);
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const simulateMission = async () => {
    if (!user) return;
    setSimulating(true);
    try {
      const { error } = await supabase.from("shipments").insert({
        tracking_number: "TRK-" + Math.floor(Math.random() * 1000000),
        client_id: user.id,
        forwarder_id: user.id,
        driver_id: user.id,
        origin_country: "China",
        destination_country: "Senegal",
        status: "in_transit",
        transport_mode: "sea",
        service_type: "standard",
        package_type: "box",
        weight_kg: 50,
        volume_cbm: 0.5,
        price: 150000,
        currency: currency || "XOF",
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      await loadShipments();
      await loadShipments();
      success("Mission de test générée avec succès !");
    } catch (error: any) {
      console.error("Error simulating mission:", error);
      toastError(`Erreur: ${error.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleGeolocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          success("Localisation capturée avec succès !");
        },
        (error) => {
          console.error("Error getting location:", error);
          toastError("Impossible de récupérer la localisation.");
        },
      );
    } else {
      toastError("Géolocalisation non supportée.");
    }
  };

  const handleSubmitPOD = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !location) {
      toastError("Veuillez d'abord capturer la localisation.");
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl = "";
      if (podForm.photo) {
        photoUrl = await storageService.uploadPODPhoto(selectedShipment.id, podForm.photo);
      }

      await shipmentService.submitPOD({
        shipment_id: selectedShipment.id,
        photo_urls: photoUrl ? [photoUrl] : [],
        recipient_name: podForm.recipient_name,
        delivered_at: new Date().toISOString(),
        latitude: location.lat,
        longitude: location.lng,
        driver_notes: podForm.notes,
      });

      success("POD soumis avec succès !");
      setSelectedShipment(null);
      setPodForm({ recipient_name: "", notes: "", photo: null });
      setLocation(null);
      loadShipments();
    } catch (error) {
      console.error("Error submitting POD:", error);
      toastError("Échec de la soumission du POD.");
    } finally {
      setSubmitting(false);
    }
  };

  const startTracking = (shipmentId: string) => {
    if (watchId) return;

    setIsTracking(true);
    setActiveTrackingShipment(shipmentId);

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        shipmentService.sendGPSUpdate(shipmentId, pos.coords.latitude, pos.coords.longitude)
          .catch(err => console.error("GPS Update failed", err));
      },
      (err) => {
        console.error("GPS Watch failed", err);
        toastError("Erreur GPS : " + err.message);
        stopTracking();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
    setWatchId(id);
    success("Suivi GPS activé ! Votre position sera partagée en temps réel.");
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
    setActiveTrackingShipment(null);
    success("Suivi GPS désactivé.");
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [watchId]);

  // Stats
  const activeDeliveries = shipments.filter(
    (s) => s.status === "in_transit",
  ).length;
  const completedDeliveries = shipments.filter(
    (s) => s.status === "delivered",
  ).length;

  const handleScanResult = (decodedText: string) => {
    // decodedText is expected to be the tracking number
    const found = shipments.find(
      (s) =>
        s.tracking_number === decodedText ||
        decodedText.includes(s.tracking_number),
    );
    if (found) {
      setSelectedShipment(found);
      // toastError(`Colis trouvé: ${found.tracking_number}`);
    } else {
      toastError(`Aucun colis trouvé pour le code: ${decodedText}`);
    }
  };

  // Filter shipments
  const filteredShipments = shipments.filter(
    (s) =>
      s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.destination_country.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de Bord Chauffeur"
        subtitle="Gérez vos livraisons et preuves de livraison."
        action={{
          label: "Scanner un Colis",
          onClick: () => setIsScannerOpen(true),
          icon: Camera,
        }}
      />

      <DashboardControls
        timeRange="30d"
        setTimeRange={() => { }}
        showTimeRange={false}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Rechercher une livraison..."
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 text-green-600 bg-green-50">
              <ArrowUpRight className="w-3 h-3" /> En cours
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            Livraisons Actives
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {activeDeliveries}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 text-green-600 bg-green-50">
              <ArrowUpRight className="w-3 h-3" /> Aujourd'hui
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Livrées</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {completedDeliveries}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
              <Star className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 text-green-600 bg-green-50">
              <ArrowUpRight className="w-3 h-3" /> Top
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Note Moyenne</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">4.9</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : selectedShipment ? (
        // POD Form View
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Confirmation de Livraison (POD)
            </h2>
            <button
              onClick={() => setSelectedShipment(null)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipment Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                  Détails Expédition
                </p>
                <p className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedShipment.tracking_number}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="font-medium">
                      {selectedShipment.destination_country}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="font-medium">
                      {selectedShipment.package_type} •{" "}
                      {selectedShipment.weight_kg}kg
                    </span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                  Client
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-500 text-lg">
                    {selectedShipment.client?.full_name?.[0] || "C"}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {selectedShipment.client?.full_name || "Client Inconnu"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedShipment.client?.phone || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmitPOD} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom du réceptionnaire
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary py-3 px-4 transition-all"
                      placeholder="Qui reçoit le colis ?"
                      value={podForm.recipient_name}
                      onChange={(e) =>
                        setPodForm({
                          ...podForm,
                          recipient_name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Géolocalisation
                    </label>
                    <button
                      type="button"
                      onClick={handleGeolocation}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white transition-all transform active:scale-95 ${location ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                    >
                      {location ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Navigation size={18} />
                      )}
                      {location ? "Position Validée" : "Capturer Position GPS"}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mt-1">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      {...({ capture: "environment" } as any)}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setPodForm({ ...podForm, photo: file });
                      }}
                    />
                    <label
                      htmlFor="photo-upload"
                      className={`flex justify-center px-6 pt-8 pb-8 border-2 border-dashed rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer group ${podForm.photo ? "border-green-500 bg-green-50/50" : "border-gray-200"}`}
                    >
                      <div className="space-y-2 text-center">
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all ${podForm.photo ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 group-hover:text-primary"}`}>
                          {podForm.photo ? <CheckCircle className="h-6 w-6" /> : <Camera className="h-6 w-6" />}
                        </div>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <span className="relative font-medium text-primary hover:text-blue-500">
                            {podForm.photo ? "Changer la photo" : "Prendre une photo"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {podForm.photo ? podForm.photo.name : "PNG, JPG jusqu'à 10MB"}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes / Signature
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border-gray-200 bg-gray-50 focus:bg-white focus:border-primary focus:ring-primary py-3 px-4 transition-all"
                    placeholder="Commentaires sur la livraison..."
                    value={podForm.notes}
                    onChange={(e) =>
                      setPodForm({ ...podForm, notes: e.target.value })
                    }
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-primary/30 text-sm font-bold text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        "Valider Livraison"
                      )}
                    </button>

                    {simulating && (
                      <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Simulation...
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        // Shipment List View
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">
              Missions en cours
            </h3>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                Aucune mission trouvée
              </h3>
              <p className="text-gray-500 mt-2 mb-6">
                {searchQuery
                  ? "Aucun résultat pour votre recherche."
                  : "Vous n'avez pas de livraison assignée pour le moment."}
              </p>
              {!searchQuery && (
                <button
                  onClick={simulateMission}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Générer une mission de test
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="group hover:bg-gray-50/50 transition-colors p-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">
                            {shipment.tracking_number}
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                            {shipment.transport_mode === "sea"
                              ? "Maritime"
                              : "Aérien"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{" "}
                            {shipment.destination_country}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{" "}
                            {new Date(shipment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      {isTracking && activeTrackingShipment === shipment.id ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); stopTracking(); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                          Arrêter Suivi
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); startTracking(shipment.id); }}
                          disabled={shipment.status === 'delivered'}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          <Navigation className="w-4 h-4" />
                          Suivi Live
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedShipment(shipment)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        Gérer
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanResult}
      />
    </div>
  );
}
