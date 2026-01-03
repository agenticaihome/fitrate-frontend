import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { getDisplayName } from '../utils/displayNameStorage'
import { syncWardrobeToBackend, getWardrobe } from './WardrobeSetup'

// ============================================
// WARDROBE WARS MATCHMAKING QUEUE
// ============================================
export default function WardrobeQueue({
    userId,
    onMatchFound,
    onCancel,
    playSound,
    vibrate,
    color = '#9b59b6'
}) {
    const [status, setStatus] = useState('syncing') // syncing | searching | matched | expired | error
    const [waitTime, setWaitTime] = useState(0)
    const [position, setPosition] = useState(null)
    const [matchData, setMatchData] = useState(null)
    const [dots, setDots] = useState('')
    const pollIntervalRef = useRef(null)
    const startTimeRef = useRef(Date.now())

    const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')

    // Animate dots
    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.')
        }, 500)
        return () => clearInterval(interval)
    }, [])

    // Join queue and start polling
    useEffect(() => {
        let mounted = true

        const joinQueue = async () => {
            const displayName = getDisplayName()
            const { outfits } = getWardrobe()

            // First sync wardrobe to backend
            setStatus('syncing')
            playSound?.('whoosh')

            const syncResult = await syncWardrobeToBackend(userId, outfits, displayName)
            if (!syncResult.success) {
                setStatus('error')
                return
            }

            // Now join matchmaking queue
            setStatus('searching')
            playSound?.('whoosh')

            try {
                const response = await fetch(`${API_BASE}/wardrobe/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, displayName })
                })

                if (!response.ok) {
                    const data = await response.json()
                    console.error('[WardrobeQueue] Join failed:', data.message)
                    setStatus('error')
                    return
                }

                const data = await response.json()

                if (data.status === 'matched') {
                    // Immediate match!
                    handleMatchFound(data)
                } else {
                    // Start polling
                    setPosition(data.position)
                    startPolling()
                }
            } catch (e) {
                console.error('[WardrobeQueue] Join error:', e)
                setStatus('error')
            }
        }

        joinQueue()

        return () => {
            mounted = false
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
            }
        }
    }, [userId])

    const startPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
        }

        pollIntervalRef.current = setInterval(async () => {
            // Update local wait time
            setWaitTime(Math.floor((Date.now() - startTimeRef.current) / 1000))

            try {
                const response = await fetch(`${API_BASE}/wardrobe/poll?userId=${encodeURIComponent(userId)}`)
                const data = await response.json()

                if (data.status === 'matched') {
                    clearInterval(pollIntervalRef.current)
                    handleMatchFound(data)
                } else if (data.status === 'expired') {
                    clearInterval(pollIntervalRef.current)
                    setStatus('expired')
                } else if (data.status === 'waiting') {
                    setPosition(data.position)
                }
            } catch (e) {
                console.error('[WardrobeQueue] Poll error:', e)
            }
        }, 2000) // Poll every 2 seconds
    }, [userId, API_BASE])

    const handleMatchFound = (data) => {
        setStatus('matched')
        setMatchData(data)
        playSound?.('celebrate')
        vibrate?.([100, 50, 100, 50, 200])

        // Short delay before transitioning to battle
        setTimeout(() => {
            onMatchFound?.(data)
        }, 2000)
    }

    const handleCancel = async () => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current)
        }

        try {
            await fetch(`${API_BASE}/wardrobe/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })
        } catch (e) {
            console.error('[WardrobeQueue] Leave error:', e)
        }

        playSound?.('click')
        vibrate?.(15)
        onCancel?.()
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
            style={{
                background: `linear-gradient(180deg, #0a0a1a 0%, ${color}15 50%, #0a0a1a 100%)`
            }}
        >
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.1, 0.2, 0.1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute w-96 h-96 rounded-full blur-3xl"
                    style={{
                        background: `radial-gradient(circle, ${color}, transparent)`,
                        top: '20%',
                        left: '50%',
                        transform: 'translateX(-50%)'
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-8">
                {status === 'syncing' && (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="text-6xl mb-6"
                        >
                            👕
                        </motion.div>
                        <h1 className="text-2xl font-black text-white mb-2">
                            Uploading Wardrobe{dots}
                        </h1>
                        <p className="text-gray-400">Syncing your outfits</p>
                    </>
                )}

                {status === 'searching' && (
                    <>
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="text-6xl mb-6"
                        >
                            🔍
                        </motion.div>
                        <h1 className="text-2xl font-black text-white mb-2">
                            Finding Opponent{dots}
                        </h1>
                        <p className="text-gray-400 mb-6">
                            {position ? `Position in queue: #${position}` : 'Searching for players'}
                        </p>

                        {/* Timer */}
                        <div
                            className="inline-block px-6 py-3 rounded-full mb-8"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            <span className="text-white font-mono text-xl">{formatTime(waitTime)}</span>
                        </div>

                        {/* Animated searching dots */}
                        <div className="flex justify-center gap-2 mb-8">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        scale: [1, 1.5, 1],
                                        opacity: [0.3, 1, 0.3]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: i * 0.2
                                    }}
                                    className="w-3 h-3 rounded-full"
                                    style={{ background: color }}
                                />
                            ))}
                        </div>
                    </>
                )}

                {status === 'matched' && (
                    <>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', damping: 10 }}
                            className="text-6xl mb-6"
                        >
                            ⚔️
                        </motion.div>
                        <h1 className="text-2xl font-black text-white mb-2">
                            Opponent Found!
                        </h1>
                        <p className="text-gray-400 mb-2">
                            vs <span className="text-white font-bold">{matchData?.opponentName || 'Mystery Challenger'}</span>
                        </p>
                        <p className="text-green-400 text-sm">Starting battle...</p>
                    </>
                )}

                {status === 'expired' && (
                    <>
                        <div className="text-6xl mb-6">😢</div>
                        <h1 className="text-2xl font-black text-white mb-2">
                            No Opponents Online
                        </h1>
                        <p className="text-gray-400 mb-6">Try again later or invite friends!</p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-6">⚠️</div>
                        <h1 className="text-2xl font-black text-white mb-2">
                            Connection Error
                        </h1>
                        <p className="text-gray-400 mb-6">Please check your connection</p>
                    </>
                )}
            </div>

            {/* Cancel button */}
            {(status === 'searching' || status === 'syncing' || status === 'expired' || status === 'error') && (
                <button
                    onClick={handleCancel}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 rounded-full font-bold transition-all active:scale-95"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    <span className="text-white">
                        {status === 'expired' || status === 'error' ? '← Back' : '✕ Cancel'}
                    </span>
                </button>
            )}
        </div>
    )
}
