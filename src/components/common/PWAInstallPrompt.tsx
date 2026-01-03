import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleIOSTrigger = () => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

      if (isIOS && !isStandalone) {
        // For iOS, we don't have beforeinstallprompt, so we might show a subtle hint
        // or wait for a specific user action. For now, let's just listen for a custom event.
        setIsVisible(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("check-pwa-install", handleIOSTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("check-pwa-install", handleIOSTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIOS) {
      window.dispatchEvent(new CustomEvent("open-install-guide"));
      setIsVisible(false);
      return;
    }

    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;

    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="group relative">
        {/* Iridescent Border Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-purple-500 to-secondary rounded-[2rem] opacity-30 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200"></div>

        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-6 py-5 rounded-[1.8rem] shadow-2xl border border-white/20 flex flex-col sm:flex-row items-center gap-5 max-w-sm mx-auto md:mx-0">

          <div className="bg-gradient-to-br from-primary to-blue-600 p-3.5 rounded-2xl shadow-lg shadow-primary/20 transform group-hover:rotate-6 transition-transform">
            <Download className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
              <h3 className="font-black text-slate-900 dark:text-white text-base tracking-tight">
                NextMove App
              </h3>
              <span className="px-2 py-0.5 bg-emerald-500 text-[8px] font-black text-white uppercase rounded-full tracking-widest animate-pulse">
                Gratuit
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Installez l'app pour un suivi <br className="hidden sm:block" /> instantané & hors-ligne.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-4 sm:pt-0 sm:pl-4">
            <button
              onClick={() => setIsVisible(false)}
              aria-label="Fermer"
              className="flex-1 sm:flex-none p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={handleInstallClick}
              title="Installer l'application sur votre appareil"
              className="flex-[2] sm:flex-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-sm font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Installer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
