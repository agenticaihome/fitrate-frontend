import React, { useState, useEffect, useMemo } from 'react'
import Footer from '../components/common/Footer'
import { getScoreColor, getPercentile } from '../utils/scoreUtils'

// Tier Badge Component - Big and Bold
const TierBadge = ({ tier, score }) => {
    const tierConfig = {
        legendary: { label: '👑 LEGENDARY', bg: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)', text: '#000', glow: '#ffd700' },
        fire: { label: '🔥 FIRE', bg: 'linear-gradient(135deg, #ff6b35 0%, #ff0080 100%)', text: '#fff', glow: '#ff6b35' },
        great: { label: '✨ GREAT', bg: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)', text: '#fff', glow: '#00d4ff' },
        good: { label: '👍 GOOD', bg: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)', text: '#000', glow: '#00ff88' },
        mid: { label: '😐 MID', bg: 'linear-gradient(135deg, #ffaa00 0%, #ff6b00 100%)', text: '#000', glow: '#ffaa00' },
        low: { label: '💀 ROUGH', bg: 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)', text: '#fff', glow: '#ff4444' }
    }
    const config = tierConfig[tier] || tierConfig.mid

    return (
        <div
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-black text-base tracking-wide shadow-2xl"
            style={{
                background: config.bg,
                color: config.text,
                boxShadow: `0 8px 32px ${config.glow}66, 0 4px 16px rgba(0,0,0,0.3)`
            }}
        >
            {config.label}
        </div>
    )
}

// Enhanced Confetti
const Confetti = ({ count, colors }) => {
    const pieces = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 2.5 + Math.random() * 2,
            size: 8 + Math.random() * 10,
            color: colors[i % colors.length],
            rotation: Math.random() * 360,
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
                        borderRadius: p.id % 2 === 0 ? '50%' : '2px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    )
}

// Rating Bar Component - Animated fill bars
const RatingBar = ({ value, color, delay }) => {
    const percentage = Math.min(100, Math.max(0, value))
    return (
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden mt-2">
            <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                    boxShadow: `0 0 8px ${color}66`,
                    animation: `barFill 1s ease-out ${delay}s forwards`,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left'
                }}
            />
        </div>
    )
}

// Stat Pill Component with Rating Bar
const StatPill = ({ label, value, icon, delay, color }) => (
    <div
        className="flex flex-col items-center p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-sm"
        style={{
            animation: `cardSlideUp 0.5s ease-out ${delay}s forwards`,
            opacity: 0
        }}
    >
        <div className="text-lg mb-1">{icon}</div>
        <div className="text-2xl font-black" style={{ color: color || getScoreColor(value) }}>{value}</div>
        <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold mt-1">{label}</div>
        <RatingBar value={value} color={color || getScoreColor(value)} delay={delay + 0.3} />
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

    // Animation sequence
    useEffect(() => {
        if (!scores) return

        setRevealStage(0)
        setDisplayedScore(0)

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
            }, 400),
            setTimeout(() => {
                setRevealStage(3)
                playSound('pop')
            }, 800),
            setTimeout(() => setRevealStage(4), 1100),
            setTimeout(() => setRevealStage(5), 1400),
            setTimeout(() => setRevealStage(6), 1700),
        ]

        // Score counting animation
        const duration = 1200
        const startTime = Date.now() + 400
        const endScore = scores.overall
        let animationFrameId

        const animateScore = () => {
            const elapsed = Date.now() - startTime
            if (elapsed < 0) {
                animationFrameId = requestAnimationFrame(animateScore)
                return
            }
            const progress = Math.min(elapsed / duration, 1)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            setDisplayedScore(Math.floor(easeProgress * endScore))
            if (progress < 1) animationFrameId = requestAnimationFrame(animateScore)
        }

        const scoreTimer = setTimeout(() => requestAnimationFrame(animateScore), 400)

        return () => {
            timers.forEach(t => clearTimeout(t))
            clearTimeout(scoreTimer)
            cancelAnimationFrame(animationFrameId)
        }
    }, [scores, playSound, vibrate])

    // Score tier
    const scoreTier = useMemo(() => {
        if (!scores) return 'mid'
        if (scores.overall >= 95 || scores.isLegendary) return 'legendary'
        if (scores.overall >= 85) return 'fire'
        if (scores.overall >= 75) return 'great'
        if (scores.overall >= 60) return 'good'
        if (scores.overall >= 40) return 'mid'
        return 'low'
    }, [scores?.overall, scores?.isLegendary])

    // Theme colors based on mode
    const theme = useMemo(() => {
        const themes = {
            savage: { accent: '#8b00ff', end: '#ff0044', glow: 'rgba(139,0,255,0.5)' },
            roast: { accent: '#ff4444', end: '#ff8800', glow: 'rgba(255,68,68,0.5)' },
            honest: { accent: '#0077ff', end: '#00d4ff', glow: 'rgba(0,119,255,0.5)' },
            nice: { accent: '#00d4ff', end: '#00ff88', glow: 'rgba(0,212,255,0.5)' }
        }
        return themes[scores?.mode] || themes.nice
    }, [scores?.mode])

    // Background gradient based on tier
    const bgGradient = useMemo(() => {
        const gradients = {
            legendary: 'radial-gradient(ellipse at top, rgba(255,215,0,0.15) 0%, rgba(255,140,0,0.08) 40%, #0a0a0f 70%)',
            fire: 'radial-gradient(ellipse at top, rgba(255,107,53,0.12) 0%, rgba(255,0,128,0.06) 40%, #0a0a0f 70%)',
            great: 'radial-gradient(ellipse at top, rgba(0,212,255,0.12) 0%, rgba(0,102,255,0.06) 40%, #0a0a0f 70%)',
            good: 'radial-gradient(ellipse at top, rgba(0,255,136,0.1) 0%, rgba(0,212,255,0.05) 40%, #0a0a0f 70%)',
            mid: 'radial-gradient(ellipse at top, rgba(255,170,0,0.1) 0%, rgba(255,107,0,0.05) 40%, #0a0a0f 70%)',
            low: 'radial-gradient(ellipse at top, rgba(255,68,68,0.12) 0%, rgba(204,0,0,0.06) 40%, #0a0a0f 70%)'
        }
        return gradients[scoreTier]
    }, [scoreTier])

    // Social proof message
    const socialProof = useMemo(() => {
        if (!scores) return { msg: '', color: '#fff' }
        if (scores.roastMode) {
            if (scores.mode === 'savage') {
                if (scores.overall >= 40) return { msg: '💀 YOU SURVIVED (Barely)', color: '#ffaa00' }
                if (scores.overall >= 20) return { msg: '🩸 AI drew blood', color: '#ff6b6b' }
                return { msg: '☠️ ABSOLUTE ANNIHILATION', color: '#ff4444' }
            }
            if (scores.overall >= 60) return { msg: '😏 You survived the roast', color: '#00d4ff' }
            if (scores.overall >= 45) return { msg: '💀 Rough day for your closet', color: '#ffaa00' }
            return { msg: '☠️ AI showed no mercy', color: '#ff6b6b' }
        } else if (scores.mode === 'honest') {
            if (scores.overall >= 95) return { msg: '💎 STYLE GOD — Pure Perfection', color: '#ffd700' }
            if (scores.overall >= 85) return { msg: '🔥 Post this immediately', color: '#ff6b35' }
            if (scores.overall >= 70) return { msg: '👍 Solid fit, respectable', color: '#00d4ff' }
            if (scores.overall >= 55) return { msg: '📊 Average range', color: '#ffaa00' }
            return { msg: '📉 Needs some work', color: '#ff6b6b' }
        } else {
            if (scores.overall >= 95) return { msg: '👑 ICONIC — Internet-breaking fit', color: '#ffd700' }
            if (scores.overall >= 85) return { msg: '🔥 LEGENDARY — Post this NOW', color: '#ff6b35' }
            if (scores.overall >= 75) return { msg: '✨ Main character energy', color: '#00d4ff' }
            if (scores.overall >= 65) return { msg: '💅 Serve! TikTok would approve', color: '#00ff88' }
            if (scores.overall >= 50) return { msg: '👀 Cute! Minor tweaks = viral', color: '#ffaa00' }
            return { msg: '💪 Good foundation, keep styling!', color: '#ff6b6b' }
        }
    }, [scores])

    if (!scores) return null

    const isLegendary = scoreTier === 'legendary'
    const isLow = scoreTier === 'low'

    return (
        <div
            className="min-h-screen flex flex-col items-center overflow-x-hidden relative"
            style={{
                background: bgGradient,
                fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
        >
            {/* ===== HERO SECTION: GIANT SCORE ===== */}
            <div className={`w-full px-4 pt-4 pb-6 flex flex-col items-center transition-all duration-700 ${revealStage >= 1 ? 'opacity-100' : 'opacity-0'}`}>

                {/* Small Logo */}
                <img
                    src="/logo.svg"
                    alt="FitRate"
                    className="h-8 mb-4 opacity-60"
                />

                {/* MASSIVE Score Ring */}
                <div className={`relative mb-4 ${isLegendary ? 'floating' : ''}`}>
                    {/* Outer glow */}
                    <div
                        className="absolute inset-[-30px] rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${theme.accent}50 0%, transparent 70%)`,
                            filter: 'blur(30px)',
                            animation: revealStage >= 2 ? 'scoreGlowPulse 2.5s ease-in-out infinite' : 'none'
                        }}
                    />

                    <div className="relative w-48 h-48 md:w-56 md:h-56">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background track */}
                            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />

                            {/* Gradient def */}
                            <defs>
                                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor={theme.accent} />
                                    <stop offset="100%" stopColor={theme.end} />
                                </linearGradient>
                                <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="4" result="blur" />
                                    <feMerge>
                                        <feMergeNode in="blur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Progress ring */}
                            <circle
                                cx="50" cy="50" r="42"
                                fill="none"
                                stroke="url(#ringGrad)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray="264"
                                strokeDashoffset={264 - (displayedScore * 2.64)}
                                filter="url(#ringGlow)"
                            />
                        </svg>

                        {/* Score Number - HUGE */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span
                                className={`text-7xl md:text-8xl font-black leading-none ${isLegendary ? 'legendary-text' : ''}`}
                                style={{
                                    color: isLegendary ? undefined : theme.accent,
                                    textShadow: isLegendary ? undefined : `0 0 40px ${theme.glow}, 0 0 80px ${theme.glow}`,
                                    animation: revealStage >= 2 ? 'scoreNumberPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
                                }}
                            >
                                {displayedScore}
                            </span>
                            <span className="text-sm font-bold text-white/30 tracking-widest">/ 100</span>
                        </div>
                    </div>
                </div>

                {/* Tier Badge */}
                <div className={`transition-all duration-500 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    <TierBadge tier={scoreTier} score={scores.overall} />
                </div>
            </div>

            {/* ===== VERDICT CARD ===== */}
            <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div
                    className="p-5 rounded-3xl border backdrop-blur-xl text-center"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderColor: `${theme.accent}22`,
                        boxShadow: `0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)`
                    }}
                >
                    <h1 className={`text-2xl md:text-3xl font-black mb-3 leading-tight ${isLegendary ? 'legendary-text' : 'text-white'}`}>
                        {scores.verdict}
                    </h1>

                    {scores.lines && scores.lines.length >= 2 && (
                        <div className="space-y-1 mb-4">
                            <p className="text-sm text-white/60 italic">"{scores.lines[0]}"</p>
                            <p className="text-sm text-white/60 italic">"{scores.lines[1]}"</p>
                        </div>
                    )}

                    {/* Tagline */}
                    <div
                        className="inline-block px-4 py-1.5 rounded-full border"
                        style={{
                            borderColor: `${theme.accent}33`,
                            background: `${theme.accent}11`
                        }}
                    >
                        <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
                            {scores.tagline}
                        </span>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-base font-bold" style={{ color: socialProof.color }}>{socialProof.msg}</p>
                        <p className="text-xs text-white/40 mt-1">Better than {scores.percentile}% of fits today</p>
                    </div>
                </div>
            </div>

            {/* ===== PHOTO + STATS ROW ===== */}
            <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="grid grid-cols-5 gap-3">
                    {/* Photo - Takes 3 columns */}
                    <div className="col-span-3 relative">
                        {isLegendary && (
                            <div
                                className="absolute -inset-1 rounded-2xl opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                                    filter: 'blur(8px)',
                                    animation: 'pulse-glow 2s ease-in-out infinite'
                                }}
                            />
                        )}
                        <div
                            className={`relative aspect-[3/4] rounded-2xl overflow-hidden ${isLegendary ? 'card-golden' : ''}`}
                            style={{
                                border: `2px solid ${theme.accent}33`,
                                boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${theme.glow}`
                            }}
                        >
                            <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 opacity-40">
                                <span className="text-[8px] font-black text-white tracking-widest uppercase drop-shadow">FITRATE.APP</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats - Takes 2 columns */}
                    <div className="col-span-2 flex flex-col gap-2">
                        <StatPill label="Color" value={scores.color} icon="🎨" delay={0.1} color="#ff6b9d" />
                        <StatPill label="Fit" value={scores.fit} icon="📐" delay={0.2} color="#00d4ff" />
                        <StatPill label="Style" value={scores.style} icon="✨" delay={0.3} color="#ffd700" />
                    </div>
                </div>
            </div>

            {/* ===== PRO TIP CARD ===== */}
            {isPro && scores.proTip && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div
                        className="p-4 rounded-2xl border backdrop-blur-xl"
                        style={{
                            background: `linear-gradient(135deg, ${theme.accent}15 0%, ${theme.end}10 100%)`,
                            borderColor: `${theme.accent}33`
                        }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">💡</span>
                            <span className="text-xs font-black uppercase tracking-widest" style={{ color: theme.accent }}>Pro Tip</span>
                        </div>
                        <p className="text-sm text-white/90 leading-relaxed">"{scores.proTip}"</p>
                    </div>
                </div>
            )}

            {/* ===== GOLDEN INSIGHTS (PRO) ===== */}
            {isPro && (scores.identityReflection || scores.socialPerception) && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div
                        className="p-5 rounded-2xl border backdrop-blur-xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,140,0,0.04) 100%)',
                            borderColor: 'rgba(255,215,0,0.2)',
                            boxShadow: '0 0 40px rgba(255,215,0,0.1)'
                        }}
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-xl">✨</span>
                            <span className="text-sm font-black uppercase tracking-widest text-yellow-500">Golden Insights</span>
                        </div>
                        <div className="space-y-4">
                            {scores.identityReflection && (
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Identity</span>
                                    <p className="text-sm text-white/90 leading-relaxed">{scores.identityReflection}</p>
                                </div>
                            )}
                            {scores.socialPerception && (
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Perception</span>
                                    <p className="text-sm text-white/90 leading-relaxed">{scores.socialPerception}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===== SAVAGE ROASTS ===== */}
            {scores.savageLevel && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="p-4 rounded-2xl border backdrop-blur-xl" style={{ background: 'rgba(255,68,68,0.08)', borderColor: 'rgba(255,68,68,0.25)' }}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-red-500 uppercase tracking-widest">🔥 Savage Level</span>
                            <span className="text-2xl font-black text-red-500">{scores.savageLevel}/10</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full stat-bar-fill"
                                style={{ '--fill-width': `${scores.savageLevel * 10}%`, '--delay': '0.2s' }}
                            />
                        </div>
                        {scores.itemRoasts && (
                            <div className="space-y-2">
                                {Object.entries(scores.itemRoasts).filter(([_, r]) => r && r !== 'N/A').map(([k, v]) => (
                                    <div key={k}>
                                        <span className="text-[9px] font-black text-red-500/70 uppercase">{k}:</span>
                                        <p className="text-xs text-white/80">{v}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== CTAs ===== */}
            <div className={`w-full max-w-sm px-4 pt-2 transition-all duration-700 ${revealStage >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                {/* Share Button - Big and Bold */}
                <button
                    onClick={onGenerateShareCard}
                    aria-label="Share your outfit rating"
                    className="btn-physical btn-shine w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 mb-3 relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${theme.end} 0%, ${theme.accent} 100%)`,
                        boxShadow: `0 8px 0 rgba(0,0,0,0.25), 0 20px 40px ${theme.glow}`,
                        color: (scores.mode === 'roast' || scores.mode === 'savage') ? '#fff' : '#000'
                    }}
                >
                    <span className="text-2xl">📤</span> SHARE THIS FIT
                </button>

                {/* Try Again */}
                <button
                    onClick={onReset}
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    🔄 {scores.overall >= 85 ? "Beat this? Scan again" : scores.overall < 50 ? "Redeem yourself" : "Rate Another"}
                </button>

                {/* Scans remaining */}
                {!isPro && (
                    <p className="text-center text-[10px] uppercase font-bold tracking-widest mt-3 text-white/25">
                        {scansRemaining > 0 ? `⚡ ${scansRemaining} free scan${scansRemaining !== 1 ? 's' : ''} left` : '⏰ Daily limit reached'}
                    </p>
                )}

                {/* Mode switch */}
                {!isPro && scores.mode === 'nice' && (
                    <div className="mt-5 text-center">
                        <p className="text-[10px] text-white/30 mb-1">Too nice?</p>
                        <button
                            onClick={() => { onSetMode('roast'); onReset(); }}
                            className="text-xs text-red-400 font-black uppercase tracking-wider hover:text-red-300"
                        >
                            Try Roast Mode 😈
                        </button>
                    </div>
                )}
            </div>

            {/* Confetti for high scores */}
            {scores.overall >= 90 && revealStage >= 6 && (
                <Confetti count={35} colors={['#ffd700', theme.accent, theme.end, '#fff']} />
            )}

            <Footer className="opacity-30 pt-6 pb-4" />
        </div>
    )
}
