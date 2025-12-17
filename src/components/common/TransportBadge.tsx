import { Anchor, Send } from "lucide-react";


interface TransportBadgeProps {
  modes?: string[];
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function TransportBadge({
  modes = [],
  className = "",
  showLabel = true,
  size = "md",
}: TransportBadgeProps) {


  const hasSea = modes.includes("sea");
  const hasAir = modes.includes("air");

  if (!hasSea && !hasAir) return null;

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
  };

  const padding = {
    sm: "px-1.5 py-0.5",
    md: "px-2 py-1",
    lg: "px-3 py-1.5",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {hasSea && (
        <div
          className={`
                    flex items-center gap-1.5 rounded-full font-medium border
                    bg-blue-50 text-blue-700 border-blue-100
                    dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30
                    ${padding[size]}
                `}
          title="Transport Maritime"
        >
          <Anchor className={iconSizes[size]} />
          {showLabel && <span className={textSizes[size]}>Maritime</span>}
        </div>
      )}

      {hasAir && (
        <div
          className={`
                    flex items-center gap-1.5 rounded-full font-medium border
                    bg-orange-50 text-orange-700 border-orange-100
                    dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30
                    ${padding[size]}
                `}
          title="Transport Aérien"
        >
          <Send className={`${iconSizes[size]} rotate-[-45deg]`} />
          {showLabel && <span className={textSizes[size]}>Aérien</span>}
        </div>
      )}
    </div>
  );
}
