import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../contexts/AuthContext";
import { rateService, Rate } from "../../services/rateService";
import { Plus, Trash2, Edit2 } from "lucide-react";
import ConfirmationModal from "../common/ConfirmationModal";

export default function RateManager() {
  const { user } = useAuth();
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  const { register, handleSubmit, reset, watch } = useForm<Rate>({
    defaultValues: {
      mode: "sea",
      type: "standard",
      currency: "XOF",
    },
  });

  const selectedMode = watch("mode");

  useEffect(() => {
    if (user) loadRates();
  }, [user]);

  const loadRates = async () => {
    if (!user) return;
    try {
      const data = await rateService.getRates(user.id);
      setRates(data);
    } catch (error) {
      console.error("Error loading rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Rate) => {
    if (!user) return;
    try {
      if (editingId) {
        await rateService.updateRate(editingId, data);
      } else {
        await rateService.createRate({ ...data, forwarder_id: user.id });
      }
      await loadRates();
      reset();
      setIsEditing(false);
      setEditingId(null);
    } catch (error) {
      console.error("Error saving rate:", error);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!confirmation.id) return;
    try {
      await rateService.deleteRate(confirmation.id);
      await loadRates();
    } catch (error) {
      console.error("Error deleting rate:", error);
    } finally {
      setConfirmation({ isOpen: false, id: null });
    }
  };

  const startEdit = (rate: Rate) => {
    setEditingId(rate.id!);
    setIsEditing(true);
    reset(rate);
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Shipping Rates</h2>
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            reset();
            setEditingId(null);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus size={16} /> {isEditing ? "Cancel" : "Add Rate"}
        </button>
      </div>

      {isEditing && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-8 bg-gray-50 p-4 rounded-lg border"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mode
              </label>
              <select
                {...register("mode")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="sea">Sea Freight</option>
                <option value="air">Air Freight</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                {...register("type")}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              >
                <option value="standard">Standard</option>
                <option value="express">Express</option>
              </select>
            </div>

            {selectedMode === "air" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Min Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("min_weight")}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Max Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register("max_weight")}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Price per Unit ({selectedMode === "sea" ? "CBM" : "kg"})
              </label>
              <input
                type="number"
                step="0.01"
                required
                {...register("price_per_unit")}
                onWheel={(e) => e.currentTarget.blur()}
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
                Min Transit Time (days)
              </label>
              <input
                type="number"
                required
                {...register("transit_time_min")}
                onWheel={(e) => e.currentTarget.blur()}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Transit Time (days)
              </label>
              <input
                type="number"
                required
                {...register("transit_time_max")}
                onWheel={(e) => e.currentTarget.blur()}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              {editingId ? "Update Rate" : "Save Rate"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transit Time
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rates.map((rate) => (
              <tr key={rate.id}>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {rate.mode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap capitalize">
                  {rate.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {rate.price_per_unit} {rate.currency} /{" "}
                  {rate.mode === "sea" ? "CBM" : "kg"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {rate.transit_time_min}-{rate.transit_time_max} days
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => startEdit(rate)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                    aria-label="Edit rate"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(rate.id!)}
                    className="text-red-600 hover:text-red-900"
                    aria-label="Delete rate"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Delete Rate"
        message="Are you sure you want to delete this shipping rate? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
      />
    </div>
  );
}
