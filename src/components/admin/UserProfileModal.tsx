import { useState } from 'react';
import { storageService } from '../../services/storageService';
import { useToast } from '../../contexts/ToastContext';
import { X, User, Mail, Shield, Calendar, Activity, Phone, MapPin, Building, Camera, Loader } from 'lucide-react';

interface UserProfileModalProps {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        status: string;
        joined_at: string;
        phone?: string;
        company?: string;
        location?: string;
        friendly_id?: string;
    };
    onClose: () => void;
    onEdit: () => void;
    onToggleStatus?: () => void;
}

export default function UserProfileModal({ user, onClose, onEdit, onToggleStatus }: UserProfileModalProps) {
    const { error: toastError } = useToast();
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

    if (!user) return null;

    const handleFileUpload = async (file: File) => {
        if (!user) return;
        setUploading(true);
        try {
            const publicUrl = await storageService.uploadAvatar(user.id, file);
            setAvatarUrl(publicUrl);
            // In a real app, we would also update the user profile in the database here
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toastError('Erreur lors du téléchargement de la photo.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header with Cover */}
                <div className="relative h-32 bg-gradient-to-r from-primary to-blue-600">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Avatar */}
                    <div className="absolute -bottom-10 left-8 group">
                        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg relative overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            {/* Upload Overlay */}
                            <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                {uploading ? (
                                    <Loader className="w-6 h-6 text-white animate-spin" />
                                ) : (
                                    <Camera className="w-6 h-6 text-white" />
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-12 pb-8 px-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                            <p className="text-gray-500">{user.email}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium
                            ${user.status === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                        `}>
                            {user.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Shield className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Rôle</p>
                                    <p className="font-medium capitalize">{user.role}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Calendar className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Membre depuis</p>
                                    <p className="font-medium">{new Date(user.joined_at).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Activity className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">ID Utilisateur</p>
                                    <p className="font-medium font-mono text-sm" title={user.id}>
                                        {(user as any).friendly_id || user.id.substring(0, 8) + '...'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Building className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Entreprise</p>
                                    <p className="font-medium">{user.company || 'Non renseigné'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Phone className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Téléphone</p>
                                    <p className="font-medium">{user.phone || 'Non renseigné'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-gray-600">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <MapPin className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Localisation</p>
                                    <p className="font-medium">{user.location || 'Non renseigné'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors font-medium"
                        >
                            Fermer
                        </button>
                        <button
                            onClick={onEdit}
                            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
                        >
                            Modifier le profil
                        </button>
                        {onToggleStatus && (
                            <button
                                onClick={onToggleStatus}
                                className={`px-4 py-2 rounded-xl transition-colors font-medium border ${user.status === 'Actif'
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-green-200 text-green-600 hover:bg-green-50'
                                    }`}
                            >
                                {user.status === 'Actif' ? 'Bloquer / Suspendre' : 'Activer le compte'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
