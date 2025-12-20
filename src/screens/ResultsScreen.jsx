import React, { useState, useEffect, useMemo } from 'react'
import Footer from '../components/common/Footer'
import { getScoreColor, getPercentile } from '../utils/scoreUtils'

// Sparkle Component for celebratory effects
const Sparkle = ({ delay, x, y, size, color }) => (
    <div
        className="absolute pointer-events-none"
        style={{
            left: `${x}%`,
            top: `${y}%`,
            width: size,
            height: size,
            animation: `sparkle 1.5s ease-in-out ${delay}s infinite`,
        }}
    >
        <svg viewBox="0 0 24 24" fill={color}>
            <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
    </div>
)

// Enhanced Confetti Component
const Confetti = ({ count, colors }) => {
    const pieces = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 2.5 + Math.random() * 2,
            size: 6 + Math.random() * 8,
            color: colors[i % colors.length],
            rotation: Math.random() * 360,
            shape: ['square', 'circle', 'triangle'][i % 3]
        })), [count, colors]
    )

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'triangle' ? '0' : '2px',
                        clipPath: p.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        transform: `rotate(${p.rotation}deg)`,
                    }}
                />
            ))}
        </div>
    )
}

// Bento Stat Card Component
const BentoStatCard = ({ label, value, delay, accentColor, icon }) => (
    <div
        className="liquid-glass bento-item card-reveal flex flex-col items-center justify-center gap-1"
        style={{
            animationDelay: `${delay}s`,
            borderColor: `${accentColor}22`
        }}
    >
        <span className="text-[10px] text-white/40 uppercase font-black tracking-wider flex items-center gap-1">
            {icon && <span className="text-xs">{icon}</span>}
            {label}
        </span>
        <span
            className="text-2xl font-black"
            style={{ color: getScoreColor(value) }}
        >
            {value}
        </span>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1">
            <div
                className="h-full rounded-full stat-bar-fill"
                style={{
                    backgroundColor: getScoreColor(value),
                    '--fill-width': `${value}%`,
                    '--delay': `${delay + 0.3}s`
                }}
            />
        </div>
    </div>
)

export default function ResultsScreen({
    scores,
    mode,
    uploadedImage,
    isPro,
    scansRemaining,
    onReset,
    onSetMode,
    onGenerateShareCard,
    onShowPaywall,
    onBack,
    playSound,
    vibrate
}) {
    const [revealStage, setRevealStage] = useState(0)
    const [displayedScore, setDisplayedScore] = useState(0)
    const [showSparkles, setShowSparkles] = useState(false)

    // Animation sequence
    useEffect(() => {
        if (!scores) return

        setRevealStage(0)
        setDisplayedScore(0)
        setShowSparkles(false)

        const sound = scores.isLegendary ? 'legendary' : (scores.roastMode ? 'roast' : 'success')

        const timers = [
            setTimeout(() => {
                playSound(sound)
                vibrate(scores.isLegendary ? [100, 50, 100, 50, 200] : (scores.roastMode ? [50, 50, 200] : [50, 50, 50]))
                setRevealStage(1)
            }, 100),
            setTimeout(() => {
                setRevealStage(2)
                playSound('pop')
                vibrate(10)
            }, 500),
            setTimeout(() => {
                setRevealStage(3)
                playSound('pop')
            }, 900),
            setTimeout(() => setRevealStage(4), 1200),
            setTimeout(() => setRevealStage(5), 1500),
            setTimeout(() => {
                setRevealStage(6)
                if (scores.overall >= 85) setShowSparkles(true)
            }, 1800),
        ]

        // Score counting animation
        const duration = 1400
        const startTime = Date.now() + 500
        const endScore = scores.overall
        let animationFrameId

        const animateScore = () => {
            const elapsed = Date.now() - startTime
            if (elapsed < 0) {
                animationFrameId = requestAnimationFrame(animateScore)
                return
            }

            const progress = Math.min(elapsed / duration, 1)
            // EaseOutExpo with overshoot for satisfaction
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            setDisplayedScore(Math.floor(easeProgress * endScore))

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateScore)
            }
        }

        const scoreTimer = setTimeout(() => {
            requestAnimationFrame(animateScore)
        }, 500)

        if (navigator.vibrate) {
            setTimeout(() => navigator.vibrate(50), 500)
        }

        return () => {
            timers.forEach(t => clearTimeout(t))
            clearTimeout(scoreTimer)
            cancelAnimationFrame(animationFrameId)
        }
    }, [scores, playSound, vibrate])

    // Mode-specific theming
    const theme = useMemo(() => {
        const themes = {
            savage: {
                accent: '#8b00ff',
                gradientEnd: '#ff0044',
                glow: 'rgba(139,0,255,0.4)',
                glowStrong: 'rgba(139,0,255,0.6)'
            },
            roast: {
                accent: '#ff4444',
                gradientEnd: '#ff8800',
                glow: 'rgba(255,68,68,0.4)',
                glowStrong: 'rgba(255,68,68,0.6)'
            },
            honest: {
                accent: '#0077ff',
                gradientEnd: '#00d4ff',
                glow: 'rgba(0,119,255,0.4)',
                glowStrong: 'rgba(0,119,255,0.6)'
            },
            nice: {
                accent: '#00d4ff',
                gradientEnd: '#00ff88',
                glow: 'rgba(0,212,255,0.4)',
                glowStrong: 'rgba(0,212,255,0.6)'
            }
        }
        return themes[scores?.mode] || themes.nice
    }, [scores?.mode])

    // Score tier for special effects
    const scoreTier = useMemo(() => {
        if (!scores) return 'mid'
        if (scores.overall >= 95) return 'legendary'
        if (scores.overall >= 85) return 'fire'
        if (scores.overall >= 75) return 'great'
        if (scores.overall >= 60) return 'good'
        if (scores.overall >= 40) return 'mid'
        return 'low'
    }, [scores?.overall])

    const isLegendary = scoreTier === 'legendary' || scores?.isLegendary

    // Social proof message
    const socialProof = useMemo(() => {
        if (!scores) return { message: '', color: '#fff' }

        if (scores.roastMode) {
            if (scores.mode === 'savage') {
                if (scores.overall >= 40) return { message: '💀 YOU SURVIVED (Barely)', color: '#ffaa00' }
                if (scores.overall >= 20) return { message: '🩸 AI drew blood', color: '#ff6b6b' }
                return { message: '☠️ ABSOLUTE ANNIHILATION', color: '#ff4444' }
            }
            if (scores.overall >= 60) return { message: '😏 You survived', color: '#00d4ff' }
            if (scores.overall >= 45) return { message: '💀 Rough day for your closet', color: '#ffaa00' }
            return { message: '☠️ AI showed no mercy', color: '#ff6b6b' }
        } else if (scores.mode === 'honest') {
            if (scores.overall >= 95) return { message: '💎 STYLE GOD — Pure Perfection', color: '#ffd700' }
            if (scores.overall >= 85) return { message: '🔥 Post this immediately', color: '#ff6b35' }
            if (scores.overall >= 70) return { message: '👍 Solid fit, respectable', color: '#00d4ff' }
            if (scores.overall >= 55) return { message: '📊 Average range', color: '#ffaa00' }
            return { message: '📉 Needs work', color: '#ff6b6b' }
        } else {
            if (scores.overall >= 95) return { message: '👑 ICONIC — Internet-breaking fit', color: '#ffd700' }
            if (scores.overall >= 85) return { message: '🔥 LEGENDARY — Post this NOW', color: '#ff6b35' }
            if (scores.overall >= 75) return { message: '✨ Main character energy', color: '#00d4ff' }
            if (scores.overall >= 65) return { message: '💅 Serve! TikTok would approve', color: '#00ff88' }
            if (scores.overall >= 50) return { message: '👀 Cute! Minor tweaks = viral', color: '#ffaa00' }
            return { message: '💪 Good foundation, keep styling!', color: '#ff6b6b' }
        }
    }, [scores])

    if (!scores) return null

    return (
        <div
            className="min-h-screen flex flex-col items-center px-4 overflow-x-hidden relative"
            style={{
                background: '#0a0a0f',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
                paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))'
            }}
        >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[80%] opacity-30"
                    style={{
                        background: `radial-gradient(ellipse at center top, ${theme.accent}40 0%, ${theme.gradientEnd}20 30%, transparent 70%)`,
                        filter: 'blur(60px)',
                    }}
                />
                <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[50%] opacity-20"
                    style={{
                        background: `radial-gradient(ellipse at center bottom, ${theme.gradientEnd}30 0%, transparent 60%)`,
                        filter: 'blur(80px)',
                    }}
                />
            </div>

            {/* Sparkles for high scores */}
            {showSparkles && scoreTier !== 'low' && scoreTier !== 'mid' && (
                <>
                    <Sparkle delay={0} x={10} y={15} size={16} color={theme.accent} />
                    <Sparkle delay={0.3} x={85} y={20} size={12} color={theme.gradientEnd} />
                    <Sparkle delay={0.6} x={20} y={35} size={10} color="#ffd700" />
                    <Sparkle delay={0.9} x={75} y={40} size={14} color={theme.accent} />
                    <Sparkle delay={1.2} x={5} y={55} size={8} color={theme.gradientEnd} />
                    <Sparkle delay={1.5} x={90} y={60} size={10} color="#ffd700" />
                </>
            )}

            {/* ===== SCORE RING ===== */}
            <div className={`relative mb-4 transition-all duration-700 ${revealStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                {/* Outer glow ring */}
                <div
                    className={`absolute inset-[-20px] rounded-full opacity-50 ${isLegendary ? 'legendary-glow' : ''}`}
                    style={{
                        background: `radial-gradient(circle, ${theme.accent}40 0%, transparent 70%)`,
                        filter: 'blur(20px)',
                        animation: revealStage >= 2 ? 'scoreGlowPulse 3s ease-in-out infinite' : 'none',
                        '--glow-color': theme.accent
                    }}
                />

                <div className={`relative w-36 h-36 ${isLegendary ? 'floating' : ''}`}>
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background track */}
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="6"
                        />

                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={theme.accent} />
                                <stop offset="100%" stopColor={theme.gradientEnd} />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Progress ring */}
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke="url(#scoreGradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (displayedScore * 2.83)}
                            filter="url(#glow)"
                            style={{
                                transition: 'stroke-dashoffset 0.1s ease-out',
                            }}
                        />

                        {/* Animated dot at end of progress */}
                        {revealStage >= 2 && (
                            <circle
                                cx="50"
                                cy="5"
                                r="4"
                                fill={theme.gradientEnd}
                                style={{
                                    transformOrigin: '50px 50px',
                                    transform: `rotate(${displayedScore * 3.6}deg)`,
                                    filter: `drop-shadow(0 0 8px ${theme.gradientEnd})`,
                                    transition: 'transform 0.1s ease-out'
                                }}
                            />
                        )}
                    </svg>

                    {/* Score number */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                            className={`text-5xl font-black ${isLegendary ? 'legendary-text' : ''}`}
                            style={{
                                color: isLegendary ? undefined : theme.accent,
                                animation: revealStage >= 2 ? 'scoreNumberPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
                                textShadow: isLegendary ? undefined : `0 0 30px ${theme.glow}`
                            }}
                        >
                            {displayedScore}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/30 -mt-1">
                            / 100
                        </span>
                    </div>
                </div>

                {/* Certified Badge */}
                {scores.overall >= 90 && revealStage >= 3 && (
                    <div className="absolute -top-1 -right-8 badge-pop">
                        <div
                            className="px-3 py-1.5 rounded-lg font-black text-[10px] tracking-wide shadow-lg"
                            style={{
                                background: isLegendary
                                    ? 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)'
                                    : `linear-gradient(135deg, ${theme.accent} 0%, ${theme.gradientEnd} 100%)`,
                                color: isLegendary || scores.mode === 'nice' ? '#000' : '#fff',
                                boxShadow: `0 4px 20px ${theme.glow}`
                            }}
                        >
                            {isLegendary ? '👑 ICONIC' : '✓ DRIP APPROVED'}
                        </div>
                    </div>
                )}
            </div>

            {/* ===== VERDICT & TAGLINE ===== */}
            <div className={`flex flex-col items-center gap-3 mb-5 max-w-sm transition-all duration-700 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <h1
                    className={`text-2xl md:text-3xl font-black text-center px-2 leading-tight ${isLegendary ? 'legendary-text' : ''}`}
                    style={{
                        color: isLegendary ? undefined : '#fff',
                        textShadow: `0 0 40px ${theme.glow}`
                    }}
                >
                    {scores.verdict}
                </h1>

                {scores.lines && scores.lines.length >= 2 && (
                    <div className="flex flex-col items-center gap-1.5">
                        <p className="text-sm font-medium text-white/70 italic text-center max-w-[280px]">
                            "{scores.lines[0]}"
                        </p>
                        <p className="text-sm font-medium text-white/70 italic text-center max-w-[280px]">
                            "{scores.lines[1]}"
                        </p>
                    </div>
                )}

                {/* Tagline pill */}
                <div
                    className="liquid-glass px-5 py-2 mt-2"
                    style={{ borderColor: `${theme.accent}33` }}
                >
                    <p
                        className="text-[11px] font-black uppercase tracking-[0.25em]"
                        style={{ color: theme.accent }}
                    >
                        {scores.tagline}
                    </p>
                </div>
            </div>

            {/* ===== SOCIAL PROOF ===== */}
            <div className={`mb-5 text-center transition-all duration-500 ${revealStage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <p
                    className="text-base font-bold mb-1"
                    style={{ color: socialProof.color }}
                >
                    {socialProof.message}
                </p>
                <p className="text-xs font-medium text-white/40">
                    Better than {scores.percentile}% of fits today
                </p>
            </div>

            {/* ===== PHOTO PREVIEW ===== */}
            <div className={`w-full max-w-xs mb-6 transition-all duration-700 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="relative">
                    {/* Glow border for high scores */}
                    {scores.overall >= 85 && (
                        <div
                            className="absolute -inset-1 rounded-[28px] opacity-40 blur-md"
                            style={{
                                background: `linear-gradient(135deg, ${theme.accent}, ${theme.gradientEnd})`,
                                animation: 'pulse-glow 3s ease-in-out infinite'
                            }}
                        />
                    )}

                    <div
                        className={`relative w-full aspect-[3/4] rounded-3xl overflow-hidden ${isLegendary ? 'card-golden' : ''}`}
                        style={{
                            border: isLegendary ? 'none' : `2px solid ${theme.accent}33`,
                            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${theme.glow}`
                        }}
                    >
                        <img
                            src={uploadedImage}
                            alt="Your outfit"
                            className="w-full h-full object-cover"
                        />

                        {/* Branding watermark */}
                        <div className="absolute top-3 left-3 opacity-50">
                            <span className="text-[9px] font-black text-white tracking-widest uppercase drop-shadow-lg">
                                FitRate.app
                            </span>
                        </div>

                        {/* Pro Tip Overlay */}
                        {isPro && scores.proTip && revealStage >= 4 && (
                            <div
                                className="absolute bottom-3 left-3 right-3 p-3 rounded-2xl liquid-glass-strong animate-in fade-in slide-in-from-bottom-2"
                                style={{ borderColor: `${theme.accent}33` }}
                            >
                                <span
                                    className="text-[9px] font-black uppercase tracking-widest block mb-1"
                                    style={{ color: theme.accent }}
                                >
                                    💡 Pro Tip
                                </span>
                                <p className="text-xs text-white/90 font-medium leading-relaxed">
                                    "{scores.proTip}"
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ===== BENTO GRID STATS ===== */}
            <div className={`w-full max-w-xs mb-6 transition-all duration-700 ${revealStage >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bento-grid bento-grid-3col">
                    <BentoStatCard
                        label="Color"
                        value={scores.color}
                        delay={0.1}
                        accentColor={theme.accent}
                        icon="🎨"
                    />
                    <BentoStatCard
                        label="Fit"
                        value={scores.fit}
                        delay={0.2}
                        accentColor={theme.accent}
                        icon="📐"
                    />
                    <BentoStatCard
                        label="Style"
                        value={scores.style}
                        delay={0.3}
                        accentColor={theme.accent}
                        icon="✨"
                    />
                </div>
            </div>

            {/* ===== PRO INSIGHTS (GOLDEN INSIGHT) ===== */}
            {isPro && (scores.identityReflection || scores.socialPerception) && (
                <div className={`w-full max-w-xs mb-6 card-reveal transition-all duration-700 ${revealStage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                    <div
                        className="liquid-glass-strong p-5 noise-overlay"
                        style={{
                            borderColor: `${theme.accent}40`,
                            boxShadow: `0 0 50px ${theme.glow}`
                        }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-lg">✨</span>
                            <span
                                className="text-[11px] font-black tracking-widest uppercase"
                                style={{ color: theme.accent }}
                            >
                                Golden Insight
                            </span>
                        </div>

                        <div className="space-y-4">
                            {scores.identityReflection && (
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                                        Identity Reflection
                                    </span>
                                    <p className="text-sm text-white font-medium leading-relaxed">
                                        {scores.identityReflection}
                                    </p>
                                </div>
                            )}
                            {scores.socialPerception && (
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1.5">
                                        Social Perception
                                    </span>
                                    <p className="text-sm text-white font-medium leading-relaxed">
                                        {scores.socialPerception}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SAVAGE MODE ROASTS ===== */}
            {scores.savageLevel && (
                <div className={`w-full max-w-xs mb-6 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="liquid-glass p-4" style={{ borderColor: 'rgba(255,68,68,0.3)' }}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1">
                                <span>🔥</span> Savage Level
                            </span>
                            <span className="text-xl font-black text-red-500">{scores.savageLevel}/10</span>
                        </div>

                        {/* Savage meter */}
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full stat-bar-fill"
                                style={{
                                    '--fill-width': `${scores.savageLevel * 10}%`,
                                    '--delay': '0.3s'
                                }}
                            />
                        </div>

                        {scores.itemRoasts && (
                            <div className="space-y-3">
                                {Object.entries(scores.itemRoasts)
                                    .filter(([_, r]) => r && r !== 'N/A')
                                    .map(([key, value]) => (
                                        <div key={key} className="text-left">
                                            <span className="text-[9px] font-black text-red-500/70 uppercase tracking-wider block mb-0.5">
                                                {key}
                                            </span>
                                            <p className="text-xs text-white/80 leading-snug">{value}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== CTAs ===== */}
            <div className={`w-full max-w-xs transition-all duration-700 ${revealStage >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                {/* Primary CTA - Share */}
                <button
                    onClick={onGenerateShareCard}
                    aria-label="Share your outfit rating"
                    className="btn-physical btn-shine w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 mb-4 relative overflow-hidden group"
                    style={{
                        background: `linear-gradient(135deg, ${theme.gradientEnd} 0%, ${theme.accent} 100%)`,
                        boxShadow: `0 8px 0 rgba(0,0,0,0.2), 0 15px 40px ${theme.glow}`,
                        color: (scores.mode === 'roast' || scores.mode === 'savage') ? 'white' : 'black'
                    }}
                >
                    <span className="text-2xl">📤</span>
                    <span>SHARE THIS FIT</span>
                </button>

                {/* Secondary CTA - Try Again */}
                <button
                    onClick={onReset}
                    aria-label="Rate another outfit"
                    className="btn-physical w-full py-3.5 rounded-xl liquid-glass text-white/60 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover-bounce"
                >
                    <span>🔄</span>
                    <span>
                        {scores.overall >= 85 ? "Can you beat this? Scan again" :
                            scores.overall < 50 ? "Redeem yourself? Try again" :
                                "Rate Another Fit"}
                    </span>
                </button>

                {/* Daily Limit Tracker */}
                {!isPro && (
                    <p className="text-center text-[10px] uppercase font-bold tracking-widest mt-4 text-white/30">
                        {scansRemaining > 0
                            ? `⚡ ${scansRemaining} free scan${scansRemaining !== 1 ? 's' : ''} left today`
                            : '⏰ Daily limit reached • Reset in 12h'
                        }
                    </p>
                )}

                {/* Mode Switch Teaser */}
                {!isPro && scores.mode === 'nice' && (
                    <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-[10px] text-white/40 mb-2 font-medium">
                            Too nice? Try the viral Roast Mode
                        </p>
                        <button
                            onClick={() => { onSetMode('roast'); onReset(); }}
                            aria-label="Try Roast Mode"
                            className="text-xs text-red-400 font-black uppercase tracking-wider border-b border-red-400/30 pb-0.5 hover:text-red-300 transition-colors"
                        >
                            See what AI really thinks 😈
                        </button>
                    </div>
                )}
            </div>

            {/* ===== CONFETTI FOR HIGH SCORES ===== */}
            {scores.overall >= 90 && revealStage >= 6 && (
                <Confetti
                    count={30}
                    colors={[
                        '#ffd700',
                        theme.accent,
                        theme.gradientEnd,
                        '#fff',
                        isLegendary ? '#ffaa00' : theme.accent
                    ]}
                />
            )}

            <Footer className="opacity-40 pt-8 pb-4" />
        </div>
    )
}
