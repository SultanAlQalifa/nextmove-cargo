import {
  X,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  Monitor,
} from "lucide-react";

interface InstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallGuideModal({
  isOpen,
  onClose,
}: InstallGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Installer l'application
          </h2>
          <button
            onClick={onClose}
            aria-label="Close guide"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors min-h-[44px]"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
          {/* iOS Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <span className="text-2xl">🍎</span>
              <h3>iPhone / iPad (Safari)</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300 ml-2">
              <li className="flex gap-3 items-start">
                <span className="bg-gray-100 dark:bg-gray-700 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold">
                  1
                </span>
                <div>
                  Cliquez sur le bouton{" "}
                  <span className="font-bold">Partager</span> dans la barre du
                  bas.
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg inline-block border border-gray-200 dark:border-gray-700">
                    <Share className="w-5 h-5 text-blue-500" />
                  </div>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-gray-100 dark:bg-gray-700 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold">
                  2
                </span>
                <div>
                  Faites défiler vers le bas et sélectionnez{" "}
                  <span className="font-bold">"Sur l'écran d'accueil"</span>.
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700">
                    <PlusSquare className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    <span className="text-xs">Sur l'écran d'accueil</span>
                  </div>
                </div>
              </li>
            </ol>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700" />

          {/* Android Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <span className="text-2xl">🤖</span>
              <h3>Android (Chrome)</h3>
            </div>
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300 ml-2">
              <li className="flex gap-3 items-start">
                <span className="bg-gray-100 dark:bg-gray-700 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold">
                  1
                </span>
                <div>
                  Cliquez sur les <span className="font-bold">3 points</span> en
                  haut à droite.
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg inline-block border border-gray-200 dark:border-gray-700">
                    <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </div>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="bg-gray-100 dark:bg-gray-700 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold">
                  2
                </span>
                <div>
                  Sélectionnez{" "}
                  <span className="font-bold">"Installer l'application"</span>{" "}
                  ou{" "}
                  <span className="font-bold">
                    "Ajouter à l'écran d'accueil"
                  </span>
                  .
                </div>
              </li>
            </ol>

            <div className="mt-6">
              <a
                href="https://dkbnmnpxoesvkbnwuyle.supabase.co/storage/v1/object/public/apks/latest/nextmove-cargo.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span>Télécharger l'APK Directement</span>
              </a>
              <p className="text-[10px] text-center text-gray-400 mt-2 uppercase tracking-widest font-bold">
                Recommandé pour une installation rapide
              </p>
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700" />

          {/* Desktop Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
              <Monitor className="w-6 h-6 text-gray-700 dark:text-gray-300" />
              <h3>Ordinateur (Chrome / Edge)</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Cliquez sur l'icône d'installation{" "}
              <Download className="w-4 h-4 inline mx-1" /> ou l'icône d'écran
              dans la barre d'adresse URL, tout à droite.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-center">
          <button
            onClick={onClose}
            className="text-primary font-semibold text-sm hover:underline min-h-[44px]"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
