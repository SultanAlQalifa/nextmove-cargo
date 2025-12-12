// ═══════════════════════════════════════════════════════════════
// NextMove Cargo - Dashboard Layout with Sidebar
// Layout avec sidebar pour les dashboards
// ═══════════════════════════════════════════════════════════════

import { useState } from "react";
import {
  Link,
  Outlet,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useBranding } from "../../contexts/BrandingContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  FileText,
  Package,
  Truck,
  CreditCard,
  MessageCircle,
  Settings,
  MessageSquare,
  HeadphonesIcon,
  Users,
  Gift,
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
  Mail,
  Wallet,
  Building2,
  AlertCircle,
  MoreVertical,
} from "lucide-react";
import SantaHat from "../common/SantaHat";
import { Zap } from "lucide-react";

import NotificationBell from "../common/NotificationBell";
import MobileCountrySelector from "../MobileCountrySelector";
import ChatWidget from "../common/ChatWidget";

import KYCBadge from "../common/KYCBadge";
import ClientTierBadge from "../common/ClientTierBadge";

interface NavItem {
  name: string;
  path: string;
  icon: any;
  badge?: number;
  isAutomated?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

import { useUI } from "../../contexts/UIContext";
import CalculatorModal from "../dashboard/CalculatorModal";

export default function DashboardLayout() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { settings } = useBranding();
  const { openCalculator } = useUI();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMessagesPage = location.pathname.includes("/messages");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Logic for Trial Banner
  const trialEndDate = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const daysLeft = trialEndDate ? Math.ceil((trialEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const showTrialBanner = trialEndDate && daysLeft > 0 && daysLeft <= 14;

  // Navigation items based on role
  const getNavSections = (): NavSection[] => {
    const role = profile?.role;

    if (role === "client") {
      return [
        {
          title: t("dashboard.menu.main"),
          items: [
            {
              name: t("dashboard.menu.dashboard"),
              path: "/dashboard/client",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Parrainage & Gains",
          items: [
            {
              name: "Parrainage",
              path: "/dashboard/client/referrals",
              icon: Gift,
            },
          ],
        },
        {
          title: t("dashboard.menu.operations"),
          items: [
            {
              name: t("dashboard.menu.myRequests"),
              path: "/dashboard/client/rfq",
              icon: FileText,
              badge: 0,
            },
            {
              name: t("dashboard.menu.groupage"),
              path: "/dashboard/client/groupage",
              icon: Package,
            },
            {
              name: t("dashboard.menu.myShipments"),
              path: "/dashboard/client/shipments",
              icon: Truck,
            },
            {
              name: t("dashboard.menu.documents"),
              path: "/dashboard/client/documents",
              icon: FileText,
            },
            {
              name: t("dashboard.menu.calculator"),
              path: "#calculator",
              icon: Calculator,
            },
          ],
        },
        {
          title: t("dashboard.menu.finances"),
          items: [
            {
              name: t("dashboard.menu.payments"),
              path: "/dashboard/client/payments",
              icon: CreditCard,
            },
            {
              name: "Portefeuille",
              path: "/dashboard/client/wallet",
              icon: Wallet,
            },
          ],
        },
        {
          title: t("dashboard.menu.communication"),
          items: [
            {
              name: t("dashboard.menu.messages"),
              path: "/dashboard/client/messages",
              icon: MessageCircle,
              badge: 0,
            },
          ],
        },
        {
          title: t("dashboard.menu.support"),
          items: [
            {
              name: t("dashboard.menu.support"),
              path: "/dashboard/client/support",
              icon: HelpCircle,
            },
            {
              name: t("dashboard.menu.settings"),
              path: "/dashboard/client/settings",
              icon: Settings,
            },
            {
              name: t("dashboard.menu.becomePartner"),
              path: "/dashboard/upgrade",
              icon: Star,
            },
          ],
        },
      ];
    }

    if (role === "forwarder") {
      return [
        {
          title: t("dashboard.menu.main"),
          items: [
            {
              name: t("dashboard.menu.dashboard"),
              path: "/dashboard/forwarder",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: "Parrainage & Gains",
          items: [
            {
              name: "Parrainage",
              path: "/dashboard/forwarder/referrals",
              icon: Gift,
            },
          ],
        },
        {
          title: t("dashboard.menu.operations"),
          items: [
            {
              name: t("dashboard.menu.availableRfq"),
              path: "/dashboard/forwarder/rfq",
              icon: FileText,
            },
            {
              name: t("dashboard.menu.groupage"),
              path: "/dashboard/forwarder/groupage",
              icon: Package,
            },
            {
              name: t("dashboard.menu.myOffers"),
              path: "/dashboard/forwarder/offers",
              icon: FileText,
              isAutomated: true,
            },
            {
              name: "Mes Tarifs Standards",
              path: "/dashboard/forwarder/rates",
              icon: Tag,
              isAutomated: true,
            },
            {
              name: t("dashboard.menu.shipments"),
              path: "/dashboard/forwarder/shipments",
              icon: Truck,
            },
            {
              name: t("dashboard.menu.documents"),
              path: "/dashboard/forwarder/documents",
              icon: FileText,
            },
            {
              name: t("dashboard.menu.pod"),
              path: "/dashboard/forwarder/pod",
              icon: FileText,
              isAutomated: true,
            },
            {
              name: "Automatisations",
              path: "/dashboard/forwarder/automations",
              icon: Zap,
              isAutomated: true,
            },
          ],
        },
        {
          title: t("dashboard.menu.management"),
          items: [
            {
              name: "Entrepôts",
              path: "/dashboard/forwarder/addresses",
              icon: Building2,
            },
            {
              name: t("dashboard.menu.personnel"),
              path: "/dashboard/forwarder/personnel",
              icon: User,
            },
            {
              name: t("dashboard.menu.myClients"),
              path: "/dashboard/forwarder/clients",
              icon: User,
            },
            {
              name: "Documents Légaux",
              path: "/dashboard/forwarder/kyc",
              icon: Shield,
            },
          ],
        },
        {
          title: t("dashboard.menu.finances"),
          items: [
            {
              name: t("dashboard.menu.payments"),
              path: "/dashboard/forwarder/payments",
              icon: CreditCard,
            },
            {
              name: "Portefeuille",
              path: "/dashboard/forwarder/wallet",
              icon: Wallet,
            },
            {
              name: t("dashboard.menu.fundCalls"),
              path: "/dashboard/forwarder/fund-calls",
              icon: Bell,
            },
            {
              name: t("dashboard.menu.subscriptions"),
              path: "/dashboard/forwarder/subscription",
              icon: CreditCard,
            },
            {
              name: t("dashboard.menu.coupons"),
              path: "/dashboard/forwarder/coupons",
              icon: Tag,
            },
          ],
        },
        {
          title: t("dashboard.menu.support"),
          items: [
            {
              name: t("dashboard.menu.messages"),
              path: "/dashboard/forwarder/messages",
              icon: MessageCircle,
            },
            {
              name: t("dashboard.menu.support"),
              path: "/dashboard/forwarder/support",
              icon: HelpCircle,
            },
            {
              name: t("dashboard.menu.settings"),
              path: "/dashboard/forwarder/settings",
              icon: Settings,
            },
          ],
        },
      ];
    }

    if (role === "admin" || role === "super-admin") {
      return [
        {
          title: t("dashboard.menu.main"),
          items: [
            {
              name: t("dashboard.menu.dashboard"),
              path: "/dashboard/admin",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: t("dashboard.menu.operations"),
          items: [
            {
              name: t("dashboard.menu.rfqAndOffers"),
              path: "/dashboard/admin/rfq",
              icon: FileText,
            },
            {
              name: t("dashboard.menu.groupage"),
              path: "/dashboard/admin/groupage",
              icon: Package,
            },
            {
              name: t("dashboard.menu.shipments"),
              path: "/dashboard/admin/shipments",
              icon: Package,
            },
            {
              name: t("dashboard.menu.pod"),
              path: "/dashboard/admin/pod",
              icon: FileText,
            },
          ],
        },
        {
          title: t("dashboard.menu.administration"),
          items: [
            {
              name: t("dashboard.menu.users"),
              path: "/dashboard/admin/users",
              icon: User,
            },
            {
              name: t("dashboard.menu.forwarders"),
              path: "/dashboard/admin/forwarders",
              icon: Truck,
            },
            {
              name: t("dashboard.menu.personnelAndRoles"),
              path: "/dashboard/admin/personnel",
              icon: User,
            },
            { name: "Emails", path: "/dashboard/admin/emails", icon: Mail },
            {
              name: "Sécurité (Audit)",
              path: "/dashboard/admin/security",
              icon: Shield,
            },
          ],
        },
        {
          title: t("dashboard.menu.finances"),
          items: [
            {
              name: t("dashboard.menu.payments"),
              path: "/dashboard/admin/payments",
              icon: CreditCard,
            },
            {
              name: t("dashboard.menu.fundCalls"),
              path: "/dashboard/admin/fund-calls",
              icon: Bell,
            },
            {
              name: t("dashboard.menu.subscriptions"),
              path: "/dashboard/admin/subscriptions",
              icon: CreditCard,
            },
            {
              name: t("dashboard.menu.coupons"),
              path: "/dashboard/admin/coupons",
              icon: Tag,
            },
            {
              name: t("dashboard.menu.feesAndServices"),
              path: "/dashboard/admin/fees",
              icon: Shield,
            },
            {
              name: "Tarifs Plateforme",
              path: "/dashboard/admin/platform-rates",
              icon: Calculator,
            },
            {
              name: "Parrainage",
              path: "/dashboard/admin/referrals",
              icon: Gift,
            },
          ],
        },
        {
          title: t("dashboard.menu.configuration"),
          items: [
            {
              name: t("dashboard.menu.features"),
              path: "/dashboard/admin/features",
              icon: Sliders,
            },
            {
              name: t("dashboard.menu.paymentGateway"),
              path: "/dashboard/admin/payment-gateway",
              icon: Settings,
            },
            {
              name: t("dashboard.menu.branding"),
              path: "/dashboard/admin/branding",
              icon: Palette,
            },
            {
              name: t("dashboard.menu.settings"),
              path: "/dashboard/admin/settings",
              icon: Settings,
            },
          ],
        },
        {
          title: t("dashboard.menu.referenceData"),
          items: [
            {
              name: t("dashboard.menu.destinations"),
              path: "/dashboard/admin/locations",
              icon: Globe,
            },
            {
              name: t("dashboard.menu.packageTypes"),
              path: "/dashboard/admin/package-types",
              icon: Package,
            },
          ],
        },
        {
          title: t("dashboard.menu.support"),
          items: [
            {
              name: t("dashboard.menu.support"),
              path: "/dashboard/admin/support",
              icon: HelpCircle,
            },
            {
              name: t("dashboard.menu.messages"),
              path: "/dashboard/admin/messages",
              icon: MessageCircle,
            },
          ],
        },
      ];
    }

    if (role === "driver") {
      return [
        {
          title: t("dashboard.menu.main"),
          items: [
            {
              name: t("dashboard.menu.dashboard"),
              path: "/dashboard/driver",
              icon: LayoutDashboard,
            },
          ],
        },
        {
          title: t("dashboard.menu.operations"),
          items: [
            {
              name: t("dashboard.menu.deliveries"),
              path: "/dashboard/driver",
              icon: Truck,
            },
            {
              name: t("dashboard.menu.podHistory"),
              path: "/dashboard/driver/pod",
              icon: FileText,
            },
          ],
        },
        {
          title: t("dashboard.menu.finances"),
          items: [
            {
              name: t("dashboard.menu.myPayments"),
              path: "/dashboard/driver/payments",
              icon: CreditCard,
            },
          ],
        },
        {
          title: t("dashboard.menu.support"),
          items: [
            {
              name: t("dashboard.menu.messages"),
              path: "/dashboard/driver/messages",
              icon: MessageCircle,
            },
            {
              name: t("dashboard.menu.support"),
              path: "/dashboard/driver/support",
              icon: HelpCircle,
            },
            {
              name: t("dashboard.menu.settings"),
              path: "/dashboard/driver/settings",
              icon: Settings,
            },
          ],
        },
      ];
    }

    return [];
  };

  const navSections = getNavSections();

  const handleLogout = async () => {
    const { supabase } = await import("../../lib/supabase");
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "#calculator") return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-dark-bg flex transition-colors duration-300">
      <CalculatorModal />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Premium Glass Design */}
      <aside
        className={`
                fixed inset-y-0 left-0 z-50 bg-white/80 dark:bg-dark-card/90 backdrop-blur-xl border-r border-gray-100/50 dark:border-white/5 shadow-xl lg:shadow-none transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
                ${isCollapsed ? "w-20" : "w-72"}
                flex flex-col flex-shrink-0
            `}
      >
        {/* Logo Area */}
        <div
          className={`h-20 flex items-center ${isCollapsed ? "justify-center px-0" : "px-8"} border-b border-gray-50/50 dark:border-gray-700/50 transition-all duration-300 relative`}
        >
          <Link
            to="/"
            className="flex items-center gap-3 group overflow-hidden relative"
          >
            <SantaHat className="left-0 -top-2 rotate-[-15deg]" />
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
            aria-label="Close sidebar"
            className="lg:hidden ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 absolute right-4"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full items-center justify-center text-gray-400 hover:text-primary hover:border-primary shadow-sm transition-all z-50"
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
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
              {isCollapsed && index > 0 && (
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-4 mx-2" />
              )}

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  const isCalculator = item.path === "#calculator";

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
                                                group flex items-center ${isCollapsed ? "justify-center px-2" : "justify-between px-4"} py-3 rounded-xl transition-all duration-200 relative
                                                ${active
                          ? "bg-primary text-white shadow-lg shadow-primary/30"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-primary dark:hover:text-primary"
                        }
                                            `}
                      title={isCollapsed ? item.name : ""}
                    >
                      <div className="flex items-center gap-3.5">
                        <Icon
                          className={`w-5 h-5 min-w-[1.25rem] ${active ? "text-white" : "text-gray-400 group-hover:text-primary transition-colors"}`}
                        />
                        {!isCollapsed && (
                          <span className="font-medium text-sm whitespace-nowrap animate-in fade-in duration-200">
                            {item.name}
                          </span>
                        )}
                      </div>
                      {!isCollapsed &&
                        item.badge !== undefined &&
                        item.badge > 0 && (
                          <span
                            className={`
                                                    px-2 py-0.5 text-xs font-bold rounded-full
                                                    ${active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}
                                                `}
                          >
                            {item.badge}
                          </span>
                        )}
                      {isCollapsed &&
                        item.badge !== undefined &&
                        item.badge > 0 && (
                          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                        )}

                      {!isCollapsed && item.isAutomated && (
                        <div
                          className={`ml-auto p-1 rounded-full ${active ? "bg-white/20 text-white" : "bg-yellow-100 text-yellow-600"}`}
                          title="Cette page contient des automatisations"
                        >
                          <Zap className="w-3 h-3 fill-current" />
                        </div>
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
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3 px-4"} py-3 w-full text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all duration-200 group`}
            title={isCollapsed ? t("signOut") : ""}
          >
            <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
            {!isCollapsed && (
              <span className="font-medium text-sm whitespace-nowrap">
                {t("signOut")}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50/50 dark:bg-dark-bg transition-colors duration-500">

        {/* Trial Banner */}
        {showTrialBanner && (
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-3 sm:py-2 text-sm font-medium flex flex-col sm:flex-row items-center justify-center gap-2 shadow-sm relative z-50 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 animate-bounce shrink-0" />
              <span>
                Période d'essai activée : Il vous reste <span className="font-bold underline">{daysLeft} jours</span> gratuits.
              </span>
            </div>
            <Link
              to="/upgrade"
              className="mt-1 sm:mt-0 ml-0 sm:ml-2 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs transition-colors border border-white/20 whitespace-nowrap"
            >
              Passer en Pro
            </Link>
          </div>
        )}

        {/* Ambient Background Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

        {/* Top Navbar - Ultra-Premium Floating Glass Design (v4) */}
        <div className="px-4 md:px-6 pt-4 pb-2 animate-in slide-in-from-top-4 duration-700 fade-in z-40">
          <header className="bg-white/70 dark:bg-dark-card/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-sm rounded-3xl h-16 flex items-center justify-between px-4 md:px-6 transition-all duration-500 hover:bg-white/80 dark:hover:bg-dark-card/80 hover:shadow-md hover:border-white/40 group/navbar relative pointer-events-auto">
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40 dark:from-white/5 dark:to-white/5 pointer-events-none rounded-3xl" />

            <div className="flex items-center gap-6 flex-1 relative z-10">
              <button
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                className="lg:hidden p-2.5 text-gray-500 hover:bg-white/60 hover:text-primary rounded-2xl transition-all duration-300 hover:shadow-sm"
              >
                <Menu className="w-6 h-6" />
              </button>

              {/* Breadcrumbs - Premium Pill Style */}
              <div className="hidden md:flex items-center text-sm">
                <Link
                  to="/"
                  className="flex items-center justify-center w-8 h-8 text-slate-400 hover:text-primary hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-black/20 rounded-xl transition-all duration-300 group/home"
                  title="Accueil"
                >
                  <Home className="w-4 h-4 group-hover/home:scale-110 transition-transform duration-300" />
                </Link>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-3"></div>

                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                    {t("dashboard.menu.dashboard")}
                  </span>

                  {location.pathname !== "/dashboard" && (
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  )}

                  {(() => {
                    const pathSegments = location.pathname
                      .split("/")
                      .filter(Boolean);
                    const segmentsToShow = pathSegments.filter(
                      (s) =>
                        s !== "dashboard" &&
                        ![
                          "forwarder",
                          "client",
                          "admin",
                          "driver",
                          "super-admin",
                        ].includes(s),
                    );

                    const translations: Record<string, string> = {
                      forwarder: "Transitaire",
                      client: "Client",
                      admin: "Administrateur",
                      rfq: "Demandes RFQ",
                      shipments: "Expéditions",
                      rates: "Tarifs",
                      offers: "Offres",
                      settings: "Paramètres",
                      profile: "Profil",
                      messages: "Messages",
                      notifications: "Notifications",
                      users: "Utilisateurs",
                      documents: "Documents",
                      support: "Support",
                      payments: "Paiements",
                      wallet: "Portefeuille",
                      referrals: "Parrainage",
                      kyc: "Vérification KYC",
                    };

                    return segmentsToShow.map((segment, index) => (
                      // eslint-disable-next-line react/forbid-dom-props
                      <div key={segment} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                          {translations[segment] || segment.replace(/-/g, " ")}
                        </span>
                        {index < segmentsToShow.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-slate-300" />
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Right Actions - Premium Glass Buttons */}
            <div className="flex items-center gap-3 relative z-10">
              <NotificationBell />

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2.5 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all duration-300 hover:shadow-sm"
                title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

              <div className="hidden sm:block">
                <MobileCountrySelector />
              </div>

              <NotificationBell />

              {/* User Profile - Premium Pill */}
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-2 pr-4 py-1.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-full transition-all duration-300 hover:shadow-md group"
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 shadow-sm group-hover:shadow-md transition-shadow">
                      <div className="w-full h-full rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">
                            {profile?.full_name?.charAt(0) || "U"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                  </div>

                  <div className="flex flex-col items-start pr-1">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate leading-tight">
                      {profile?.full_name?.split(" ")[0]}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide leading-tight">
                      {profile?.role === "forwarder" ? "Transitaire" : profile?.role}
                    </span>
                  </div>

                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu - Glassmorphism */}
                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700 shadow-2xl rounded-3xl overflow-hidden z-40 animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">

                      {/* Dropdown Header */}
                      <div className="p-5 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary p-0.5 shadow-md">
                            <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                              {profile?.avatar_url ? (
                                <img src={profile?.avatar_url} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="text-lg font-bold text-primary">
                                  {profile?.full_name?.charAt(0)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {profile?.full_name}
                            </p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {profile?.email}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <KYCBadge status={profile?.kyc_status} />
                              {profile?.role === 'client' && <ClientTierBadge tier={profile?.client_tier || 'bronze'} />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2 space-y-1">
                        <Link
                          to={`/dashboard/${profile?.role === "super-admin" ? "admin" : profile?.role}/settings`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors group"
                        >
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all text-slate-500 group-hover:text-primary">
                            <User className="w-4 h-4" />
                          </div>
                          <span>Mon Profil</span>
                        </Link>

                        <Link
                          to={`/dashboard/${profile?.role === "super-admin" ? "admin" : profile?.role}/wallet`}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors group"
                        >
                          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all text-slate-500 group-hover:text-primary">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <span>Portefeuille</span>
                        </Link>

                        <div className="my-1 border-t border-slate-100 dark:border-slate-700/50 mx-4"></div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
                        >
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-xl group-hover:bg-red-100 group-hover:shadow-sm transition-all text-red-500">
                            <LogOut className="w-4 h-4" />
                          </div>
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full max-w-full custom-scrollbar relative z-0">
          <div className="container mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>

        {!isMessagesPage && window.innerWidth >= 1024 && (
          <div className="fixed bottom-8 right-8 z-40 animate-in slide-in-from-bottom-4 duration-1000">
            <ChatWidget />
          </div>
        )}
      </div>
    </div>
  );
}
