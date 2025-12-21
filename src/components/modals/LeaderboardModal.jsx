import React from 'react'
import ModalHeader from '../common/ModalHeader'
import { vibrate } from '../../utils/soundEffects'

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
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)'
        }}>
            <div className="w-full max-w-sm rounded-3xl p-6 relative" style={{
                background: 'linear-gradient(180deg, #12121f 0%, #0a0a0f 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}>
                <ModalHeader
                    title="Leaderboard"
                    subtitle={currentEvent?.theme}
                    icon="🏆"
                    onClose={() => { setShowLeaderboard(false); vibrate(10); }}
                />

                {/* Prize Banner */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-2 mb-3 text-center">
                    <span className="text-sm" aria-hidden="true">👑</span>
                    <span className="text-yellow-300 font-bold text-sm ml-1">1 YEAR FREE PRO</span>
                    <span className="text-yellow-400/70 text-xs ml-2">for #1</span>
                </div>

                {/* Leaderboard List */}
                <div className="space-y-2 mb-4">
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No entries yet — be the first!
                        </div>
                    ) : (
                        leaderboard.map((entry) => (
                            <div
                                key={entry.rank}
                                className="flex items-center p-3 rounded-xl"
                                style={{
                                    background: entry.rank <= 3 ? 'linear-gradient(90deg, rgba(251,191,36,0.1) 0%, transparent 100%)' : 'rgba(255,255,255,0.03)',
                                    border: entry.rank === 1 ? '1px solid rgba(251,191,36,0.3)' : '1px solid transparent'
                                }}
                            >
                                <span className="w-8 text-xl">
                                    {entry.rank === 1 ? '👑' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                                </span>
                                <span className="flex-1 font-medium text-white">{entry.displayName}</span>
                                {/* Score: Show decimal for Pro entries, whole for free */}
                                <span className="font-bold text-lg text-white mr-2">
                                    {entry.isPro ? entry.score?.toFixed(1) : Math.round(entry.score)}
                                </span>
                                {entry.isPro && (
                                    <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold">PRO</span>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* User's Rank (if participating) */}
                {userEventStatus?.participating && userEventStatus.rank > 5 && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 p-3 rounded-xl mb-4">
                        <div className="flex items-center justify-between">
                            <span className="text-cyan-400 text-sm">Your rank</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-xl text-white">#{userEventStatus.rank}</span>
                                <span className="text-gray-400 text-sm">
                                    ({isPro ? userEventStatus.bestScore?.toFixed(1) : Math.round(userEventStatus.bestScore || 0)})
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Free User Call to Action */}
                {!isPro && !userEventStatus?.participating && (
                    <div className="bg-cyan-900/20 border border-cyan-500/30 p-3 rounded-xl mb-4 text-center">
                        <span className="text-cyan-400 text-sm">
                            🎮 You get 1 FREE entry this week!
                        </span>
                    </div>
                )}

                {/* Free User Who Already Entered */}
                {!isPro && userEventStatus?.participating && (
                    <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-xl mb-4 text-center">
                        <span className="text-amber-400 text-xs">
                            ⭐ Go Pro for 5 tries/day + decimal precision
                        </span>
                    </div>
                )}

                {/* Participant Count */}
                <p className="text-center text-gray-500 text-xs mb-4">
                    {currentEvent?.totalParticipants || 0} participants this week
                </p>

                {/* Coming Next Week Preview */}
                {upcomingEvent && (
                    <div className="mb-4 p-3 rounded-xl" style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(219, 39, 119, 0.1) 100%)',
                        border: '1px solid rgba(139, 92, 246, 0.2)'
                    }}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm">{upcomingEvent.themeEmoji}</span>
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Coming Next Week</span>
                        </div>
                        <p className="font-bold text-white text-sm">{upcomingEvent.theme}</p>
                    </div>
                )}
            </div>
        </div>
    )
}
