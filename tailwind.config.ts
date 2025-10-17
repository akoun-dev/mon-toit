/**
 * MON TOIT - Configuration Tailwind CSS
 * Design System Professionnel
 */

import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Palette Mon Toit - Coucher de soleil ivoirien
        primary: {
          DEFAULT: '#FF6B35', // Orange vif
          50: '#FFF5F0',
          100: '#FFE8DC',
          200: '#FFD1B9',
          300: '#FFBA96',
          400: '#FFA373',
          500: '#FF6B35', // Orange vif principal
          600: '#E25822', // Orange profond (CTA)
          700: '#C54A1C',
          800: '#A83C16',
          900: '#8B2E10',
        },
        secondary: {
          DEFAULT: '#E07A5F', // Terracotta
          50: '#FDF5F3',
          100: '#FAEBE7',
          200: '#F5D7CF',
          300: '#F0C3B7',
          400: '#EAAF9F',
          500: '#E07A5F', // Terracotta
          600: '#D96548',
          700: '#C7543A',
          800: '#A8452F',
          900: '#893624',
        },
        // Couleurs de fond
        background: {
          DEFAULT: '#FAF7F0', // Crème clair
          light: '#FFFDF8', // Ivoire
          sand: '#FEF3C7', // Beige sable
        },
        // ANSUT (sponsor, pas identité)
        ansut: {
          blue: '#2256A3',
          orange: '#F08224',
        },
        // Couleurs du drapeau ivoirien (accents)
        ci: {
          orange: '#F77F00',
          white: '#FFFFFF',
          green: '#009E60',
        },
        // Couleurs fonctionnelles
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#DC2626',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#60A5FA',
          dark: '#2563EB',
        },
        // Couleurs neutres
        gray: {
          50: '#F9FAFB',
          100: '#F5F5F5',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.75' }],
        xl: ['1.25rem', { lineHeight: '1.75' }],
        '2xl': ['1.5rem', { lineHeight: '1.5' }],
        '3xl': ['1.875rem', { lineHeight: '1.25' }],
        '4xl': ['2.25rem', { lineHeight: '1.25' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '5rem',
        '5xl': '6rem',
      },
      borderRadius: {
        sm: '0.375rem',
        DEFAULT: '0.5rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        none: 'none',
      },
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'fade-out': 'fade-out 200ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
        'slide-down': 'slide-down 300ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #FEF3C7 0%, #FFFDF8 100%)', // Beige sable → Ivoire
        'gradient-primary': 'linear-gradient(135deg, #FF6B35 0%, #E25822 100%)', // Orange vif → profond
        'gradient-secondary': 'linear-gradient(135deg, #E07A5F 0%, #D96548 100%)', // Terracotta
        'gradient-ci': 'linear-gradient(90deg, #F77F00 0%, #FFFFFF 50%, #009E60 100%)',
        'pattern-african': 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(224, 122, 95, 0.03) 10px, rgba(224, 122, 95, 0.03) 20px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

