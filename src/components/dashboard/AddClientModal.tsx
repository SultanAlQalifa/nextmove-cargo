import { useState, useEffect } from "react";
import { X, Search, User, UserPlus, Check, AlertCircle } from "lucide-react";
import { profileService, UserProfile } from "../../services/profileService";
import { connectionService } from "../../services/connectionService";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddClientModal({
  isOpen,
  onClose,
  onSuccess,
}: AddClientModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.searchProfiles(query);
      setResults(data);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la recherche.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async (clientId: string) => {
    setAddingId(clientId);
    try {
      // Import dynamically to avoid circular issues if any, or just import at top.
      // Using direct import since we'll change the import at top.
      const response = await connectionService.sendRequest(clientId);

      if (response.status === "already_connected") {
        // Ideally show toast
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Impossible d'envoyer la demande.");
    } finally {
      setAddingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                Ajouter un Client
              </h3>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="text-gray-400 hover:text-gray-500 p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-primary shadow-sm"
              />
            </div>

            {/* Results List */}
            <div className="space-y-2 max-h-60 overflow-y-auto min-h-[100px]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : results.length > 0 ? (
                results.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl border border-transparent hover:border-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-sm font-bold text-gray-900 line-clamp-1">
                          {user.full_name || "Utilisateur"}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddClient(user.id)}
                      disabled={addingId === user.id}
                      className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {addingId === user.id ? "Ajout..." : "Ajouter"}
                    </button>
                  </div>
                ))
              ) : query.length >= 2 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucun utilisateur trouvé.
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Tapez au moins 2 caractères pour rechercher.
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
