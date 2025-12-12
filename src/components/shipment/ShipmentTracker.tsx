import {
  Check,
  Clock,
  Globe,
  Home,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

interface ShipmentTrackerProps {
  status:
    | "pending"
    | "picked_up"
    | "in_transit"
    | "customs"
    | "delivered"
    | "cancelled";
  className?: string;
}

export default function ShipmentTracker({
  status,
  className = "",
}: ShipmentTrackerProps) {
  const steps = [
    { id: "pending", label: "En Attente", icon: Clock },
    {
      id: "picked_up",
      label: "Ramassé",
      icon: Array.isArray(status) ? Package : Truck,
    }, // Simple fallback logic, can be refined
    { id: "in_transit", label: "En Transit", icon: Globe },
    { id: "customs", label: "Douane", icon: ShieldCheck },
    { id: "delivered", label: "Livré", icon: Home },
  ];

  const getStepStatus = (stepId: string) => {
    if (status === "cancelled") return "cancelled";

    const statusOrder = [
      "pending",
      "picked_up",
      "in_transit",
      "customs",
      "delivered",
    ];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const getProgressWidthClass = () => {
    const index = [
      "pending",
      "picked_up",
      "in_transit",
      "customs",
      "delivered",
    ].indexOf(status);
    if (index <= 0) return "w-0";
    if (index === 1) return "w-1/4";
    if (index === 2) return "w-1/2";
    if (index === 3) return "w-3/4";
    return "w-full";
  };

  return (
    <div className={`w-full py-6 ${className}`}>
      <div className="relative flex justify-between items-start">
        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full -z-10" />

        {/* Progress Bar Fill */}
        <div
          className={`absolute top-5 left-0 h-1 bg-green-500 rounded-full -z-10 transition-all duration-1000 ${getProgressWidthClass()}`}
        />

        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id);
          const Icon = step.icon;
          const isCompleted = stepStatus === "completed";
          const isCurrent = stepStatus === "current";

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500
                                    ${isCompleted ? "bg-green-500 border-green-500 text-white" : ""}
                                    ${isCurrent ? "bg-white border-blue-500 text-blue-600 shadow-lg scale-110" : ""}
                                    ${stepStatus === "upcoming" ? "bg-white border-gray-200 text-gray-300" : ""}
                                `}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={`text-xs font-bold transition-colors duration-300 ${
                    isCurrent
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>

              {/* Pulse Effect for Current Step */}
              {isCurrent && (
                <span className="absolute top-5 w-10 h-10 rounded-full bg-blue-500 opacity-20 animate-ping -z-20" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
