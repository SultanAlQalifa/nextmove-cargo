import { useState, useEffect } from "react";
import { X, Search, Check, User } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";

interface AssignForwarderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (forwarderId: string) => Promise<void>;
    consolidationTitle?: string;
}

interface Forwarder {
    id: string;
    company_name: string;
    email: string;
    avatar_url?: string;
}

export default function AssignForwarderModal({
    isOpen,
    onClose,
    onAssign,
    consolidationTitle,
}: AssignForwarderModalProps) {
    const [forwarders, setForwarders] = useState<Forwarder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { error } = useToast();

    useEffect(() => {
        if (isOpen) {
            loadForwarders();
            setSelectedId(null);
        }
    }, [isOpen]);

    const loadForwarders = async () => {
        setLoading(true);
        try {
            const { data, error: err } = await supabase
                .from("profiles")
                .select("id, company_name, email, avatar_url")
                .eq("role", "forwarder")
                .order("company_name");

            if (err) throw err;
            setForwarders(data || []);
        } catch (err) {
            console.error("Error loading forwarders:", err);
            // Optional: show error toast
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        try {
            await onAssign(selectedId);
            onClose();
        } catch (err) {
            // handled by parent usually, but we can catch here too
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredForwarders = forwarders.filter(
        (f) =>
            f.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" onClick={onClose}>
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span
                    className="hidden sm:inline-block sm:align-middle sm:h-screen"
                    aria-hidden="true"
                >
                    &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Assigner un Prestataire
                            </h3>
                            <button
                                onClick={onClose}
                                title="Fermer"
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            Sélectionnez le prestataire à assigner pour :{" "}
                            <span className="font-semibold text-gray-700">
                                {consolidationTitle || "ce groupage"}
                            </span>
                        </p>

                        {/* Search */}
                        <div className="relative mb-4">
                            <button
                                type="button"
                                title="Rechercher"
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                            >
                                <Search className="h-4 w-4 text-gray-400" />
                            </button>
                            <input
                                type="text"
                                placeholder="Rechercher un prestataire..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* List */}
                        <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                            {loading ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    Chargement...
                                </div>
                            ) : filteredForwarders.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500">
                                    Aucun prestataire trouvé.
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {filteredForwarders.map((f) => (
                                        <li
                                            key={f.id}
                                            className={`
                        p-3 cursor-pointer transition-colors flex items-center justify-between
                        ${selectedId === f.id ? "bg-blue-50" : "hover:bg-gray-50"}
                      `}
                                            onClick={() => setSelectedId(f.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {f.avatar_url ? (
                                                        <img src={f.avatar_url} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <User className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {f.company_name || "Sans Nom"}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{f.email}</div>
                                                </div>
                                            </div>
                                            {selectedId === f.id && (
                                                <Check className="h-5 w-5 text-blue-600" />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={handleAssign}
                            disabled={submitting || !selectedId}
                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm
                ${submitting || !selectedId ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
              `}
                        >
                            {submitting ? "Assignation..." : "Assigner"}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={submitting}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
