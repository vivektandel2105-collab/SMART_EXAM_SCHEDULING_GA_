/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        edu: { blue: '#0A6CE0', sky: '#F3F7FE', orange: '#F59E0B', ink: '#0F172A' },
        brand: { blue: '#0A6CE0', indigo: '#4F46E5', violet: '#7C3AED', emerald: '#059669', amber: '#F59E0B', rose: '#E11D48' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        outfit: ['Inter', 'sans-serif'],
        manrope: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
