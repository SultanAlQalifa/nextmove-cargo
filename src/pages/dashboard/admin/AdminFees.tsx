import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  Percent,
  Shield,
  Briefcase,
  AlertCircle,
  X,
  Save,
  Clock,
  AlertTriangle,
  Warehouse,
  FileText,
} from "lucide-react";
import { feeService, FeeConfig } from "../../../services/feeService";

export default function AdminFees() {
  const [fees, setFees] = useState<FeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeConfig | null>(null);
  const [formData, setFormData] = useState<Partial<FeeConfig>>({
    name: "",
    type: "percentage",
    value: 0,
    category: "management",
    target: "client",
    isActive: true,
    isRecurring: false,
    gracePeriodHours: 0,
    recurringInterval: "day",
  });

  const fetchFees = async () => {
    try {
      const data = await feeService.getFees();
      setFees(data);
    } catch (error) {
      console.error("Error fetching fees:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleOpenModal = (fee?: FeeConfig) => {
    if (fee) {
      setEditingFee(fee);
      setFormData(fee);
    } else {
      setEditingFee(null);
      setFormData({
        name: "",
        type: "percentage",
        value: 0,
        category: "management",
        target: "client",
        isActive: true,
        isRecurring: false,
        gracePeriodHours: 0,
        recurringInterval: "day",
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFee(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFee) {
        await feeService.updateFee(editingFee.id, formData);
      } else {
        await feeService.createFee(formData as Omit<FeeConfig, "id">);
      }
      fetchFees();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving fee:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce frais ?")) {
      try {
        await feeService.deleteFee(id);
        fetchFees();
      } catch (error) {
        console.error("Error deleting fee:", error);
      }
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "insurance":
        return Shield;
      case "guarantee":
        return AlertCircle;
      case "management":
        return Briefcase;
      case "storage":
        return Warehouse;
      case "penalty":
        return AlertTriangle;
      case "tax":
        return FileText;
      default:
        return DollarSign;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "insurance":
        return "bg-blue-50 text-blue-600";
      case "guarantee":
        return "bg-orange-50 text-orange-600";
      case "management":
        return "bg-purple-50 text-purple-600";
      case "storage":
        return "bg-amber-50 text-amber-600";
      case "penalty":
        return "bg-red-50 text-red-600";
      case "tax":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-50 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Frais & Services"
        subtitle="Gestion des frais, pénalités et services additionnels"
        action={{
          label: "Nouveau Frais",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fees.map((fee) => {
            const Icon = getCategoryIcon(fee.category);
            return (
              <div
                key={fee.id}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden ${!fee.isActive ? "opacity-75" : ""}`}
              >
                {!fee.isActive && (
                  <div className="absolute top-0 right-0 bg-gray-100 px-3 py-1 rounded-bl-xl text-xs font-medium text-gray-500">
                    Inactif
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`p-3 rounded-xl ${getCategoryColor(fee.category)}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(fee)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fee.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {fee.name}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${fee.target === "client" ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"}`}
                    >
                      {fee.target === "client" ? "Client" : "Transitaire"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 h-10 line-clamp-2">
                    {fee.description || "Aucune description"}
                  </p>
                </div>

                <div className="flex flex-col mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-gray-900">
                      {fee.type === "percentage"
                        ? `${fee.value}%`
                        : `${fee.value.toLocaleString()} XOF`}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {fee.type === "percentage" ? "du montant" : "fixe"}
                    </span>
                    {fee.isRecurring && (
                      <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full ml-2">
                        / {fee.recurringInterval === "day" ? "jour" : "semaine"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {(fee.minAmount || fee.maxAmount) && (
                    <>
                      {fee.minAmount && (
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          Min: {fee.minAmount.toLocaleString()}
                        </span>
                      )}
                      {fee.maxAmount && (
                        <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                          Max: {fee.maxAmount.toLocaleString()}
                        </span>
                      )}
                    </>
                  )}
                </div>

                {fee.gracePeriodHours && (
                  <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
                    <span className="flex items-center gap-1 text-amber-600 font-medium">
                      <Clock className="w-3 h-3" />
                      Appliqué après {fee.gracePeriodHours}h
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">
                {editingFee ? "Modifier le Frais" : "Nouveau Frais"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ex: Assurance Tous Risques"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cible
                  </label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, target: "client" })
                      }
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${formData.target === "client" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Client
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, target: "forwarder" })
                      }
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${formData.target === "forwarder" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Transitaire
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                  >
                    <option value="management">Gestion</option>
                    <option value="insurance">Assurance</option>
                    <option value="guarantee">Garantie</option>
                    <option value="storage">Magasinage</option>
                    <option value="penalty">Pénalité</option>
                    <option value="tax">Taxe / Impôt</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de Valeur
                  </label>
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "percentage" })
                      }
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${formData.type === "percentage" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: "fixed" })
                      }
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${formData.type === "fixed" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Fixe
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valeur
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step={formData.type === "percentage" ? "0.01" : "100"}
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          value: Number(e.target.value),
                        })
                      }
                      className="w-full pl-4 pr-10 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {formData.type === "percentage" ? (
                        <Percent className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">XOF</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Min (Optionnel)
                  </label>
                  <input
                    type="number"
                    value={formData.minAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Max (Optionnel)
                  </label>
                  <input
                    type="number"
                    value={formData.maxAmount || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none"
                    placeholder="∞"
                  />
                </div>
              </div>

              {/* Advanced Options for Storage/Penalty */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Frais Récurrent
                  </label>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input
                      type="checkbox"
                      name="isRecurring"
                      id="isRecurring"
                      checked={formData.isRecurring}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRecurring: e.target.checked,
                        })
                      }
                      className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5"
                    />
                    <label
                      htmlFor="isRecurring"
                      className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${formData.isRecurring ? "bg-primary" : "bg-gray-300"}`}
                    ></label>
                  </div>
                </div>

                {(formData.isRecurring || formData.category === "penalty") && (
                  <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {formData.category === "penalty"
                          ? "Délai avant (heures)"
                          : "Période de grâce (heures)"}
                      </label>
                      <input
                        type="number"
                        value={formData.gracePeriodHours || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gracePeriodHours: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none"
                        placeholder={
                          formData.category === "penalty" ? "Ex: 24" : "Ex: 72"
                        }
                      />
                    </div>
                    {formData.isRecurring && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Intervalle
                        </label>
                        <select
                          value={formData.recurringInterval}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              recurringInterval: e.target.value as any,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-primary outline-none bg-white"
                        >
                          <option value="day">Par Jour</option>
                          <option value="week">Par Semaine</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none h-20"
                  placeholder="Description du frais..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Actif
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
