/**
 * FashionShowRunway Screen
 * 
 * The main "stage" of a Fashion Show:
 * - Show name + countdown timer
 * - "Walk the Runway" CTA
 * - Live scoreboard
 * - Activity feed
 */

import React, { useState, useEffect, useCallback } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

export default function FashionShowRunway({
    showId,
    showData,
    userId,
    nickname,
    emoji,
    isPro,
    walksUsed = 0,
    walksAllowed = 1,
    onWalkRunway,
    onShare,
    onBack
}) {
    const [scoreboard, setScoreboard] = useState(showData?.scoreboard || [])
    const [activity, setActivity] = useState(showData?.activity || [])
    const [timeRemaining, setTimeRemaining] = useState(showData?.timeRemaining || 0)
    const [polling, setPolling] = useState(true)

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/analyze', '/api') || 'https://fitrate-production.up.railway.app/api'

    // Format time remaining
    const formatTime = (ms) => {
        if (ms <= 0) return 'Ended'

        const hours = Math.floor(ms / (1000 * 60 * 60))
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((ms % (1000 * 60)) / 1000)

        if (hours >= 24) {
            const days = Math.floor(hours / 24)
            return `${days}d ${hours % 24}h`
        }

        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Poll scoreboard every 10 seconds
    useEffect(() => {
        if (!polling) return

        const fetchScoreboard = async () => {
            try {
                const res = await fetch(`${API_BASE}/show/${showId}/scoreboard`)
                if (res.ok) {
                    const data = await res.json()
                    setScoreboard(data.scoreboard || [])
                    setActivity(data.activity || [])
                }
            } catch (err) {
                console.error('[FashionShow] Scoreboard poll error:', err)
            }
        }

        const interval = setInterval(fetchScoreboard, 10000)
        return () => clearInterval(interval)
    }, [showId, polling])

    const canWalk = walksUsed < walksAllowed && timeRemaining > 0
    const hasWalked = walksUsed > 0

    // Find user's rank
    const userRank = scoreboard.findIndex(e => e.userId === userId) + 1

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col">
            {/* Header */}
            <div className="pt-safe px-4 py-4 flex items-center justify-between">
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        onBack?.()
                    }}
                    className="text-white/60 text-sm"
                >
                    ← Exit
                </button>
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        onShare?.()
                    }}
                    className="text-white/60 text-sm flex items-center gap-1"
                >
                    Share 📤
                </button>
            </div>

            {/* Show Header */}
            <div className="px-4 text-center mb-6">
                <h1 className="text-2xl font-black text-white mb-1">
                    🎭 {showData?.name || 'Fashion Show'}
                </h1>
                <div className="flex items-center justify-center gap-3 text-sm">
                    <span className="text-white/50">{showData?.vibeLabel}</span>
                    {showData?.familySafe && (
                        <span className="text-green-400 text-xs">Family Safe ✅</span>
                    )}
                </div>
                {/* Countdown */}
                <div className="mt-2 text-white/60 text-sm">
                    ⏰ {formatTime(timeRemaining)} remaining
                </div>
            </div>

            {/* Walk CTA */}
            <div className="px-4 mb-6">
                <button
                    onClick={() => {
                        if (canWalk) {
                            playSound('click')
                            vibrate(30)
                            onWalkRunway?.()
                        }
                    }}
                    disabled={!canWalk}
                    className={`w-full py-6 rounded-3xl font-black text-xl flex flex-col items-center justify-center gap-1 transition-all ${canWalk
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 active:scale-[0.98]'
                            : 'bg-white/10 text-white/30'
                        }`}
                >
                    {!canWalk && hasWalked ? (
                        <>
                            <span className="text-3xl">✅</span>
                            <span>You've Walked!</span>
                            <span className="text-sm font-normal text-white/50">
                                {userRank > 0 ? `You're #${userRank}` : 'Waiting for results...'}
                            </span>
                        </>
                    ) : !canWalk && timeRemaining <= 0 ? (
                        <>
                            <span className="text-3xl">🏁</span>
                            <span>Show Ended</span>
                        </>
                    ) : (
                        <>
                            <span className="text-3xl">📸</span>
                            <span>Walk the Runway</span>
                            {walksAllowed > 1 && (
                                <span className="text-sm font-normal text-white/60">
                                    {walksUsed}/{walksAllowed} walks used
                                </span>
                            )}
                        </>
                    )}
                </button>

                {/* Pro upgrade hint */}
                {hasWalked && !isPro && walksUsed >= walksAllowed && (
                    <p className="text-center text-yellow-400/70 text-xs mt-2">
                        ✨ Pro members get 3 walks per show
                    </p>
                )}
            </div>

            {/* Scoreboard */}
            <div className="px-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-black text-white/60 uppercase tracking-widest">
                        📊 Scoreboard
                    </h2>
                    <span className="text-xs text-white/40">
                        {scoreboard.length} {scoreboard.length === 1 ? 'entry' : 'entries'}
                    </span>
                </div>

                {scoreboard.length === 0 ? (
                    <div className="text-center py-8 text-white/30 text-sm">
                        No walks yet — be the first! 🎭
                    </div>
                ) : (
                    <div className="space-y-2">
                        {scoreboard.slice(0, 10).map((entry, idx) => {
                            const isUser = entry.userId === userId
                            const rankEmoji = idx === 0 ? '👑' : idx === 1 ? '🔥' : idx === 2 ? '⭐' : `#${idx + 1}`
                            return (
                                <div
                                    key={`${entry.userId}-${entry.walkedAt}`}
                                    className={`flex items-center gap-3 p-3 rounded-xl ${isUser
                                            ? 'bg-purple-500/20 border border-purple-500/30'
                                            : 'bg-white/5'
                                        }`}
                                >
                                    <span className="text-lg w-8 text-center">
                                        {typeof rankEmoji === 'string' ? rankEmoji : rankEmoji}
                                    </span>
                                    <span className="text-xl">{entry.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-semibold truncate">
                                            {entry.nickname}
                                            {isUser && <span className="text-purple-400 ml-1">(you)</span>}
                                        </div>
                                        {entry.verdict && (
                                            <div className="text-white/50 text-xs truncate">
                                                "{entry.verdict}"
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xl font-black text-white">
                                        {entry.score?.toFixed(1)}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Activity Feed */}
            {activity.length > 0 && (
                <div className="px-4 pb-8">
                    <h2 className="text-sm font-black text-white/60 uppercase tracking-widest mb-3">
                        📢 Activity
                    </h2>
                    <div className="space-y-2">
                        {activity.slice(0, 5).map((a, idx) => (
                            <div
                                key={idx}
                                className="text-sm text-white/50 flex items-center gap-2"
                            >
                                <span>{a.emoji}</span>
                                <span>
                                    <strong className="text-white/70">{a.nickname}</strong>
                                    {' '}just walked the runway
                                    {a.score && ` — ${a.score.toFixed(1)}`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
