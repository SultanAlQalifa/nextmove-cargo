import { useState, useEffect } from "react";
import { FileText, MapPin, Clock, Loader2 } from "lucide-react";
import { podService, POD } from "../../../services/podService";
import { useAuth } from "../../../contexts/AuthContext";

export default function DriverPOD() {
  const { user } = useAuth();
  const [pods, setPods] = useState<POD[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPODs();
    }
  }, [user]);

  const loadPODs = async () => {
    try {
      const data = await podService.getDriverPODs(user!.id);
      setPods(data);
    } catch (error) {
      console.error("Error loading PODs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
        <p className="text-gray-500">Chargement de vos preuves de livraison...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FileText className="text-primary" /> Historique des PODs
      </h1>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-900">
            Preuves de Livraison Soumises
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {pods.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">Aucune preuve de livraison soumise pour le moment.</p>
            </div>
          ) : (
            pods.map((pod) => (
              <div
                key={pod.id}
                className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${pod.status === "verified" ? "bg-green-50" : pod.status === "rejected" ? "bg-red-50" : "bg-yellow-50"}`}
                  >
                    <FileText
                      className={`w-6 h-6 ${pod.status === "verified" ? "text-green-600" : pod.status === "rejected" ? "text-red-600" : "text-yellow-600"}`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{pod.tracking_number}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${pod.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : pod.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {pod.status === "verified" ? "Validé" : pod.status === "rejected" ? "Rejeté" : "En attente"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Réceptionné par:{" "}
                      <span className="font-medium">{pod.recipient_name}</span>
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(pod.submitted_at).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Expédition: {pod.shipment_id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {pod.documents?.[0]?.url && (
                    <a
                      href={pod.documents[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                      Voir Photo
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
