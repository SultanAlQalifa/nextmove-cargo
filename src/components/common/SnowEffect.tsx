import { useEffect, useState } from 'react';

export default function SnowEffect() {
    const [snowflakes, setSnowflakes] = useState<number[]>([]);

    useEffect(() => {
        // Generate 50 snowflakes
        setSnowflakes(Array.from({ length: 50 }, (_, i) => i));
    }, []);

    return (
        // eslint-disable-next-line react-dom/no-unsafe-style-property
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
            {snowflakes.map((i) => (
                // eslint-disable-next-line
                <div
                    key={i}
                    className="absolute top-[-10px] bg-white rounded-full opacity-80 animate-snow"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 10 + 10}s`, // Slower for snow
                        animationDelay: `${Math.random() * 10}s`,
                        width: `${Math.random() * 6 + 2}px`,
                        height: `${Math.random() * 6 + 2}px`,
                    }}
                />
            ))}
        </div>
    );
}
