import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../../contexts/ToastContext";
import { rfqService } from "../../services/rfqService";
import { forwarderRateService, ForwarderRate } from "../../services/forwarderRateService";
import type { RFQRequest, CreateOfferData } from "../../types/rfq";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Clock,
  Shield,
  FileText,
  CheckCircle,
  AlertCircle,
  Calculator,
} from "lucide-react";

export default function CreateOfferForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { success, error: toastError } = useToast();
  const [rfq, setRfq] = useState<RFQRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<CreateOfferData>>({
    base_price: 0,
    insurance_price: 0,
    customs_clearance_price: 0,
    door_to_door_price: 0,
    packaging_price: 0,
    storage_price: 0,
    other_fees: 0,
    other_fees_description: "",
    currency: "XOF",
    estimated_transit_days: 7,
    validity_days: 15,
    message_to_client: "",
    terms_and_conditions: "",
    services_included: [],
  });

  useEffect(() => {
    if (id) {
      loadRFQ(id);
    }
  }, [id]);

  const loadRFQ = async (rfqId: string) => {
    try {
      setLoading(true);
      // We need a method to get a single RFQ without offers, or just use getRFQWithOffers and ignore offers
      // For now, assuming we can use getRFQWithOffers or a new method.
      // Let's use getRFQWithOffers as it returns the RFQ details we need.
      const data = await rfqService.getRFQWithOffers(rfqId);
      setRfq(data);
      if (data.budget_currency) {
        setFormData((prev) => ({ ...prev, currency: data.budget_currency }));
      }

      // AUTO-FILL PRICING FROM STANDARD RATES
      try {
        const myRates = await forwarderRateService.getMyRates();

        const normalize = (str?: string) => str?.trim().toLowerCase() || "";

        // Helper to check route match
        const isRouteMatch = (rate: ForwarderRate) => {
          const rfqOrigin = normalize(data.origin_port);
          const rfqDest = normalize(data.destination_port);
          const rateOrigin = normalize(rate.origin?.name);
          const rateDest = normalize(rate.destination?.name);

          const originMatch = !rate.origin_id || rateOrigin === rfqOrigin;
          const destMatch = !rate.destination_id || rateDest === rfqDest;
          return originMatch && destMatch;
        };

        // Find candidates with correct Mode and Route
        const candidates = myRates.filter(rate =>
          rate.mode === data.transport_mode && isRouteMatch(rate)
        );

        // Prioritize EXACT type match (e.g. Express == Express)
        // If not found, fall back to anything available (e.g. Standard)
        const exactMatch = candidates.find(rate => rate.type === data.service_type);
        const bestMatch = exactMatch || candidates[0];

        if (bestMatch) {
          // Calculate Base Price
          let calculatedPrice = 0;
          if (data.transport_mode === "sea" && data.volume_cbm) {
            calculatedPrice = Number(bestMatch.price) * data.volume_cbm;
          } else if (data.transport_mode === "air" && data.weight_kg) {
            calculatedPrice = Number(bestMatch.price) * data.weight_kg;
          }

          setFormData((prev) => ({
            ...prev,
            base_price: calculatedPrice || prev.base_price,
            estimated_transit_days: Number(bestMatch.max_days) || 7,
            validity_days: 15,
            currency: bestMatch.currency || prev.currency, // Ensure currency matches rate
            // Pre-fill valid message
            message_to_client: `Offre basée sur notre tarif ${bestMatch.type === 'express' ? 'Express' : 'Standard'}.`,
          }));

          if (exactMatch) {
            success("Tarifs correspondants appliqués automatiquement !");
          } else {
            // Inform user about fallback
            success(`Tarif ${data.service_type} introuvable. Tarif Standard appliqué.`);
          }
        } else {
          // No candidates found even with loose matching.
        }


      } catch (err) {
        console.warn("Could not auto-fill rates", err);
      }
    } catch (error) {
      console.error("Error loading RFQ:", error);
      toastError("Erreur lors du chargement de la demande.");
      navigate("/dashboard/forwarder/rfq/available");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    const {
      base_price = 0,
      insurance_price = 0,
      customs_clearance_price = 0,
      door_to_door_price = 0,
      packaging_price = 0,
      storage_price = 0,
      other_fees = 0,
    } = formData;
    return (
      base_price +
      insurance_price +
      customs_clearance_price +
      door_to_door_price +
      packaging_price +
      storage_price +
      other_fees
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !rfq) return;

    try {
      setSubmitting(true);
      const total_price = calculateTotal();

      await rfqService.createOffer({
        ...(formData as CreateOfferData),
        rfq_id: id,
        total_price,
      });

      // Success feedback
      success("Offre envoyée avec succès !");
      navigate("/dashboard/forwarder");
    } catch (error) {
      console.error("Error creating offer:", error);
      toastError("Une erreur est survenue lors de l'envoi de l'offre.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!rfq) return null;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/dashboard/forwarder/rfq/available")}
          className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux demandes
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nouvelle Offre</h1>
        <p className="text-gray-500 mt-1">
          Pour la demande:{" "}
          <span className="font-medium text-gray-900">
            {rfq.origin_port} → {rfq.destination_port}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Pricing Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" /> Détails du Prix
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fret de base *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="base_price"
                  required
                  min="0"
                  value={formData.base_price}
                  onChange={handleInputChange}
                  onWheel={(e) => e.currentTarget.blur()}
                  title="Fret de base"
                  className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                  {formData.currency}
                </span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Devise
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                title="Devise"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="XOF">XOF (CFA)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="CNY">CNY (¥)</option>
              </select>
            </div>

            {/* Additional Fees */}
            {[
              { name: "insurance_price", label: "Assurance" },
              { name: "door_to_door_price", label: "Livraison Door-to-Door" },
              { name: "packaging_price", label: "Emballage" },
              { name: "storage_price", label: "Stockage" },
              { name: "other_fees", label: "Autres frais" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name={field.name}
                    min="0"
                    value={
                      formData[field.name as keyof CreateOfferData] as number
                    }
                    onChange={handleInputChange}
                    onWheel={(e) => e.currentTarget.blur()}
                    title={field.label}
                    className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    {formData.currency}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Total Calculation */}
          <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10 flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary">
              <Calculator className="w-5 h-5" />
              <span className="font-medium">Total Estimé</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {calculateTotal().toLocaleString()} {formData.currency}
            </p>
          </div>
        </div>

        {/* Transit & Validity */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Transit & Validité
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Temps de transit estimé (jours) *
              </label>
              <input
                type="number"
                name="estimated_transit_days"
                required
                min="1"
                value={formData.estimated_transit_days}
                onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                title="Temps de transit estimé"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validité de l'offre (jours) *
              </label>
              <input
                type="number"
                name="validity_days"
                required
                min="1"
                value={formData.validity_days}
                onChange={handleInputChange}
                onWheel={(e) => e.currentTarget.blur()}
                title="Validité de l'offre"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de départ prévue
              </label>
              <input
                type="date"
                name="departure_date"
                value={formData.departure_date || ""}
                onChange={handleInputChange}
                title="Date de départ prévue"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'arrivée prévue
              </label>
              <input
                type="date"
                name="arrival_date"
                value={formData.arrival_date || ""}
                onChange={handleInputChange}
                title="Date d'arrivée prévue"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Message & Terms */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Message & Conditions
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message pour le client
              </label>
              <textarea
                name="message_to_client"
                rows={3}
                value={formData.message_to_client}
                onChange={handleInputChange}
                placeholder="Ajoutez une note personnelle ou des détails sur votre service..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conditions Générales
              </label>
              <textarea
                name="terms_and_conditions"
                rows={3}
                value={formData.terms_and_conditions}
                onChange={handleInputChange}
                placeholder="Spécifiez vos conditions particulières si nécessaire..."
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                Envoyer l'offre
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
