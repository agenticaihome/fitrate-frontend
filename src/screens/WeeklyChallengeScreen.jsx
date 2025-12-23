import React from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { formatTimeRemaining } from '../utils/dateUtils'

/**
 * WeeklyChallengeScreen
 * 
 * Dedicated page for the Weekly Challenge featuring:
 * - Theme showcase
 * - Countdown timer
 * - Live leaderboard
 * - Quick rules
 * - Compete CTA
 */
export default function WeeklyChallengeScreen({
    currentEvent,
    leaderboard = [],
    userEventStatus,
    userId,
    isPro,
    freeEventEntryUsed,
    onCompete,
    onShowPaywall,
    onBack
}) {
    if (!currentEvent) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] text-white">
                <span className="text-6xl mb-4">🏆</span>
                <h1 className="text-2xl font-bold mb-2">No Active Challenge</h1>
                <p className="text-white/50 text-center mb-6">Check back soon for the next weekly theme!</p>
                <button
                    onClick={() => { playSound('click'); vibrate(10); onBack(); }}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium"
                >
                    ← Back Home
                </button>
            </div>
        )
    }

    const canCompete = isPro || !freeEventEntryUsed
    const hasSubmitted = userEventStatus?.participating

    return (
        <div className="min-h-screen flex flex-col p-6 pb-28 bg-[#0a0a0f] text-white" style={{
            background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
            paddingTop: 'max(24px, env(safe-area-inset-top))'
        }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => { playSound('click'); vibrate(10); onBack(); }}
                    className="text-white/60 text-sm font-medium"
                >
                    ← Back
                </button>
                <span className="text-white/40 text-xs uppercase tracking-wider">Weekly Challenge</span>
                <div className="w-12" />
            </div>

            {/* Theme Showcase */}
            <div className="text-center mb-6">
                <span className="text-5xl md:text-6xl mb-3 block">{currentEvent.themeEmoji}</span>
                <h1 className="text-2xl md:text-3xl font-black text-white mb-1 leading-tight">{currentEvent.theme}</h1>
                <p className="text-white/50 text-xs md:text-sm">Dress to impress. Top 5 get crowned.</p>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 rounded-xl mx-auto" style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
                <span className="text-xl">⏱️</span>
                <div className="text-center">
                    <p className="text-emerald-400 font-bold text-base">{formatTimeRemaining(currentEvent.endDate)}</p>
                    <p className="text-white/40 text-[10px]">until challenge ends</p>
                </div>
            </div>

            {/* User Status */}
            {hasSubmitted && userEventStatus?.bestScore && (
                <div className="mb-6 px-4 py-3 rounded-xl text-center" style={{
                    background: 'rgba(0, 212, 255, 0.1)',
                    border: '1px solid rgba(0, 212, 255, 0.3)'
                }}>
                    <p className="text-cyan-400 font-bold">Your Best: {userEventStatus.bestScore}</p>
                    {userEventStatus.rank && (
                        <p className="text-white/50 text-sm">Current Rank: #{userEventStatus.rank}</p>
                    )}
                </div>
            )}

            {/* Leaderboard Preview */}
            <div className="flex-1 mb-6">
                <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span>🏆</span> Leaderboard
                </h2>
                <div className="space-y-2">
                    {leaderboard.slice(0, 5).map((entry, i) => {
                        // Check if this entry is the current user (compare first 8 chars)
                        const isCurrentUser = userId && entry.userId &&
                            entry.userId.startsWith(userId.slice(0, 8));

                        return (
                            <div
                                key={entry.userId || i}
                                className="flex items-center justify-between px-4 py-3 rounded-xl relative"
                                style={{
                                    background: isCurrentUser
                                        ? 'rgba(0, 212, 255, 0.15)'
                                        : i === 0 ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255,255,255,0.05)',
                                    border: isCurrentUser
                                        ? '2px solid rgba(0, 212, 255, 0.6)'
                                        : i === 0 ? '1px solid rgba(255, 215, 0, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: isCurrentUser ? '0 0 20px rgba(0, 212, 255, 0.3)' : undefined
                                }}
                            >
                                {/* "YOU" badge for current user */}
                                {isCurrentUser && (
                                    <span className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold rounded-full"
                                        style={{
                                            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                            color: '#000'
                                        }}>
                                        YOU
                                    </span>
                                )}
                                <div className="flex items-center gap-3">
                                    <span className="text-lg w-6 text-center">{i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</span>
                                    {/* Outfit thumbnail for top 5 */}
                                    {entry.imageThumb ? (
                                        <img
                                            src={entry.imageThumb}
                                            alt="Outfit"
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 8,
                                                objectFit: 'cover',
                                                border: isCurrentUser ? '2px solid rgba(0, 212, 255, 0.8)' : '2px solid rgba(255,255,255,0.2)'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 8,
                                            background: isCurrentUser ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem'
                                        }}>
                                            {isCurrentUser ? '�' : '�👤'}
                                        </div>
                                    )}
                                    <span className={`font-medium ${isCurrentUser ? 'text-cyan-400' : 'text-white/80'}`}>
                                        {isCurrentUser ? 'You' : (entry.displayName || 'Anonymous')}
                                    </span>
                                </div>
                                <span className={`font-bold ${isCurrentUser ? 'text-cyan-400' : 'text-white'}`}>{entry.score}</span>
                            </div>
                        );
                    })}
                    {leaderboard.length === 0 && (
                        <p className="text-center text-white/30 py-8">No entries yet. Be the first!</p>
                    )}
                </div>
            </div>

            {/* Quick Rules */}
            <div className="mb-6 px-4 py-3 rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <p className="text-white/50 text-xs text-center">
                    <strong className="text-purple-400">Theme = 50%</strong> of your score • Top 5 win 🏆 •
                    {isPro ? ' 1 entry/day' : ' 1 free entry/week'}
                </p>
            </div>

            {/* Compete CTA */}
            {canCompete ? (
                <button
                    onClick={() => { playSound('click'); vibrate(30); onCompete(); }}
                    className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                        boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                    }}
                >
                    {hasSubmitted ? '🔥 Submit Another Look' : '🔥 Compete Now'}
                </button>
            ) : (
                <div className="flex flex-col gap-3">
                    <div className="text-center py-3">
                        <p className="text-amber-400 text-sm font-medium">You've used your free entry this week</p>
                    </div>
                    <button
                        onClick={() => { playSound('click'); vibrate(20); onShowPaywall(); }}
                        className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                            color: '#000',
                            boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)'
                        }}
                    >
                        👑 Go Pro — 1 Entry Daily
                    </button>
                </div>
            )}
        </div>
    )
}
