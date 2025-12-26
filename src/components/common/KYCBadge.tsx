import { ShieldCheck, ShieldAlert, Shield, Clock } from "lucide-react";


interface KYCBadgeProps {
  status?: "pending" | "approved" | "rejected" | "verified" | "unverified";
  className?: string; // Additional classes
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function KYCBadge({
  status = "pending",
  className = "",
  showLabel = true,
  size = "md",
}: KYCBadgeProps) {


  // Normalizing 'approved' to 'verified' just in case
  const normalizedStatus = status === "approved" ? "verified" : status;

  const config = {
    pending: {
      icon: Clock,
      text: "En Attente",
      classes:
        "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    },
    verified: {
      icon: ShieldCheck,
      text: "Vérifié",
      classes:
        "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
    },
    rejected: {
      icon: ShieldAlert,
      text: "Rejeté",
      classes:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
    },
    default: {
      icon: Shield,
      text: "Non Vérifié",
      classes:
        "bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700",
    },
  };

  const current =
    config[normalizedStatus as keyof typeof config] || config.default;
  const Icon = current.icon;

  const sizes = {
    sm: { icon: "w-3 h-3", text: "text-[10px]", padding: "px-1.5 py-0.5" },
    md: { icon: "w-4 h-4", text: "text-xs", padding: "px-2 py-1" },
    lg: { icon: "w-5 h-5", text: "text-sm", padding: "px-3 py-1.5" },
  };

  return (
    <div
      className={`
            inline-flex items-center gap-1.5 rounded-full font-medium border
            ${current.classes}
            ${sizes[size].padding}
            ${className}
        `}
      title={`Statut KYC: ${current.text}`}
    >
      <Icon className={sizes[size].icon} />
      {showLabel && <span className={sizes[size].text}>{current.text}</span>}
    </div>
  );
}
