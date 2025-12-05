import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: LucideIcon;
        disabled?: boolean;
    };
    children?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-3">
                {children}
                {action && (
                    <button
                        onClick={action.onClick}
                        disabled={action.disabled}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {action.icon && <action.icon className="w-5 h-5" />}
                        <span className="font-medium">{action.label}</span>
                    </button>
                )}
            </div>
        </div>
    );
}

