import React, { useState, useEffect, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import BattleShareCard from '../components/modals/BattleShareCard'

/**
 * BattleResultsReveal - CINEMATIC PREMIUM Battle Results
 *
 * Next-level reveal sequence with Hollywood-grade effects:
 * 1. Film grain overlay + ambient particles for premium atmosphere
 * 2. 3D perspective cards with depth and tilt
 * 3. Dramatic collision with lens flare, shockwave, chromatic aberration
 * 4. Light rays radiating from winner
 * 5. Glitch text reveal for maximum impact
 */

// ============================================
// CINEMATIC FILM GRAIN OVERLAY
// ============================================
function FilmGrain() {
    return (
        <div
            className="fixed inset-0 pointer-events-none z-[200]"
            style={{
                background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                opacity: 0.035,
                mixBlendMode: 'overlay',
                animation: 'grain-shift 0.5s steps(10) infinite'
            }}
        />
    )
}

// ============================================
// CINEMATIC LENS FLARE
// ============================================
function LensFlare({ show, color = '#00d4ff' }) {
    if (!show) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[85] flex items-center justify-center">
            {/* Main flare burst */}
            <div
                style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    background: `radial-gradient(circle, ${color}80 0%, ${color}40 20%, ${color}10 40%, transparent 70%)`,
                    animation: 'lens-flare-burst 0.8s ease-out forwards',
                    filter: 'blur(2px)'
                }}
            />
            {/* Horizontal streak */}
            <div
                style={{
                    position: 'absolute',
                    width: '100vw',
                    height: '4px',
                    background: `linear-gradient(90deg, transparent 0%, ${color}60 30%, ${color} 50%, ${color}60 70%, transparent 100%)`,
                    animation: 'lens-streak 0.6s ease-out forwards',
                    filter: 'blur(1px)'
                }}
            />
            {/* Vertical streak */}
            <div
                style={{
                    position: 'absolute',
                    width: '4px',
                    height: '60vh',
                    background: `linear-gradient(180deg, transparent 0%, ${color}40 30%, ${color}80 50%, ${color}40 70%, transparent 100%)`,
                    animation: 'lens-streak-v 0.6s ease-out forwards',
                    filter: 'blur(1px)'
                }}
            />
            {/* Hexagonal bokeh elements */}
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: `${20 + i * 15}px`,
                        height: `${20 + i * 15}px`,
                        background: `radial-gradient(circle, ${color}${40 - i * 5} 0%, transparent 70%)`,
                        borderRadius: '50%',
                        left: `calc(50% + ${(i - 2.5) * 60}px)`,
                        top: `calc(50% + ${Math.sin(i) * 30}px)`,
                        animation: `bokeh-fade 0.8s ease-out ${i * 0.05}s forwards`,
                        filter: 'blur(2px)'
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// SHOCKWAVE RING EFFECT
// ============================================
function ShockwaveRing({ show, color = '#00d4ff' }) {
    if (!show) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[80] flex items-center justify-center">
            {/* Multiple expanding rings */}
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        width: '100px',
                        height: '100px',
                        border: `3px solid ${color}`,
                        borderRadius: '50%',
                        animation: `shockwave-expand 0.8s ease-out ${i * 0.1}s forwards`,
                        boxShadow: `0 0 20px ${color}, inset 0 0 20px ${color}40`
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// CHROMATIC ABERRATION OVERLAY
// ============================================
function ChromaticAberration({ show }) {
    if (!show) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none z-[95]"
            style={{
                animation: 'chromatic-pulse 0.3s ease-out forwards'
            }}
        >
            {/* Red channel shift */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'transparent',
                    boxShadow: 'inset -4px 0 20px rgba(255,0,0,0.3)',
                    animation: 'chromatic-shift-r 0.3s ease-out forwards'
                }}
            />
            {/* Blue channel shift */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'transparent',
                    boxShadow: 'inset 4px 0 20px rgba(0,100,255,0.3)',
                    animation: 'chromatic-shift-b 0.3s ease-out forwards'
                }}
            />
        </div>
    )
}

// ============================================
// LIGHT RAYS FROM WINNER
// ============================================
function VictoryRays({ show, color = '#00ff88' }) {
    if (!show) return null

    const rays = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            angle: (i / 12) * 360,
            length: 150 + Math.random() * 100,
            width: 2 + Math.random() * 3,
            delay: Math.random() * 0.3
        })), []
    )

    return (
        <div className="fixed inset-0 pointer-events-none z-[75] flex items-center justify-center">
            {rays.map(ray => (
                <div
                    key={ray.id}
                    style={{
                        position: 'absolute',
                        width: `${ray.length}px`,
                        height: `${ray.width}px`,
                        background: `linear-gradient(90deg, ${color} 0%, ${color}80 30%, transparent 100%)`,
                        transformOrigin: 'left center',
                        transform: `rotate(${ray.angle}deg)`,
                        animation: `ray-burst 1s ease-out ${ray.delay}s forwards`,
                        opacity: 0,
                        filter: 'blur(1px)'
                    }}
                />
            ))}
            {/* Central glow */}
            <div
                style={{
                    position: 'absolute',
                    width: '200px',
                    height: '200px',
                    background: `radial-gradient(circle, ${color}60 0%, ${color}20 40%, transparent 70%)`,
                    animation: 'victory-glow-pulse 2s ease-in-out infinite',
                    filter: 'blur(10px)'
                }}
            />
        </div>
    )
}

// ============================================
// PREMIUM AMBIENT PARTICLES
// ============================================
function PremiumParticles() {
    const particles = useMemo(() =>
        Array.from({ length: 50 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 3,
            delay: Math.random() * 8,
            duration: 10 + Math.random() * 10,
            opacity: 0.2 + Math.random() * 0.4,
            color: ['#00d4ff', '#00ff88', '#8b5cf6', '#fff'][Math.floor(Math.random() * 4)],
            drift: -20 + Math.random() * 40
        })), []
    )

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            {particles.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.left}%`,
                        bottom: '-20px',
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        borderRadius: '50%',
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                        animation: `premium-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// GLITCH TEXT EFFECT
// ============================================
function GlitchText({ children, color }) {
    return (
        <div className="relative inline-block">
            {/* Glitch layers */}
            <span
                className="absolute inset-0"
                style={{
                    color: '#ff0000',
                    clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)',
                    transform: 'translate(-2px, 0)',
                    animation: 'glitch-top 0.3s ease-out'
                }}
                aria-hidden="true"
            >
                {children}
            </span>
            <span
                className="absolute inset-0"
                style={{
                    color: '#00ffff',
                    clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)',
                    transform: 'translate(2px, 0)',
                    animation: 'glitch-bottom 0.3s ease-out'
                }}
                aria-hidden="true"
            >
                {children}
            </span>
            {/* Main text */}
            <span style={{ color, position: 'relative' }}>{children}</span>
        </div>
    )
}

// ============================================
// IMPACT SPARKS (Enhanced)
// ============================================
function ImpactSparks({ show }) {
    const sparks = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            angle: (i / 30) * 360 + Math.random() * 20,
            distance: 80 + Math.random() * 120,
            size: 2 + Math.random() * 5,
            color: ['#00d4ff', '#00ff88', '#fff', '#ffd700', '#ff6b6b', '#8b5cf6'][i % 6],
            duration: 0.4 + Math.random() * 0.3,
            hasTrail: Math.random() > 0.5
        })), []
    )

    if (!show) return null

    return (
        <div className="fixed inset-0 pointer-events-none z-[90] flex items-center justify-center">
            {sparks.map(s => (
                <div
                    key={s.id}
                    style={{
                        position: 'absolute',
                        width: s.size,
                        height: s.size,
                        background: s.color,
                        borderRadius: '50%',
                        boxShadow: `0 0 ${s.size * 2}px ${s.color}, 0 0 ${s.size * 4}px ${s.color}50`,
                        animation: `spark-burst-enhanced ${s.duration}s ease-out forwards`,
                        '--spark-angle': `${s.angle}deg`,
                        '--spark-distance': `${s.distance}px`
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// CONFETTI (Enhanced with more variety)
// ============================================
function ConfettiPiece({ delay, color, left }) {
    const style = useMemo(() => ({
        position: 'absolute',
        left: `${left}%`,
        top: '-20px',
        animationDelay: `${delay}s`,
        width: Math.random() > 0.5 ? '12px' : '8px',
        height: Math.random() > 0.5 ? '12px' : '8px',
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        animation: `confetti-fall-3d ${2.5 + Math.random() * 1.5}s ease-out forwards`,
        zIndex: 100,
        boxShadow: `0 0 6px ${color}80`
    }), [delay, color, left])

    return <div style={style} />
}

// ============================================
// ANIMATED SCORE (Enhanced with glow)
// ============================================
function AnimatedScore({ targetScore, color, delay = 0, isWinner = false }) {
    const [displayScore, setDisplayScore] = useState(0)
    const [showGlow, setShowGlow] = useState(false)

    useEffect(() => {
        const timeout = setTimeout(() => {
            const duration = 1000
            const steps = 30
            const increment = targetScore / steps
            let current = 0
            let step = 0

            const interval = setInterval(() => {
                step++
                // Eased counting - starts fast, slows at end
                const progress = step / steps
                const easedProgress = 1 - Math.pow(1 - progress, 3)
                current = Math.round(targetScore * easedProgress)
                setDisplayScore(current)

                if (step >= steps) {
                    clearInterval(interval)
                    setDisplayScore(targetScore)
                    if (isWinner) setShowGlow(true)
                }
            }, duration / steps)

            return () => clearInterval(interval)
        }, delay)

        return () => clearTimeout(timeout)
    }, [targetScore, delay, isWinner])

    return (
        <div
            className="text-5xl font-black relative"
            style={{
                color,
                textShadow: showGlow ? `0 0 30px ${color}, 0 0 60px ${color}80` : 'none',
                transition: 'text-shadow 0.3s ease-out'
            }}
        >
            {Math.round(displayScore)}
        </div>
    )
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function BattleResultsReveal({
    battleData,
    isCreator,
    onComplete,
    onShare,
    onRematch,
    onHome,
    onViewScorecard,
    onPlayAgain  // NEW: Quick re-enter arena with same photo
}) {
    // Animation phases
    const [phase, setPhase] = useState(0)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showFlash, setShowFlash] = useState(false)
    const [showShake, setShowShake] = useState(false)
    const [showSparks, setShowSparks] = useState(false)
    const [showLensFlare, setShowLensFlare] = useState(false)
    const [showShockwave, setShowShockwave] = useState(false)
    const [showChromatic, setShowChromatic] = useState(false)
    const [showVictoryRays, setShowVictoryRays] = useState(false)
    const [cameraZoom, setCameraZoom] = useState(1)
    const [showShareCard, setShowShareCard] = useState(false)

    // Battle data
    const creatorScore = battleData?.creatorScore || 0
    const responderScore = battleData?.responderScore || 0
    const creatorThumb = battleData?.creatorThumb
    const responderThumb = battleData?.responderThumb
    const battleMode = battleData?.mode || 'nice'

    // NEW: Original scores (what users saw when they first scanned)
    const originalCreatorScore = battleData?.originalCreatorScore
    const originalResponderScore = battleData?.originalResponderScore
    const scoresRecalculated = battleData?.scoresRecalculated

    // Determine winner - USE API winner field (AI head-to-head comparison)
    // Falls back to score comparison for legacy battles without winner field
    const apiWinner = battleData?.winner // 'creator' | 'opponent' | 'tie' | null
    const creatorWon = apiWinner ? apiWinner === 'creator' : creatorScore > responderScore
    const responderWon = apiWinner ? apiWinner === 'opponent' : responderScore > creatorScore
    const tied = apiWinner ? apiWinner === 'tie' : creatorScore === responderScore
    const userWon = isCreator ? creatorWon : responderWon
    const userLost = isCreator ? responderWon : creatorWon

    // Use marginOfVictory from API if available, otherwise calculate from scores
    const diff = battleData?.marginOfVictory ?? Math.abs(creatorScore - responderScore)

    // Colors
    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'
    const accentColor = userWon ? winColor : userLost ? loseColor : tieColor

    // Confetti pieces
    const confettiPieces = useMemo(() => {
        const colors = ['#00ff88', '#00d4ff', '#fff', '#ffd700', '#ff69b4', '#8b5cf6', '#ff6b6b']
        return Array.from({ length: 60 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: Math.random() * 100,
            delay: Math.random() * 1
        }))
    }, [])

    // Cinematic animation sequence
    useEffect(() => {
        // Phase 0: Tension build with slow zoom (1s)
        const zoomIn = setInterval(() => {
            setCameraZoom(prev => Math.min(prev + 0.002, 1.05))
        }, 20)

        const t1 = setTimeout(() => {
            clearInterval(zoomIn)
            playSound('whoosh')
            vibrate(30)
            setPhase(1)
        }, 1000)

        // Phase 1→2: EPIC COLLISION (0.8s after phase 1)
        const t2 = setTimeout(() => {
            playSound('impact')
            vibrate([50, 30, 100, 50, 150])

            // Trigger ALL cinematic effects simultaneously
            setShowFlash(true)
            setShowShake(true)
            setShowSparks(true)
            setShowLensFlare(true)
            setShowShockwave(true)
            setShowChromatic(true)

            // Camera punch zoom
            setCameraZoom(1.08)
            setTimeout(() => setCameraZoom(1), 200)

            // Staggered cleanup
            setTimeout(() => setShowFlash(false), 250)
            setTimeout(() => setShowChromatic(false), 350)
            setTimeout(() => setShowShake(false), 500)
            setTimeout(() => setShowSparks(false), 700)
            setTimeout(() => setShowShockwave(false), 800)
            setTimeout(() => setShowLensFlare(false), 900)

            setPhase(2)
        }, 1800)

        // Phase 2→3: Winner reveal (1s after scores)
        const t3 = setTimeout(() => {
            playSound('celebrate')
            vibrate([100, 50, 100, 50, 200])
            setPhase(3)

            if (userWon || tied) {
                setShowConfetti(true)
                setShowVictoryRays(true)
                setTimeout(() => setShowConfetti(false), 5000)
            }
        }, 3000)

        // Phase 3→4: Final state (1.2s after winner)
        const t4 = setTimeout(() => {
            setPhase(4)
        }, 4200)

        return () => {
            clearInterval(zoomIn)
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
        }
    }, [userWon, tied])

    // Mode helpers
    const getModeEmoji = (m) => {
        const emojis = { nice: '😇', roast: '🔥', honest: '📊', savage: '💀', rizz: '😏', celeb: '⭐', aura: '🔮', chaos: '🎪', y2k: '💿', villain: '🦹', coquette: '🎀', hypebeast: '🔥' }
        return emojis[m] || '😇'
    }

    return (
        <div
            className="fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden"
            style={{
                background: 'linear-gradient(180deg, #0a0a15 0%, #1a1a2e 50%, #0a0a15 100%)',
                touchAction: 'pan-y',
                transform: `scale(${cameraZoom})`,
                transition: showShake ? 'none' : 'transform 0.15s ease-out',
                animation: showShake ? 'screen-shake-intense 0.5s ease-out' : 'none',
                paddingBottom: 'env(safe-area-inset-bottom, 20px)'
            }}
        >
            {/* ========== CINEMATIC OVERLAYS ========== */}

            {/* Film grain for Hollywood texture */}
            <FilmGrain />

            {/* Flash overlay for collision impact */}
            {showFlash && (
                <div
                    className="fixed inset-0 z-[100] pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at center, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                        animation: 'flash-white-cinematic 0.25s ease-out forwards'
                    }}
                />
            )}

            {/* Chromatic aberration */}
            <ChromaticAberration show={showChromatic} />

            {/* Lens flare */}
            <LensFlare show={showLensFlare} color={accentColor} />

            {/* Shockwave rings */}
            <ShockwaveRing show={showShockwave} color="#00d4ff" />

            {/* Victory rays */}
            <VictoryRays show={showVictoryRays && phase >= 3} color={winColor} />

            {/* Premium atmosphere - floating particles */}
            <PremiumParticles />

            {/* Impact sparks on collision */}
            <ImpactSparks show={showSparks} />

            {/* Vignette overlay for cinematic framing */}
            <div
                className="fixed inset-0 pointer-events-none z-[5]"
                style={{
                    background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)'
                }}
            />

            {/* ========== CSS ANIMATIONS ========== */}
            <style>{`
                @keyframes grain-shift {
                    0%, 100% { transform: translate(0, 0); }
                    10% { transform: translate(-2%, -2%); }
                    20% { transform: translate(2%, 2%); }
                    30% { transform: translate(-1%, 1%); }
                    40% { transform: translate(1%, -1%); }
                    50% { transform: translate(-2%, 2%); }
                    60% { transform: translate(2%, -2%); }
                    70% { transform: translate(-1%, -1%); }
                    80% { transform: translate(1%, 1%); }
                    90% { transform: translate(-2%, -1%); }
                }

                @keyframes lens-flare-burst {
                    0% { transform: scale(0); opacity: 1; }
                    50% { opacity: 0.8; }
                    100% { transform: scale(3); opacity: 0; }
                }

                @keyframes lens-streak {
                    0% { transform: scaleX(0); opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { transform: scaleX(1.5); opacity: 0; }
                }

                @keyframes lens-streak-v {
                    0% { transform: scaleY(0); opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { transform: scaleY(1.2); opacity: 0; }
                }

                @keyframes bokeh-fade {
                    0% { opacity: 0; transform: scale(0); }
                    50% { opacity: 0.6; transform: scale(1.2); }
                    100% { opacity: 0; transform: scale(1); }
                }

                @keyframes shockwave-expand {
                    0% { transform: scale(0); opacity: 1; }
                    100% { transform: scale(8); opacity: 0; }
                }

                @keyframes chromatic-shift-r {
                    0% { box-shadow: inset -8px 0 40px rgba(255,0,0,0.4); }
                    100% { box-shadow: inset 0 0 0 rgba(255,0,0,0); }
                }

                @keyframes chromatic-shift-b {
                    0% { box-shadow: inset 8px 0 40px rgba(0,100,255,0.4); }
                    100% { box-shadow: inset 0 0 0 rgba(0,100,255,0); }
                }

                @keyframes ray-burst {
                    0% { opacity: 0; transform: rotate(var(--angle, 0deg)) scaleX(0); }
                    30% { opacity: 0.8; }
                    100% { opacity: 0; transform: rotate(var(--angle, 0deg)) scaleX(1); }
                }

                @keyframes victory-glow-pulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.3); opacity: 0.8; }
                }

                @keyframes premium-float {
                    0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 0.8; }
                    100% { transform: translateY(-100vh) translateX(var(--drift, 0px)) scale(0.3); opacity: 0; }
                }

                @keyframes glitch-top {
                    0% { transform: translate(-4px, -2px); }
                    20% { transform: translate(3px, 1px); }
                    40% { transform: translate(-2px, -1px); }
                    60% { transform: translate(1px, 0); }
                    80% { transform: translate(-1px, 1px); }
                    100% { transform: translate(0, 0); }
                }

                @keyframes glitch-bottom {
                    0% { transform: translate(4px, 2px); }
                    20% { transform: translate(-3px, -1px); }
                    40% { transform: translate(2px, 1px); }
                    60% { transform: translate(-1px, 0); }
                    80% { transform: translate(1px, -1px); }
                    100% { transform: translate(0, 0); }
                }

                @keyframes pulse-glow-intense {
                    0%, 100% { opacity: 0.4; transform: scale(1); filter: brightness(1); }
                    50% { opacity: 1; transform: scale(1.08); filter: brightness(1.2); }
                }

                @keyframes slide-in-left-3d {
                    0% { transform: translateX(-150%) rotateY(45deg) scale(0.8); opacity: 0; }
                    60% { transform: translateX(10%) rotateY(-10deg) scale(1.05); opacity: 1; }
                    80% { transform: translateX(-5%) rotateY(5deg) scale(0.98); }
                    100% { transform: translateX(0) rotateY(0deg) scale(1); opacity: 1; }
                }

                @keyframes slide-in-right-3d {
                    0% { transform: translateX(150%) rotateY(-45deg) scale(0.8); opacity: 0; }
                    60% { transform: translateX(-10%) rotateY(10deg) scale(1.05); opacity: 1; }
                    80% { transform: translateX(5%) rotateY(-5deg) scale(0.98); }
                    100% { transform: translateX(0) rotateY(0deg) scale(1); opacity: 1; }
                }

                @keyframes score-pop-3d {
                    0% { opacity: 0; transform: scale(0) translateY(30px) rotateX(90deg); }
                    50% { transform: scale(1.2) translateY(-10px) rotateX(-10deg); }
                    70% { transform: scale(0.95) translateY(3px) rotateX(5deg); }
                    100% { opacity: 1; transform: scale(1) translateY(0) rotateX(0deg); }
                }

                @keyframes winner-pulse-glow {
                    0%, 100% { transform: scale(1); box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color); }
                    50% { transform: scale(1.1); box-shadow: 0 0 40px var(--glow-color), 0 0 80px var(--glow-color), 0 0 120px var(--glow-color); }
                }

                @keyframes confetti-fall-3d {
                    0% { transform: translateY(0) rotate(0deg) rotateX(0deg) scale(1); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(1080deg) rotateX(720deg) scale(0.5); opacity: 0; }
                }

                @keyframes text-reveal-glitch {
                    0% { opacity: 0; transform: translateY(30px) skewX(10deg); filter: blur(10px); }
                    30% { opacity: 1; transform: translateY(-5px) skewX(-5deg); filter: blur(0); }
                    50% { transform: translateY(2px) skewX(2deg); }
                    70% { transform: translateY(-1px) skewX(-1deg); }
                    100% { opacity: 1; transform: translateY(0) skewX(0deg); filter: blur(0); }
                }

                @keyframes vs-pop-spin {
                    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
                    50% { transform: scale(1.4) rotate(20deg); }
                    70% { transform: scale(0.9) rotate(-10deg); }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }

                @keyframes screen-shake-intense {
                    0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
                    10% { transform: translateX(-10px) translateY(-3px) rotate(-1deg); }
                    20% { transform: translateX(10px) translateY(3px) rotate(1deg); }
                    30% { transform: translateX(-8px) translateY(-2px) rotate(-0.5deg); }
                    40% { transform: translateX(8px) translateY(2px) rotate(0.5deg); }
                    50% { transform: translateX(-5px) translateY(-1px) rotate(-0.3deg); }
                    60% { transform: translateX(5px) translateY(1px) rotate(0.3deg); }
                    70% { transform: translateX(-3px) translateY(0) rotate(0deg); }
                    80% { transform: translateX(3px) translateY(0) rotate(0deg); }
                    90% { transform: translateX(-1px) translateY(0) rotate(0deg); }
                }

                @keyframes flash-white-cinematic {
                    0% { opacity: 0; }
                    20% { opacity: 1; }
                    100% { opacity: 0; }
                }

                @keyframes spark-burst-enhanced {
                    0% {
                        transform: translate(0, 0) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(
                            calc(cos(var(--spark-angle)) * var(--spark-distance)),
                            calc(sin(var(--spark-angle)) * var(--spark-distance))
                        ) scale(0);
                        opacity: 0;
                    }
                }

                @keyframes neon-glow-ring-intense {
                    0%, 100% {
                        box-shadow: 0 0 20px var(--glow-color), 0 0 40px var(--glow-color), 0 0 60px var(--glow-color), inset 0 0 20px var(--glow-color);
                        border-color: var(--glow-color);
                    }
                    50% {
                        box-shadow: 0 0 40px var(--glow-color), 0 0 80px var(--glow-color), 0 0 120px var(--glow-color), inset 0 0 40px var(--glow-color);
                        border-color: #fff;
                    }
                }

                @keyframes card-winner-float {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-5px) scale(1.02); }
                }

                @keyframes mode-badge-glow {
                    0%, 100% { box-shadow: 0 0 10px rgba(139,92,246,0.3); }
                    50% { box-shadow: 0 0 25px rgba(139,92,246,0.6), 0 0 50px rgba(139,92,246,0.3); }
                }

                @keyframes button-shine {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }

                @keyframes fade-in-up {
                    0% { opacity: 0; transform: translateY(20px); }
                    100% { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            {/* Confetti */}
            {showConfetti && confettiPieces.map(piece => (
                <ConfettiPiece key={piece.id} {...piece} />
            ))}

            {/* ========== MAIN CONTENT ========== */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pt-safe" style={{ perspective: '1000px' }}>

                {/* Phase 0: Tension Build - Dramatic */}
                {phase === 0 && (
                    <div
                        className="text-center"
                        style={{ animation: 'pulse-glow-intense 1.2s ease-in-out infinite' }}
                    >
                        <div className="text-7xl mb-4" style={{ filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.5))' }}>⚔️</div>
                        <h1
                            className="text-4xl font-black text-white tracking-widest"
                            style={{ textShadow: '0 0 30px rgba(255,255,255,0.5), 0 0 60px rgba(139,92,246,0.5)' }}
                        >
                            BATTLE RESULTS
                        </h1>
                        <div
                            className="mt-4 text-white/50 text-sm tracking-wider"
                            style={{ animation: 'pulse-glow-intense 0.8s ease-in-out infinite 0.2s' }}
                        >
                            Calculating winner...
                        </div>
                    </div>
                )}

                {/* Phase 1+: Photo Cards */}
                {phase >= 1 && (
                    <div className="w-full max-w-md" style={{ transformStyle: 'preserve-3d' }}>
                        {/* Mode badge at top - Glassmorphism */}
                        <div className="text-center mb-5">
                            <span
                                className="inline-block px-5 py-2.5 rounded-full text-sm font-bold"
                                style={{
                                    background: 'rgba(139,92,246,0.15)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(139,92,246,0.3)',
                                    color: '#a78bfa',
                                    boxShadow: '0 8px 32px rgba(139,92,246,0.2)',
                                    animation: 'mode-badge-glow 2s ease-in-out infinite'
                                }}
                            >
                                {getModeEmoji(battleMode)} {battleMode.toUpperCase()} BATTLE
                            </span>
                        </div>

                        {/* Two Photo Cards Side by Side - 3D */}
                        <div className="flex items-center justify-center gap-3 mb-6" style={{ transformStyle: 'preserve-3d' }}>
                            {/* Left Card - Creator */}
                            <div
                                className="relative"
                                style={{
                                    animation: phase === 1 ? 'slide-in-left-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' :
                                        phase >= 3 && creatorWon ? 'card-winner-float 3s ease-in-out infinite' : 'none',
                                    opacity: phase === 1 ? 0 : 1,
                                    transform: phase >= 3 && responderWon ? 'scale(0.85) translateY(10px)' : 'scale(1)',
                                    transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <div
                                    className="w-40 h-52 rounded-2xl overflow-hidden relative"
                                    style={{
                                        border: phase >= 3 && creatorWon ? `3px solid ${winColor}` : '2px solid rgba(255,255,255,0.15)',
                                        boxShadow: phase >= 3 && creatorWon
                                            ? `0 0 40px ${winColor}, 0 0 80px ${winColor}50, 0 20px 60px rgba(0,0,0,0.5)`
                                            : '0 15px 50px rgba(0,0,0,0.5)',
                                        filter: phase >= 3 && responderWon ? 'grayscale(50%) brightness(0.6)' : 'none',
                                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        transform: 'translateZ(20px)'
                                    }}
                                >
                                    {/* Glassmorphism overlay */}
                                    <div
                                        className="absolute inset-0 z-[1] pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)'
                                        }}
                                    />
                                    {/* Neon glow ring for winner */}
                                    {phase >= 3 && creatorWon && (
                                        <div
                                            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                                            style={{
                                                '--glow-color': winColor,
                                                border: `2px solid ${winColor}`,
                                                animation: 'neon-glow-ring-intense 1.5s ease-in-out infinite'
                                            }}
                                        />
                                    )}
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
                                    {/* Label - Glassmorphism */}
                                    <div className="absolute top-2 left-2">
                                        <span
                                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                                            style={{
                                                background: 'rgba(0,0,0,0.5)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                color: 'rgba(255,255,255,0.9)',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {isCreator ? 'You' : 'Challenger'}
                                        </span>
                                    </div>
                                    {/* Winner badge - Enhanced */}
                                    {phase >= 3 && creatorWon && (
                                        <div
                                            className="absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                                            style={{
                                                '--glow-color': winColor,
                                                background: `linear-gradient(135deg, ${winColor}, #00d4ff)`,
                                                boxShadow: `0 0 30px ${winColor}, 0 0 60px ${winColor}80`,
                                                animation: 'winner-pulse-glow 1.2s ease-in-out infinite',
                                                border: '2px solid rgba(255,255,255,0.5)'
                                            }}
                                        >
                                            👑
                                        </div>
                                    )}
                                </div>
                                {/* Score below card */}
                                {phase >= 2 && (
                                    <div
                                        className="text-center mt-4"
                                        style={{ animation: 'score-pop-3d 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
                                    >
                                        {scoresRecalculated && originalCreatorScore != null ? (
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-lg text-white/50">{Math.round(originalCreatorScore)}</span>
                                                    <span className="text-sm text-white/30">→</span>
                                                </div>
                                                <AnimatedScore
                                                    targetScore={Math.round(creatorScore)}
                                                    color={creatorWon ? winColor : '#fff'}
                                                    isWinner={creatorWon}
                                                />
                                            </div>
                                        ) : (
                                            <AnimatedScore
                                                targetScore={Math.round(creatorScore)}
                                                color={creatorWon ? winColor : '#fff'}
                                                isWinner={creatorWon}
                                            />
                                        )}
                                        <div className="text-xs text-white/40 mt-1">/100</div>
                                    </div>
                                )}
                            </div>

                            {/* VS Badge in center - 3D */}
                            <div
                                className="flex items-center justify-center"
                                style={{
                                    opacity: phase >= 2 ? 1 : 0,
                                    animation: phase === 2 ? 'vs-pop-spin 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                                    transform: 'translateZ(40px)'
                                }}
                            >
                                <div
                                    className="w-14 h-14 rounded-full flex items-center justify-center font-black text-base"
                                    style={{
                                        background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                        boxShadow: '0 0 40px rgba(139,92,246,0.6), 0 10px 40px rgba(0,0,0,0.4)',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    VS
                                </div>
                            </div>

                            {/* Right Card - Responder */}
                            <div
                                className="relative"
                                style={{
                                    animation: phase === 1 ? 'slide-in-right-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' :
                                        phase >= 3 && responderWon ? 'card-winner-float 3s ease-in-out infinite' : 'none',
                                    opacity: phase === 1 ? 0 : 1,
                                    transform: phase >= 3 && creatorWon ? 'scale(0.85) translateY(10px)' : 'scale(1)',
                                    transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <div
                                    className="w-40 h-52 rounded-2xl overflow-hidden relative"
                                    style={{
                                        border: phase >= 3 && responderWon ? `3px solid ${winColor}` : '2px solid rgba(255,255,255,0.15)',
                                        boxShadow: phase >= 3 && responderWon
                                            ? `0 0 40px ${winColor}, 0 0 80px ${winColor}50, 0 20px 60px rgba(0,0,0,0.5)`
                                            : '0 15px 50px rgba(0,0,0,0.5)',
                                        filter: phase >= 3 && creatorWon ? 'grayscale(50%) brightness(0.6)' : 'none',
                                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        transform: 'translateZ(20px)'
                                    }}
                                >
                                    {/* Glassmorphism overlay */}
                                    <div
                                        className="absolute inset-0 z-[1] pointer-events-none"
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.3) 100%)'
                                        }}
                                    />
                                    {/* Neon glow ring for winner */}
                                    {phase >= 3 && responderWon && (
                                        <div
                                            className="absolute inset-0 rounded-2xl pointer-events-none z-10"
                                            style={{
                                                '--glow-color': winColor,
                                                border: `2px solid ${winColor}`,
                                                animation: 'neon-glow-ring-intense 1.5s ease-in-out infinite'
                                            }}
                                        />
                                    )}
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
                                    {/* Label - Glassmorphism */}
                                    <div className="absolute top-2 right-2">
                                        <span
                                            className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase"
                                            style={{
                                                background: 'rgba(0,0,0,0.5)',
                                                backdropFilter: 'blur(8px)',
                                                WebkitBackdropFilter: 'blur(8px)',
                                                color: 'rgba(255,255,255,0.9)',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {isCreator ? 'Opponent' : 'You'}
                                        </span>
                                    </div>
                                    {/* Winner badge - Enhanced */}
                                    {phase >= 3 && responderWon && (
                                        <div
                                            className="absolute -top-3 -left-3 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                                            style={{
                                                '--glow-color': winColor,
                                                background: `linear-gradient(135deg, ${winColor}, #00d4ff)`,
                                                boxShadow: `0 0 30px ${winColor}, 0 0 60px ${winColor}80`,
                                                animation: 'winner-pulse-glow 1.2s ease-in-out infinite',
                                                border: '2px solid rgba(255,255,255,0.5)'
                                            }}
                                        >
                                            👑
                                        </div>
                                    )}
                                </div>
                                {/* Score below card */}
                                {phase >= 2 && (
                                    <div
                                        className="text-center mt-4"
                                        style={{ animation: 'score-pop-3d 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards', opacity: 0 }}
                                    >
                                        {scoresRecalculated && originalResponderScore != null ? (
                                            <div className="flex flex-col items-center">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <span className="text-lg text-white/50">{Math.round(originalResponderScore)}</span>
                                                    <span className="text-sm text-white/30">→</span>
                                                </div>
                                                <AnimatedScore
                                                    targetScore={Math.round(responderScore)}
                                                    color={responderWon ? winColor : '#fff'}
                                                    delay={150}
                                                    isWinner={responderWon}
                                                />
                                            </div>
                                        ) : (
                                            <AnimatedScore
                                                targetScore={Math.round(responderScore)}
                                                color={responderWon ? winColor : '#fff'}
                                                delay={150}
                                                isWinner={responderWon}
                                            />
                                        )}
                                        <div className="text-xs text-white/40 mt-1">/100</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Score Recalculation Explanation */}
                        {phase >= 3 && scoresRecalculated && (
                            <p
                                className="text-xs text-white/40 text-center mb-4 px-4 italic"
                                style={{ animation: 'fade-in-up 0.5s ease-out 0.2s both' }}
                            >
                                When outfits are compared head-to-head, the AI re-evaluates them against each other
                            </p>
                        )}

                        {/* Result Text - Glitch Effect */}
                        {phase >= 3 && (
                            <div
                                className="text-center"
                                style={{ animation: 'text-reveal-glitch 0.6s ease-out forwards' }}
                            >
                                <h1 className="text-5xl font-black mb-3">
                                    <GlitchText color={accentColor}>
                                        {userWon ? '🏆 VICTORY!' : userLost ? '💀 DEFEATED' : '🤝 TIE!'}
                                    </GlitchText>
                                </h1>
                                <p
                                    className="text-lg font-medium"
                                    style={{
                                        color: 'rgba(255,255,255,0.7)',
                                        textShadow: `0 0 20px ${accentColor}40`
                                    }}
                                >
                                    {tied ? 'Exactly matched!' : userWon ? `Won by ${Math.round(diff)} points` : `Lost by ${Math.round(diff)} points`}
                                </p>

                                {/* AI Battle Commentary */}
                                {battleData?.battleCommentary && (
                                    <div
                                        className="mt-6 mx-4 p-4 rounded-2xl"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            animation: 'fade-in-up 0.5s ease-out 0.3s both'
                                        }}
                                    >
                                        {/* AI Judge Header */}
                                        <div className="flex items-center justify-center gap-2 mb-3">
                                            <span className="text-lg">🤖</span>
                                            <span className="text-xs font-bold text-white/50 uppercase tracking-wider">AI Judge Says</span>
                                        </div>

                                        {/* Battle Commentary */}
                                        <p className="text-white/90 text-sm font-medium text-center mb-4">
                                            "{battleData.battleCommentary}"
                                        </p>

                                        {/* Winning Factor */}
                                        {battleData?.winningFactor && !tied && (
                                            <div
                                                className="flex items-center justify-center gap-2 p-2 rounded-xl"
                                                style={{
                                                    background: `${accentColor}15`,
                                                    border: `1px solid ${accentColor}30`
                                                }}
                                            >
                                                <span className="text-sm">⚡</span>
                                                <span className="text-xs text-white/70">
                                                    <span className="font-bold" style={{ color: accentColor }}>Key Factor: </span>
                                                    {battleData.winningFactor}
                                                </span>
                                            </div>
                                        )}

                                        {/* Outfit Verdicts */}
                                        {(battleData?.outfit1Verdict || battleData?.outfit2Verdict) && (
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                {battleData?.outfit1Verdict && (
                                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                        <div className="text-[10px] text-white/40 mb-1">{isCreator ? 'You' : 'Them'}</div>
                                                        <div className="text-xs text-white/70">{battleData.outfit1Verdict}</div>
                                                    </div>
                                                )}
                                                {battleData?.outfit2Verdict && (
                                                    <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                                        <div className="text-[10px] text-white/40 mb-1">{isCreator ? 'Them' : 'You'}</div>
                                                        <div className="text-xs text-white/70">{battleData.outfit2Verdict}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ========== BOTTOM CTAs ========== */}
            {phase >= 4 && (
                <div
                    className="w-full px-6 pb-safe mb-6"
                    style={{ animation: 'text-reveal-glitch 0.5s ease-out forwards' }}
                >
                    <div className="max-w-sm mx-auto space-y-3">
                        {/* Primary CTA - Premium with shine effect */}
                        <button
                            onClick={() => {
                                playSound('click')
                                vibrate(30)
                                onViewScorecard?.()
                            }}
                            className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] relative overflow-hidden"
                            style={{
                                background: userWon
                                    ? `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`
                                    : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                color: userWon ? '#000' : '#fff',
                                boxShadow: `0 10px 40px ${userWon ? winColor : '#8b5cf6'}60, 0 0 60px ${userWon ? winColor : '#8b5cf6'}30`
                            }}
                        >
                            {/* Shine effect */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                    backgroundSize: '200% 100%',
                                    animation: 'button-shine 3s ease-in-out infinite'
                                }}
                            />
                            <span className="relative z-10">📊 See My Full Scorecard</span>
                        </button>

                        {/* Play Again Button - Arena quick re-entry */}
                        {onPlayAgain && (
                            <button
                                onClick={() => {
                                    playSound('whoosh')
                                    vibrate([50, 30, 50])
                                    onPlayAgain?.()
                                }}
                                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2) 0%, rgba(139,92,246,0.2) 100%)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    color: '#00d4ff',
                                    border: '1px solid rgba(0,212,255,0.4)',
                                    boxShadow: '0 0 20px rgba(0,212,255,0.2)'
                                }}
                            >
                                <span className="text-lg">⚔️</span>
                                <span>Play Again in Arena</span>
                            </button>
                        )}

                        {/* Secondary Row - Glassmorphism */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    playSound('click')
                                    vibrate(20)
                                    setShowShareCard(true)
                                }}
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
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
                                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.97]"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    backdropFilter: 'blur(10px)',
                                    WebkitBackdropFilter: 'blur(10px)',
                                    color: 'rgba(255,255,255,0.6)',
                                    border: '1px solid rgba(255,255,255,0.08)'
                                }}
                            >
                                🏠 Home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Skip button during animation - Glassmorphism */}
            {phase < 4 && phase > 0 && (
                <button
                    onClick={() => setPhase(4)}
                    className="absolute bottom-safe right-4 mb-4 px-4 py-2 rounded-full text-xs transition-all active:scale-95"
                    style={{
                        background: 'rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    Skip →
                </button>
            )}

            {/* Battle Share Card Modal */}
            {showShareCard && (
                <BattleShareCard
                    battleData={battleData}
                    isCreator={isCreator}
                    onClose={() => setShowShareCard(false)}
                />
            )}
        </div>
    )
}
