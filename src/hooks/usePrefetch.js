import { useEffect, useRef } from 'react'

/**
 * Data Prefetching Hook
 * Prefetches API data in the background for instant navigation
 */

const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')

// Cache for prefetched data
const prefetchCache = new Map()
const CACHE_TTL = 60000 // 1 minute

/**
 * Get cached data if still valid
 */
function getCached(key) {
    const cached = prefetchCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
    }
    return null
}

/**
 * Set cache with timestamp
 */
function setCache(key, data) {
    prefetchCache.set(key, { data, timestamp: Date.now() })
}

/**
 * Prefetch data with deduplication
 */
async function prefetchData(url, key) {
    // Check if already cached
    if (getCached(key)) return

    try {
        const res = await fetch(url)
        if (res.ok) {
            const data = await res.json()
            setCache(key, data)
            console.log(`[Prefetch] ✓ Cached: ${key}`)
        }
    } catch (err) {
        console.warn(`[Prefetch] Failed: ${key}`, err.message)
    }
}

/**
 * Hook to prefetch common data on app mount
 * @param {string} userId - Current user ID
 */
export function usePrefetchData(userId) {
    const hasPrefetched = useRef(false)

    useEffect(() => {
        if (!userId || hasPrefetched.current) return
        hasPrefetched.current = true

        // Delay prefetch to not block initial render
        const timeout = setTimeout(() => {
            // Prefetch arena leaderboard
            prefetchData(
                `${API_BASE}/arena/leaderboard?userId=${userId}`,
                'arena-leaderboard'
            )

            // Prefetch daily leaderboard
            prefetchData(
                `${API_BASE}/leaderboard/today?userId=${encodeURIComponent(userId)}`,
                'daily-leaderboard'
            )

            // Prefetch arena stats
            prefetchData(
                `${API_BASE}/arena/stats`,
                'arena-stats'
            )

            // Prefetch streak status
            prefetchData(
                `${API_BASE}/streak/status?userId=${userId}`,
                'streak-status'
            )

            // Prefetch current event
            prefetchData(
                `${API_BASE}/event`,
                'current-event'
            )
        }, 1000) // Wait 1s after mount

        return () => clearTimeout(timeout)
    }, [userId])
}

/**
 * Get prefetched data from cache
 * @param {string} key - Cache key
 * @returns {any} Cached data or null
 */
export function getPrefetchedData(key) {
    return getCached(key)
}

/**
 * Clear all prefetch cache
 */
export function clearPrefetchCache() {
    prefetchCache.clear()
}

export default { usePrefetchData, getPrefetchedData, clearPrefetchCache }
