/**
 * MON TOIT - Configuration Tailwind CSS V2
 * Design System Professionnel Unifié
 *
 * Version: 2.0
 * Compatible avec design-system-v2.css
 */

import type { Config } from 'tailwindcss';

const config: Config = {
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
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // =============================================
      // COLORS - Aligned with design-system-v2.css
      // =============================================
      colors: {
        // Semantic colors (using CSS variables)
        border: 'hsl(var(--color-gray-200))',
        input: 'hsl(var(--color-gray-100))',
        ring: 'hsl(var(--color-primary-500))',
        background: 'hsl(var(--color-white))',
        foreground: 'hsl(var(--color-gray-900))',

        // Primary palette
        primary: {
          50: 'hsl(var(--color-primary-50))',
          100: 'hsl(var(--color-primary-100))',
          200: 'hsl(var(--color-primary-200))',
          300: 'hsl(var(--color-primary-300))',
          400: 'hsl(var(--color-primary-400))',
          500: 'hsl(var(--color-primary-500))', // Main brand color
          600: 'hsl(var(--color-primary-600))',
          700: 'hsl(var(--color-primary-700))',
          800: 'hsl(var(--color-primary-800))',
          900: 'hsl(var(--color-primary-900))',
          DEFAULT: 'hsl(var(--color-primary-500))',
          foreground: 'hsl(var(--color-white))',
        },

        // Secondary palette
        secondary: {
          50: 'hsl(var(--color-secondary-50))',
          100: 'hsl(var(--color-secondary-100))',
          200: 'hsl(var(--color-secondary-200))',
          300: 'hsl(var(--color-secondary-300))',
          400: 'hsl(var(--color-secondary-400))',
          500: 'hsl(var(--color-secondary-500))', // Main CTA color
          600: 'hsl(var(--color-secondary-600))',
          700: 'hsl(var(--color-secondary-700))',
          800: 'hsl(var(--color-secondary-800))',
          900: 'hsl(var(--color-secondary-900))',
          DEFAULT: 'hsl(var(--color-secondary-500))',
          foreground: 'hsl(var(--color-white))',
        },

        // Success palette
        success: {
          50: 'hsl(var(--color-success-50))',
          100: 'hsl(var(--color-success-100))',
          200: 'hsl(var(--color-success-200))',
          300: 'hsl(var(--color-success-300))',
          400: 'hsl(var(--color-success-400))',
          500: 'hsl(var(--color-success-500))',
          600: 'hsl(var(--color-success-600))',
          700: 'hsl(var(--color-success-700))',
          800: 'hsl(var(--color-success-800))',
          900: 'hsl(var(--color-success-900))',
          DEFAULT: 'hsl(var(--color-success-500))',
          foreground: 'hsl(var(--color-white))',
        },

        // Warning palette
        warning: {
          50: 'hsl(var(--color-warning-50))',
          100: 'hsl(var(--color-warning-100))',
          200: 'hsl(var(--color-warning-200))',
          300: 'hsl(var(--color-warning-300))',
          400: 'hsl(var(--color-warning-400))',
          500: 'hsl(var(--color-warning-500))',
          600: 'hsl(var(--color-warning-600))',
          700: 'hsl(var(--color-warning-700))',
          800: 'hsl(var(--color-warning-800))',
          900: 'hsl(var(--color-warning-900))',
          DEFAULT: 'hsl(var(--color-warning-500))',
          foreground: 'hsl(var(--color-white))',
        },

        // Error palette
        error: {
          50: 'hsl(var(--color-error-50))',
          100: 'hsl(var(--color-error-100))',
          200: 'hsl(var(--color-error-200))',
          300: 'hsl(var(--color-error-300))',
          400: 'hsl(var(--color-error-400))',
          500: 'hsl(var(--color-error-500))',
          600: 'hsl(var(--color-error-600))',
          700: 'hsl(var(--color-error-700))',
          800: 'hsl(var(--color-error-800))',
          900: 'hsl(var(--color-error-900))',
          DEFAULT: 'hsl(var(--color-error-500))',
          foreground: 'hsl(var(--color-white))',
        },

        // Info palette
        info: {
          50: 'hsl(var(--color-info-50))',
          100: 'hsl(var(--color-info-100))',
          200: 'hsl(var(--color-info-200))',
          300: 'hsl(var(--color-info-300))',
          400: 'hsl(var(--color-info-400))',
          500: 'hsl(var(--color-info-500))',
          600: 'hsl(var(--color-info-600))',
          700: 'hsl(var(--color-info-700))',
          800: 'hsl(var(--color-info-800))',
          900: 'hsl(var(--color-info-900))',
          DEFAULT: 'hsl(var(--color-info-500))',
          foreground: 'hsl(var(--color-white))',
        },

        // Gray palette
        gray: {
          50: 'hsl(var(--color-gray-50))',
          100: 'hsl(var(--color-gray-100))',
          200: 'hsl(var(--color-gray-200))',
          300: 'hsl(var(--color-gray-300))',
          400: 'hsl(var(--color-gray-400))',
          500: 'hsl(var(--color-gray-500))',
          600: 'hsl(var(--color-gray-600))',
          700: 'hsl(var(--color-gray-700))',
          800: 'hsl(var(--color-gray-800))',
          900: 'hsl(var(--color-gray-900))',
        },

        // Neutral colors (for compatibility)
        muted: {
          DEFAULT: 'hsl(var(--color-gray-100))',
          foreground: 'hsl(var(--color-gray-600))',
        },

        accent: {
          DEFAULT: 'hsl(var(--color-primary-500))',
          foreground: 'hsl(var(--color-white))',
        },

        popover: {
          DEFAULT: 'hsl(var(--color-white))',
          foreground: 'hsl(var(--color-gray-900))',
        },

        card: {
          DEFAULT: 'hsl(var(--color-white))',
          foreground: 'hsl(var(--color-gray-900))',
        },

        // Cultural palette (Côte d'Ivoire)
        ivory: {
          orange: 'hsl(var(--color-ci-orange))',
          white: 'hsl(var(--color-ci-white))',
          green: 'hsl(var(--color-ci-green))',
          gold: 'hsl(var(--color-ivory-gold))',
          'lagoon-blue': 'hsl(var(--color-lagoon-blue))',
          'tropical-green': 'hsl(var(--color-tropical-green))',
          terracotta: 'hsl(var(--color-terracotta))',
          'bogolan-brown': 'hsl(var(--color-bogolan-brown))',
          sand: {
            light: 'hsl(var(--color-sand-light))',
            DEFAULT: 'hsl(var(--color-sand))',
            dark: 'hsl(var(--color-sand-dark))',
          },
          sunset: {
            orange: 'hsl(var(--color-sunset-orange))',
            teal: 'hsl(var(--color-tropical-teal))',
          },
        },

        // Status colors (properties)
        status: {
          available: 'hsl(var(--status-available))',
          pending: 'hsl(var(--status-pending))',
          rented: 'hsl(var(--status-rented))',
          negotiating: 'hsl(var(--status-negotiating))',
          unavailable: 'hsl(var(--status-unavailable))',
        },
      },

      // =============================================
      // TYPOGRAPHY
      // =============================================
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.25', letterSpacing: '0.025em' }],
        sm: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0.025em' }],
        base: ['1rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        lg: ['1.125rem', { lineHeight: '1.75', letterSpacing: '-0.025em' }],
        xl: ['1.25rem', { lineHeight: '1.75', letterSpacing: '-0.025em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.025em' }],
        '3xl': ['1.875rem', { lineHeight: '1.25', letterSpacing: '-0.05em' }],
        '4xl': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.05em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
      },

      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },

      // =============================================
      // SPACING (Base 4px system)
      // =============================================
      spacing: {
        px: '1px',
        0: '0px',
        0.5: '0.125rem',  // 2px
        1: '0.25rem',     // 4px (base unit)
        1.5: '0.375rem',  // 6px
        2: '0.5rem',      // 8px
        2.5: '0.625rem',  // 10px
        3: '0.75rem',     // 12px
        3.5: '0.875rem',  // 14px
        4: '1rem',        // 16px
        5: '1.25rem',     // 20px
        6: '1.5rem',      // 24px
        7: '1.75rem',     // 28px
        8: '2rem',        // 32px
        9: '2.25rem',     // 36px
        10: '2.5rem',     // 40px
        11: '2.75rem',    // 44px
        12: '3rem',       // 48px
        14: '3.5rem',     // 56px
        16: '4rem',       // 64px
        20: '5rem',       // 80px
        24: '6rem',       // 96px
        28: '7rem',       // 112px
        32: '8rem',       // 128px
        36: '9rem',       // 144px
        40: '10rem',      // 160px
        44: '11rem',      // 176px
        48: '12rem',      // 192px
        52: '13rem',      // 208px
        56: '14rem',      // 224px
        60: '15rem',      // 240px
        64: '16rem',      // 256px
        72: '18rem',      // 288px
        80: '20rem',      // 320px
        96: '24rem',      // 384px
      },

      // =============================================
      // BORDERS
      // =============================================
      borderRadius: {
        none: '0',
        sm: '0.25rem',    // 4px
        DEFAULT: '0.5rem', // 8px
        md: '0.5rem',     // 8px
        lg: '0.75rem',    // 12px
        xl: '1rem',       // 16px
        '2xl': '1.5rem',  // 24px
        '3xl': '2rem',    // 32px
        full: '9999px',
      },

      borderWidth: {
        0: '0px',
        1: '1px',
        2: '2px',
        4: '4px',
        8: '8px',
      },

      // =============================================
      // SHADOWS
      // =============================================
      boxShadow: {
        0: 'none',
        sm: '0 1px 2px 0 hsl(0 0% 0% / 0.05)',
        DEFAULT: '0 1px 3px 0 hsl(0 0% 0% / 0.1), 0 1px 2px -1px hsl(0 0% 0% / 0.1)',
        md: '0 4px 6px -1px hsl(0 0% 0% / 0.1), 0 2px 4px -2px hsl(0 0% 0% / 0.1)',
        lg: '0 10px 15px -3px hsl(0 0% 0% / 0.1), 0 4px 6px -4px hsl(0 0% 0% / 0.1)',
        xl: '0 20px 25px -5px hsl(0 0% 0% / 0.1), 0 8px 10px -6px hsl(0 0% 0% / 0.1)',
        '2xl': '0 25px 50px -12px hsl(0 0% 0% / 0.25)',
        inner: 'inset 0 2px 4px 0 hsl(0 0% 0% / 0.05)',

        // Brand shadows
        primary: '0 10px 40px -10px hsl(var(--color-primary-500) / 0.25)',
        secondary: '0 10px 40px -10px hsl(var(--color-secondary-500) / 0.25)',
        success: '0 10px 40px -10px hsl(var(--color-success-500) / 0.25)',
        warning: '0 10px 40px -10px hsl(var(--color-warning-500) / 0.25)',
        error: '0 10px 40px -10px hsl(var(--color-error-500) / 0.25)',
      },

      // =============================================
      // TRANSITIONS
      // =============================================
      transitionDuration: {
        75: '75ms',
        100: '100ms',
        150: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms',
        700: '700ms',
        1000: '1000ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        linear: 'linear',
        ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      transitionProperty: {
        DEFAULT: 'all',
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke',
        opacity: 'opacity',
        shadow: 'box-shadow',
        transform: 'transform',
      },

      // =============================================
      // ANIMATIONS
      // =============================================
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
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-out': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float-smooth': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        'spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(1deg)' },
          '75%': { transform: 'rotate(-1deg)' },
        },
      },

      animation: {
        'fade-in': 'fade-in 300ms ease-out',
        'fade-out': 'fade-out 300ms ease-out',
        'slide-up': 'slide-up 300ms ease-out',
        'slide-down': 'slide-down 300ms ease-out',
        'slide-left': 'slide-left 300ms ease-out',
        'slide-right': 'slide-right 300ms ease-out',
        'scale-in': 'scale-in 200ms ease-out',
        'scale-out': 'scale-out 200ms ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'float': 'float-smooth 6s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s linear infinite',
        'spin': 'spin 1s linear infinite',
        'bounce': 'bounce-gentle 1s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },

      // =============================================
      // BACKGROUNDS
      // =============================================
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--color-primary-500)), hsl(var(--color-primary-600)))',
        'gradient-secondary': 'linear-gradient(135deg, hsl(var(--color-secondary-500)), hsl(var(--color-secondary-600)))',
        'gradient-success': 'linear-gradient(135deg, hsl(var(--color-success-500)), hsl(var(--color-success-600)))',
        'gradient-warning': 'linear-gradient(135deg, hsl(var(--color-warning-500)), hsl(var(--color-warning-600)))',
        'gradient-error': 'linear-gradient(135deg, hsl(var(--color-error-500)), hsl(var(--color-error-600)))',
        'gradient-hero': 'linear-gradient(135deg, hsl(var(--color-primary-500) / 0.95), hsl(var(--color-secondary-500) / 0.85))',
        'gradient-hero-warm': 'linear-gradient(135deg, hsl(40 40% 98%), hsl(45 40% 95%), hsl(var(--color-secondary-500) / 0.1))',

        // Cultural gradients
        'gradient-lagoon': 'linear-gradient(135deg, hsl(var(--color-lagoon-blue)), hsl(var(--color-tropical-teal)))',
        'gradient-sunset': 'linear-gradient(135deg, hsl(var(--color-sunset-orange)), hsl(var(--color-ivory-gold)), hsl(var(--color-terracotta)))',
        'gradient-forest': 'linear-gradient(135deg, hsl(var(--color-tropical-green)), hsl(var(--color-ci-green)))',
        'gradient-kente': 'linear-gradient(45deg, hsl(var(--color-ivory-gold)) 0%, hsl(var(--color-ci-orange)) 25%, hsl(var(--color-ci-green)) 50%, hsl(var(--color-ivory-gold)) 75%, hsl(var(--color-ci-orange)) 100%)',

        // Patterns
        'pattern-african': 'repeating-linear-gradient(45deg, transparent, transparent 10px, hsl(var(--color-primary-500) / 0.05) 10px, hsl(var(--color-primary-500) / 0.05) 20px)',
        'pattern-kente': 'linear-gradient(90deg, hsl(var(--color-ci-orange)) 25%, transparent 25%), linear-gradient(hsl(var(--color-ci-green)) 25%, transparent 25%)',
        'pattern-bogolan': 'radial-gradient(circle at 20% 50%, hsl(var(--color-bogolan-brown) / 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(var(--color-bogolan-brown) / 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 20%, hsl(var(--color-bogolan-brown) / 0.06) 0%, transparent 50%)',
      },

      backgroundSize: {
        'pattern-kente': '20px 20px',
      },

      // =============================================
      // Z-INDEX
      // =============================================
      zIndex: {
        0: '0',
        10: '10',
        20: '20',
        30: '30',
        40: '40',
        50: '50',
        auto: 'auto',
        base: '0',
        docked: '10',
        dropdown: '1000',
        sticky: '1020',
        banner: '1030',
        overlay: '1040',
        modal: '1050',
        popover: '1060',
        skipLink: '1070',
        toast: '1080',
        tooltip: '1090',
      },

      // =============================================
      // ASPECT RATIO
      // =============================================
      aspectRatio: {
        video: '16 / 9',
        square: '1 / 1',
        portrait: '4 / 5',
        landscape: '3 / 2',
        golden: '1.618 / 1',
        cinematic: '2.39 / 1',
      },

      // =============================================
      // CURSOR
      // =============================================
      cursor: {
        auto: 'auto',
        default: 'default',
        pointer: 'pointer',
        wait: 'wait',
        text: 'text',
        move: 'move',
        help: 'help',
        'not-allowed': 'not-allowed',
        none: 'none',
        'context-menu': 'context-menu',
        progress: 'progress',
        cell: 'cell',
        crosshair: 'crosshair',
        'vertical-text': 'vertical-text',
        alias: 'alias',
        copy: 'copy',
        'no-drop': 'no-drop',
        'all-scroll': 'all-scroll',
        'col-resize': 'col-resize',
        'row-resize': 'row-resize',
        'n-resize': 'n-resize',
        'e-resize': 'e-resize',
        's-resize': 's-resize',
        'w-resize': 'w-resize',
        'ne-resize': 'ne-resize',
        'nw-resize': 'nw-resize',
        'se-resize': 'se-resize',
        'sw-resize': 'sw-resize',
        'ew-resize': 'ew-resize',
        'ns-resize': 'ns-resize',
        'nesw-resize': 'nesw-resize',
        'nwse-resize': 'nwse-resize',
        'zoom-in': 'zoom-in',
        'zoom-out': 'zoom-out',
        grab: 'grab',
        grabbing: 'grabbing',
      },

      // =============================================
      // FILTERS
      // =============================================
      blur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '40px',
        '3xl': '64px',
      },

      brightness: {
        0: '0',
        50: '0.5',
        75: '0.75',
        90: '0.9',
        95: '0.95',
        100: '1',
        105: '1.05',
        110: '1.1',
        125: '1.25',
        150: '1.5',
        200: '2',
      },

      contrast: {
        0: '0',
        50: '0.5',
        75: '0.75',
        100: '1',
        125: '1.25',
        150: '1.5',
        200: '2',
      },

      grayscale: {
        0: '0',
        DEFAULT: '1',
      },

      hueRotate: {
        0: '0deg',
        15: '15deg',
        30: '30deg',
        60: '60deg',
        90: '90deg',
        180: '180deg',
        270: '270deg',
      },

      saturate: {
        0: '0',
        50: '0.5',
        100: '1',
        150: '1.5',
        200: '2',
      },

      sepia: {
        0: '0',
        DEFAULT: '1',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),

    // Plugin for component variants
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Focus visible utilities
        '.focus-visible': {
          '&:focus-visible': {
            outline: `2px solid ${theme('colors.primary.500')}`,
            outlineOffset: '2px',
          },
        },

        // Component gap utilities
        '.component-gap-sm > * + *': {
          marginTop: theme('spacing.2'),
        },
        '.component-gap-md > * + *': {
          marginTop: theme('spacing.4'),
        },
        '.component-gap-lg > * + *': {
          marginTop: theme('spacing.6'),
        },
        '.component-gap-xl > * + *': {
          marginTop: theme('spacing.8'),
        },

        // Interactive utilities
        '.interactive': {
          cursor: 'pointer',
          transition: 'all 200ms ease',
        },
        '.interactive:hover': {
          transform: 'translateY(-1px)',
        },
        '.interactive:active': {
          transform: 'translateY(0)',
        },

        // Loading utilities
        '.loading': {
          position: 'relative',
          color: 'transparent !important',
          pointerEvents: 'none',
        },
        '.loading::after': {
          content: '""',
          position: 'absolute',
          width: '16px',
          height: '16px',
          top: '50%',
          left: '50%',
          marginLeft: '-8px',
          marginTop: '-8px',
          border: '2px solid currentColor',
          borderRadius: '50%',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
        },

        // Disabled utilities
        '.disabled': {
          opacity: '0.5',
          pointerEvents: 'none',
          cursor: 'not-allowed',
        },
      };

      addUtilities(newUtilities);
    },

    // Plugin for cultural patterns
    function({ addUtilities }) {
      const culturalPatterns = {
        '.pattern-african': {
          backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(34, 86, 163, 0.03) 10px, rgba(34, 86, 163, 0.03) 20px)',
        },
        '.pattern-kente': {
          backgroundImage: 'linear-gradient(90deg, #F77F00 25%, transparent 25%), linear-gradient(#009E60 25%, transparent 25%)',
          backgroundSize: '20px 20px',
          opacity: '0.05',
        },
      };

      addUtilities(culturalPatterns);
    },
  ],
};

export default config;