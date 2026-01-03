/**
 * FitRate Design System Theme Constants
 * Single Source of Truth for Colors, Spacing, and UI Tokens
 *
 * Usage: Import these constants instead of hardcoding hex values
 * All colors are WCAG AA compliant for their intended use cases
 */

// ============================================
// BRAND COLORS
// ============================================
export const COLORS = {
    // Primary Brand
    brand: {
        purple: '#A855F7',
        purpleMid: '#8B5CF6',
        blue: '#3B82F6',
        accent: '#00D4FF', // Primary cyan accent
    },

    // Backgrounds (dark theme)
    bg: {
        darkest: '#0a0a12',
        dark: '#0f0f1a',
        card: '#1c1c32',
        elevated: '#282845',
    },

    // Text colors (WCAG AA compliant on dark backgrounds)
    text: {
        primary: '#FFFFFF',
        secondary: 'rgba(255, 255, 255, 0.85)', // For important secondary text
        muted: 'rgba(255, 255, 255, 0.7)',      // For descriptions
        subtle: 'rgba(255, 255, 255, 0.6)',     // For hints/captions
        disabled: 'rgba(255, 255, 255, 0.4)',   // For disabled states only
    },

    // Status colors
    status: {
        success: '#00ff88',
        successDark: '#10b981',
        error: '#ef4444',
        warning: '#ffd700',
        info: '#00d4ff',
    },

    // AI Mode Theme Colors
    modes: {
        nice: { accent: '#00ff88', accent2: '#00d4ff', glow: 'rgba(0, 255, 136, 0.4)' },
        roast: { accent: '#ff6b35', accent2: '#ff0080', glow: 'rgba(255, 107, 53, 0.4)' },
        honest: { accent: '#3b82f6', accent2: '#06b6d4', glow: 'rgba(59, 130, 246, 0.4)' },
        savage: { accent: '#ff1493', accent2: '#ff0066', glow: 'rgba(255, 20, 147, 0.4)' },
        rizz: { accent: '#ff69b4', accent2: '#ff1493', glow: 'rgba(255, 105, 180, 0.4)' },
        celeb: { accent: '#ffd700', accent2: '#ff8c00', glow: 'rgba(255, 215, 0, 0.4)' },
        aura: { accent: '#9b59b6', accent2: '#8b5cf6', glow: 'rgba(155, 89, 182, 0.4)' },
        chaos: { accent: '#ff4444', accent2: '#ff6b6b', glow: 'rgba(255, 68, 68, 0.4)' },
        event: { accent: '#10b981', accent2: '#06b6d4', glow: 'rgba(16, 185, 129, 0.4)' },
        y2k: { accent: '#ff69b4', accent2: '#00d4ff', glow: 'rgba(255, 105, 180, 0.4)' },
        villain: { accent: '#4c1d95', accent2: '#7c3aed', glow: 'rgba(76, 29, 149, 0.4)' },
        coquette: { accent: '#ffb6c1', accent2: '#ff69b4', glow: 'rgba(255, 182, 193, 0.4)' },
        hypebeast: { accent: '#f97316', accent2: '#ea580c', glow: 'rgba(249, 115, 22, 0.4)' },
    },

    // Battle result colors
    battle: {
        win: '#00ff88',
        lose: '#ff4444',
        tie: '#ffd700',
    },
};

// ============================================
// GRADIENTS
// ============================================
export const GRADIENTS = {
    // Primary CTA button gradient
    primary: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',

    // Secondary/accent gradient (purple-pink)
    secondary: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',

    // Brand gradient (full spectrum)
    brand: 'linear-gradient(135deg, #A855F7 0%, #8B5CF6 50%, #3B82F6 100%)',

    // Success gradient
    success: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',

    // Warning/gold gradient
    gold: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',

    // Backgrounds
    bgDark: 'linear-gradient(180deg, #0a0a12 0%, #0f0f1a 100%)',
    bgCard: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)',
    bgModal: 'linear-gradient(180deg, rgba(40,30,60,0.95) 0%, rgba(25,20,45,0.98) 100%)',
};

// ============================================
// SPACING SCALE (in pixels)
// ============================================
export const SPACING = {
    xs: 6,
    sm: 10,
    md: 14,
    lg: 20,
    xl: 28,
    '2xl': 40,
    '3xl': 56,
};

// ============================================
// BORDER RADIUS SCALE (in pixels)
// ============================================
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
};

// ============================================
// SHADOWS
// ============================================
export const SHADOWS = {
    physical: '0 8px 0 rgba(0, 0, 0, 0.2), 0 15px 30px rgba(0, 0, 0, 0.3)',
    glow: {
        cyan: '0 0 20px rgba(0, 212, 255, 0.3)',
        green: '0 0 20px rgba(0, 255, 136, 0.3)',
        purple: '0 0 20px rgba(168, 85, 247, 0.3)',
        gold: '0 0 20px rgba(255, 215, 0, 0.3)',
    },
    button: '0 4px 20px rgba(0, 212, 255, 0.3)',
    card: '0 10px 40px rgba(0, 0, 0, 0.3)',
    modal: '0 25px 100px rgba(0, 0, 0, 0.4)',
};

// ============================================
// TRANSITIONS (in seconds)
// ============================================
export const TRANSITIONS = {
    instant: '0.1s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: '0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
    normal: '0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

// ============================================
// BUTTON STYLES (composable objects for inline styles)
// ============================================
export const BUTTON_STYLES = {
    // Primary CTA (cyan-green gradient)
    primary: {
        background: GRADIENTS.primary,
        color: '#000',
        boxShadow: SHADOWS.button,
    },

    // Secondary (purple-pink gradient)
    secondary: {
        background: GRADIENTS.secondary,
        color: '#fff',
        boxShadow: '0 8px 30px rgba(168,85,247,0.4)',
    },

    // Ghost/outline button
    ghost: {
        background: 'rgba(255, 255, 255, 0.05)',
        color: '#fff',
        border: '1px solid rgba(255, 255, 255, 0.1)',
    },

    // Disabled state
    disabled: {
        background: 'rgba(255, 255, 255, 0.1)',
        color: 'rgba(255, 255, 255, 0.4)',
        cursor: 'not-allowed',
    },
};

// ============================================
// GLASS EFFECT STYLES
// ============================================
export const GLASS = {
    default: {
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
    },
    strong: {
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(30px) saturate(200%)',
        WebkitBackdropFilter: 'blur(30px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
    },
};

// ============================================
// Z-INDEX SCALE
// ============================================
export const Z_INDEX = {
    base: 0,
    dropdown: 10,
    sticky: 20,
    fixed: 30,
    modal: 40,
    popover: 50,
    toast: 100,
};

// ============================================
// ACCESSIBILITY
// ============================================
export const A11Y = {
    // Minimum touch target size (44x44 for iOS, 48x48 for Android)
    minTouchTarget: 44,

    // Focus ring color
    focusRing: '#00d4ff',
    focusRingAlt: '#00ff88',

    // Minimum contrast ratio for text
    minContrastRatio: 4.5,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get mode colors by mode name
 * @param {string} mode - Mode name (nice, roast, honest, etc.)
 * @returns {object} Color object with accent, accent2, glow
 */
export const getModeColors = (mode) => {
    return COLORS.modes[mode?.toLowerCase()] || COLORS.modes.nice;
};

/**
 * Get gradient style for a mode
 * @param {string} mode - Mode name
 * @returns {string} CSS gradient string
 */
export const getModeGradient = (mode) => {
    const colors = getModeColors(mode);
    return `linear-gradient(135deg, ${colors.accent} 0%, ${colors.accent2} 100%)`;
};

export default {
    COLORS,
    GRADIENTS,
    SPACING,
    RADIUS,
    SHADOWS,
    TRANSITIONS,
    BUTTON_STYLES,
    GLASS,
    Z_INDEX,
    A11Y,
    getModeColors,
    getModeGradient,
};
