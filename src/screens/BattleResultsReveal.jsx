import React, { useState, useEffect, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

/**
 * BattleResultsReveal - Dramatic Cinematic Battle Results
 *
 * Epic reveal sequence:
 * 1. Tension build - "BATTLE RESULTS" pulse
 * 2. Photo collision - Both outfits slide in and meet in middle
 * 3. Score reveal - Numbers pop in under photos
 * 4. Winner announcement - Dramatic reveal with effects
 * 5. Final state - Clean CTAs at bottom
 */

// Confetti piece for winner celebration
function ConfettiPiece({ delay, color, left }) {
    return (
        <div
            style={{
                position: 'absolute',
                left: `${left}%`,
                top: '-20px',
                animationDelay: `${delay}s`,
                width: Math.random() > 0.5 ? '12px' : '8px',
                height: Math.random() > 0.5 ? '12px' : '8px',
                background: color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                animation: 'confetti-fall 3s ease-out forwards',
                zIndex: 100
            }}
        />
    )
}

export default function BattleResultsReveal({
    battleData,
    isCreator,
    onComplete,
    onShare,
    onRematch,
    onHome,
    onViewScorecard
}) {
    // Animation phases
    const [phase, setPhase] = useState(0) // 0=tension, 1=collision, 2=scores, 3=winner, 4=final
    const [showConfetti, setShowConfetti] = useState(false)

    // Battle data
    const creatorScore = battleData?.creatorScore || 0
    const responderScore = battleData?.responderScore || 0
    const creatorThumb = battleData?.creatorThumb
    const responderThumb = battleData?.responderThumb
    const battleMode = battleData?.mode || 'nice'

    // Determine winner
    const creatorWon = creatorScore > responderScore
    const responderWon = responderScore > creatorScore
    const tied = creatorScore === responderScore
    const userWon = isCreator ? creatorWon : responderWon
    const userLost = isCreator ? responderWon : creatorWon
    const diff = Math.abs(creatorScore - responderScore)

    // Colors
    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'
    const accentColor = userWon ? winColor : userLost ? loseColor : tieColor

    // Confetti pieces
    const confettiPieces = useMemo(() => {
        const colors = ['#00ff88', '#00d4ff', '#fff', '#ffd700', '#ff69b4', '#8b5cf6']
        return Array.from({ length: 50 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: Math.random() * 100,
            delay: Math.random() * 0.8
        }))
    }, [])

    // Animation sequence
    useEffect(() => {
        // Phase 0: Tension build (0.8s)
        const t1 = setTimeout(() => {
            playSound('whoosh')
            setPhase(1)
        }, 800)

        // Phase 1→2: Collision complete, show scores (0.8s after phase 1)
        const t2 = setTimeout(() => {
            playSound('impact')
            vibrate([50, 30, 100])
            setPhase(2)
        }, 1600)

        // Phase 2→3: Winner reveal (0.8s after scores)
        const t3 = setTimeout(() => {
            playSound('celebrate')
            vibrate([100, 50, 100, 50, 200])
            setPhase(3)
            if (userWon || tied) {
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 4000)
            }
        }, 2400)

        // Phase 3→4: Final state (1s after winner)
        const t4 = setTimeout(() => {
            setPhase(4)
        }, 3400)

        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [userWon, tied])

    // Mode helpers
    const getModeEmoji = (m) => {
        const emojis = { nice: '😇', roast: '🔥', honest: '📊', savage: '💀', rizz: '😏', celeb: '⭐', aura: '🔮', chaos: '🎪' }
        return emojis[m] || '😇'
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col"
            style={{
                background: 'linear-gradient(180deg, #0a0a15 0%, #1a1a2e 50%, #0a0a15 100%)',
                touchAction: 'none'
            }}
        >
            {/* CSS Animations */}
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
                @keyframes slide-in-left {
                    0% { transform: translateX(-120%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes slide-in-right {
                    0% { transform: translateX(120%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes score-pop {
                    0% { opacity: 0; transform: scale(0) translateY(20px); }
                    60% { transform: scale(1.15) translateY(-5px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes winner-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes text-reveal {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
                @keyframes vs-pop {
                    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
                    60% { transform: scale(1.3) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
            `}</style>

            {/* Confetti */}
            {showConfetti && confettiPieces.map(piece => (
                <ConfettiPiece key={piece.id} {...piece} />
            ))}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-safe">

                {/* Phase 0: Tension Build */}
                {phase === 0 && (
                    <div
                        className="text-center"
                        style={{ animation: 'pulse-glow 1s ease-in-out infinite' }}
                    >
                        <div className="text-6xl mb-4">⚔️</div>
                        <h1 className="text-3xl font-black text-white tracking-wider">
                            BATTLE RESULTS
                        </h1>
                    </div>
                )}

                {/* Phase 1+: Photo Cards */}
                {phase >= 1 && (
                    <div className="w-full max-w-md">
                        {/* Mode badge at top */}
                        <div className="text-center mb-4">
                            <span
                                className="inline-block px-4 py-2 rounded-full text-sm font-bold"
                                style={{
                                    background: 'rgba(139,92,246,0.2)',
                                    border: '1px solid rgba(139,92,246,0.4)',
                                    color: '#a78bfa'
                                }}
                            >
                                {getModeEmoji(battleMode)} {battleMode.toUpperCase()} BATTLE
                            </span>
                        </div>

                        {/* Two Photo Cards Side by Side */}
                        <div className="flex items-center justify-center gap-3 mb-6">
                            {/* Left Card - Creator */}
                            <div
                                className="relative"
                                style={{
                                    animation: phase === 1 ? 'slide-in-left 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                                    opacity: phase === 1 ? 0 : 1
                                }}
                            >
                                <div
                                    className="w-36 h-48 rounded-2xl overflow-hidden relative"
                                    style={{
                                        border: phase >= 3 && creatorWon ? `3px solid ${winColor}` : '3px solid rgba(255,255,255,0.2)',
                                        boxShadow: phase >= 3 && creatorWon ? `0 0 30px ${winColor}50` : '0 8px 32px rgba(0,0,0,0.4)',
                                        filter: phase >= 3 && responderWon ? 'grayscale(40%) brightness(0.7)' : 'none',
                                        transition: 'all 0.4s ease-out'
                                    }}
                                >
                                    {creatorThumb ? (
                                        <img
                                            src={creatorThumb}
                                            alt="Challenger"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-900 to-purple-600 flex items-center justify-center">
                                            <span className="text-5xl">👤</span>
                                        </div>
                                    )}
                                    {/* Label */}
                                    <div className="absolute top-2 left-2">
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-black/60 text-white/80 backdrop-blur-sm">
                                            {isCreator ? 'You' : 'Challenger'}
                                        </span>
                                    </div>
                                    {/* Winner badge */}
                                    {phase >= 3 && creatorWon && (
                                        <div
                                            className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                            style={{
                                                background: `linear-gradient(135deg, ${winColor}, #00d4ff)`,
                                                boxShadow: `0 0 20px ${winColor}`,
                                                animation: 'winner-pulse 1s ease-in-out infinite'
                                            }}
                                        >
                                            👑
                                        </div>
                                    )}
                                </div>
                                {/* Score below card */}
                                {phase >= 2 && (
                                    <div
                                        className="text-center mt-3"
                                        style={{ animation: 'score-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                                    >
                                        <div
                                            className="text-4xl font-black"
                                            style={{ color: creatorWon ? winColor : '#fff' }}
                                        >
                                            {Math.round(creatorScore)}
                                        </div>
                                        <div className="text-xs text-white/50">/100</div>
                                    </div>
                                )}
                            </div>

                            {/* VS Badge in center */}
                            <div
                                className="flex items-center justify-center"
                                style={{
                                    opacity: phase >= 2 ? 1 : 0,
                                    animation: phase === 2 ? 'vs-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none'
                                }}
                            >
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm"
                                    style={{
                                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                        boxShadow: '0 0 30px rgba(139,92,246,0.5)',
                                        border: '2px solid rgba(255,255,255,0.3)'
                                    }}
                                >
                                    VS
                                </div>
                            </div>

                            {/* Right Card - Responder */}
                            <div
                                className="relative"
                                style={{
                                    animation: phase === 1 ? 'slide-in-right 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                                    opacity: phase === 1 ? 0 : 1
                                }}
                            >
                                <div
                                    className="w-36 h-48 rounded-2xl overflow-hidden relative"
                                    style={{
                                        border: phase >= 3 && responderWon ? `3px solid ${winColor}` : '3px solid rgba(255,255,255,0.2)',
                                        boxShadow: phase >= 3 && responderWon ? `0 0 30px ${winColor}50` : '0 8px 32px rgba(0,0,0,0.4)',
                                        filter: phase >= 3 && creatorWon ? 'grayscale(40%) brightness(0.7)' : 'none',
                                        transition: 'all 0.4s ease-out'
                                    }}
                                >
                                    {responderThumb ? (
                                        <img
                                            src={responderThumb}
                                            alt="Opponent"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-bl from-pink-900 to-pink-600 flex items-center justify-center">
                                            <span className="text-5xl">👤</span>
                                        </div>
                                    )}
                                    {/* Label */}
                                    <div className="absolute top-2 right-2">
                                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-black/60 text-white/80 backdrop-blur-sm">
                                            {isCreator ? 'Opponent' : 'You'}
                                        </span>
                                    </div>
                                    {/* Winner badge */}
                                    {phase >= 3 && responderWon && (
                                        <div
                                            className="absolute -top-2 -left-2 w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                            style={{
                                                background: `linear-gradient(135deg, ${winColor}, #00d4ff)`,
                                                boxShadow: `0 0 20px ${winColor}`,
                                                animation: 'winner-pulse 1s ease-in-out infinite'
                                            }}
                                        >
                                            👑
                                        </div>
                                    )}
                                </div>
                                {/* Score below card */}
                                {phase >= 2 && (
                                    <div
                                        className="text-center mt-3"
                                        style={{ animation: 'score-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards', opacity: 0 }}
                                    >
                                        <div
                                            className="text-4xl font-black"
                                            style={{ color: responderWon ? winColor : '#fff' }}
                                        >
                                            {Math.round(responderScore)}
                                        </div>
                                        <div className="text-xs text-white/50">/100</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Result Text */}
                        {phase >= 3 && (
                            <div
                                className="text-center"
                                style={{ animation: 'text-reveal 0.5s ease-out forwards' }}
                            >
                                <h1
                                    className="text-4xl font-black mb-2"
                                    style={{
                                        color: accentColor,
                                        textShadow: `0 0 30px ${accentColor}60`
                                    }}
                                >
                                    {userWon ? '🏆 VICTORY!' : userLost ? '💀 DEFEATED' : '🤝 TIE!'}
                                </h1>
                                <p className="text-white/60 text-lg">
                                    {tied ? 'Exactly matched!' : `Won by ${Math.round(diff)} points`}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Bottom CTAs - Fixed at bottom for mobile */}
            {phase >= 4 && (
                <div
                    className="w-full px-6 pb-safe mb-6"
                    style={{ animation: 'text-reveal 0.5s ease-out forwards' }}
                >
                    <div className="max-w-sm mx-auto space-y-3">
                        {/* Primary CTA */}
                        <button
                            onClick={() => {
                                playSound('click')
                                vibrate(30)
                                onViewScorecard?.()
                            }}
                            className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97]"
                            style={{
                                background: userWon
                                    ? `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`
                                    : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                color: userWon ? '#000' : '#fff',
                                boxShadow: `0 8px 30px ${userWon ? winColor : '#8b5cf6'}50`
                            }}
                        >
                            📊 See My Full Scorecard
                        </button>

                        {/* Secondary Row */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    playSound('click')
                                    vibrate(20)
                                    onShare?.()
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                {userWon ? '🏆 Share Win' : '📤 Share'}
                            </button>
                            <button
                                onClick={() => {
                                    playSound('click')
                                    vibrate(10)
                                    onHome?.()
                                }}
                                className="flex-1 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                🏠 Home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip button during animation */}
            {phase < 4 && phase > 0 && (
                <button
                    onClick={() => setPhase(4)}
                    className="absolute bottom-safe right-4 mb-4 px-4 py-2 rounded-full text-xs text-white/40 bg-white/5 border border-white/10"
                >
                    Skip →
                </button>
            )}
        </div>
    )
}
