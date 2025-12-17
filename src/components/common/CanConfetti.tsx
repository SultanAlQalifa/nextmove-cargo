/* eslint-disable */
import { useEffect, useState } from 'react';

export default function CanConfetti() {
    const [particles, setParticles] = useState<number[]>([]);
    const colors = ['#00853F', '#FDEF42', '#E31B23']; // Senegal Flag Colors

    useEffect(() => {
        // Generate 50 particles
        setParticles(Array.from({ length: 50 }, (_, i) => i));
    }, []);

    return (
        // eslint-disable-next-line react-dom/no-unsafe-style-property
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden="true">
            {particles.map((i) => {
                const color = colors[Math.floor(Math.random() * colors.length)];
                const style = {
                    left: `${Math.random() * 100}%`,
                    animationDuration: `${Math.random() * 5 + 5}s`, // Faster than snow
                    animationDelay: `${Math.random() * 5}s`,
                    width: `${Math.random() * 8 + 4}px`,
                    height: `${Math.random() * 8 + 4}px`,
                    backgroundColor: color,
                    borderRadius: Math.random() > 0.5 ? '50%' : '2px', // Mix circles and squares
                };
                return (
                    <div
                        key={i}
                        className="absolute top-[-10px] opacity-80 animate-snow"
                        style={{
                            left: style.left,
                            animationDuration: style.animationDuration,
                            animationDelay: style.animationDelay,
                            width: style.width,
                            height: style.height,
                            backgroundColor: style.backgroundColor,
                            borderRadius: style.borderRadius,
                        }}
                    />
                );
            })
            }
        </div >
    );
}
