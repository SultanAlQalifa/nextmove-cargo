import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
    isCalculatorOpen: boolean;
    openCalculator: () => void;
    closeCalculator: () => void;
    toggleCalculator: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

    const openCalculator = () => setIsCalculatorOpen(true);
    const closeCalculator = () => setIsCalculatorOpen(false);
    const toggleCalculator = () => setIsCalculatorOpen(prev => !prev);

    return (
        <UIContext.Provider value={{ isCalculatorOpen, openCalculator, closeCalculator, toggleCalculator }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}
