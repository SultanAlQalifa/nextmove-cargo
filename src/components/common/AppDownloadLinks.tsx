import React from 'react';
import { Smartphone, Download, ExternalLink } from 'lucide-react';

interface AppDownloadLinksProps {
    className?: string;
    isCollapsed?: boolean;
}

const AppDownloadLinks: React.FC<AppDownloadLinksProps> = ({ className = "", isCollapsed = false }) => {
    // Logic to get download links from environment or settings
    // For now, providing direct links or placeholders
    // Points to the Supabase storage bucket we just configured
    const androidUrl = "https://dkbnmnpxoesvkbnwuyle.supabase.co/storage/v1/object/public/apks/latest/nextmove-cargo.apk";
    const iosUrl = "#";    // To be updated after iOS build

    if (isCollapsed) {
        return (
            <div className={`flex flex-col items-center gap-4 py-4 ${className}`}>
                <button
                    onClick={() => window.open(androidUrl, '_blank')}
                    className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                    title="Download Android APK"
                >
                    <Smartphone className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <div className={`p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 ${className}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">App Mobile</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Installez NextMove Cargo</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                <a
                    href={androidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary transition-all group"
                >
                    <div className="w-8 h-8 flex items-center justify-center bg-green-50 dark:bg-green-900/20 rounded-lg mb-1 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">Android (APK)</span>
                </a>

                <button
                    onClick={() => alert("Pour installer sur iPhone : \n1. Ouvrez ce site dans Safari\n2. Appuyez sur le bouton 'Partager' (carré avec flèche en haut)\n3. Sélectionnez 'Sur l'écran d'accueil'")}
                    className="flex flex-col items-center justify-center p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-primary transition-all group"
                >
                    <div className="w-8 h-8 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-1 group-hover:scale-110 transition-transform">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">iPhone (PWA)</span>
                </button>
            </div>
        </div>
    );
};

export default AppDownloadLinks;
