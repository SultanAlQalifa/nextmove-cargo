import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  X,
  Loader2,
  Anchor,
  Plane,
  Calendar,
  Package,
  ShieldCheck,
  Zap,
  Box,
  ClipboardCheck,
  FileCheck,
  Truck,
  Warehouse,
  Globe,
  ArrowRight,
  Check,
  ChevronDown,
} from "lucide-react";
import { CreateConsolidationData } from "../../types/consolidation";
import { consolidationService } from "../../services/consolidationService";
import { locationService, Location } from "../../services/locationService";
import {
  forwarderRateService,
  ForwarderRate,
} from "../../services/forwarderRateService";
import { formatCurrency } from "../../utils/currencyFormatter";

interface CreateConsolidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: "create" | "edit";
  initialData?: Partial<CreateConsolidationData> & { id?: string };
  defaultType?: "forwarder_offer" | "client_request";
}

export default function CreateConsolidationModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "create",
  initialData,
  defaultType = "forwarder_offer",
}: CreateConsolidationModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateConsolidationData>({
    defaultValues: {
      type: defaultType,
      currency: "XOF",
      min_cbm: 1,
      ...initialData,
    },
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [rates, setRates] = useState<ForwarderRate[]>([]);
  const [selectedRateIds, setSelectedRateIds] = useState<string[]>([]);
  const [isRouteDropdownOpen, setIsRouteDropdownOpen] = useState(false);

  // Search states
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  useEffect(() => {
    const loadInitData = async () => {
      try {
        const [locs, myRates] = await Promise.all([
          locationService.getLocations(),
          forwarderRateService.getMyRates(),
        ]);
        setLocations(locs);
        setRates(myRates);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };
    loadInitData();
  }, []);

  const filteredOrigins = locations.filter((l) =>
    l.name.toLowerCase().includes(originSearch.toLowerCase()),
  );

  const filteredDestinations = locations.filter((l) =>
    l.name.toLowerCase().includes(destSearch.toLowerCase()),
  );

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      reset({
        type: defaultType,
        currency: "XOF",
        min_cbm: 1,
        ...initialData,
      });
      setSelectedRateIds([]); // Reset selection
    }
  }, [isOpen, mode, initialData, defaultType, reset]);

  const type = watch("type");
  const transportMode = watch("transport_mode");

  const toggleRateSelection = (rateId: string) => {
    let newSelectedIds: string[];
    if (selectedRateIds.includes(rateId)) {
      newSelectedIds = selectedRateIds.filter((id) => id !== rateId);
    } else {
      newSelectedIds = [...selectedRateIds, rateId];
    }
    setSelectedRateIds(newSelectedIds);

    // Auto-fill form if single selection
    if (newSelectedIds.length === 1) {
      const rate = rates.find((r) => r.id === newSelectedIds[0]);
      if (rate) {
        setValue("origin_port", rate.origin?.name || "");
        setOriginSearch(rate.origin?.name || "");
        setValue("destination_port", rate.destination?.name || "");
        setDestSearch(rate.destination?.name || "");
        setValue("transport_mode", rate.mode);
        setValue("price_per_cbm", rate.price); // Assuming price maps to price_per_cbm for consolidation context
        setValue("currency", rate.currency as any);
        setValue(
          "title",
          `Groupage ${rate.origin?.name} ➝ ${rate.destination?.name}`,
        );
      }
    }
  };

  const onSubmit = async (data: CreateConsolidationData) => {
    setLoading(true);
    try {
      // Sanitize data: Convert empty strings to undefined for dates
      const cleanData = {
        ...data,
        deadline_date: data.deadline_date || undefined,
        departure_date: data.departure_date || undefined,
        arrival_date: data.arrival_date || undefined,
        // Only keep relevance capacity based on mode
        total_capacity_cbm:
          data.transport_mode === "sea" && data.total_capacity_cbm
            ? Number(data.total_capacity_cbm)
            : undefined,
        total_capacity_kg:
          data.transport_mode === "air" && data.total_capacity_kg
            ? Number(data.total_capacity_kg)
            : undefined,
        price_per_cbm: data.price_per_cbm
          ? Number(data.price_per_cbm)
          : undefined,
        min_cbm: Number(data.min_cbm),
        // Ensure services_requested is always an array
        services_requested: Array.isArray(data.services_requested)
          ? data.services_requested
          : typeof data.services_requested === "string"
            ? [data.services_requested]
            : [],
      };

      // Remove non-writable fields that might be present from initialData
      // @ts-ignore
      delete cleanData.initiator;
      // @ts-ignore
      delete cleanData.created_at;
      // @ts-ignore
      delete cleanData.updated_at;
      // @ts-ignore
      delete cleanData.id;

      if (selectedRateIds.length > 1) {
        // BATCH CREATION
        const promises = selectedRateIds.map(async (rateId) => {
          const rate = rates.find((r) => r.id === rateId);
          if (!rate) return;

          const batchData: CreateConsolidationData = {
            ...cleanData,
            title: `Groupage ${rate.origin?.name} ➝ ${rate.destination?.name}`,
            origin_port: rate.origin?.name || "",
            destination_port: rate.destination?.name || "",
            transport_mode: rate.mode,
            price_per_cbm: rate.price,
            currency: rate.currency as any,
          };
          // @ts-ignore
          await consolidationService.createConsolidation(batchData);
        });
        await Promise.all(promises);
      } else {
        // SINGLE CREATION / EDIT
        if (mode === "edit" && initialData?.id) {
          // @ts-ignore
          await consolidationService.updateConsolidation(
            initialData.id,
            cleanData,
          );
        } else {
          // @ts-ignore
          const newConsolidation = await consolidationService.createConsolidation(cleanData);

          // CRITICAL: If this is a client request, we must also create the Shipment (Book the slot)
          // The shipment will initially have forwarder_id = null (assigned to platform)
          if (type === "client_request" && newConsolidation) {
            await consolidationService.bookConsolidationSlot({
              consolidation_id: newConsolidation.id,
              weight_kg: Number(cleanData.total_capacity_kg || 0),
              volume_cbm: Number(cleanData.total_capacity_cbm || 0),
              description: cleanData.description || "Client Request",
              goods_nature: "General Cargo", // Default for now
              cargo_value: 0
            });
          }
        }
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving consolidation:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
        {/* Header code unchanged... */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {selectedRateIds.length > 1
              ? `Création Groupée (${selectedRateIds.length})`
              : mode === "edit"
                ? "Modifier le Groupage"
                : type === "client_request"
                  ? "Demander un Groupage"
                  : "Nouveau Groupage"}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* ROUTE SELECTOR code unchanged... */}
          {mode === "create" && type === "forwarder_offer" && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">
                    Sélection Rapide de Trajet
                  </h4>
                  <p className="text-sm text-gray-500">
                    Choisissez une ou plusieurs routes standards.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div
                  className="w-full pl-4 pr-10 py-3 bg-white rounded-xl border-gray-200 shadow-sm min-h-[46px] flex flex-wrap gap-2 items-center cursor-pointer"
                  onClick={() => setIsRouteDropdownOpen(!isRouteDropdownOpen)}
                >
                  {selectedRateIds.length === 0 && (
                    <span className="text-gray-500 text-sm font-medium">
                      -- Choisir des trajets --
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRateSelection(id);
                          }}
                          className="hover:bg-blue-200 rounded-full p-0.5 ml-1"
                          aria-label={`Retirer ${r.origin?.name} vers ${r.destination?.name}`}
                          title="Retirer ce trajet"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>

                {isRouteDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-auto">
                    {rates.map((rate) => {
                      const isSelected = selectedRateIds.includes(rate.id);
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
                                {rate.origin?.name} ➝ {rate.destination?.name}
                              </span>
                              <span className="text-blue-600 font-bold text-sm">
                                {formatCurrency(rate.price, rate.currency)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="capitalize">
                                {rate.mode === "sea" ? "Maritime" : "Aérien"}{" "}
                                {rate.type}
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
          )}

          {/* BATCH MODE SUMMARY */}
          {selectedRateIds.length > 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 animate-in fade-in slide-in-from-top-2">
              <h5 className="font-bold text-amber-900 flex items-center gap-2 mb-3">
                <Package className="w-5 h-5" />
                Mode Groupé Activé
              </h5>
              <p className="text-sm text-amber-800 mb-4">
                Vous allez créer{" "}
                <strong>{selectedRateIds.length} offres de groupage</strong>.
                Les détails (Prix, Mode, Départ, Arrivée) seront appliqués
                automatiquement depuis vos tarifs.
              </p>
            </div>
          )}

          {/* Regular Form Fields */}
          <div className="space-y-4">
            {selectedRateIds.length <= 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Titre
                  </label>
                  <input
                    {...register("title", { required: "Le titre est requis" })}
                    placeholder={
                      type === "client_request"
                        ? "ex: Electronique vers Dakar"
                        : "ex: Groupage Mensuel Chine"
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  {errors.title && (
                    <span className="text-red-500 text-xs">
                      {errors.title.message}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Port de Départ
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={originSearch || watch("origin_port") || ""}
                        onChange={(e) => {
                          setOriginSearch(e.target.value);
                          setShowOriginDropdown(true);
                          setValue("origin_port", e.target.value);
                        }}
                        onFocus={() => {
                          setOriginSearch("");
                          setShowOriginDropdown(true);
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowOriginDropdown(false), 200)
                        }
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Sélectionner..."
                      />
                      {showOriginDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredOrigins.map((loc) => (
                            <button
                              key={loc.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 text-sm text-slate-700 dark:text-slate-300"
                              onClick={() => {
                                setValue("origin_port", loc.name);
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
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Port d'Arrivée
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={destSearch || watch("destination_port") || ""}
                        onChange={(e) => {
                          setDestSearch(e.target.value);
                          setShowDestDropdown(true);
                          setValue("destination_port", e.target.value);
                        }}
                        onFocus={() => {
                          setDestSearch("");
                          setShowDestDropdown(true);
                        }}
                        onBlur={() =>
                          setTimeout(() => setShowDestDropdown(false), 200)
                        }
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Sélectionner..."
                      />
                      {showDestDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                          {filteredDestinations.map((loc) => (
                            <button
                              key={loc.id}
                              type="button"
                              className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-gray-700 text-sm text-slate-700 dark:text-slate-300"
                              onClick={() => {
                                setValue("destination_port", loc.name);
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mode de Transport
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all ${transportMode === "sea" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-gray-700"}`}
                    >
                      <input
                        type="radio"
                        value="sea"
                        {...register("transport_mode", { required: true })}
                        className="sr-only"
                      />
                      <Anchor
                        className={`h-5 w-5 ${transportMode === "sea" ? "text-blue-500" : "text-slate-400"}`}
                      />
                      <span
                        className={
                          transportMode === "sea"
                            ? "font-medium text-blue-700 dark:text-blue-300"
                            : "text-slate-600 dark:text-slate-400"
                        }
                      >
                        Maritime
                      </span>
                    </label>
                    <label
                      className={`cursor-pointer border rounded-xl p-4 flex items-center gap-3 transition-all ${transportMode === "air" ? "border-sky-500 bg-sky-50 dark:bg-sky-900/20" : "border-slate-200 dark:border-gray-700"}`}
                    >
                      <input
                        type="radio"
                        value="air"
                        {...register("transport_mode", { required: true })}
                        className="sr-only"
                      />
                      <Plane
                        className={`h-5 w-5 ${transportMode === "air" ? "text-sky-500" : "text-slate-400"}`}
                      />
                      <span
                        className={
                          transportMode === "air"
                            ? "font-medium text-sky-700 dark:text-sky-300"
                            : "text-slate-600 dark:text-slate-400"
                        }
                      >
                        Aérien
                      </span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Capacity & Pricing */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="h-4 w-4" /> Capacité
              </h3>
              <div>
                {transportMode === "sea" && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <label className="block text-xs text-slate-500 mb-1">
                      Volume Total (CBM) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("total_capacity_cbm", {
                        required: "Volume requis pour le maritime",
                      })}
                      placeholder="ex: 15"
                      onWheel={(e) => e.currentTarget.blur()}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.total_capacity_cbm ? "border-red-500" : "border-slate-200"} dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors`}
                    />
                    {errors.total_capacity_cbm && (
                      <span className="text-red-500 text-xs">
                        {errors.total_capacity_cbm.message}
                      </span>
                    )}
                  </div>
                )}
                {transportMode === "air" && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <label className="block text-xs text-slate-500 mb-1">
                      Poids Total (kg) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register("total_capacity_kg", {
                        required: "Poids requis pour l'aérien",
                      })}
                      placeholder="ex: 500"
                      onWheel={(e) => e.currentTarget.blur()}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.total_capacity_kg ? "border-red-500" : "border-slate-200"} dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none transition-colors`}
                    />
                    {errors.total_capacity_kg && (
                      <span className="text-red-500 text-xs">
                        {errors.total_capacity_kg.message}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {type !== "client_request" && selectedRateIds.length <= 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="text-lg">💰</span> Tarification
                </h3>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Price per CBM
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    onWheel={(e) => e.currentTarget.blur()}
                    {...register("price_per_cbm")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Currency
                  </label>
                  <select
                    {...register("currency")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="XOF">XOF (FCFA)</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CNY">CNY</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Additional Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Additional Services
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: "insurance",
                  label: "Insurance",
                  desc: "Full protection",
                  icon: ShieldCheck,
                  color: "blue",
                },
                {
                  id: "priority",
                  label: "Priority",
                  desc: "Fast track processing",
                  icon: Zap,
                  color: "orange",
                },
                {
                  id: "packaging",
                  label: "Reinforced Packaging",
                  desc: "Extra protection",
                  icon: Box,
                  color: "indigo",
                },
                {
                  id: "inspection",
                  label: "Quality Inspection",
                  desc: "Goods verification",
                  icon: ClipboardCheck,
                  color: "green",
                },

                {
                  id: "door_to_door",
                  label: "Door to Door",
                  desc: "Final delivery",
                  icon: Truck,
                  color: "cyan",
                },
                {
                  id: "storage",
                  label: "Storage",
                  desc: "Temporary warehousing",
                  icon: Warehouse,
                  color: "slate",
                },
              ].map((service) => {
                const Icon = service.icon;
                return (
                  <label
                    key={service.id}
                    className="relative flex items-center p-3 border rounded-xl cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-gray-800 border-slate-200 dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      value={service.id}
                      {...register("services_requested")}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
                    />
                    <div
                      className={`p-1.5 rounded-full mr-3 bg-${service.color}-100 text-${service.color}-600`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="font-medium text-sm text-slate-900 dark:text-white block">
                        {service.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">
                        {service.desc}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Schedule
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {type !== "client_request" && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    {...register("deadline_date")}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  {type === "client_request"
                    ? "Preferred Departure"
                    : "Departure"}
                </label>
                <input
                  type="date"
                  {...register("departure_date", { required: true })}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  {type === "client_request"
                    ? "Expected Arrival"
                    : "Arrival (Est.)"}
                </label>
                <input
                  type="date"
                  {...register("arrival_date")}
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Additional details about the shipment..."
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-gray-700 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 flex items-center"
            >
              {loading && (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              )}
              {selectedRateIds.length > 1
                ? `Create ${selectedRateIds.length} Consolidations`
                : mode === "edit"
                  ? "Save Changes"
                  : type === "client_request"
                    ? "Submit Request"
                    : "Create Consolidation"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
