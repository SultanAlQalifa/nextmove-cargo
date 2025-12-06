
import { useState, useEffect } from 'react';
import PWAInstallPrompt from './common/PWAInstallPrompt';
import { createPortal } from 'react-dom';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useBranding } from '../contexts/BrandingContext';
import { useTheme } from '../contexts/ThemeContext';
import MobileCountrySelector from './MobileCountrySelector';
import { Sun, Moon, LogOut, LayoutDashboard, User, ChevronDown, Settings, Facebook, Twitter, Instagram, Linkedin, Youtube, Video } from 'lucide-react';
import SEOHead from './seo/SEOHead';

export default function Layout() {
    const { t } = useTranslation();
    const { user, profile, signOut } = useAuth();
    const { settings } = useBranding();
    const { theme, toggleTheme } = useTheme();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <SEOHead />
            {/* Ultra-Premium Fixed Floating Navbar */}
            <PWAInstallPrompt />
            <div className={`fixed top-0 left-0 right-0 z-50 px-2 sm:px-6 lg:px-8 pt-4 pb-2 pointer-events-none transition-all duration-300 ${isScrolled ? 'pt-2' : 'pt-4'}`}>
                <header
                    className={`
                        rounded-2xl h-16 flex items-center justify-between px-3 sm:px-6
                        transition-all duration-500 pointer-events-auto max-w-7xl mx-auto w-full relative
                        ${isScrolled
                            ? 'bg-white/70 backdrop-blur-2xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-white/60'
                            : 'bg-transparent border-transparent shadow-none'
                        }
`}
                >

                    {/* Subtle Gradient Overlay - Show only when scrolled */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/40 pointer-events-none transition-opacity duration-500 ${isScrolled ? 'opacity-100' : 'opacity-0'}`} />

                    <Link to="/" className="flex items-center space-x-3 group relative px-2">
                        {settings?.logo_url ? (
                            <div className="flex items-center text-lg sm:text-2xl font-bold tracking-tight">
                                <span className="text-primary group-hover:scale-105 transition-transform duration-300">NextMove</span>
                                <span className="text-secondary ml-1 group-hover:translate-x-1 transition-transform duration-300">Cargo</span>
                            </div>
                        ) : (
                            <span className="text-lg sm:text-2xl font-bold text-primary">NextMove</span>
                        )}
                    </Link>

                    <nav className="flex items-center gap-2 sm:gap-4 relative z-10">
                        <button
                            onClick={toggleTheme}
                            className="p-2.5 rounded-xl hover:bg-white/50 hover:shadow-sm transition-all duration-300 text-gray-600 dark:text-gray-300 hover:text-primary"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? (
                                <Moon className="w-5 h-5" />
                            ) : (
                                <Sun className="w-5 h-5 text-yellow-400" />
                            )}
                        </button>

                        <div>
                            <MobileCountrySelector />
                        </div>

                        {(!user || profile?.role === 'client') && (
                            <Link
                                to="/become-forwarder"
                                className="hidden md:flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-primary hover:bg-white/50 hover:shadow-sm transition-all duration-300"
                            >
                                Devenir Transitaire
                            </Link>
                        )}

                        <Link
                            to="/calculator"
                            className="hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-primary hover:bg-white/50 hover:shadow-sm transition-all duration-300"
                        >
                            {t('calculator')}
                        </Link>

                        {user ? (
                            <div className="relative ml-2">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 pl-2 pr-2 py-1.5 rounded-full hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 border border-transparent hover:border-gray-100 group/profile"
                                >
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover/profile:opacity-100 transition-opacity duration-500"></div>
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white group-hover/profile:scale-105 transition-transform duration-300 overflow-hidden relative z-10">
                                            {profile?.avatar_url ? (
                                                <img
                                                    src={profile.avatar_url}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span>{profile?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full z-20 shadow-sm"></div>
                                    </div>

                                    <div className="hidden sm:block text-left mr-1">
                                        <p className="text-xs font-bold text-gray-800 leading-none mb-0.5 group-hover/profile:text-primary transition-colors">
                                            {profile?.full_name?.split(' ')[0] || 'Utilisateur'}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-full p-1 group-hover/profile:bg-primary/10 group-hover/profile:text-primary transition-colors shadow-sm">
                                        <ChevronDown className={`w - 3 h - 3 text - gray - 400 transition - transform duration - 300 ${userMenuOpen ? 'rotate-180' : ''} `} />
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-30"
                                            onClick={() => setUserMenuOpen(false)}
                                        />
                                        <div className="absolute right-0 mt-4 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgb(0,0,0,0.15)] border border-white/60 py-2 z-40 transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                                            <div className="px-4 py-3 border-b border-gray-100/50">
                                                <p className="text-sm font-bold text-gray-900 truncate">
                                                    {profile?.full_name || user.email}
                                                </p>
                                                <p className="text-xs text-gray-500 capitalize mt-0.5">
                                                    {profile?.role || 'Membre'}
                                                </p>
                                            </div>
                                            <div className="p-2 space-y-1">
                                                <Link
                                                    to="/dashboard"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary rounded-xl transition-all group/item"
                                                >
                                                    <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                                                        <LayoutDashboard className="w-4 h-4" />
                                                    </div>
                                                    <span>Tableau de bord</span>
                                                </Link>

                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 px-3 py-2.5 w-full text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all text-left mt-1 group/item"
                                                >
                                                    <div className="p-2 bg-red-50 rounded-lg text-red-500 group-hover/item:bg-red-100 transition-colors">
                                                        <LogOut className="w-4 h-4" />
                                                    </div>
                                                    <span>Déconnexion</span>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="hidden sm:flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:text-primary hover:bg-white/50 hover:shadow-sm transition-all duration-300"
                                >
                                    {t('login')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="hidden sm:flex px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-primary hover:bg-blue-700 hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-300 active:translate-y-0 active:scale-95"
                                >
                                    {t('getStarted')}
                                </Link>
                                {/* Mobile Menu Button */}
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="sm:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100"
                                >
                                    <ChevronDown className={`w - 6 h - 6 transition - transform ${userMenuOpen ? 'rotate-180' : ''} `} />
                                </button>
                            </>
                        )}
                    </nav>

                    {/* Mobile Menu Overlay */}
                    {!user && userMenuOpen && createPortal(
                        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setUserMenuOpen(false)}>
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-3"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-lg font-bold text-gray-900">Menu</h3>
                                    <button
                                        onClick={() => setUserMenuOpen(false)}
                                        className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                                    >
                                        <ChevronDown className="w-6 h-6 rotate-180" />
                                    </button>
                                </div>
                                <Link
                                    to="/calculator"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors"
                                >
                                    <div className="p-2 bg-white rounded-lg text-primary shadow-sm"><LayoutDashboard className="w-5 h-5" /></div>
                                    <span className="text-lg">{t('calculator')}</span>
                                </Link>
                                <Link
                                    to="/become-forwarder"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="px-4 py-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-medium flex items-center gap-3 transition-colors"
                                >
                                    <div className="p-2 bg-white rounded-lg text-primary shadow-sm"><User className="w-5 h-5" /></div>
                                    <span className="text-lg">Devenir Transitaire</span>
                                </Link>
                                <div className="h-px bg-gray-200 my-2" />
                                <Link
                                    to="/login"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-center hover:bg-gray-50 transition-colors"
                                >
                                    {t('login')}
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setUserMenuOpen(false)}
                                    className="px-4 py-3 rounded-xl bg-primary text-white font-bold text-center shadow-lg shadow-primary/30 active:scale-95 transition-all"
                                >
                                    {t('getStarted')}
                                </Link>
                            </div>
                        </div>,
                        document.body
                    )}
                </header>
            </div>

            <main className="flex-grow pt-24">
                <Outlet />
            </main>

            <footer className="bg-gray-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="md:col-span-2">
                            <h3 className="text-2xl font-bold mb-4">{settings?.platform_name || 'NextMove Cargo'}</h3>
                            <p className="text-gray-400 mb-4">{settings?.footer?.tagline || 'Simplifying logistics across Africa.'}</p>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">{settings?.footer?.platform || 'Platform'}</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/calculator" className="hover:text-white transition-colors">{t('calculator')}</Link></li>
                                <li><Link to="/login" className="hover:text-white transition-colors">{t('login')}</Link></li>
                                <li><Link to="/register" className="hover:text-white transition-colors">{t('getStarted')}</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold mb-4">{settings?.footer?.company || 'Company'}</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li><Link to="/about" className="hover:text-white transition-colors">À Propos</Link></li>
                                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                                <li><Link to="/privacy" className="hover:text-white transition-colors">Politique de Confidentialité</Link></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 {settings?.platform_name || 'NextMove Cargo'}. {settings?.footer?.rights || 'All rights reserved.'}</p>
                        <div className="mt-4 flex justify-center">
                            <MobileCountrySelector />
                        </div>
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <span className="text-xs text-gray-500 font-mono">v0.1.0</span>
                            <button
                                onClick={() => {
                                    if ('serviceWorker' in navigator) {
                                        navigator.serviceWorker.getRegistrations().then(registrations => {
                                            for (let registration of registrations) {
                                                registration.unregister();
                                            }
                                        });
                                    }
                                    window.location.reload();
                                }}
                                className="text-xs text-primary hover:text-primary/80 underline decoration-dashed"
                            >
                                Forcer la mise à jour
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
