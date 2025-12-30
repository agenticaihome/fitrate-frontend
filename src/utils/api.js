/**
 * API Configuration and Helpers
 * Extracted from App.jsx for maintainability
 */

// API endpoints
export const API_URL = import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze'
export const API_BASE = API_URL.replace('/api/analyze', '/api')

// SECURITY: API key for authenticated requests (set in environment)
const API_KEY = import.meta.env.VITE_API_KEY || ''

/**
 * Get headers for authenticated API requests
 */
export const getApiHeaders = () => ({
    'Content-Type': 'application/json',
    ...(API_KEY && { 'X-API-Key': API_KEY })
})

/**
 * Make an authenticated API request with retry logic (P4.2)
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @param {number} retries - Number of retries (default 2)
 */
export const apiRequest = async (endpoint, options = {}, retries = 2) => {
    let lastError

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers: {
                    ...getApiHeaders(),
                    ...options.headers
                }
            })

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`)
            }

            return response.json()
        } catch (error) {
            lastError = error
            console.warn(`[API] Attempt ${attempt + 1} failed for ${endpoint}:`, error.message)

            // Don't retry on last attempt or for client errors (4xx)
            if (attempt < retries && !error.message.includes('4')) {
                // Exponential backoff: 500ms, 1000ms
                await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)))
            }
        }
    }

    // All retries failed - throw for caller to handle
    throw lastError
}

/**
 * Safe API request that returns null on failure instead of throwing (P4.2)
 * Useful for non-critical data fetching
 */
export const safeApiRequest = async (endpoint, options = {}, retries = 1) => {
    try {
        return await apiRequest(endpoint, options, retries)
    } catch (error) {
        console.warn(`[API] Safe request failed for ${endpoint}:`, error.message)
        return null
    }
}

/**
 * Get the start of the current week (Monday) as ISO date string
 */
export const getWeekStart = (date = new Date()) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d.toISOString().split('T')[0]
}

/**
 * Detect in-app browser (Twitter/Instagram/etc WebViews break PWAs)
 */
export const detectInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera
    if (/Twitter/i.test(ua)) return 'Twitter'
    if (/Instagram/i.test(ua)) return 'Instagram'
    if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook'
    if (/TikTok/i.test(ua) || /BytedanceWebview/i.test(ua)) return 'TikTok'
    if (/LinkedIn/i.test(ua)) return 'LinkedIn'
    if (/Snapchat/i.test(ua)) return 'Snapchat'
    return null
}

/**
 * Random share tips for virality
 */
const SHARE_TIPS = [
    "Challenge a friend to beat this 👀",
    "Share with friends 📸",
    "Tag someone who needs a rating",
    "Send this to your group chat",
    "Show your friends this score",
    "Think you can do better? Try again!",
    "Bet a friend can't beat this 🔥",
    "Send to someone stylish",
    "Share your results!",
    "Get your friends to try it too",
    "Compare scores with friends",
    "Who has the best style? Find out!"
]

export const getRandomShareTip = () => SHARE_TIPS[Math.floor(Math.random() * SHARE_TIPS.length)]

/**
 * Social proof percentile (used by both mock scores and real AI results)
 */
export const getPercentile = (score) => {
    if (score >= 95) return 99
    if (score >= 90) return 96
    if (score >= 85) return 91
    if (score >= 80) return 84
    if (score >= 75) return 73
    if (score >= 70) return 61
    if (score >= 65) return 48
    if (score >= 60) return 35
    return Math.floor(score * 0.4)
}

/**
 * Aesthetics for mock scores
 */
export const AESTHETICS = [
    'Clean Girl', 'Dark Academia', 'Quiet Luxury', 'Streetwear', 'Y2K',
    'Cottagecore', 'Minimalist', 'Coastal Grandmother', 'Grunge', 'Preppy',
    'Gorpcore', 'Balletcore', 'Old Money', 'Skater', 'Bohemian'
]

export const CELEB_VIBES = [
    'Zendaya at the Met Gala', 'Timothée off-duty', 'Billie Eilish grunge era',
    'Harry Styles on tour', 'Kendall Jenner model off-duty', 'Tyler the Creator at Coachella',
    'Dua Lipa going to dinner', 'Jacob Elordi casual', 'Sydney Sweeney brunch'
]
