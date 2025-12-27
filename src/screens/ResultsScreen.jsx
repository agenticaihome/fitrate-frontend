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

// ============================================
// MODE-THEMED ACCENT COLORS
// Each AI mode has distinct accent for UI theming
// ============================================
const getModeColors = (mode) => {
    const colors = {
        nice: { accent: '#00ff88', end: '#00d4ff', glow: 'rgba(0,255,136,0.4)', border: 'rgba(0,255,136,0.3)', bg: 'rgba(0,255,136,0.08)', pulse: 'gentle' },
        roast: { accent: '#ff6b35', end: '#ff0080', glow: 'rgba(255,107,53,0.4)', border: 'rgba(255,107,53,0.3)', bg: 'rgba(255,107,53,0.08)', pulse: 'fire' },
        honest: { accent: '#3b82f6', end: '#06b6d4', glow: 'rgba(59,130,246,0.4)', border: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.08)', pulse: 'steady' },
        savage: { accent: '#ff1493', end: '#ff0066', glow: 'rgba(255,20,147,0.4)', border: 'rgba(255,20,147,0.3)', bg: 'rgba(255,20,147,0.08)', pulse: 'intense' },
        rizz: { accent: '#ff69b4', end: '#ff1493', glow: 'rgba(255,105,180,0.4)', border: 'rgba(255,105,180,0.3)', bg: 'rgba(255,105,180,0.08)', pulse: 'flirty' },
        celeb: { accent: '#ffd700', end: '#ff8c00', glow: 'rgba(255,215,0,0.4)', border: 'rgba(255,215,0,0.3)', bg: 'rgba(255,215,0,0.08)', pulse: 'glamour' },
        aura: { accent: '#9b59b6', end: '#8b5cf6', glow: 'rgba(155,89,182,0.4)', border: 'rgba(155,89,182,0.3)', bg: 'rgba(155,89,182,0.08)', pulse: 'mystical' },
        chaos: { accent: '#ff4444', end: '#ff6b6b', glow: 'rgba(255,68,68,0.4)', border: 'rgba(255,68,68,0.3)', bg: 'rgba(255,68,68,0.08)', pulse: 'chaotic' },
        // Y2K: Now uses distinct cyan/teal to differentiate from Rizz pink
        y2k: { accent: '#00CED1', end: '#FF69B4', glow: 'rgba(0,206,209,0.4)', border: 'rgba(0,206,209,0.3)', bg: 'rgba(0,206,209,0.08)', pulse: 'sparkle' },
        villain: { accent: '#4c1d95', end: '#2d1b4e', glow: 'rgba(76,29,149,0.4)', border: 'rgba(76,29,149,0.3)', bg: 'rgba(76,29,149,0.08)', pulse: 'menacing' },
        coquette: { accent: '#ffb6c1', end: '#ffc0cb', glow: 'rgba(255,182,193,0.4)', border: 'rgba(255,182,193,0.3)', bg: 'rgba(255,182,193,0.08)', pulse: 'soft' },
        hypebeast: { accent: '#f97316', end: '#ea580c', glow: 'rgba(249,115,22,0.4)', border: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.08)', pulse: 'drip' },
        event: { accent: '#10b981', end: '#06b6d4', glow: 'rgba(16,185,129,0.4)', border: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.08)', pulse: 'gentle' }
    }
    return colors[mode] || colors.honest
}

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

// Daily Challenge Rank Badge - Shows rank on daily leaderboard
const DailyRankBadge = ({ leaderboard }) => {
    if (!leaderboard?.rank) return null;

    const { rank, title, description } = leaderboard;

    // Rank-based styling
    const getStyle = () => {
        if (rank === 1) return { bg: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)', text: '#000', glow: 'rgba(255,215,0,0.5)', icon: '👑' };
        if (rank === 2) return { bg: 'linear-gradient(135deg, #c0c0c0 0%, #a8a8a8 100%)', text: '#000', glow: 'rgba(192,192,192,0.4)', icon: '🥈' };
        if (rank === 3) return { bg: 'linear-gradient(135deg, #cd7f32 0%, #b87333 100%)', text: '#fff', glow: 'rgba(205,127,50,0.4)', icon: '🥉' };
        if (rank <= 10) return { bg: 'linear-gradient(135deg, #ff6b35 0%, #ff0080 100%)', text: '#fff', glow: 'rgba(255,107,53,0.4)', icon: '🔥' };
        return { bg: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', text: '#fff', glow: 'rgba(59,130,246,0.4)', icon: '⚡' };
    };

    const style = getStyle();

    return (
        <div
            className="w-full max-w-sm mb-4 p-3 rounded-2xl text-center relative overflow-hidden"
            style={{
                background: style.bg,
                boxShadow: `0 4px 20px ${style.glow}`,
                animation: rank <= 3 ? 'pulse 2s ease-in-out infinite' : 'none'
            }}
        >
            <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{style.icon}</span>
                <div className="text-left">
                    <p className="font-black text-lg" style={{ color: style.text }}>
                        Today's Rank: #{rank}
                    </p>
                    <p className="text-xs" style={{ color: style.text, opacity: 0.8 }}>
                        {title || description || 'Daily Challenge'}
                    </p>
                </div>
            </div>
        </div>
    );
};

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
    cardDNA = null,  // Unique visual DNA for this card
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
    currentEvent = null,  // Weekly event context
    onStartFashionShow = null,  // Fashion Show entry
    totalScans = 0,  // Total scans user has done (for discovery timing)
    fashionShowId = null,  // Fashion Show context for return button
    fashionShowName = null,
    onReturnToRunway = null,
    dailyStreak = null,  // Daily streak data { current, max, emoji, message, tier, isMilestone, milestone }
    showToast = null,  // Toast function for streak celebration
    pendingBattleId = null,  // Battle ID if user just responded to a battle challenge
    onSeeBattleResults = null  // Callback to navigate to battle results
}) {
    const [revealStage, setRevealStage] = useState(0)
    const [displayedScore, setDisplayedScore] = useState(0)
    const [animationComplete, setAnimationComplete] = useState(false)

    // Track if component is mounted to prevent state updates after unmount
    const isMounted = useRef(true)
    useEffect(() => {
        return () => { isMounted.current = false }
    }, [])

    // ===== CARD DNA: Extract DNA-driven styling =====
    const dnaStyleTokens = cardDNA?.styleTokens || {}
    const dnaCopySlots = cardDNA?.copySlots || {}

    // DNA-driven background gradient (falls back to default deep-space)
    const dnaGradient = dnaStyleTokens.gradient?.colors || ['#0a0a15', '#1a1a2e']
    const dnaBackground = `linear-gradient(to bottom, ${dnaGradient[0]}, ${dnaGradient[1]})`

    // DNA-driven ring style variations
    const dnaRingStyle = dnaStyleTokens.ringStyle?.id || 'solid'

    // DNA-driven headline weight
    const dnaHeadlineWeight = dnaStyleTokens.headlineWeight || 700

    // DNA ring style properties (solid, segmented, neon, double)
    const dnaRingProps = useMemo(() => {
        switch (dnaRingStyle) {
            case 'segmented':
                return { strokeWidth: 10, strokeDasharray: '20 5', linecap: 'butt' }
            case 'neon':
                return { strokeWidth: 5, strokeDasharray: '264', linecap: 'round' }
            case 'double':
                return { strokeWidth: 6, strokeDasharray: '264', linecap: 'round', hasOuterRing: true }
            default: // 'solid'
                return { strokeWidth: 8, strokeDasharray: '264', linecap: 'round' }
        }
    }, [dnaRingStyle])

    // DNA pattern overlay style
    const dnaPatternId = dnaStyleTokens.pattern?.id || 'none'
    const dnaPatternOpacity = dnaStyleTokens.pattern?.opacity || 0
    const dnaPatternStyle = useMemo(() => {
        if (dnaPatternId === 'none') return null
        const patterns = {
            'dots': `radial-gradient(circle, rgba(255,255,255,${dnaPatternOpacity}) 1px, transparent 1px)`,
            'grid': `linear-gradient(rgba(255,255,255,${dnaPatternOpacity}) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,${dnaPatternOpacity}) 1px, transparent 1px)`,
            'noise': null // Handled via filter
        }
        return patterns[dnaPatternId]
    }, [dnaPatternId, dnaPatternOpacity])

    // DNA copy slots (verdict badge, next action)
    const dnaVerdictBadge = dnaCopySlots.verdictBadge || null
    const dnaNextAction = dnaCopySlots.nextAction || null
    const dnaMotivation = dnaCopySlots.motivation || null
    const dnaTimeBadge = dnaCopySlots.timeBadge || null
    const dnaStreakBadge = dnaCopySlots.streakBadge || null

    // Time-of-day context
    const timeContext = cardDNA?.timeContext || {}
    const timePeriod = timeContext.period || 'afternoon'
    const timeAccent = timeContext.accent || null

    // Streak context (for enhanced visuals)
    const streakContext = cardDNA?.streakContext || {}
    const streakTier = streakContext.tier || 'none'
    const streakRingGlow = streakContext.ringGlow || 1.0
    const streakEffects = streakContext.effects || []

    // Scroll to top when results appear (fixes scroll position bugs)
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [scores])

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

    // Mode colors for secondary elements (tagline, accents) - uses new getModeColors helper
    const modeColors = useMemo(() => {
        return getModeColors(scores?.mode || 'honest')
    }, [scores?.mode])

    // Keep theme for backward compatibility
    const theme = ringColors

    // Background gradient based on tier + DNA variation
    const bgGradient = useMemo(() => {
        // DNA provides base gradient colors, tier provides accent overlay
        const baseColor = dnaGradient[1] || '#0a0a0f'
        const gradients = {
            legendary: `radial-gradient(ellipse at top, rgba(255,215,0,0.15) 0%, rgba(255,140,0,0.08) 40%, ${baseColor} 70%)`,
            fire: `radial-gradient(ellipse at top, rgba(255,107,53,0.12) 0%, rgba(255,0,128,0.06) 40%, ${baseColor} 70%)`,
            great: `radial-gradient(ellipse at top, rgba(0,212,255,0.12) 0%, rgba(0,102,255,0.06) 40%, ${baseColor} 70%)`,
            good: `radial-gradient(ellipse at top, rgba(0,255,136,0.1) 0%, rgba(0,212,255,0.05) 40%, ${baseColor} 70%)`,
            mid: `radial-gradient(ellipse at top, rgba(255,170,0,0.1) 0%, rgba(255,107,0,0.05) 40%, ${baseColor} 70%)`,
            low: `radial-gradient(ellipse at top, rgba(255,68,68,0.12) 0%, rgba(204,0,0,0.06) 40%, ${baseColor} 70%)`
        }
        return gradients[scoreTier]
    }, [scoreTier, dnaGradient])

    // Social proof message - DISTINCT for each of 12 modes
    const socialProof = useMemo(() => {
        if (!scores) return { msg: '', color: '#fff' }
        const s = scores.overall
        const m = scores.mode || mode

        switch (m) {
            case 'savage':
                if (s >= 60) return { msg: '💀 YOU SURVIVED (Barely)', color: '#ffaa00' }
                if (s >= 35) return { msg: '🩸 AI drew blood', color: '#ff6b6b' }
                return { msg: '☠️ ABSOLUTE ANNIHILATION', color: '#ff4444' }

            case 'roast':
                if (s >= 70) return { msg: '😏 You survived the roast', color: '#00d4ff' }
                if (s >= 45) return { msg: '💀 Rough day for your closet', color: '#ffaa00' }
                return { msg: '☠️ AI showed no mercy', color: '#ff6b6b' }

            case 'honest':
                if (s >= 90) return { msg: '💎 STYLE GOD — Pure Perfection', color: '#ffd700' }
                if (s >= 75) return { msg: '📊 Analysis: Strong fit', color: '#00d4ff' }
                if (s >= 55) return { msg: '📈 Decent. Room to improve', color: '#ffaa00' }
                return { msg: '📉 Needs work', color: '#ff6b6b' }

            case 'rizz':
                if (s >= 85) return { msg: '💋 MAIN CHARACTER RIZZ', color: '#ff69b4' }
                if (s >= 70) return { msg: '😏 Strong dating potential', color: '#ff69b4' }
                if (s >= 50) return { msg: '💭 Work on the approach', color: '#ffaa00' }
                return { msg: '💔 Swipe left energy', color: '#ff6b6b' }

            case 'celeb':
                if (s >= 90) return { msg: '⭐ RED CARPET READY', color: '#ffd700' }
                if (s >= 75) return { msg: '📸 Paparazzi worthy', color: '#ffd700' }
                if (s >= 55) return { msg: '🎭 Almost A-list', color: '#ffaa00' }
                return { msg: '🎬 Needs a stylist', color: '#ff6b6b' }

            case 'aura':
                if (s >= 85) return { msg: '🔮 TRANSCENDENT ENERGY', color: '#9b59b6' }
                if (s >= 70) return { msg: '✨ Strong vibes detected', color: '#9b59b6' }
                if (s >= 50) return { msg: '💫 Energy fluctuating', color: '#ffaa00' }
                return { msg: '🌑 Chakras misaligned', color: '#ff6b6b' }

            case 'chaos':
                if (s >= 80) return { msg: '🎪 GLORIOUS CHAOS', color: '#ff6b6b' }
                if (s >= 60) return { msg: '🌀 Acceptable madness', color: '#ff6b6b' }
                if (s >= 40) return { msg: '🤡 Confusion achieved', color: '#ffaa00' }
                return { msg: '❓ Error 404: Style not found', color: '#ff4444' }

            case 'y2k':
                if (s >= 85) return { msg: "💎 THAT'S HOT — Paris approved", color: '#ff69b4' }
                if (s >= 70) return { msg: '🦋 So 2003 coded', color: '#ff69b4' }
                if (s >= 50) return { msg: '✨ Needs more bling', color: '#ffaa00' }
                return { msg: '📱 Wrong decade, bestie', color: '#ff6b6b' }

            case 'villain':
                if (s >= 85) return { msg: '🖤 MAIN VILLAIN ENERGY', color: '#4c1d95' }
                if (s >= 70) return { msg: '👿 Antagonist in training', color: '#4c1d95' }
                if (s >= 50) return { msg: '🌑 Side villain at best', color: '#ffaa00' }
                return { msg: '😇 Too protagonist-coded', color: '#ff6b6b' }

            case 'coquette':
                if (s >= 85) return { msg: '🎀 PINTEREST PRINCESS', color: '#ffb6c1' }
                if (s >= 70) return { msg: '🩰 Balletcore approved', color: '#ffb6c1' }
                if (s >= 50) return { msg: '🌸 Needs more bows', color: '#ffaa00' }
                return { msg: '🖤 Too edgy for coquette', color: '#ff6b6b' }

            case 'hypebeast':
                if (s >= 85) return { msg: '👟 CERTIFIED DRIP', color: '#f97316' }
                if (s >= 70) return { msg: '💸 Valid streetwear', color: '#f97316' }
                if (s >= 50) return { msg: '🏷️ Outlet mall energy', color: '#ffaa00' }
                return { msg: "👎 Where's the hype?", color: '#ff6b6b' }

            case 'nice':
            default:
                if (s >= 95) return { msg: '👑 ICONIC — Internet-breaking fit', color: '#ffd700' }
                if (s >= 85) return { msg: '🔥 LEGENDARY — Post this NOW', color: '#ff6b35' }
                if (s >= 75) return { msg: '✨ Main character energy', color: '#00d4ff' }
                if (s >= 65) return { msg: '💅 Serve! TikTok approved', color: '#00ff88' }
                if (s >= 50) return { msg: '👀 Cute! Minor tweaks = viral', color: '#ffaa00' }
                return { msg: '💪 Good foundation, keep styling!', color: '#ff6b6b' }
        }
    }, [scores, mode])

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
            {/* DNA Pattern Overlay */}
            {dnaPatternStyle && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: dnaPatternStyle,
                        backgroundSize: dnaPatternId === 'dots' ? '20px 20px' : '40px 40px',
                        opacity: 1,
                        zIndex: 0
                    }}
                />
            )}

            {/* ===== HERO SECTION: GIANT SCORE ===== */}
            <div className={`w-full px-4 pt-4 pb-6 flex flex-col items-center transition-all duration-700 overflow-visible ${revealStage >= 1 ? 'opacity-100' : 'opacity-0'}`}>

                {/* MODE-SPECIFIC Header with Mode-Themed Lines */}
                <div className="flex items-center gap-3 mb-4">
                    <div
                        className="h-px w-12"
                        style={{ background: `linear-gradient(90deg, transparent 0%, ${modeColors.accent} 100%)` }}
                    />
                    <span
                        className="text-xs font-black uppercase tracking-[0.2em]"
                        style={{ color: modeColors.accent }}
                    >
                        {(() => {
                            const m = scores?.mode || mode
                            switch (m) {
                                case 'roast': return 'The Roast Report'
                                case 'savage': return 'Destruction Report'
                                case 'honest': return 'Honest Analysis'
                                case 'rizz': return 'Rizz Assessment'
                                case 'celeb': return 'Celebrity Verdict'
                                case 'aura': return 'Aura Reading'
                                case 'chaos': return 'Chaos Evaluation'
                                case 'y2k': return 'Y2K Verdict'
                                case 'villain': return 'Villain Assessment'
                                case 'coquette': return 'Coquette Verdict'
                                case 'hypebeast': return 'Hype Report'
                                case 'nice':
                                default: return "Today's Fit Verdict"
                            }
                        })()}
                    </span>
                    <div
                        className="h-px w-12"
                        style={{ background: `linear-gradient(90deg, ${modeColors.accent} 0%, transparent 100%)` }}
                    />
                </div>

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

                {/* 🏆 TOP 5 CELEBRATION BANNER - Show when user achieves top 5 */}
                {scores?.eventStatus?.rank && scores.eventStatus.rank <= 5 && (
                    <div
                        className="w-full max-w-sm mb-4 p-4 rounded-2xl border relative overflow-hidden"
                        style={{
                            background: scores.eventStatus.rank === 1
                                ? 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.2) 100%)'
                                : scores.eventStatus.rank <= 3
                                    ? 'linear-gradient(135deg, rgba(192,192,192,0.2) 0%, rgba(139,92,246,0.2) 100%)'
                                    : 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(59,130,246,0.2) 100%)',
                            borderColor: scores.eventStatus.rank === 1 ? 'rgba(255,215,0,0.6)' : 'rgba(139,92,246,0.4)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                    >
                        {/* Celebratory glow */}
                        <div className="absolute inset-0 rounded-2xl" style={{
                            background: 'radial-gradient(circle at 50% 0%, rgba(255,215,0,0.2) 0%, transparent 60%)',
                            animation: 'pulse 3s ease-in-out infinite'
                        }} />

                        <div className="relative z-10 text-center">
                            {/* Medal Icon */}
                            <span className="text-5xl block mb-2">
                                {scores.eventStatus.rank === 1 ? '👑' :
                                    scores.eventStatus.rank === 2 ? '🥈' :
                                        scores.eventStatus.rank === 3 ? '🥉' : '⭐'}
                            </span>

                            {/* Title */}
                            <h3 className="text-xl font-black text-white mb-1">
                                {scores.eventStatus.rank === 1 ? '🎉 YOU\'RE #1!' :
                                    scores.eventStatus.rank <= 3 ? `You're #${scores.eventStatus.rank}!` :
                                        `Top 5! (#${scores.eventStatus.rank})`}
                            </h3>

                            {/* Subtitle */}
                            <p className="text-sm text-white/70">
                                {scores.eventStatus.action === 'improved'
                                    ? `New personal best! Climbed to #${scores.eventStatus.rank}`
                                    : `You're in the Top 5 on the leaderboard!`}
                            </p>

                            {/* Theme context */}
                            {currentEvent && (
                                <p className="text-xs text-emerald-400/80 mt-2">
                                    {currentEvent.themeEmoji} {currentEvent.theme} Challenge
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Daily Challenge Rank - Shows for non-event scans */}
                {scores?.leaderboard?.rank && !scores?.eventStatus && (
                    <DailyRankBadge leaderboard={scores.leaderboard} />
                )}

                {/* ===== HERO IMAGE SECTION (60% viewport - Golden Result Card style) ===== */}
                <div className={`relative w-full max-w-sm mx-auto mb-4 transition-all duration-700 ${revealStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                    {/* Hero Image Container */}
                    <div
                        className="relative w-full rounded-3xl overflow-hidden"
                        style={{
                            height: '55vh',
                            maxHeight: '500px',
                            minHeight: '320px'
                        }}
                    >
                        {/* User Photo - DOMINANT */}
                        <img
                            src={uploadedImage}
                            alt="Your outfit"
                            className="w-full h-full object-cover"
                            style={{
                                objectPosition: 'center 20%'  // Face focus
                            }}
                        />

                        {/* Vignette gradient for text legibility */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)'
                            }}
                        />

                        {/* Subtle border */}
                        <div
                            className="absolute inset-0 rounded-3xl pointer-events-none"
                            style={{
                                border: `2px solid ${modeColors.accent}30`,
                                boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px ${modeColors.glow}`
                            }}
                        />
                    </div>

                    {/* Score Badge - Overlapping image bottom (like Golden Result Card) */}
                    <div
                        className={`absolute left-1/2 -translate-x-1/2 transition-all duration-500 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{ bottom: '-40px' }}
                    >
                        <div
                            className="relative w-[100px] h-[100px] rounded-full flex flex-col items-center justify-center"
                            style={{
                                background: '#0a0a15',
                                border: `4px solid ${theme.accent}`,
                                boxShadow: `0 0 30px ${theme.glow}, 0 8px 24px rgba(0,0,0,0.5)`
                            }}
                        >
                            {/* Score Number */}
                            <span
                                className={`text-4xl font-black leading-none ${isLegendary ? 'legendary-text' : ''}`}
                                style={{
                                    color: isLegendary ? undefined : '#fff',
                                    textShadow: `0 0 20px ${theme.glow}`,
                                    animation: revealStage >= 2 ? 'scoreNumberPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none'
                                }}
                            >
                                {displayedScore}
                            </span>
                            {/* /100 */}
                            <span className="text-xs font-bold text-white/40">/100</span>
                        </div>

                        {/* Score ring progress around badge */}
                        <svg
                            className="absolute inset-0 w-full h-full -rotate-90"
                            viewBox="0 0 100 100"
                        >
                            <circle
                                cx="50" cy="50" r="46"
                                fill="none"
                                stroke={theme.accent}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray="289"
                                strokeDashoffset={289 - (displayedScore * 2.89)}
                                style={{ filter: `drop-shadow(0 0 4px ${theme.glow})` }}
                            />
                        </svg>
                    </div>
                </div>

                {/* Spacer for badge overlap */}
                <div className="h-12" />


                {/* DNA Verdict Badge - Unique per card */}
                {dnaVerdictBadge && (
                    <div
                        className={`mt-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-500 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.9)'
                        }}
                    >
                        {dnaVerdictBadge}
                    </div>
                )}

                {/* Time-of-Day Badge */}
                {dnaTimeBadge && (
                    <div
                        className={`mt-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wide transition-all duration-500 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{
                            background: timeAccent ? `${timeAccent}20` : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${timeAccent || 'rgba(255,255,255,0.1)'}40`,
                            color: timeAccent || 'rgba(255,255,255,0.7)'
                        }}
                    >
                        {dnaTimeBadge}
                    </div>
                )}

                {/* Streak Badge - Only shows for 3+ day streaks */}
                {dnaStreakBadge && (
                    <div
                        className={`mt-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide transition-all duration-500 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
                        style={{
                            background: streakTier === 'legendary' ? 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,140,0,0.15))' :
                                streakTier === 'dedicated' ? 'rgba(255,215,0,0.12)' :
                                    'rgba(255,107,53,0.12)',
                            border: '1px solid rgba(255,140,0,0.3)',
                            color: '#FFB347'
                        }}
                    >
                        {dnaStreakBadge}
                    </div>
                )}

                {/* Percentile Context Line */}
                <p className={`text-sm text-white/50 mt-3 transition-all duration-500 ${revealStage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                    {scores.overall >= 50
                        ? `Better than ${getPercentile(scores.overall)}% of fits today`
                        : `Worse than ${100 - getPercentile(scores.overall)}% of fits today`
                    }
                </p>
                {/* AI TIER BADGE - Shows for ALL users (eliminates dead space) */}
                <div className={`mt-3 transition-all duration-500 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    {/* Mode-Themed Badge - Shows mode emoji, name, and description */}
                    {(() => {
                        const m = scores?.mode || mode
                        const modeBadges = {
                            nice: { emoji: '😇', name: 'Nice Mode', desc: 'Supportive AI', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
                            roast: { emoji: '🔥', name: 'Roast Mode', desc: 'Brutally Honest', color: '#ff6b35', bg: 'rgba(255,107,53,0.12)' },
                            honest: { emoji: '📊', name: 'Honest Mode', desc: 'Real Talk', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
                            savage: { emoji: '💀', name: 'Savage Mode', desc: 'No Mercy', color: '#ff1493', bg: 'rgba(255,20,147,0.12)' },
                            rizz: { emoji: '😏', name: 'Rizz Mode', desc: 'Dating Coach', color: '#ff69b4', bg: 'rgba(255,105,180,0.12)' },
                            celeb: { emoji: '⭐', name: 'Celeb Mode', desc: 'Star Treatment', color: '#ffd700', bg: 'rgba(255,215,0,0.12)' },
                            aura: { emoji: '🔮', name: 'Aura Mode', desc: 'Energy Reading', color: '#9b59b6', bg: 'rgba(155,89,182,0.12)' },
                            chaos: { emoji: '🎪', name: 'Chaos Mode', desc: 'Unhinged AI', color: '#ff6b6b', bg: 'rgba(255,107,107,0.12)' },
                            y2k: { emoji: '💎', name: 'Y2K Mode', desc: "That's Hot", color: '#ff69b4', bg: 'rgba(255,105,180,0.12)' },
                            villain: { emoji: '🖤', name: 'Villain Mode', desc: 'Main Character', color: '#4c1d95', bg: 'rgba(76,29,149,0.12)' },
                            coquette: { emoji: '🎀', name: 'Coquette Mode', desc: 'So Dainty', color: '#ffb6c1', bg: 'rgba(255,182,193,0.12)' },
                            hypebeast: { emoji: '👟', name: 'Hypebeast Mode', desc: 'Certified Drip', color: '#f97316', bg: 'rgba(249,115,22,0.12)' }
                        }
                        const badge = modeBadges[m] || modeBadges.nice
                        return (
                            <div
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                                style={{
                                    background: badge.bg,
                                    border: `1px solid ${badge.color}40`,
                                    boxShadow: `0 0 15px ${badge.color}20`
                                }}
                            >
                                <span className="text-base">{badge.emoji}</span>
                                <span
                                    className="text-[10px] font-black uppercase tracking-widest"
                                    style={{ color: badge.color }}
                                >
                                    {badge.name}
                                </span>
                                <span
                                    className="text-[8px] font-bold uppercase"
                                    style={{ color: `${badge.color}99` }}
                                >
                                    {badge.desc}
                                </span>
                            </div>
                        )
                    })()}
                </div>

                {/* ===== AESTHETIC & CELEB MATCH BADGES ===== */}
                <div className={`flex flex-wrap items-center justify-center gap-2 mt-3 transition-all duration-500 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                    {/* Aesthetic Badge */}
                    {scores.aesthetic && (
                        <div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                            style={{
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.12)',
                            }}
                        >
                            <span className="text-sm">✨</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                                {scores.aesthetic}
                            </span>
                        </div>
                    )}

                    {/* Celeb Match Badge */}
                    {scores.celebMatch && (
                        <div
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                            style={{
                                background: 'linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(255,0,128,0.08) 100%)',
                                border: '1px solid rgba(255,107,53,0.2)',
                            }}
                        >
                            <span className="text-sm">🌟</span>
                            <span className="text-[10px] font-bold text-white/60">Vibes like</span>
                            <span className="text-[10px] font-black text-orange-400">
                                {scores.celebMatch}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== SIMPLIFIED VERDICT SECTION (Golden Result Card style) ===== */}
            <div className={`w-full max-w-sm px-4 mb-4 text-center transition-all duration-700 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

                {/* Verdict Headline - BIGGER, HEAVIER (matches share card 38px) */}
                <h2
                    className={`text-[38px] leading-tight mb-2 ${isLegendary ? 'legendary-text' : 'text-white'}`}
                    style={{ fontWeight: 800 }}
                >
                    {scores.verdict}
                </h2>

                {/* Vibe Tag Line (Aesthetic · Celeb Reference) */}
                <p className="text-sm text-white/55 italic mb-4">
                    {scores.aesthetic && scores.celebMatch
                        ? `${scores.aesthetic} · ${scores.celebMatch}`
                        : scores.aesthetic
                            ? `${scores.aesthetic} Aesthetic`
                            : scores.celebMatch
                                ? `Vibes like ${scores.celebMatch}`
                                : socialProof.msg}
                </p>

                {/* AI Tagline Quote */}
                <p
                    className="text-base font-medium mb-5"
                    style={{ color: modeColors.accent }}
                >
                    "{scores.tagline}"
                </p>

                {/* 3-Pill Micro Scores (inline like share card) */}
                <div className="flex justify-center gap-2 mb-4">
                    {/* Color */}
                    <div
                        className="flex-1 max-w-[120px] py-3 px-3 rounded-2xl"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)'
                        }}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">🎨</span>
                            <span className="text-base font-semibold text-white/60">Color</span>
                        </div>
                        <span
                            className="text-xl font-black"
                            style={{ color: modeColors.accent }}
                        >
                            {scores.colorEnergy || Math.round(scores.overall * 0.95)}
                        </span>
                    </div>

                    {/* Fit */}
                    <div
                        className="flex-1 max-w-[120px] py-3 px-3 rounded-2xl"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)'
                        }}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">👔</span>
                            <span className="text-base font-semibold text-white/60">Fit</span>
                        </div>
                        <span
                            className="text-xl font-black"
                            style={{ color: modeColors.accent }}
                        >
                            {scores.silhouette || Math.round(scores.overall * 0.9)}
                        </span>
                    </div>

                    {/* Style */}
                    <div
                        className="flex-1 max-w-[120px] py-3 px-3 rounded-2xl"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)'
                        }}
                    >
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-lg">✨</span>
                            <span className="text-base font-semibold text-white/60">Style</span>
                        </div>
                        <span
                            className="text-xl font-black"
                            style={{ color: modeColors.accent }}
                        >
                            {scores.intent || Math.round(scores.overall * 1.02)}
                        </span>
                    </div>
                </div>

                {/* Percentile line */}
                <p className="text-xs text-white/40">
                    {scores.overall >= 50
                        ? `Better than ${getPercentile(scores.overall)}% of fits today`
                        : `Keep styling — room to grow`}
                </p>
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
            )
            }

            {/* ===== UNIFIED PRO INSIGHTS SECTION ===== */}
            {
                isPro && (scores.proTip || scores.identityReflection || scores.socialPerception) && (
                    <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div
                            className="p-5 rounded-3xl border-2 backdrop-blur-xl relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(145deg, rgba(255,215,0,0.08) 0%, rgba(255,180,0,0.04) 50%, rgba(255,140,0,0.02) 100%)',
                                borderColor: 'rgba(255,215,0,0.35)',
                                boxShadow: '0 0 40px rgba(255,215,0,0.15), inset 0 1px 0 rgba(255,255,255,0.1)'
                            }}
                        >
                            {/* Premium glow effect */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-30"
                                style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)' }}
                            />

                            {/* Section Header */}
                            <div className="relative z-10 flex items-center justify-between mb-5">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">✨</span>
                                    <span className="text-sm font-black uppercase tracking-widest text-yellow-400">
                                        Pro Insights
                                    </span>
                                </div>
                                <div className="px-2 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30">
                                    <span className="text-[9px] font-bold text-yellow-400/80 uppercase">Premium</span>
                                </div>
                            </div>

                            <div className="relative z-10 space-y-4">
                                {/* Pro Tip */}
                                {scores.proTip && (
                                    <div className="p-3 rounded-xl bg-black/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-base">💡</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300">Style Upgrade</span>
                                        </div>
                                        <p className="text-sm text-white/90 leading-relaxed italic">"{scores.proTip}"</p>
                                    </div>
                                )}

                                {/* Identity Reflection */}
                                {scores.identityReflection && (
                                    <div className="p-3 rounded-xl bg-black/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-base">🪞</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300">Identity</span>
                                        </div>
                                        <p className="text-sm text-white/90 leading-relaxed">{scores.identityReflection}</p>
                                    </div>
                                )}

                                {/* Social Perception */}
                                {scores.socialPerception && (
                                    <div className="p-3 rounded-xl bg-black/20">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-base">👥</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300">Perception</span>
                                        </div>
                                        <p className="text-sm text-white/90 leading-relaxed">{scores.socialPerception}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }


            {/* ===== SAVAGE ROASTS - Pro Mode Card ===== */}
            {
                scores.savageLevel && (
                    <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Mode Context - Users know why they see this */}
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 text-center">😈 Savage Mode Active</p>
                        <div className="p-4 rounded-2xl border backdrop-blur-xl" style={{ background: 'rgba(255,68,68,0.08)', borderColor: 'rgba(255,68,68,0.25)' }}>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-black text-red-500 uppercase tracking-widest">🔥 Brutality Level</span>
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
                )
            }

            {/* ===== RIZZ MODE CARD - Pro Mode ===== */}
            {
                scores.mode === 'rizz' && scores.rizzType && (
                    <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Mode Context */}
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 text-center">😏 Rizz Mode Active</p>
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
                )
            }

            {/* ===== CELEBRITY JUDGE CARD - Pro Mode ===== */}
            {
                scores.mode === 'celeb' && scores.celebrityJudge && (
                    <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Mode Context */}
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 text-center">🎭 Celebrity Mode Active</p>
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
                )
            }

            {/* ===== AURA / VIBE CHECK CARD - Pro Mode ===== */}
            {
                scores.mode === 'aura' && scores.auraColor && (
                    <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Mode Context */}
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 text-center">🔮 Aura Mode Active</p>
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
                )
            }

            {/* ===== CHAOS MODE CARD - Pro Mode ===== */}
            {
                scores.mode === 'chaos' && scores.chaosLevel && (
                    <div className={`w-full max-w-sm px-4 mb-4 transition-all duration-700 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        {/* Mode Context */}
                        <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2 text-center">🎪 Chaos Mode Active</p>
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
                )
            }

            {/* ===== SHARE SECTION ===== */}
            <div className={`w-full max-w-sm px-4 py-4 transition-all duration-700 ${revealStage >= 6 ? 'opacity-100' : 'opacity-0'}`}>
                {/* Score-aware copy */}
                <p className="text-center text-sm text-white/40 mb-2">
                    {scores.overall >= 75
                        ? "Your friends will be honest. Probably."
                        : scores.overall >= 50
                            ? "See what your friends think"
                            : "Get a second opinion"}
                </p>
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <span className="text-[10px] uppercase tracking-widest text-white/30">Share</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
            </div>

            {/* ===== CTAs - Simplified ===== */}
            <div className={`w-full max-w-sm px-4 transition-all duration-700 ${revealStage >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                {/* Battle Results CTA - Show when user just responded to a battle */}
                {pendingBattleId && onSeeBattleResults && (
                    <button
                        onClick={() => {
                            playSound('click')
                            vibrate(50)
                            onSeeBattleResults()
                        }}
                        className="w-full py-5 mb-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97]"
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
                            boxShadow: '0 8px 32px rgba(139,92,246,0.5)',
                            color: '#fff',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                    >
                        <span className="text-2xl">⚔️</span>
                        <span>See Battle Results!</span>
                        <span className="text-2xl">🏆</span>
                    </button>
                )}

                {/* Two share options in a row */}
                <div className="flex gap-3 mb-3">
                    {/* Challenge - Competitive share */}
                    <button
                        onClick={() => {
                            playSound('click')
                            vibrate(30)
                            onGenerateShareCard('challenge')
                        }}
                        aria-label="Challenge a friend to beat your score"
                        className="flex-1 py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.97]"
                        style={{
                            background: `linear-gradient(135deg, ${modeColors.accent} 0%, ${modeColors.end} 100%)`,
                            boxShadow: `0 4px 20px ${modeColors.glow}`,
                            color: '#fff'
                        }}
                    >
                        <span className="flex items-center gap-2 text-lg font-black">
                            <span>🔥</span> Challenge
                        </span>
                        <span className="text-[10px] opacity-80">They scan, you compare</span>
                    </button>

                    {/* Share - Just show off */}
                    <button
                        onClick={onGenerateShareCard}
                        aria-label="Share your outfit rating"
                        className="flex-1 py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-[0.97]"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: 'rgba(255,255,255,0.9)'
                        }}
                    >
                        <span className="flex items-center gap-2 text-lg font-black">
                            <span>📤</span> Share
                        </span>
                        <span className="text-[10px] opacity-60">
                            {scores.overall >= 75 ? "Flex on them" : scores.overall >= 50 ? "Show your fit" : "Get feedback"}
                        </span>
                    </button>
                </div>

                {/* Try Again + Back to Runway (side-by-side when in Fashion Show) */}
                <div className={`flex gap-2 ${fashionShowId && onReturnToRunway ? 'flex-row' : 'flex-col'}`}>
                    <button
                        onClick={onReset}
                        className={`${fashionShowId && onReturnToRunway ? 'flex-1' : 'w-full'} py-3 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.97] transition-all`}
                    >
                        🔄 {scores.overall >= 85 ? "Scan Again" : scores.overall < 50 ? "Try Again" : "New Scan"}
                    </button>

                    {fashionShowId && onReturnToRunway && (
                        <button
                            onClick={() => {
                                playSound('click')
                                vibrate(20)
                                onReturnToRunway()
                            }}
                            className="flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                            style={{
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, rgba(168,85,247,0.15) 100%)',
                                border: '1px solid rgba(139,92,246,0.35)',
                            }}
                        >
                            <span>🎭</span>
                            <span className="text-purple-300">Back to Show</span>
                        </button>
                    )}
                </div>

                {/* Scans remaining or Inline Paywall */}
                {!isPro && (
                    scansRemaining > 0 ? (
                        <div className="mt-4 space-y-3">
                            {/* Scans counter */}
                            <p className="text-center text-[10px] uppercase font-bold tracking-widest text-white/25">
                                ⚡ {scansRemaining} free scan{scansRemaining !== 1 ? 's' : ''} left today
                            </p>

                            {/* Subtle scan pack upsell - appears after user has used some scans */}
                            {totalScans >= 2 && (
                                <div
                                    className="p-3 rounded-xl border cursor-pointer transition-all hover:brightness-110 active:scale-[0.98]"
                                    onClick={onShowPaywall}
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(0,255,136,0.08) 100%)',
                                        borderColor: 'rgba(0,212,255,0.2)'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">💎</span>
                                            <div>
                                                <p className="text-xs font-bold text-white/80">Want more scans?</p>
                                                <p className="text-[10px] text-white/40">3 for just $0.99 • Never expire</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-cyan-400">→</span>
                                    </div>
                                </div>
                            )}
                        </div>
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
                            <div className="text-center mb-3">
                                <span className="text-3xl">🔥</span>
                            </div>
                            <h3 className="text-base font-black text-white text-center mb-1">
                                You're on a roll!
                            </h3>
                            <p className="text-xs text-white/50 text-center mb-3">
                                Free scans refresh tomorrow
                            </p>
                            <div
                                className="w-full py-3 rounded-xl font-bold text-sm text-center transition-all group-hover:brightness-110"
                                style={{
                                    background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                    color: '#000',
                                    boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
                                }}
                            >
                                Go Unlimited →
                            </div>
                        </div>
                    )
                )}


            </div>

            {/* ===== LEGENDARY CONFETTI SYSTEM ===== */}
            {/* Tier-based confetti with scoreKey to prevent re-trigger bugs */}
            {
                animationComplete && revealStage >= 6 && scoreTier !== 'low' && scoreTier !== 'mid' && (
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
                )
            }

            {/* Extra bottom padding for sticky CTA visibility */}
            <div className="h-4" />

            <Footer className="opacity-30 pt-6 pb-4" />
        </div >
    )
}
