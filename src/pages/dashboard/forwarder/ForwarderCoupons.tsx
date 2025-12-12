import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import { Plus, Search, Tag, Trash2, CheckCircle, XCircle } from "lucide-react";
import { couponService, Coupon } from "../../../services/couponService";
import { useToast } from "../../../contexts/ToastContext";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function ForwarderCoupons() {
  const { error: toastError } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    usage_limit: "",
    end_date: "",
  });

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await couponService.getForwarderCoupons();
      setCoupons(data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      usage_limit: "",
      end_date: "",
    });
    setEditingCoupon(null);
  };

  const handleOpenModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setFormData({
        code: coupon.code,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value.toString(),
        usage_limit: coupon.usage_limit ? coupon.usage_limit.toString() : "",
        end_date: coupon.end_date
          ? new Date(coupon.end_date).toISOString().split("T")[0]
          : "",
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type as any,
        discount_value: parseFloat(formData.discount_value),
        usage_limit: formData.usage_limit
          ? parseInt(formData.usage_limit)
          : null,
        end_date: formData.end_date || null,
        is_active: true,
        scope: "forwarder" as const,
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, payload);
      } else {
        await couponService.createCoupon({
          ...payload,
          usage_count: 0,
        });
      }

      setShowModal(false);
      fetchCoupons();
      resetForm();
    } catch (error) {
      console.error("Error saving coupon:", error);
      toastError("Erreur lors de l'enregistrement du coupon");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await couponService.updateCoupon(id, { is_active: !currentStatus });
      fetchCoupons();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmation({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!confirmation.id) return;
    try {
      await couponService.deleteCoupon(confirmation.id);
      fetchCoupons();
    } catch (error) {
      console.error("Error deleting coupon:", error);
    } finally {
      setConfirmation({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Coupons"
        subtitle="Créez et gérez vos codes de réduction"
        action={{
          label: "Nouveau Coupon",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Réduction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Utilisations
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Tag className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {coupon.code}
                          </p>
                          <p className="text-xs text-gray-500">
                            {coupon.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `${coupon.discount_value} XOF`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {coupon.usage_count} / {coupon.usage_limit || "∞"}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          toggleStatus(coupon.id, coupon.is_active)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${coupon.is_active
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-600 border-gray-200"
                          }`}
                      >
                        {coupon.is_active ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(coupon)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="Modifier"
                        >
                          <Tag className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                          <Tag className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>Aucun coupon trouvé</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {editingCoupon ? "Modifier le Coupon" : "Créer un Coupon"}
            </h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none uppercase"
                  placeholder="SUMMER2025"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Réduction d'été"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                    aria-label="Type de réduction"
                    title="Type de réduction"
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed_amount">Montant Fixe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valeur
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="10"
                    aria-label="Valeur de la réduction"
                    title="Valeur de la réduction"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite d'usage
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Illimité"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiration
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                    aria-label="Date d'expiration"
                    title="Date d'expiration"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-colors"
                >
                  {editingCoupon ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Supprimer le coupon"
        message="Êtes-vous sûr de vouloir supprimer ce coupon ? Cette action est irréversible."
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
