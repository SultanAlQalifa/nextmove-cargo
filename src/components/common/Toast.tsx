import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export default function Toast({
  id,
  type,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for exit animation to finish before removing
      setTimeout(() => onClose(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  };

  const bgColors = {
    success: "bg-white border-green-100",
    error: "bg-white border-red-100",
    info: "bg-white border-blue-100",
    warning: "bg-white border-yellow-100",
  };

  return (
    <div
      className={`
                flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border
                transition-all duration-300 transform
                ${bgColors[type]}
                ${isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"}
            `}
      role="alert"
    >
      {icons[type]}
      <p className="text-sm font-medium text-gray-700">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => onClose(id), 300);
        }}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}
