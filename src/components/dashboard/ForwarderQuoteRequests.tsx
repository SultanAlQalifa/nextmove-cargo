import { useState, useEffect } from "react";
import { quoteService, QuoteRequest, Quote } from "../../services/quoteService";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useForm } from "react-hook-form";
import { Package, DollarSign } from "lucide-react";

interface QuoteFormData {
  amount: number;
  currency: string;
  valid_until: string;
}

export default function ForwarderQuoteRequests() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [requests, setRequests] = useState<QuoteRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<QuoteRequest | null>(
    null,
  );
  const { register, handleSubmit, reset } = useForm<QuoteFormData>({
    defaultValues: {
      currency: "XOF",
    },
  });

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const data = await quoteService.getPendingRequestsForForwarder();
      setRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
    }
  };

  const onSubmit = async (data: QuoteFormData) => {
    if (!user || !selectedRequest) return;
    try {
      await quoteService.submitQuote({
        request_id: selectedRequest.id!,
        forwarder_id: user.id,
        amount: Number(data.amount),
        currency: data.currency,
        valid_until: data.valid_until
          ? new Date(data.valid_until).toISOString()
          : undefined,
      });
      success("Quote submitted successfully!");
      setSelectedRequest(null);
      reset();
      loadRequests(); // Refresh list
    } catch (error) {
      console.error("Error submitting quote:", error);
      toastError("Failed to submit quote.");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">
        Pending Quote Requests
      </h2>

      <div className="grid grid-cols-1 gap-6">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white shadow sm:rounded-lg p-6 border hover:border-primary transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {request.origin_country} → {request.destination_country}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {request.mode.toUpperCase()} - {request.type.toUpperCase()}
                  </p>
                  <div className="mt-2 text-sm text-gray-700">
                    <p>
                      <span className="font-semibold">Cargo:</span>{" "}
                      {request.cargo_details.description}
                    </p>
                    {request.cargo_details.weight_kg && (
                      <p>Weight: {request.cargo_details.weight_kg} kg</p>
                    )}
                    {request.cargo_details.volume_cbm && (
                      <p>Volume: {request.cargo_details.volume_cbm} CBM</p>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(request)}
                className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Send Quote
              </button>
            </div>

            {selectedRequest?.id === request.id && (
              <div className="mt-6 border-t pt-4 bg-gray-50 p-4 rounded-md">
                <h4 className="text-md font-bold mb-4 flex items-center gap-2">
                  <DollarSign size={18} /> Submit Your Offer
                </h4>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      {...register("amount")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <select
                      {...register("currency")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    >
                      <option value="XOF">XOF</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      {...register("valid_until")}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ))}

        {requests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No pending requests at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
