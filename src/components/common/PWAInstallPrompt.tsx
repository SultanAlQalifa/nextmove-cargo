import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: any) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Update UI notify the user they can install the PWA
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, discard it
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-4 max-w-sm mx-auto md:mx-0">
                <div className="bg-primary/10 p-3 rounded-xl">
                    <Download className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Installer l'application</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pour une meilleure expérience</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={handleInstallClick}
                        className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
                    >
                        Installer
                    </button>
                </div>
            </div>
        </div>
    );
}
