/**
 * FashionShowResults Screen
 * 
 * Grand Finale reveal when a Fashion Show ends:
 * - Winner spotlight with confetti
 * - Top 3 podium display
 * - Shareable results card
 * - "Start New Show" / "Rematch" CTA
 */

import React, { useState, useRef, useEffect } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

// Confetti particle for celebration
const Confetti = () => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: ['#ffd700', '#ff6b9d', '#8b5cf6', '#00d4ff', '#10b981'][Math.floor(Math.random() * 5)]
    }))

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        left: `${p.left}%`,
                        top: '-10px',
                        background: p.color,
                        animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s forwards`,
                        boxShadow: `0 0 6px ${p.color}`
                    }}
                />
            ))}
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

export default function FashionShowResults({
    showData,
    scoreboard = [],
    userId,
    onShare,
    onNewShow,
    onBack
}) {
    const [showConfetti, setShowConfetti] = useState(true)
    const [isGeneratingCard, setIsGeneratingCard] = useState(false)
    const cardRef = useRef(null)

    // Get winner and podium
    const winner = scoreboard[0]
    const second = scoreboard[1]
    const third = scoreboard[2]
    const userRank = scoreboard.findIndex(e => e.userId === userId) + 1
    const userEntry = scoreboard.find(e => e.userId === userId)
    const isWinner = userRank === 1

    // Play celebration sound on mount
    useEffect(() => {
        playSound('success')
        vibrate([100, 50, 100, 50, 200])
        // Stop confetti after 4 seconds
        const timer = setTimeout(() => setShowConfetti(false), 4000)
        return () => clearTimeout(timer)
    }, [])

    // Share results
    const handleShare = async () => {
        playSound('click')
        vibrate(30)

        const shareText = isWinner
            ? `👑 I WON "${showData?.name}" on FitRate with a score of ${winner?.score?.toFixed(0)}! 🏆\n\nThink you can beat me? Start your own show:`
            : userRank > 0
                ? `🎭 I got #${userRank} in "${showData?.name}" on FitRate! Score: ${userEntry?.score?.toFixed(0)}\n\nChallenge your friends:`
                : `🎭 Check out the results of "${showData?.name}" - an outfit competition on FitRate!\n\nStart your own:`

        try {
            if (navigator.share) {
                await navigator.share({
                    title: `FitRate Fashion Show Results`,
                    text: shareText,
                    url: 'https://fitrate.app'
                })
            } else {
                await navigator.clipboard.writeText(shareText + ' https://fitrate.app')
                alert('Copied to clipboard!')
            }
        } catch (err) {
            console.error('Share failed:', err)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/30 to-gray-900 flex flex-col">
            {showConfetti && <Confetti />}

            {/* Header */}
            <div className="pt-safe px-4 py-4 flex items-center justify-between">
                <button onClick={() => { playSound('click'); onBack?.(); }} className="text-white/60 text-sm">
                    ← Back
                </button>
                <span className="text-white/40 text-sm">Final Results</span>
            </div>

            {/* Show Name */}
            <div className="text-center px-4 mb-6">
                <div className="text-4xl mb-2">🏁</div>
                <h1 className="text-2xl font-black text-white mb-1">{showData?.name}</h1>
                <p className="text-white/50 text-sm">Fashion Show Complete!</p>
            </div>

            {/* Winner Spotlight */}
            {winner && (
                <div className="px-4 mb-6">
                    <div
                        className="relative p-6 rounded-3xl text-center"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,180,0,0.1) 100%)',
                            border: '2px solid rgba(255,215,0,0.4)',
                            boxShadow: '0 0 40px rgba(255,215,0,0.2)'
                        }}
                    >
                        {/* Crown */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl">👑</div>

                        {/* Winner Photo */}
                        {winner.imageThumb ? (
                            <img
                                src={winner.imageThumb}
                                alt="Winner's outfit"
                                className="w-32 h-32 rounded-2xl object-cover mx-auto mb-3 border-4 border-amber-400"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-3 text-5xl">
                                {winner.emoji || '👑'}
                            </div>
                        )}

                        <h2 className="text-xl font-black text-amber-400 mb-1">{winner.nickname}</h2>
                        <div className="text-4xl font-black text-white mb-2">{winner.score?.toFixed(1)}</div>
                        <p className="text-amber-300/70 text-sm">{winner.tagline || '1st Place Winner!'}</p>
                    </div>
                </div>
            )}

            {/* Podium - 2nd and 3rd */}
            {(second || third) && (
                <div className="px-4 mb-6">
                    <div className="flex gap-3 justify-center">
                        {/* 2nd Place */}
                        {second && (
                            <div className="flex-1 max-w-[140px] p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <div className="text-2xl mb-2">🥈</div>
                                {second.imageThumb ? (
                                    <img src={second.imageThumb} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2 text-2xl">
                                        {second.emoji}
                                    </div>
                                )}
                                <p className="text-white font-bold text-sm truncate">{second.nickname}</p>
                                <p className="text-white/60 text-lg font-bold">{second.score?.toFixed(1)}</p>
                            </div>
                        )}

                        {/* 3rd Place */}
                        {third && (
                            <div className="flex-1 max-w-[140px] p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                                <div className="text-2xl mb-2">🥉</div>
                                {third.imageThumb ? (
                                    <img src={third.imageThumb} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />
                                ) : (
                                    <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2 text-2xl">
                                        {third.emoji}
                                    </div>
                                )}
                                <p className="text-white font-bold text-sm truncate">{third.nickname}</p>
                                <p className="text-white/60 text-lg font-bold">{third.score?.toFixed(1)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Your Result (if not top 3) */}
            {userRank > 3 && userEntry && (
                <div className="px-4 mb-6">
                    <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-center">
                        <p className="text-purple-300 text-sm mb-1">Your Rank</p>
                        <div className="flex items-center justify-center gap-4">
                            <span className="text-3xl font-black text-white">#{userRank}</span>
                            {userEntry.imageThumb && (
                                <img src={userEntry.imageThumb} alt="" className="w-12 h-12 rounded-xl object-cover" />
                            )}
                            <span className="text-2xl font-bold text-purple-400">{userEntry.score?.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Scoreboard */}
            {scoreboard.length > 3 && (
                <div className="px-4 mb-6 flex-1 overflow-y-auto">
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">All Results</h3>
                    <div className="space-y-2">
                        {scoreboard.slice(3).map((entry, idx) => (
                            <div
                                key={entry.userId}
                                className={`p-3 rounded-xl flex items-center gap-3 ${entry.userId === userId ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'}`}
                            >
                                <span className="w-8 text-center text-white/50 font-bold">#{idx + 4}</span>
                                {entry.imageThumb ? (
                                    <img src={entry.imageThumb} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                    <span className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-xl">{entry.emoji}</span>
                                )}
                                <span className="flex-1 text-white font-medium truncate">{entry.nickname}</span>
                                <span className="text-white/60 font-bold">{entry.score?.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="px-4 pb-safe pb-8 space-y-3">
                {/* Share Button */}
                <button
                    onClick={handleShare}
                    className="w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    style={{
                        background: isWinner
                            ? 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)'
                            : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                        color: isWinner ? '#000' : '#fff',
                        boxShadow: isWinner ? '0 4px 20px rgba(255,215,0,0.4)' : '0 4px 20px rgba(139,92,246,0.3)'
                    }}
                >
                    <span>{isWinner ? '👑' : '📤'}</span>
                    {isWinner ? 'Share Your Victory!' : 'Share Results'}
                </button>

                {/* New Show Button */}
                <button
                    onClick={() => { playSound('click'); vibrate(20); onNewShow?.(); }}
                    className="w-full py-4 rounded-2xl font-bold text-lg bg-white/10 text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                >
                    <span>🎭</span>
                    Start New Show
                </button>
            </div>
        </div>
    )
}
