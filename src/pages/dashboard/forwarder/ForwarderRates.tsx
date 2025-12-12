import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import AddShipmentModal from "../../../components/dashboard/AddShipmentModal";
import {
  Anchor,
  Send,
  Edit2,
  Plus,
  Trash2,
  ArrowRight,
  Globe,
  AlertCircle,
  X,
  Search,
  Save,
  Loader2,
  Settings,
  Package,
} from "lucide-react";
import {
  forwarderRateService,
  ForwarderRate,
} from "../../../services/forwarderRateService";
import { locationService, Location } from "../../../services/locationService";
import { profileService, UserProfile } from "../../../services/profileService";
import { useAuth } from "../../../contexts/AuthContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import {
  formatCurrency,
  convertCurrency,
} from "../../../utils/currencyFormatter";

// Matrix Configuration Types
type RateType = "standard" | "express";
type RateMode = "sea" | "air";

interface MatrixRate {
  id?: string; // If editing an existing one
  price: number | string;
  min_days: number | string;
  max_days: number | string;
  insurance_rate: number;
  unit: "kg" | "cbm";
  auto_quote: boolean;
}

interface RatesMatrix {
  "sea-standard": MatrixRate;
  "sea-express": MatrixRate;
  "air-standard": MatrixRate;
  "air-express": MatrixRate;
}

const DEFAULT_MATRIX: RatesMatrix = {
  "sea-standard": {
    price: 0,
    min_days: 30,
    max_days: 45,
    insurance_rate: 0.05,
    unit: "cbm",
    auto_quote: false,
  },
  "sea-express": {
    price: 0,
    min_days: 15,
    max_days: 30,
    insurance_rate: 0.07,
    unit: "cbm",
    auto_quote: false,
  },
  "air-standard": {
    price: 0,
    min_days: 5,
    max_days: 10,
    insurance_rate: 0.08,
    unit: "kg",
    auto_quote: false,
  },
  "air-express": {
    price: 0,
    min_days: 2,
    max_days: 5,
    insurance_rate: 0.1,
    unit: "kg",
    auto_quote: false,
  },
};

export default function ForwarderRates() {
  const { user } = useAuth();
  const { currency: currentCurrency } = useCurrency();

  // Data State
  const [rates, setRates] = useState<ForwarderRate[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShipmentModalOpen, setIsShipmentModalOpen] = useState(false);
  const [shipmentInitialData, setShipmentInitialData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Route Configuration
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");
  const [selectedDest, setSelectedDest] = useState<string>("");

  // Matrix State
  const [matrix, setMatrix] = useState<RatesMatrix>(
    JSON.parse(JSON.stringify(DEFAULT_MATRIX)),
  );

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ratesData, locationsData, profileData] = await Promise.all([
        forwarderRateService.getMyRates(),
        locationService.getLocations(),
        profileService.getProfile(user.id),
      ]);
      setRates(ratesData);
      setLocations(locationsData);
      setUserProfile(profileData);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // When Route changes via Edit/Create, try to autofill existing rates
  useEffect(() => {
    if (!isModalOpen) return;

    // Find matches in existing rates for the NEW selection
    const matches = rates.filter(
      (r) =>
        (r.origin_id || "") === selectedOrigin &&
        (r.destination_id || "") === selectedDest,
    );

    setMatrix((prevMatrix) => {
      // Use current matrix as base to PRESERVE values when switching to an empty route (Template/Clone behavior)
      const nextMatrix = JSON.parse(JSON.stringify(prevMatrix));

      (Object.keys(nextMatrix) as Array<keyof RatesMatrix>).forEach((key) => {
        const [mode, type] = key.split("-");
        const match = matches.find((r) => r.mode === mode && r.type === type);

        if (match) {
          // Found existing rate for new route -> Load it (with its ID)
          nextMatrix[key] = {
            id: match.id,
            price: match.price,
            min_days: match.min_days,
            max_days: match.max_days,
            insurance_rate: match.insurance_rate,
            unit: match.unit,
            auto_quote: match.auto_quote || false,
          };
        }
        // Else: No match. Keep current values AND current ID (Move/Update mode), or no ID (Add mode).
      });

      return nextMatrix;
    });
  }, [selectedOrigin, selectedDest, isModalOpen, rates]);

  const handleOpenCreate = () => {
    setSelectedOrigin("");
    setSelectedDest("");
    setMatrix(JSON.parse(JSON.stringify(DEFAULT_MATRIX)));
    setIsModalOpen(true);
  };

  const handleOpenShipment = (rate: ForwarderRate) => {
    setShipmentInitialData({
      origin_country: rate.origin?.name,
      destination_country: rate.destination?.name,
      transport_mode: rate.mode,
      service_type: rate.type,
      origin_id: rate.origin_id,
      destination_id: rate.destination_id,
      rate_id: rate.id,
    });
    setIsShipmentModalOpen(true);
  };

  const handleEditRoute = (originId: string, destId: string) => {
    setSelectedOrigin(originId || "");
    setSelectedDest(destId || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const promises = [];

      // Iterate over matrix and save each non-empty rate
      for (const key of Object.keys(matrix) as Array<keyof RatesMatrix>) {
        const item = matrix[key];
        const [mode, type] = key.split("-") as [RateMode, RateType];

        // Skip if current user doesn't support this mode (security check)
        if (
          userProfile?.transport_modes &&
          !userProfile.transport_modes.includes(mode)
        )
          continue;

        // Fix Payload Preparation: Ensure strings are converted to numbers or defaults.
        const price = item.price === "" ? 0 : Number(item.price);
        const min_days = item.min_days === "" ? 0 : Number(item.min_days);
        const max_days = item.max_days === "" ? 0 : Number(item.max_days);

        // Skip if price is 0 (assume user doesn't want to set this rate) AND no ID (not updating)
        if (price <= 0 && !item.id) continue;

        const payload = {
          mode,
          type,
          price,
          min_days,
          max_days,
          insurance_rate: item.insurance_rate,
          unit: item.unit,
          currency: currentCurrency, // Use the currency the user is seeing
          auto_quote: item.auto_quote,
          origin_id: selectedOrigin || null,
          destination_id: selectedDest || null,
        };

        const cleanPayload = {
          ...payload,
          origin_id: payload.origin_id || undefined,
          destination_id: payload.destination_id || undefined,
        };

        if (item.id) {
          promises.push(forwarderRateService.updateRate(item.id, cleanPayload));
        } else {
          promises.push(forwarderRateService.createRate(cleanPayload as any));
        }
      }

      await Promise.all(promises);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la sauvegarde. Vérifiez les champs.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await forwarderRateService.deleteRate(deleteId);
      fetchData();
    } catch (err) {
      setError("Erreur lors de la suppression.");
    } finally {
      setSaving(false);
      setDeleteId(null);
    }
  };

  const filteredRates = rates.filter((rate) => {
    const searchLower = searchTerm.toLowerCase();
    const originName = rate.origin?.name || "Global";
    const destName = rate.destination?.name || "Global";
    // Only show rates for modes the user supports
    return (
      originName.toLowerCase().includes(searchLower) ||
      destName.toLowerCase().includes(searchLower) ||
      rate.mode.includes(searchLower)
    );
  });

  const updateMatrixItem = (
    key: keyof RatesMatrix,
    field: keyof MatrixRate,
    value: any,
  ) => {
    setMatrix((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  const userModes = userProfile?.transport_modes || [];
  const hasSea = userModes.includes("sea");
  const hasAir = userModes.includes("air");

  // If no modes configured yet
  if (!loading && !hasSea && !hasAir) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Configurez vos services
        </h3>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
          Pour définir vos tarifs, vous devez d'abord activer les modes de
          transport (Maritime / Aérien) que vous proposez dans vo paramètres.
        </p>
        <Link
          to="/dashboard/forwarder/settings?tab=profile"
          className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <Settings size={18} />
          Aller aux Paramètres
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Supprimer le tarif"
        message="Êtes-vous sûr de vouloir supprimer ce tarif ? Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="danger"
        isLoading={saving}
      />

      <PageHeader
        title="Mes Tarifs Standards"
        action={{
          label: "Ajouter une Route",
          icon: Plus,
          onClick: handleOpenCreate,
        }}
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          aria-label="Rechercher une route"
          placeholder="Rechercher une route..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                    Route
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                    Mode / Type
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                    Prix
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase">
                    Délai
                  </th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-500">
                      Aucun tarif défini pour le moment.
                    </td>
                  </tr>
                ) : (
                  filteredRates.map((rate) => {
                    const convertedPrice = convertCurrency(
                      rate.price,
                      rate.currency,
                      currentCurrency,
                    );
                    const isGlobal = !rate.origin_id && !rate.destination_id;

                    return (
                      <tr
                        key={rate.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4">
                          {isGlobal ? (
                            <div className="flex items-center gap-2 text-purple-600 bg-purple-50 w-fit px-3 py-1 rounded-full text-xs font-bold">
                              <Globe size={14} />
                              <span>Global</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 font-medium text-gray-900">
                              <span>{rate.origin?.name || "Toutes"}</span>
                              <ArrowRight size={14} className="text-gray-400" />
                              <span>{rate.destination?.name || "Toutes"}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {rate.mode === "sea" ? (
                              <Anchor className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Send className="w-4 h-4 text-orange-600 rotate-[-45deg]" />
                            )}
                            <span className="capitalize text-sm font-medium">
                              {rate.mode}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${rate.type === "express" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600"}`}
                            >
                              {rate.type}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-mono font-bold text-gray-900">
                            {formatCurrency(convertedPrice, currentCurrency)}
                            <span className="text-gray-400 text-xs font-normal">
                              /{rate.unit}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {rate.min_days}-{rate.max_days}j
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              aria-label="Créer une expédition"
                              title="Créer une expédition pour ce tarif"
                              onClick={() => handleOpenShipment(rate)}
                              className="p-2 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600 transition-colors"
                            >
                              <Package size={16} />
                            </button>
                            <button
                              aria-label="Modifier"
                              onClick={() =>
                                handleEditRoute(
                                  rate.origin_id || "",
                                  rate.destination_id || "",
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              aria-label="Supprimer"
                              onClick={() => handleDelete(rate.id)}
                              className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Matrix Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" /> : <Globe />}
                Configuration Tarifaire
              </h3>
              <button
                aria-label="Fermer"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Route Selection */}
              <div className="p-5 bg-purple-50 rounded-2xl border border-purple-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    PAYS ORIGINE
                  </label>
                  <div className="relative">
                    <select
                      aria-label="Pays d'origine"
                      value={selectedOrigin}
                      onChange={(e) => setSelectedOrigin(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-purple-500 bg-white"
                    >
                      <option value="">🌍 Global (Toutes)</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex flex-col relative">
                  <div className="hidden md:flex absolute top-1/2 -left-3 -translate-y-1/2 z-10 bg-white rounded-full p-1 shadow-sm border border-purple-100 text-purple-300">
                    <ArrowRight size={20} />
                  </div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    PAYS DESTINATION
                  </label>
                  <select
                    aria-label="Pays de destination"
                    value={selectedDest}
                    onChange={(e) => setSelectedDest(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">🌍 Global (Toutes)</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-sm text-gray-500 px-1">
                Remplissez les tarifs pour les modes que vous avez activés.
              </p>

              {/* Matrix Grid - INTELLIGENT FILTERING */}
              <div
                className={`grid grid-cols-1 ${hasSea && hasAir ? "md:grid-cols-2" : ""} gap-6`}
              >
                {/* SEA SECTION - Only if hasSea */}
                {hasSea && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Anchor size={20} />
                      </div>
                      <h4 className="font-bold text-gray-900">
                        Transport Maritime
                      </h4>
                    </div>

                    {/* Sea Standard */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-gray-500">
                          Standard
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <span className="text-[10px] uppercase font-bold text-blue-600">
                              Auto
                            </span>
                            <input
                              type="checkbox"
                              checked={matrix["sea-standard"].auto_quote}
                              onChange={(e) =>
                                updateMatrixItem(
                                  "sea-standard",
                                  "auto_quote",
                                  e.target.checked,
                                )
                              }
                              className="toggle-checkbox"
                            />
                          </label>
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                            CBM
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400">
                            Prix (FCFA)
                          </label>
                          <input
                            type="number"
                            aria-label="Prix Standard Maritime"
                            value={matrix["sea-standard"].price}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "sea-standard",
                                "price",
                                val === "" ? "" : parseFloat(val),
                              );
                            }}
                            className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Min Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Min Jours Standard Maritime"
                            value={matrix["sea-standard"].min_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "sea-standard",
                                "min_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Max Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Max Jours Standard Maritime"
                            value={matrix["sea-standard"].max_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "sea-standard",
                                "max_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sea Express */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-orange-600">
                          Express
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <span className="text-[10px] uppercase font-bold text-orange-600">
                              Auto
                            </span>
                            <input
                              type="checkbox"
                              checked={matrix["sea-express"].auto_quote}
                              onChange={(e) =>
                                updateMatrixItem(
                                  "sea-express",
                                  "auto_quote",
                                  e.target.checked,
                                )
                              }
                              className="toggle-checkbox"
                            />
                          </label>
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                            CBM
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400">
                            Prix (FCFA)
                          </label>
                          <input
                            type="number"
                            aria-label="Prix Express Maritime"
                            value={matrix["sea-express"].price}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "sea-express",
                                "price",
                                val === "" ? "" : parseFloat(val),
                              );
                            }}
                            className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Min Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Min Jours Express Maritime"
                            value={matrix["sea-express"].min_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "sea-express",
                                "min_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Max Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Max Jours Express Maritime"
                            value={matrix["sea-express"].max_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "sea-express",
                                "max_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AIR SECTION - Only if hasAir */}
                {hasAir && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Send size={20} className="rotate-[-45deg]" />
                      </div>
                      <h4 className="font-bold text-gray-900">
                        Transport Aérien
                      </h4>
                    </div>

                    {/* Air Standard */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-gray-500">
                          Standard
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <span className="text-[10px] uppercase font-bold text-orange-600">
                              Auto
                            </span>
                            <input
                              type="checkbox"
                              checked={matrix["air-standard"].auto_quote}
                              onChange={(e) =>
                                updateMatrixItem(
                                  "air-standard",
                                  "auto_quote",
                                  e.target.checked,
                                )
                              }
                              className="toggle-checkbox"
                            />
                          </label>
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                            KG
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400">
                            Prix (FCFA)
                          </label>
                          <input
                            type="number"
                            aria-label="Prix Standard Aérien"
                            value={matrix["air-standard"].price}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "air-standard",
                                "price",
                                val === "" ? "" : parseFloat(val),
                              );
                            }}
                            className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Min Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Min Jours Standard Aérien"
                            value={matrix["air-standard"].min_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "air-standard",
                                "min_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Max Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Max Jours Standard Aérien"
                            value={matrix["air-standard"].max_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "air-standard",
                                "max_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Air Express */}
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold uppercase text-orange-600">
                          Express
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 cursor-pointer">
                            <span className="text-[10px] uppercase font-bold text-orange-600">
                              Auto
                            </span>
                            <input
                              type="checkbox"
                              checked={matrix["air-express"].auto_quote}
                              onChange={(e) =>
                                updateMatrixItem(
                                  "air-express",
                                  "auto_quote",
                                  e.target.checked,
                                )
                              }
                              className="toggle-checkbox"
                            />
                          </label>
                          <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                            KG
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="col-span-2">
                          <label className="text-xs text-gray-400">
                            Prix (FCFA)
                          </label>
                          <input
                            type="number"
                            aria-label="Prix Express Aérien"
                            value={matrix["air-express"].price}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "air-express",
                                "price",
                                val === "" ? "" : parseFloat(val),
                              );
                            }}
                            className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Min Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Min Jours Express Aérien"
                            value={matrix["air-express"].min_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "air-express",
                                "min_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">
                            Max Jours
                          </label>
                          <input
                            type="number"
                            aria-label="Max Jours Express Aérien"
                            value={matrix["air-express"].max_days}
                            onChange={(e) => {
                              const val = e.target.value;
                              updateMatrixItem(
                                "air-express",
                                "max_days",
                                val === "" ? "" : parseInt(val),
                              );
                            }}
                            className="w-full p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                  {saving ? (
                    <>Entregistrement...</>
                  ) : (
                    <>
                      <Save size={18} />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AddShipmentModal
        isOpen={isShipmentModalOpen}
        onClose={() => setIsShipmentModalOpen(false)}
        onSuccess={() => {
          setIsShipmentModalOpen(false);
          // Optionally redirect or show success
        }}
        initialData={shipmentInitialData}
      />
    </div>
  );
}
