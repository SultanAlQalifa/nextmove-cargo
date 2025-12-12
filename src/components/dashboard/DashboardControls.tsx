import { Calendar, MapPin, X, Search } from "lucide-react";

export type TimeRange = "7d" | "30d" | "3m" | "1y" | "all" | "custom";

interface DashboardControlsProps {
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  customDateRange?: { start: string; end: string };
  setCustomDateRange?: (range: { start: string; end: string }) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  searchPlaceholder?: string;
  showTimeRange?: boolean;
  showSearch?: boolean;
}

export default function DashboardControls({
  timeRange,
  setTimeRange,
  customDateRange,
  setCustomDateRange,
  searchQuery,
  setSearchQuery,
  searchPlaceholder = "Rechercher...",
  showTimeRange = true,
  showSearch = true,
}: DashboardControlsProps) {
  return (
    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
      {/* Time Range Segmented Control */}
      {showTimeRange && (
        <>
          <div className="flex bg-gray-50 rounded-xl p-1 overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: "7d", label: "7J" },
              { id: "30d", label: "30J" },
              { id: "3m", label: "3M" },
              { id: "1y", label: "1A" },
              { id: "all", label: "Tout" },
              { id: "custom", icon: Calendar },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setTimeRange(period.id as TimeRange)}
                className={`
                                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap
                                    ${
                                      timeRange === period.id
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                    }
                                `}
                title={
                  period.id === "custom" ? "Période personnalisée" : undefined
                }
              >
                {period.icon ? (
                  <period.icon className="w-4 h-4" />
                ) : (
                  period.label
                )}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          {timeRange === "custom" && customDateRange && setCustomDateRange && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200 bg-gray-50 p-1 rounded-xl">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) =>
                  setCustomDateRange({
                    ...customDateRange,
                    start: e.target.value,
                  })
                }
                className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) =>
                  setCustomDateRange({
                    ...customDateRange,
                    end: e.target.value,
                  })
                }
                className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
              />
            </div>
          )}
        </>
      )}

      {showTimeRange && showSearch && (
        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>
      )}

      {/* Search Input */}
      {showSearch && searchQuery !== undefined && setSearchQuery && (
        <div className="relative flex-1 sm:w-64 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
