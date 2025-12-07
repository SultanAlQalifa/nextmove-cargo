// ═══════════════════════════════════════════════════════════════
// NextMove Cargo - Dashboard Layout with Sidebar
// Layout avec sidebar pour les dashboards
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { Link, Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useBranding } from '../../contexts/BrandingContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    FileText,
    Package,
    Truck,
    CreditCard,
    MessageCircle,
    Settings,
    LogOut,
    Menu,
    X,
    User,
    ChevronDown,
    Bell,
    Search,
    HelpCircle,
    Palette,
    Shield,
    Sliders,
    Tag,
    Calculator,
    ChevronLeft,
    ChevronRight,
    Home,
    Sun,
    Moon,
    Globe,
    Star,
    Mail
} from 'lucide-react';

import NotificationBell from '../common/NotificationBell';
import MobileCountrySelector from '../MobileCountrySelector';
import ChatWidget from '../common/ChatWidget';

interface NavItem {
    name: string;
    path: string;
    icon: any;
    badge?: number;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

import { useUI } from '../../contexts/UIContext';
import CalculatorModal from '../dashboard/CalculatorModal';

export default function DashboardLayout() {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const { settings } = useBranding();
    const { openCalculator } = useUI();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const isMessagesPage = location.pathname.includes('/messages');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Navigation items based on role
    const getNavSections = (): NavSection[] => {
        const role = profile?.role;

        if (role === 'client') {
            return [
                {
                    title: t('dashboard.menu.main'),
                    items: [
                        { name: t('dashboard.menu.dashboard'), path: '/dashboard/client', icon: LayoutDashboard },
                    ]
                },
                {
                    title: t('dashboard.menu.operations'),
                    items: [
                        { name: t('dashboard.menu.myRequests'), path: '/dashboard/client/rfq', icon: FileText, badge: 0 },
                        { name: t('dashboard.menu.groupage'), path: '/dashboard/client/groupage', icon: Package },
                        { name: t('dashboard.menu.myShipments'), path: '/dashboard/client/shipments', icon: Truck },
                        { name: t('dashboard.menu.documents'), path: '/dashboard/client/documents', icon: FileText },
                        { name: t('dashboard.menu.calculator'), path: '#calculator', icon: Calculator },
                    ]
                },
                {
                    title: t('dashboard.menu.finances'),
                    items: [
                        { name: t('dashboard.menu.payments'), path: '/dashboard/client/payments', icon: CreditCard },
                    ]
                },
                {
                    title: t('dashboard.menu.communication'),
                    items: [
                        { name: t('dashboard.menu.messages'), path: '/dashboard/client/messages', icon: MessageCircle, badge: 0 },
                    ]
                },
                {
                    title: t('dashboard.menu.support'),
                    items: [
                        { name: t('dashboard.menu.support'), path: '/dashboard/client/support', icon: HelpCircle },
                        { name: t('dashboard.menu.settings'), path: '/dashboard/client/settings', icon: Settings },
                        { name: t('dashboard.menu.becomePartner'), path: '/dashboard/upgrade', icon: Star },
                    ]
                }
            ];
        }

        if (role === 'forwarder') {
            return [
                {
                    title: t('dashboard.menu.main'),
                    items: [
                        { name: t('dashboard.menu.dashboard'), path: '/dashboard/forwarder', icon: LayoutDashboard },
                    ]
                },
                {
                    title: t('dashboard.menu.operations'),
                    items: [
                        { name: t('dashboard.menu.availableRfq'), path: '/dashboard/forwarder/rfq', icon: FileText },
                        { name: t('dashboard.menu.groupage'), path: '/dashboard/forwarder/groupage', icon: Package },
                        { name: t('dashboard.menu.myOffers'), path: '/dashboard/forwarder/offers', icon: FileText },
                        { name: t('dashboard.menu.shipments'), path: '/dashboard/forwarder/shipments', icon: Truck },
                        { name: t('dashboard.menu.documents'), path: '/dashboard/forwarder/documents', icon: FileText },
                        { name: t('dashboard.menu.pod'), path: '/dashboard/forwarder/pod', icon: FileText },
                    ]
                },
                {
                    title: t('dashboard.menu.management'),
                    items: [
                        { name: t('dashboard.menu.personnel'), path: '/dashboard/forwarder/personnel', icon: User },
                        { name: t('dashboard.menu.myClients'), path: '/dashboard/forwarder/clients', icon: User },
                        { name: 'Documents Légaux', path: '/dashboard/forwarder/kyc', icon: Shield },
                    ]
                },
                {
                    title: t('dashboard.menu.finances'),
                    items: [
                        { name: t('dashboard.menu.payments'), path: '/dashboard/forwarder/payments', icon: CreditCard },
                        { name: t('dashboard.menu.fundCalls'), path: '/dashboard/forwarder/fund-calls', icon: Bell },
                        { name: t('dashboard.menu.subscriptions'), path: '/dashboard/forwarder/subscription', icon: CreditCard },
                        { name: t('dashboard.menu.coupons'), path: '/dashboard/forwarder/coupons', icon: Tag },
                    ]
                },
                {
                    title: t('dashboard.menu.support'),
                    items: [
                        { name: t('dashboard.menu.messages'), path: '/dashboard/forwarder/messages', icon: MessageCircle },
                        { name: t('dashboard.menu.support'), path: '/dashboard/forwarder/support', icon: HelpCircle },
                        { name: t('dashboard.menu.settings'), path: '/dashboard/forwarder/settings', icon: Settings },
                    ]
                }
            ];
        }

        if (role === 'admin' || role === 'super-admin') {
            return [
                {
                    title: t('dashboard.menu.main'),
                    items: [
                        { name: t('dashboard.menu.dashboard'), path: '/dashboard/admin', icon: LayoutDashboard },
                    ]
                },
                {
                    title: t('dashboard.menu.operations'),
                    items: [
                        { name: t('dashboard.menu.rfqAndOffers'), path: '/dashboard/admin/rfq', icon: FileText },
                        { name: t('dashboard.menu.groupage'), path: '/dashboard/admin/groupage', icon: Package },
                        { name: t('dashboard.menu.shipments'), path: '/dashboard/admin/shipments', icon: Package },
                        { name: t('dashboard.menu.pod'), path: '/dashboard/admin/pod', icon: FileText },
                    ]
                },
                {
                    title: t('dashboard.menu.administration'),
                    items: [
                        { name: t('dashboard.menu.users'), path: '/dashboard/admin/users', icon: User },
                        { name: t('dashboard.menu.forwarders'), path: '/dashboard/admin/forwarders', icon: Truck },
                        { name: t('dashboard.menu.personnelAndRoles'), path: '/dashboard/admin/personnel', icon: User },
                        { name: 'Emails', path: '/dashboard/admin/emails', icon: Mail },
                    ]
                },
                {
                    title: t('dashboard.menu.finances'),
                    items: [
                        { name: t('dashboard.menu.payments'), path: '/dashboard/admin/payments', icon: CreditCard },
                        { name: t('dashboard.menu.fundCalls'), path: '/dashboard/admin/fund-calls', icon: Bell },
                        { name: t('dashboard.menu.subscriptions'), path: '/dashboard/admin/subscriptions', icon: CreditCard },
                        { name: t('dashboard.menu.coupons'), path: '/dashboard/admin/coupons', icon: Tag },
                        { name: t('dashboard.menu.feesAndServices'), path: '/dashboard/admin/fees', icon: Shield },
                        { name: "Tarifs Plateforme", path: '/dashboard/admin/platform-rates', icon: Calculator },
                    ]
                },
                {
                    title: t('dashboard.menu.configuration'),
                    items: [
                        { name: t('dashboard.menu.features'), path: '/dashboard/admin/features', icon: Sliders },
                        { name: t('dashboard.menu.paymentGateway'), path: '/dashboard/admin/payment-gateway', icon: Settings },
                        { name: t('dashboard.menu.branding'), path: '/dashboard/admin/branding', icon: Palette },
                        { name: t('dashboard.menu.settings'), path: '/dashboard/admin/settings', icon: Settings },
                    ]
                },
                {
                    title: t('dashboard.menu.referenceData'),
                    items: [
                        { name: t('dashboard.menu.destinations'), path: '/dashboard/admin/locations', icon: Globe },
                        { name: t('dashboard.menu.packageTypes'), path: '/dashboard/admin/package-types', icon: Package },
                    ]
                },
                {
                    title: t('dashboard.menu.support'),
                    items: [
                        { name: t('dashboard.menu.support'), path: '/dashboard/admin/support', icon: HelpCircle },
                        { name: t('dashboard.menu.messages'), path: '/dashboard/admin/messages', icon: MessageCircle },
                    ]
                }
            ];
        }

        if (role === 'driver') {
            return [
                {
                    title: t('dashboard.menu.main'),
                    items: [
                        { name: t('dashboard.menu.dashboard'), path: '/dashboard/driver', icon: LayoutDashboard },
                    ]
                },
                {
                    title: t('dashboard.menu.operations'),
                    items: [
                        { name: t('dashboard.menu.deliveries'), path: '/dashboard/driver', icon: Truck },
                        { name: t('dashboard.menu.podHistory'), path: '/dashboard/driver/pod', icon: FileText },
                    ]
                },
                {
                    title: t('dashboard.menu.finances'),
                    items: [
                        { name: t('dashboard.menu.myPayments'), path: '/dashboard/driver/payments', icon: CreditCard },
                    ]
                },
                {
                    title: t('dashboard.menu.support'),
                    items: [
                        { name: t('dashboard.menu.messages'), path: '/dashboard/driver/messages', icon: MessageCircle },
                        { name: t('dashboard.menu.support'), path: '/dashboard/driver/support', icon: HelpCircle },
                        { name: t('dashboard.menu.settings'), path: '/dashboard/driver/settings', icon: Settings },
                    ]
                }
            ];
        }

        return [];
    };

    const navSections = getNavSections();

    const handleLogout = async () => {
        const { supabase } = await import('../../lib/supabase');
        await supabase.auth.signOut();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '#calculator') return false;
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 flex transition-colors duration-300">
            <CalculatorModal />
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 shadow-xl lg:shadow-none transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isCollapsed ? 'w-20' : 'w-72'}
                flex flex-col flex-shrink-0
            `}>
                {/* Logo Area */}
                <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-8'} border-b border-gray-50 dark:border-gray-700 transition-all duration-300 relative`}>
                    <Link to="/" className="flex items-center gap-3 group overflow-hidden">
                        {settings?.logo_url ? (
                            <div className="flex items-center text-2xl font-bold tracking-tight">
                                <span className="text-primary">N</span>
                                {!isCollapsed && (
                                    <span className="flex items-center animate-in fade-in duration-300">
                                        <span className="text-primary">extMove</span>
                                        <span className="text-secondary ml-1">Cargo</span>
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                                <Package className="w-8 h-8 text-primary" />
                            </div>
                        )}
                    </Link>

                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 absolute right-4"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center text-gray-400 hover:text-primary hover:border-primary shadow-sm transition-all z-50"
                    >
                        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-8 space-y-6 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    {navSections.map((section, index) => (
                        <div key={index}>
                            {!isCollapsed && (
                                <div className="px-4 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider animate-in fade-in duration-300 whitespace-nowrap">
                                    {section.title}
                                </div>
                            )}
                            {isCollapsed && index > 0 && <div className="h-px bg-gray-100 dark:bg-gray-700 my-4 mx-2" />}

                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = isActive(item.path);
                                    const isCalculator = item.path === '#calculator';

                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            onClick={(e) => {
                                                setSidebarOpen(false);
                                                if (isCalculator) {
                                                    e.preventDefault();
                                                    openCalculator();
                                                }
                                            }}
                                            className={`
                                                group flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} py-3 rounded-xl transition-all duration-200 relative
                                                ${active
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary dark:hover:text-primary'
                                                }
                                            `}
                                            title={isCollapsed ? item.name : ''}
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <Icon className={`w-5 h-5 min-w-[1.25rem] ${active ? 'text-white' : 'text-gray-400 group-hover:text-primary transition-colors'}`} />
                                                {!isCollapsed && (
                                                    <span className="font-medium text-sm whitespace-nowrap animate-in fade-in duration-200">{item.name}</span>
                                                )}
                                            </div>
                                            {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
                                                <span className={`
                                                    px-2 py-0.5 text-xs font-bold rounded-full
                                                    ${active ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}
                                                `}>
                                                    {item.badge}
                                                </span>
                                            )}
                                            {isCollapsed && item.badge !== undefined && item.badge > 0 && (
                                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-gray-50 dark:border-gray-700">
                    <button
                        onClick={handleLogout}
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 w-full text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200 group`}
                        title={isCollapsed ? t('signOut') : ""}
                    >
                        <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                        {!isCollapsed && <span className="font-medium text-sm whitespace-nowrap">{t('signOut')}</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Top Navbar - Ultra-Premium Floating Glass Design (v4) */}
                <div className="px-6 pt-4 pb-2 animate-in slide-in-from-top-4 duration-700 fade-in z-40">
                    <header className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-2xl border border-white/40 dark:border-gray-700/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl h-16 flex items-center justify-between px-6 transition-all duration-500 hover:bg-white/70 dark:hover:bg-gray-800/70 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-white/60 group/navbar relative pointer-events-auto">

                        {/* Subtle Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40 dark:from-white/5 dark:to-white/5 pointer-events-none" />

                        <div className="flex items-center gap-6 flex-1 relative z-10">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2.5 text-gray-500 hover:bg-white/60 hover:text-primary rounded-2xl transition-all duration-300 hover:shadow-sm"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Breadcrumbs - Premium Pill Style */}
                            <div className="hidden md:flex items-center text-sm">
                                <Link to="/" className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-primary hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20 rounded-2xl transition-all duration-300 group/home">
                                    <Home className="w-5 h-5 group-hover/home:scale-110 transition-transform duration-300" />
                                </Link>
                                <div className="h-6 w-px bg-gradient-to-b from-transparent via-gray-300/50 dark:via-gray-600/50 to-transparent mx-4"></div>
                                <span className="font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors cursor-default text-xs uppercase tracking-widest">{t('dashboard.menu.dashboard')}</span>

                                {(() => {
                                    const pathSegments = location.pathname.split('/').filter(Boolean);
                                    const segmentsToShow = pathSegments.filter(s => s !== 'dashboard' && !['forwarder', 'client', 'admin', 'driver', 'super-admin'].includes(s));

                                    const translations: Record<string, string> = {
                                        'forwarder': 'Transitaire',
                                        'client': 'Client',
                                        'admin': 'Administrateur',
                                        'rfq': 'Demandes RFQ',
                                        'shipments': 'Expéditions',
                                        'rates': 'Tarifs',
                                        'offers': 'Offres',
                                        'settings': 'Paramètres',
                                        'profile': 'Profil',
                                        'support': 'Support',
                                        'messages': 'Messages',
                                        'payments': 'Paiements',
                                        'groupage': 'Groupage',
                                        'users': 'Utilisateurs',
                                        'create': 'Création',
                                        'edit': 'Édition',
                                        'pod': 'Preuve de Livraison',
                                        'fund-calls': 'Appels de Fonds',
                                        'subscriptions': 'Abonnements',
                                        'coupons': 'Coupons',
                                        'fees': 'Frais & Services',
                                        'features': 'Fonctionnalités',
                                        'payment-gateway': 'Passerelle Paiement',
                                        'branding': 'Personnalisation',
                                        'forwarders': 'Transitaires',
                                        'personnel': 'Personnel',
                                        'driver': 'Chauffeur'
                                    };

                                    return segmentsToShow.map((segment, index) => (
                                        <div key={index} className="flex items-center animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                                            <ChevronRight className="w-3 h-3 mx-3 text-gray-300 dark:text-gray-600" />
                                            <span className="font-bold text-gray-800 dark:text-gray-200 bg-white/40 dark:bg-gray-700/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/50 dark:border-gray-600/50 shadow-sm text-xs uppercase tracking-wide ring-1 ring-gray-900/5 dark:ring-white/5">
                                                {translations[segment] || segment.replace(/-/g, ' ')}
                                            </span>
                                        </div>
                                    ));
                                })()}
                            </div>


                        </div>

                        <div className="flex items-center gap-4 sm:gap-6 relative z-10">
                            {/* Quick Action Button - Conditionally Rendered */}
                            {/* Quick Action Button - Removed as it was redundant */}
                            {/* The logic for getPageAction has been removed */}

                            <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300/50 dark:via-gray-600/50 to-transparent mx-2 hidden sm:block"></div>

                            <MobileCountrySelector />

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-2xl hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300 text-gray-500 dark:text-gray-400 hover:text-primary"
                            >
                                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>

                            {/* Notifications */}
                            <div className="hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 p-2 rounded-2xl transition-all duration-300 group/notif cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-600">
                                <NotificationBell />
                            </div>

                            {/* User Profile Dropdown - Premium Card */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-4 pl-2 pr-2 py-1.5 rounded-full hover:bg-white dark:hover:bg-gray-700 hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-black/20 transition-all duration-300 border border-transparent hover:border-gray-100 dark:hover:border-gray-600 group/profile"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover/profile:opacity-100 transition-opacity duration-500"></div>
                                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold shadow-md ring-4 ring-white dark:ring-gray-700 group-hover/profile:scale-105 transition-transform duration-300 overflow-hidden relative z-10">
                                            {profile?.avatar_url ? (
                                                <img
                                                    src={profile.avatar_url}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>{profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full z-20 shadow-sm"></div>
                                    </div>

                                    <div className="hidden text-right sm:block mr-1">
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-none mb-1 group-hover/profile:text-primary transition-colors">
                                            {profile?.full_name?.split(' ')[0] || 'Utilisateur'}
                                        </p>
                                        <div className="flex justify-end">
                                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md group-hover/profile:bg-primary/10 group-hover/profile:text-primary transition-colors">
                                                {profile?.role === 'forwarder' ? t('auth.roles.forwarder') : profile?.role === 'client' ? t('auth.roles.client') : profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'driver' ? t('auth.roles.driver') : profile?.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-full p-1.5 group-hover/profile:bg-primary/10 group-hover/profile:text-primary transition-colors shadow-sm">
                                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>

                                {/* Dropdown Menu - Glassmorphism */}
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-6 w-72 bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgb(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgb(0,0,0,0.4)] border border-white/60 dark:border-gray-700/60 py-3 z-40 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-300 ring-1 ring-black/5">
                                            <div className="px-6 py-5 border-b border-gray-100/50 dark:border-gray-700/50 sm:hidden">
                                                <p className="text-base font-bold text-gray-900 dark:text-white">
                                                    {profile?.full_name || 'Utilisateur'}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-1">
                                                    {profile?.role === 'forwarder' ? t('auth.roles.forwarder') : profile?.role === 'client' ? t('auth.roles.client') : profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'driver' ? t('auth.roles.driver') : profile?.role}
                                                </p>
                                            </div>
                                            <div className="p-3 space-y-1">
                                                <Link
                                                    to={(() => {
                                                        const role = profile?.role;
                                                        if (role === 'client') return '/dashboard/client/settings';
                                                        if (role === 'driver') return '/dashboard/driver/settings';
                                                        if (role === 'forwarder') return '/dashboard/forwarder/settings';
                                                        if (role === 'admin' || role === 'super-admin') return '/dashboard/admin/settings';
                                                        return '/dashboard'; // Fallback
                                                    })()}
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-4 px-4 py-3.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-md hover:shadow-gray-200/50 dark:hover:shadow-black/20 hover:text-primary rounded-2xl transition-all group/item"
                                                >
                                                    <div className="p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                                                        <Settings className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-gray-900 dark:text-white group-hover/item:text-primary">{t('dashboard.menu.settings')}</span>
                                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">Gérer votre compte</span>
                                                    </div>
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-4 px-4 py-3.5 w-full text-sm font-medium text-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/20 hover:shadow-md hover:shadow-red-100/50 rounded-2xl transition-all text-left mt-1 group/item"
                                                >
                                                    <div className="p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 group-hover/item:bg-red-100 dark:group-hover/item:bg-red-900/40 transition-colors">
                                                        <LogOut className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-red-600">{t('signOut')}</span>
                                                        <span className="text-xs text-red-400/80 font-normal">Se déconnecter de la session</span>
                                                    </div>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </header>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50 dark:bg-gray-900/50 p-4 lg:p-6">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                    <footer className="mt-12 py-6 text-center text-sm text-gray-400 dark:text-gray-600 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-center gap-6 mb-2">
                            <Link to="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link>
                            <Link to="/contact" className="hover:text-primary transition-colors">{t('footer.contact')}</Link>
                            <Link to="/privacy" className="hover:text-primary transition-colors">{t('footer.privacy')}</Link>
                        </div>
                        <p>{settings?.footer?.rights || '© 2025 NextMove Cargo. All rights reserved.'}</p>

                    </footer>
                </main>
            </div>
            {!isMessagesPage && <ChatWidget />}
        </div>
    );
}
