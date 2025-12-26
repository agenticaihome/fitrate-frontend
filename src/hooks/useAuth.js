/**
 * useAuth Hook
 * Manages user authentication, Pro status, and identity
 * Extracted from App.jsx for maintainability
 */
import { useState, useEffect, useCallback } from 'react'

// API config
const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')
const API_KEY = import.meta.env.VITE_API_KEY || ''

const getApiHeaders = () => {
    const headers = { 'Content-Type': 'application/json' }
    if (API_KEY) headers['X-API-Key'] = API_KEY
    return headers
}

/**
 * Generate a secure user ID
 */
const generateUserId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID()
    } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const arr = new Uint8Array(16)
        crypto.getRandomValues(arr)
        return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
    } else {
        return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
    }
}

export default function useAuth() {
    // User ID - cryptographically secure, persisted
    const [userId] = useState(() => {
        let id = localStorage.getItem('fitrate_user_id')
        if (!id) {
            id = generateUserId()
            localStorage.setItem('fitrate_user_id', id)
        }
        return id
    })

    // Pro status
    const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')
    const [proEmail, setProEmail] = useState('')
    const [emailChecking, setEmailChecking] = useState(false)

    // Referral tracking
    const [referralCount, setReferralCount] = useState(0)
    const [totalReferrals, setTotalReferrals] = useState(() =>
        parseInt(localStorage.getItem('fitrate_total_referrals') || '0')
    )

    // Pro Roasts available (from referrals or purchase)
    const [proRoasts, setProRoasts] = useState(0)

    /**
     * Check if user is Pro (via Email OR UserId)
     */
    const checkProStatus = useCallback(async (emailToCheck) => {
        try {
            setEmailChecking(true)
            const payload = {
                userId,
                email: emailToCheck || undefined
            }

            const response = await fetch(`${API_BASE}/pro/check`, {
                method: 'POST',
                headers: getApiHeaders(),
                body: JSON.stringify(payload)
            })
            const data = await response.json()

            if (data.isPro) {
                localStorage.setItem('fitrate_pro', 'true')
                setIsPro(true)

                if (data.email) {
                    const cleanEmail = data.email.toLowerCase().trim()
                    localStorage.setItem('fitrate_email', cleanEmail)
                    setProEmail(cleanEmail)
                }
                return true
            }
            return false
        } catch (err) {
            console.error('Pro check error:', err)
            return false
        } finally {
            setEmailChecking(false)
        }
    }, [userId])

    // Check Pro status on mount
    useEffect(() => {
        if (!isPro) {
            const savedEmail = localStorage.getItem('fitrate_email')
            checkProStatus(savedEmail)
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return {
        // User identity
        userId,

        // Pro status
        isPro,
        setIsPro,
        proEmail,
        setProEmail,
        emailChecking,
        checkProStatus,

        // Referrals
        referralCount,
        setReferralCount,
        totalReferrals,
        setTotalReferrals,

        // Pro Roasts
        proRoasts,
        setProRoasts,

        // API helpers (for other hooks)
        API_BASE,
        getApiHeaders
    }
}
