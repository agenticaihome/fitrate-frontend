import React, { useState, useEffect, useMemo, useRef } from 'react'
import Footer from '../components/common/Footer'
import { getScoreColor, getPercentile } from '../utils/scoreUtils'

// ============================================
// LEGENDARY SCORE-TIER COLORS
// Ring color reflects SCORE ACHIEVEMENT, not mode
// ============================================
const getScoreTierColors = (score) => {
    if (score >= 95) return { accent: '#ffd700', end: '#ff8c00', glow: 'rgba(255,215,0,0.6)' }   // LEGENDARY GOLD
    if (score >= 85) return { accent: '#ff6b35', end: '#ff0080', glow: 'rgba(255,107,53,0.5)' }  // FIRE ORANGE→PINK
    if (score >= 75) return { accent: '#00d4ff', end: '#0066ff', glow: 'rgba(0,212,255,0.5)' }   // GREAT CYAN
    if (score >= 60) return { accent: '#00ff88', end: '#00d4ff', glow: 'rgba(0,255,136,0.5)' }   // GOOD GREEN
    if (score >= 40) return { accent: '#ffaa00', end: '#ff6b00', glow: 'rgba(255,170,0,0.5)' }   // MID AMBER
    return { accent: '#ff4444', end: '#cc0000', glow: 'rgba(255,68,68,0.5)' }                    // LOW RED
}

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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-lg tracking-wide shadow-2xl"
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

// Challenge Card Component - Visually distinct card for weekly challenges
const ChallengeCard = ({ eventInfo, eventStatus, themeScore, themeVerdict, delay }) => {
    // Defensive checks: ensure eventInfo has required properties
    if (!eventInfo || !eventInfo.theme) return null

    const isTopRank = eventStatus?.rank && eventStatus.rank <= 5

    return (
        <div
            className="w-full max-w-sm px-4 mb-4 transition-all duration-700"
            style={{
                animation: `cardSlideUp 0.6s ease-out ${delay}s forwards`,
                opacity: 0
            }}
        >
            <div
                className="p-6 rounded-3xl border backdrop-blur-xl relative overflow-hidden"
                style={{
                    background: isTopRank
                        ? 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(16,185,129,0.15) 100%)'
                        : 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(6,182,212,0.12) 100%)',
                    borderColor: isTopRank ? 'rgba(251,191,36,0.4)' : 'rgba(16,185,129,0.3)',
                    boxShadow: isTopRank
                        ? '0 0 60px rgba(251,191,36,0.3), 0 20px 40px rgba(0,0,0,0.3)'
                        : '0 0 40px rgba(16,185,129,0.2), 0 20px 40px rgba(0,0,0,0.3)'
                }}
            >
                {/* Animated glow effect for top ranks */}
                {isTopRank && (
                    <div
                        className="absolute inset-0 rounded-3xl"
                        style={{
                            background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.15) 0%, transparent 70%)',
                            animation: 'pulse 3s ease-in-out infinite'
                        }}
                    />
                )}

                {/* Content */}
                <div className="relative z-10">
                    {/* Header: Challenge Badge */}
                    <div className="flex items-center justify-center mb-4">
                        <div
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
                            style={{
                                background: 'rgba(16,185,129,0.15)',
                                borderColor: 'rgba(16,185,129,0.3)',
                                boxShadow: '0 4px 20px rgba(16,185,129,0.2)'
                            }}
                        >
                            <span className="text-lg">🏆</span>
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                                Weekly Challenge Entry
                            </span>
                        </div>
                    </div>

                    {/* Theme Name & Emoji */}
                    <div className="text-center mb-4">
                        <div className="text-5xl mb-3">{eventInfo?.themeEmoji || '🎯'}</div>
                        <h2 className="text-2xl font-black text-white mb-2">
                            {eventInfo.theme}
                        </h2>
                        {eventInfo?.themeDescription && (
                            <p className="text-sm text-white/60 italic">
                                "{eventInfo.themeDescription}"
                            </p>
                        )}
                    </div>

                    {/* AI Theme Verdict - Show how AI judged theme compliance */}
                    {themeVerdict && (
                        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase tracking-wider text-purple-300 font-bold">
                                    🎯 Theme Alignment
                                </span>
                                {themeScore !== undefined && (
                                    <span className="text-sm font-black text-purple-400">
                                        {themeScore}/100
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-white/80 italic">
                                "{themeVerdict}"
                            </p>
                            {themeScore !== undefined && (
                                <div className="mt-2 h-1.5 bg-purple-900/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            width: `${themeScore}%`,
                                            background: themeScore >= 80
                                                ? 'linear-gradient(90deg, #10b981, #34d399)'
                                                : themeScore >= 50
                                                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                                    : 'linear-gradient(90deg, #ef4444, #f87171)'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent mb-4" />

                    {/* Score & Rank Display */}
                    <div className="flex items-center justify-around">
                        {/* Score */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-wider text-white/50 mb-1">Your Score</span>
                            <div
                                className="text-4xl font-black"
                                style={{
                                    color: isTopRank ? '#fbbf24' : '#10b981',
                                    textShadow: isTopRank
                                        ? '0 0 20px rgba(251,191,36,0.6)'
                                        : '0 0 20px rgba(16,185,129,0.6)'
                                }}
                            >
                                {eventStatus?.score || '—'}
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent" />

                        {/* Rank */}
                        <div className="flex flex-col items-center">
                            <span className="text-xs uppercase tracking-wider text-white/50 mb-1">Rank</span>
                            <div
                                className="text-4xl font-black"
                                style={{
                                    color: isTopRank ? '#fbbf24' : '#10b981',
                                    textShadow: isTopRank
                                        ? '0 0 20px rgba(251,191,36,0.6)'
                                        : '0 0 20px rgba(16,185,129,0.6)'
                                }}
                            >
                                #{eventStatus?.rank || '—'}
                            </div>
                        </div>
                    </div>

                    {/* Status Message */}
                    {eventStatus?.action && (
                        <div className="mt-4 text-center">
                            <span className="text-xs font-bold uppercase tracking-wider" style={{
                                color: eventStatus.action === 'added'
                                    ? '#10b981'
                                    : eventStatus.action === 'improved'
                                        ? '#fbbf24'
                                        : '#60a5fa'
                            }}>
                                {eventStatus.action === 'added' && '✅ Entry Submitted!'}
                                {eventStatus.action === 'improved' && '🎉 Score Improved!'}
                                {eventStatus.action === 'unchanged' && '📊 Entry Recorded'}
                            </span>
                        </div>
                    )}

                    {/* Top 5 Special Message */}
                    {isTopRank && (
                        <div className="mt-4 text-center">
                            <div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(251,191,36,0.1) 100%)',
                                    border: '1px solid rgba(251,191,36,0.3)'
                                }}
                            >
                                <span className="text-xl">👑</span>
                                <span className="text-xs font-black uppercase tracking-wider text-yellow-400">
                                    You're in the Top 5!
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Enhanced Confetti with tier-appropriate colors
const Confetti = ({ count, colors, scoreKey }) => {
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
                    key={`${scoreKey}-${p.id}`}
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
        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mt-2">
            <div
                className="h-full rounded-full"
                style={{
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                    boxShadow: `0 0 12px ${color}66`,
                    animation: `barFill 1s ease-out ${delay}s forwards`,
                    transform: 'scaleX(0)',
                    transformOrigin: 'left'
                }}
            />
        </div>
    )
}

// Enhanced Stat Pill with contribution display
const StatPill = ({ label, displayLabel, value, icon, delay, color, contribution }) => (
    <div
        className="flex flex-col items-center p-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-sm"
        style={{
            animation: `cardSlideUp 0.5s ease-out ${delay}s forwards`,
            opacity: 0
        }}
    >
        <div className="text-lg mb-0.5">{icon}</div>
        <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black" style={{ color: color || getScoreColor(value) }}>{value}</span>
            {contribution && (
                <span className="text-[10px] font-bold text-white/40">+{contribution}</span>
            )}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-white/50 font-bold mt-0.5">{displayLabel || label}</div>
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
    playSound,
    vibrate,
    currentEvent = null  // Weekly event context
}) {
    const [revealStage, setRevealStage] = useState(0)
    const [displayedScore, setDisplayedScore] = useState(0)
    const [animationComplete, setAnimationComplete] = useState(false)

    // Track if component is mounted to prevent state updates after unmount
    const isMounted = useRef(true)
    useEffect(() => {
        return () => { isMounted.current = false }
    }, [])

    // Animation sequence with proper locking
    useEffect(() => {
        if (!scores) return

        setRevealStage(0)
        setDisplayedScore(0)
        setAnimationComplete(false)

        const sound = scores.isLegendary ? 'legendary' : (scores.roastMode ? 'roast' : 'success')

        const timers = [
            setTimeout(() => {
                if (!isMounted.current) return
                playSound(sound)
                vibrate(scores.isLegendary ? [100, 50, 100, 50, 200] : (scores.roastMode ? [50, 50, 200] : [50, 50, 50]))
                setRevealStage(1)
            }, 100),
            setTimeout(() => {
                if (!isMounted.current) return
                setRevealStage(2)
                playSound('pop')
                vibrate(10)
            }, 400),
            setTimeout(() => {
                if (!isMounted.current) return
                setRevealStage(3)
                playSound('pop')
            }, 800),
            setTimeout(() => isMounted.current && setRevealStage(4), 1100),
            setTimeout(() => isMounted.current && setRevealStage(5), 1400),
            setTimeout(() => isMounted.current && setRevealStage(6), 1700),
        ]

        // Score counting animation with lock
        const duration = 1200
        const startTime = Date.now() + 400
        // FREE USERS: Whole numbers only. PRO USERS: Decimal precision
        const endScore = isPro ? scores.overall : Math.round(scores.overall)
        let animationFrameId

        const animateScore = () => {
            if (!isMounted.current) return
            const elapsed = Date.now() - startTime
            if (elapsed < 0) {
                animationFrameId = requestAnimationFrame(animateScore)
                return
            }
            const progress = Math.min(elapsed / duration, 1)
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            const currentScore = Math.floor(easeProgress * endScore)
            setDisplayedScore(currentScore)

            if (progress >= 1) {
                // LOCK: Animation complete - set exact final value
                setDisplayedScore(endScore)
                setAnimationComplete(true)
            } else {
                animationFrameId = requestAnimationFrame(animateScore)
            }
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

    // LEGENDARY: Score-tier based ring colors (not mode-based!)
    const ringColors = useMemo(() => {
        if (!scores) return getScoreTierColors(50)
        return getScoreTierColors(scores.overall)
    }, [scores?.overall])

    // Mode colors for secondary elements (tagline, accents)
    const modeColors = useMemo(() => {
        const themes = {
            savage: { accent: '#8b00ff', end: '#ff0044', glow: 'rgba(139,0,255,0.5)' },
            roast: { accent: '#ff4444', end: '#ff8800', glow: 'rgba(255,68,68,0.5)' },
            honest: { accent: '#0077ff', end: '#00d4ff', glow: 'rgba(0,119,255,0.5)' },
            nice: { accent: '#00d4ff', end: '#00ff88', glow: 'rgba(0,212,255,0.5)' },
            rizz: { accent: '#ff69b4', end: '#ff1493', glow: 'rgba(255,105,180,0.5)' },
            celeb: { accent: '#ffd700', end: '#ff8c00', glow: 'rgba(255,215,0,0.5)' },
            aura: { accent: '#9b59b6', end: '#8e44ad', glow: 'rgba(155,89,182,0.5)' },
            chaos: { accent: '#ff6b6b', end: '#ee5a24', glow: 'rgba(255,107,107,0.5)' }
        }
        return themes[scores?.mode] || themes.nice
    }, [scores?.mode])

    // Keep theme for backward compatibility
    const theme = ringColors

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
                    className="h-8 mb-2 opacity-60"
                />

                {/* Event Theme Banner - Show when in event mode */}
                {currentEvent && (
                    <div
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-3"
                        style={{
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.2) 100%)',
                            border: '1px solid rgba(16,185,129,0.4)'
                        }}
                    >
                        <span className="text-sm">{currentEvent.themeEmoji}</span>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                            {currentEvent.theme}
                        </span>
                    </div>
                )}

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
                        background: 'rgba(255,255,255,0.05)',
                        borderColor: `${ringColors.accent}33`,
                        boxShadow: `0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 40px ${ringColors.glow}`
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

                    {/* Tagline - Uses mode colors for secondary accent */}
                    <div
                        className="inline-block px-4 py-1.5 rounded-full border"
                        style={{
                            borderColor: `${modeColors.accent}33`,
                            background: `${modeColors.accent}11`
                        }}
                    >
                        <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: modeColors.accent }}>
                            {scores.tagline}
                        </span>
                    </div>

                    {/* Social Proof */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <p className="text-base font-bold" style={{ color: socialProof.color }}>{socialProof.msg}</p>
                        <p className="text-xs text-white/40 mt-1">Top {Math.max(1, 100 - scores.percentile)}% of all fits today</p>
                    </div>
                </div>
            </div>

            {/* ===== CHALLENGE CARD - Weekly Event Entry ===== */}
            {/* Show if we have event data from backend OR if currentEvent prop is passed */}
            {(scores.eventInfo || currentEvent) && (scores.eventStatus || currentEvent) && (
                <ChallengeCard
                    eventInfo={scores.eventInfo || currentEvent}
                    eventStatus={scores.eventStatus || { rank: null, score: scores.overall, action: 'submitted' }}
                    themeScore={scores.themeScore}
                    themeVerdict={scores.themeVerdict}
                    delay={0.4}
                />
            )}

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
                                border: `2px solid ${ringColors.accent}44`,
                                boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 30px ${ringColors.glow}`
                            }}
                        >
                            <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 opacity-40">
                                <span className="text-[8px] font-black text-white tracking-widest uppercase drop-shadow">FITRATE.APP</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats - Takes 2 columns - Now with contribution weights */}
                    <div className="col-span-2 flex flex-col gap-2">
                        <StatPill
                            label="Color"
                            displayLabel="Color Pop"
                            value={scores.color}
                            icon="🎨"
                            delay={0.1}
                            color="#ff6b9d"
                            contribution={Math.round(scores.color * 0.25)}
                        />
                        <StatPill
                            label="Fit"
                            displayLabel="Silhouette"
                            value={scores.fit}
                            icon="📐"
                            delay={0.2}
                            color="#00d4ff"
                            contribution={Math.round(scores.fit * 0.35)}
                        />
                        <StatPill
                            label="Style"
                            displayLabel="Cohesion"
                            value={scores.style}
                            icon="✨"
                            delay={0.3}
                            color="#ffd700"
                            contribution={Math.round(scores.style * 0.40)}
                        />
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

            {/* ===== PRO TEASER (FREE USERS) ===== */}
            {!isPro && revealStage >= 5 && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div
                        className="p-5 rounded-2xl border backdrop-blur-xl relative overflow-hidden cursor-pointer group"
                        onClick={onShowPaywall}
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(255,140,0,0.02) 100%)',
                            borderColor: 'rgba(255,215,0,0.15)',
                        }}
                    >
                        {/* Blurred content preview */}
                        <div className="blur-[6px] select-none pointer-events-none">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xl">✨</span>
                                <span className="text-sm font-black uppercase tracking-widest text-yellow-500/50">Golden Insights</span>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Identity</span>
                                    <p className="text-sm text-white/30 leading-relaxed">This outfit projects a confident, creative energy that blends...</p>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Perception</span>
                                    <p className="text-sm text-white/30 leading-relaxed">Others see someone who takes style seriously without...</p>
                                </div>
                            </div>
                        </div>

                        {/* Unlock overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
                            <span className="text-2xl mb-2">🔒</span>
                            <span className="text-sm font-black text-yellow-400 uppercase tracking-wide">Unlock Deep Analysis</span>
                            <span className="text-xs text-white/50 mt-1">See what your fit really says about you</span>
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

            {/* ===== RIZZ MODE CARD ===== */}
            {scores.mode === 'rizz' && scores.rizzType && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="p-4 rounded-2xl border backdrop-blur-xl" style={{ background: 'rgba(255,105,180,0.08)', borderColor: 'rgba(255,105,180,0.25)' }}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-pink-400 uppercase tracking-widest">😏 Rizz Rating</span>
                            <span className="text-2xl font-black text-pink-400">{scores.pullProbability || scores.overall}%</span>
                        </div>
                        <div className="text-center mb-3">
                            <span className="text-3xl font-black text-white">{scores.rizzType}</span>
                        </div>
                        {scores.pickupLine && (
                            <div className="bg-pink-500/10 rounded-xl p-3 mb-3">
                                <span className="text-[10px] font-bold text-pink-300 uppercase">Pickup Line:</span>
                                <p className="text-sm text-white/90 italic">"{scores.pickupLine}"</p>
                            </div>
                        )}
                        {scores.datingApps && (
                            <div className="flex justify-around text-center">
                                <div><span className="text-lg">🔥</span><p className="text-xs text-white/60">Tinder</p><p className="text-lg font-black text-pink-400">{scores.datingApps.tinder}/10</p></div>
                                <div><span className="text-lg">💜</span><p className="text-xs text-white/60">Hinge</p><p className="text-lg font-black text-pink-400">{scores.datingApps.hinge}/10</p></div>
                                <div><span className="text-lg">🐝</span><p className="text-xs text-white/60">Bumble</p><p className="text-lg font-black text-pink-400">{scores.datingApps.bumble}/10</p></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== CELEBRITY JUDGE CARD ===== */}
            {scores.mode === 'celeb' && scores.celebrityJudge && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="p-4 rounded-2xl border backdrop-blur-xl" style={{ background: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.25)' }}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🎭</span>
                            <span className="text-lg font-black text-yellow-400">{scores.celebrityJudge}</span>
                        </div>
                        {scores.celebQuote && (
                            <blockquote className="bg-yellow-500/10 rounded-xl p-4 mb-3 border-l-4 border-yellow-500">
                                <p className="text-sm text-white/90 italic">"{scores.celebQuote}"</p>
                                <cite className="text-[10px] text-yellow-400/70 mt-2 block">— {scores.celebrityJudge}</cite>
                            </blockquote>
                        )}
                        <div className="text-center">
                            <span className={`text-xl font-black ${scores.wouldTheyWear ? 'text-green-400' : 'text-red-400'}`}>
                                {scores.wouldTheyWear ? '✅ Would Wear' : '❌ Would NOT Wear'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== AURA / VIBE CHECK CARD ===== */}
            {scores.mode === 'aura' && scores.auraColor && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="p-4 rounded-2xl border backdrop-blur-xl" style={{ background: 'rgba(155,89,182,0.08)', borderColor: 'rgba(155,89,182,0.25)' }}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-purple-400 uppercase tracking-widest">🔮 Aura Reading</span>
                            <span className="text-lg font-black text-purple-400">{scores.energyLevel || scores.overall}% Energy</span>
                        </div>
                        <div className="text-center mb-4">
                            <div className="inline-block px-6 py-3 rounded-full" style={{ background: 'linear-gradient(135deg, rgba(155,89,182,0.3), rgba(155,89,182,0.1))', border: '2px solid rgba(155,89,182,0.5)' }}>
                                <span className="text-3xl font-black text-purple-300">{scores.auraColor} Aura</span>
                            </div>
                        </div>
                        {scores.vibeAssessment && (
                            <div className="text-center mb-3">
                                <span className="text-xs uppercase text-white/40">Vibe Assessment</span>
                                <p className="text-xl font-black text-white">{scores.vibeAssessment}</p>
                            </div>
                        )}
                        {scores.spiritualRoast && (
                            <div className="bg-purple-500/10 rounded-xl p-3">
                                <p className="text-sm text-white/80 italic text-center">"✨ {scores.spiritualRoast}"</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== CHAOS MODE CARD ===== */}
            {scores.mode === 'chaos' && scores.chaosLevel && (
                <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <div className="p-4 rounded-2xl border backdrop-blur-xl" style={{ background: 'rgba(255,107,107,0.08)', borderColor: 'rgba(255,107,107,0.25)', animation: scores.chaosLevel >= 8 ? 'shake 0.5s infinite' : 'none' }}>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-black text-red-400 uppercase tracking-widest">🎪 Chaos Level</span>
                            <span className="text-2xl font-black text-red-400">{scores.chaosLevel}/10</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-full" style={{ width: `${scores.chaosLevel * 10}%` }} />
                        </div>
                        {scores.absurdComparison && (
                            <div className="bg-red-500/10 rounded-xl p-3 mb-3">
                                <span className="text-[10px] font-bold text-red-300 uppercase">Chaos Take:</span>
                                <p className="text-sm text-white/90">"{scores.absurdComparison}"</p>
                            </div>
                        )}
                        {scores.alternateReality && (
                            <div className="text-center">
                                <span className="text-[10px] uppercase text-white/40">In Another Universe</span>
                                <p className="text-sm text-white/70 italic">{scores.alternateReality}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ===== CTAs ===== */}
            <div className={`w-full max-w-sm px-4 pt-2 transition-all duration-700 ${revealStage >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                {/* Challenge a Friend - PRIMARY CTA per Founders Council */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(30)
                        // Generate share card with challenge link
                        onGenerateShareCard('challenge')
                    }}
                    aria-label="Challenge a friend to beat your score"
                    className="btn-physical btn-shine w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 mb-3 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #ff6b35 0%, #ff0080 100%)',
                        boxShadow: '0 8px 0 rgba(0,0,0,0.25), 0 20px 40px rgba(255,107,53,0.4)',
                        color: '#fff'
                    }}
                >
                    <span className="text-2xl">👊</span> CHALLENGE A FRIEND
                </button>

                {/* Share Button - Secondary */}
                <button
                    onClick={onGenerateShareCard}
                    aria-label="Share your outfit rating"
                    className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 mb-3 transition-all active:scale-[0.97]"
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.8)'
                    }}
                >
                    <span className="text-lg">📤</span> Share This Fit
                </button>

                {/* Try Again */}
                <button
                    onClick={onReset}
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                    🔄 {scores.overall >= 85 ? "Beat this? Scan again" : scores.overall < 50 ? "Redeem yourself" : "Rate Another"}
                </button>

                {/* Scans remaining or Inline Paywall */}
                {!isPro && (
                    scansRemaining > 0 ? (
                        <p className="text-center text-[10px] uppercase font-bold tracking-widest mt-3 text-white/25">
                            ⚡ {scansRemaining} free scan{scansRemaining !== 1 ? 's' : ''} left
                        </p>
                    ) : (
                        <div
                            className="mt-4 p-5 rounded-2xl border cursor-pointer group transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={onShowPaywall}
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(0,212,255,0.05) 100%)',
                                borderColor: 'rgba(255,215,0,0.25)',
                                boxShadow: '0 0 40px rgba(255,215,0,0.15)'
                            }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-lg">⏰</span>
                                <span className="text-xs font-black text-yellow-500 uppercase tracking-wider animate-pulse">
                                    Daily Limit Reached
                                </span>
                                <span className="text-lg">🔒</span>
                            </div>
                            <h3 className="text-base font-black text-white text-center mb-2">
                                Want more ratings?
                            </h3>
                            <p className="text-xs text-white/60 text-center mb-4">
                                Unlock unlimited scans + Pro analysis
                            </p>
                            <div
                                className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all group-hover:brightness-110"
                                style={{
                                    background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                    color: '#000',
                                    boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
                                }}
                            >
                                Upgrade Now →
                            </div>
                        </div>
                    )
                )}

                {/* Mode switch */}
                {!isPro && scores.mode === 'nice' && (
                    <div className="mt-5 text-center">
                        <p className="text-[10px] text-white/30 mb-1">Too nice?</p>
                        <button
                            onClick={() => { onSetMode('roast'); onReset(); }}
                            className="text-xs text-red-400 font-black uppercase tracking-wider hover:text-red-300 transition-colors"
                        >
                            Try Roast Mode 😈
                        </button>
                    </div>
                )}
            </div>

            {/* ===== LEGENDARY CONFETTI SYSTEM ===== */}
            {/* Tier-based confetti with scoreKey to prevent re-trigger bugs */}
            {animationComplete && revealStage >= 6 && scoreTier !== 'low' && scoreTier !== 'mid' && (
                <Confetti
                    key={`confetti-${scores.overall}-${scores.mode}`}
                    scoreKey={scores.overall}
                    count={scoreTier === 'legendary' ? 50 : scoreTier === 'fire' ? 40 : 25}
                    colors={
                        scoreTier === 'legendary'
                            ? ['#ffd700', '#ff8c00', '#fff', '#ffe066']  // Golden celebration
                            : scoreTier === 'fire'
                                ? ['#ff6b35', '#ff0080', '#ffd700', '#fff']  // Fire party
                                : ['#00d4ff', '#0066ff', '#00ff88', '#fff']  // Cool success
                    }
                />
            )}

            {/* Extra bottom padding for sticky CTA visibility */}
            <div className="h-4" />

            <Footer className="opacity-30 pt-6 pb-4" />
        </div>
    )
}
