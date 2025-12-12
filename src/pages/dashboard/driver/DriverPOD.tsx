import { FileText, MapPin, CheckCircle, Clock } from "lucide-react";

export default function DriverPOD() {
  const pods = [
    {
      id: 1,
      tracking: "TRK-987654",
      date: "2024-03-14 14:30",
      recipient: "Moussa Diop",
      location: "Dakar, Senegal",
      status: "verified",
    },
    {
      id: 2,
      tracking: "TRK-123456",
      date: "2024-03-12 09:15",
      recipient: "Fatou Sow",
      location: "Thies, Senegal",
      status: "verified",
    },
    {
      id: 3,
      tracking: "TRK-456789",
      date: "2024-03-10 16:45",
      recipient: "Entreprise ABC",
      location: "Dakar, Senegal",
      status: "pending",
    },
  ];

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
          {pods.map((pod) => (
            <div
              key={pod.id}
              className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${pod.status === "verified" ? "bg-green-50" : "bg-yellow-50"}`}
                >
                  <FileText
                    className={`w-6 h-6 ${pod.status === "verified" ? "text-green-600" : "text-yellow-600"}`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900">{pod.tracking}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        pod.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {pod.status === "verified" ? "Validé" : "En attente"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Réceptionné par:{" "}
                    <span className="font-medium">{pod.recipient}</span>
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {pod.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {pod.location}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Voir Photo
                </button>
                <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700">
                  Détails
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
