import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useBranding } from "../../contexts/BrandingContext";
import MobileCountrySelector from "../MobileCountrySelector";
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { useState } from "react";
import InstallGuideModal from "../common/InstallGuideModal";

export default function Footer() {
    const { t } = useTranslation();
    const { settings } = useBranding();
    const [showInstallGuide, setShowInstallGuide] = useState(false);

    return (
        <footer className="bg-brand-dark text-slate-300 py-16 border-t border-white/10 relative overflow-hidden">
            {/* Decorative background flare */}
            <div className="absolute top-0 left-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-brand-orange/50 to-transparent -translate-x-1/2"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">

                    {/* Brand & Contact (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <h3 className="text-3xl font-black tracking-tight flex items-center">
                            <span className="text-brand-blue">NextMove</span>
                            <span className="text-brand-orange ml-1">Cargo</span>
                        </h3>
                        <p className="text-slate-400 font-light leading-relaxed max-w-sm">
                            {settings?.footer?.tagline ||
                                "La plateforme digitale de fret nouvelle génération reliant l'Afrique au reste du monde avec sécurité, transparence et rapidité."}
                        </p>

                        <div className="space-y-4 pt-4 text-sm text-slate-400">
                            <div className="flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-brand-orange" />
                                <span>Dakar, Sénégal - Siège Social</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-brand-orange" />
                                <a href="mailto:contact@nextmovecargo.com" className="hover:text-orange-400 transition-colors">contact@nextmovecargo.com</a>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-brand-orange" />
                                <a href="tel:+221770000000" className="hover:text-orange-400 transition-colors">+221 77 000 00 00</a>
                            </div>
                        </div>
                    </div>

                    {/* Plateforme (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="font-bold text-white text-lg tracking-wide uppercase text-[13px]">
                            {settings?.footer?.platform || "Plateforme"}
                        </h4>
                        <ul className="space-y-3 font-light">
                            <li>
                                <Link to="/calculator" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    {t("calculator")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/become-forwarder" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    Devenir Prestataire
                                </Link>
                            </li>
                            <li>
                                <Link to="/tracking" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    Suivi de Colis
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    {t("login")}
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    Inscription
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Entreprise (2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="font-bold text-white text-lg tracking-wide uppercase text-[13px]">
                            {settings?.footer?.company || "Entreprise"}
                        </h4>
                        <ul className="space-y-3 font-light">
                            <li>
                                <Link to="/about" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    À Propos
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    Blog & Actualités
                                </Link>
                            </li>
                            <li>
                                <Link to="/academy" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    Academy
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    Confidentialité
                                </Link>
                            </li>
                            <li>
                                <Link to="/legal/terms" className="hover:text-orange-400 transition-colors flex items-center gap-2 group">
                                    <span className="w-1.5 h-1.5 rounded-full bg-brand-orange/0 group-hover:bg-brand-orange transition-all"></span>
                                    Conditions d'Utilisation
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Mobile Apps & Socials (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        <h4 className="font-bold text-white text-lg tracking-wide uppercase text-[13px]">Applications Mobiles</h4>
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => setShowInstallGuide(true)}
                                className="transition-transform hover:-translate-y-1 duration-300 block text-left w-fit"
                            >
                                <img
                                    src="/assets/app-store-badge-fr.svg"
                                    alt="Télécharger dans l'App Store"
                                    className="h-12 w-auto border border-white/10 rounded-xl"
                                />
                            </button>
                            <a
                                href="https://dkbnmnpxoesvkbnwuyle.supabase.co/storage/v1/object/public/apks/latest/nextmove-cargo.apk"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="transition-transform hover:-translate-y-1 duration-300 block w-fit"
                            >
                                <img
                                    src="/assets/google-play-badge-fr.svg"
                                    alt="DISPONIBLE SUR Google Play"
                                    className="h-12 w-auto border border-white/10 rounded-xl"
                                />
                            </a>
                        </div>

                        <div className="pt-6">
                            <h4 className="font-bold text-white text-xs tracking-widest uppercase mb-4">Suivez-nous</h4>
                            <div className="flex gap-3">
                                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                    <a key={i} href="#" aria-label={`Consulter notre page réseau social ${i + 1}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-brand-orange hover:border-brand-orange hover:text-white transition-all transform hover:-translate-y-1">
                                        <Icon size={18} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-sm text-slate-500 font-light">
                        &copy; {new Date().getFullYear()} {settings?.platform_name || "NextMove Cargo"}. Tous droits réservés.
                    </p>

                    <div className="flex items-center gap-6">
                        <MobileCountrySelector />
                        <div className="h-4 w-px bg-white/10"></div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <span>v1.0.0</span>
                            <button
                                onClick={() => {
                                    if ("serviceWorker" in navigator) {
                                        navigator.serviceWorker.getRegistrations().then((regs) => {
                                            for (let reg of regs) reg.unregister();
                                        });
                                    }
                                    window.location.reload();
                                }}
                                className="hover:text-blue-400 underline decoration-slate-700 underline-offset-2 transition-colors"
                            >
                                Sync
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <InstallGuideModal
                isOpen={showInstallGuide}
                onClose={() => setShowInstallGuide(false)}
            />
        </footer>
    );
}
