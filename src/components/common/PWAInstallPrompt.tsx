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
    <div className="fixed bottom-24 left-0 right-0 z-[60] animate-in slide-in-from-bottom-10 fade-in duration-700 pointer-events-none p-4">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="relative group">
          {/* subtle glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-blue-500/20 to-secondary/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>

          <div className="relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl px-6 py-4 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-white/40 dark:border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
                  NextMove Cargo App
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  Expérience Ultra-Fluide
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsVisible(false)}
                title="Fermer"
                aria-label="Fermer"
                className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                onClick={handleInstallClick}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Installer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
