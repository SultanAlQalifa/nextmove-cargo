import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Zap, MessageSquare, FileCheck, Truck, Lock, Settings } from "lucide-react"; // Removed AlertCircle
import { supabase } from "../../../lib/supabase";
import { profileService } from "../../../services/profileService";
import type { AutomationSettings } from "../../../types/profile";

export default function ForwarderAutomations() {
    const { t: _t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<AutomationSettings>({
        auto_quote_enabled: true,
        smart_closure_enabled: true,
        delivery_feedback_enabled: true,
        admin_disabled: []
    });
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const profile = await profileService.getProfile(user.id);
            if (profile?.automation_settings) {
                setSettings(profile.automation_settings);
            }
        } catch (error) {
            console.error("Error loading automation settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (key: keyof AutomationSettings) => {
        if (!userId) return;
        if (settings.admin_disabled.includes(key)) return; // Security check

        const newSettings = { ...settings, [key]: !settings[key] };
        setSettings(newSettings); // Optimistic UI

        try {
            await profileService.updateAutomationSettings(userId, newSettings);
        } catch (error) {
            console.error("Error updating settings:", error);
            setSettings(settings); // Revert on error
        }
    };

    const isLocked = (key: string) => settings.admin_disabled.includes(key);

    const Toggle = ({ active, locked, onChange }: { active: boolean, locked: boolean, onChange: () => void }) => (
        <button
            onClick={onChange}
            disabled={locked}
            title={locked ? "Désactivé par l'administrateur" : (active ? "Désactiver" : "Activer")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${active ? "bg-green-500" : "bg-gray-200"
                } ${locked ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${active ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );

    const Badge = ({ active, locked }: { active: boolean, locked: boolean }) => {
        if (locked) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded-full uppercase">
                    <Lock className="w-3 h-3" /> Admin
                </span>
            );
        }
        return active ? (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full uppercase">
                Actif
            </span>
        ) : (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-full uppercase">
                Inactif
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500" />
                    Centre d'Automatisations
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Gérez vos règles automatiques pour gagner du temps.
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                /* Grid of Automation Rules */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Rule 1: Auto-Quote */}
                    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 border shadow-sm relative overflow-hidden group transition-all ${isLocked('auto_quote_enabled') ? 'border-red-100 bg-red-50/10' : 'border-gray-100 dark:border-gray-700'}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-24 h-24" />
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Devis Instantané
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.auto_quote_enabled} locked={isLocked('auto_quote_enabled')} />
                                        <Toggle
                                            active={settings.auto_quote_enabled}
                                            locked={isLocked('auto_quote_enabled')}
                                            onChange={() => handleToggle('auto_quote_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Répond automatiquement aux demandes RFQ qui correspondent à vos <strong>Tarifs Standards</strong> configurés en mode "Auto".
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 2: Offer Acceptance */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileCheck className="w-24 h-24" />
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <FileCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Clôture Intelligente
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.smart_closure_enabled} locked={isLocked('smart_closure_enabled')} />
                                        <Toggle
                                            active={settings.smart_closure_enabled}
                                            locked={isLocked('smart_closure_enabled')}
                                            onChange={() => handleToggle('smart_closure_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Dès qu'une offre est acceptée, la RFQ est fermée et les autres offres sont rejetées automatiquement.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 3: Delivery Feedback */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MessageSquare className="w-24 h-24" />
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                                <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Feedback Livraison
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.delivery_feedback_enabled} locked={isLocked('delivery_feedback_enabled')} />
                                        <Toggle
                                            active={settings.delivery_feedback_enabled}
                                            locked={isLocked('delivery_feedback_enabled')}
                                            onChange={() => handleToggle('delivery_feedback_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Demande automatiquement une note et un avis au client 24h après que le statut passe à <strong>"Livré"</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 4: Invoice Reminder */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FileCheck className="w-24 h-24" />
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <FileCheck className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Relance Factures
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.invoice_reminder_enabled || false} locked={isLocked('invoice_reminder_enabled')} />
                                        <Toggle
                                            active={settings.invoice_reminder_enabled || false}
                                            locked={isLocked('invoice_reminder_enabled')}
                                            onChange={() => handleToggle('invoice_reminder_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Envoie un rappel automatique aux clients pour toute facture impayée depuis plus de <strong>48 heures</strong>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 5: Weather Alerts */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="w-24 h-24" />
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Alertes Météo
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.weather_alert_enabled || false} locked={isLocked('weather_alert_enabled')} />
                                        <Toggle
                                            active={settings.weather_alert_enabled || false}
                                            locked={isLocked('weather_alert_enabled')}
                                            onChange={() => handleToggle('weather_alert_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Détecte les tempêtes sur les trajets maritimes/aériens et prévient le client d'un potentiel retard.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 6: Ticket Auto-Ack */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MessageSquare className="w-24 h-24" />
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                                <MessageSquare className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Réponse Auto (Support)
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.ticket_auto_ack_enabled || false} locked={isLocked('ticket_auto_ack_enabled')} />
                                        <Toggle
                                            active={settings.ticket_auto_ack_enabled || false}
                                            locked={isLocked('ticket_auto_ack_enabled')}
                                            onChange={() => handleToggle('ticket_auto_ack_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Envoie immédiatement un accusé de réception rassurant lorsqu'un client ouvre un ticket de support.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 7: Shipment Updates */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Truck className="w-24 h-24" />
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                                <Truck className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Notification par Email
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.shipment_update_enabled || false} locked={isLocked('shipment_update_enabled')} />
                                        <Toggle
                                            active={settings.shipment_update_enabled || false}
                                            locked={isLocked('shipment_update_enabled')}
                                            onChange={() => handleToggle('shipment_update_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Notifie automatiquement le client par email à chaque changement de statut de ses expéditions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 8: WhatsApp Notifications */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <MessageSquare className="w-24 h-24" />
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                                        Notification WhatsApp
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <Badge active={settings.whatsapp_enabled !== false} locked={isLocked('whatsapp_enabled')} />
                                        <Toggle
                                            active={settings.whatsapp_enabled !== false}
                                            locked={isLocked('whatsapp_enabled')}
                                            onChange={() => handleToggle('whatsapp_enabled')}
                                        />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Envoie une copie des messages et des suivis critiques directement sur WhatsApp.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Rules */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                            <Settings className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="font-bold text-gray-500 dark:text-gray-400">
                            Bientôt disponible
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                            Analyses prédictives IA, Optimisation de tournée...
                        </p>
                    </div>

                </div>
            )}
        </div>
    );
}
