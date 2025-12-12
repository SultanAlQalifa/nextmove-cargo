import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X, Camera, AlertCircle } from "lucide-react";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export default function QRScannerModal({
  isOpen,
  onClose,
  onScan,
}: QRScannerModalProps) {
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Initialize scanner when modal opens
      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        /* verbose= */ false,
      );

      scanner.render(
        (decodedText) => {
          // Success callback
          scanner.clear().catch(console.error);
          onScan(decodedText);
          onClose();
        },
        (errorMessage) => {
          // Error callback (called frequently when no QR is found)
          // We typically ignore this to avoid spamming logs or UI
          // console.warn(errorMessage);
        },
      );

      scannerRef.current = scanner;
    }

    // Cleanup on unmount or close
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-white">
            <Camera className="w-5 h-5 text-blue-600" />
            Scanner un colis
          </h3>
          <button
            onClick={onClose}
            aria-label="Fermer le scanner"
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-gray-950">
          <div
            id="reader"
            className="w-full overflow-hidden rounded-xl border-2 border-slate-200 dark:border-gray-800 bg-black"
          ></div>

          <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
            Pointez la caméra vers un QR Code valide
          </div>

          {scanError && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {scanError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
