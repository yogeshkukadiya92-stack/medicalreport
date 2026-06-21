/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
        secondary: {
          500: '#0891b2',
          600: '#0e7490',
        },
        health: {
          normal: '#10b981',
          borderline: '#f59e0b',
          high: '#ef4444',
          low: '#3b82f6',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        body: ['16px', '24px'],
        'body-sm': ['14px', '20px'],
        heading: ['24px', '32px'],
        title: ['20px', '28px'],
      },
      borderRadius: {
        card: '12px',
        button: '10px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
      },
    },
  },
  plugins: [],
};
