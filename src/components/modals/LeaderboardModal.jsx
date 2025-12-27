import React, { useState } from 'react'
import ModalHeader from '../common/ModalHeader'
import { vibrate } from '../../utils/soundEffects'
import EventCountdown from '../common/EventCountdown'
import WinnerShareCard from './WinnerShareCard'

export default function LeaderboardModal({
    showLeaderboard,
    setShowLeaderboard,
    currentEvent,
    leaderboard,
    userEventStatus,
    isPro,
    upcomingEvent
}) {
    const [showWinnerCard, setShowWinnerCard] = useState(false)

    if (!showLeaderboard) return null

    // Medal colors for top 3
    const getMedalStyle = (rank) => {
        if (rank === 1) return {
            background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
            border: '2px solid #FFD700',
            boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            color: '#1a1a2e'
        }
        if (rank === 2) return {
            background: 'linear-gradient(135deg, #C0C0C0 0%, #E8E8E8 50%, #C0C0C0 100%)',
            border: '2px solid #C0C0C0',
            boxShadow: '0 0 15px rgba(192, 192, 192, 0.4), inset 0 1px 0 rgba(255,255,255,0.5)',
            color: '#1a1a2e'
        }
        if (rank === 3) return {
            background: 'linear-gradient(135deg, #CD7F32 0%, #E8A862 50%, #CD7F32 100%)',
            border: '2px solid #CD7F32',
            boxShadow: '0 0 15px rgba(205, 127, 50, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
            color: '#1a1a2e'
        }
        if (rank <= 5) return {
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            boxShadow: '0 0 10px rgba(139, 92, 246, 0.2)',
            color: '#fff'
        }
        return {
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid transparent',
            color: '#fff'
        }
    }

    const getMedalIcon = (rank) => {
        if (rank === 1) return '👑'
        if (rank === 2) return '🥈'
        if (rank === 3) return '🥉'
        if (rank <= 5) return '⭐'
        return `#${rank}`
    }

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

                {/* Live Countdown Timer */}
                {currentEvent?.endDate && (
                    <div className="flex justify-center mb-3">
                        <EventCountdown endDate={currentEvent.endDate} />
                    </div>
                )}

                {/* Prize Banner */}
                <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-2 mb-3 text-center">
                    <span className="text-sm" aria-hidden="true">👑</span>
                    <span className="text-yellow-300 font-bold text-sm ml-1">1 YEAR FREE PRO</span>
                    <span className="text-yellow-400/70 text-xs ml-2">for #1 Winner</span>
                </div>

                {/* Leaderboard List */}
                <div className="space-y-2 mb-4">
                    {leaderboard.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No entries yet — be the first!
                        </div>
                    ) : (
                        leaderboard.map((entry) => {
                            const medalStyle = getMedalStyle(entry.rank)
                            const isTopThree = entry.rank <= 3
                            const isTopFive = entry.rank <= 5
                            // Check if this is the current user's entry
                            const isCurrentUser = userEventStatus?.rank === entry.rank

                            return (
                                <div
                                    key={entry.rank}
                                    className={`flex items-center p-3 rounded-xl transition-all ${isTopFive ? 'transform hover:scale-[1.02]' : ''} ${isCurrentUser ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0a0a0f]' : ''}`}
                                    style={medalStyle}
                                >
                                    {/* Rank Badge */}
                                    <span className={`w-10 text-xl ${isTopThree ? 'animate-pulse' : ''}`}>
                                        {getMedalIcon(entry.rank)}
                                    </span>

                                    {/* Name + Badge */}
                                    <div className="flex-1">
                                        <span className={`font-bold ${isTopThree ? 'text-lg' : ''}`} style={{ color: medalStyle.color }}>
                                            {entry.displayName}
                                            {isCurrentUser && <span className="ml-2 text-cyan-400 text-xs font-bold">(You)</span>}
                                        </span>
                                        {isTopFive && (
                                            <span className="block text-[10px] opacity-70" style={{ color: medalStyle.color }}>
                                                {entry.rank === 1 ? '🏆 Champion' : entry.rank === 2 ? '✨ Runner Up' : entry.rank === 3 ? '💫 Third Place' : '⭐ Top 5'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Score */}
                                    <span className={`font-black ${isTopThree ? 'text-2xl' : 'text-lg'} mr-2`} style={{ color: medalStyle.color }}>
                                        {entry.isPro ? entry.score?.toFixed(1) : Math.round(entry.score)}
                                    </span>

                                    {/* Pro Badge */}
                                    {entry.isPro && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isTopThree ? 'bg-black/30 text-white' : 'bg-amber-500 text-black'}`}>
                                            PRO
                                        </span>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                {/* User's Rank (if participating but not in top 5) */}
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
                        <p className="text-[10px] text-cyan-400/60 mt-1">Keep trying to reach the Top 5!</p>
                    </div>
                )}

                {/* User in Top 5 - Celebration + Share */}
                {userEventStatus?.participating && userEventStatus.rank <= 5 && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-emerald-500/20 border border-yellow-500/30 p-4 rounded-xl mb-4 text-center">
                        <span className="text-3xl">🎉</span>
                        <p className="text-yellow-300 font-bold text-lg">You're #{userEventStatus.rank}!</p>
                        <p className="text-[10px] text-yellow-400/70 mb-3">
                            {userEventStatus.rank === 1 ? 'Keep #1 to win 1 Year FREE Pro!' : 'Keep your Top 5 spot!'}
                        </p>
                        <button
                            onClick={() => setShowWinnerCard(true)}
                            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-yellow-500 to-amber-500 text-black active:scale-[0.97] transition-transform"
                        >
                            📤 Share My Win
                        </button>
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
                {!isPro && userEventStatus?.participating && userEventStatus.rank > 5 && (
                    <div className="bg-amber-900/20 border border-amber-500/30 p-3 rounded-xl mb-4 text-center">
                        <span className="text-amber-400 text-xs">
                            ✨ Pro features coming soon!
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

            {/* Winner Share Card Modal */}
            {showWinnerCard && userEventStatus?.rank <= 5 && (
                <WinnerShareCard
                    rank={userEventStatus.rank}
                    score={userEventStatus.bestScore}
                    theme={currentEvent?.theme}
                    themeEmoji={currentEvent?.themeEmoji}
                    weekId={currentEvent?.weekId}
                    isPro={isPro}
                    onClose={() => setShowWinnerCard(false)}
                />
            )}
        </div>
    )
}
