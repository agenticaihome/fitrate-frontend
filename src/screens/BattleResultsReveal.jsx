import React, { useState, useEffect, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

/**
 * BattleResultsReveal - Dramatic Cinematic Battle Results
 *
 * Epic reveal sequence:
 * 1. Tension build - "BATTLE RESULTS" pulse
 * 2. Photo collision - Both outfits slam together from sides
 * 3. Score reveal - Numbers fade in over photos
 * 4. Winner announcement - Dramatic reveal with effects
 * 5. Final state - Settled comparison with CTAs
 */

// Confetti piece for winner celebration
function ConfettiPiece({ delay, color, left }) {
    return (
        <div
            className="confetti-piece"
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

// Spark effect at collision point
function CollisionSpark({ delay }) {
    return (
        <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(139,92,246,0.5) 30%, transparent 70%)',
                borderRadius: '50%',
                animation: `spark-burst 0.6s ease-out ${delay}s forwards`,
                opacity: 0
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
    onViewScorecard  // Navigate to detailed scorecard
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

        // Phase 1→2: Collision complete, show scores (1.5s after phase 1)
        const t2 = setTimeout(() => {
            playSound('impact')
            vibrate([50, 30, 100])
            setPhase(2)
        }, 2300)

        // Phase 2→3: Winner reveal (1.2s after scores)
        const t3 = setTimeout(() => {
            playSound('celebrate')
            vibrate([100, 50, 100, 50, 200])
            setPhase(3)
            if (userWon || tied) {
                setShowConfetti(true)
                setTimeout(() => setShowConfetti(false), 4000)
            }
        }, 3500)

        // Phase 3→4: Final state (1.5s after winner)
        const t4 = setTimeout(() => {
            setPhase(4)
        }, 5000)

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
            className="fixed inset-0 z-50 overflow-hidden"
            style={{
                background: '#000',
                touchAction: 'none'
            }}
        >
            {/* CSS Animations */}
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.05); }
                }
                @keyframes slide-left {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slide-right {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes slam-left {
                    0% { transform: translateX(-100%) scale(1.1); }
                    70% { transform: translateX(5%) scale(1.02); }
                    85% { transform: translateX(-2%) scale(1); }
                    100% { transform: translateX(0) scale(1); }
                }
                @keyframes slam-right {
                    0% { transform: translateX(100%) scale(1.1); }
                    70% { transform: translateX(-5%) scale(1.02); }
                    85% { transform: translateX(2%) scale(1); }
                    100% { transform: translateX(0) scale(1); }
                }
                @keyframes spark-burst {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
                    50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
                }
                @keyframes score-pop {
                    0% { opacity: 0; transform: scale(0); }
                    60% { transform: scale(1.2); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes winner-glow {
                    0%, 100% { box-shadow: 0 0 30px rgba(0,255,136,0.5); }
                    50% { box-shadow: 0 0 60px rgba(0,255,136,0.8), 0 0 100px rgba(0,255,136,0.4); }
                }
                @keyframes loser-dim {
                    to { filter: grayscale(50%) brightness(0.6); }
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-10px); }
                    40% { transform: translateX(10px); }
                    60% { transform: translateX(-5px); }
                    80% { transform: translateX(5px); }
                }
                @keyframes text-reveal {
                    0% { opacity: 0; transform: translateY(20px) scale(0.8); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>

            {/* Confetti */}
            {showConfetti && confettiPieces.map(piece => (
                <ConfettiPiece key={piece.id} {...piece} />
            ))}

            {/* Phase 0: Tension Build */}
            {phase === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="text-center"
                        style={{ animation: 'pulse-glow 1s ease-in-out infinite' }}
                    >
                        <div className="text-6xl mb-4">⚔️</div>
                        <h1 className="text-4xl font-black text-white tracking-wider">
                            BATTLE RESULTS
                        </h1>
                    </div>
                </div>
            )}

            {/* Phase 1+: Photo Collision */}
            {phase >= 1 && (
                <div
                    className="absolute inset-0 flex"
                    style={{ animation: phase === 2 ? 'shake 0.3s ease-out' : 'none' }}
                >
                    {/* Left side - Creator */}
                    <div
                        className="w-1/2 h-full relative overflow-hidden"
                        style={{
                            animation: phase === 1 ? 'slam-left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                            filter: phase >= 3 && responderWon ? 'grayscale(50%) brightness(0.6)' : 'none',
                            transition: 'filter 0.5s ease-out'
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
                                <span className="text-8xl">👤</span>
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                        {/* Label */}
                        <div className="absolute top-safe left-4 mt-4">
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/50 text-white/80 backdrop-blur-sm">
                                {isCreator ? 'You' : 'Challenger'}
                            </span>
                        </div>

                        {/* Score overlay - Phase 2+ */}
                        {phase >= 2 && (
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ animation: 'score-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                            >
                                <div className="text-center">
                                    <div
                                        className="text-8xl font-black mb-2"
                                        style={{
                                            color: creatorWon ? winColor : '#fff',
                                            textShadow: `0 0 40px ${creatorWon ? winColor : 'rgba(0,0,0,0.8)'}`,
                                            WebkitTextStroke: '2px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {Math.round(creatorScore)}
                                    </div>
                                    <div className="text-white/60 text-xl font-medium">/100</div>
                                </div>
                            </div>
                        )}

                        {/* Winner/Loser badge - Phase 3+ */}
                        {phase >= 3 && (
                            <div
                                className="absolute bottom-20 left-0 right-0 flex justify-center"
                                style={{ animation: 'text-reveal 0.5s ease-out forwards' }}
                            >
                                {creatorWon && (
                                    <div
                                        className="px-6 py-3 rounded-full font-black text-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`,
                                            color: '#000',
                                            boxShadow: `0 0 30px ${winColor}80`,
                                            animation: 'winner-glow 1.5s ease-in-out infinite'
                                        }}
                                    >
                                        👑 WINNER
                                    </div>
                                )}
                                {responderWon && (
                                    <div className="px-6 py-3 rounded-full font-bold text-sm bg-black/60 text-white/50 border border-white/20">
                                        💀 DEFEATED
                                    </div>
                                )}
                                {tied && (
                                    <div
                                        className="px-6 py-3 rounded-full font-black text-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${tieColor} 0%, #ff8c00 100%)`,
                                            color: '#000'
                                        }}
                                    >
                                        🤝 TIE
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Center divider / VS */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-white/20 z-20" />

                    {/* Collision spark */}
                    {phase === 2 && <CollisionSpark delay={0} />}

                    {/* VS badge */}
                    {phase >= 1 && (
                        <div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                            style={{
                                opacity: phase >= 2 ? 1 : 0,
                                transform: `translate(-50%, -50%) scale(${phase >= 2 ? 1 : 0})`,
                                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}
                        >
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center font-black text-xl"
                                style={{
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                    boxShadow: '0 0 40px rgba(139,92,246,0.6)',
                                    border: '3px solid rgba(255,255,255,0.3)'
                                }}
                            >
                                VS
                            </div>
                        </div>
                    )}

                    {/* Right side - Responder */}
                    <div
                        className="w-1/2 h-full relative overflow-hidden"
                        style={{
                            animation: phase === 1 ? 'slam-right 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                            filter: phase >= 3 && creatorWon ? 'grayscale(50%) brightness(0.6)' : 'none',
                            transition: 'filter 0.5s ease-out'
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
                                <span className="text-8xl">👤</span>
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black/50" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />

                        {/* Label */}
                        <div className="absolute top-safe right-4 mt-4">
                            <span className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/50 text-white/80 backdrop-blur-sm">
                                {isCreator ? 'Opponent' : 'You'}
                            </span>
                        </div>

                        {/* Score overlay - Phase 2+ */}
                        {phase >= 2 && (
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ animation: 'score-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards', opacity: 0 }}
                            >
                                <div className="text-center">
                                    <div
                                        className="text-8xl font-black mb-2"
                                        style={{
                                            color: responderWon ? winColor : '#fff',
                                            textShadow: `0 0 40px ${responderWon ? winColor : 'rgba(0,0,0,0.8)'}`,
                                            WebkitTextStroke: '2px rgba(0,0,0,0.3)'
                                        }}
                                    >
                                        {Math.round(responderScore)}
                                    </div>
                                    <div className="text-white/60 text-xl font-medium">/100</div>
                                </div>
                            </div>
                        )}

                        {/* Winner/Loser badge - Phase 3+ */}
                        {phase >= 3 && (
                            <div
                                className="absolute bottom-20 left-0 right-0 flex justify-center"
                                style={{ animation: 'text-reveal 0.5s ease-out 0.2s forwards', opacity: 0 }}
                            >
                                {responderWon && (
                                    <div
                                        className="px-6 py-3 rounded-full font-black text-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`,
                                            color: '#000',
                                            boxShadow: `0 0 30px ${winColor}80`,
                                            animation: 'winner-glow 1.5s ease-in-out infinite'
                                        }}
                                    >
                                        👑 WINNER
                                    </div>
                                )}
                                {creatorWon && (
                                    <div className="px-6 py-3 rounded-full font-bold text-sm bg-black/60 text-white/50 border border-white/20">
                                        💀 DEFEATED
                                    </div>
                                )}
                                {tied && (
                                    <div
                                        className="px-6 py-3 rounded-full font-black text-lg"
                                        style={{
                                            background: `linear-gradient(135deg, ${tieColor} 0%, #ff8c00 100%)`,
                                            color: '#000'
                                        }}
                                    >
                                        🤝 TIE
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Phase 3+: Winner Announcement Overlay */}
            {phase >= 3 && (
                <div
                    className="absolute top-safe left-0 right-0 flex flex-col items-center pt-20 z-40"
                    style={{ animation: 'text-reveal 0.6s ease-out forwards' }}
                >
                    {/* Mode badge */}
                    <div
                        className="px-4 py-2 rounded-full text-sm font-bold mb-4"
                        style={{
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}
                    >
                        {getModeEmoji(battleMode)} {battleMode.toUpperCase()} MODE
                    </div>

                    {/* Result text */}
                    <h1
                        className="text-5xl font-black mb-2"
                        style={{
                            color: accentColor,
                            textShadow: `0 0 40px ${accentColor}80`
                        }}
                    >
                        {userWon ? 'VICTORY!' : userLost ? 'DEFEATED' : 'TIE GAME!'}
                    </h1>

                    {/* Point difference */}
                    <p className="text-white/70 text-lg">
                        {tied ? 'Exactly matched!' : `Won by ${Math.round(diff)} points`}
                    </p>
                </div>
            )}

            {/* Phase 4: Final CTAs */}
            {phase >= 4 && (
                <div
                    className="absolute bottom-safe left-0 right-0 px-6 pb-8 z-40"
                    style={{ animation: 'text-reveal 0.5s ease-out forwards' }}
                >
                    <div className="flex flex-col gap-3 max-w-sm mx-auto">
                        {/* Primary CTA - See My Scorecard */}
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
                            📊 See My Scorecard
                        </button>

                        {/* Secondary CTAs */}
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
                                    color: 'rgba(255,255,255,0.8)',
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
                                    color: 'rgba(255,255,255,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                🏠 Home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip button (visible during animation) */}
            {phase < 4 && phase > 0 && (
                <button
                    onClick={() => setPhase(4)}
                    className="absolute bottom-safe right-4 mb-4 px-4 py-2 rounded-full text-xs text-white/40 bg-white/5 border border-white/10 z-50"
                >
                    Skip →
                </button>
            )}
        </div>
    )
}
