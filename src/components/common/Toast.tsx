import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const config = {
  success: {
    icon: CheckCircle,
    title: "Succès",
    gradient: "from-emerald-500 to-green-400",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-500",
    ringColor: "ring-emerald-500/30",
    btnBg: "bg-emerald-600 hover:bg-emerald-500",
    progressColor: "bg-emerald-500",
    glowColor: "shadow-emerald-500/20",
  },
  error: {
    icon: AlertCircle,
    title: "Erreur",
    gradient: "from-rose-500 to-red-400",
    iconBg: "bg-rose-500/20",
    iconColor: "text-rose-500",
    ringColor: "ring-rose-500/30",
    btnBg: "bg-rose-600 hover:bg-rose-500",
    progressColor: "bg-rose-500",
    glowColor: "shadow-rose-500/20",
  },
  info: {
    icon: Info,
    title: "Information",
    gradient: "from-blue-500 to-cyan-400",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-500",
    ringColor: "ring-blue-500/30",
    btnBg: "bg-blue-600 hover:bg-blue-500",
    progressColor: "bg-blue-500",
    glowColor: "shadow-blue-500/20",
  },
  warning: {
    icon: AlertTriangle,
    title: "Attention",
    gradient: "from-amber-500 to-orange-400",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-500",
    ringColor: "ring-amber-500/30",
    btnBg: "bg-amber-600 hover:bg-amber-500",
    progressColor: "bg-amber-500",
    glowColor: "shadow-amber-500/20",
  },
};

export default function Toast({
  id,
  type,
  message,
  duration = 6000,
  onClose,
}: ToastProps) {
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());
  const cfg = config[type];
  const Icon = cfg.icon;

  useEffect(() => {
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        handleClose();
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [duration]);

  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShow(false);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Popup */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl ${cfg.glowColor} overflow-hidden border border-white/20 dark:border-white/10`}
          >
            {/* Gradient Bar */}
            <div className={`h-1.5 w-full bg-gradient-to-r ${cfg.gradient}`} />

            {/* Content */}
            <div className="px-6 pt-7 pb-6 flex flex-col items-center text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1, damping: 12 }}
                className={`w-16 h-16 rounded-2xl ${cfg.iconBg} flex items-center justify-center ring-4 ${cfg.ringColor} mb-4`}
              >
                <Icon className={`w-8 h-8 ${cfg.iconColor}`} />
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-lg font-bold text-slate-900 dark:text-white mb-1"
              >
                {cfg.title}
              </motion.h3>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs"
              >
                {message}
              </motion.p>

              {/* Button */}
              <motion.button
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                onClick={handleClose}
                className={`mt-5 px-8 py-2.5 rounded-xl text-white text-sm font-bold ${cfg.btnBg} transition-all shadow-lg active:scale-95 min-h-[44px]`}
              >
                J'ai compris
              </motion.button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-slate-100 dark:bg-slate-800">
              <motion.div
                className={`h-full ${cfg.progressColor} rounded-r-full`}
                style={{ width: `${progress}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
