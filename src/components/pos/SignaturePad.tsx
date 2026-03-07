import React, { useRef, useState, useEffect } from "react";
import { Trash2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onCancel: () => void;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const getCoordinates = (event: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in event) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = (event as MouseEvent).clientX;
            clientY = (event as MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
        const { x, y } = getCoordinates(event);
        const context = canvasRef.current?.getContext("2d");
        if (context) {
            context.beginPath();
            context.moveTo(x, y);
            setIsDrawing(true);
        }
    };

    const draw = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(event);
        const context = canvasRef.current?.getContext("2d");
        if (context) {
            context.lineTo(x, y);
            context.stroke();
            setIsEmpty(false);
        }
    };

    const stopDrawing = () => {
        const context = canvasRef.current?.getContext("2d");
        if (context) {
            context.closePath();
        }
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (canvas && context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            setIsEmpty(true);
        }
    };

    const handleSave = () => {
        if (isEmpty) return;
        const canvas = canvasRef.current;
        if (canvas) {
            // Create a temporary canvas to add a white background if needed
            // Currently, we return transparent PNG
            onSave(canvas.toDataURL("image/png"));
        }
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const context = canvas.getContext("2d");
            if (context) {
                // Set initial styles
                context.strokeStyle = "#ffffff";
                context.lineWidth = 3;
                context.lineCap = "round";
                context.lineJoin = "round";

                // Adjust for DPI
                const ratio = window.devicePixelRatio || 1;
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width * ratio;
                canvas.height = rect.height * ratio;
                context.scale(ratio, ratio);

                // Re-apply styles after scale
                context.strokeStyle = "#ffffff";
                context.lineWidth = 3;
                context.lineCap = "round";
                context.lineJoin = "round";
            }
        }
    }, []);

    return (
        <div className="flex flex-col gap-4">
            <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="relative w-full h-48 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 cursor-crosshair touch-none"
                />

                {isEmpty && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                        <p className="text-white text-sm font-black uppercase tracking-widest">Signez ici</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={clearCanvas}
                    className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all shadow-lg"
                >
                    <Trash2 className="w-4 h-4" />
                    Effacer
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isEmpty}
                    onClick={handleSave}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg ${isEmpty
                        ? 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/5'
                        : 'bg-white text-slate-900 border border-white'
                        }`}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Valider
                </motion.button>
            </div>

            <button
                onClick={onCancel}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest text-center mt-2"
            >
                Annuler
            </button>
        </div>
    );
};
