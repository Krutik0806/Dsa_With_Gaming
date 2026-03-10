/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                primary: { 50: '#f5f7ff', 100: '#ebf0fe', 200: '#d6e0fd', 300: '#b3c5fb', 400: '#8aa0f7', 500: '#667eea', 600: '#5568d3', 700: '#4553b8', 800: '#3a4694', 900: '#333d77' },
                secondary: { 50: '#fdf4ff', 100: '#fae8ff', 200: '#f5d0fe', 300: '#f0abfc', 400: '#e879f9', 500: '#d946ef', 600: '#c026d3', 700: '#a21caf', 800: '#86198f', 900: '#701a75' },
                dark: { 50: '#f8fafc', 100: '#f1f5f9', 800: '#1e293b', 900: '#0f172a', 950: '#0a0a0f' },
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                display: ['Space Grotesk', 'sans-serif'],
            },
            backgroundImage: {
                'hero-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a0533 40%, #0d1b4b 100%)',
                'card-gradient': 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.1))',
                'btn-gradient': 'linear-gradient(135deg, #667eea, #764ba2)',
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.6s ease-out forwards',
                'float': 'float 4s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s infinite',
                'spin-slow': 'spin 8s linear infinite',
            },
        },
    },
    plugins: [],
}
