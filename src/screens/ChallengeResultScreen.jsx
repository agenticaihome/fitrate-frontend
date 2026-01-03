import React, { useState, useEffect, useRef, useMemo, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound, vibrate } from '../utils/soundEffects'

// Lazy load 3D ScoreOrb for legendary scores
const ScoreOrb = lazy(() => import('../components/3d/ScoreOrb'))

/**
 * ChallengeResultScreen - Shows "Who Won?" after a challenge scan
 * Premium 3D celebration with Framer Motion physics
 */

// Framer Motion Confetti - Physics-based celebration
function MotionConfetti({ isActive, colors, count = 70 }) {
    const confetti = useMemo(() => {
        if (!isActive) return []
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: 50 + (Math.random() - 0.5) * 80,
            color: colors[i % colors.length],
            size: 6 + Math.random() * 10,
            rotation: Math.random() * 360,
            delay: Math.random() * 0.5,
            xDrift: (Math.random() - 0.5) * 200,
            shape: Math.random() > 0.5 ? 'circle' : 'square'
        }))
    }, [isActive, colors, count])

    if (!isActive) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {confetti.map(piece => (
                <motion.div
                    key={piece.id}
                    className="absolute"
                    style={{
                        left: `${piece.x}%`,
                        width: piece.size,
                        height: piece.size,
                        background: piece.color,
                        borderRadius: piece.shape === 'circle' ? '50%' : '2px',
                        boxShadow: `0 0 ${piece.size * 1.5}px ${piece.color}80`
                    }}
                    initial={{ top: '-5%', rotate: 0, scale: 1, opacity: 1 }}
                    animate={{
                        top: '110%',
                        x: piece.xDrift,
                        rotate: piece.rotation + 720,
                        scale: [1, 1, 0.5],
                        opacity: [1, 1, 0]
                    }}
                    transition={{
                        duration: 3.5 + Math.random(),
                        delay: piece.delay,
                        ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                />
            ))}
        </div>
    )
}

// Falling Embers for loss - Enhanced with motion
function MotionEmbers({ isActive, count = 30 }) {
    const embers = useMemo(() => {
        if (!isActive) return []
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 3 + Math.random() * 6,
            delay: Math.random() * 2.5,
            xDrift: (Math.random() - 0.5) * 80
        }))
    }, [isActive, count])

    if (!isActive) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {embers.map(ember => (
                <motion.div
                    key={ember.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${ember.left}%`,
                        width: ember.size,
                        height: ember.size,
                        background: 'linear-gradient(135deg, #ff4444 0%, #ff8800 100%)',
                        boxShadow: '0 0 10px 4px rgba(255,68,68,0.7)'
                    }}
                    initial={{ top: '-5%', opacity: 0.9, scale: 1 }}
                    animate={{
                        top: '110%',
                        x: ember.xDrift,
                        opacity: [0.9, 0.6, 0],
                        scale: [1, 0.8, 0.4]
                    }}
                    transition={{
                        duration: 3.5 + Math.random(),
                        delay: ember.delay,
                        ease: 'easeIn'
                    }}
                />
            ))}
        </div>
    )
}

// Floating sparkles with motion
function MotionSparkles({ color, count = 12 }) {
    const sparkles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            top: `${15 + Math.random() * 70}%`,
            left: `${5 + Math.random() * 90}%`,
            size: 2 + Math.random() * 4,
            delay: Math.random() * 3
        }))
    }, [count])

    return (
        <>
            {sparkles.map(sparkle => (
                <motion.div
                    key={sparkle.id}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                        top: sparkle.top,
                        left: sparkle.left,
                        width: sparkle.size,
                        height: sparkle.size,
                        background: '#fff',
                        boxShadow: `0 0 ${sparkle.size * 3}px ${color}`
                    }}
                    animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: 2,
                        delay: sparkle.delay,
                        repeat: Infinity,
                        repeatDelay: Math.random() * 2
                    }}
                />
            ))}
        </>
    )
}

// Animated Score Ring with motion
function AnimatedScoreRing({ score, isWinner, color, size = 120 }) {
    const radius = (size / 2) - 8
    const circumference = 2 * Math.PI * radius

    return (
        <motion.svg
            width={size}
            height={size}
            className="absolute inset-0 -rotate-90"
            style={{ filter: isWinner ? `drop-shadow(0 0 20px ${color})` : 'none' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
            {/* Background ring */}
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="5"
            />
            {/* Progress ring */}
            <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - score / 100) }}
                transition={{ duration: 1.5, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                style={{
                    filter: isWinner ? `drop-shadow(0 0 10px ${color})` : 'none'
                }}
            />
        </motion.svg>
    )
}

// Pulsing rings effect
function PulsingRingsEffect({ color, isActive }) {
    if (!isActive) return null

    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[0, 1, 2].map(i => (
                <motion.div
                    key={i}
                    className="absolute rounded-full border-2"
                    style={{
                        width: '100%',
                        height: '100%',
                        borderColor: color
                    }}
                    initial={{ scale: 0.8, opacity: 0.6 }}
                    animate={{
                        scale: [0.8, 1.4, 2],
                        opacity: [0.6, 0.3, 0]
                    }}
                    transition={{
                        duration: 2,
                        delay: i * 0.4,
                        repeat: Infinity,
                        ease: 'easeOut'
                    }}
                />
            ))}
        </div>
    )
}

export default function ChallengeResultScreen({
    userScore,
    challengeScore,
    userImage,
    onViewResults,
    onChallengeBack,
    onTryAgain,
    onSendResultBack
}) {
    const won = userScore > challengeScore
    const tied = userScore === challengeScore
    const lost = !won && !tied
    const diff = Math.round(Math.abs(userScore - challengeScore) * 10) / 10
    const isLegendary = userScore >= 90

    // Animation states
    const [revealStage, setRevealStage] = useState(0)
    const [displayedUserScore, setDisplayedUserScore] = useState(0)
    const [displayedChallengerScore, setDisplayedChallengerScore] = useState(0)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showEmbers, setShowEmbers] = useState(false)
    const isMounted = useRef(true)

    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'
    const accentColor = won ? winColor : tied ? tieColor : loseColor

    const confettiColors = won
        ? ['#00ff88', '#00d4ff', '#fff', '#88ffaa', '#00ffcc', '#ffd700']
        : ['#ffd700', '#ffaa00', '#fff', '#ffcc00', '#ff8800']

    // Loss messages
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

    // Staggered reveal animation
    useEffect(() => {
        isMounted.current = true

        const timers = [
            setTimeout(() => isMounted.current && setRevealStage(1), 100),
            setTimeout(() => isMounted.current && setRevealStage(2), 400),
            setTimeout(() => isMounted.current && setRevealStage(3), 700),
            setTimeout(() => isMounted.current && setRevealStage(4), 1000),
            setTimeout(() => isMounted.current && setRevealStage(5), 1400),
            setTimeout(() => isMounted.current && setRevealStage(6), 1800),
            setTimeout(() => isMounted.current && setRevealStage(7), 2100),
        ]

        return () => {
            isMounted.current = false
            timers.forEach(clearTimeout)
        }
    }, [])

    // Celebration trigger
    useEffect(() => {
        if (revealStage >= 3) {
            if (won || tied) {
                setShowConfetti(true)
                const timer = setTimeout(() => setShowConfetti(false), 4000)
                return () => clearTimeout(timer)
            } else {
                setShowEmbers(true)
                const timer = setTimeout(() => setShowEmbers(false), 4500)
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

    // Sound & haptic
    useEffect(() => {
        if (revealStage === 3) {
            if (won) {
                playSound('celebrate')
                vibrate([100, 50, 100, 50, 200])
            } else if (tied) {
                playSound('pop')
                vibrate([50, 30, 50])
            } else {
                playSound('womp')
                vibrate([200, 100, 200])
            }
        }
    }, [revealStage, won, tied])

    return (
        <motion.div
            className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
            style={{
                background: won
                    ? 'linear-gradient(180deg, #0a1a0a 0%, #001a00 50%, #0a1a0a 100%)'
                    : tied
                        ? 'linear-gradient(180deg, #1a1a0a 0%, #1a1a00 50%, #1a1a0a 100%)'
                        : 'linear-gradient(180deg, #1a0a0a 0%, #1a0000 50%, #1a0a0a 100%)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Animated Background Glow */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: won
                        ? 'radial-gradient(circle at 50% 40%, rgba(0,255,136,0.3) 0%, transparent 60%)'
                        : tied
                            ? 'radial-gradient(circle at 50% 40%, rgba(255,215,0,0.3) 0%, transparent 60%)'
                            : 'radial-gradient(circle at 50% 40%, rgba(255,68,68,0.25) 0%, transparent 60%)'
                }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.8, 1, 0.8]
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            {/* Floating orbs */}
            <motion.div
                className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
                    top: '15%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    filter: 'blur(60px)'
                }}
                animate={{
                    scale: [1, 1.2, 1],
                    y: [0, -20, 0]
                }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            {/* Motion Sparkles (win) */}
            {won && revealStage >= 4 && <MotionSparkles color={winColor} count={15} />}

            {/* Motion Confetti */}
            <MotionConfetti
                isActive={showConfetti}
                colors={confettiColors}
                count={80}
            />

            {/* Motion Embers (loss) */}
            <MotionEmbers isActive={showEmbers} count={35} />

            {/* Result Icon - Dramatic 3D entrance */}
            <motion.div
                className="text-8xl mb-6"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{
                    scale: revealStage >= 2 ? 1 : 0,
                    rotate: revealStage >= 2 ? 0 : -180,
                    opacity: revealStage >= 2 ? 1 : 0
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                style={{
                    filter: revealStage >= 3 ? `drop-shadow(0 0 40px ${accentColor})` : 'none'
                }}
            >
                <motion.span
                    animate={
                        revealStage >= 3
                            ? lost
                                ? { x: [0, -10, 10, -10, 10, 0] }
                                : { y: [0, -10, 0], rotateY: [0, 15, 0] }
                            : {}
                    }
                    transition={{
                        duration: lost ? 0.5 : 3,
                        repeat: lost ? 2 : Infinity,
                        ease: 'easeInOut'
                    }}
                    style={{ display: 'inline-block' }}
                >
                    {won ? '🏆' : tied ? '🤝' : '💀'}
                </motion.span>
            </motion.div>

            {/* Result Title */}
            <motion.h1
                className={`text-4xl font-black mb-2 ${won ? 'legendary-text' : ''}`}
                style={{
                    color: won ? undefined : (tied ? tieColor : loseColor),
                    textShadow: won
                        ? `0 0 50px ${winColor}, 0 0 100px ${winColor}40`
                        : `0 0 40px ${accentColor}80`
                }}
                initial={{ opacity: 0, y: 30, scale: 0.8 }}
                animate={{
                    opacity: revealStage >= 3 ? 1 : 0,
                    y: revealStage >= 3 ? 0 : 30,
                    scale: revealStage >= 3 ? 1 : 0.8
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                {won ? 'YOU WON!' : tied ? "IT'S A TIE!" : 'DEFEATED'}
            </motion.h1>

            {/* Sub-title for loss */}
            <AnimatePresence>
                {lost && revealStage >= 3 && (
                    <motion.p
                        className="text-lg font-medium mb-2"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {lossMessage}
                    </motion.p>
                )}
            </AnimatePresence>

            {/* Score Comparison */}
            <motion.div
                className="flex items-center gap-8 my-8"
                initial={{ opacity: 0, y: 40 }}
                animate={{
                    opacity: revealStage >= 4 ? 1 : 0,
                    y: revealStage >= 4 ? 0 : 40
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                {/* Your Score */}
                <div className="flex flex-col items-center">
                    <motion.span
                        className="text-sm text-gray-400 uppercase tracking-widest mb-3 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: revealStage >= 4 ? 1 : 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        You
                    </motion.span>
                    <div className="relative w-32 h-32">
                        {/* Pulsing rings for winner */}
                        <PulsingRingsEffect color={won ? winColor : tieColor} isActive={won || tied} />

                        {/* Score Ring */}
                        {revealStage >= 5 && (
                            <AnimatedScoreRing
                                score={userScore}
                                isWinner={won || tied}
                                color={won ? winColor : tied ? tieColor : 'rgba(255,255,255,0.3)'}
                                size={128}
                            />
                        )}

                        {/* Photo */}
                        <motion.div
                            className="w-full h-full rounded-full overflow-hidden relative z-10"
                            style={{
                                border: won ? `4px solid ${winColor}` : tied ? `4px solid ${tieColor}` : '4px solid rgba(255,255,255,0.3)',
                                boxShadow: won
                                    ? `0 0 40px ${winColor}60, inset 0 0 30px ${winColor}20`
                                    : tied
                                        ? `0 0 35px ${tieColor}50`
                                        : 'none'
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: revealStage >= 4 ? 1 : 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                        >
                            {userImage ? (
                                <img src={userImage} alt="Your outfit" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                    <span className="text-3xl">👤</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Score Badge */}
                        <motion.div
                            className="absolute -bottom-4 left-1/2 px-5 py-2 rounded-full text-2xl font-black z-20"
                            style={{
                                background: won
                                    ? `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`
                                    : tied
                                        ? `linear-gradient(135deg, ${tieColor} 0%, #ff8800 100%)`
                                        : '#1a1a1a',
                                color: won || tied ? '#000' : '#fff',
                                border: won || tied ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                boxShadow: won
                                    ? `0 6px 25px ${winColor}80`
                                    : tied
                                        ? `0 6px 25px ${tieColor}60`
                                        : 'none',
                                x: '-50%'
                            }}
                            initial={{ scale: 0, y: 20 }}
                            animate={{
                                scale: revealStage >= 5 ? 1 : 0,
                                y: revealStage >= 5 ? 0 : 20
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                        >
                            {displayedUserScore}
                        </motion.div>
                    </div>
                </div>

                {/* VS */}
                <motion.div
                    className="text-3xl font-black"
                    style={{
                        color: 'rgba(255,255,255,0.4)',
                        textShadow: `0 0 30px ${accentColor}30`
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{
                        scale: revealStage >= 4 ? 1 : 0,
                        opacity: revealStage >= 4 ? 1 : 0
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                >
                    VS
                </motion.div>

                {/* Challenger Score */}
                <div className="flex flex-col items-center">
                    <motion.span
                        className="text-sm text-gray-400 uppercase tracking-widest mb-3 font-medium"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: revealStage >= 4 ? 1 : 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Them
                    </motion.span>
                    <div className="relative w-32 h-32">
                        {/* Pulsing rings for loser */}
                        <PulsingRingsEffect color={loseColor} isActive={lost} />

                        {/* Score Ring */}
                        {revealStage >= 5 && (
                            <AnimatedScoreRing
                                score={challengeScore}
                                isWinner={lost}
                                color={lost ? loseColor : 'rgba(255,255,255,0.3)'}
                                size={128}
                            />
                        )}

                        {/* Opponent */}
                        <motion.div
                            className="w-full h-full rounded-full overflow-hidden flex items-center justify-center relative z-10"
                            style={{
                                background: lost ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                                border: lost ? `4px solid ${loseColor}` : '4px solid rgba(255,255,255,0.2)',
                                boxShadow: lost
                                    ? `0 0 40px ${loseColor}50, inset 0 0 30px ${loseColor}20`
                                    : 'none'
                            }}
                            initial={{ scale: 0 }}
                            animate={{ scale: revealStage >= 4 ? 1 : 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.15 }}
                        >
                            <span className="text-4xl">{lost ? '😎' : '🤷'}</span>
                        </motion.div>

                        {/* Score Badge */}
                        <motion.div
                            className="absolute -bottom-4 left-1/2 px-5 py-2 rounded-full text-2xl font-black z-20"
                            style={{
                                background: lost
                                    ? `linear-gradient(135deg, ${loseColor} 0%, #ff8800 100%)`
                                    : '#1a1a1a',
                                color: '#fff',
                                border: lost ? 'none' : '2px solid rgba(255,255,255,0.3)',
                                boxShadow: lost
                                    ? `0 6px 25px ${loseColor}60`
                                    : 'none',
                                x: '-50%'
                            }}
                            initial={{ scale: 0, y: 20 }}
                            animate={{
                                scale: revealStage >= 5 ? 1 : 0,
                                y: revealStage >= 5 ? 0 : 20
                            }}
                            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.4 }}
                        >
                            {displayedChallengerScore}
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Difference Message */}
            <motion.p
                className="text-lg mb-8"
                style={{ color: 'rgba(255,255,255,0.7)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                    opacity: revealStage >= 6 ? 1 : 0,
                    y: revealStage >= 6 ? 0 : 20
                }}
                transition={{ duration: 0.4 }}
            >
                {won
                    ? <span>You beat them by <strong style={{ color: winColor }}>{diff} points</strong>! 🔥</span>
                    : tied
                        ? <span>Exactly the same! <strong style={{ color: tieColor }}>Fate has spoken.</strong></span>
                        : <span>They won by <strong style={{ color: loseColor }}>{diff} points</strong></span>}
            </motion.p>

            {/* CTAs */}
            <motion.div
                className="flex flex-col gap-3 w-full max-w-xs"
                initial={{ opacity: 0, y: 30 }}
                animate={{
                    opacity: revealStage >= 7 ? 1 : 0,
                    y: revealStage >= 7 ? 0 : 30
                }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
                {/* Primary CTA */}
                <motion.button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        won ? onViewResults() : onChallengeBack()
                    }}
                    className="w-full py-4 rounded-2xl font-bold text-lg relative overflow-hidden"
                    style={{
                        background: won
                            ? `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`
                            : `linear-gradient(135deg, ${loseColor} 0%, #ff8800 100%)`,
                        color: won ? '#000' : '#fff',
                        boxShadow: won
                            ? `0 8px 35px ${winColor}60, 0 0 80px ${winColor}30`
                            : `0 8px 35px ${loseColor}50`
                    }}
                    whileHover={{ scale: 1.02, boxShadow: won
                        ? `0 12px 50px ${winColor}70, 0 0 100px ${winColor}40`
                        : `0 12px 50px ${loseColor}60`
                    }}
                    whileTap={{ scale: 0.97 }}
                >
                    {/* Shimmer */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
                        }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <span className="relative z-10">
                        {won ? '🏆 Flex Your Victory' : '⚔️ Demand Rematch!'}
                    </span>
                </motion.button>

                {/* Send Result Back */}
                {onSendResultBack && (
                    <motion.button
                        onClick={() => {
                            playSound('click')
                            vibrate(15)
                            onSendResultBack()
                        }}
                        className="w-full py-3 rounded-xl font-bold text-sm glass-medium"
                        style={{
                            color: accentColor,
                            border: `1px solid ${accentColor}40`
                        }}
                        whileHover={{ scale: 1.02, borderColor: `${accentColor}60` }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {won ? '📤 Send Them Your Victory' : '📤 Tell Them You Accept'}
                    </motion.button>
                )}

                {/* Secondary CTA */}
                <motion.button
                    onClick={() => {
                        playSound('click')
                        vibrate(15)
                        won ? onChallengeBack() : onTryAgain()
                    }}
                    className="w-full py-3 rounded-xl font-medium text-sm glass-light"
                    style={{ color: 'rgba(255,255,255,0.8)' }}
                    whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.1)' }}
                    whileTap={{ scale: 0.97 }}
                >
                    {won ? '👊 Battle Someone Else' : '📸 Try Different Outfit'}
                </motion.button>

                {/* View Full Results */}
                <motion.button
                    onClick={() => {
                        playSound('click')
                        vibrate(10)
                        onViewResults()
                    }}
                    className="w-full py-2 text-sm font-medium"
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        textShadow: `0 0 25px ${accentColor}30`
                    }}
                    whileHover={{ color: 'rgba(255,255,255,0.8)' }}
                    whileTap={{ scale: 0.97 }}
                >
                    View Full Results →
                </motion.button>
            </motion.div>
        </motion.div>
    )
}
