/**
 * Haptics Utility
 * 
 * Centralized haptic feedback patterns for consistent premium feel
 * Uses navigator.vibrate where available, graceful fallback otherwise
 */

// Check if haptics are available
const isHapticsAvailable = () => typeof navigator !== 'undefined' && 'vibrate' in navigator

/**
 * Haptic patterns for different interactions
 * Values are in milliseconds [vibrate, pause, vibrate, ...]
 */
const PATTERNS = {
    // Light tap - for button presses
    tap: [15],

    // Success - for completed actions, reactions
    success: [30, 20, 30],

    // Error - for failed actions
    error: [50, 30, 50, 30, 50],

    // Heavy - for important confirmations
    heavy: [50],

    // Selection - for toggles, selections
    selection: [10],

    // Impact - for collisions, drops
    impact: [40, 15, 20],

    // Notification - for alerts
    notification: [30, 50, 30],

    // Score reveal - building anticipation
    scoreReveal: [10, 50, 20, 50, 30, 50, 50],

    // Battle win - celebration
    win: [50, 30, 50, 30, 100],

    // Reaction sent - quick confirmation
    reaction: [20, 10, 20]
}

/**
 * Trigger haptic feedback
 * @param {string|number[]} pattern - Pattern name or custom pattern array
 */
export function haptic(pattern = 'tap') {
    if (!isHapticsAvailable()) return

    const vibrationPattern = typeof pattern === 'string'
        ? PATTERNS[pattern] || PATTERNS.tap
        : pattern

    try {
        navigator.vibrate(vibrationPattern)
    } catch (err) {
        // Silently fail - haptics are enhancement only
    }
}

// Convenience exports for common patterns
export const hapticTap = () => haptic('tap')
export const hapticSuccess = () => haptic('success')
export const hapticError = () => haptic('error')
export const hapticHeavy = () => haptic('heavy')
export const hapticSelection = () => haptic('selection')
export const hapticImpact = () => haptic('impact')
export const hapticNotification = () => haptic('notification')
export const hapticReaction = () => haptic('reaction')
export const hapticWin = () => haptic('win')
export const hapticScoreReveal = () => haptic('scoreReveal')

// Default export for simple usage
export default {
    tap: hapticTap,
    success: hapticSuccess,
    error: hapticError,
    heavy: hapticHeavy,
    selection: hapticSelection,
    impact: hapticImpact,
    notification: hapticNotification,
    reaction: hapticReaction,
    win: hapticWin,
    scoreReveal: hapticScoreReveal,
    custom: haptic
}
