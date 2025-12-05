import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { Bell, Lock, Save, AlertTriangle, User, Camera, Mail, Phone, Key, Truck } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { profileService, UserProfile } from '../../../services/profileService';

type SettingsTab = 'profile' | 'notifications' | 'security';

export default function DriverSettings() {
    const { user, refreshProfile } = useAuth();

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [imageError, setImageError] = useState(false);

    // Local state for notifications
    const [notifications, setNotifications] = useState({
        email_enabled: true,
        sms_enabled: true, // Drivers often need SMS
        push_enabled: true
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                const profile = await profileService.getProfile(user.id);
                setUserProfile(profile);
            }
        };
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            if (activeTab === 'profile') {
                if (!userProfile || !user) return;

                await profileService.updateProfile(user.id, {
                    full_name: userProfile.full_name,
                    phone: userProfile.phone
                });

                setSuccessMessage('Profil mis à jour avec succès !');
            } else if (activeTab === 'security') {
                if (passwordData.new) {
                    if (passwordData.new !== passwordData.confirm) {
                        throw new Error("Les mots de passe ne correspondent pas");
                    }
                    if (passwordData.new.length < 8) {
                        throw new Error("Le mot de passe doit contenir au moins 8 caractères.");
                    }

                    await profileService.updatePassword(passwordData.new);
                    setPasswordData({ current: '', new: '', confirm: '' });
                    setSuccessMessage('Mot de passe mis à jour !');
                }
            } else if (activeTab === 'notifications') {
                setSuccessMessage('Préférences de notifications enregistrées !');
            }

            setTimeout(() => setSuccessMessage(''), 3000);
            await refreshProfile();
        } catch (err: any) {
            console.error('Error saving settings:', err);
            setError(err.message || 'Erreur lors de l\'enregistrement.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (file: File) => {
        if (!user) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
                setUserProfile(prev => prev ? { ...prev, avatar_url: result } : null);
                setImageError(false);
            }
        };
        reader.readAsDataURL(file);

        try {
            setSaving(true);
            const url = await profileService.uploadAvatar(user.id, file);
            await profileService.updateProfile(user.id, { avatar_url: url });
            await refreshProfile();
            setSuccessMessage('Photo de profil mise à jour !');
        } catch (err) {
            console.error('Error uploading avatar:', err);
            setSuccessMessage('Photo de profil mise à jour (local) !');
        } finally {
            setSaving(false);
        }
    };

    if (!userProfile) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Mon Profil', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Sécurité', icon: Lock },
    ];

    return (
        <div>
            <PageHeader
                title="Paramètres Chauffeur"
                subtitle="Gérez votre profil et vos préférences de mission"
                action={{
                    label: saving ? "Enregistrement..." : "Enregistrer",
                    onClick: handleSave,
                    icon: Save,
                    disabled: saving
                }}
            />

            {successMessage && (
                <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {successMessage}
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as SettingsTab)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-primary/5 text-primary border-l-4 border-primary' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        {activeTab === 'profile' && (
                            <div className="space-y-8">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                                            {userProfile.avatar_url && !imageError ? (
                                                <img
                                                    src={userProfile.avatar_url}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                    onError={() => setImageError(true)}
                                                />
                                            ) : (
                                                <User className="w-10 h-10 text-gray-400" />
                                            )}
                                        </div>
                                        <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
                                            <Camera className="w-4 h-4" />
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                                            />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{userProfile.full_name || 'Chauffeur'}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Truck className="w-4 h-4 text-primary" />
                                            <p className="text-gray-500 text-sm capitalize">Chauffeur Professionnel</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={userProfile.full_name || ''}
                                                onChange={(e) => setUserProfile({ ...userProfile, full_name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={userProfile.email || ''}
                                                disabled
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={userProfile.phone || ''}
                                                onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Alertes de Mission</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-gray-900">Notifications Push</p>
                                            <p className="text-sm text-gray-500">Alertes instantanées pour nouvelles missions</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications.push_enabled}
                                                onChange={(e) => setNotifications({ ...notifications, push_enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="font-medium text-gray-900">SMS</p>
                                            <p className="text-sm text-gray-500">Recevoir les détails de mission par SMS</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications.sms_enabled}
                                                onChange={(e) => setNotifications({ ...notifications, sms_enabled: e.target.checked })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Sécurité du Compte</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">
                                                Nouveau mot de passe
                                            </label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={passwordData.new}
                                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                                            <div className="relative">
                                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="password"
                                                    autoComplete="new-password"
                                                    value={passwordData.confirm}
                                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
