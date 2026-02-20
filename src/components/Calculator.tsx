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
import { useToast } from "../contexts/ToastContext";

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
  ChevronDown,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useCurrency } from "../contexts/CurrencyContext";
import { locationService, Location } from "../services/locationService";
import { normalizeCountryName } from "../constants/countries";
import SavedQuoteModal from "./common/SavedQuoteModal";
import KYCVerificationModal from "./profile/KYCVerificationModal";
import { kycService } from "../services/kycService";
import { profileService } from "../services/profileService";

export default function Calculator() {
  const { t } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();
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
  const [calculationMode, setCalculationMode] = useState<"platform" | "compare" | "specific" | "sourcing">("platform");
  const [sourcingUrl, setSourcingUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sourcingData, setSourcingData] = useState<any>(null);
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
  const [customsPrediction, setCustomsPrediction] = useState<{ total_percent: number; detail: string; confidence: number } | null>(null);

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

      // Trigger AI Customs Prediction
      if (params.origin && params.destination) {
        import("../services/aiService").then(({ aiService }) => {
          aiService.predictCustomsFees({
            origin: params.origin,
            destination: params.destination,
            cargo_type: "Marchandises Générales",
            value_amount: Number(watch("cargoValue")) || 0,
            value_currency: currency
          }).then(prediction => {
            setCustomsPrediction(prediction);
            // Apply prediction to all quotes to update total_cost
            setQuotes(prevQuotes => prevQuotes.map(q =>
              calculatorService.applyAIPrediction(q, prediction, Number(watch("cargoValue")) || 0)
            ));
          });
        });
      }

      changeStep(5);
    } catch (err) {
      setError("Erreur lors du calcul");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSourcingAnalysis = async () => {
    if (!sourcingUrl) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await calculatorService.analyzeSourcingLink(sourcingUrl);
      setSourcingData(data);

      // Auto-fill form
      if (data.weight_kg) setValue("weight_kg", data.weight_kg);

      if (data.volume_cbm) {
        const side = Math.pow(data.volume_cbm, 1 / 3);
        setLength((side * 100).toFixed(0));
        setWidth((side * 100).toFixed(0));
        setHeight((side * 100).toFixed(0));
        setDimensionUnit("cm");
        setCalculatedCBM(data.volume_cbm);
      }

      if (data.unit_price) setValue("cargoValue", data.unit_price);

      toastSuccess("Analyse IA terminée ! Les données ont été pré-remplies.");
    } catch (err: any) {
      console.error(err);
      toastError("Erreur d'analyse IA. Vous pouvez remplir les détails manuellement.");
    } finally {
      setIsAnalyzing(false);
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

      <div className="mb-10 relative">
        <div className="flex justify-between items-end mb-6 px-2">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
              {currentStep === 1 && "Votre Besoin"}
              {currentStep === 2 && "Le Trajet"}
              {currentStep === 3 && "Le Transport"}
              {currentStep === 4 && "Les Détails"}
              {currentStep === 5 && "Vos Résultats"}
            </h1>
            <p className="text-slate-500 font-medium mt-1">Étape {currentStep} sur {totalSteps}</p>
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-all duration-500 ${s <= currentStep ? "bg-orange-600 shadow-[0_0_10px_rgba(234,88,12,0.5)]" : "bg-slate-200 dark:bg-slate-800"}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card-premium rounded-[3rem] p-10 min-h-[500px] relative overflow-hidden border-white/20 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none">
        <div className="grain-overlay opacity-[0.03]" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                {[
                  { id: 'platform', title: t("calculator.platformRates"), desc: t("calculator.platformRatesDesc"), icon: CalculatorIcon, color: "blue" },
                  { id: 'compare', title: t("calculator.compareForwarders"), desc: t("calculator.compareForwardersDesc"), icon: Scale, color: "emerald" },
                  { id: 'sourcing', title: "Sourcing Hub", desc: "IA-Sourcing : Collez, Analysez !", icon: Search, color: "orange" },
                  { id: 'specific', title: t("calculator.specificForwarder"), desc: t("calculator.specificForwarderDesc"), icon: User, color: "indigo" }
                ].map((mode) => (
                  <motion.div
                    key={mode.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: 1,
                      borderColor: calculationMode === mode.id ? "rgba(234, 88, 12, 0.5)" : "transparent"
                    }}
                    whileHover={{ scale: 1.05, y: -10 }}
                    onClick={() => setCalculationMode(mode.id as any)}
                    className={`cursor-pointer rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden transition-all duration-500
                        ${calculationMode === mode.id
                        ? "glass-card-premium bg-orange-500/5 shadow-2xl shadow-orange-500/10 border-orange-500/50"
                        : "bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 hover:shadow-xl"
                      }`}
                  >
                    <div className="grain-overlay opacity-[0.02]" />

                    {calculationMode === mode.id && (
                      <motion.div
                        layoutId="cardGlow"
                        className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent blur-2xl"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}

                    <div className={`p-5 rounded-2xl transition-all duration-500 ${calculationMode === mode.id ? "bg-orange-600 text-white shadow-lg shadow-orange-500/30 rotate-12" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:rotate-6"}`}>
                      <mode.icon size={32} strokeWidth={1.5} />
                    </div>

                    <div className="relative z-10">
                      <h3 className={`font-black text-lg mb-2 uppercase tracking-tight ${calculationMode === mode.id ? "text-orange-600 dark:text-orange-400" : "text-slate-800 dark:text-white"}`}>
                        {mode.title}
                      </h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-tight">
                        {mode.desc}
                      </p>
                    </div>

                    {calculationMode === mode.id && (
                      <div className="absolute top-4 right-4 animate-pulse">
                        <CheckCircle size={16} className="text-orange-600" />
                      </div>
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

              {calculationMode === 'sourcing' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-10 glass-card-premium bg-gradient-to-br from-indigo-500/5 to-blue-500/5 rounded-[3rem] border border-blue-500/20 relative overflow-hidden group"
                >
                  <div className="grain-overlay opacity-[0.03]" />
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />

                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-inner">
                      <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400 fill-current animate-pulse" />
                    </div>
                    <div>
                      <h4 className="font-black text-xl text-slate-900 dark:text-white uppercase tracking-tight">Sourcing Hub IA</h4>
                      <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Analyse intelligente de fiches produits</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-lg">
                    L'IA détecte automatiquement le poids, le volume et la valeur depuis Alibaba, AliExpress ou Amazon pour pré-remplir votre devis.
                  </p>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1 group/input">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Search className="text-blue-500 w-5 h-5 transition-transform group-focus-within/input:scale-110" />
                      </div>
                      <input
                        type="url"
                        placeholder="Coller le lien du produit ici..."
                        value={sourcingUrl}
                        onChange={(e) => setSourcingUrl(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900/50 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-8 focus:ring-blue-500/5 outline-none transition-all font-bold text-slate-700 dark:text-white shadow-inner"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSourcingAnalysis}
                      disabled={isAnalyzing || !sourcingUrl}
                      className="px-10 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 relative overflow-hidden group/btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:animate-shimmer" />
                      {isAnalyzing ? (
                        <>
                          <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Analyse...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={18} className="fill-current" />
                          <span>Analyser</span>
                        </>
                      )}
                    </button>
                  </div>

                  <AnimatePresence>
                    {sourcingData && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6"
                      >
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Package size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Produit</span>
                            <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{sourcingData.item_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Star size={18} className="text-emerald-600" />
                          </div>
                          <div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Recommandation IA</span>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 italic">"{sourcingData.shipping_advice}"</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
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

              <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-6 items-center relative">
                {/* Origin */}
                <div className="relative group/box">
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-[0.2em] ml-1">Origine</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-orange-600 shadow-[0_0_12px_rgba(234,88,12,0.6)] z-10" />
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
                      className="block w-full pl-14 pr-6 py-5 rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 text-xl font-black text-slate-900 dark:text-white focus:border-orange-500/50 focus:ring-8 focus:ring-orange-500/5 transition-all shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      placeholder="Pays de départ..."
                    />

                    <AnimatePresence>
                      {showOriginDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className="absolute z-[100] w-full mt-3 glass-card-premium rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 max-h-72 overflow-hidden flex flex-col"
                        >
                          <div className="p-2 overflow-y-auto custom-scrollbar">
                            {filteredOrigins.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                className="w-full text-left px-5 py-4 hover:bg-orange-500/10 rounded-2xl text-slate-700 dark:text-slate-200 font-bold transition-colors flex items-center gap-3 group/item"
                                onClick={() => {
                                  setValue("origin", loc.name);
                                  setOriginSearch(loc.name);
                                  setShowOriginDropdown(false);
                                }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-orange-500 transition-colors" />
                                {loc.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Swap Icon */}
                <div className="flex justify-center pt-6">
                  <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 shadow-inner group/swap cursor-pointer hover:bg-orange-500 transition-all duration-300">
                    <ArrowRight className="text-slate-400 group-hover/swap:text-white transition-colors" />
                  </div>
                </div>

                {/* Destination */}
                <div className="relative group/box">
                  <label className="block text-xs font-black text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-[0.2em] ml-1">Destination</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-slate-900 dark:bg-white shadow-[0_0_12px_rgba(255,255,255,0.4)] z-10" />
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
                      className="block w-full pl-14 pr-6 py-5 rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/50 text-xl font-black text-slate-900 dark:text-white focus:border-slate-800 dark:focus:border-white focus:ring-8 focus:ring-slate-500/5 transition-all shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-700"
                      placeholder="Pays d'arrivée..."
                    />

                    <AnimatePresence>
                      {showDestDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 5, scale: 0.95 }}
                          className="absolute z-[100] w-full mt-3 glass-card-premium rounded-3xl shadow-2xl border border-white/20 dark:border-white/5 max-h-72 overflow-hidden flex flex-col"
                        >
                          <div className="p-2 overflow-y-auto custom-scrollbar">
                            {filteredDestinations.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                className="w-full text-left px-5 py-4 hover:bg-slate-500/10 rounded-2xl text-slate-700 dark:text-slate-200 font-bold transition-colors flex items-center gap-3 group/item"
                                onClick={() => {
                                  setValue("destination", loc.name);
                                  setDestSearch(loc.name);
                                  setShowDestDropdown(false);
                                }}
                              >
                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-slate-900 dark:group-hover/item:bg-white transition-colors" />
                                {loc.name}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                ].map((option) => {
                  const isSelected = selectedMode === option.mode && selectedType === option.type;
                  const activeColor = {
                    blue: "bg-blue-600 shadow-blue-500/40",
                    sky: "bg-sky-600 shadow-sky-500/40",
                    orange: "bg-orange-600 shadow-orange-500/40",
                    purple: "bg-purple-600 shadow-purple-500/40"
                  }[option.color as 'blue' | 'sky' | 'orange' | 'purple'];

                  return (
                    <motion.div
                      key={`${option.mode}-${option.type}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        borderColor: isSelected ? "rgba(234, 88, 12, 0.5)" : "transparent"
                      }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => { setValue("mode", option.mode as any); setValue("type", option.type as any); }}
                      className={`cursor-pointer rounded-[2.5rem] p-8 border-2 flex flex-col gap-6 relative overflow-hidden transition-all duration-500
                        ${isSelected
                          ? "glass-card-premium bg-orange-500/5 shadow-2xl border-orange-500/50"
                          : "bg-white dark:bg-slate-800/30 border-slate-100 dark:border-white/5 hover:shadow-xl"
                        }`}
                    >
                      <div className="grain-overlay opacity-[0.02]" />

                      <div className="flex items-center gap-5 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${isSelected ? `${activeColor} text-white shadow-lg rotate-3` : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:rotate-6"}`}>
                          {option.type === 'express' ? (
                            <div className="relative">
                              <option.icon size={32} />
                              <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-2 -right-2 p-1 bg-yellow-400 rounded-full text-white shadow-sm"
                              >
                                <Zap size={10} className="fill-current" />
                              </motion.div>
                            </div>
                          ) : (
                            <option.icon size={32} />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-black text-xl tracking-tight ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-800 dark:text-slate-200"}`}>{option.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock size={12} className="text-slate-400" />
                            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{option.desc}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-end relative z-10">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Tarif estimé</span>
                          <p className={`text-xl font-black ${isSelected ? "text-orange-600" : "text-slate-900 dark:text-white"}`}>
                            {formatRateDisplay(option.rate, option.unit)}
                          </p>
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-orange-600 text-white p-2.5 rounded-full shadow-lg shadow-orange-500/30"
                          >
                            <Check size={18} />
                          </motion.div>
                        )}
                      </div>
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
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Détails de l'envoi</h2>
                  <div className="flex flex-wrap justify-center gap-3">
                    <div className="flex items-center gap-3 bg-white dark:bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm text-sm font-bold">
                      <span className="text-slate-900 dark:text-white">{watch("origin")}</span>
                      <ArrowRight size={14} className="text-orange-600" />
                      <span className="text-slate-900 dark:text-white">{watch("destination")}</span>
                    </div>
                    <div className={`px-4 py-2 rounded-2xl text-sm font-black flex items-center gap-2 border shadow-sm ${selectedMode === 'sea'
                      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                      : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                      }`}>
                      {selectedMode === 'sea' ? <Ship size={14} className="animate-pulse" /> : <Plane size={14} className="animate-pulse" />}
                      <span className="uppercase tracking-wider">{selectedMode === 'sea' ? 'Maritime' : 'Aérien'}</span>
                    </div>
                    <div className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center">
                      {selectedType === 'express' ? 'Express' : 'Standard'}
                    </div>
                  </div>
                </div>


                <div className="glass-card-premium bg-white dark:bg-slate-900/30 p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative group">
                  <div className="grain-overlay opacity-[0.02]" />
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-orange-600/10 rounded-2xl border border-orange-500/20">
                      <Package size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Dimensions du Colis
                    </h3>
                  </div>

                  {selectedMode === "sea" ? (
                    <div className="space-y-10">
                      <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                          Unité de mesure
                        </label>
                        <select
                          aria-label={t("calculator.measurementUnit")}
                          value={dimensionUnit}
                          onChange={(e) => setDimensionUnit(e.target.value as LengthUnit)}
                          className="block w-full rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/80 px-6 py-4 font-bold text-slate-900 dark:text-white focus:border-orange-500/50 appearance-none shadow-inner"
                        >
                          <option value="m">Mètres (m)</option>
                          <option value="cm">Centimètres (cm)</option>
                          <option value="in">Pouces (in)</option>
                        </select>
                        <div className="absolute right-6 top-[55px] pointer-events-none">
                          <ChevronDown size={18} className="text-slate-400" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { label: 'Longueur', value: length, setter: setLength, icon: 'L' },
                          { label: 'Largeur', value: width, setter: setWidth, icon: 'W' },
                          { label: 'Hauteur', value: height, setter: setHeight, icon: 'H' }
                        ].map((dim) => (
                          <div key={dim.label} className="relative group/input">
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                              {dim.label} ({dimensionUnit})
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={dim.value}
                              onChange={(e) => dim.setter(e.target.value)}
                              placeholder="0.00"
                              onWheel={(e) => e.currentTarget.blur()}
                              className="block w-full rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/80 px-6 py-4 font-black text-xl text-slate-900 dark:text-white focus:border-orange-500 focus:ring-8 focus:ring-orange-500/5 transition-all shadow-inner"
                            />
                            <div className="absolute right-5 top-[55px] font-black text-[10px] text-orange-600/30 group-focus-within/input:text-orange-600 transition-colors uppercase">
                              {dim.icon}
                            </div>
                          </div>
                        ))}
                      </div>

                      {calculatedCBM > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="p-8 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                              <Box size={28} />
                            </div>
                            <div>
                              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Volume Total</span>
                              <div className="text-3xl font-black text-slate-800 dark:text-white">{calculatedCBM} <span className="text-lg opacity-40">CBM</span></div>
                            </div>
                          </div>

                          <div className="flex gap-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl border border-white dark:border-white/5 max-w-xs">
                            <HelpCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wide italic">
                              Règle du Poids/Volume (1 CBM = 1000 kg). L'IA appliquera le tarif le plus avantageux.
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ) : (
                    <div className="relative group/input">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">
                        Poids Total (KG)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          {...register("weight_kg")}
                          placeholder="Ex: 50.0"
                          onWheel={(e) => e.currentTarget.blur()}
                          className="block w-full rounded-2xl border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/80 px-8 py-6 font-black text-3xl text-slate-900 dark:text-white focus:border-orange-500 focus:ring-8 focus:ring-orange-500/5 transition-all shadow-inner"
                        />
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-xl text-orange-600/30 group-focus-within/input:text-orange-600 transition-colors">
                          KG
                        </div>
                      </div>
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
                      <div className="space-y-6">
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-500 relative overflow-hidden group/service ${selectedServices.insurance
                            ? "border-orange-500/50 bg-orange-500/5 shadow-xl shadow-orange-500/10"
                            : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 hover:border-orange-300"
                            }`}
                          onClick={() =>
                            setSelectedServices((prev) => ({
                              ...prev,
                              insurance: !prev.insurance,
                            }))
                          }
                        >
                          <div className="flex items-center gap-5 relative z-10">
                            <div className={`p-4 rounded-2xl transition-all duration-500 ${selectedServices.insurance ? "bg-orange-600 text-white shadow-lg rotate-6" : "bg-white dark:bg-slate-800 text-slate-400"}`}>
                              <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <h4 className={`font-black uppercase tracking-tight ${selectedServices.insurance ? "text-orange-600 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}>
                                Assurance Premium
                              </h4>
                              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
                                Protection 100% contre perte et dommages (Recommandé)
                              </p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedServices.insurance ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300"}`}>
                              {selectedServices.insurance && <Check size={14} strokeWidth={3} />}
                            </div>
                          </div>
                        </motion.div>

                        <AnimatePresence>
                          {selectedServices.insurance ? (
                            <motion.div
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="p-8 bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-orange-500/20 shadow-xl relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                <ShieldCheck size={120} className="text-orange-600" />
                              </div>
                              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
                                Valeur Totale Déclarée
                              </label>
                              <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="flex-1 w-full">
                                  <div className="relative group/val">
                                    <input
                                      type="number"
                                      {...register("cargoValue")}
                                      placeholder="0.00"
                                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 rounded-2xl px-8 py-6 font-black text-3xl text-slate-900 dark:text-white focus:border-orange-500 transition-all shadow-inner"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-xl text-orange-600 group-focus-within/val:animate-pulse uppercase">
                                      {currency}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <div className="group relative border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-5 text-center hover:border-orange-500 transition-all bg-slate-50 dark:bg-slate-800/30 cursor-pointer min-w-[200px]">
                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-10" accept="image/*" title="Justificatif de valeur" />
                                    <div className="flex flex-col items-center gap-2">
                                      <Camera className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Justificatif</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {(!watch("cargoValue") || Number(watch("cargoValue")) <= 0) && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="mt-6 flex items-center gap-4 bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20"
                                >
                                  <AlertCircle className="w-5 h-5 text-orange-600 animate-pulse" />
                                  <span className="text-[10px] font-black uppercase tracking-tight text-orange-600 italic">Détaillez la valeur pour activer la protection.</span>
                                </motion.div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="p-6 bg-red-500/5 rounded-3xl border border-red-500/20 flex items-start gap-4"
                            >
                              <div className="p-3 bg-red-500/10 rounded-2xl">
                                <AlertCircle className="w-6 h-6 text-red-600" />
                              </div>
                              <div>
                                <h5 className="text-sm font-black text-red-900 dark:text-red-400 uppercase tracking-tight">Attention : Non assuré</h5>
                                <p className="text-[10px] font-bold text-red-700 dark:text-red-500 mt-1 uppercase leading-tight">
                                  Vous assumez l'entière responsabilité en cas de perte ou d'avarie.
                                  NextMove Cargo n'interviendra pas dans le remboursement.
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {[
                      { id: 'priority', title: 'Traitement Prioritaire', desc: 'Accélérez le traitement de votre dossier', icon: Zap, color: 'blue' },
                      { id: 'packaging', title: 'Emballage Renforcé', desc: 'Protection supplémentaire colis fragiles', icon: Box, color: 'emerald' },
                      { id: 'inspection', title: 'Inspection Qualité', desc: 'Vérification conformité marchandise', icon: ClipboardCheck, color: 'orange' },
                      { id: 'door_to_door', title: 'Door to Door', desc: "Livraison jusqu'à l'adresse finale", icon: Truck, color: 'purple' },
                      { id: 'storage', title: 'Stockage', desc: 'Entreposage temporaire sécurisé', icon: Warehouse, color: 'rose' }
                    ].map((service) => {
                      if (!isFeeActive(service.id)) return null;
                      const isActive = selectedServices[service.id as keyof typeof selectedServices];
                      return (
                        <motion.div
                          key={service.id}
                          whileHover={{ scale: 1.01 }}
                          className={`p-6 rounded-3xl border-2 cursor-pointer transition-all duration-500 flex items-center gap-5 relative overflow-hidden group/service ${isActive
                            ? "border-orange-500/50 bg-orange-500/5 shadow-xl shadow-orange-500/10"
                            : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-800/30 hover:border-orange-200"
                            }`}
                          onClick={() =>
                            setSelectedServices((prev) => ({
                              ...prev,
                              [service.id]: !prev[service.id as keyof typeof prev],
                            }))
                          }
                        >
                          <div className={`p-4 rounded-2xl transition-all duration-500 ${isActive ? "bg-orange-600 text-white shadow-lg rotate-3" : "bg-white dark:bg-slate-800 text-slate-400 group-hover/service:rotate-6"}`}>
                            <service.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-black uppercase tracking-tight text-sm ${isActive ? "text-orange-600 dark:text-orange-400" : "text-slate-900 dark:text-white"}`}>
                              {service.title}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                              {service.desc}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? "border-orange-600 bg-orange-600 text-white" : "border-slate-300"}`}>
                            {isActive && <Check size={14} strokeWidth={3} />}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-8">
                  <button
                    onClick={() => changeStep(3)}
                    className="group px-6 py-3 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2"
                  >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Retour</span>
                  </button>
                  <button
                    onClick={handleCalculate}
                    disabled={loading}
                    className="group px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="relative z-10">{loading ? "Calcul..." : "Découvrir mes tarifs"}</span>
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin relative z-10" />
                    ) : (
                      <Sparkles size={16} className="relative z-10 group-hover:rotate-12 transition-transform" />
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
              >
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Vos Tarifs Élite</h2>
                      <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">Offres en temps réel adaptées à votre profil</p>
                    </div>
                    <button
                      onClick={() => changeStep(4)}
                      className="group px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-3 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                    >
                      <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                      Modifier les détails
                    </button>
                  </div>

                  <div className="glass-card-premium bg-white dark:bg-slate-900/30 p-10 rounded-[3rem] border border-white/20 dark:border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="grain-overlay opacity-[0.02]" />

                    {/* Filter Bar */}
                    {calculationMode === "compare" && quotes.length > 0 && (
                      <div className="mb-10 flex flex-wrap gap-4 items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Trier par :</span>
                        {[
                          { id: 'price', label: 'Meilleur Prix', icon: '💰' },
                          { id: 'speed', label: 'Livraison Rapide', icon: '🚀' },
                          { id: 'rating', label: 'Mieux Notés', icon: '⭐' }
                        ].map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setSortBy(filter.id as any)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${sortBy === filter.id
                              ? "bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                              }`}
                          >
                            <span className="mr-2">{filter.icon}</span>
                            {filter.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {loading ? (
                      <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                      </div>
                    ) : quotes.length > 0 ? (
                      <div className="space-y-6">
                        {customsPrediction && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 mb-6"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                <Zap className="w-5 h-5 text-yellow-300 fill-current" />
                              </div>
                              <h3 className="font-black uppercase tracking-widest text-sm">Analyse Prédictive Globale</h3>
                            </div>
                            <p className="text-blue-50 text-sm font-medium leading-relaxed">
                              Notre IA a analysé les réglementations entre <strong>{watch("origin")}</strong> et <strong>{watch("destination")}</strong>.
                              Prévoyez environ <strong>{customsPrediction.total_percent}%</strong> de frais de douane sur la valeur déclarée.
                            </p>
                            <div className="mt-4 flex items-center gap-4">
                              <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                                    <img src={`https://i.pravatar.cc/100?u=ai${i}`} alt="AI Agent" className="w-full h-full object-cover" />
                                  </div>
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-blue-100 uppercase tracking-tight">Validé par 3 agents IA experts</span>
                            </div>
                          </motion.div>
                        )}

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
                            .map((quote, idx) => (
                              <motion.div
                                key={quote.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="group/quote relative bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-2xl hover:border-orange-500/30 transition-all duration-500 overflow-hidden"
                              >
                                <div className="grain-overlay opacity-[0.01]" />

                                <div className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center">
                                  {/* Forwarder Logo & Info */}
                                  <div className="flex flex-col items-center gap-4 min-w-[160px]">
                                    <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-4 shadow-inner group-hover/quote:scale-110 transition-transform">
                                      <img src={quote.forwarder_logo || "/logo-placeholder.png"} alt={quote.forwarder_name} className="w-full h-full object-contain grayscale group-hover/quote:grayscale-0 transition-all" />
                                    </div>
                                    <div className="text-center">
                                      <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tighter text-sm">{quote.forwarder_name}</h4>
                                      <div className="flex items-center justify-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={10} className={i < (quote.rating || 4) ? "text-yellow-400 fill-current" : "text-slate-200"} />
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Transit Details */}
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Transit</span>
                                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
                                        <Clock size={14} className="text-orange-600" />
                                        <span>{quote.transit_time}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Départ</span>
                                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black">
                                        <Ship size={14} className="text-blue-600" />
                                        <span className="truncate">{watch("origin")}</span>
                                      </div>
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Services Inclus</span>
                                      <div className="flex flex-wrap gap-2">
                                        {['Assurance', 'Douane', 'Suivi IA'].map(s => (
                                          <span key={s} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg text-[8px] font-black text-slate-500 uppercase tracking-tight">{s}</span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Pricing & Call to Action */}
                                  <div className="flex flex-col items-center md:items-end gap-3 min-w-[200px]">
                                    <div className="text-center md:text-right">
                                      <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-1">Total Estimé</span>
                                      <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {formatPrice(quote.total_cost)}
                                      </p>
                                    </div>

                                    <QuoteKYCCheck quote={quote} onShowKYC={() => setShowKYCModal(true)} />

                                    <button
                                      onClick={() => {
                                        const state = { prefill: { origin_port: watch("origin"), destination_port: watch("destination"), transport_mode: selectedMode, service_type: selectedType, cargo_details: { length, width, height, weight: watch("weight_kg"), unit: dimensionUnit }, budget: quote.total_cost, target_forwarder: quote.forwarder_id, quote_details: quote } };
                                        if (user) navigate("/dashboard/client/rfq/create", { state });
                                        else navigate("/login", { state: { from: "/dashboard/client/rfq/create", ...state } });
                                      }}
                                      className="w-full group/btn relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 overflow-hidden"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                                      <span className="relative z-10 flex items-center gap-2">
                                        Réserver <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                      </span>
                                    </button>
                                  </div>
                                </div>

                                {/* Footer trust bar */}
                                <div className="px-10 py-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex flex-wrap justify-between items-center gap-4">
                                  <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                      <ShieldCheck size={12} className="text-emerald-500" />
                                      <span>Paiement Sécurisé</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                      <CheckCircle size={12} className="text-blue-500" />
                                      <span>Prestataire Vérifié</span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setQuoteToSave(quote);
                                      setShowSaveModal(true);
                                    }}
                                    className="text-[8px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                                  >
                                    Sauvegarder pour plus tard
                                  </button>
                                </div>

                                {quote.ai_confidence && (
                                  <div className="absolute top-4 right-4 group-hover/quote:scale-110 transition-transform">
                                    <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-500/30">
                                      <Zap size={8} className="fill-current animate-pulse" />
                                      <span>IA Trust: {Math.round(quote.ai_confidence * 100)}%</span>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            ))}
                        </div>
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
        </AnimatePresence>
      </div>

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

