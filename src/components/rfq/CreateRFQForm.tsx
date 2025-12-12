import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { rfqService } from "../../services/rfqService";
import type {
  CreateRFQData,
  TransportMode,
  ServiceType,
} from "../../types/rfq";
import { calculateCBM, LengthUnit } from "../../utils/volumeCalculator";
import {
  ArrowLeft,
  Send,
  Save,
  Package,
  Ship,
  Plane,
  Info,
  DollarSign,
  Clock,
  Check,
  MapPin,
  Calendar,
  FileText,
  Globe,
  Shield,
  ShieldCheck,
  Zap,
  Box,
  ClipboardCheck,
  Warehouse,
  FileCheck,
  Truck,
  CheckCircle,
  Plus,
} from "lucide-react";
import { locationService, Location } from "../../services/locationService";
import {
  packageTypeService,
  PackageType,
} from "../../services/packageTypeService";
import { useCurrency } from "../../contexts/CurrencyContext";

export default function CreateRFQForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Dimension inputs for CBM calculation
  const [dimensionUnit, setDimensionUnit] = useState<LengthUnit>("m");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [calculatedCBM, setCalculatedCBM] = useState<number>(0);

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { currency } = useCurrency();

  const initialFormData: CreateRFQData = {
    origin_port: "",
    destination_port: "",
    cargo_type: "",
    cargo_description: "",
    transport_mode: "sea" as TransportMode,
    service_type: "standard" as ServiceType,
    weight_kg: undefined,
    volume_cbm: undefined,
    length_cm: undefined,
    width_cm: undefined,
    height_cm: undefined,
    quantity: 1,
    budget_amount: undefined,
    budget_currency: currency,
    services_needed: [],
    special_requirements: "",
    preferred_departure_date: undefined,
    specific_forwarder_id: undefined,
  };

  const [formData, setFormData] = useState<CreateRFQData>(initialFormData);

  // Update form when currency changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, budget_currency: currency }));
  }, [currency]);

  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Dynamic Data State
  const [locations, setLocations] = useState<Location[]>([]);
  const [packageTypes, setPackageTypes] = useState<PackageType[]>([]);
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locs, pkgs] = await Promise.all([
          locationService.getLocations(),
          packageTypeService.getPackageTypes(),
        ]);
        setLocations(locs);
        setPackageTypes(pkgs);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };
    loadData();
  }, []);

  const filteredOrigins = locations.filter((l) =>
    l.name.toLowerCase().includes(originSearch.toLowerCase()),
  );

  const filteredDestinations = locations.filter((l) =>
    l.name.toLowerCase().includes(destSearch.toLowerCase()),
  );

  // Handle prefill from calculator, edit mode, or URL params
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 1. Handle URL Query Params (Direct Link)
    const forwarderId = searchParams.get("forwarder");
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const mode = searchParams.get("mode");

    if (forwarderId || origin || destination || mode) {
      setFormData((prev) => ({
        ...prev,
        origin_port: origin || prev.origin_port,
        destination_port: destination || prev.destination_port,
        transport_mode: (mode as TransportMode) || prev.transport_mode,
        service_type:
          (searchParams.get("type") as ServiceType) || prev.service_type,
        specific_forwarder_id: forwarderId || prev.specific_forwarder_id,
        special_requirements: forwarderId
          ? `Devis basé sur l'offre du transitaire ID: ${forwarderId}. ${prev.special_requirements}`
          : prev.special_requirements,
      }));
    }

    // 2. Handle Location State (Internal Navigation)
    if (location.state) {
      // Handle Edit Mode
      if (location.state.mode === "edit" && location.state.rfqData) {
        const { rfqData } = location.state;
        setEditMode(true);
        setEditId(rfqData.id);
        setFormData({
          origin_port: rfqData.origin_port,
          destination_port: rfqData.destination_port,
          cargo_type: rfqData.cargo_type,
          cargo_description: rfqData.cargo_description || "",
          transport_mode: rfqData.transport_mode,
          service_type: rfqData.service_type,
          weight_kg: rfqData.weight_kg,
          volume_cbm: rfqData.volume_cbm,
          length_cm: rfqData.length_cm,
          width_cm: rfqData.width_cm,
          height_cm: rfqData.height_cm,
          quantity: rfqData.quantity || 1,
          budget_amount: rfqData.budget_amount,
          budget_currency: rfqData.budget_currency || "XOF",
          services_needed: rfqData.services_needed || [],
          special_requirements: rfqData.special_requirements || "",
          preferred_departure_date: rfqData.preferred_departure_date,
          specific_forwarder_id: rfqData.specific_forwarder_id,
        });

        // Set dimensions if available
        if (rfqData.length_cm) setLength(rfqData.length_cm.toString());
        if (rfqData.width_cm) setWidth(rfqData.width_cm.toString());
        if (rfqData.height_cm) setHeight(rfqData.height_cm.toString());
        if (rfqData.volume_cbm) setCalculatedCBM(rfqData.volume_cbm);
      }
      // Handle Calculator Prefill
      else if (location.state.prefill) {
        const { prefill } = location.state;

        // Update dimensions first
        if (prefill.cargo_details) {
          if (prefill.cargo_details.unit)
            setDimensionUnit(prefill.cargo_details.unit as LengthUnit);
          if (prefill.cargo_details.length)
            setLength(prefill.cargo_details.length);
          if (prefill.cargo_details.width)
            setWidth(prefill.cargo_details.width);
          if (prefill.cargo_details.height)
            setHeight(prefill.cargo_details.height);
        }

        // Update form data
        setFormData((prev) => ({
          ...prev,
          origin_port: prefill.origin_port || prev.origin_port,
          destination_port: prefill.destination_port || prev.destination_port,
          transport_mode:
            (prefill.transport_mode as TransportMode) || prev.transport_mode,
          service_type:
            (prefill.service_type as ServiceType) || prev.service_type,
          weight_kg: prefill.cargo_details?.weight
            ? parseFloat(prefill.cargo_details.weight)
            : undefined,
          budget_amount: prefill.budget
            ? Math.round(prefill.budget)
            : undefined,
          // Only set specific_forwarder_id if it's a valid UUID
          specific_forwarder_id:
            prefill.target_forwarder &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                prefill.target_forwarder,
              )
              ? prefill.target_forwarder
              : undefined,
          // If a specific forwarder was selected, we might want to store it in special requirements or a specific field
          // For now, we'll append it to special requirements if present
          special_requirements: prefill.target_forwarder
            ? `Devis basé sur l'offre du transitaire: ${prefill.quote_details?.forwarder_name || prefill.target_forwarder}. ${prev.special_requirements}`
            : prev.special_requirements,
        }));
      }
    }
  }, [location.state, searchParams]);

  // Calculate CBM automatically
  useEffect(() => {
    if (length && width && height) {
      const cbm = calculateCBM({
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        unit: dimensionUnit,
      });
      setCalculatedCBM(cbm);
      setFormData((prev) => ({ ...prev, volume_cbm: cbm }));
    } else {
      setCalculatedCBM(0);
      setFormData((prev) => ({ ...prev, volume_cbm: undefined }));
    }
  }, [length, width, height, dimensionUnit]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number" ? (value ? parseFloat(value) : undefined) : value,
    }));
  };

  const handleModeChange = (mode: TransportMode) => {
    setFormData((prev) => ({ ...prev, transport_mode: mode }));
  };

  const handleServiceChange = (service: ServiceType) => {
    setFormData((prev) => ({ ...prev, service_type: service }));
  };

  const handleSubmit = async (
    e: React.FormEvent | React.MouseEvent,
    publish: boolean = false,
  ) => {
    e.preventDefault();
    setError(null);

    // Custom Validation
    if (!formData.origin_port?.trim()) {
      setError(t("calculator.origin") + " est requis");
      window.scrollTo(0, 0);
      return;
    }
    if (!formData.destination_port?.trim()) {
      setError(t("calculator.destination") + " est requis");
      window.scrollTo(0, 0);
      return;
    }
    if (!formData.cargo_type?.trim()) {
      setError(t("rfq.form.cargoType") + " est requis");
      window.scrollTo(0, 0);
      return;
    }

    if (
      formData.transport_mode === "sea" &&
      (!formData.volume_cbm || formData.volume_cbm <= 0)
    ) {
      setError(
        "Le volume (CBM) est requis pour le fret maritime. Veuillez entrer les dimensions.",
      );
      return;
    }

    if (
      formData.transport_mode === "air" &&
      (!formData.weight_kg || formData.weight_kg <= 0)
    ) {
      setError("Le poids (kg) est requis pour le fret aérien.");
      return;
    }

    // Manual validation using ref (fallback)
    if (formRef.current && !formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setLoading(true);

    try {
      let rfq;
      if (editMode && editId) {
        // Update existing RFQ
        rfq = await rfqService.updateRFQ(editId, formData);

        if (publish) {
          await rfqService.publishRFQ(rfq.id);
        }

        // Show success modal with different message
        setShowSuccessModal(true);
      } else {
        // Create new RFQ
        rfq = await rfqService.createRFQ(formData);

        if (publish) {
          await rfqService.publishRFQ(rfq.id);
        }

        // Reset form and show success modal
        setFormData(initialFormData);
        setLength("");
        setWidth("");
        setHeight("");
        setCalculatedCBM(0);
        setShowSuccessModal(true);
      }
    } catch (error) {
      console.error("Error saving RFQ:", error);
      let errorMessage = "Une erreur est survenue";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
      ) {
        errorMessage = (error as any).message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          errorMessage = "Erreur inconnue";
        }
      }

      setError(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // UI Constants (Copied/Adapted from Calculator)
  const TRANSPORT_MODE_INFO = {
    sea: {
      icon: Ship,
      label: t("calculator.sea.label"),
      measurement: t("calculator.sea.measurement"),
      pricing: t("calculator.sea.pricing"),
      duration: t("calculator.sea.duration"),
      conditions: t("calculator.sea.conditions"),
      advantages: [
        t("calculator.sea.advantages.economical"),
        t("calculator.sea.advantages.largeVolumes"),
        t("calculator.sea.advantages.ecological"),
      ],
    },
    air: {
      icon: Plane,
      label: t("calculator.air.label"),
      measurement: t("calculator.air.measurement"),
      pricing: t("calculator.air.pricing"),
      duration: t("calculator.air.duration"),
      conditions: t("calculator.air.conditions"),
      advantages: [
        t("calculator.air.advantages.fast"),
        t("calculator.air.advantages.secure"),
        t("calculator.air.advantages.urgent"),
      ],
    },
  };

  const getServiceDetails = (type: "standard" | "express", mode: string) => {
    const isSea = mode === "sea";
    if (type === "standard") {
      return {
        pricing: isSea ? "Standard Rate" : "Standard Rate",
        transitNote: isSea
          ? `45-60 ${t("calculator.days")}`
          : `5-7 ${t("calculator.days")}`,
        description: t("calculator.standard.description"),
      };
    } else {
      return {
        pricing: isSea ? "Premium Rate" : "Express Rate",
        transitNote: isSea
          ? `30-45 ${t("calculator.days")}`
          : `2-3 ${t("calculator.days")}`,
        description: t("calculator.express.description"),
      };
    }
  };

  const standardDetails = getServiceDetails(
    "standard",
    formData.transport_mode,
  );
  const expressDetails = getServiceDetails("express", formData.transport_mode);

  const SERVICE_TYPE_INFO = {
    standard: {
      label: t("calculator.standard.label"),
      description: standardDetails.description,
      pricing: standardDetails.pricing,
      features: [
        t("calculator.standard.features.consolidation"),
        t("calculator.standard.features.bestValue"),
        t("calculator.standard.features.normalDelay"),
      ],
      transitNote: standardDetails.transitNote,
    },
    express: {
      label: t("calculator.express.label"),
      description: expressDetails.description,
      pricing: expressDetails.pricing,
      features: [
        t("calculator.express.features.maxPriority"),
        t("calculator.express.features.directTransit"),
        t("calculator.express.features.fastCustoms"),
      ],
      transitNote: expressDetails.transitNote,
    },
  };

  // Booking Mode Layout (when coming from Calculator with a quote)
  if (location.state?.prefill?.quote_details) {
    const quote = location.state.prefill.quote_details;

    return (
      <form ref={formRef} className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/calculator")}
            className="flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Retour au calculateur
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Finaliser votre Réservation
          </h1>
          <p className="text-gray-600">
            Confirmez les détails de votre expédition pour valider la demande.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Quote Card */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-primary/10 overflow-hidden">
              <div className="bg-primary/5 px-6 py-4 border-b border-primary/10 flex justify-between items-center">
                <span className="font-bold text-primary flex items-center gap-2">
                  <Check className="w-5 h-5" /> Offre Sélectionnée
                </span>
                <span className="bg-primary text-white text-xs px-3 py-1 rounded-full font-medium">
                  OFFICIEL
                </span>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {quote.forwarder_name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-500 mt-1">
                      <Clock className="w-4 h-4" />
                      <span>Transit: {quote.transit_time}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Coût Total Estimé</p>
                    <p className="text-2xl font-bold text-primary">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: formData.budget_currency || "XOF",
                        maximumFractionDigits: 0,
                      }).format(quote.total_cost)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
                  <div>
                    <span className="text-gray-500 block mb-1">Transport</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: formData.budget_currency || "XOF",
                        maximumFractionDigits: 0,
                      }).format(quote.base_cost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-1">Assurance</span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: formData.budget_currency || "XOF",
                        maximumFractionDigits: 0,
                      }).format(quote.insurance_cost)}
                    </span>
                  </div>
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <span className="text-gray-500 block mb-1">
                      Sous-total HT
                    </span>
                    <span className="font-medium text-gray-900">
                      {new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: formData.budget_currency || "XOF",
                        maximumFractionDigits: 0,
                      }).format(quote.base_cost + quote.insurance_cost)}
                    </span>
                  </div>
                  {quote.tax_cost > 0 && (
                    <div>
                      <span className="text-gray-500 block mb-1">
                        TVA (18%)
                      </span>
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: formData.budget_currency || "XOF",
                          maximumFractionDigits: 0,
                        }).format(quote.tax_cost)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 block mb-1">Mode</span>
                    <span className="font-medium text-gray-900 capitalize flex items-center gap-1">
                      {formData.transport_mode === "sea" ? (
                        <Ship className="w-3 h-3" />
                      ) : (
                        <Plane className="w-3 h-3" />
                      )}
                      {t(`calculator.${formData.transport_mode}.label`)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Details Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-500" />
                Détails de l'Expédition
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Itinéraire
                  </span>
                  <div className="flex items-center gap-2 mt-1 font-medium text-gray-900">
                    {formData.origin_port}{" "}
                    <ArrowLeft className="w-4 h-4 rotate-180 text-gray-400" />{" "}
                    {formData.destination_port}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Dimensions
                  </span>
                  <div className="mt-1 font-medium text-gray-900">
                    {formData.transport_mode === "sea"
                      ? `${calculatedCBM.toFixed(2)} CBM`
                      : `${formData.weight_kg} kg`}
                  </div>
                </div>
              </div>
            </div>

            {/* Missing Information Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                Compléter la Demande
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("rfq.form.cargoType")} *
                  </label>
                  <input
                    type="text"
                    name="cargo_type"
                    required
                    value={formData.cargo_type}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="Ex: Electronics"
                    aria-label="Type de marchandise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("rfq.form.cargoDescription")}
                  </label>
                  <textarea
                    name="cargo_description"
                    value={formData.cargo_description}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    placeholder="Description détaillée de la marchandise..."
                    aria-label="Description de la marchandise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Cible
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="budget_amount"
                      value={formData.budget_amount || ""}
                      onChange={handleChange}
                      className="block w-full pr-16 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      placeholder="0.00"
                      onWheel={(e) => e.currentTarget.blur()}
                      aria-label="Montant du budget"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <select
                        name="budget_currency"
                        value={formData.budget_currency}
                        onChange={handleChange}
                        className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md focus:ring-primary focus:border-primary"
                        aria-label="Devise du budget"
                      >
                        <option>XOF</option>
                        <option>EUR</option>
                        <option>USD</option>
                        <option>CNY</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de départ souhaitée
                    </label>
                    <input
                      type="date"
                      name="preferred_departure_date"
                      value={
                        formData.preferred_departure_date
                          ? new Date(formData.preferred_departure_date)
                            .toISOString()
                            .split("T")[0]
                          : ""
                      }
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      aria-label="Date de départ souhaitée"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      onWheel={(e) => e.currentTarget.blur()}
                      aria-label="Quantité"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Confirmation
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                En confirmant, votre demande sera envoyée directement au
                transitaire sélectionné pour validation finale.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 mb-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-5 h-5" />
                )}
                Confirmer la Réservation
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, false)}
                disabled={loading}
                className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Enregistrer pour plus tard
              </button>
            </div>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {editMode ? "Modifier la demande" : t("rfq.create.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {editMode
              ? "Mettez à jour les informations de votre demande"
              : t("rfq.create.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          <form
            ref={formRef}
            onSubmit={(e) => handleSubmit(e, false)}
            className="space-y-8"
          >
            {/* Route Section */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Itinéraire
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("calculator.origin")} *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="text"
                      name="origin_port"
                      required
                      value={originSearch || formData.origin_port}
                      onChange={(e) => {
                        setOriginSearch(e.target.value);
                        setShowOriginDropdown(true);
                        setFormData((prev) => ({
                          ...prev,
                          origin_port: e.target.value,
                        }));
                      }}
                      onFocus={() => {
                        setOriginSearch("");
                        setShowOriginDropdown(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowOriginDropdown(false), 200)
                      }
                      className="block w-full pl-10 pr-3 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      placeholder="Ex: Shanghai, China"
                    />
                    {showOriginDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredOrigins.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                origin_port: loc.name,
                              }));
                              setOriginSearch(loc.name);
                              setShowOriginDropdown(false);
                            }}
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("calculator.destination")} *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                    <input
                      type="text"
                      name="destination_port"
                      required
                      value={destSearch || formData.destination_port}
                      onChange={(e) => {
                        setDestSearch(e.target.value);
                        setShowDestDropdown(true);
                        setFormData((prev) => ({
                          ...prev,
                          destination_port: e.target.value,
                        }));
                      }}
                      onFocus={() => {
                        setDestSearch("");
                        setShowDestDropdown(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setShowDestDropdown(false), 200)
                      }
                      className="block w-full pl-10 pr-3 py-2.5 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      placeholder="Ex: Dakar, Senegal"
                      aria-label="Port de destination"
                    />
                    {showDestDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredDestinations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                destination_port: loc.name,
                              }));
                              setDestSearch(loc.name);
                              setShowDestDropdown(false);
                            }}
                          >
                            {loc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Transport & Service Selection (4 Cards) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Mode de Transport & Service
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    mode: "sea" as TransportMode,
                    type: "standard" as ServiceType,
                    icon: Ship,
                    label: "Maritime Standard",
                    description: "Économique pour grands volumes",
                    transit: "45-60 jours",
                    features: ["Groupage possible", "Meilleur tarif", "Écologique"],
                    color: "blue"
                  },
                  {
                    mode: "sea" as TransportMode,
                    type: "express" as ServiceType,
                    icon: Ship,
                    label: "Maritime Express",
                    description: "Prioritaire & Rapide",
                    transit: "30-45 jours",
                    features: ["Départ prioritaire", "Trajet direct", "Suivi Premium"],
                    color: "indigo"
                  },
                  {
                    mode: "air" as TransportMode,
                    type: "standard" as ServiceType,
                    icon: Plane,
                    label: "Aérien Standard",
                    description: "Compromis Coût/Délai",
                    transit: "5-7 jours",
                    features: ["Vols réguliers", "Sécurisé", "Fiable"],
                    color: "sky"
                  },
                  {
                    mode: "air" as TransportMode,
                    type: "express" as ServiceType,
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
                        name="rfq_transport_selection"
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => {
                          setFormData((prev) => ({
                            ...prev,
                            transport_mode: option.mode,
                            service_type: option.type,
                          }));
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

            {/* Cargo Details */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Détails de la Marchandise
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("rfq.form.cargoType")} *
                  </label>
                  <select
                    name="cargo_type"
                    required
                    value={formData.cargo_type}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    aria-label="Type de marchandise"
                  >
                    <option value="">Sélectionner un type...</option>
                    {packageTypes.map((type) => (
                      <option key={type.id} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    aria-label="Quantité"
                  />
                </div>
              </div>

              {formData.transport_mode === "sea" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("calculator.measurementUnit")}
                    </label>
                    <select
                      value={dimensionUnit}
                      onChange={(e) =>
                        setDimensionUnit(e.target.value as LengthUnit)
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      aria-label="Unité de mesure"
                    >
                      <option value="m">
                        {t("calculator.units.meters")} (m)
                      </option>
                      <option value="cm">
                        {t("calculator.units.centimeters")} (cm)
                      </option>
                      <option value="in">
                        {t("calculator.units.inches")} (in)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("calculator.dimensions")}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {t("calculator.length")}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={length}
                          onChange={(e) => setLength(e.target.value)}
                          placeholder="0.00"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          aria-label="Longueur"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {t("calculator.width")}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={width}
                          onChange={(e) => setWidth(e.target.value)}
                          placeholder="0.00"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          aria-label="Largeur"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {t("calculator.height")}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          placeholder="0.00"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                          aria-label="Hauteur"
                        />
                      </div>
                    </div>
                  </div>
                  {calculatedCBM > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium text-green-900">
                          {t("calculator.volumeCalculated")}:{" "}
                          <strong>{calculatedCBM.toFixed(4)} CBM</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("calculator.weightKG")}
                  </label>
                  <input
                    type="number"
                    name="weight_kg"
                    step="0.1"
                    value={formData.weight_kg || ""}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    aria-label="Poids en kg"
                  />
                </div>
              )}

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("rfq.form.cargoDescription")}
                </label>
                <textarea
                  name="cargo_description"
                  value={formData.cargo_description}
                  onChange={handleChange}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  placeholder="Description détaillée..."
                  aria-label="Description détaillée"
                />
              </div>
            </div>

            {/* Additional Services Section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-600" />
                Services Additionnels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    id: "insurance",
                    label: "Assurance (Garantie Plateforme)",
                    desc: "Protection complète contre la perte ou les dommages",
                    icon: ShieldCheck,
                    color: "blue",
                  },
                  {
                    id: "priority",
                    label: "Traitement Prioritaire",
                    desc: "Accélérez le traitement de votre dossier",
                    icon: Zap,
                    color: "orange",
                  },
                  {
                    id: "packaging",
                    label: "Emballage Renforcé",
                    desc: "Protection supplémentaire pour vos colis fragiles",
                    icon: Box,
                    color: "indigo",
                  },
                  {
                    id: "inspection",
                    label: "Inspection Qualité",
                    desc: "Vérification de la conformité de la marchandise",
                    icon: ClipboardCheck,
                    color: "green",
                  },
                  {
                    id: "door_to_door",
                    label: "Door to Door",
                    desc: "Livraison jusqu'à l'adresse finale",
                    icon: Truck,
                    color: "cyan",
                  },
                  {
                    id: "storage",
                    label: "Stockage",
                    desc: "Entreposage temporaire",
                    icon: Warehouse,
                    color: "slate",
                  },
                ].map((service) => {
                  const Icon = service.icon;
                  const isSelected = formData.services_needed?.includes(
                    service.id as any,
                  );

                  return (
                    <label
                      key={service.id}
                      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${isSelected
                        ? `border-${service.color}-500 bg-${service.color}-50 ring-1 ring-${service.color}-500`
                        : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                      <div
                        className={`p-2 rounded-full mr-4 ${isSelected
                          ? `bg-${service.color}-500 text-white`
                          : `bg-${service.color}-100 text-${service.color}-600`
                          }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1">
                        <span
                          className={`font-bold block ${isSelected ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {service.label}
                        </span>
                        <span className="text-xs text-gray-500 leading-tight block mt-0.5">
                          {service.desc}
                        </span>
                      </div>

                      <div className="ml-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setFormData((prev) => {
                              const currentServices =
                                prev.services_needed || [];
                              if (isChecked) {
                                return {
                                  ...prev,
                                  services_needed: [
                                    ...currentServices,
                                    service.id as any,
                                  ],
                                };
                              } else {
                                return {
                                  ...prev,
                                  services_needed: currentServices.filter(
                                    (id) => id !== service.id,
                                  ),
                                };
                              }
                            });
                          }}
                          className={`h-5 w-5 text-${service.color}-600 border-gray-300 rounded focus:ring-${service.color}-500`}
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Détails Supplémentaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Budget Cible
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      name="budget_amount"
                      value={formData.budget_amount || ""}
                      onChange={handleChange}
                      className="block w-full pr-16 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                      placeholder="0.00"
                      aria-label="Montant du budget"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center">
                      <select
                        name="budget_currency"
                        value={formData.budget_currency}
                        onChange={handleChange}
                        className="h-full py-0 pl-2 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-md focus:ring-primary focus:border-primary"
                        aria-label="Devise du budget"
                      >
                        <option>XOF</option>
                        <option>EUR</option>
                        <option>USD</option>
                        <option>CNY</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de départ souhaitée
                  </label>
                  <input
                    type="date"
                    name="preferred_departure_date"
                    value={
                      formData.preferred_departure_date
                        ? new Date(formData.preferred_departure_date)
                          .toISOString()
                          .split("T")[0]
                        : ""
                    }
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    aria-label="Date de départ souhaitée"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exigences Spéciales
                </label>
                <textarea
                  name="special_requirements"
                  value={formData.special_requirements}
                  onChange={handleChange}
                  rows={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  placeholder="Instructions particulières..."
                  aria-label="Instructions particulières"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Summary & Actions */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Résumé</h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Mode</span>
                  <span className="font-medium capitalize">
                    {t(`calculator.modes.${formData.transport_mode}`)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Service</span>
                  <span className="font-medium capitalize">
                    {formData.service_type}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mb-1"></div>
                      <div className="w-0.5 h-6 bg-gray-200 mx-auto"></div>
                      <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Origine
                        </p>
                        <p className="font-medium text-gray-900">
                          {formData.origin_port || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">
                          Destination
                        </p>
                        <p className="font-medium text-gray-900">
                          {formData.destination_port || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <button
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {editMode
                        ? "Mettre à jour et Publier"
                        : t("rfq.create.submit")}
                    </>
                  )}
                </button>

                <button
                  onClick={(e) => handleSubmit(e, false)}
                  disabled={loading}
                  className="w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {editMode
                    ? "Enregistrer les modifications"
                    : "Enregistrer Brouillon"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {editMode ? "Demande Mise à Jour !" : "Demande Publiée !"}
            </h3>
            <p className="text-gray-600 mb-6">
              {editMode
                ? "Votre demande de cotation a été mise à jour avec succès."
                : "Votre demande de cotation a été envoyée avec succès. Les transitaires vont bientôt vous répondre."}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => navigate("/dashboard/client/rfq")}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                Voir mes demandes
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                {editMode
                  ? "Continuer les modifications"
                  : "Créer une autre demande"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
