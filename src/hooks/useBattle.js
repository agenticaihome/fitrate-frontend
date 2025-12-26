/**
 * useBattle Hook
 * Manages 1v1 battle/challenge party state and API interactions
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
 * Get challenge ID from URL path or query params
 */
const getChallengeIdFromUrl = () => {
    const path = window.location.pathname
    const pathMatch = path.match(/^\/c\/([a-zA-Z0-9_-]+)$/)
    if (pathMatch) return pathMatch[1]

    const params = new URLSearchParams(window.location.search)
    const queryId = params.get('challenge_id')
    if (queryId) return queryId

    return null
}

export default function useBattle() {
    // Challenge party ID (from URL)
    const [challengePartyId, setChallengePartyId] = useState(getChallengeIdFromUrl)

    // Challenge party data from API
    const [challengePartyData, setChallengePartyData] = useState(null)

    // Loading state - start loading immediately if we have an ID
    const [challengePartyLoading, setChallengePartyLoading] = useState(() => !!getChallengeIdFromUrl())

    // Is current user the creator?
    const [isCreatorOfChallenge, setIsCreatorOfChallenge] = useState(false)

    // Store last analyzed thumbnail for battle photos
    const [lastAnalyzedThumb, setLastAnalyzedThumb] = useState(null)

    /**
     * Fetch challenge party data from API
     */
    const fetchChallengeParty = useCallback(async (id) => {
        const battleId = id || challengePartyId
        if (!battleId) return

        setChallengePartyLoading(true)
        try {
            const res = await fetch(`${API_BASE}/battle/${battleId}`, {
                headers: getApiHeaders()
            })
            if (res.ok) {
                const data = await res.json()
                setChallengePartyData(data)
                // Check if current user created this challenge
                const createdChallenges = JSON.parse(localStorage.getItem('fitrate_created_challenges') || '[]')
                setIsCreatorOfChallenge(createdChallenges.includes(battleId))
            } else {
                setChallengePartyData(null)
            }
        } catch (err) {
            console.error('[Challenge] Fetch error:', err)
            setChallengePartyData(null)
        } finally {
            setChallengePartyLoading(false)
        }
    }, [challengePartyId])

    /**
     * Refresh challenge party data
     */
    const refreshChallengeParty = useCallback(async () => {
        if (!challengePartyId) return
        setChallengePartyLoading(true)
        try {
            const res = await fetch(`${API_BASE}/battle/${challengePartyId}`, {
                headers: getApiHeaders()
            })
            if (res.ok) {
                const data = await res.json()
                setChallengePartyData(data)
            }
        } catch (err) {
            console.error('[Challenge] Refresh error:', err)
        } finally {
            setChallengePartyLoading(false)
        }
    }, [challengePartyId])

    /**
     * Clear battle state (when leaving battle screen)
     */
    const clearBattle = useCallback(() => {
        setChallengePartyId(null)
        setChallengePartyData(null)
        setIsCreatorOfChallenge(false)
        // Clean URL
        window.history.replaceState({}, '', '/')
    }, [])

    // Fetch battle data when ID changes
    useEffect(() => {
        if (challengePartyId) {
            fetchChallengeParty(challengePartyId)
        }
    }, [challengePartyId, fetchChallengeParty])

    return {
        // State
        challengePartyId,
        setChallengePartyId,
        challengePartyData,
        setChallengePartyData,
        challengePartyLoading,
        isCreatorOfChallenge,
        setIsCreatorOfChallenge,
        lastAnalyzedThumb,
        setLastAnalyzedThumb,

        // Actions
        fetchChallengeParty,
        refreshChallengeParty,
        clearBattle,

        // API helpers
        API_BASE,
        getApiHeaders
    }
}
