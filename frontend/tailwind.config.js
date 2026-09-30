export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            500: '#10B981',
            600: '#059669',
            700: '#047857',
            800: '#065F46',
          },
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            500: '#3B82F6',
            600: '#2563EB',
            700: '#1D4ED8',
            800: '#1E40AF',
          },
          dark: {
            900: '#0F172A',
            800: '#1E293B',
            700: '#334155',
            600: '#475569',
          },
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
