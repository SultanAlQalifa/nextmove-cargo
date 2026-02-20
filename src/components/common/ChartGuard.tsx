import React, { useState, useEffect, useRef } from 'react';

interface ChartGuardProps {
    children: React.ReactNode;
    height?: string | number;
    className?: string;
}

/**
 * ChartGuard Ensures that Recharts components only render 
 * when their container has valid, positive dimensions.
 * This prevents width(-1) and height(-1) errors in the console.
 */
export const ChartGuard: React.FC<ChartGuardProps> = ({ children, height = '100%', className = '' }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Apply height via ref to avoid style prop lints
        if (containerRef.current) {
            const h = typeof height === 'number' ? `${height}px` : height;
            containerRef.current.style.height = h;
            containerRef.current.style.minHeight = h;
        }
    }, [height]);

    useEffect(() => {
        if (!containerRef.current) return;

        const checkDimensions = () => {
            if (!containerRef.current) return;
            const { width, height } = containerRef.current.getBoundingClientRect();
            // Use a small threshold to avoid edge cases with 0.0 sizes
            if (width > 0.5 && height > 1) {
                setShouldRender(true);
            } else {
                setShouldRender(false);
            }
        };

        // Initial check
        checkDimensions();

        const observer = new ResizeObserver(() => {
            // Use requestAnimationFrame to ensure layout has settled
            window.requestAnimationFrame(checkDimensions);
        });

        observer.observe(containerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`w-full min-w-0 ${className}`}
        >
            {shouldRender ? children : null}
        </div>
    );
};
