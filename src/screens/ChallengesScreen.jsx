import React, { useState, useEffect, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { formatTimeRemaining } from '../utils/dateUtils'
import BottomNav from '../components/common/BottomNav'

// All 12 AI modes for rotating daily challenge
const DAILY_MODES = [
    { id: 'nice', emoji: '😇', label: 'Nice', desc: 'Supportive & encouraging', color: 'cyan' },
    { id: 'roast', emoji: '🔥', label: 'Roast', desc: 'Brutally honest', color: 'orange' },
    { id: 'honest', emoji: '📊', label: 'Honest', desc: 'Balanced analysis', color: 'blue' },
    { id: 'savage', emoji: '💀', label: 'Savage', desc: 'No mercy', color: 'purple' },
    { id: 'rizz', emoji: '😏', label: 'Rizz', desc: 'Dating vibes', color: 'pink' },
    { id: 'celeb', emoji: '⭐', label: 'Celebrity', desc: 'Star treatment', color: 'yellow' },
    { id: 'aura', emoji: '🔮', label: 'Aura', desc: 'Mystical energy', color: 'violet' },
    { id: 'chaos', emoji: '🎪', label: 'Chaos', desc: 'Unhinged chaos', color: 'red' },
    { id: 'y2k', emoji: '💎', label: 'Y2K', desc: "That's hot", color: 'hotpink' },
    { id: 'villain', emoji: '🖤', label: 'Villain', desc: 'Main villain energy', color: 'indigo' },
    { id: 'coquette', emoji: '🎀', label: 'Coquette', desc: 'Soft & romantic', color: 'lightpink' },
    { id: 'hypebeast', emoji: '👟', label: 'Hypebeast', desc: 'Certified drip', color: 'darkorange' }
]

// Get today's rotating mode based on day of year
const getDailyMode = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    return DAILY_MODES[dayOfYear % DAILY_MODES.length]
}

// Color mappings for mode pill
const MODE_COLORS = {
    nice: { bg: 'rgba(0,212,255,0.2)', border: 'rgba(0,212,255,0.4)', text: '#00d4ff' },
    roast: { bg: 'rgba(255,68,68,0.2)', border: 'rgba(255,68,68,0.4)', text: '#ff6b35' },
    honest: { bg: 'rgba(59,130,246,0.2)', border: 'rgba(59,130,246,0.4)', text: '#3b82f6' },
    savage: { bg: 'rgba(139,0,255,0.2)', border: 'rgba(139,0,255,0.4)', text: '#8b00ff' },
    rizz: { bg: 'rgba(255,105,180,0.2)', border: 'rgba(255,105,180,0.4)', text: '#ff69b4' },
    celeb: { bg: 'rgba(255,215,0,0.2)', border: 'rgba(255,215,0,0.4)', text: '#ffd700' },
    aura: { bg: 'rgba(155,89,182,0.2)', border: 'rgba(155,89,182,0.4)', text: '#9b59b6' },
    chaos: { bg: 'rgba(255,107,107,0.2)', border: 'rgba(255,107,107,0.4)', text: '#ff6b6b' },
    y2k: { bg: 'rgba(255,105,180,0.2)', border: 'rgba(255,105,180,0.4)', text: '#ff69b4' },
    villain: { bg: 'rgba(76,29,149,0.2)', border: 'rgba(76,29,149,0.4)', text: '#4c1d95' },
    coquette: { bg: 'rgba(255,182,193,0.2)', border: 'rgba(255,182,193,0.4)', text: '#ffb6c1' },
    hypebeast: { bg: 'rgba(249,115,22,0.2)', border: 'rgba(249,115,22,0.4)', text: '#f97316' }
}

/**
 * ChallengesScreen
 *
 * Combined view for Daily + Weekly challenges with scan rewards:
 * - Daily: 🥇10 / 🥈🥉5 / 4-10: 2 / Top 25%: 1 scan
 * - Weekly: 🥇50 / 🥈🥉25 / 4-10: 10 / Top 25%: 3 scans
 * - Arena: 🥇25 / 🥈🥉15 / 4-10: 5 scans
 */
export default function ChallengesScreen({
    // Daily challenge props
    dailyLeaderboard = [],
    userDailyRank,
    // Weekly challenge props
    currentEvent,
    weeklyLeaderboard = [],
    userEventStatus,
    userId,
    isPro,
    freeEventEntryUsed,
    // Actions
    onCompeteDaily,
    onCompeteWeekly,
    onShowPaywall,
    onShowFullLeaderboard,
    onBack,
    onOpenArena,
    // Data fetching
    fetchDailyLeaderboard,
    fetchWeeklyLeaderboard
}) {
    const [activeTab, setActiveTab] = useState('daily')
    const [dailyTimeRemaining, setDailyTimeRemaining] = useState('')

    // Calculate time until midnight for daily reset
    // Also reset leaderboard when day changes
    useEffect(() => {
        // Track the current day to detect when it changes
        let currentDay = new Date().toDateString()

        const updateDailyCountdown = () => {
            const now = new Date()
            const today = now.toDateString()

            // Check if day has changed (midnight passed)
            if (today !== currentDay) {
                currentDay = today
                // Reset leaderboard when new day starts (bust cache to bypass service worker)
                if (fetchDailyLeaderboard) {
                    fetchDailyLeaderboard(true)
                }
            }

            const midnight = new Date(now)
            midnight.setHours(24, 0, 0, 0)
            const diff = midnight - now

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            setDailyTimeRemaining(`${hours}h ${minutes}m`)
        }

        updateDailyCountdown()
        const interval = setInterval(updateDailyCountdown, 60000)
        return () => clearInterval(interval)
    }, [fetchDailyLeaderboard])

    // Fetch data when tab changes
    useEffect(() => {
        if (activeTab === 'daily' && fetchDailyLeaderboard) {
            fetchDailyLeaderboard()
        } else if (activeTab === 'weekly' && fetchWeeklyLeaderboard) {
            fetchWeeklyLeaderboard()
        }
    }, [activeTab, fetchDailyLeaderboard, fetchWeeklyLeaderboard])

    const handleTabChange = (tab) => {
        playSound('click')
        vibrate(10)
        setActiveTab(tab)
    }

    // Rank badge helper
    const getRankDisplay = (rank) => {
        if (rank === 1) return { icon: '👑', color: '#ffd700', label: 'Champion' }
        if (rank === 2) return { icon: '🥈', color: '#c0c0c0', label: 'Runner Up' }
        if (rank === 3) return { icon: '🥉', color: '#cd7f32', label: 'Third Place' }
        if (rank <= 5) return { icon: '⭐', color: '#a855f7', label: 'Top 5' }
        return { icon: `#${rank}`, color: '#fff', label: '' }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white" style={{
            paddingTop: 'max(24px, env(safe-area-inset-top))',
            paddingBottom: 'calc(100px + env(safe-area-inset-bottom))'
        }}>
            {/* Header - Centered title, no redundant back since BottomNav handles navigation */}
            <div className="flex items-center justify-center px-6 mb-4">
                <span className="text-white font-bold text-lg">🏆 Challenges</span>
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-2 px-6 mb-6">
                <button
                    onClick={() => handleTabChange('daily')}
                    className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                        background: activeTab === 'daily'
                            ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                            : 'rgba(255,255,255,0.05)',
                        border: activeTab === 'daily'
                            ? '2px solid rgba(139, 92, 246, 0.5)'
                            : '1px solid rgba(255,255,255,0.1)',
                        color: activeTab === 'daily' ? '#fff' : 'rgba(255,255,255,0.5)'
                    }}
                >
                    ⚡ Daily
                </button>
                <button
                    onClick={() => handleTabChange('weekly')}
                    className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{
                        background: activeTab === 'weekly'
                            ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                            : 'rgba(255,255,255,0.05)',
                        border: activeTab === 'weekly'
                            ? '2px solid rgba(16, 185, 129, 0.5)'
                            : '1px solid rgba(255,255,255,0.1)',
                        color: activeTab === 'weekly' ? '#fff' : 'rgba(255,255,255,0.5)'
                    }}
                >
                    🏆 Weekly
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 px-6 overflow-y-auto">
                {activeTab === 'daily' ? (
                    /* ==================== DAILY CHALLENGE ==================== */
                    (() => {
                        const todayMode = getDailyMode()
                        const modeColors = MODE_COLORS[todayMode.id]
                        return (
                            <div className="space-y-4">
                                {/* Title */}
                                <div className="text-center mb-2">
                                    <span className="text-5xl block mb-3">⚡</span>
                                    <h2 className="text-2xl font-black text-white mb-1">Daily Challenge</h2>
                                    <p className="text-white/60 text-sm">Get the highest score today!</p>
                                </div>

                                {/* Today's Mode Card - Rotating daily mode! */}
                                <div className="rounded-2xl p-4" style={{
                                    background: modeColors.bg,
                                    border: `2px solid ${modeColors.border}`
                                }}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl">{todayMode.emoji}</span>
                                            <div>
                                                <p className="text-xs text-white/50 uppercase tracking-wider">Today's Mode</p>
                                                <p className="font-black text-lg" style={{ color: modeColors.text }}>{todayMode.label}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white/40 text-[10px]">Changes daily</p>
                                            <p className="text-xs text-white/50">{todayMode.desc}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* PRIZES Card - Actual scan rewards! */}
                                <div className="rounded-2xl p-4" style={{
                                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(251, 146, 60, 0.12) 100%)',
                                    border: '1px solid rgba(255, 215, 0, 0.3)'
                                }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">🏆</span>
                                        <p className="text-yellow-300 font-bold">PRIZES</p>
                                        <div className="ml-auto text-right">
                                            <p className="text-yellow-400 font-bold text-sm">{dailyTimeRemaining}</p>
                                            <p className="text-white/40 text-[10px]">until reset</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-yellow-400 text-lg font-black">🥇</p>
                                            <p className="text-white font-bold text-sm">10</p>
                                            <p className="text-white/40 text-[10px]">scans</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-gray-300 text-lg font-black">🥈🥉</p>
                                            <p className="text-white font-bold text-sm">5</p>
                                            <p className="text-white/40 text-[10px]">scans</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-amber-600 text-xs font-bold">#4-10</p>
                                            <p className="text-white font-bold text-sm">2</p>
                                            <p className="text-white/40 text-[10px]">scans</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-white/60 text-xs font-bold">Top 25%</p>
                                            <p className="text-white font-bold text-sm">1</p>
                                            <p className="text-white/40 text-[10px]">scan</p>
                                        </div>
                                    </div>
                                </div>

                                {/* HOW IT WORKS - Crystal Clear Rules */}
                                <div className="rounded-2xl p-4" style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                                        <span>📋</span> How It Works
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-3">
                                            <span className="text-blue-400 font-bold">1.</span>
                                            <p className="text-white/70">Take a photo of your outfit</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-blue-400 font-bold">2.</span>
                                            <p className="text-white/70">AI rates your fit (0-100)</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-blue-400 font-bold">3.</span>
                                            <p className="text-white/70">Highest score at midnight wins!</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <p className="text-white/40 text-xs text-center">
                                            🎮 FREE for everyone • Your best score counts! • Resets at midnight
                                        </p>
                                    </div>
                                </div>

                                {/* CTA Button - Enter Daily Challenge */}
                                <button
                                    onClick={() => {
                                        playSound('click')
                                        vibrate(30)
                                        onCompeteDaily?.()
                                    }}
                                    className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 transition-all active:scale-95"
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                        boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                                    }}
                                >
                                    <span className="text-2xl">📸</span>
                                    ENTER DAILY CHALLENGE
                                </button>
                                <div>
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span>📊</span> Today's Rankings
                                    </h3>
                                    {dailyLeaderboard.length === 0 ? (
                                        <div className="text-center py-8 rounded-2xl" style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px dashed rgba(255,255,255,0.1)'
                                        }}>
                                            <span className="text-4xl block mb-2">🌅</span>
                                            <p className="text-white/50">No fits rated today yet</p>
                                            <p className="text-white/30 text-sm">Be the first to compete!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {dailyLeaderboard.slice(0, 5).map((entry, i) => {
                                                const { icon, color, label } = getRankDisplay(entry.rank || i + 1)
                                                const isCurrentUser = entry.isCurrentUser

                                                return (
                                                    <div
                                                        key={entry.userId || i}
                                                        className="p-3 rounded-xl"
                                                        style={{
                                                            background: isCurrentUser
                                                                ? 'rgba(59, 130, 246, 0.2)'
                                                                : i === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                                                            border: isCurrentUser
                                                                ? '2px solid rgba(59, 130, 246, 0.5)'
                                                                : i === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                                                        }}
                                                    >
                                                        {/* Top row: Rank, Image, Score */}
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg w-8 text-center flex-shrink-0">{icon}</span>
                                                            {entry.imageThumb ? (
                                                                <img
                                                                    src={entry.imageThumb}
                                                                    alt="Outfit"
                                                                    className="w-14 h-14 rounded-xl object-cover border-2 flex-shrink-0"
                                                                    style={{ borderColor: isCurrentUser ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)' }}
                                                                />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                                                                    background: i === 0 ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255,255,255,0.1)'
                                                                }}>
                                                                    <span className="text-xl">{isCurrentUser ? '👤' : '🔥'}</span>
                                                                </div>
                                                            )}
                                                            {/* Tagline - short funny title */}
                                                            <span className="flex-1 text-sm font-bold text-white/80 truncate">
                                                                {entry.tagline || (isCurrentUser ? 'You' : (entry.displayName || 'Anonymous'))}
                                                            </span>
                                                            <span className="font-black text-2xl" style={{ color }}>{entry.score?.toFixed?.(1) || entry.score}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* User's rank if not in top 5 */}
                                {userDailyRank && userDailyRank > 5 && (
                                    <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl text-center">
                                        <span className="text-blue-400 text-sm">Your rank: </span>
                                        <span className="text-white font-bold text-lg">#{userDailyRank}</span>
                                    </div>
                                )}
                            </div>
                        )
                    })()
                ) : (
                    /* ==================== WEEKLY CHALLENGE ==================== */
                    <div className="space-y-4">
                        {!currentEvent ? (
                            <div className="text-center py-12">
                                <span className="text-6xl block mb-4">🏆</span>
                                <h2 className="text-xl font-bold mb-2">No Active Challenge</h2>
                                <p className="text-white/50">Check back soon for the next weekly theme!</p>
                            </div>
                        ) : (
                            <>
                                {/* Title + Theme */}
                                <div className="text-center mb-2">
                                    <span className="text-5xl block mb-3">{currentEvent.themeEmoji || '🏆'}</span>
                                    <h2 className="text-2xl font-black text-white mb-1">{currentEvent.theme}</h2>
                                    <p className="text-white/60 text-sm">This week's theme</p>
                                </div>

                                {/* PRIZES Card - Weekly rewards! */}
                                <div className="rounded-2xl p-4" style={{
                                    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(251, 146, 60, 0.12) 100%)',
                                    border: '1px solid rgba(255, 215, 0, 0.3)'
                                }}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-2xl">🏆</span>
                                        <p className="text-yellow-300 font-bold">WEEKLY PRIZES</p>
                                        {currentEvent.endDate && (
                                            <div className="ml-auto text-right">
                                                <p className="text-yellow-400 font-bold text-sm">{formatTimeRemaining(new Date(currentEvent.endDate).getTime() - Date.now())}</p>
                                                <p className="text-white/40 text-[10px]">remaining</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-4 gap-2 text-center">
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-yellow-400 text-lg font-black">🥇</p>
                                            <p className="text-white font-bold text-sm">50</p>
                                            <p className="text-white/40 text-[10px]">scans</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-gray-300 text-lg font-black">🥈🥉</p>
                                            <p className="text-white font-bold text-sm">25</p>
                                            <p className="text-white/40 text-[10px]">scans</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-amber-600 text-xs font-bold">#4-10</p>
                                            <p className="text-white font-bold text-sm">10</p>
                                            <p className="text-white/40 text-[10px]">scans</p>
                                        </div>
                                        <div className="bg-white/5 rounded-lg py-2 px-1">
                                            <p className="text-white/60 text-xs font-bold">Top 25%</p>
                                            <p className="text-white font-bold text-sm">3</p>
                                            <p className="text-white/40 text-[10px]">scans</p>
                                        </div>
                                    </div>
                                </div>

                                {/* HOW IT WORKS - Crystal Clear Rules */}
                                <div className="rounded-2xl p-4" style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                                        <span>📋</span> How It Works
                                    </h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-start gap-3">
                                            <span className="text-emerald-400 font-bold">1.</span>
                                            <p className="text-white/70">Dress to match the theme: <strong className="text-white">{currentEvent.theme}</strong></p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-emerald-400 font-bold">2.</span>
                                            <p className="text-white/70">Take a photo of your outfit</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-emerald-400 font-bold">3.</span>
                                            <p className="text-white/70">AI scores: <strong className="text-purple-400">50% theme match</strong> + 50% style</p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="text-emerald-400 font-bold">4.</span>
                                            <p className="text-white/70">Highest score at week end wins!</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                        <p className="text-white/40 text-xs text-center">
                                            🎮 1 entry per week
                                        </p>
                                    </div>
                                </div>

                                {/* CTA Button - Enter Weekly Challenge */}
                                <button
                                    onClick={() => {
                                        playSound('click')
                                        vibrate(30)
                                        onCompeteWeekly?.()
                                    }}
                                    className="w-full py-4 rounded-2xl font-black text-lg text-white flex items-center justify-center gap-3 transition-all active:scale-95"
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                                    }}
                                >
                                    <span className="text-2xl">👗</span>
                                    ENTER WEEKLY CHALLENGE
                                </button>

                                {/* User Status */}
                                {userEventStatus?.participating && userEventStatus?.bestScore && (
                                    <div className="bg-cyan-900/20 border border-cyan-500/30 p-4 rounded-xl">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-white/50 text-xs">Your Best Score</p>
                                                <p className="text-cyan-400 font-black text-2xl">{userEventStatus.bestScore}</p>
                                            </div>
                                            {userEventStatus.rank && (
                                                <div className="text-right">
                                                    <p className="text-white/50 text-xs">Current Rank</p>
                                                    <p className="text-white font-bold text-2xl">#{userEventStatus.rank}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Leaderboard */}
                                <div>
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <span>📊</span> Leaderboard
                                    </h3>
                                    {weeklyLeaderboard.length === 0 ? (
                                        <div className="text-center py-8 rounded-2xl" style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            border: '1px dashed rgba(255,255,255,0.1)'
                                        }}>
                                            <p className="text-white/50">No entries yet</p>
                                            <p className="text-white/30 text-sm">Be the first to compete!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {weeklyLeaderboard.slice(0, 5).map((entry, i) => {
                                                const { icon, color, label } = getRankDisplay(entry.rank || i + 1)
                                                const isCurrentUser = entry.isCurrentUser || (userId && entry.userId?.startsWith(userId?.slice(0, 8)))

                                                return (
                                                    <div
                                                        key={entry.userId || i}
                                                        className="flex items-center gap-3 p-3 rounded-xl"
                                                        style={{
                                                            background: isCurrentUser
                                                                ? 'rgba(0, 212, 255, 0.2)'
                                                                : i === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                                                            border: isCurrentUser
                                                                ? '2px solid rgba(0, 212, 255, 0.5)'
                                                                : i === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                                                        }}
                                                    >
                                                        {/* Top row: Rank, Image, Score */}
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-lg w-8 text-center flex-shrink-0">{icon}</span>
                                                            {entry.imageThumb ? (
                                                                <img
                                                                    src={entry.imageThumb}
                                                                    alt="Outfit"
                                                                    className="w-14 h-14 rounded-xl object-cover border-2 flex-shrink-0"
                                                                    style={{ borderColor: isCurrentUser ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)' }}
                                                                />
                                                            ) : (
                                                                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                                                                    background: i === 0 ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255,255,255,0.1)'
                                                                }}>
                                                                    <span className="text-xl">{isCurrentUser ? '👤' : '🔥'}</span>
                                                                </div>
                                                            )}
                                                            {/* Tagline - short funny title */}
                                                            <span className="flex-1 text-sm font-bold text-white/80 truncate">
                                                                {entry.tagline || (isCurrentUser ? 'You' : (entry.displayName || 'Anonymous'))}
                                                            </span>
                                                            <span className="font-black text-2xl" style={{ color }}>{entry.score?.toFixed?.(1) || entry.score}</span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* View Full Leaderboard */}
                                    {weeklyLeaderboard.length > 0 && onShowFullLeaderboard && (
                                        <button
                                            onClick={() => { playSound('click'); vibrate(10); onShowFullLeaderboard(); }}
                                            className="w-full text-center py-3 text-white/40 text-xs mt-2"
                                        >
                                            View all {currentEvent?.totalParticipants || weeklyLeaderboard.length} participants →
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <BottomNav
                activeTab="challenges"
                eventMode={false}
                onNavigate={(tab) => {
                    if (tab === 'home') {
                        onBack();
                    }
                }}
                onOpenArena={onOpenArena}
                onScan={() => {
                    onCompeteDaily?.();
                }}
            />
        </div>
    )
}
