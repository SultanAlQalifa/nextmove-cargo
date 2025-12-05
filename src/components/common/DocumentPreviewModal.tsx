import { X, Download, FileText, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DocumentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: {
        url: string;
        name: string;
        type: string;
    } | null;
}

export default function DocumentPreviewModal({
    isOpen,
    onClose,
    document
}: DocumentPreviewModalProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
        }
    }, [isOpen, document]);

    if (!isOpen || !document) return null;

    const isValidUrl = document.url && document.url !== '#';
    const isImage = document.type.startsWith('image/') && isValidUrl;
    const isPDF = document.type === 'application/pdf' && isValidUrl;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-50 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center gap-3 text-white/90">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-medium truncate max-w-[300px]" title={document.name}>
                            {document.name}
                        </h3>
                        <p className="text-xs text-white/60">{document.type}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <a
                        href={document.url}
                        download
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                        title="Télécharger"
                    >
                        <Download className="w-5 h-5" />
                    </a>
                    <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm"
                        title="Ouvrir dans un nouvel onglet"
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                        onClick={onClose}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors backdrop-blur-sm ml-2"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="w-full h-full flex items-center justify-center p-4 sm:p-8 pt-20">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-0">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-white/20 border-t-white"></div>
                    </div>
                )}

                {isImage ? (
                    <img
                        src={document.url}
                        alt={document.name}
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                    />
                ) : isPDF ? (
                    <iframe
                        src={document.url}
                        className="w-full h-full max-w-5xl rounded-lg shadow-2xl bg-white animate-in zoom-in-95 duration-300"
                        onLoad={() => setIsLoading(false)}
                        title={document.name}
                    />
                ) : (
                    <div className="text-center p-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 max-w-md animate-in zoom-in-95 duration-300">
                        <FileText className="w-16 h-16 text-white/40 mx-auto mb-4" />
                        <h4 className="text-lg font-medium text-white mb-2">Aperçu non disponible</h4>
                        <p className="text-white/60 mb-6">
                            Ce type de fichier ne peut pas être prévisualisé directement.
                            Veuillez le télécharger pour le consulter.
                        </p>
                        <a
                            href={document.url}
                            download
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors font-medium"
                        >
                            <Download className="w-4 h-4" />
                            Télécharger le fichier
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
