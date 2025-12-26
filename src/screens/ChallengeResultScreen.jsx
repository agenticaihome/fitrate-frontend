import React, { useState, useEffect, useRef, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

/**
 * ChallengeResultScreen - Shows "Who Won?" after a challenge scan
 * Stunning victory/defeat celebration with animations
 */

// Confetti piece component
function ConfettiPiece({ delay, color, left }) {
    return (
        <div
            className="confetti-piece"
            style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                width: Math.random() > 0.5 ? '10px' : '8px',
                height: Math.random() > 0.5 ? '10px' : '8px',
                background: color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                transform: `rotate(${Math.random() * 360}deg)`
            }}
        />
    )
}

// Falling ember for loss state
function FallingEmber({ delay, left, size }) {
    return (
        <div
            className="absolute pointer-events-none"
            style={{
                left: `${left}%`,
                top: '-10px',
                width: `${size}px`,
                height: `${size}px`,
                background: 'linear-gradient(135deg, #ff4444 0%, #ff8800 100%)',
                borderRadius: '50%',
                boxShadow: '0 0 6px 2px rgba(255,68,68,0.6)',
                animation: `emberFall 3s ease-in forwards`,
                animationDelay: `${delay}s`,
                opacity: 0.8
            }}
        />
    )
}

// Floating sparkle particle
function Sparkle({ style }) {
    return (
        <div
            className="absolute pointer-events-none"
            style={{
                width: '4px',
                height: '4px',
                background: 'white',
                borderRadius: '50%',
                boxShadow: '0 0 6px 2px rgba(255,255,255,0.8)',
                animation: 'sparkleFloat 2s ease-in-out infinite',
                ...style
            }}
        />
    )
}

// Animated score ring SVG
function ScoreRing({ score, isWinner, color, size = 112 }) {
    const radius = (size / 2) - 6
    const circumference = 2 * Math.PI * radius
    const progress = score / 100
    const strokeDashoffset = circumference * (1 - progress)

    return (
        <svg
            width={size}
            height={size}
            className="absolute inset-0 -rotate-90"
            style={{ filter: isWinner ? `drop-shadow(0 0 15px ${color})` : 'none' }}
        >
            {/* Background ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
            />
            {/* Progress ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                    transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: isWinner ? `drop-shadow(0 0 8px ${color})` : 'none'
                }}
            />
        </svg>
    )
}

export default function ChallengeResultScreen({
    userScore,
    challengeScore,
    userImage,
    onViewResults,
    onChallengeBack,
    onTryAgain,
    onSendResultBack  // NEW: callback to share result back to challenger
}) {
    const won = userScore > challengeScore
    const tied = userScore === challengeScore
    const lost = !won && !tied
    const diff = Math.round(Math.abs(userScore - challengeScore) * 10) / 10

    // Animation states
    const [revealStage, setRevealStage] = useState(0)
    const [displayedUserScore, setDisplayedUserScore] = useState(0)
    const [displayedChallengerScore, setDisplayedChallengerScore] = useState(0)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showEmbers, setShowEmbers] = useState(false)
    const isMounted = useRef(true)

    // Generate confetti pieces
    const confettiPieces = useMemo(() => {
        const colors = won
            ? ['#00ff88', '#00d4ff', '#fff', '#88ffaa', '#00ffcc']
            : tied
                ? ['#ffd700', '#ffaa00', '#fff', '#ffcc00', '#ff8800']
                : []
        return colors.length > 0 ? Array.from({ length: 50 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: Math.random() * 100,
            delay: Math.random() * 0.5
        })) : []
    }, [won, tied])

    // Generate embers for loss
    const embers = useMemo(() => {
        return Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            size: 3 + Math.random() * 4
        }))
    }, [])

    // Generate sparkles
    const sparkles = useMemo(() => {
        return Array.from({ length: 8 }, (_, i) => ({
            id: i,
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
            animationDelay: `${Math.random() * 2}s`,
            opacity: 0.4 + Math.random() * 0.4
        }))
    }, [])

    // Staggered reveal animation
    useEffect(() => {
        isMounted.current = true

        const timers = [
            setTimeout(() => isMounted.current && setRevealStage(1), 100),   // Background
            setTimeout(() => isMounted.current && setRevealStage(2), 400),   // Icon
            setTimeout(() => isMounted.current && setRevealStage(3), 700),   // Title
            setTimeout(() => isMounted.current && setRevealStage(4), 1000),  // Avatars
            setTimeout(() => isMounted.current && setRevealStage(5), 1400),  // Scores animate
            setTimeout(() => isMounted.current && setRevealStage(6), 1800),  // Message
            setTimeout(() => isMounted.current && setRevealStage(7), 2100),  // Buttons
        ]

        return () => {
            isMounted.current = false
            timers.forEach(clearTimeout)
        }
    }, [])

    // Confetti/ember trigger
    useEffect(() => {
        if (revealStage >= 3) {
            if (won || tied) {
                setShowConfetti(true)
                const timer = setTimeout(() => setShowConfetti(false), 3500)
                return () => clearTimeout(timer)
            } else {
                setShowEmbers(true)
                const timer = setTimeout(() => setShowEmbers(false), 4000)
                return () => clearTimeout(timer)
            }
        }
    }, [revealStage, won, tied])

    // Score counting animation
    useEffect(() => {
        if (revealStage < 5) return

        const duration = 1200
        const startTime = Date.now()

        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3)

            if (isMounted.current) {
                setDisplayedUserScore(Math.round(userScore * eased))
                setDisplayedChallengerScore(Math.round(challengeScore * eased))
            }

            if (progress < 1 && isMounted.current) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }, [revealStage, userScore, challengeScore])

    // Sound & haptic feedback
    useEffect(() => {
        if (revealStage === 3) {
            if (won) {
                playSound('celebrate')
                vibrate([100, 50, 100, 50, 200])
            } else if (tied) {
                playSound('pop')
                vibrate([50, 30, 50])
            } else {
                // Dramatic loss sound
                playSound('womp')
                vibrate([200, 100, 200]) // Heavy defeat pattern
            }
        }
    }, [revealStage, won, tied])

    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'
    const accentColor = won ? winColor : tied ? tieColor : loseColor

    // Loss-specific messages for motivation
    const lossMessages = [
        "Time for a comeback!",
        "This isn't over...",
        "Rematch incoming!",
        "They got lucky.",
        "Revenge loading..."
    ]
    const lossMessage = useMemo(() =>
        lossMessages[Math.floor(Math.random() * lossMessages.length)],
        [])

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
            style={{
                background: won
                    ? 'linear-gradient(180deg, #0a1a0a 0%, #001a00 50%, #0a1a0a 100%)'
                    : tied
                        ? 'linear-gradient(180deg, #1a1a0a 0%, #1a1a00 50%, #1a1a0a 100%)'
                        : 'linear-gradient(180deg, #1a0a0a 0%, #1a0000 50%, #1a0a0a 100%)',
                opacity: revealStage >= 1 ? 1 : 0,
                transition: 'opacity 0.5s ease-out'
            }}
        >
            {/* Animated Background Glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: won
                        ? 'radial-gradient(circle at 50% 40%, rgba(0,255,136,0.25) 0%, transparent 60%)'
                        : tied
                            ? 'radial-gradient(circle at 50% 40%, rgba(255,215,0,0.25) 0%, transparent 60%)'
                            : 'radial-gradient(circle at 50% 40%, rgba(255,68,68,0.2) 0%, transparent 60%)',
                    animation: revealStage >= 2 ? 'pulse 3s ease-in-out infinite' : 'none',
                    opacity: revealStage >= 1 ? 1 : 0,
                    transition: 'opacity 0.8s ease-out'
                }}
            />

            {/* Secondary glow orb */}
            <div
                className="absolute pointer-events-none"
                style={{
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    filter: 'blur(40px)',
                    opacity: revealStage >= 2 ? 0.8 : 0,
                    transition: 'opacity 1s ease-out',
                    animation: revealStage >= 2 ? 'float 6s ease-in-out infinite' : 'none'
                }}
            />

            {/* Floating Sparkles (win) */}
            {won && revealStage >= 4 && sparkles.map(sparkle => (
                <Sparkle
                    key={sparkle.id}
                    style={{
                        top: sparkle.top,
                        left: sparkle.left,
                        animationDelay: sparkle.animationDelay,
                        opacity: sparkle.opacity
                    }}
                />
            ))}

            {/* Falling Embers (loss) */}
            {showEmbers && embers.map(ember => (
                <FallingEmber
                    key={ember.id}
                    left={ember.left}
                    delay={ember.delay}
                    size={ember.size}
                />
            ))}

            {/* Confetti */}
            {showConfetti && confettiPieces.map(piece => (
                <ConfettiPiece
                    key={piece.id}
                    color={piece.color}
                    left={piece.left}
                    delay={piece.delay}
                />
            ))}

            {/* Result Icon - Dramatic entrance */}
            <div
                className="text-8xl mb-6"
                style={{
                    opacity: revealStage >= 2 ? 1 : 0,
                    transform: revealStage >= 2
                        ? 'scale(1) rotate(0deg)'
                        : 'scale(0) rotate(-180deg)',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: revealStage >= 3 ? `drop-shadow(0 0 30px ${accentColor})` : 'none',
                    animation: revealStage >= 3
                        ? lost
                            ? 'shake 0.5s ease-in-out 3'
                            : 'float 3s ease-in-out infinite'
                        : 'none'
                }}
            >
                {won ? '🏆' : tied ? '🤝' : '💀'}
            </div>

            {/* Result Title - Animated gradient text */}
            <h1
                className={`text-4xl font-black mb-2 ${won ? 'legendary-text' : ''}`}
                style={{
                    color: won ? undefined : (tied ? tieColor : loseColor),
                    opacity: revealStage >= 3 ? 1 : 0,
                    transform: revealStage >= 3 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    textShadow: won
                        ? `0 0 40px ${winColor}, 0 0 80px ${winColor}40`
                        : tied
                            ? `0 0 30px ${tieColor}80`
                            : `0 0 30px ${loseColor}80`
                }}
            >
                {won ? 'YOU WON!' : tied ? "IT'S A TIE!" : 'DEFEATED'}
            </h1>

            {/* Sub-title for loss */}
            {lost && revealStage >= 3 && (
                <p
                    className="text-lg font-medium mb-2"
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        opacity: revealStage >= 3 ? 1 : 0,
                        transform: revealStage >= 3 ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'all 0.4s ease-out 0.2s'
                    }}
                >
                    {lossMessage}
                </p>
            )}

            {/* Score Comparison */}
            <div
                className="flex items-center gap-6 my-8"
                style={{
                    opacity: revealStage >= 4 ? 1 : 0,
                    transform: revealStage >= 4 ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                {/* Your Score with Photo */}
                <div className="flex flex-col items-center">
                    <span
                        className="text-sm text-white/50 uppercase tracking-widest mb-2 font-medium"
                        style={{
                            opacity: revealStage >= 4 ? 1 : 0,
                            transition: 'opacity 0.3s ease-out 0.2s'
                        }}
                    >
                        You
                    </span>
                    <div className="relative">
                        {/* SVG Score Ring */}
                        {revealStage >= 5 && (
                            <ScoreRing
                                score={userScore}
                                isWinner={won || tied}
                                color={won ? winColor : tied ? tieColor : 'rgba(255,255,255,0.3)'}
                            />
                        )}

                        {/* Photo circle */}
                        <div
                            className="w-28 h-28 rounded-full overflow-hidden relative z-10"
                            style={{
                                border: won ? `3px solid ${winColor}` : tied ? `3px solid ${tieColor}` : '3px solid rgba(255,255,255,0.3)',
                                boxShadow: won
                                    ? `0 0 30px ${winColor}60, inset 0 0 20px ${winColor}20`
                                    : tied
                                        ? `0 0 25px ${tieColor}50`
                                        : 'none',
                                animation: won && revealStage >= 5 ? 'pulse 2s ease-in-out infinite' : 'none'
                            }}
                        >
                            {userImage ? (
                                <img
                                    src={userImage}
                                    alt="Your outfit"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                    <span className="text-3xl">👤</span>
                                </div>
                            )}
                        </div>

                        {/* Score badge - animated pop */}
                        <div
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xl font-black z-20"
                            style={{
                                background: won
                                    ? `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`
                                    : tied
                                        ? `linear-gradient(135deg, ${tieColor} 0%, #ff8800 100%)`
                                        : '#1a1a1a',
                                color: won || tied ? '#000' : '#fff',
                                border: won || tied ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                boxShadow: won
                                    ? `0 4px 20px ${winColor}80`
                                    : tied
                                        ? `0 4px 20px ${tieColor}60`
                                        : 'none',
                                transform: revealStage >= 5 ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)',
                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
                            }}
                        >
                            {displayedUserScore}
                        </div>
                    </div>
                </div>

                {/* VS - Animated */}
                <div
                    className="text-2xl font-black"
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        textShadow: `0 0 20px ${accentColor}30`,
                        opacity: revealStage >= 4 ? 1 : 0,
                        transform: revealStage >= 4 ? 'scale(1)' : 'scale(0)',
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s'
                    }}
                >
                    VS
                </div>

                {/* Challenger Score */}
                <div className="flex flex-col items-center">
                    <span
                        className="text-sm text-white/50 uppercase tracking-widest mb-2 font-medium"
                        style={{
                            opacity: revealStage >= 4 ? 1 : 0,
                            transition: 'opacity 0.3s ease-out 0.2s'
                        }}
                    >
                        Them
                    </span>
                    <div className="relative">
                        {/* SVG Score Ring */}
                        {revealStage >= 5 && (
                            <ScoreRing
                                score={challengeScore}
                                isWinner={lost}
                                color={lost ? loseColor : 'rgba(255,255,255,0.3)'}
                            />
                        )}

                        {/* Placeholder circle for opponent */}
                        <div
                            className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center relative z-10"
                            style={{
                                background: lost ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                                border: lost ? `3px solid ${loseColor}` : '3px solid rgba(255,255,255,0.2)',
                                boxShadow: lost
                                    ? `0 0 30px ${loseColor}50, inset 0 0 20px ${loseColor}20`
                                    : 'none',
                                animation: lost && revealStage >= 5 ? 'pulse 2s ease-in-out infinite' : 'none'
                            }}
                        >
                            <span className="text-4xl">{lost ? '😎' : '🤷'}</span>
                        </div>

                        {/* Score badge */}
                        <div
                            className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xl font-black z-20"
                            style={{
                                background: lost
                                    ? `linear-gradient(135deg, ${loseColor} 0%, #ff8800 100%)`
                                    : '#1a1a1a',
                                color: '#fff',
                                border: lost ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                boxShadow: lost
                                    ? `0 4px 20px ${loseColor}60`
                                    : 'none',
                                transform: revealStage >= 5 ? 'translateX(-50%) scale(1)' : 'translateX(-50%) scale(0)',
                                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s'
                            }}
                        >
                            {displayedChallengerScore}
                        </div>
                    </div>
                </div>
            </div>

            {/* Difference Message - Animated */}
            <p
                className="text-lg mb-8"
                style={{
                    color: 'rgba(255,255,255,0.7)',
                    opacity: revealStage >= 6 ? 1 : 0,
                    transform: revealStage >= 6 ? 'translateY(0)' : 'translateY(15px)',
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                {won
                    ? <span>You beat them by <strong style={{ color: winColor }}>{diff} points</strong>! 🔥</span>
                    : tied
                        ? <span>Exactly the same! <strong style={{ color: tieColor }}>Fate has spoken.</strong></span>
                        : <span>They won by <strong style={{ color: loseColor }}>{diff} points</strong></span>}
            </p>

            {/* CTAs - Staggered reveal */}
            <div
                className="flex flex-col gap-3 w-full max-w-xs"
                style={{
                    opacity: revealStage >= 7 ? 1 : 0,
                    transform: revealStage >= 7 ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                {/* Primary CTA - With shine effect */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        if (won) {
                            onViewResults()
                        } else {
                            onChallengeBack()
                        }
                    }}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] relative overflow-hidden btn-shine"
                    style={{
                        background: won
                            ? `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`
                            : `linear-gradient(135deg, ${loseColor} 0%, #ff8800 100%)`,
                        color: won ? '#000' : '#fff',
                        boxShadow: won
                            ? `0 8px 30px ${winColor}50, 0 0 60px ${winColor}30`
                            : `0 8px 30px ${loseColor}40`,
                        animation: revealStage >= 7 ? 'pulseGlow 2s ease-in-out infinite' : 'none',
                        '--glow-color': won ? winColor : loseColor
                    }}
                >
                    {won ? '🏆 Flex Your Victory' : '⚔️ Demand Rematch!'}
                </button>

                {/* Send Result Back - Let challenger know! */}
                {onSendResultBack && (
                    <button
                        onClick={() => {
                            playSound('click')
                            vibrate(15)
                            onSendResultBack()
                        }}
                        className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                        style={{
                            background: won
                                ? 'linear-gradient(135deg, rgba(0,255,136,0.2) 0%, rgba(0,212,255,0.2) 100%)'
                                : 'linear-gradient(135deg, rgba(255,68,68,0.2) 0%, rgba(255,136,0,0.2) 100%)',
                            color: accentColor,
                            border: `1px solid ${accentColor}40`,
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        {won ? '📤 Send Them Your Victory' : '📤 Tell Them You Accept'}
                    </button>
                )}

                {/* Secondary CTA */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(15)
                        if (won) {
                            onChallengeBack()
                        } else {
                            onTryAgain()
                        }
                    }}
                    className="w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.97]"
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {won ? '👊 Battle Someone Else' : '📸 Try Different Outfit'}
                </button>

                {/* View Full Results */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(10)
                        onViewResults()
                    }}
                    className="w-full py-2 text-sm font-medium transition-all active:opacity-60"
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        textShadow: `0 0 20px ${accentColor}30`
                    }}
                >
                    View Full Results →
                </button>
            </div>
        </div>
    )
}
