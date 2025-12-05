import { useState, useEffect } from 'react';
import { X, User, Mail, Shield } from 'lucide-react';
import { personnelService, Role } from '../../services/personnelService';
import { useToast } from '../../contexts/ToastContext';

interface CreateUserModalProps {
    user?: {
        id: string;
        name: string;
        email: string;
        role: string;
    } | null;
    onClose: () => void;
    onSuccess: () => void;
}

export default function CreateUserModal({ user, onClose, onSuccess }: CreateUserModalProps) {
    const { success } = useToast();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        role: 'client'
    });
    const [loading, setLoading] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);

    useEffect(() => {
        const loadRoles = async () => {
            try {
                const fetchedRoles = await personnelService.getRoles();
                setRoles(fetchedRoles);
            } catch (error) {
                console.error('Error loading roles:', error);
            }
        };
        loadRoles();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.name,
                email: user.email,
                role: user.role.toLowerCase()
            });
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            success(user ? 'Utilisateur modifié avec succès !' : 'Invitation envoyée avec succès ! L\'utilisateur recevra un email pour définir son mot de passe.');
            onSuccess();
            onClose();
        }, 1000);
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {user ? 'Modifier l\'utilisateur' : 'Inviter un utilisateur'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                required
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
                            >
                                <option value="client">Client</option>
                                <option value="forwarder">Transitaire</option>
                                <optgroup label="Personnel Interne">
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? 'Traitement...' : (user ? 'Enregistrer les modifications' : 'Envoyer l\'invitation')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
