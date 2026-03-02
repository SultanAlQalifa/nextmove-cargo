import React from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
  };
  secondaryActions?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
    disabled?: boolean;
  }[];
  children?: React.ReactNode;
}

export default function PageHeader({
  title,
  subtitle,
  action,
  secondaryActions,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {children}
        {secondaryActions?.map((secAction, index) => (
          <button
            key={index}
            onClick={secAction.onClick}
            disabled={secAction.disabled}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {secAction.icon && <secAction.icon className="w-5 h-5" />}
            <span className="font-medium">{secAction.label}</span>
          </button>
        ))}
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
