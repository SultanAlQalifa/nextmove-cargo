/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1e40af', // Blue marine
                secondary: '#f97316', // Orange vif
                success: '#10b981', // Green
                warning: '#f59e0b', // Yellow
                danger: '#ef4444', // Red
                'dark-bg': '#020617', // Slate 950 (Premium Void)
                'dark-card': '#0f172a', // Slate 900 (Premium Surface)
                'dark-text': '#f1f5f9', // Slate 100
                'dark-muted': '#94a3b8', // Slate 400
            },
            fontFamily: {
                sans: ['Outfit', 'sans-serif'],
            },
            keyframes: {
                swing: {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '20%': { transform: 'rotate(15deg)' },
                    '40%': { transform: 'rotate(-10deg)' },
                    '60%': { transform: 'rotate(5deg)' },
                    '80%': { transform: 'rotate(-5deg)' },
                },
                blob: {
                    '0%': { transform: 'translate(0px, 0px) scale(1)' },
                    '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                    '100%': { transform: 'translate(0px, 0px) scale(1)' },
                },
            },
            animation: {
                swing: 'swing 1s ease-in-out infinite',
                blob: 'blob 7s infinite',
            },
        },
    },
    plugins: [],
}
