import React, { useState, useEffect } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { formatTimeRemaining } from '../utils/dateUtils'

/**
 * ChallengesScreen
 *
 * Combined view for Daily + Weekly challenges
 * - Daily: Highest score wins 5 free pro scans (resets midnight)
 * - Weekly: Themed event, #1 wins 1 year free pro
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
    // Data fetching
    fetchDailyLeaderboard,
    fetchWeeklyLeaderboard
}) {
    const [activeTab, setActiveTab] = useState('daily')
    const [dailyTimeRemaining, setDailyTimeRemaining] = useState('')

    // Calculate time until midnight for daily reset
    useEffect(() => {
        const updateDailyCountdown = () => {
            const now = new Date()
            const midnight = new Date(now)
            midnight.setHours(24, 0, 0, 0)
            const diff = midnight - now

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            setDailyTimeRemaining(`${hours}h ${minutes}m`)
        }

        updateDailyCountdown()
        const interval = setInterval(updateDailyCountdown, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [])

    // Fetch data when tab changes
    useEffect(() => {
        if (activeTab === 'daily' && fetchDailyLeaderboard) {
            fetchDailyLeaderboard()
        } else if (activeTab === 'weekly' && fetchWeeklyLeaderboard) {
            fetchWeeklyLeaderboard()
        }
    }, [activeTab])

    const handleTabChange = (tab) => {
        playSound('click')
        vibrate(10)
        setActiveTab(tab)
    }

    // Rank badge helper
    const getRankDisplay = (rank) => {
        if (rank === 1) return { icon: '👑', color: '#ffd700' }
        if (rank === 2) return { icon: '🥈', color: '#c0c0c0' }
        if (rank === 3) return { icon: '🥉', color: '#cd7f32' }
        if (rank <= 5) return { icon: '⭐', color: '#a855f7' }
        return { icon: `#${rank}`, color: '#fff' }
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#0a0a0f] text-white" style={{
            paddingTop: 'max(24px, env(safe-area-inset-top))',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
        }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 mb-4">
                <button
                    onClick={() => { playSound('click'); vibrate(10); onBack(); }}
                    className="text-white/60 text-sm font-medium"
                >
                    ← Back
                </button>
                <span className="text-white font-bold text-lg">Challenges</span>
                <div className="w-12" />
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
                    <div className="space-y-4">
                        {/* Title & Timer */}
                        <div className="text-center mb-2">
                            <span className="text-4xl block mb-2">⚡</span>
                            <h2 className="text-xl font-black text-white">Today's Top Fits</h2>
                            <p className="text-white/50 text-sm">Highest score wins!</p>
                        </div>

                        {/* Countdown */}
                        <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl mx-auto w-fit" style={{
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                            <span className="text-lg">⏰</span>
                            <div className="text-center">
                                <p className="text-blue-400 font-bold">{dailyTimeRemaining}</p>
                                <p className="text-white/40 text-[10px]">until reset</p>
                            </div>
                        </div>

                        {/* Prize Banner */}
                        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-3 text-center">
                            <span className="text-lg">🎁</span>
                            <span className="text-blue-300 font-bold text-sm ml-2">5 FREE PRO SCANS</span>
                            <span className="text-blue-400/70 text-xs ml-2">for #1</span>
                        </div>

                        {/* Daily Leaderboard */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Rankings</h3>
                            {dailyLeaderboard.length === 0 ? (
                                <div className="text-center py-8 text-white/30">
                                    <span className="text-4xl block mb-2">🌅</span>
                                    <p>No fits rated today yet.</p>
                                    <p className="text-sm">Be the first!</p>
                                </div>
                            ) : (
                                dailyLeaderboard.slice(0, 5).map((entry, i) => {
                                    const { icon, color } = getRankDisplay(entry.rank || i + 1)
                                    const isCurrentUser = entry.isCurrentUser || (userId && entry.userId?.startsWith(userId?.slice(0, 8)))

                                    return (
                                        <div
                                            key={entry.odId || i}
                                            className="flex items-center justify-between p-3 rounded-xl"
                                            style={{
                                                background: isCurrentUser
                                                    ? 'rgba(59, 130, 246, 0.15)'
                                                    : i === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                                                border: isCurrentUser
                                                    ? '2px solid rgba(59, 130, 246, 0.5)'
                                                    : i === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg w-8 text-center" style={{ color }}>{icon}</span>
                                                <span className={`font-medium ${isCurrentUser ? 'text-blue-400' : 'text-white/80'}`}>
                                                    {isCurrentUser ? 'You' : (entry.displayName || 'Anonymous')}
                                                </span>
                                            </div>
                                            <span className="font-bold text-lg" style={{ color }}>{entry.score}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        {/* User's rank if not in top 5 */}
                        {userDailyRank && userDailyRank > 5 && (
                            <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded-xl text-center">
                                <span className="text-blue-400 text-sm">Your rank: </span>
                                <span className="text-white font-bold">#{userDailyRank}</span>
                            </div>
                        )}

                        {/* CTA */}
                        <button
                            onClick={() => { playSound('click'); vibrate(30); onCompeteDaily?.(); }}
                            className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            ⚡ Scan to Compete
                        </button>

                        {/* Rules */}
                        <p className="text-white/30 text-xs text-center">
                            Highest score of the day wins • Nice mode only • Resets at midnight
                        </p>
                    </div>
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
                                {/* Theme Showcase */}
                                <div className="text-center mb-2">
                                    <span className="text-4xl block mb-2">{currentEvent.themeEmoji || '🏆'}</span>
                                    <h2 className="text-xl font-black text-white">{currentEvent.theme}</h2>
                                    <p className="text-white/50 text-sm">Dress to match the theme!</p>
                                </div>

                                {/* Countdown */}
                                {currentEvent.endDate && (
                                    <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl mx-auto w-fit" style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                    }}>
                                        <span className="text-lg">⏱️</span>
                                        <div className="text-center">
                                            <p className="text-emerald-400 font-bold">{formatTimeRemaining(currentEvent.endDate)}</p>
                                            <p className="text-white/40 text-[10px]">until challenge ends</p>
                                        </div>
                                    </div>
                                )}

                                {/* Prize Banner */}
                                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-3 text-center">
                                    <span className="text-lg">👑</span>
                                    <span className="text-yellow-300 font-bold text-sm ml-2">1 YEAR FREE PRO</span>
                                    <span className="text-yellow-400/70 text-xs ml-2">for #1</span>
                                </div>

                                {/* User Status */}
                                {userEventStatus?.participating && userEventStatus?.bestScore && (
                                    <div className="bg-cyan-900/20 border border-cyan-500/30 p-3 rounded-xl text-center">
                                        <p className="text-cyan-400 font-bold">Your Best: {userEventStatus.bestScore}</p>
                                        {userEventStatus.rank && (
                                            <p className="text-white/50 text-sm">Current Rank: #{userEventStatus.rank}</p>
                                        )}
                                    </div>
                                )}

                                {/* Weekly Leaderboard */}
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider">Top 5</h3>
                                    {weeklyLeaderboard.length === 0 ? (
                                        <div className="text-center py-8 text-white/30">
                                            <p>No entries yet. Be the first!</p>
                                        </div>
                                    ) : (
                                        weeklyLeaderboard.slice(0, 5).map((entry, i) => {
                                            const { icon, color } = getRankDisplay(entry.rank || i + 1)
                                            const isCurrentUser = userId && entry.userId?.startsWith(userId?.slice(0, 8))

                                            return (
                                                <div
                                                    key={entry.userId || i}
                                                    className="flex items-center justify-between p-3 rounded-xl"
                                                    style={{
                                                        background: isCurrentUser
                                                            ? 'rgba(0, 212, 255, 0.15)'
                                                            : i === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.03)',
                                                        border: isCurrentUser
                                                            ? '2px solid rgba(0, 212, 255, 0.5)'
                                                            : i === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                                                    }}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-lg w-8 text-center" style={{ color }}>{icon}</span>
                                                        {entry.imageThumb ? (
                                                            <img
                                                                src={entry.imageThumb}
                                                                alt=""
                                                                className="w-10 h-10 rounded-lg object-cover"
                                                                style={{ border: '2px solid rgba(255,255,255,0.2)' }}
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                                                                {isCurrentUser ? '✨' : '👤'}
                                                            </div>
                                                        )}
                                                        <span className={`font-medium ${isCurrentUser ? 'text-cyan-400' : 'text-white/80'}`}>
                                                            {isCurrentUser ? 'You' : (entry.displayName || 'Anonymous')}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-lg" style={{ color }}>{entry.score}</span>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                {/* View Full Leaderboard */}
                                {weeklyLeaderboard.length > 0 && onShowFullLeaderboard && (
                                    <button
                                        onClick={() => { playSound('click'); vibrate(10); onShowFullLeaderboard(); }}
                                        className="w-full text-center py-2 text-white/40 text-xs"
                                    >
                                        View all {currentEvent?.totalParticipants || weeklyLeaderboard.length} participants →
                                    </button>
                                )}

                                {/* CTA */}
                                {(isPro || !freeEventEntryUsed) ? (
                                    <button
                                        onClick={() => { playSound('click'); vibrate(30); onCompeteWeekly?.(); }}
                                        className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98]"
                                        style={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                                        }}
                                    >
                                        {userEventStatus?.participating ? '🔥 Submit Another Look' : '🔥 Compete Now'}
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-center py-2">
                                            <p className="text-amber-400 text-sm">You've used your free entry this week</p>
                                        </div>
                                        <button
                                            onClick={() => { playSound('click'); vibrate(20); onShowPaywall?.(); }}
                                            className="w-full py-4 rounded-2xl font-black text-lg"
                                            style={{
                                                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                                color: '#000'
                                            }}
                                        >
                                            👑 Go Pro — 1 Entry Daily
                                        </button>
                                    </div>
                                )}

                                {/* Rules */}
                                <p className="text-white/30 text-xs text-center">
                                    Theme = 50% of score • {isPro ? '1 entry/day' : '1 free entry/week'} • Top 5 win
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
