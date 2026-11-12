/**
 * ACG Kaizen Design Tokens
 * Professional Light Theme - Brand Accurate
 *
 * Usage:
 * import { tokens } from './styles/tokens'
 * style={{ color: tokens.colors.acg.primary }}
 */

export const tokens = {
  colors: {
    // ═══ ACG RED (Primary Brand Color - Use Sparingly) ═══
    acg: {
      50: '#fef2f3',
      100: '#fee2e4',
      200: '#fcc4c9',
      300: '#fa9aa3',
      400: '#f56570',
      500: '#e8294a', // PRIMARY ACG RED
      600: '#c0182f', // Hover/Active
      700: '#a01426',
      800: '#841522',
      900: '#6f1721',

      primary: '#e8294a',
      primaryHover: '#c0182f',
      primaryLight: '#fef2f3',
    },

    // ═══ NEUTRALS (Dominant 75% of UI) ═══
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },

    // ═══ STATUS COLORS ═══
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },

    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },

    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },

    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },

    // ═══ FUNCTIONAL ALIASES ═══
    text: {
      primary: '#171717',
      secondary: '#525252',
      tertiary: '#737373',
      disabled: '#a3a3a3',
      link: '#e8294a',
      inverse: '#ffffff',
    },

    bg: {
      page: '#fafafa',
      surface: '#ffffff',
      elevated: '#ffffff',
      subtle: '#f5f5f5',
      accentSubtle: '#fef2f3',
    },

    border: {
      default: '#e5e5e5',
      strong: '#d4d4d4',
      subtle: '#f5f5f5',
      focus: '#e8294a',
    },
  },

  typography: {
    // ═══ FONT FAMILIES ═══
    fontFamily: {
      sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', monospace",
    },

    // ═══ FONT SIZES (8pt base grid) ═══
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },

    // ═══ FONT WEIGHTS ═══
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    // ═══ LINE HEIGHTS ═══
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },

    // ═══ LETTER SPACING ═══
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    },
  },

  spacing: {
    // ═══ SPACING SCALE (4px base) ═══
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    7: '1.75rem',   // 28px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  borderRadius: {
    // ═══ BORDER RADIUS ═══
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },

  shadows: {
    // ═══ SHADOW SYSTEM (Subtle Only) ═══
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    focus: '0 0 0 3px rgba(232, 41, 74, 0.1)', // ACG red focus ring
    none: 'none',
  },

  transitions: {
    // ═══ TRANSITIONS (Subtle, Professional) ═══
    fast: '100ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  zIndex: {
    // ═══ Z-INDEX SCALE ═══
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const

// Type exports for TypeScript
export type Colors = typeof tokens.colors
export type Typography = typeof tokens.typography
export type Spacing = typeof tokens.spacing
export type Shadows = typeof tokens.shadows
