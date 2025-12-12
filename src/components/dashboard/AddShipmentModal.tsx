import { useState, useRef, useEffect } from "react";
import {
  X,
  AlertCircle,
  Truck,
  Package,
  Anchor,
  Plane,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  Info,
  MapPin,
  Plus,
  Globe,
  ArrowRight,
} from "lucide-react";
import { shipmentService } from "../../services/shipmentService";
import { locationService, Location } from "../../services/locationService";
import { useAuth } from "../../contexts/AuthContext";
import { rateService } from "../../services/rateService";
import {
  forwarderRateService,
  ForwarderRate,
} from "../../services/forwarderRateService";
import {
  packageTypeService,
  PackageType,
} from "../../services/packageTypeService";
import { platformRateService } from "../../services/platformRateService";
import { useCurrency } from "../../contexts/CurrencyContext";
import { convertCurrency, formatCurrency } from "../../utils/currencyFormatter";

interface AddShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    origin_country?: string;
    destination_country?: string;
    origin_id?: string;
    destination_id?: string;
    transport_mode?: "sea" | "air";
    service_type?: "standard" | "express";
    rate_id?: string;
  };
  rate_id?: string;
  parentShipment?: any; // Using any for now to avoid circular dependency import but should be Shipment
}

const TRANSPORT_MODE_INFO = {
  sea: {
    icon: Anchor,
    label: "Fret Maritime",
    measurement: "Volume en CBM (mètres cubes)",
    pricing: "Prix calculé par CBM",
    duration: "25-35 jours",
    conditions: "Idéal pour gros volumes, solution économique",
    advantages: ["Économique", "Gros volumes", "Écologique"],
  },
  air: {
    icon: Plane,
    label: "Fret Aérien",
    measurement: "Poids en kilogrammes (kg)",
    pricing: "Prix calculé par kg",
    duration: "3-7 jours",
    conditions: "Rapide, idéal pour urgences et petits volumes",
    advantages: ["Rapide", "Sécurisé", "Urgences"],
  },
};

const SERVICE_TYPE_INFO = {
  standard: {
    label: "Standard (Économique)",
    description: "Service standard avec délai normal",
    features: [
      "Consolidation possible",
      "Meilleur rapport qualité/prix",
      "Délai normal",
    ],
  },
  express: {
    label: "Express (Le Plus Rapide)",
    description: "Service prioritaire pour les envois urgents",
    features: ["Priorité maximale", "Transit direct", "Douane rapide"],
  },
};

export default function AddShipmentModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  parentShipment,
}: AddShipmentModalProps) {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    tracking_number: `TRK - ${Date.now().toString().slice(-6)} `,
    origin_country: "",
    destination_country: "",
    origin_id: undefined as string | undefined, // Added for strict matching
    destination_id: undefined as string | undefined, // Added for strict matching
    carrier_name: "",
    transport_mode: "sea" as "sea" | "air",
    service_type: "standard" as "standard" | "express",
    price: 0,
    cargo_types: [] as string[],
    cargo_weight: 0,
    cargo_volume: 76,
    cargo_packages: 0,
    departure_date: "",
    arrival_estimated_date: "",
    transit_duration: "",
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [rates, setRates] = useState<ForwarderRate[]>([]);

  // Multi-Selection State
  const [selectedRateIds, setSelectedRateIds] = useState<string[]>([]);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);

  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [isAddPackageTypeModalOpen, setIsAddPackageTypeModalOpen] =
    useState(false);
  const [newLocationName, setNewLocationName] = useState("");
  const [newPackageTypeName, setNewPackageTypeName] = useState("");
  const [locationFieldToAdd, setLocationFieldToAdd] = useState<
    "origin" | "destination" | null
  >(null);
  const [searchTermOrigin, setSearchTermOrigin] = useState("");
  const [searchTermDest, setSearchTermDest] = useState("");
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  // State to store matched rate's max transit days for auto-calculation
  // State to store matched rate's max transit days for auto-calculation
  const [transitMaxDays, setTransitMaxDays] = useState<number | null>(null);

  // If rate_id is provided, we lock the selection to that rate
  const [isRateContext, setIsRateContext] = useState(!!initialData?.rate_id);
  const [rateId, setRateId] = useState<string | undefined>(initialData?.rate_id);

  const [step, setStep] = useState(1);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
    loadPackageTypes();
    loadRates();
  }, []);

  useEffect(() => {
    if (isOpen && initialData?.rate_id) {
      setSelectedRateIds([initialData.rate_id]);
    } else if (isOpen && !initialData?.rate_id) {
      // If opening fresh without context, ensure empty selection
      // (Do nothing or reset if needed, but be careful not to wipe user selection if they just opened it)
      // However, selectedRateIds is state, persisting unless reset.
      // Best to reset on open if not context?
      // Or assumes reset on close?
      if (!selectedRateIds.length) setSelectedRateIds([]);
    }
  }, [isOpen, initialData]);

  const loadRates = async () => {
    try {
      const data = await forwarderRateService.getMyRates();
      setRates(data);
    } catch (err) {
      console.error("Error loading rates:", err);
    }
  };

  const toggleRateSelection = (rateId: string) => {
    let newSelectedIds: string[];

    if (selectedRateIds.includes(rateId)) {
      newSelectedIds = selectedRateIds.filter((id) => id !== rateId);
    } else {
      newSelectedIds = [...selectedRateIds, rateId];
    }

    setSelectedRateIds(newSelectedIds);

    // If ONE rate is selected (or we just switched to 1), auto-fill the form like before for visual feedback
    if (newSelectedIds.length === 1) {
      const rate = rates.find((r) => r.id === newSelectedIds[0]);
      if (rate) autoFillFromRate(rate);
    } else if (newSelectedIds.length === 0) {
      // Reset potentially? Or keep defaults.
    }

    // If MULTIPLE are selected, the UI handles hiding specific fields,
    // but we still need a "base" state for common fields like date.
  };

  const autoFillFromRate = (rate: ForwarderRate) => {
    // Auto-fill logic
    const today = new Date();
    const departureDate = today.toISOString().split("T")[0];

    // Convert Price if needed
    let finalPrice = rate.price;
    if (rate.currency && rate.currency !== currency) {
      finalPrice = convertCurrency(rate.price, rate.currency, currency);
    }
    if (currency === "XOF") {
      finalPrice = Math.round(finalPrice);
    } else {
      finalPrice = parseFloat(finalPrice.toFixed(2));
    }

    // Calculate arrival if max_days exists
    let arrivalDateStr = "";
    if (rate.max_days) {
      const arrivalDate = new Date(today);
      arrivalDate.setDate(today.getDate() + rate.max_days);
      arrivalDateStr = arrivalDate.toISOString().split("T")[0];
    }

    setFormData((prev) => ({
      ...prev,
      origin_country: rate.origin?.name || "",
      destination_country: rate.destination?.name || "",
      origin_id: rate.origin_id || undefined,
      destination_id: rate.destination_id || undefined,
      transport_mode: rate.mode,
      service_type: rate.type,
      price: finalPrice,
      transit_duration:
        rate.min_days && rate.max_days
          ? `${rate.min_days} -${rate.max_days} jours`
          : "",
      cargo_weight: rate.mode === "air" ? 1000 : 0,
      cargo_volume: rate.mode === "sea" ? 76 : 0,
      departure_date: departureDate,
      arrival_estimated_date: arrivalDateStr,
    }));

    setTransitMaxDays(rate.max_days || null);
    setSearchTermOrigin(rate.origin?.name || "");
    setSearchTermDest(rate.destination?.name || "");
  };

  // Initialize form with passed data when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRateIds([]); // Reset selection on open
      if (initialData) {
        // If we have initial data (e.g. from Rate), reset form completely with this data
        setFormData({
          tracking_number: `TRK - ${Date.now().toString().slice(-6)} `,
          origin_country: initialData.origin_country || "",
          destination_country: initialData.destination_country || "",
          origin_id: initialData.origin_id || undefined,
          destination_id: initialData.destination_id || undefined,
          carrier_name: "",
          transport_mode: initialData.transport_mode || "sea",
          service_type: initialData.service_type || "standard",
          price: 0, // Will be fetched via effect
          // Default to ALL package types if coming from Rate mode (where origin_id is set)
          // We depend on packageTypes being loaded, or we update it via separate effect if needed.
          // For now, let's try to set it if available, or empty and let a separate effect fill it?
          // Actually, best to just select 'Carton', 'Caisse', 'Palette', 'Vrac' common ones/fallback?
          // The user said "Tout selectionner".
          cargo_types: initialData.origin_id ? [] : [], // We'll handle this in a dedicated effect depending on packageTypes
          cargo_weight: 0,
          cargo_volume: 76,
          cargo_packages: 0,
          departure_date: "",
          arrival_estimated_date: "",
          transit_duration: "",
        });

        // Update search terms
        setSearchTermOrigin(initialData.origin_country || "");
        setSearchTermDest(initialData.destination_country || "");
        setTransitMaxDays(null); // Clear max days state
      }
    }
  }, [isOpen, initialData]);

  // Separate effect to Populate ALL Package Types when in Rate Mode and types load
  useEffect(() => {
    if (initialData?.rate_id) {
      setIsRateContext(true);
      setRateId(initialData.rate_id);
      setFormData((prev) => ({
        ...prev,
        rate_id: initialData.rate_id,
      }));
      // We'll let the existing useEffect for rateId handle the full loading
    }

    // Parent Shipment Context (Groupage)
    if (parentShipment) {
      // Lock fields to match parent
      setFormData((prev) => ({
        ...prev,
        transport_mode: parentShipment.transport_mode,
        service_type: parentShipment.service_type,
        origin_country: parentShipment.origin.country,
        origin_port: parentShipment.origin.port,
        destination_country: parentShipment.destination.country,
        destination_port: parentShipment.destination.port,
        departure_date: parentShipment.dates.departure,
        arrival_estimated_date: parentShipment.dates.arrival_estimated,
        carrier_name: parentShipment.carrier.name,
        parent_shipment_id: parentShipment.id,
      }));
      // Skip directly to details or client selection, skipping route selection
      setStep(2); // Assuming step 2 is Details/Client
    }

    if (
      isOpen &&
      initialData?.origin_id &&
      packageTypes.length > 0 &&
      formData.cargo_types.length === 0
    ) {
      setFormData((prev) => ({
        ...prev,
        cargo_types: packageTypes.map((t) => t.value),
      }));
    }
  }, [isOpen, initialData, parentShipment, packageTypes]); // Depend on packageTypes loading

  const loadLocations = async () => {
    const data = await locationService.getLocations();
    setLocations(data);
  };

  const loadPackageTypes = async () => {
    const data = await packageTypeService.getPackageTypes();
    setPackageTypes(data);
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocationName.trim()) return;

    try {
      const newLoc = await locationService.addLocation(
        newLocationName,
        "country",
      );
      setLocations((prev) => [newLoc, ...prev]);

      if (locationFieldToAdd === "origin") {
        setFormData((prev) => ({ ...prev, origin_country: newLoc.name }));
      } else if (locationFieldToAdd === "destination") {
        setFormData((prev) => ({ ...prev, destination_country: newLoc.name }));
      }

      setNewLocationName("");
      setIsAddLocationModalOpen(false);
      setLocationFieldToAdd(null);
    } catch (err) {
      console.error("Error adding location:", err);
    }
  };

  const handleAddPackageType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackageTypeName.trim()) return;

    try {
      const newType =
        await packageTypeService.addPackageType(newPackageTypeName);
      setPackageTypes((prev) => [newType, ...prev]);

      // Auto-select the new type
      setFormData((prev) => ({
        ...prev,
        cargo_types: [...prev.cargo_types, newType.value],
      }));

      setNewPackageTypeName("");
      setIsAddPackageTypeModalOpen(false);
    } catch (err) {
      console.error("Error adding package type:", err);
    }
  };

  const filteredLocationsOrigin = locations.filter((l) =>
    l.name.toLowerCase().includes(searchTermOrigin.toLowerCase()),
  );

  const filteredLocationsDest = locations.filter((l) =>
    l.name.toLowerCase().includes(searchTermDest.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsTypeDropdownOpen(false);
      }
      // Close route dropdown too if clicked outside
      // Note: We need a ref for route dropdown too if we want this exact behavior,
      // but simple toggle is okay for now or we add another ref.
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate transit duration and Fetch Price automatically
  // 1. Fetch Price/Rate automatically when params change
  useEffect(() => {
    const fetchRate = async () => {
      if (!user) return;
      // Only run if NOT in Batch Mode (selectedRateIds <= 1)
      if (selectedRateIds.length > 1) return;

      // Prioritize IDs from Data if available (e.g. from Rate creation), otherwise resolve from Name
      const originId =
        formData.origin_id ||
        locations.find((l) => l.name === formData.origin_country)?.id;
      const destId =
        formData.destination_id ||
        locations.find((l) => l.name === formData.destination_country)?.id;

      try {
        const matchedRate = await rateService.findBestMatch(user.id, {
          mode: formData.transport_mode,
          type: formData.service_type,
          originCountry: formData.origin_country,
          destCountry: formData.destination_country,
          weight: formData.cargo_weight,
          originId, // Pass resolved IDs
          destId,
        });

        if (matchedRate) {
          let finalPrice = matchedRate.price_per_unit;
          if (matchedRate.currency && matchedRate.currency !== currency) {
            finalPrice = convertCurrency(
              matchedRate.price_per_unit,
              matchedRate.currency,
              currency,
            );
          }
          if (currency === "XOF") {
            finalPrice = Math.round(finalPrice);
          } else {
            finalPrice = parseFloat(finalPrice.toFixed(2));
          }

          setFormData((prev) => ({
            ...prev,
            price: finalPrice,
            // Always use rate duration if available, otherwise clear it to avoid stale Sea duration in Air mode
            transit_duration:
              matchedRate.transit_time_min && matchedRate.transit_time_max
                ? `${matchedRate.transit_time_min} -${matchedRate.transit_time_max} jours`
                : "", // Clear if new rate has no duration data
            // Never auto-fill weight from rate to avoid "1 kg" annoyance
            // Let user type it manually starting from 0
            cargo_weight: prev.cargo_weight,
          }));

          // Always update max days (even to null), to clear old Sea values when switching to Air
          setTransitMaxDays(matchedRate.transit_time_max || null);
        } else {
          // Only reset if we didn't just select a rate manually (which would have set price)
          // Actually, manual selection via toggleRateSelection calls autoFillFromRate which sets price.
          // This effect might overwrite it if it can't find a match?
          // autoFillFromRate sets all fields, which triggers this effect.
          // This effect should find the SAME rate we just selected if logic aligns.
          // If it doesn't, we might lose price.
          // FIX: If selectedRateIds.length === 1, we trust the Rate object directly, we don't need to re-fetch?
          // But we might want to re-fetch if user changes weight?
          // Let's add a condition: if selectedRateIds.length === 1, rely on that?
          // No, weight changes might affect price tiers. Keep fetching but be careful.
          // Fallback: don't zero out price if we clearly have a selected rate ID active?
          // For now trust the verify logic.
          // setFormData(prev => ({ ...prev, price: 0 }));
          // setTransitMaxDays(null);
        }
      } catch (e) {
        console.error("Error fetching/matching rate:", e);
      }
    };

    if (user && locations.length > 0) {
      fetchRate();
    }
  }, [
    formData.transport_mode,
    formData.service_type,
    formData.origin_country,
    formData.destination_country,
    formData.origin_id,
    formData.destination_id,
    formData.cargo_weight, // Re-fetch if weight changes (Rate might depend on weight tiers)
    locations,
    user,
    currency,
    selectedRateIds, // Add dependency to re-check
  ]);

  // 2. Auto-calculate Arrival Date based on Departure + Max Transit Days
  useEffect(() => {
    if (formData.departure_date && transitMaxDays) {
      const start = new Date(formData.departure_date);
      const arrival = new Date(start);
      arrival.setDate(start.getDate() + transitMaxDays);

      const formattedArrival = arrival.toISOString().split("T")[0]; // YYYY-MM-DD

      setFormData((prev) => {
        // Prevent loop if already set
        if (prev.arrival_estimated_date !== formattedArrival) {
          return { ...prev, arrival_estimated_date: formattedArrival };
        }
        return prev;
      });
    }
  }, [formData.departure_date, transitMaxDays]);

  // 3. Calculate Duration display based on manually selected dates (fallback or override)
  useEffect(() => {
    if (formData.departure_date && formData.arrival_estimated_date) {
      const start = new Date(formData.departure_date);
      const end = new Date(formData.arrival_estimated_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (!isNaN(diffDays) && diffDays >= 0) {
        // Update text only if it differs significantly or is empty?
        // Actually maybe we trust the text if it's set from Rate?
        // Let's only update if the calculated Diff is valid and matches logic
        setFormData((prev) => ({
          ...prev,
          transit_duration: `${diffDays} jours`,
        }));
      }
    }
  }, [formData.departure_date, formData.arrival_estimated_date]);

  if (!isOpen) return null;

  const toggleType = (value: string) => {
    setFormData((prev) => {
      const exists = prev.cargo_types.includes(value);
      if (exists) {
        return {
          ...prev,
          cargo_types: prev.cargo_types.filter((t) => t !== value),
        };
      } else {
        return { ...prev, cargo_types: [...prev.cargo_types, value] };
      }
    });
  };

  const toggleAllTypes = () => {
    if (formData.cargo_types.length === packageTypes.length) {
      setFormData((prev) => ({ ...prev, cargo_types: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        cargo_types: packageTypes.map((t) => t.value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // LOOP SUBMISSION IF BATCH MODE
      if (selectedRateIds.length > 1) {
        const promises = selectedRateIds.map(async (rateId) => {
          const rate = rates.find((r) => r.id === rateId);
          if (!rate) return null;

          // Calculate dates per rate (as max days might differ)
          const departureDate = formData.departure_date; // Common
          let arrivalDateStr = "";
          if (rate.max_days && departureDate) {
            const start = new Date(departureDate);
            const arrival = new Date(start);
            arrival.setDate(start.getDate() + rate.max_days);
            arrivalDateStr = arrival.toISOString().split("T")[0];
          }

          // Calculate Price per rate
          let finalPrice = rate.price;
          if (rate.currency && rate.currency !== currency) {
            finalPrice = convertCurrency(rate.price, rate.currency, currency);
          }
          if (currency === "XOF") finalPrice = Math.round(finalPrice);
          else finalPrice = parseFloat(finalPrice.toFixed(2));

          const submissionData = {
            tracking_number: `TRK - ${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 1000)} `, // Unique TRK
            origin_country: rate.origin?.name,
            destination_country: rate.destination?.name,
            origin_id: rate.origin_id,
            destination_id: rate.destination_id,
            carrier_name: "",
            transport_mode: rate.mode,
            service_type: rate.type,
            price: finalPrice,
            cargo_type: formData.cargo_types.join(", "), // Common? Or default? Use form data for now.
            cargo_weight: rate.mode === "air" ? 1000 : 0,
            cargo_volume: rate.mode === "sea" ? 76 : 0,
            cargo_packages: formData.cargo_packages, // Common
            departure_date: departureDate,
            arrival_estimated_date: arrivalDateStr,
            transit_duration:
              rate.min_days && rate.max_days
                ? `${rate.min_days} -${rate.max_days} jours`
                : "",
            origin_port: "",
            destination_port: "",
          };

          return shipmentService.createShipment(submissionData);
        });

        await Promise.all(promises);
      } else {
        // SINGLE SUBMISSION (Classic)
        const submissionData = {
          ...formData,
          cargo_type: formData.cargo_types.join(", "),
          origin_port: "",
          destination_port: "",
        };
        const { cargo_types, ...finalData } = submissionData;
        await shipmentService.createShipment(finalData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating shipment:", err);
      setError(
        err.message ||
        "Une erreur est survenue lors de la création de l'expédition.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div
            className="absolute inset-0 bg-gray-500 opacity-75"
            onClick={onClose}
          ></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-6 h-6 text-primary" />
                {selectedRateIds.length > 1
                  ? `Création Groupée(${selectedRateIds.length})`
                  : "Nouvelle Expédition"}
              </h3>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Parent Shipment Context Banner */}
            {parentShipment && (
              <div className="mx-6 mt-6 mb-2 bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                <div className="p-2 bg-blue-100 rounded-lg h-fit">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-blue-900">
                    Ajout d'un colis à l'annonce #
                    {parentShipment.tracking_number}
                  </div>
                  <div className="text-sm text-blue-600 mt-1">
                    L'itinéraire ({parentShipment.origin.port} →{" "}
                    {parentShipment.destination.port}) et le transporteur sont
                    verrouillés.
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Standard Route Selector */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                  {/* Globe Icon for Route Selection */}
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    Sélection Rapide de Trajet
                  </h4>
                  <p className="text-sm text-gray-500">
                    Choisissez une ou plusieurs routes pour créer vos
                    expéditions.
                  </p>
                </div>
              </div>{" "}
              {/* Multi-Select Route Logic */}
              <div className="relative">
                <div
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border-gray-200 shadow-sm min-h-[46px] flex flex-wrap gap-2 items-center ${isRateContext ? "bg-gray-50 cursor-not-allowed" : "bg-white cursor-pointer"}`}
                  onClick={() =>
                    !isRateContext &&
                    setIsRouteDropdownOpen(!isRouteDropdownOpen)
                  }
                  title={
                    isRateContext
                      ? "Route fixée pour cette expédition"
                      : "Sélectionner des trajets"
                  }
                >
                  {selectedRateIds.length === 0 && (
                    <span className="text-gray-500 text-sm font-medium">
                      -- Choisir des trajets standards --
                    </span>
                  )}
                  {selectedRateIds.map((id) => {
                    const r = rates.find((rate) => rate.id === id);
                    if (!r) return null;
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-bold"
                      >
                        {r.origin?.name} <ArrowRight className="w-3 h-3" />{" "}
                        {r.destination?.name}
                        {!isRateContext && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRateSelection(id);
                            }}
                            aria-label="Retirer cette route"
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {!isRateContext && (
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  )}
                </div>

                {isRouteDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-auto">
                    {rates.map((rate) => {
                      const isSelected = selectedRateIds.includes(rate.id);
                      const originName = rate.origin?.name || "Global";
                      const destName = rate.destination?.name || "Global";
                      const priceDisplay = formatCurrency(
                        rate.price,
                        rate.currency,
                      );

                      return (
                        <div
                          key={rate.id}
                          onClick={() => toggleRateSelection(rate.id)}
                          className={`px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 ${isSelected ? "bg-blue-50/50" : ""}`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 bg-white"}`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-gray-900 text-sm">
                                {originName} ➝ {destName}
                              </span>
                              <span className="text-blue-600 font-bold text-sm">
                                {priceDisplay}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="capitalize">
                                {rate.mode === "sea" ? "Maritime" : "Aérien"}{" "}
                                {rate.type}
                              </span>
                              <span>•</span>
                              <span>
                                {rate.min_days}-{rate.max_days} jours
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* BATCH MODE SUMMARY */}
            {selectedRateIds.length > 1 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 animate-in fade-in slide-in-from-top-2">
                <h5 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5" />
                  Mode Groupé Activé
                </h5>
                <p className="text-sm text-amber-800 mb-4">
                  Vous allez créer{" "}
                  <strong>{selectedRateIds.length} expéditions</strong>{" "}
                  simultanément. Les détails (Prix, Mode, Origine, Destination)
                  seront automatiquement appliqués pour chaque trajet
                  sélectionné.
                </p>
                <div className="space-y-2 max-h-40 overflow-auto pr-2">
                  {selectedRateIds.map((id, index) => {
                    const r = rates.find((rate) => rate.id === id);
                    if (!r) return null;
                    return (
                      <div
                        key={id}
                        className="bg-white/60 p-2.5 rounded-lg border border-amber-100 flex justify-between items-center text-sm"
                      >
                        <span className="font-medium text-gray-700">
                          #{index + 1} {r.origin?.name} ➝ {r.destination?.name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {r.mode === "sea" ? "Maritime" : "Aérien"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hide Transport/Service/Route details in Batch Mode */}
              {selectedRateIds.length <= 1 && (
                <>
                  {/* Transport & Service Selection (4 Cards) */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                      Mode de Transport & Service
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        {
                          mode: "sea" as const,
                          type: "standard" as const,
                          icon: Anchor,
                          label: "Maritime Standard",
                          description: "Économique pour grands volumes",
                          transit: "25-35 jours",
                          features: ["Groupage possible", "Meilleur tarif", "Écologique"],
                          color: "blue"
                        },
                        {
                          mode: "sea" as const,
                          type: "express" as const,
                          icon: Anchor,
                          label: "Maritime Express",
                          description: "Prioritaire & Rapide",
                          transit: "15-20 jours",
                          features: ["Départ prioritaire", "Trajet direct", "Suivi Premium"],
                          color: "indigo"
                        },
                        {
                          mode: "air" as const,
                          type: "standard" as const,
                          icon: Plane,
                          label: "Aérien Standard",
                          description: "Compromis Coût/Délai",
                          transit: "5-7 jours",
                          features: ["Vols réguliers", "Sécurisé", "Fiable"],
                          color: "sky"
                        },
                        {
                          mode: "air" as const,
                          type: "express" as const,
                          icon: Plane,
                          label: "Aérien Express",
                          description: "Livraison Ultra-Rapide",
                          transit: "2-3 jours",
                          features: ["Vol direct", "Traitement VIP", "Urgences"],
                          color: "orange"
                        }
                      ].map((option) => {
                        const isSelected = formData.transport_mode === option.mode && formData.service_type === option.type;
                        const Icon = option.icon;

                        return (
                          <label
                            key={`${option.mode}-${option.type}`}
                            className={`cursor-pointer relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md block ${isSelected
                              ? `border-${option.color}-500 bg-${option.color}-50 ring-1 ring-${option.color}-500`
                              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                          >
                            <input
                              type="radio"
                              name="transport_service_selection"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => {
                                const newMode = option.mode;
                                const newType = option.type;
                                // ... logic ...
                                const today = new Date();
                                const departureDate = today.toISOString().split("T")[0];

                                let arrivalDate = new Date();
                                if (newMode === "air") {
                                  arrivalDate.setDate(today.getDate() + 5); // Default 5 days
                                } else {
                                  arrivalDate.setDate(today.getDate() + 30); // Default 30 days
                                }
                                const arrivalDateStr = arrivalDate.toISOString().split("T")[0];

                                // Suggest capacity based on mode (preserving logic)
                                const newWeight = newMode === "air" ? 1000 : 0;
                                const newVolume = newMode === "sea" ? 76 : 0;

                                setFormData({
                                  ...formData,
                                  transport_mode: newMode,
                                  service_type: newType,
                                  cargo_weight: newWeight,
                                  cargo_volume: newVolume,
                                  departure_date: departureDate,
                                  arrival_estimated_date: arrivalDateStr,
                                });
                              }}
                            />
                            {isSelected && (
                              <div className={`absolute top-3 right-3 w-5 h-5 bg-${option.color}-500 rounded-full flex items-center justify-center`}>
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}

                            <div className="flex items-center gap-3 mb-3">
                              <div className={`p-2 rounded-lg bg-${option.color}-100 text-${option.color}-600`}>
                                <Icon className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{option.label}</h4>
                                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                                  <Clock className="w-3 h-3" />
                                  {option.transit}
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-gray-600 mb-3">{option.description}</p>

                            <div className="space-y-1">
                              {option.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-1.5">
                                  <Check className={`w-3 h-3 text-${option.color}-500`} />
                                  <span className="text-xs text-gray-500">{feature}</span>
                                </div>
                              ))}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Route & Cargo Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                        <MapPin className="w-4 h-4 text-blue-600" /> Route &
                        Transport
                      </h4>
                      <div className="space-y-4">
                        {/* Origin Country Dropdown */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pays d'Origine
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                            <input
                              type="text"
                              aria-label="Rechercher pays d'origine"
                              placeholder="Rechercher ou ajouter..."
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary text-sm transition-all shadow-sm"
                              value={
                                showOriginDropdown
                                  ? searchTermOrigin
                                  : formData.origin_country
                              }
                              onChange={(e) => {
                                setSearchTermOrigin(e.target.value);
                                if (!showOriginDropdown)
                                  setShowOriginDropdown(true);
                              }}
                              onFocus={() => {
                                setSearchTermOrigin("");
                                setShowOriginDropdown(true);
                              }}
                              onBlur={() =>
                                setTimeout(
                                  () => setShowOriginDropdown(false),
                                  200,
                                )
                              }
                            />
                            {showOriginDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                {filteredLocationsOrigin.map((loc) => (
                                  <button
                                    key={loc.id}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        origin_country: loc.name,
                                      });
                                      setShowOriginDropdown(false);
                                    }}
                                  >
                                    {loc.name}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-blue-600 font-medium border-t border-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setLocationFieldToAdd("origin");
                                    setIsAddLocationModalOpen(true);
                                    setShowOriginDropdown(false);
                                  }}
                                >
                                  <Plus className="w-4 h-4" /> Ajouter "
                                  {searchTermOrigin}"
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Destination Country Dropdown */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pays de Destination
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                            <input
                              type="text"
                              aria-label="Rechercher pays de destination"
                              placeholder="Rechercher ou ajouter..."
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary text-sm transition-all shadow-sm"
                              value={
                                showDestDropdown
                                  ? searchTermDest
                                  : formData.destination_country
                              }
                              onChange={(e) => {
                                setSearchTermDest(e.target.value);
                                if (!showDestDropdown)
                                  setShowDestDropdown(true);
                              }}
                              onFocus={() => {
                                setSearchTermDest("");
                                setShowDestDropdown(true);
                              }}
                              onBlur={() =>
                                setTimeout(
                                  () => setShowDestDropdown(false),
                                  200,
                                )
                              }
                            />
                            {showDestDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                {filteredLocationsDest.map((loc) => (
                                  <button
                                    key={loc.id}
                                    type="button"
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                                    onClick={() => {
                                      setFormData({
                                        ...formData,
                                        destination_country: loc.name,
                                      });
                                      setShowDestDropdown(false);
                                    }}
                                  >
                                    {loc.name}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-blue-600 font-medium border-t border-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    setLocationFieldToAdd("destination");
                                    setIsAddLocationModalOpen(true);
                                    setShowDestDropdown(false);
                                  }}
                                >
                                  <Plus className="w-4 h-4" /> Ajouter "
                                  {searchTermDest}"
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                        <Package className="w-4 h-4 text-blue-600" /> Colis
                      </h4>

                      {/* Multi-select Dropdown */}
                      {/* Multi-select Dropdown (Hidden if Rate Mode) */}
                      <div className="relative" ref={dropdownRef}>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Type de colis
                        </label>

                        {formData.origin_id ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-600 flex justify-between items-center">
                            <span>Tous les types de colis autorisés</span>
                            <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                              Pré-défini
                            </span>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setIsTypeDropdownOpen(!isTypeDropdownOpen)
                              }
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                              <span className="truncate">
                                {formData.cargo_types.length > 0
                                  ? formData.cargo_types.join(", ")
                                  : "Sélectionner les types..."}
                              </span>
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>

                            {isTypeDropdownOpen && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                                <div className="p-2 border-b border-gray-100">
                                  <button
                                    type="button"
                                    onClick={toggleAllTypes}
                                    className="text-xs font-bold text-primary hover:text-blue-700 w-full text-left px-2 py-1"
                                  >
                                    {formData.cargo_types.length ===
                                      packageTypes.length
                                      ? "Tout désélectionner"
                                      : "Tout sélectionner"}
                                  </button>
                                </div>
                                <div className="p-2 space-y-1">
                                  {packageTypes.map((type) => (
                                    <label
                                      key={type.id}
                                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                    >
                                      <div
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.cargo_types.includes(
                                          type.value,
                                        )
                                          ? "bg-primary border-primary text-white"
                                          : "border-gray-300 bg-white"
                                          }`}
                                      >
                                        {formData.cargo_types.includes(
                                          type.value,
                                        ) && <Check className="w-3 h-3" />}
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.cargo_types.includes(
                                          type.value,
                                        )}
                                        onChange={() => toggleType(type.value)}
                                      />
                                      <span className="text-sm text-gray-700">
                                        {type.label}
                                      </span>
                                    </label>
                                  ))}
                                  <button
                                    type="button"
                                    className="w-full text-left px-2 py-2 hover:bg-blue-50 text-sm text-blue-600 font-medium border-t border-gray-100 flex items-center gap-2 rounded-lg"
                                    onClick={() => {
                                      setIsAddPackageTypeModalOpen(true);
                                      setIsTypeDropdownOpen(false);
                                    }}
                                  >
                                    <Plus className="w-4 h-4" /> Ajouter un
                                    type...
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {formData.transport_mode === "air" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Poids (kg) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              step="0.1"
                              required
                              className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                              value={formData.cargo_weight || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cargo_weight: Number(e.target.value),
                                  cargo_volume: 0, // Enforce 0 volume for Air
                                })
                              }
                              placeholder="Ex: 50"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                              Poids réel de la marchandise.
                            </p>
                          </div>
                        )}

                        {formData.transport_mode === "sea" && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Volume (cbm) <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0.1"
                              step="0.01"
                              required
                              className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                              value={formData.cargo_volume || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  cargo_volume: Number(e.target.value),
                                  cargo_weight: 0, // Enforce 0 weight for Sea
                                })
                              }
                              placeholder="Ex: 2.5"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                              Volume total en mètres cubes.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide mb-4">
                      <DollarSign className="w-4 h-4 text-blue-600" />{" "}
                      Tarification
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix par{" "}
                        {formData.transport_mode === "sea" ? "CBM" : "kg"} (
                        {currency})
                      </label>
                      <input
                        type="number"
                        aria-label={`Prix par ${formData.transport_mode === "sea" ? "CBM" : "kg"} `}
                        min="0"
                        required
                        className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Common Fields for both Single and Batch Mode */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Planning Légal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée de Transit (jours)
                    </label>
                    <input
                      type="text"
                      readOnly
                      aria-label="Durée de transit"
                      className="w-full rounded-xl border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed focus:border-gray-200 focus:ring-0 p-2.5 text-sm transition-all shadow-sm"
                      value={formData.transit_duration}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date de Départ
                    </label>
                    <input
                      type="date"
                      required
                      aria-label="Date de départ"
                      className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                      value={formData.departure_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          departure_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date d'Arrivée Estimée
                    </label>
                    <input
                      type="date"
                      required
                      aria-label="Date d'arrivée estimée"
                      className="w-full rounded-xl border-gray-200 bg-white focus:border-primary focus:ring-primary p-2.5 text-sm transition-all shadow-sm"
                      value={formData.arrival_estimated_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          arrival_estimated_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                  onClick={onClose}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "Création..." : "Créer l'expédition"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {/* Add Location Modal */}
      {isAddLocationModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Ajouter une nouvelle destination
            </h3>
            <form onSubmit={handleAddLocation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Pays
                </label>
                <input
                  type="text"
                  aria-label="Nom du nouveau pays"
                  autoFocus
                  required
                  className="w-full rounded-xl border-gray-200 focus:border-primary focus:ring-primary p-2.5"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Cette destination sera soumise pour validation par les
                  administrateurs.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddLocationModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Add Package Type Modal */}
      {isAddPackageTypeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Ajouter un Type de Colis
            </h3>
            <form onSubmit={handleAddPackageType}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du Type
                </label>
                <input
                  type="text"
                  aria-label="Nom du nouveau type de colis"
                  autoFocus
                  required
                  className="w-full rounded-xl border-gray-200 focus:border-primary focus:ring-primary p-2.5"
                  value={newPackageTypeName}
                  onChange={(e) => setNewPackageTypeName(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ce type sera soumis pour validation par les administrateurs.
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddPackageTypeModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
