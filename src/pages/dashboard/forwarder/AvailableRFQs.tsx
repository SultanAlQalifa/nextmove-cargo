import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { rfqService } from "../../../services/rfqService";
import type { RFQRequest, RFQFilters } from "../../../types/rfq";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Package,
  Ship,
  Plane,
  Truck,
  ArrowRight,
  DollarSign,
  Clock,
  Eye, // Added Icon
} from "lucide-react";

export default function AvailableRFQs() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [rfqs, setRfqs] = useState<RFQRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<RFQFilters>({});
  // Add state to track which RFQs the user has already bid on
  const [myRespondedRfqs, setMyRespondedRfqs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRFQs();
  }, [filters]);

  const loadRFQs = async () => {
    try {
      setLoading(true);
      // Parallel fetch: Available RFQs AND User's existing offers
      const [availableData, myOffersData] = await Promise.all([
        rfqService.getAvailableRFQs(filters),
        rfqService.getMyOffers()
      ]);

      setRfqs(availableData);

      // Create a Set of RFQ IDs that the user has already offered on
      // Using 'any' cast temporarily if type mismatch, but OfferWithRFQ matches
      const respondedIds = new Set(myOffersData.map(offer => offer.rfq_id));
      setMyRespondedRfqs(respondedIds);

    } catch (error) {
      console.error("Error loading RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRFQs();
  };

  const filteredRfqs = rfqs.filter((rfq) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      rfq.origin_port.toLowerCase().includes(term) ||
      rfq.destination_port.toLowerCase().includes(term) ||
      rfq.cargo_type.toLowerCase().includes(term)
    );
  });

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "sea":
        return <Ship className="w-5 h-5" />;
      case "air":
        return <Plane className="w-5 h-5" />;
      default:
        return <Truck className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Demandes Disponibles
          </h1>
          <p className="text-gray-500 mt-1">
            Trouvez de nouvelles opportunités et soumettez vos offres.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher (origine, destination, marchandise)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() =>
              setFilters({ ...filters, transport_mode: undefined })
            }
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${!filters.transport_mode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilters({ ...filters, transport_mode: "sea" })}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${filters.transport_mode === "sea" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
          >
            <Ship className="w-4 h-4" /> Maritime
          </button>
          <button
            onClick={() => setFilters({ ...filters, transport_mode: "air" })}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${filters.transport_mode === "air" ? "bg-sky-600 text-white" : "bg-sky-50 text-sky-700 hover:bg-sky-100"}`}
          >
            <Plane className="w-4 h-4" /> Aérien
          </button>
        </div>
      </div>

      {/* RFQ List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredRfqs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Aucune demande trouvée
          </h3>
          <p className="text-gray-500 mt-2">
            Essayez de modifier vos filtres ou revenez plus tard.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredRfqs.map((rfq) => {
            const hasResponded = myRespondedRfqs.has(rfq.id);

            return (
              <div
                key={rfq.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                  {/* Route & Icon */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3 rounded-xl ${rfq.transport_mode === "air" ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"}`}
                    >
                      {getTransportIcon(rfq.transport_mode)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-lg font-bold text-gray-900">
                        {rfq.origin_port}
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                        {rfq.destination_port}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Départ:{" "}
                          {rfq.preferred_departure_date
                            ? new Date(
                              rfq.preferred_departure_date,
                            ).toLocaleDateString()
                            : "Flexible"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          Publié le:{" "}
                          {new Date(rfq.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Details */}
                  <div className="flex-1 grid grid-cols-2 gap-4 border-l border-r border-gray-50 px-6">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Marchandise
                      </p>
                      <p className="font-semibold text-gray-900 mt-1">
                        {rfq.cargo_type}
                      </p>
                      <p className="text-sm text-gray-500">
                        {rfq.quantity} unité(s)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Budget Cible
                      </p>
                      {rfq.budget_amount ? (
                        <p className="font-semibold text-green-700 mt-1">
                          {rfq.budget_amount.toLocaleString()}{" "}
                          {rfq.budget_currency}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic mt-1">
                          Non spécifié
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div>
                    {hasResponded ? (
                      <button
                        onClick={() => navigate("/dashboard/forwarder/offers")}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl font-medium hover:bg-green-100 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Voir mon offre
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(`/dashboard/forwarder/rfq/${rfq.id}/offer`)
                        }
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                      >
                        Faire une offre
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
