import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { quoteService } from "../../services/quoteService";
import { useNavigate } from "react-router-dom";
import { Ship, Plane, Check } from "lucide-react";

interface QuoteRequestFormData {
  origin_country: string;
  destination_country: string;
  mode: "sea" | "air";
  type: "standard" | "express";
  weight_kg?: number;
  volume_cbm?: number;
  description: string;
}

interface QuoteRequestFormProps {
  onSuccess?: () => void;
}

export default function QuoteRequestForm({ onSuccess }: QuoteRequestFormProps) {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm<QuoteRequestFormData>({
    defaultValues: {
      mode: "sea",
      type: "standard",
      origin_country: "China",
      destination_country: "Senegal",
    },
  });

  const selectedMode = watch("mode");

  const onSubmit = async (data: QuoteRequestFormData) => {
    setLoading(true);
    try {
      await quoteService.createRequest({
        client_id: user?.id,
        origin_country: data.origin_country,
        destination_country: data.destination_country,
        mode: data.mode,
        type: data.type,
        cargo_details: {
          weight_kg: data.weight_kg ? Number(data.weight_kg) : undefined,
          volume_cbm: data.volume_cbm ? Number(data.volume_cbm) : undefined,
          description: data.description,
        },
      });
      success("Request submitted successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error submitting request:", error);
      toastError("Failed to submit request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Request a Custom Quote
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Origin
            </label>
            <select
              {...register("origin_country")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base"
            >
              <option value="China">China</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Destination
            </label>
            <select
              {...register("destination_country")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base"
            >
              <option value="Senegal">Senegal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Shipping Mode
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setValue("mode", "sea")}
              className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${selectedMode === "sea"
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                }`}
            >
              <Ship className="w-6 h-6 mr-2" />
              <span className="font-bold">Sea Freight</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("mode", "air")}
              className={`flex items-center justify-center p-4 border-2 rounded-xl transition-all ${selectedMode === "air"
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200"
                }`}
            >
              <Plane className="w-6 h-6 mr-2" />
              <span className="font-bold">Air Freight</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Weight (kg)
            </label>
            <input
              type="number"
              {...register("weight_kg")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base"
              placeholder="Approx. weight"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Volume (CBM)
            </label>
            <input
              type="number"
              step="0.1"
              {...register("volume_cbm")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base"
              placeholder="Approx. volume"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register("description", { required: true })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-base"
            placeholder="Describe your cargo, contents, packaging, etc."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all font-bold"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
            ) : (
              <Check className="w-5 h-5 mr-2" />
            )}
            Submit Quote Request
          </button>
        </div>
      </form>
    </div>
  );
}
