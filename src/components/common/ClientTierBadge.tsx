import { Crown, Star, Award, Medal } from "lucide-react";

export type ClientTier = "bronze" | "silver" | "gold" | "platinum";

interface ClientTierBadgeProps {
  tier?: ClientTier | string; // loose typing to handle string from DB
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function ClientTierBadge({
  tier = "bronze",
  className = "",
  showLabel = true,
  size = "md",
}: ClientTierBadgeProps) {
  const config = {
    platinum: {
      icon: Crown,
      text: "Platinum",
      classes:
        "bg-slate-900 text-slate-100 border-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-300 shadow-sm",
    },
    gold: {
      icon: Star,
      text: "Gold",
      classes:
        "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
    },
    silver: {
      icon: Award,
      text: "Silver",
      classes:
        "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    },
    bronze: {
      icon: Medal,
      text: "Bronze",
      classes:
        "bg-orange-50 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
    },
  };

  const normalizedTier = (tier || "bronze").toLowerCase();
  const current =
    config[normalizedTier as keyof typeof config] || config.bronze;
  const Icon = current.icon;

  const sizes = {
    sm: { icon: "w-3 h-3", text: "text-[10px]", padding: "px-1.5 py-0.5" },
    md: { icon: "w-4 h-4", text: "text-xs", padding: "px-2 py-1" },
    lg: { icon: "w-5 h-5", text: "text-sm", padding: "px-3 py-1.5" },
  };

  return (
    <div
      className={`
            inline-flex items-center gap-1.5 rounded-full font-bold border
            ${current.classes}
            ${sizes[size].padding}
            ${className}
        `}
      title={`Niveau VIP: ${current.text}`}
    >
      <Icon className={sizes[size].icon} />
      {showLabel && <span className={sizes[size].text}>{current.text}</span>}
    </div>
  );
}
