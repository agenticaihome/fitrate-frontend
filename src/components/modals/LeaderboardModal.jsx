import React from 'react'
import ModalHeader from '../common/ModalHeader'
import { vibrate, playSound } from '../../utils/soundEffects'

export default function LeaderboardModal({
    showLeaderboard,
    setShowLeaderboard,
    currentEvent,
    leaderboard,
    userEventStatus,
    isPro,
    upcomingEvent
}) {
    if (!showLeaderboard) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            <div className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden" style={{
                background: 'linear-gradient(180deg, #12121f 0%, #0a0a0f 100%)',
                border: '1px solid rgba(251,191,36,0.2)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 80px rgba(251,191,36,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
            }}>
                {/* Animated glow effect */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(251,191,36,0.3) 0%, transparent 50%)'
                    }}
                />

                <ModalHeader
                    title="Leaderboard"
                    subtitle={currentEvent?.theme}
                    icon="🏆"
                    onClose={() => { setShowLeaderboard(false); vibrate(10); playSound('click'); }}
                />

                {/* Grand Prize Reminder */}
                <div
                    className="mb-4 p-3 rounded-xl text-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                        border: '1px solid rgba(251, 191, 36, 0.2)'
                    }}
                >
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">👑</span>
                        <span className="text-amber-400 font-bold text-sm">#1 wins 1 YEAR FREE PRO</span>
                    </div>
                </div>

                {/* Leaderboard List */}
                <div className="space-y-2 mb-4">
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-8">
                            <span className="text-4xl block mb-3">🎯</span>
                            <p className="text-gray-400 font-medium">No entries yet</p>
                            <p className="text-gray-500 text-sm">Be the first to compete!</p>
                        </div>
                    ) : (
                        leaderboard.map((entry) => (
                            <div
                                key={entry.rank}
                                className="flex items-center p-3 rounded-xl transition-all"
                                style={{
                                    background: entry.rank === 1
                                        ? 'linear-gradient(90deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.05) 100%)'
                                        : entry.rank <= 3
                                            ? 'linear-gradient(90deg, rgba(255,255,255,0.08) 0%, transparent 100%)'
                                            : 'rgba(255,255,255,0.03)',
                                    border: entry.rank === 1
                                        ? '1px solid rgba(251,191,36,0.4)'
                                        : entry.rank <= 3
                                            ? '1px solid rgba(255,255,255,0.1)'
                                            : '1px solid transparent',
                                    boxShadow: entry.rank === 1
                                        ? '0 4px 15px rgba(251,191,36,0.2)'
                                        : 'none'
                                }}
                            >
                                <span className="w-8 text-xl">
                                    {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                                </span>
                                <span className="flex-1 font-semibold text-white truncate">{entry.displayName}</span>
                                <span
                                    className="font-black text-lg mr-2"
                                    style={{
                                        color: entry.rank === 1 ? '#fbbf24' : entry.rank <= 3 ? '#10b981' : 'white'
                                    }}
                                >{entry.score?.toFixed(1)}</span>
                                {entry.isPro && (
                                    <span
                                        className="text-[9px] px-2 py-0.5 rounded-full font-black"
                                        style={{
                                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                            color: 'black'
                                        }}
                                    >PRO</span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* User's Rank (if not in Top 5) */}
                {userEventStatus?.participating && (!userEventStatus.inTop5 || userEventStatus.rank > 5) && isPro && (
                    <div
                        className="p-3 rounded-xl mb-4"
                        style={{
                            background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(16,185,129,0.1) 100%)',
                            border: '1px solid rgba(6,182,212,0.3)'
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-cyan-400 text-sm font-medium">Your rank</span>
                            <span className="font-black text-xl text-white">#{userEventStatus.rank}</span>
                        </div>
                    </div>
                )}

                {/* Free User Upsell */}
                {!isPro && (
                    <div
                        className="p-3 rounded-xl mb-4 text-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(245,158,11,0.05) 100%)',
                            border: '1px dashed rgba(251,191,36,0.3)'
                        }}
                    >
                        <span className="text-amber-400 text-xs font-medium">
                            👑 Go Pro to compete for the grand prize
                        </span>
                    </div>
                )}

                {/* Participant Count */}
                <p className="text-center text-gray-500 text-xs mb-4">
                    {currentEvent?.totalParticipants || 0} participants this week
                </p>

                {/* Coming Next Week Preview */}
                {upcomingEvent && (
                    <div
                        className="p-3 rounded-xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(219, 39, 119, 0.05) 100%)',
                            border: '1px solid rgba(139, 92, 246, 0.2)'
                        }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{upcomingEvent.themeEmoji}</span>
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Coming Next Week</span>
                        </div>
                        <p className="font-bold text-white text-sm">{upcomingEvent.theme}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
