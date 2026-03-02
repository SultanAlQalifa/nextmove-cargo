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
  Clock,
  Check,
  MapPin,
  FileText,
  Globe,
  Shield,
  ShieldCheck,
  Zap,
  Box,
  ClipboardCheck,
  Warehouse,
  Truck,
  CheckCircle,
  CreditCard,
  Headphones,
} from "lucide-react";
import { motion } from "framer-motion";
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
    payment_method: "on_delivery",
    is_retry: false,
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
          ? `Devis basé sur l'offre du prestataire ID: ${forwarderId}. ${prev.special_requirements}`
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
      // Handle Retry Mode
      else if (location.state.mode === "retry" && location.state.rfqData) {
        const { rfqData } = location.state;
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

          // Retry Specifics
          is_retry: true,
          parent_rfq_id: rfqData.id,
          payment_method: "online" // Force online payment
        });

        // Set dimensions
        if (rfqData.length_cm) setLength(rfqData.length_cm.toString());
        if (rfqData.width_cm) setWidth(rfqData.width_cm.toString());
        if (rfqData.height_cm) setHeight(rfqData.height_cm.toString());
        if (rfqData.volume_cbm) setCalculatedCBM(rfqData.volume_cbm);
      }
      // Handle Lead Prefill (Direct Conversion)
      else if (location.state.leadPrefill) {
        const { leadPrefill } = location.state;
        setFormData((prev) => ({
          ...prev,
          origin_port: leadPrefill.origin_port || prev.origin_port,
          destination_port: leadPrefill.destination_port || prev.destination_port,
          cargo_type: leadPrefill.cargo_type || prev.cargo_type,
          cargo_description: leadPrefill.cargo_description || prev.cargo_description,
          weight_kg: leadPrefill.weight_kg || prev.weight_kg,
          transport_mode: leadPrefill.transport_mode || prev.transport_mode,
          special_requirements: `Lead converti (ID: ${leadPrefill.lead_id}). ${prev.special_requirements}`
        }));
      }
      // Handle Calculator Prefill
      else if (location.state.prefill) {
        const { prefill, isRetry, parentRfqId } = location.state;

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

          // Retry Logic
          is_retry: !!isRetry,
          parent_rfq_id: parentRfqId,
          payment_method: isRetry ? "online" : "on_delivery", // Force online for retry

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
            ? `Devis basé sur l'offre du prestataire: ${prefill.quote_details?.forwarder_name || prefill.target_forwarder}. ${prev.special_requirements}`
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

        // Auto redirect after 2.5 seconds
        setTimeout(() => {
          navigate(`/dashboard/client/rfq/${editId}`);
        }, 2500);
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

        // Auto redirect after 2.5 seconds
        setTimeout(() => {
          navigate("/dashboard/client/rfq");
        }, 2500);
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




  // Booking Mode Layout (when coming from Calculator with a quote)
  if (location.state?.prefill?.quote_details) {
    const quote = location.state.prefill.quote_details;

    return (
      <form ref={formRef} className="max-w-6xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <button
            type="button"
            onClick={() => navigate("/calculator")}
            className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-blue-500 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Retour au calculateur
          </button>

          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Finaliser votre <span className="text-blue-600">Réservation</span>
          </h1>

          {/* Progress Stepper */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-green-200">
                <Check className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Devis</span>
            </div>
            <div className="w-12 h-0.5 bg-blue-100"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-200 ring-4 ring-blue-50">
                2
              </div>
              <span className="text-sm font-bold text-slate-900">Réservation</span>
            </div>
            <div className="w-12 h-0.5 bg-slate-100"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="text-sm font-medium text-slate-400">Confirmation</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            {/* Selected Quote Card - Premium Redesign */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-slate-900 px-8 py-5 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 glass flex items-center justify-center">
                      <ShieldCheck className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Offre Sélectionnée</p>
                      <h3 className="text-lg font-bold tracking-tight">{quote.forwarder_name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-tighter border border-green-500/30">Tarif Garanti</span>
                    <span className="px-3 py-1 rounded-full bg-blue-500 text-white text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-blue-500/20">PREMIUM</span>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div className="flex items-center gap-6">
                      <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Transit</p>
                        <p className="text-xl font-black text-slate-900">{quote.transit_time}</p>
                      </div>
                      <div className="w-px h-12 bg-slate-100 hidden md:block"></div>
                      <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mode</p>
                        <div className="flex items-center justify-center gap-2 text-xl font-black text-slate-900">
                          {formData.transport_mode === "sea" ? <Ship className="w-5 h-5 text-blue-500" /> : <Plane className="w-5 h-5 text-blue-500" />}
                          <span className="capitalize">{t(`calculator.${formData.transport_mode}.label`)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Montant Total à Payer</p>
                      <div className="text-4xl font-black text-slate-900">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: formData.budget_currency || "XOF",
                          maximumFractionDigits: 0,
                        }).format(quote.total_cost)}
                      </div>
                      <p className="text-[10px] font-medium text-green-600 mt-1 flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 fill-current" /> Meilleur prix du marché détecté
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Fret Base</span>
                      <p className="font-bold text-slate-700">{new Intl.NumberFormat(undefined, { style: "currency", currency: formData.budget_currency || "XOF", maximumFractionDigits: 0 }).format(quote.base_cost)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Assurance</span>
                      <p className="font-bold text-slate-700">{quote.insurance_cost > 0 ? new Intl.NumberFormat(undefined, { style: "currency", currency: formData.budget_currency || "XOF", maximumFractionDigits: 0 }).format(quote.insurance_cost) : "Incluse"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">TVA & Taxes</span>
                      <p className="font-bold text-slate-700">{new Intl.NumberFormat(undefined, { style: "currency", currency: formData.budget_currency || "XOF", maximumFractionDigits: 0 }).format(quote.tax_cost || 0)}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Garantie Livraison</span>
                      <p className="font-bold text-blue-600 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> 100% Protégé
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trust Signals Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: "Paiement Sécurisé", desc: "Transactions cryptées SSL 256-bits", color: "blue" },
                { icon: Zap, title: "Validation Express", desc: "Réservation confirmée en < 5min", color: "amber" },
                { icon: Headphones, title: "Support Dédié", desc: "Conseillers logistiques 24/7", color: "purple" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4"
                >
                  <div className={`w-10 h-10 rounded-xl bg-${item.color}-500/10 flex items-center justify-center flex-shrink-0`}>
                    <item.icon className={`w-5 h-5 text-${item.color}-500`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Form & Details in Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Shipment Details Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
              >
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Récapitulatif de l'Envoi</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100/30">
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase mb-1">Itinéraire</p>
                      <div className="flex items-center gap-3 font-black text-slate-900">
                        {formData.origin_port}
                        <ArrowLeft className="w-4 h-4 rotate-180 text-blue-500" />
                        {formData.destination_port}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Globe className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase mb-1">Volume/Poids</p>
                      <p className="text-slate-900">
                        {formData.transport_mode === "sea"
                          ? `${calculatedCBM.toFixed(2)} CBM`
                          : `${formData.weight_kg} kg`}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase mb-1">Marchandise</p>
                      <p className="text-slate-900 truncate">{formData.cargo_type || "À préciser"}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Form Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-xl font-bold text-slate-900">Compléter l'Envoi</h3>
                </div>

                <div className="space-y-5">
                  <div className="group">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-blue-500 transition-colors">
                      {t("rfq.form.cargoType")} *
                    </label>
                    <input
                      type="text"
                      name="cargo_type"
                      required
                      value={formData.cargo_type}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 font-medium"
                      placeholder="Ex: Électroménager, Textile..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
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
                      className="block w-full px-4 py-3 bg-slate-50 border border-slate-100 text-slate-900 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                      aria-label="Date de départ souhaitée"
                      title="Date de départ souhaitée"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/30">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
              <div className="relative flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-xl font-black mb-1 leading-tight">Garantie NextMove Protection Plus</h4>
                  <p className="text-blue-100 text-sm">Votre paiement est consigné sur un compte séquestre et ne sera libéré au prestataire qu'après confirmation de l'enlèvement de votre marchandise.</p>
                </div>
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-100 overflow-hidden shadow-lg">
                      <img src={`https://i.pravatar.cc/100?u=user${i}`} alt="user" className="w-full h-full object-cover grayscale brightness-110" />
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-400 flex items-center justify-center text-[10px] font-black shadow-lg">
                    +2k
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="sticky top-10"
            >
              <div className="bg-slate-900 rounded-[2.5rem] p-4 shadow-2xl overflow-hidden relative border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>

                <div className="relative bg-white/5 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 space-y-8">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Confirmation</h3>
                    <div className="h-1.5 w-12 bg-blue-500 rounded-full mx-auto"></div>
                  </div>

                  {/* Payment Methods - Simplified & Elegant */}
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Choix de la validation</p>

                    {[
                      {
                        id: 'on_delivery',
                        title: 'Sur Facture',
                        desc: 'Paiement direct au prestataire',
                        icon: FileText,
                        badge: null,
                        disabled: formData.is_retry
                      },
                      {
                        id: 'online',
                        title: 'Paiement Sécurisé',
                        desc: 'Validation 100% Automatique',
                        icon: CreditCard,
                        badge: 'Recommandé',
                        disabled: false
                      }
                    ].map((method) => (
                      <div
                        key={method.id}
                        onClick={() => !method.disabled && setFormData(prev => ({ ...prev, payment_method: method.id as "online" | "on_delivery" }))}
                        className={`group relative p-5 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${formData.payment_method === method.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : method.disabled ? 'opacity-30 grayscale cursor-not-allowed border-transparent' : 'border-slate-800 hover:border-slate-700 bg-white/5'
                          }`}
                      >
                        <div className="flex items-center gap-4 relative z-10">
                          <div className={`p-3 rounded-xl ${formData.payment_method === method.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-white transition-colors'}`}>
                            <method.icon className="w-5 h-5" />
                          </div>
                          <div className={`flex-1 min-w-0 ${method.badge ? 'pr-16' : ''}`}>
                            <p className={`font-bold text-sm ${formData.payment_method === method.id ? 'text-white' : 'text-slate-300 transition-colors'}`}>{method.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{method.desc}</p>
                          </div>
                          {method.badge && (
                            <span className="absolute top-0 right-0 text-[7px] font-black px-2 py-1 rounded-bl-xl rounded-tr-lg bg-blue-600 text-white uppercase tracking-tighter shadow-lg">
                              {method.badge}
                            </span>
                          )}
                        </div>
                        {formData.payment_method === method.id && (
                          <motion.div layoutId="activePay" className="absolute inset-0 bg-blue-500/5 backdrop-blur-sm shadow-inner" />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between text-slate-400 text-xs px-2">
                      <span>Protection Client</span>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between text-slate-400 text-xs px-2">
                      <span>Paiement Sécurisé</span>
                      <Shield className="w-3 h-3 text-blue-500" />
                    </div>
                    <div className="h-px bg-slate-800"></div>
                    <div className="flex items-center justify-between font-bold px-2">
                      <span className="text-slate-200">Total Final</span>
                      <span className="text-xl text-white">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: formData.budget_currency || "XOF",
                          maximumFractionDigits: 0,
                        }).format(quote.total_cost)}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs text-center font-bold"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="space-y-3 pt-4">
                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, true)}
                      disabled={loading}
                      className="w-full relative group"
                    >
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-2xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
                      <div className="relative w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-blue-500 transition-all flex items-center justify-center gap-3 overflow-hidden">
                        {loading ? (
                          <>
                            Envoi en cours...
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          </>
                        ) : (
                          <>
                            Confirmer Ma Réservation
                            <Send className="w-4 h-4" />
                          </>
                        )}
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, false)}
                      disabled={loading}
                      className="w-full py-4 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors text-center"
                    >
                      Enregistrer le Brouillon
                    </button>
                  </div>
                </div>

                {/* Secure Trust Logos */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale hover:opacity-80 transition-all cursor-default">
                  <div className="flex flex-col items-center">
                    <CreditCard className="w-6 h-6 text-white mb-1" />
                    <span className="text-[8px] text-white font-bold uppercase">SSL Secure</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800"></div>
                  <div className="flex flex-col items-center">
                    <Check className="w-6 h-6 text-white mb-1" />
                    <span className="text-[8px] text-white font-bold uppercase">Verified</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800"></div>
                  <div className="flex flex-col items-center">
                    <ShieldCheck className="w-6 h-6 text-white mb-1" />
                    <span className="text-[8px] text-white font-bold uppercase">PCI DSS</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Réservation Confirmée !
              </h3>
              <p className="text-gray-600 mb-6">
                Votre demande de réservation a été traitée avec succès. Le prestataire a été notifié.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/client/rfq")}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                >
                  Voir mes réservations
                </button>
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
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
                : "Votre demande de cotation a été envoyée avec succès. Les prestataires vont bientôt vous répondre."}
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
