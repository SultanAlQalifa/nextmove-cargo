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
            }
        },
    },
    plugins: [],
}
