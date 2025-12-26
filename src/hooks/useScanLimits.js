/**
 * useScanLimits Hook
 * Manages scan counting, daily limits, and purchased scans
 * Extracted from App.jsx for maintainability
 */
import { useState, useCallback } from 'react'
import { LIMITS } from '../config/constants'

/**
 * Get today's date string for comparison
 */
const getToday = () => new Date().toDateString()

export default function useScanLimits() {
    // Scans used today (persisted per day)
    const [scansUsed, setScansUsed] = useState(() => {
        const stored = localStorage.getItem('fitrate_scans')
        if (stored) {
            const { date, count } = JSON.parse(stored)
            if (date === getToday()) return count
        }
        return 0
    })

    // Scans remaining today
    const [scansRemaining, setScansRemaining] = useState(() => {
        const stored = localStorage.getItem('fitrate_scans')
        if (stored) {
            const { date, count } = JSON.parse(stored)
            if (date === getToday()) return Math.max(0, LIMITS.TOTAL_FREE_DAILY - count)
        }
        return LIMITS.TOTAL_FREE_DAILY
    })

    // Purchased scans (never expire, from scan packs)
    const [purchasedScans, setPurchasedScans] = useState(() => {
        return parseInt(localStorage.getItem('fitrate_purchased_scans') || '0')
    })

    // Extra scans earned (from referrals, etc.)
    const [extraScans, setExtraScans] = useState(() => {
        return parseInt(localStorage.getItem('fitrate_extra_scans') || '0')
    })

    /**
     * Increment the scan count for today
     */
    const incrementScanCount = useCallback(() => {
        const today = getToday()
        const stored = localStorage.getItem('fitrate_scans')
        let count = 1
        if (stored) {
            const { date, count: storedCount } = JSON.parse(stored)
            if (date === today) count = storedCount + 1
        }
        localStorage.setItem('fitrate_scans', JSON.stringify({ date: today, count }))
        setScansUsed(count)
        setScansRemaining(Math.max(0, LIMITS.FREE_SCANS_DAILY - count))
    }, [])

    /**
     * Use a purchased scan (decrement from purchased pool)
     */
    const usePurchasedScan = useCallback(() => {
        if (purchasedScans > 0) {
            const newCount = purchasedScans - 1
            localStorage.setItem('fitrate_purchased_scans', newCount.toString())
            setPurchasedScans(newCount)
            return true
        }
        return false
    }, [purchasedScans])

    /**
     * Add purchased scans (from scan pack purchase)
     */
    const addPurchasedScans = useCallback((count) => {
        const newTotal = purchasedScans + count
        localStorage.setItem('fitrate_purchased_scans', newTotal.toString())
        setPurchasedScans(newTotal)
    }, [purchasedScans])

    /**
     * Check if user can scan (has remaining daily OR purchased scans)
     */
    const canScan = scansRemaining > 0 || purchasedScans > 0 || extraScans > 0

    /**
     * Get total available scans
     */
    const totalAvailable = scansRemaining + purchasedScans + extraScans

    return {
        // State
        scansUsed,
        scansRemaining,
        setScansRemaining,
        purchasedScans,
        setPurchasedScans,
        extraScans,
        setExtraScans,

        // Computed
        canScan,
        totalAvailable,

        // Actions
        incrementScanCount,
        usePurchasedScan,
        addPurchasedScans
    }
}
