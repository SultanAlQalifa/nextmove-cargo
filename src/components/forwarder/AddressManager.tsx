import { useState, useEffect } from "react";
import { Plus, MapPin, Edit2, Trash2, Globe, Phone, User, Info, Building2, Package, Truck, ArrowRight } from "lucide-react";
import { addressService, ForwarderAddress } from "../../services/addressService";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

export default function AddressManager() {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [addresses, setAddresses] = useState<ForwarderAddress[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<ForwarderAddress | null>(null);

    const [formData, setFormData] = useState<Partial<ForwarderAddress>>({
        type: "collection",
        country: "",
        city: "",
        name: "",
        address_line1: "",
        contact_name: "",
        contact_phone: "",
        instructions: "",
        is_default: false
    });

    useEffect(() => {
        if (user) {
            loadAddresses();
        }
    }, [user]);

    const loadAddresses = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await addressService.getAddresses(user.id);
            setAddresses(data);
        } catch (err) {
            console.error(err);
            toastError("Impossible de charger vos adresses");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAddress) {
                await addressService.updateAddress(editingAddress.id, formData);
                success("Adresse mise à jour !");
            } else {
                await addressService.createAddress(formData);
                success("Nouvelle adresse ajoutée !");
            }
            setIsModalOpen(false);
            setEditingAddress(null);
            setFormData({ type: "collection", is_default: false }); // Reset basic
            loadAddresses();
        } catch (err) {
            toastError("Erreur lors de la sauvegarde");
        }
    };

    const openEdit = (addr: ForwarderAddress) => {
        setEditingAddress(addr);
        setFormData(addr);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette adresse ?")) return;
        try {
            await addressService.deleteAddress(id);
            success("Adresse supprimée");
            loadAddresses();
        } catch (err) {
            toastError("Erreur lors de la suppression");
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'collection': return { label: 'Point de Dépôt / Collecte', color: 'bg-blue-100 text-blue-700', icon: Package };
            case 'reception': return { label: 'Point de Retrait / Livraison', color: 'bg-green-100 text-green-700', icon: Truck };
            default: return { label: 'Bureau / Siège', color: 'bg-gray-100 text-gray-700', icon: Building2 };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Vos Entrepôts & Adresses</h2>
                    <p className="text-gray-500">Gérez les lieux de dépôt et de retrait pour vos clients.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingAddress(null);
                        setFormData({ type: "collection", is_default: false, country: "", city: "", name: "", address_line1: "" });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Ajouter une adresse
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Chargement...</div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Aucune adresse configurée</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">Ajoutez vos entrepôts en Chine, Turquie, ou vos points de retrait locaux pour guider vos clients.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {addresses.map((addr) => {
                        const typeStyle = getTypeLabel(addr.type);
                        const TypeIcon = typeStyle.icon;
                        return (
                            <div key={addr.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${typeStyle.color}`}>
                                        <TypeIcon className="w-3.5 h-3.5" />
                                        {typeStyle.label}
                                    </span>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(addr)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg"
                                            aria-label="Modifier l'adresse"
                                            title="Modifier"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(addr.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            aria-label="Supprimer l'adresse"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                    {addr.country} <span className="text-gray-300">/</span> {addr.city}
                                </h3>
                                <p className="text-sm font-medium text-gray-600 mb-4">{addr.name}</p>

                                <div className="space-y-3 text-sm text-gray-600 border-t border-gray-100 pt-4">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                                        <p>{addr.address_line1} {addr.address_line2 && <span className="block text-gray-500">{addr.address_line2}</span>}</p>
                                    </div>
                                    {(addr.contact_name || addr.contact_phone) && (
                                        <div className="flex items-center gap-3">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <p>{addr.contact_name} <span className="text-gray-300 mx-2">|</span> {addr.contact_phone}</p>
                                        </div>
                                    )}
                                    {addr.instructions && (
                                        <div className="flex items-start gap-3 bg-blue-50 p-3 rounded-lg text-blue-800 text-xs">
                                            <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                            <p>{addr.instructions}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingAddress ? "Modifier l'adresse" : "Ajouter une adresse"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><Edit2 className="w-5 h-5 text-gray-500 hidden" /><span className="text-2xl text-gray-400">&times;</span></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'adresse</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'collection' })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type === 'collection' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <Package className={`w-6 h-6 mb-2 ${formData.type === 'collection' ? 'text-primary' : 'text-gray-400'}`} />
                                        <div className="font-semibold text-gray-900">Dépôt / Origine</div>
                                        <div className="text-xs text-gray-500 mt-1">Où le fournisseur dépose la marchandise (ex: Chine)</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'reception' })}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${formData.type === 'reception' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-gray-100 hover:border-gray-200'}`}
                                    >
                                        <Truck className={`w-6 h-6 mb-2 ${formData.type === 'reception' ? 'text-green-600' : 'text-gray-400'}`} />
                                        <div className="font-semibold text-gray-900">Retrait / Destination</div>
                                        <div className="text-xs text-gray-500 mt-1">Où le client récupère son colis (ex: Sénégal)</div>
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pays</label>
                                    <input required type="text" placeholder="Chine" className="w-full px-4 py-2 border rounded-xl" value={formData.country || ''} onChange={e => setFormData({ ...formData, country: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                                    <input required type="text" placeholder="Guangzhou" className="w-full px-4 py-2 border rounded-xl" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du lieu</label>
                                <input required type="text" placeholder="Ex: Entrepôt Baiyun District" className="w-full px-4 py-2 border rounded-xl" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse complète</label>
                                <textarea required rows={3} placeholder="Rue, Bâtiment, Etage..." className="w-full px-4 py-2 border rounded-xl" value={formData.address_line1 || ''} onChange={e => setFormData({ ...formData, address_line1: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact (Nom)</label>
                                    <input type="text" placeholder="Mr. Woo" className="w-full px-4 py-2 border rounded-xl" value={formData.contact_name || ''} onChange={e => setFormData({ ...formData, contact_name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                                    <input type="text" placeholder="+86 123..." className="w-full px-4 py-2 border rounded-xl" value={formData.contact_phone || ''} onChange={e => setFormData({ ...formData, contact_phone: e.target.value })} />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Instructions spéciales</label>
                                <textarea rows={2} placeholder="Horaires, code porte..." className="w-full px-4 py-2 border rounded-xl" value={formData.instructions || ''} onChange={e => setFormData({ ...formData, instructions: e.target.value })} />
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors">
                                    {editingAddress ? "Enregistrer les modifications" : "Ajouter cette adresse"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
