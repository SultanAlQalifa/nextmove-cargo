import { X } from "lucide-react";
import { useUI } from "../../contexts/UIContext";
import Calculator from "../Calculator";

export default function CalculatorModal() {
  const { isCalculatorOpen, closeCalculator } = useUI();

  if (!isCalculatorOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Calculateur de Fret
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Estimez vos coûts d'expédition en quelques clics
            </p>
          </div>
          <button
            onClick={closeCalculator}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
          <Calculator />
        </div>
      </div>
    </div>
  );
}
