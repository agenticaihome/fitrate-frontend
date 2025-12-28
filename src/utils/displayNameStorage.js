// ============================================
// DISPLAY NAME STORAGE
// Manages user display names in localStorage
// ============================================

const STORAGE_KEY = 'fitrate_display_name'

// Fun adjective + noun combinations for suggested names
const ADJECTIVES = [
    'Stylish', 'Dripped', 'Fresh', 'Clean', 'Bold', 'Fierce', 'Sleek', 'Iconic',
    'Drippy', 'Crispy', 'Wavy', 'Icy', 'Fire', 'Elite', 'Glowing', 'Royal'
]

const NOUNS = [
    'Fox', 'Tiger', 'Eagle', 'Wolf', 'Falcon', 'Phoenix', 'Panther', 'Hawk',
    'King', 'Queen', 'Legend', 'Boss', 'Vibe', 'Aura', 'Star', 'Crown'
]

/**
 * Get the stored display name
 * @returns {string|null}
 */
export const getDisplayName = () => {
    try {
        return localStorage.getItem(STORAGE_KEY)
    } catch {
        return null
    }
}

/**
 * Set the display name
 * @param {string} name - The display name to store
 */
export const setDisplayName = (name) => {
    try {
        const cleaned = sanitizeDisplayName(name)
        if (cleaned) {
            localStorage.setItem(STORAGE_KEY, cleaned)
        }
    } catch (err) {
        console.error('Failed to save display name:', err)
    }
}

/**
 * Check if a display name has been set
 * @returns {boolean}
 */
export const hasDisplayName = () => {
    return !!getDisplayName()
}

/**
 * Generate a suggested random name
 * @param {string} userId - User ID for consistent randomization (optional)
 * @returns {string}
 */
export const generateSuggestedName = (userId = null) => {
    let hash = Date.now()

    if (userId) {
        // Use userId to generate a semi-consistent hash
        hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    }

    const adj = ADJECTIVES[(hash * 7) % ADJECTIVES.length]
    const noun = NOUNS[(hash * 13) % NOUNS.length]

    return `${adj}${noun}`
}

/**
 * Sanitize and validate a display name
 * Rules:
 * - 3-15 characters
 * - Alphanumeric, spaces, emojis, and basic punctuation allowed
 * - No HTML/script tags
 * @param {string} name - Raw input name
 * @returns {string|null} - Cleaned name or null if invalid
 */
export const sanitizeDisplayName = (name) => {
    if (!name || typeof name !== 'string') return null

    // Remove any HTML tags
    let cleaned = name.replace(/<[^>]*>/g, '')

    // Trim whitespace
    cleaned = cleaned.trim()

    // Check length
    if (cleaned.length < 3 || cleaned.length > 15) {
        return null
    }

    return cleaned
}

/**
 * Validate a display name without sanitizing
 * @param {string} name - Name to validate
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateDisplayName = (name) => {
    if (!name || typeof name !== 'string') {
        return { valid: false, error: 'Name is required' }
    }

    const trimmed = name.trim()

    if (trimmed.length < 3) {
        return { valid: false, error: 'Name must be at least 3 characters' }
    }

    if (trimmed.length > 15) {
        return { valid: false, error: 'Name must be 15 characters or less' }
    }

    // Check for HTML tags
    if (/<[^>]*>/.test(trimmed)) {
        return { valid: false, error: 'Invalid characters' }
    }

    return { valid: true, error: null }
}
