
import { useState, useEffect } from "react";
import { X, MessageSquare, Tag, AlertCircle, User, Search, Loader2 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { supportService } from "../../services/supportService";
import { profileService, UserProfile } from "../../services/profileService";

interface CreateTicketModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateTicketModal({
    onClose,
    onSuccess,
}: CreateTicketModalProps) {
    const { success, error: toastError } = useToast();
    const [mode, setMode] = useState<"internal" | "client">("internal");
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [userQuery, setUserQuery] = useState("");
    const [userResults, setUserResults] = useState<UserProfile[]>([]);
    const [searching, setSearching] = useState(false);

    const [formData, setFormData] = useState({
        subject: "",
        category: "general",
        priority: "medium",
        message: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const searchTimer = setTimeout(async () => {
            if (userQuery.length >= 2) {
                setSearching(true);
                try {
                    const results = await profileService.searchProfiles(userQuery);
                    setUserResults(results);
                } catch (err) {
                    console.error(err);
                } finally {
                    setSearching(false);
                }
            } else {
                setUserResults([]);
            }
        }, 400);
        return () => clearTimeout(searchTimer);
    }, [userQuery]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'client' && !selectedUser) {
            toastError("Veuillez sélectionner un utilisateur");
            return;
        }

        setLoading(true);

        try {
            await supportService.createTicket({
                subject: formData.subject,
                category: formData.category as any,
                priority: formData.priority as any,
                messages: [{ content: formData.message } as any],
            }, mode === 'client' ? selectedUser?.id : undefined);
            success("Ticket créé avec succès !");
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toastError("Erreur lors de la création du ticket");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        Nouveau Ticket
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Fermer"
                        aria-label="Fermer"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>


                {/* Context Switcher */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6 mx-6">
                    <button
                        type="button"
                        onClick={() => setMode("internal")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === "internal"
                            ? "bg-white text-gray-900 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <AlertCircle className="w-4 h-4" />
                        Problème Interne
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("client")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === "client"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        <User className="w-4 h-4" />
                        Pour un Client
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 pt-0">

                    {/* User Selection for Client Mode */}
                    {mode === 'client' && (
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rechercher un utilisateur
                            </label>
                            {selectedUser ? (
                                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{selectedUser.full_name}</p>
                                            <p className="text-xs text-blue-700">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedUser(null); setUserQuery(""); }}
                                        className="p-1 hover:bg-blue-100 rounded-full text-blue-600"
                                        aria-label="Désélectionner l'utilisateur"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={userQuery}
                                        onChange={(e) => setUserQuery(e.target.value)}
                                        placeholder="Nom, email ou téléphone..."
                                        className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                        autoFocus
                                    />
                                    {searching && (
                                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                                    )}

                                    {/* Dropdown Results */}
                                    {userResults.length > 0 && !selectedUser && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-48 overflow-y-auto z-10 divide-y divide-gray-50">
                                            {userResults.map(user => (
                                                <button
                                                    key={user.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setUserResults([]);
                                                    }}
                                                    className="w-full text-left p-3 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                                                        <div className="flex gap-2">
                                                            <span className="text-xs text-gray-500">{user.email}</span>
                                                            <span className="text-[10px] uppercase bg-gray-100 px-1 rounded text-gray-600 font-bold self-center">{user.role}</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={`transition-opacity duration-200 ${mode === 'client' && !selectedUser ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div>          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sujet
                            </label>
                            <div className="relative">
                                <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={formData.subject}
                                    onChange={(e) =>
                                        setFormData({ ...formData, subject: e.target.value })
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    placeholder="Ex: Problème de connexion"
                                />
                            </div>
                        </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Catégorie
                                    </label>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select
                                            value={formData.category}
                                            onChange={(e) =>
                                                setFormData({ ...formData, category: e.target.value })
                                            }
                                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white text-sm"
                                            aria-label="Sélectionner une catégorie"
                                        >
                                            <option value="general">Général</option>
                                            <option value="technical">Technique</option>
                                            <option value="billing">Facturation</option>
                                            <option value="shipping">Expédition</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Priorité
                                    </label>
                                    <div className="relative">
                                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <select
                                            value={formData.priority}
                                            onChange={(e) =>
                                                setFormData({ ...formData, priority: e.target.value })
                                            }
                                            className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white text-sm"
                                            aria-label="Sélectionner une priorité"
                                        >
                                            <option value="low">Basse</option>
                                            <option value="medium">Moyenne</option>
                                            <option value="high">Haute</option>
                                            <option value="urgent">Urgente</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Message
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) =>
                                        setFormData({ ...formData, message: e.target.value })
                                    }
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                                    placeholder="Décrivez votre problème en détail..."
                                />
                            </div>

                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? "Création..." : mode === 'client' ? "Créer pour le Client" : "Créer Ticket Interne"}
                            </button>
                        </div>
                    </div>
                </form>            </div>
        </div>
    );
}
