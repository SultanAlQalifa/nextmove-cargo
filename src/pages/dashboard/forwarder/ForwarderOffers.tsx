import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import { rfqService } from "../../../services/rfqService";
import type { OfferWithRFQ } from "../../../types/rfq";
import {
  FileText,
  Search,
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ForwarderOffers() {
  const [offers, setOffers] = useState<OfferWithRFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const data = await rfqService.getMyOffers();
      setOffers(data);
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> En attente
          </span>
        );
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" /> Acceptée
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
            <XCircle className="w-3.5 h-3.5" /> Rejetée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  const filteredOffers = offers.filter((offer) => {
    const matchesSearch =
      offer.rfq.origin_port.toLowerCase().includes(searchTerm.toLowerCase()) ||
      offer.rfq.destination_port
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || offer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <PageHeader
        title="Mes Offres"
        subtitle="Gérez les offres que vous avez soumises aux clients"
      />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Rechercher par port..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "pending", "accepted", "rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === status
                ? "bg-gray-900 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
            >
              {status === "all"
                ? "Tout"
                : status === "pending"
                  ? "En attente"
                  : status === "accepted"
                    ? "Acceptées"
                    : "Rejetées"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Aucune offre trouvée
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            Vous n'avez pas encore soumis d'offres correspondant à vos critères.
          </p>
          <Link
            to="/dashboard/forwarder/rfq/available"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 transition-all"
          >
            Voir les RFQ disponibles
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {offer.rfq.origin_port}
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    {offer.rfq.destination_port}
                  </span>
                  {getStatusBadge(offer.status)}
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Soumis le {new Date(offer.submitted_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    Validité: {offer.validity_days} jours
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase font-medium">
                    Prix Total
                  </p>
                  <p className="text-xl font-bold text-primary flex items-center gap-1">
                    {offer.total_price.toLocaleString()} {offer.currency}
                  </p>
                </div>

                {/* Could add View/Edit buttons here later */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
