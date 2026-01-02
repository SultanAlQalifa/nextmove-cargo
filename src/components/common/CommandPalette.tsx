import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Command,
    Truck,
    Settings,
    User,
    HelpCircle,
    LayoutDashboard,
    ArrowRight,
    Calculator,
    Package,
    Mail,
    FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';

interface CommandItem {
    id: string;
    title: string;
    description: string;
    category: string;
    icon: any;
    action: () => void;
    roles?: string[];
}

export default function CommandPalette() {
    const [search, setSearch] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const navigate = useNavigate();
    const { profile } = useAuth();
    const { openCalculator, isCommandPaletteOpen, closeCommandPalette, toggleCommandPalette } = useUI();

    const commands: CommandItem[] = [
        {
            id: 'dash',
            title: 'Tableau de Bord',
            description: 'Accéder à votre accueil personnalisé',
            category: 'Navigation',
            icon: LayoutDashboard,
            action: () => navigate(profile?.role === 'client' ? '/dashboard/client' : '/dashboard/admin')
        },
        {
            id: 'shipments',
            title: 'Mes Expéditions',
            description: 'Suivre vos colis en temps réel',
            category: 'Opérations',
            icon: Truck,
            action: () => navigate('/dashboard/client/shipments')
        },
        {
            id: 'rfq',
            title: 'Demander un Devis',
            description: 'Créer une nouvelle demande de cotation',
            category: 'Opérations',
            icon: FileText,
            action: () => navigate('/dashboard/client/rfq/create'),
            roles: ['client']
        },
        {
            id: 'calc',
            title: 'Calculateur Premium',
            description: 'Estimer vos frais de transport',
            category: 'Outils',
            icon: Calculator,
            action: () => openCalculator()
        },
        {
            id: 'leads',
            title: 'Gestion des Leads',
            description: 'Voir les prospects capturés par l\'IA',
            category: 'Administration',
            icon: Package,
            action: () => navigate('/dashboard/admin/leads'),
            roles: ['admin', 'super-admin']
        },
        {
            id: 'users',
            title: 'Gestion Utilisateurs',
            description: 'Gérer les comptes et accès',
            category: 'Administration',
            icon: User,
            action: () => navigate('/dashboard/admin/users'),
            roles: ['admin', 'super-admin']
        },
        {
            id: 'emails',
            title: 'Configuration Emails',
            description: 'Gérer les modèles et envois',
            category: 'Administration',
            icon: Mail,
            action: () => navigate('/dashboard/admin/emails'),
            roles: ['admin', 'super-admin']
        },
        {
            id: 'settings',
            title: 'Paramètres',
            description: 'Gérer votre profil et préférences',
            category: 'Système',
            icon: Settings,
            action: () => navigate(profile?.role === 'client' ? '/dashboard/client/settings' : '/dashboard/admin/settings')
        },
        {
            id: 'support',
            title: 'Centre d\'Aide',
            description: 'Contacter le support ou voir la FAQ',
            category: 'Système',
            icon: HelpCircle,
            action: () => navigate('/dashboard/client/support')
        }
    ];

    const filteredCommands = commands.filter(cmd => {
        const matchesSearch = cmd.title.toLowerCase().includes(search.toLowerCase()) ||
            cmd.category.toLowerCase().includes(search.toLowerCase());
        const matchesRole = !cmd.roles || cmd.roles.includes(profile?.role || '');
        return matchesSearch && matchesRole;
    });

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                toggleCommandPalette();
            }
            if (e.key === 'Escape') closeCommandPalette();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleCommandPalette, closeCommandPalette]);

    const handleAction = (cmd: CommandItem) => {
        cmd.action();
        closeCommandPalette();
        setSearch('');
    };

    return (
        <AnimatePresence>
            {isCommandPaletteOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md pointer-events-auto"
                        onClick={closeCommandPalette}
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: -20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: -20 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden pointer-events-auto shadow-primary/20"
                    >
                        {/* Search Input */}
                        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                            <Search className="w-5 h-5 text-primary" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Tapez un nom de page, une action ou cherchez un colis..."
                                className="bg-transparent border-none focus:ring-0 w-full text-lg font-bold text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setActiveIndex(0);
                                }}
                            />
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-sm">
                                <Command className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400">K</span>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
                            {filteredCommands.length > 0 ? (
                                <div className="space-y-6">
                                    {Array.from(new Set(filteredCommands.map(c => c.category))).map(category => (
                                        <div key={category}>
                                            <h4 className="px-4 mb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                                {category}
                                            </h4>
                                            <div className="space-y-1">
                                                {filteredCommands.filter(c => c.category === category).map((cmd, idx) => (
                                                    <button
                                                        key={cmd.id}
                                                        onClick={() => handleAction(cmd)}
                                                        onMouseEnter={() => setActiveIndex(idx)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${activeIndex === idx
                                                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                                                : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-4 text-left">
                                                            <div className={`p-2.5 rounded-xl ${activeIndex === idx ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/5'
                                                                }`}>
                                                                <cmd.icon className={`w-5 h-5 ${activeIndex === idx ? 'text-white' : 'text-primary'
                                                                    }`} />
                                                            </div>
                                                            <div>
                                                                <p className={`font-black text-sm ${activeIndex === idx ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
                                                                    {cmd.title}
                                                                </p>
                                                                <p className={`text-xs ${activeIndex === idx ? 'text-white/80' : 'text-slate-500 dark:text-slate-500'}`}>
                                                                    {cmd.description}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <ArrowRight className={`w-4 h-4 transition-transform ${activeIndex === idx ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'
                                                            }`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center">
                                    <Search className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold italic">"Oups, rien trouvé pour {search}"</p>
                                    <p className="text-slate-400 text-xs mt-1">Réessayez avec un autre mot-clé.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer Tips */}
                        <div className="px-6 py-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-bold shadow-sm">esc</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Quitter</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] font-bold shadow-sm">↵</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Sélectionner</span>
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-tighter">Premium UI 2026</p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
