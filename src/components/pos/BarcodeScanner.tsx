import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { X } from "lucide-react";

interface BarcodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        scannerRef.current = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText) => {
                onScan(decodedText);
                scannerRef.current?.clear();
            },
            () => {
                // Silently ignore scan errors
            }
        );

        return () => {
            scannerRef.current?.clear().catch(err => console.error("Failed to clear scanner", err));
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg bg-white rounded-[32px] overflow-hidden relative shadow-2xl">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-xl font-black text-slate-900">Scanner un Code</h3>
                    <button
                        title="Fermer le scanner"
                        onClick={onClose}
                        className="p-2 bg-white rounded-xl text-slate-400 hover:text-red-500 shadow-sm transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    <div id="reader" className="w-full rounded-2xl overflow-hidden grayscale contrast-125" />
                    <p className="text-center mt-6 text-slate-500 font-medium">Placer le code-barres ou le QR code dans le cadre</p>
                </div>
            </div>
        </div>
    );
}
