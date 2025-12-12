export default function SantaHat({ className = "" }: { className?: string }) {
    return (
        <div className={`absolute -top-3 -right-2 transform rotate-12 z-50 pointer-events-none ${className}`}>
            <svg
                width="32"
                height="32"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md"
            >
                {/* Red Hat Base */}
                <path
                    d="M20 80 C 10 80, 5 60, 40 10 C 80 60, 90 80, 80 80 Z"
                    fill="#EF4444"
                />
                {/* White Fur Trim */}
                <path
                    d="M10 80 C 10 90, 90 90, 90 80 C 90 70, 10 70, 10 80 Z"
                    fill="#FFFFFF"
                />
                {/* White Pom Pom */}
                <circle cx="40" cy="10" r="8" fill="#FFFFFF" />
            </svg>
        </div>
    );
}
