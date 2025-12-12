import { useEffect, useState } from "react";

export default function SantaSleighAnimation() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation loop
    const triggerAnimation = () => {
      setIsVisible(true);
      // Animation duration is roughly 15s (based on CSS animation)
      // Hide it after animation completes to reset
      setTimeout(() => {
        setIsVisible(false);
      }, 15000);
    };

    // First trigger after a short delay
    const initialTimer = setTimeout(triggerAnimation, 2000);

    // Then trigger every 60 seconds (1 minute)
    const interval = setInterval(triggerAnimation, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 left-0 w-full h-0 z-50 pointer-events-none overflow-visible">
      <style>
        {`
          @keyframes flyAcross {
            0% {
              transform: translateX(-100%) translateY(0) scale(0.8);
            }
            25% {
              transform: translateX(25vw) translateY(50px) scale(0.9);
            }
            50% {
              transform: translateX(50vw) translateY(-20px) scale(1);
            }
            75% {
              transform: translateX(75vw) translateY(30px) scale(0.9);
            }
            100% {
              transform: translateX(120vw) translateY(-50px) scale(0.8);
            }
          }
          .santa-sleigh {
            animation: flyAcross 15s linear forwards;
            will-change: transform;
          }
        `}
      </style>
      <div className="santa-sleigh absolute top-0 left-0 w-64 h-32">
        {/* Using a high-quality reliable GIF/WebP of Santa Sleigh */}
        <img
          src="/santa-sleigh.png"
          alt="Santa Flying"
          className="w-full h-full object-contain drop-shadow-xl"
        />
      </div>
    </div>
  );
}
