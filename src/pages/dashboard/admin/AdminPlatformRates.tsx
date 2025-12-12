import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Ship,
  Plane,
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
} from "lucide-react";
import {
  platformRateService,
  PlatformRate,
} from "../../../services/platformRateService";
import { locationService, Location } from "../../../services/locationService";
import { useCurrency } from "../../../contexts/CurrencyContext";
import {
  convertCurrency,
  formatCurrency,
} from "../../../utils/currencyFormatter";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

// Matrix Configuration Types
type RateType = "standard" | "express";
type RateMode = "sea" | "air";

interface MatrixRate {
  id?: string; // If editing an existing one
  price: number;
  min_days: number;
  max_days: number;
  insurance_rate: number;
  unit: "kg" | "cbm";
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
  },
  "sea-express": {
    price: 0,
    min_days: 15,
    max_days: 30,
    insurance_rate: 0.07,
    unit: "cbm",
  },
  "air-standard": {
    price: 0,
    min_days: 5,
    max_days: 10,
    insurance_rate: 0.08,
    unit: "kg",
  },
  "air-express": {
    price: 0,
    min_days: 2,
    max_days: 5,
    insurance_rate: 0.1,
    unit: "kg",
  },
};

export default function AdminPlatformRates() {
  const { currency: currentCurrency } = useCurrency();
  const [rates, setRates] = useState<PlatformRate[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Route Configuration
  const [selectedOrigin, setSelectedOrigin] = useState<string>("");
  const [selectedDest, setSelectedDest] = useState<string>("");

  // Matrix State
  const [matrix, setMatrix] = useState<RatesMatrix>(
    JSON.parse(JSON.stringify(DEFAULT_MATRIX)),
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ratesData, locationsData] = await Promise.all([
        platformRateService.getAllRates(),
        locationService.getLocations(),
      ]);
      setRates(ratesData);
      setLocations(locationsData);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // When Route changes in Modal, try to autofill existing rates
  useEffect(() => {
    if (!isModalOpen) return;

    // Reset to defaults first
    const newMatrix = JSON.parse(JSON.stringify(DEFAULT_MATRIX));

    // Find matches in existing rates
    rates.forEach((rate) => {
      const originMatch = (rate.origin_id || "") === selectedOrigin;
      const destMatch = (rate.destination_id || "") === selectedDest;

      if (originMatch && destMatch) {
        const key = `${rate.mode}-${rate.type}` as keyof RatesMatrix;
        if (newMatrix[key]) {
          newMatrix[key] = {
            id: rate.id,
            price: rate.price,
            min_days: rate.min_days,
            max_days: rate.max_days,
            insurance_rate: rate.insurance_rate,
            unit: rate.unit,
          };
        }
      }
    });

    setMatrix(newMatrix);
  }, [selectedOrigin, selectedDest, isModalOpen]);

  const handleOpenCreate = () => {
    setSelectedOrigin("");
    setSelectedDest("");
    setMatrix(JSON.parse(JSON.stringify(DEFAULT_MATRIX)));
    setIsModalOpen(true);
  };

  const handleEditRoute = (originId: string, destId: string) => {
    setSelectedOrigin(originId || "");
    setSelectedDest(destId || "");
    // Effect will trigger auto-fill
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

        // Skip if price is 0 (assume user doesn't want to set this rate)
        // Unless it already has an ID (we are updating it)
        if (item.price <= 0 && !item.id) continue;

        const payload = {
          mode,
          type,
          price: item.price,
          min_days: item.min_days,
          max_days: item.max_days,
          insurance_rate: item.insurance_rate,
          unit: item.unit,
          currency: currentCurrency, // Use the currency the user is seeing
          origin_id: selectedOrigin || null, // API handles null/undefined? Service needs check
          destination_id: selectedDest || null,
        };

        // The service expects undefined for NULL, let's fix service or ensure undefined here
        const cleanPayload = {
          ...payload,
          origin_id: payload.origin_id || undefined,
          destination_id: payload.destination_id || undefined,
        };

        if (item.id) {
          promises.push(platformRateService.updateRate(item.id, cleanPayload));
        } else {
          promises.push(platformRateService.createRate(cleanPayload as any));
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

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  const handleDelete = (id: string) => {
    setConfirmation({ isOpen: true, id });
  };

  const confirmDeleteRate = async () => {
    if (confirmation.id) {
      try {
        await platformRateService.deleteRate(confirmation.id);
        fetchData();
        setConfirmation({ isOpen: false, id: null });
      } catch (err) {
        setError("Erreur lors de la suppression.");
      }
    }
  };

  const filteredRates = rates.filter((rate) => {
    const searchLower = searchTerm.toLowerCase();
    const originName = rate.origin?.name || "Global";
    const destName = rate.destination?.name || "Global";
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

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Tarifs de la Plateforme"
        subtitle="Définissez vos tarifs par route (Matrice Maritime & Aérien)."
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
                {filteredRates.map((rate) => {
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
                            <Ship className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Plane className="w-4 h-4 text-orange-600" />
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
                            onClick={() =>
                              handleEditRoute(
                                rate.origin_id || "",
                                rate.destination_id || "",
                              )
                            }
                            aria-label="Modifier le tarif"
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-primary transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(rate.id)}
                            aria-label="Supprimer le tarif"
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                Configuration Tarifaire (Matrice)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                title="Fermer"
                aria-label="Fermer la modal"
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
                      aria-label="Sélectionner le pays d'origine"
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
                    aria-label="Sélectionner le pays de destination"
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
                Remplissez les tarifs ci-dessous pour cette route. Les cases
                laissées à 0 seront ignorées (sauf modification).
              </p>

              {/* Matrix Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SEA SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Ship size={20} />
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
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                        CBM
                      </span>
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
                          onChange={(e) =>
                            updateMatrixItem(
                              "sea-standard",
                              "price",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Min Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Minimum Standard Maritime"
                          value={matrix["sea-standard"].min_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "sea-standard",
                              "min_days",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Max Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Maximum Standard Maritime"
                          value={matrix["sea-standard"].max_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "sea-standard",
                              "max_days",
                              parseInt(e.target.value),
                            )
                          }
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
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                        CBM
                      </span>
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
                          onChange={(e) =>
                            updateMatrixItem(
                              "sea-express",
                              "price",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Min Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Minimum Express Maritime"
                          value={matrix["sea-express"].min_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "sea-express",
                              "min_days",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Max Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Maximum Express Maritime"
                          value={matrix["sea-express"].max_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "sea-express",
                              "max_days",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full p-2 rounded-lg border border-gray-200 focus:border-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AIR SECTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                      <Plane size={20} />
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
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                        KG
                      </span>
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
                          onChange={(e) =>
                            updateMatrixItem(
                              "air-standard",
                              "price",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Min Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Minimum Standard Aérien"
                          value={matrix["air-standard"].min_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "air-standard",
                              "min_days",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Max Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Maximum Standard Aérien"
                          value={matrix["air-standard"].max_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "air-standard",
                              "max_days",
                              parseInt(e.target.value),
                            )
                          }
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
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded text-gray-600">
                        KG
                      </span>
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
                          onChange={(e) =>
                            updateMatrixItem(
                              "air-express",
                              "price",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full font-mono font-bold p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Min Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Minimum Express Aérien"
                          value={matrix["air-express"].min_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "air-express",
                              "min_days",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">
                          Max Jours
                        </label>
                        <input
                          type="number"
                          aria-label="Jours Maximum Express Aérien"
                          value={matrix["air-express"].max_days}
                          onChange={(e) =>
                            updateMatrixItem(
                              "air-express",
                              "max_days",
                              parseInt(e.target.value),
                            )
                          }
                          className="w-full p-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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
                      Enregistrer les Tarifs
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, id: null })}
        onConfirm={confirmDeleteRate}
        title="Supprimer le tarif"
        message="Êtes-vous sûr de vouloir supprimer ce tarif ? Cette action est irréversible."
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
