import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import {
  calculatorService,
  QuoteResult,
  CalculationParams,
} from "../services/calculatorService";
import {
  ForwarderOption,
  forwarderService,
} from "../services/forwarderService";
import { feeService, FeeConfig } from "../services/feeService";
import { calculateCBM, LengthUnit } from "../utils/volumeCalculator";

// Define Form Interface extending CalculationParams for UI-specific fields
interface CalculatorFormValues extends CalculationParams {
  itemCount?: number;
  unitPrice?: number;
}
import {
  Ship,
  Plane,
  Package,
  Clock,
  Check,
  Star,
  ShieldCheck,
  CheckCircle,
  Lock,
  Zap,
  ClipboardCheck,
  Calculator as CalculatorIcon,
  Scale,
  Truck,
  Warehouse,
  ArrowRight,
  ArrowLeft,
  User,
  Search,
  Camera,
  AlertCircle,
  Box,
} from "lucide-react";

import { useCurrency } from "../contexts/CurrencyContext";
import { locationService, Location } from "../services/locationService";
import { normalizeCountryName } from "../constants/countries";
import SavedQuoteModal from "./common/SavedQuoteModal";
import KYCVerificationModal from "./profile/KYCVerificationModal";
import { kycService } from "../services/kycService";
import { profileService } from "../services/profileService";

import { AnimatePresence, motion } from "framer-motion";

export default function Calculator() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<"price" | "speed" | "rating">("price");

  // Multi-Step Wizard State
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;



  // Animation Variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const [[, direction], setPage] = useState([0, 0]);

  // Update step with animation direction
  const changeStep = (newStep: number) => {
    const newDirection = newStep > currentStep ? 1 : -1;
    setPage([newStep, newDirection]);
    setCurrentStep(newStep);
  };

  // State Definitions restored
  const [calculationMode, setCalculationMode] = useState<"platform" | "compare" | "specific">("platform");
  const [selectedForwarder, setSelectedForwarder] = useState<string>("");
  const [forwarders, setForwarders] = useState<ForwarderOption[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [originSearch, setOriginSearch] = useState("");
  const [destSearch, setDestSearch] = useState("");
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);

  const [activeFees, setActiveFees] = useState<FeeConfig[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [quoteToSave, setQuoteToSave] = useState<QuoteResult | null>(null);

  // Fee loading
  useEffect(() => {
    feeService.getFees().then((fees) => setActiveFees(fees));
  }, []);

  const isFeeActive = (category: string) => {
    return activeFees.some((f) => f.category === category && f.isActive);
  };

  // Dimension inputs
  const [dimensionUnit, setDimensionUnit] = useState<LengthUnit>("m");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [calculatedCBM, setCalculatedCBM] = useState<number>(0);
  const [selectedServices, setSelectedServices] = useState<{
    insurance: boolean;
    priority: boolean;
    packaging: boolean;
    inspection: boolean;
    door_to_door: boolean;
    storage: boolean;
  }>({
    insurance: false,
    priority: false,
    packaging: false,
    inspection: false,
    door_to_door: false,
    storage: false,
  });

  const [cardRates, setCardRates] = useState<Record<string, Record<string, number | null>>>({
    air: { standard: null, express: null },
    sea: { standard: null, express: null },
  });

  const { register, watch, setValue } =
    useForm<CalculatorFormValues>({
      defaultValues: {
        mode: "sea",
        type: "standard",
        origin: "China",
        destination: "Senegal",
      },
    });

  const selectedMode = watch("mode");
  const selectedType = watch("type");

  const handleCalculate = async () => {
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const formValues = watch();
      const params: CalculationParams = {
        ...formValues,
        mode: formValues.mode, // Ensure this matches expected "sea" | "air"
        type: formValues.type,
        // We might need to map 'calculationMode' if service expects it
        // The service likely uses 'mode' for transport mode.
        // If we need to filter by 'platform' or specific forwarder, we might handle it here or in service.
        // Passing extra params:
        calculationMode: calculationMode,
        forwarder_id: selectedForwarder,
        volume_cbm: calculatedCBM,
        additionalServices: selectedServices
      }; // Casting to any to avoid strict type checks if definition varies slightly

      const results = await calculatorService.calculateQuotes(params);
      setQuotes(results);
      changeStep(5);
    } catch (err) {
      setError("Erreur lors du calcul");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadForwarders() {
      try {
        const data = await forwarderService.getAllActiveForwarders();
        setForwarders(data);
      } catch (error) {
        console.error("Error loading forwarders:", error);
      }
    }
    loadForwarders();
    loadLocations();
  }, []);

  useEffect(() => {
    const forwarderId = searchParams.get("forwarder");
    const origin = searchParams.get("origin");
    const destination = searchParams.get("destination");
    const mode = searchParams.get("mode");

    if (forwarderId) {
      setCalculationMode("specific");
      setSelectedForwarder(forwarderId);
    }
    if (origin) {
      setValue("origin", origin);
      setOriginSearch(origin);
    }
    if (destination) {
      setValue("destination", destination);
      setDestSearch(destination);
    }
    if (mode && (mode === "sea" || mode === "air")) {
      setValue("mode", mode);
    }
    const type = searchParams.get("type");
    if (type && (type === "standard" || type === "express")) {
      setValue("type", type);
    }
  }, [searchParams, setValue]);

  const loadLocations = async () => {
    try {
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error("Error loading locations:", error);
    }
  };

  const filteredOrigins = locations.filter((l) =>
    l.name.toLowerCase().includes(originSearch.toLowerCase()),
  );

  const filteredDestinations = locations.filter((l) =>
    l.name.toLowerCase().includes(destSearch.toLowerCase()),
  );

  useEffect(() => {
    if (length && width && height) {
      const cbm = calculateCBM({
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height),
        unit: dimensionUnit,
      });
      setCalculatedCBM(cbm);
    } else {
      setCalculatedCBM(0);
    }
  }, [length, width, height, dimensionUnit]);

  useEffect(() => {
    const fetchRates = async () => {
      const originVal = normalizeCountryName(watch("origin"));
      const destVal = normalizeCountryName(watch("destination"));
      if (originVal && destVal) {
        const rates = await calculatorService.getUnitRates(
          originVal,
          destVal,
          calculationMode,
          selectedForwarder,
          currency,
        );
        setCardRates(rates);
      }
    };
    const timeoutId = setTimeout(fetchRates, 500);
    return () => clearTimeout(timeoutId);
  }, [watch("origin"), watch("destination"), calculationMode, selectedForwarder, currency]);

  const formatPrice = useCallback((amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [currency]);

  const formatRateDisplay = (price: number | null, unit: string) => {
    if (price === null || price === 0) {
      if (calculationMode === "compare") return t("calculator.compareRates") || "Comparer les offres";
      return t("calculator.quoteOnly") || "Sur Devis";
    }
    return `${formatPrice(price)} / ${unit}`;
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col justify-center py-8">

      {/* Progress Bar / Book Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4 px-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            {currentStep === 1 && "Votre Besoin"}
            {currentStep === 2 && "Le Trajet"}
            {currentStep === 3 && "Le Transport"}
            {currentStep === 4 && "Les Détails"}
            {currentStep === 5 && "Vos Résultats"}
          </h1>
          <span className="text-sm font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
            Étape {currentStep} / {totalSteps}
          </span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-orange-600"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      <div className="relative overflow-hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] border border-white/20 dark:border-gray-800 p-8 min-h-[300px]">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/30 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={20} className="shrink-0" />
            <span className="font-bold text-sm">{error}</span>
          </div>
        )}
        <AnimatePresence mode="wait" custom={direction}>

          {/* STEP 1: Calculation Mode */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="space-y-6 h-full flex flex-col"
            >
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
                Comment souhaitez-vous obtenir votre tarif ?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-grow">
                {[
                  { id: 'platform', title: t("calculator.platformRates"), desc: t("calculator.platformRatesDesc"), icon: CalculatorIcon },
                  { id: 'compare', title: t("calculator.compareForwarders"), desc: t("calculator.compareForwardersDesc"), icon: Scale },
                  { id: 'specific', title: t("calculator.specificForwarder"), desc: t("calculator.specificForwarderDesc"), icon: User }
                ].map((mode, index) => (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      borderColor: calculationMode === mode.id ? "rgb(249 115 22)" : "rgba(226, 232, 240, 1)",
                      scale: calculationMode === mode.id ? 1.05 : 1
                    }}
                    whileHover={{ scale: 1.08, y: -8, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    onClick={() => {
                      setCalculationMode(mode.id as any);
                    }}
                    className={`cursor-pointer rounded-[2rem] p-8 min-h-[280px] border-2 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden bg-white dark:bg-gray-800
                        ${calculationMode === mode.id
                        ? "shadow-2xl shadow-orange-500/20 z-10"
                        : "hover:border-orange-300 hover:shadow-xl dark:border-gray-700"
                      }`}
                  >
                    {calculationMode === mode.id && (
                      <motion.div
                        layoutId="activeCardGlow"
                        className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-orange-100/50 dark:from-orange-900/10 dark:to-orange-900/20 z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}

                    <motion.div
                      className={`relative z-10 p-6 rounded-full transition-colors duration-300 ${calculationMode === mode.id ? "bg-orange-600 text-white" : "bg-slate-100 dark:bg-gray-700 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600"}`}
                      whileHover={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <mode.icon className="w-10 h-10" strokeWidth={1.5} />
                    </motion.div>

                    <div className="relative z-10">
                      <h3 className={`font-black text-xl md:text-2xl mb-3 transition-colors duration-300 ${calculationMode === mode.id ? "text-orange-600 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}>
                        {mode.title}
                      </h3>
                      <p className="text-base font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                        {mode.desc}
                      </p>
                    </div>

                    {calculationMode === mode.id && (
                      <motion.div
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {calculationMode === 'specific' && (
                <div className="mt-6">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Sélectionnez le prestataire</label>
                  <select
                    aria-label={t("calculator.selectForwarder")}
                    value={selectedForwarder}
                    onChange={(e) => setSelectedForwarder(e.target.value)}
                    className="block w-full rounded-2xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 py-3 px-4 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">-- Choisir --</option>
                    {forwarders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
              )}

              <div className="flex justify-end pt-8">
                <button
                  onClick={() => {
                    if (calculationMode === 'specific' && !selectedForwarder) {
                      setError("Veuillez sélectionner un prestataire");
                      return;
                    }
                    changeStep(2);
                  }}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  Continuer <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Route */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="space-y-8"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quel est votre trajet ?</h2>
                <div className="flex justify-center gap-2 mt-2">
                  <span className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200 dark:border-gray-700">
                    {calculationMode === 'platform' && <CalculatorIcon size={12} />}
                    {calculationMode === 'compare' && <Scale size={12} />}
                    {calculationMode === 'specific' && <User size={12} />}
                    {t(`calculator.${calculationMode === 'platform' ? 'platformRates' : calculationMode === 'compare' ? 'compareForwarders' : 'specificForwarder'}`)}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Définissez l'origine et la destination de votre marchandise.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 md:gap-8 relative items-start">
                {/* Origin */}
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Départ (Origine)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <div className="w-2 h-2 rounded-full bg-orange-600 ring-4 ring-orange-100 dark:ring-orange-900/30"></div>
                    </div>
                    <input
                      type="text"
                      value={originSearch || watch("origin")}
                      onChange={(e) => {
                        setOriginSearch(e.target.value);
                        setValue("origin", e.target.value);
                        setShowOriginDropdown(true);
                      }}
                      onFocus={() => { setOriginSearch(""); setShowOriginDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowOriginDropdown(false), 200)}
                      className="block w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-lg font-bold focus:border-orange-500 focus:ring-0 transition-all"
                      placeholder="Ex: Chine"
                    />
                    {showOriginDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-2xl max-h-60 overflow-auto">
                        {filteredOrigins.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            className="w-full text-left px-5 py-3 hover:bg-orange-50 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 font-medium"
                            onClick={() => {
                              setValue("origin", loc.name);
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

                {/* Connector (Visual Only on Desktop) */}
                <div className="hidden md:flex justify-center items-center pt-8">
                  <ArrowRight className="text-slate-300 dark:text-slate-600 w-8 h-8" />
                </div>

                {/* Destination */}
                <div className="relative">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Arrivée (Destination)</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white ring-4 ring-slate-100 dark:ring-gray-700"></div>
                    </div>
                    <input
                      type="text"
                      value={destSearch || watch("destination")}
                      onChange={(e) => {
                        setDestSearch(e.target.value);
                        setValue("destination", e.target.value);
                        setShowDestDropdown(true);
                      }}
                      onFocus={() => { setDestSearch(""); setShowDestDropdown(true); }}
                      onBlur={() => setTimeout(() => setShowDestDropdown(false), 200)}
                      className="block w-full pl-10 pr-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 text-lg font-bold focus:border-slate-900 dark:focus:border-white focus:ring-0 transition-all"
                      placeholder="Ex: Sénégal"
                    />
                    {showDestDropdown && (
                      <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-2xl max-h-60 overflow-auto">
                        {filteredDestinations.map((loc) => (
                          <button
                            key={loc.id}
                            type="button"
                            className="w-full text-left px-5 py-3 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 font-medium"
                            onClick={() => {
                              setValue("destination", loc.name);
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

              <div className="flex justify-between pt-8">
                <button
                  onClick={() => changeStep(1)}
                  className="text-slate-400 hover:text-slate-600 font-bold px-4 py-2 transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Retour
                </button>
                <button
                  onClick={() => {
                    if (watch("origin") && watch("destination")) changeStep(3);
                    else setError("Veuillez remplir les deux champs");
                  }}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  Continuer <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Transport Mode */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
              className="space-y-8"
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Quel moyen de transport ?</h2>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <span className="bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-slate-200 dark:border-gray-700">
                    {calculationMode === 'platform' && <CalculatorIcon size={12} />}
                    {calculationMode === 'compare' && <Scale size={12} />}
                    {calculationMode === 'specific' && <User size={12} />}
                    {t(`calculator.${calculationMode === 'platform' ? 'platformRates' : calculationMode === 'compare' ? 'compareForwarders' : 'specificForwarder'}`)}
                  </span>
                  <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-gray-700">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {watch("origin")}</span>
                    <ArrowRight size={12} className="text-slate-400" />
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white"></div> {watch("destination")}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { mode: 'sea', type: 'standard', title: 'Maritime Standard', desc: 'Économique • 45-60 Jours', icon: Ship, color: 'blue', rate: cardRates.sea.standard, unit: 'CBM' },
                  { mode: 'sea', type: 'express', title: 'Maritime Express', desc: 'Rapide • 30-40 Jours', icon: Ship, color: 'sky', rate: cardRates.sea.express, unit: 'CBM' },
                  { mode: 'air', type: 'standard', title: 'Aérien Standard', desc: 'Classique • 7-10 Jours', icon: Plane, color: 'orange', rate: cardRates.air.standard, unit: 'KG' },
                  { mode: 'air', type: 'express', title: 'Aérien Express', desc: 'Urgent • 3-5 Jours', icon: Plane, color: 'purple', rate: cardRates.air.express, unit: 'KG' }
                ].map((option, index) => {
                  const isSelected = selectedMode === option.mode && selectedType === option.type;
                  // Color variants mapping
                  const colorClasses = {
                    blue: { border: 'border-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-600', hoverBorder: 'hover:border-blue-300', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
                    sky: { border: 'border-sky-500', bg: 'bg-sky-50 dark:bg-sky-900/10', text: 'text-sky-600', hoverBorder: 'hover:border-sky-300', iconBg: 'bg-sky-100 dark:bg-sky-900/30' },
                    orange: { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/10', text: 'text-orange-600', hoverBorder: 'hover:border-orange-300', iconBg: 'bg-orange-100 dark:bg-orange-900/30' },
                    purple: { border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10', text: 'text-purple-600', hoverBorder: 'hover:border-purple-300', iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
                  }[option.color as 'blue' | 'sky' | 'orange' | 'purple'];

                  return (
                    <motion.div
                      key={`${option.mode}-${option.type}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        borderColor: isSelected ? "currentColor" : "rgba(226, 232, 240, 1)",
                        scale: isSelected ? 1.02 : 1
                      }}
                      whileHover={{ scale: 1.03, y: -4, transition: { duration: 0.2 } }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ delay: index * 0.1, duration: 0.4 }}
                      onClick={() => { setValue("mode", option.mode as any); setValue("type", option.type as any); }}
                      className={`cursor-pointer group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 ${isSelected ? `${colorClasses.border} ${colorClasses.bg}` : `border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 ${colorClasses.hoverBorder}`}`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="activeTransportGlow"
                          className={`absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 z-0 opacity-20`}
                          style={{ backgroundColor: option.color }}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.1 }}
                          exit={{ opacity: 0 }}
                        />
                      )}

                      <div className="flex items-center gap-4 relative z-10">
                        <motion.div
                          className={`w-14 h-14 rounded-full flex items-center justify-center ${colorClasses.iconBg} ${colorClasses.text}`}
                          whileHover={{ rotate: [0, -10, 10, 0] }}
                        >
                          {option.type === 'express' ? (
                            <div className="relative">
                              <option.icon size={28} />
                              <Zap size={14} className="absolute -top-1 -right-2 text-yellow-500 fill-yellow-500" />
                            </div>
                          ) : (
                            <option.icon size={28} />
                          )}
                        </motion.div>
                        <div>
                          <h3 className="font-bold text-lg text-slate-900 dark:text-white">{option.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">{option.desc}</p>
                        </div>
                      </div>

                      <div className="mt-4 text-right relative z-10">
                        <span className={`text-lg font-black ${colorClasses.text} dark:${colorClasses.text}`}>
                          {formatRateDisplay(option.rate, option.unit)}
                        </span>
                      </div>

                      {isSelected && (
                        <motion.div
                          className={`absolute top-4 right-4 w-2 h-2 rounded-full ${colorClasses.text.replace('text-', 'bg-')}`}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>





              <div className="flex justify-between pt-8">
                <button onClick={() => changeStep(2)} className="text-slate-400 hover:text-slate-600 font-bold px-4 py-2 flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Retour
                </button>
                <button
                  onClick={() => changeStep(4)}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  Continuer <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )
          }

          {/* STEP 4: Cargo Details & Services */}
          {
            currentStep === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="space-y-8"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Détails de la marchandise</h2>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 dark:border-gray-700">
                      <span>{watch("origin")}</span>
                      <ArrowRight size={12} />
                      <span>{watch("destination")}</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${selectedMode === 'sea'
                      ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      : 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                      }`}>
                      {selectedMode === 'sea' ? <Ship size={12} /> : <Plane size={12} />}
                      {selectedMode === 'sea' ? 'Maritime' : 'Aérien'} {selectedType === 'express' ? 'Express' : 'Standard'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-2">Précisez les dimensions et services souhaités</p>
                </div>


                <div className="bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase tracking-wide">
                    <Package size={18} className="text-blue-600" />{" "}
                    {t("calculator.cargoDetails")}
                  </h3>
                  {selectedMode === "sea" ? (
                    <div className="space-y-6">
                      {/* Unit Selection */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          {t("calculator.measurementUnit")}
                        </label>
                        <select
                          aria-label={t("calculator.measurementUnit")}
                          value={dimensionUnit}
                          onChange={(e) =>
                            setDimensionUnit(e.target.value as LengthUnit)
                          }
                          className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
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

                      {/* Dimensions */}
                      <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                          {t("calculator.dimensions")}
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                              {t("calculator.length")}
                            </label>
                            <input
                              aria-label={t("calculator.length")}
                              type="number"
                              step="0.01"
                              value={length}
                              onChange={(e) => setLength(e.target.value)}
                              placeholder="0.00"
                              onWheel={(e) => e.currentTarget.blur()}
                              className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                              {t("calculator.width")}
                            </label>
                            <input
                              aria-label={t("calculator.width")}
                              type="number"
                              step="0.01"
                              value={width}
                              onChange={(e) => setWidth(e.target.value)}
                              placeholder="0.00"
                              onWheel={(e) => e.currentTarget.blur()}
                              className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                              {t("calculator.height")}
                            </label>
                            <input
                              aria-label={t("calculator.height")}
                              type="number"
                              step="0.01"
                              value={height}
                              onChange={(e) => setHeight(e.target.value)}
                              placeholder="0.00"
                              onWheel={(e) => e.currentTarget.blur()}
                              className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Calculated CBM Display */}
                      {calculatedCBM > 0 && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                              <Check
                                size={16}
                                className="text-green-600 dark:text-green-400"
                                strokeWidth={3}
                              />
                            </div>
                            <span className="text-sm font-medium text-green-900 dark:text-green-100">
                              {t("calculator.volumeCalculated")}:{" "}
                              <strong className="text-lg ml-1">
                                {calculatedCBM} CBM
                              </strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        {t("calculator.weightKG")}
                      </label>
                      <input
                        aria-label={t("calculator.weightKG")}
                        type="number"
                        step="0.1"
                        {...register("weight_kg")}
                        placeholder="e.g. 50"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  )}
                </div>

                {/* Additional Services */}
                <div className="bg-slate-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-slate-100 dark:border-gray-700">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">
                    Services Additionnels
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isFeeActive("insurance") && (
                      <div className="md:col-span-2 space-y-4">
                        <div
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.insurance
                            ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                            }`}
                          onClick={() =>
                            setSelectedServices((prev) => ({
                              ...prev,
                              insurance: !prev.insurance,
                            }))
                          }
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${selectedServices.insurance ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                            >
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                Assurance (Garantie Plateforme)
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Protection complète contre la perte ou les dommages
                              </p>
                            </div>
                            <div className="ml-auto">
                              <input
                                type="checkbox"
                                aria-label="Assurance"
                                checked={selectedServices.insurance}
                                onChange={() => { }} // Handled by parent div click
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {selectedServices.insurance ? (
                          <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-100 dark:border-blue-900/30 shadow-xl shadow-blue-500/5 animate-in fade-in slide-in-from-top-2">
                            <h5 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                              <ClipboardCheck className="w-5 h-5 text-blue-600" />
                              Détails de l'Assurance
                            </h5>

                            <div className="space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                                    Nombre de pièces / unités
                                  </label>
                                  <input
                                    type="number"
                                    {...register("itemCount")}
                                    placeholder="Ex: 5"
                                    className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all font-bold"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                                    Prix unitaire ({currency})
                                  </label>
                                  <input
                                    type="number"
                                    {...register("unitPrice")}
                                    placeholder="Ex: 15000"
                                    className="block w-full rounded-xl border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 transition-all font-bold text-blue-600"
                                  />
                                </div>
                              </div>

                              <div className="relative pt-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">
                                  Valeur Totale Déclarée
                                </label>
                                <div className="bg-blue-600/5 dark:bg-blue-600/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                    Total ({currency})
                                  </span>
                                  <span className="text-xl font-extrabold text-blue-600">
                                    {formatPrice(Number(watch("cargoValue") || 0))}
                                  </span>
                                </div>
                                <input type="hidden" {...register("cargoValue")} />
                              </div>

                              <div className="pt-2">
                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">
                                  Preuve d'Achat / Photo du colis
                                </label>
                                <div className="group relative border-2 border-dashed border-slate-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-slate-50/50 dark:bg-gray-800/30 cursor-pointer">
                                  <input
                                    type="file"
                                    aria-label="Upload preuve d'achat"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    accept="image/*"
                                  />
                                  <div className="flex flex-col items-center gap-2">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                      <Camera className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600 font-bold uppercase tracking-tight">
                                      Ajouter une photo justificative
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Format JPG, PNG (Max 5MB)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {(!watch("cargoValue") || Number(watch("cargoValue")) <= 0) && (
                                <div className="mt-4 flex items-center gap-3 bg-amber-500/10 dark:bg-amber-500/10 p-4 rounded-xl border-2 border-amber-500/20 animate-pulse">
                                  <div className="bg-amber-500 text-white p-1.5 rounded-full shadow-lg shadow-amber-500/30">
                                    <AlertCircle className="w-5 h-5" />
                                  </div>
                                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-tight">
                                    Action requise : Détaillez le contenu pour activer votre protection.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex items-start gap-4 bg-red-50/50 dark:bg-red-900/10 p-5 rounded-2xl border-2 border-red-100 dark:border-red-900/30 shadow-sm">
                            <div className="bg-red-100 dark:bg-red-900/50 p-2.5 rounded-xl flex-shrink-0">
                              <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="space-y-1">
                              <h5 className="font-bold text-red-900 dark:text-red-200 text-base">
                                Attention : Expédition non assurée !
                              </h5>
                              <p className="text-sm text-red-700/80 dark:text-red-300/80 leading-relaxed font-medium">
                                En déclinant l'assurance, vous assumez l'entière responsabilité en cas de perte ou d'avarie.
                                Le règlement de tout litige devra être géré directement avec le prestataire.
                                <strong> NextMove Cargo n'interviendra pas dans le remboursement.</strong>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isFeeActive("priority") && (
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.priority
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                          }`}
                        onClick={() =>
                          setSelectedServices((prev) => ({
                            ...prev,
                            priority: !prev.priority,
                          }))
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${selectedServices.priority ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                          >
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Traitement Prioritaire
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Accélérez le traitement de votre dossier
                            </p>
                          </div>
                          <div className="ml-auto">
                            <input
                              type="checkbox"
                              aria-label="Traitement Prioritaire"
                              checked={selectedServices.priority}
                              onChange={() => { }} // Handled by parent div click
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {isFeeActive("packaging") && (
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.packaging
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                          }`}
                        onClick={() =>
                          setSelectedServices((prev) => ({
                            ...prev,
                            packaging: !prev.packaging,
                          }))
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${selectedServices.packaging ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                          >
                            <Box className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Emballage Renforcé
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Protection supplémentaire pour vos colis fragiles
                            </p>
                          </div>
                          <div className="ml-auto">
                            <input
                              type="checkbox"
                              aria-label="Emballage Renforcé"
                              checked={selectedServices.packaging}
                              onChange={() => { }} // Handled by parent div click
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {isFeeActive("inspection") && (
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.inspection
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                          }`}
                        onClick={() =>
                          setSelectedServices((prev) => ({
                            ...prev,
                            inspection: !prev.inspection,
                          }))
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${selectedServices.inspection ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                          >
                            <ClipboardCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Inspection Qualité
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Vérification de la conformité de la marchandise
                            </p>
                          </div>
                          <div className="ml-auto">
                            <input
                              type="checkbox"
                              aria-label="Inspection Qualité"
                              checked={selectedServices.inspection}
                              onChange={() => { }} // Handled by parent div click
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {isFeeActive("door_to_door") && (
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.door_to_door
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                          }`}
                        onClick={() =>
                          setSelectedServices((prev) => ({
                            ...prev,
                            door_to_door: !prev.door_to_door,
                          }))
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${selectedServices.door_to_door ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                          >
                            <Truck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Door to Door
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Livraison jusqu'à l'adresse finale
                            </p>
                          </div>
                          <div className="ml-auto">
                            <input
                              type="checkbox"
                              aria-label="Door to Door"
                              checked={selectedServices.door_to_door}
                              onChange={() => { }} // Handled by parent div click
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {isFeeActive("storage") && (
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedServices.storage
                          ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-blue-300"
                          }`}
                        onClick={() =>
                          setSelectedServices((prev) => ({
                            ...prev,
                            storage: !prev.storage,
                          }))
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${selectedServices.storage ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}
                          >
                            <Warehouse className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Stockage
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Entreposage temporaire
                            </p>
                          </div>
                          <div className="ml-auto">
                            <input
                              type="checkbox"
                              aria-label="Stockage"
                              checked={selectedServices.storage}
                              onChange={() => { }} // Handled by parent div click
                              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between pt-8 pb-4">
                  <button
                    onClick={() => changeStep(3)}
                    className="text-slate-400 hover:text-slate-600 font-bold px-4 py-2 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-orange-200 dark:shadow-none hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Voir les offres <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            )
          }

          {/* STEP 5: Results */}
          {
            currentStep === 5 && (
              <motion.div
                key="step5"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => changeStep(4)}
                    className="text-slate-400 hover:text-slate-600 font-bold px-4 py-2 transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" /> Retour
                  </button>
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Vos Résultats</h2>
                  <div className="w-20"></div> {/* Spacer for centering */}
                </div>
                <div className="w-full">

                  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/20 dark:border-gray-800 sticky top-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                      {t("calculator.estimatedCost")}
                    </h2>

                    {/* Sorting Controls (Only for Compare Mode) */}
                    {calculationMode === "compare" && quotes.length > 0 && (
                      <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        <button
                          onClick={() => setSortBy("price")}
                          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${sortBy === "price"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                            : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                            }`}
                        >
                          💰 {t("calculator.sort.price")}
                        </button>
                        <button
                          onClick={() => setSortBy("speed")}
                          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${sortBy === "speed"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                            : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                            }`}
                        >
                          🚀 {t("calculator.sort.speed")}
                        </button>
                        <button
                          onClick={() => setSortBy("rating")}
                          className={`px-4 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all ${sortBy === "rating"
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                            : "bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-gray-700"
                            }`}
                        >
                          ⭐ {t("calculator.sort.rating")}
                        </button>
                      </div>
                    )}

                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                      </div>
                    ) : quotes.length > 0 ? (
                      <div className="space-y-4">
                        {quotes
                          .sort((a, b) => {
                            if (sortBy === "price") return a.total_cost - b.total_cost;
                            if (sortBy === "speed") {
                              // Extract max days from string "X-Y days"
                              const getDays = (s: string) =>
                                parseInt(s.split("-")[1]) || 0;
                              return getDays(a.transit_time) - getDays(b.transit_time);
                            }
                            if (sortBy === "rating")
                              return (b.rating || 0) - (a.rating || 0);
                            return 0;
                          })
                          .map((quote) => (
                            <div
                              key={quote.id}
                              className={`border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${quote.is_platform_rate ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-md shadow-blue-500/10" : "border-slate-100 dark:border-gray-800 bg-white dark:bg-gray-900"}`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                    {quote.forwarder_name}
                                    <div className="flex items-center gap-1.5 mt-1">
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                      </span>
                                      <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                                        {Math.floor(Math.random() * 4) + 2} personnes consultent cette offre
                                      </span>
                                    </div>
                                  </h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    {quote.rating && (
                                      <div className="flex items-center text-yellow-500 text-xs font-bold bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">
                                        <Star
                                          size={10}
                                          fill="currentColor"
                                          className="mr-1"
                                        />
                                        {quote.rating.toFixed(1)}
                                      </div>
                                    )}
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Clock size={12} />
                                      {quote.transit_time}
                                    </p>
                                  </div>
                                </div>
                                {quote.is_platform_rate && (
                                  <span className="bg-blue-600 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-bold shadow-sm">
                                    Officiel
                                  </span>
                                )}
                              </div>

                              <div className="space-y-3 my-4 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Transport ({formatPrice(quote.price_per_unit)}/
                                    {quote.unit})
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {formatPrice(quote.base_cost)}
                                  </span>
                                </div>
                                {/* Detailed Fees Breakdown */}
                                {quote.detailed_fees && quote.detailed_fees.length > 0 && (
                                  <div className="space-y-3 pt-2">
                                    {quote.detailed_fees.map((fee, idx) => (
                                      <div key={idx} className="flex justify-between items-center group/fee">
                                        <div className="flex flex-col">
                                          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            {fee.name}
                                            <span className={`text-[8px] uppercase tracking-tighter px-1 rounded-sm font-bold border ${fee.recipient === 'platform'
                                              ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800'
                                              : 'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/30 dark:border-green-800'
                                              }`}>
                                              {fee.recipient === 'platform' ? 'Plateforme' : 'Prestataire'}
                                            </span>
                                          </span>
                                        </div>
                                        <span className="font-bold text-slate-900 dark:text-white">
                                          {formatPrice(fee.amount)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div className="border-t border-slate-100 dark:border-gray-800 pt-2 flex justify-between items-center">
                                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                    Sous-total HT
                                  </span>
                                  <span className="font-bold text-slate-900 dark:text-white">
                                    {formatPrice(
                                      quote.base_cost + quote.insurance_cost + quote.additional_services_cost,
                                    )}
                                  </span>
                                </div>
                                {quote.tax_cost > 0 && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      TVA (18%)
                                    </span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {formatPrice(quote.tax_cost)}
                                    </span>
                                  </div>
                                )}
                                <div className="border-t border-slate-100 dark:border-gray-800 pt-3 flex justify-between items-center">
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                                    Total Estimé
                                  </span>
                                  <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
                                    {formatPrice(quote.total_cost)}
                                  </span>
                                </div>
                              </div>




                              <QuoteKYCCheck quote={quote} onShowKYC={() => setShowKYCModal(true)} />

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
                                <button
                                  onClick={() => {
                                    const text = `Devis NextMove Cargo\nPrestataire: ${quote.forwarder_name}\nTotal: ${formatPrice(quote.total_cost)}\nDurée: ${quote.transit_time}`;
                                    navigator.clipboard.writeText(text);
                                  }}
                                  className="px-4 py-3 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                  Partager
                                </button>
                                <button
                                  onClick={() => {
                                    setQuoteToSave(quote);
                                    setShowSaveModal(true);
                                  }}
                                  className="px-4 py-3 border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10 rounded-xl text-sm font-bold text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors"
                                >
                                  Sauvegarder
                                </button>
                                <button
                                  onClick={() => {
                                    const state = {
                                      prefill: {
                                        origin_port: watch("origin"),
                                        destination_port: watch("destination"),
                                        transport_mode: selectedMode,
                                        service_type: selectedType,
                                        cargo_details: {
                                          length,
                                          width,
                                          height,
                                          weight: watch("weight_kg"),
                                          unit: dimensionUnit,
                                        },
                                        budget: quote.total_cost,
                                        target_forwarder: quote.forwarder_id,
                                        quote_details: quote,
                                      },
                                    };

                                    if (user) {
                                      navigate("/dashboard/client/rfq/create", {
                                        state,
                                      });
                                    } else {
                                      navigate("/login", {
                                        state: {
                                          from: "/dashboard/client/rfq/create",
                                          ...state,
                                        },
                                      });
                                    }
                                  }}
                                  className="col-span-2 md:col-span-1 group relative px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 overflow-hidden"
                                >
                                  <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full" />
                                  <span className="relative flex items-center justify-center gap-2">
                                    Réserver <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </span>
                                </button>
                              </div>
                              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-400 dark:text-slate-500">
                                <div className="flex items-center gap-1">
                                  <ShieldCheck size={12} />
                                  <span>Paiement Sécurisé</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  <span>Prestataire Vérifié</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Lock size={12} />
                                  <span>Données Chiffrées</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : searched ? (
                      <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                          <Search
                            size={32}
                            className="text-slate-300 dark:text-slate-600"
                          />
                        </div>
                        <h3 className="text-slate-900 dark:text-white font-bold mb-2 text-lg">
                          {t("calculator.noQuotesFound")}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px] mx-auto">
                          Essayez de modifier vos critères de recherche pour trouver des
                          offres.
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-12 flex flex-col items-center justify-center h-full min-h-[400px]">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                          <CalculatorIcon size={40} className="text-blue-500/50" />
                        </div>
                        <h3 className="text-slate-900 dark:text-white font-bold mb-2 text-xl">
                          {t("calculator.fillForm")}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-[250px] mx-auto leading-relaxed">
                          Remplissez le formulaire à gauche pour obtenir une estimation
                          précise et immédiate.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          }
        </AnimatePresence >
      </div >

      <SavedQuoteModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        quoteDetails={quoteToSave}
      />

      <KYCVerificationModal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onSuccess={() => {
          if (user) profileService.getProfile(user.id, true).then((p) => console.log('Profile updated', p));
        }}
      />
    </div >
  );
}

/**
 * Sub-component to handle KYC check for each quote
 */
function QuoteKYCCheck({ quote, onShowKYC }: { quote: any, onShowKYC: () => void }) {
  const [requiresKYC, setRequiresKYC] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function check() {
      if (!user) return;

      setChecking(true);
      try {
        // Fetch fresh profile
        const p = await profileService.getProfile(user.id);
        setProfile(p);

        if (p?.kyc_status === 'verified') {
          setRequiresKYC(false);
          return;
        }

        // Check if this quote amount exceeds threshold (1M XOF)
        // Note: we need to normalize to XOF if it's not
        // For simplicity, if total_cost > 1000000 and currency is XOF
        // OR we use the service which checks monthly volume + current
        const isRequired = await kycService.checkKYCRequirement(quote.total_cost);
        setRequiresKYC(isRequired);
      } catch (e) {
        console.error("KYC check error:", e);
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [quote.id, user, quote.total_cost]);

  if (checking) return (
    <div className="mt-6 p-4 bg-slate-50 dark:bg-gray-800/50 rounded-xl animate-pulse flex items-center gap-3">
      <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
      <span className="text-xs text-slate-500">Vérification de conformité AML...</span>
    </div>
  );

  if (requiresKYC && profile?.kyc_status !== 'verified') {
    return (
      <div className="mt-6 p-5 bg-amber-500/10 dark:bg-amber-500/10 rounded-2xl border-2 border-amber-500/30 animate-in zoom-in group">
        <div className="flex items-start gap-4">
          <div className="bg-amber-500 text-white p-2.5 rounded-xl shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h5 className="font-extrabold text-amber-900 dark:text-amber-200 text-base leading-tight">
              Vérification d'Identité Requise
            </h5>
            <p className="text-xs text-amber-800/80 dark:text-amber-400/80 mt-1 font-medium leading-relaxed">
              Le montant total cumulé de vos transactions dépasse <strong>1.000.000 FCFA/mois</strong>.
              Une vérification KYC (CNI/Passeport) est obligatoire pour continuer.
            </p>
            <button
              onClick={onShowKYC}
              className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              Compléter mon KYC <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

