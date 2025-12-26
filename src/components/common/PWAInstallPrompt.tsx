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
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 border border-slate-200 dark:border-slate-700 flex items-center gap-4 max-w-sm mx-auto md:mx-0">
        <div className="bg-primary/10 p-3 rounded-xl">
          <Download className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Installer l'application
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pour une meilleure expérience
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsVisible(false)}
            aria-label="Dismiss install prompt"
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
