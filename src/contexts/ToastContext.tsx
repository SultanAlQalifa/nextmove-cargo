import React, { createContext, useContext, useState, useCallback } from "react";
import Toast, { ToastType } from "../components/common/Toast";

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);

  const removeToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 6000) => {
      const id = Math.random().toString(36).substring(2, 9);
      // Replace any existing toast with the new one
      setActiveToast({ id, type, message, duration });
    },
    [],
  );

  const success = useCallback(
    (message: string, duration?: number) =>
      showToast("success", message, duration),
    [showToast],
  );
  const error = useCallback(
    (message: string, duration?: number) =>
      showToast("error", message, duration),
    [showToast],
  );
  const info = useCallback(
    (message: string, duration?: number) =>
      showToast("info", message, duration),
    [showToast],
  );
  const warning = useCallback(
    (message: string, duration?: number) =>
      showToast("warning", message, duration),
    [showToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {activeToast && (
        <Toast
          key={activeToast.id}
          id={activeToast.id}
          type={activeToast.type}
          message={activeToast.message}
          duration={activeToast.duration}
          onClose={() => removeToast()}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

