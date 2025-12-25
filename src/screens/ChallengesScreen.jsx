import React, { useState, useEffect } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { formatTimeRemaining } from '../utils/dateUtils'
import BottomNav from '../components/common/BottomNav'

/**
 * ChallengesScreen
 *
 * Combined view for Daily + Weekly challenges
 * - Daily: Highest score of the day wins 5 free pro scans
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
        const interval = setInterval(updateDailyCountdown, 60000)
        return () => clearInterval(interval)
    }, [])

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
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom))'
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
                    <div className="space-y-4">
                        {/* Title */}
                        <div className="text-center mb-2">
                            <span className="text-5xl block mb-3">⚡</span>
                            <h2 className="text-2xl font-black text-white mb-1">Daily Challenge</h2>
                            <p className="text-white/60 text-sm">Get the highest score today!</p>
                        </div>

                        {/* Prize + Timer Card */}
                        <div className="rounded-2xl p-4" style={{
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                            border: '1px solid rgba(59, 130, 246, 0.3)'
                        }}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎁</span>
                                    <div>
                                        <p className="text-blue-300 font-bold">5 FREE PRO SCANS</p>
                                        <p className="text-white/50 text-xs">Prize for #1</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-blue-400 font-bold text-lg">{dailyTimeRemaining}</p>
                                    <p className="text-white/40 text-[10px]">until reset</p>
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

                        {/* Leaderboard */}
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
                                                            className="w-12 h-12 rounded-xl object-cover border-2 flex-shrink-0"
                                                            style={{ borderColor: isCurrentUser ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)' }}
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                                                            background: i === 0 ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255,255,255,0.1)'
                                                        }}>
                                                            <span className="text-xl">{isCurrentUser ? '👤' : '🔥'}</span>
                                                        </div>
                                                    )}
                                                    {/* Tagline - short funny title */}
                                                    <span className="flex-1 text-sm font-bold text-white/80 truncate">
                                                        {entry.tagline || (isCurrentUser ? 'You' : (entry.displayName || 'Anonymous'))}
                                                    </span>
                                                    <span className="font-black text-2xl" style={{ color }}>{entry.score}</span>
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

                        {/* CTA */}
                        <button
                            onClick={() => { playSound('click'); vibrate(30); onCompeteDaily?.(); }}
                            aria-label="Take a photo for daily challenge"
                            className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98]"
                            style={{
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
                            }}
                        >
                            📸 Take a Photo
                        </button>
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
                                {/* Title + Theme */}
                                <div className="text-center mb-2">
                                    <span className="text-5xl block mb-3">{currentEvent.themeEmoji || '🏆'}</span>
                                    <h2 className="text-2xl font-black text-white mb-1">{currentEvent.theme}</h2>
                                    <p className="text-white/60 text-sm">This week's theme</p>
                                </div>

                                {/* Prize + Timer Card */}
                                <div className="rounded-2xl p-4" style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">👑</span>
                                            <div>
                                                <p className="text-yellow-300 font-bold">1 YEAR FREE PRO</p>
                                                <p className="text-white/50 text-xs">Prize for #1</p>
                                            </div>
                                        </div>
                                        {currentEvent.endDate && (
                                            <div className="text-right">
                                                <p className="text-emerald-400 font-bold text-lg">{formatTimeRemaining(currentEvent.endDate)}</p>
                                                <p className="text-white/40 text-[10px]">remaining</p>
                                            </div>
                                        )}
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
                                            {isPro ? '✨ Pro: 1 entry/day' : '🎮 Free: 1 entry/week'}
                                        </p>
                                    </div>
                                </div>

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
                                                                    className="w-12 h-12 rounded-xl object-cover border-2 flex-shrink-0"
                                                                    style={{ borderColor: isCurrentUser ? 'rgba(0,212,255,0.5)' : 'rgba(255,255,255,0.1)' }}
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
                                                                    background: i === 0 ? 'linear-gradient(135deg, #ffd700, #ff8c00)' : 'rgba(255,255,255,0.1)'
                                                                }}>
                                                                    <span className="text-xl">{isCurrentUser ? '👤' : '🔥'}</span>
                                                                </div>
                                                            )}
                                                            {/* Tagline - short funny title */}
                                                            <span className="flex-1 text-sm font-bold text-white/80 truncate">
                                                                {entry.tagline || (isCurrentUser ? 'You' : (entry.displayName || 'Anonymous'))}
                                                            </span>
                                                            <span className="font-black text-2xl" style={{ color }}>{entry.score}</span>
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

                                {/* CTA */}
                                {(isPro || !freeEventEntryUsed) ? (
                                    <button
                                        onClick={() => { playSound('click'); vibrate(30); onCompeteWeekly?.(); }}
                                        aria-label="Take a photo for weekly challenge"
                                        className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98]"
                                        style={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                                        }}
                                    >
                                        {userEventStatus?.participating ? '📸 Try Again' : '📸 Take a Photo'}
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="text-center py-3 rounded-xl" style={{
                                            background: 'rgba(251, 191, 36, 0.1)',
                                            border: '1px solid rgba(251, 191, 36, 0.3)'
                                        }}>
                                            <p className="text-amber-400 text-sm font-medium">You've used your free entry this week</p>
                                            <p className="text-white/40 text-xs">Go Pro for more tries!</p>
                                        </div>
                                        <button
                                            onClick={() => { playSound('click'); vibrate(20); onShowPaywall?.(); }}
                                            aria-label="Upgrade to Pro for more tries"
                                            className="w-full py-5 rounded-2xl font-black text-xl"
                                            style={{
                                                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                                color: '#000'
                                            }}
                                        >
                                            👑 Go Pro — 1 Try/Day
                                        </button>
                                    </div>
                                )}
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
                onScan={() => {
                    onCompeteDaily?.();
                }}
            />
        </div>
    )
}
