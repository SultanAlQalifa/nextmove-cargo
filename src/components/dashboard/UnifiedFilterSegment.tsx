import { Calendar, Search, X, Filter } from "lucide-react";

interface Tab {
  id: string;
  label: string;
}

interface UnifiedFilterSegmentProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  timeRange: string;
  setTimeRange: (range: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters?: boolean;
  setShowFilters?: (show: boolean) => void;
  tabs?: Tab[];
  statusFilter?: string;
  setStatusFilter?: (status: string) => void;
  statusOptions?: { value: string; label: string }[];
}

export default function UnifiedFilterSegment({
  activeTab,
  setActiveTab,
  timeRange,
  setTimeRange,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  tabs,
  customDateRange,
  setCustomDateRange,
  statusFilter,
  setStatusFilter,
  statusOptions,
}: UnifiedFilterSegmentProps) {
  return (
    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center mb-6 max-w-full overflow-x-auto">
      {/* Tabs (if provided) */}
      {tabs && setActiveTab && (
        <>
          <div className="flex bg-gray-50 rounded-xl p-1 overflow-x-auto max-w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                    ${
                                      activeTab === tab.id
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                    }
                                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>
        </>
      )}

      {/* Time Range Segmented Control */}
      <div className="flex bg-gray-50 rounded-xl p-1 overflow-x-auto max-w-full">
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
            onClick={() => setTimeRange(period.id)}
            className={`
                            px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap
                            ${
                              timeRange === period.id
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            }
                        `}
            title={period.id === "custom" ? "Période personnalisée" : undefined}
          >
            {period.icon ? <period.icon className="w-4 h-4" /> : period.label}
          </button>
        ))}
      </div>

      {/* Status Filter Dropdown */}
      {statusFilter && setStatusFilter && statusOptions && (
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Custom Date Inputs */}
      {timeRange === "custom" && customDateRange && setCustomDateRange && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200 bg-gray-50 p-1 rounded-xl overflow-x-auto">
          <input
            type="date"
            value={customDateRange.start}
            onChange={(e) =>
              setCustomDateRange({ ...customDateRange, start: e.target.value })
            }
            className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            value={customDateRange.end}
            onChange={(e) =>
              setCustomDateRange({ ...customDateRange, end: e.target.value })
            }
            className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
          />
        </div>
      )}

      <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

      {/* Search */}
      <div className="relative flex-1 w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
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

      {setShowFilters && (
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2 rounded-xl border transition-colors ${showFilters ? "bg-primary/10 border-primary text-primary" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
        >
          <Filter className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
