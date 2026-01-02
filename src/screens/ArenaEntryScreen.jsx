import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
    getStreakData,
    updateDailyStreak,
    getNextStreakReward,
    getWinStreakData,
    getAllTimeStats,
    getWinRate,
    getCurrentTier,
    getSeasonTimeRemaining,
    getDailyArenaRecord,
    getUnlockedMilestones,
    getNextMilestone,
    STREAK_REWARDS,
    SEASON_TIERS
} from '../utils/arenaStorage'
import DisplayNameModal from '../components/modals/DisplayNameModal'
import { hasDisplayName, getDisplayName, setDisplayName } from '../utils/displayNameStorage'
import { getWardrobe } from './WardrobeSetup'
import { getKings, THRONES } from './ThroneRoom'

// ============================================
// ARENA MODE OF THE DAY
// Rotates daily for shared global experience
// ============================================
const ARENA_DAILY_MODES = [
    { mode: 'aura', emoji: '🔮', name: 'Aura', tagline: 'Mystical Sunday', color: '#9b59b6' },
    { mode: 'roast', emoji: '🔥', name: 'Roast', tagline: 'Spicy Monday', color: '#ff6b35' },
    { mode: 'nice', emoji: '😇', name: 'Nice', tagline: 'Wholesome Tuesday', color: '#00ff88' },
    { mode: 'savage', emoji: '💀', name: 'Savage', tagline: 'Wild Wednesday', color: '#8b00ff' },
    { mode: 'rizz', emoji: '😏', name: 'Rizz', tagline: 'Flirty Thursday', color: '#ff1493' },
    { mode: 'chaos', emoji: '🎪', name: 'Chaos', tagline: 'Chaotic Friday', color: '#ee5a24' },
    { mode: 'celeb', emoji: '✨', name: 'Celeb', tagline: 'Star Saturday', color: '#ffd700' }
]

// Daily battle limit
const ARENA_DAILY_LIMIT = 10

export const getTodayArenaMode = () => {
    const dayIndex = new Date().getDay() // 0=Sunday, 1=Monday, etc.
    return ARENA_DAILY_MODES[dayIndex]
}

// Re-export for external use
export { getDailyArenaRecord } from '../utils/arenaStorage'
export { recordArenaResult } from '../utils/arenaStorage'

// ============================================
// ANIMATED BACKGROUND - Premium particles
// ============================================
const AnimatedBackground = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 30 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 4,
            delay: Math.random() * 15,
            duration: 20 + Math.random() * 30,
            opacity: 0.1 + Math.random() * 0.3,
            type: i % 5 === 0 ? 'star' : 'particle'
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient orbs */}
            <div
                className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
                style={{
                    background: `radial-gradient(circle, ${color}, transparent)`,
                    top: '-10%',
                    right: '-20%',
                    animation: 'orb-float 8s ease-in-out infinite'
                }}
            />
            <div
                className="absolute w-64 h-64 rounded-full blur-3xl opacity-15"
                style={{
                    background: `radial-gradient(circle, #00ff88, transparent)`,
                    bottom: '-5%',
                    left: '-10%',
                    animation: 'orb-float 12s ease-in-out infinite reverse'
                }}
            />
            {/* Particles */}
            {particles.map(p => (
                <div
                    key={p.id}
                    className={`absolute ${p.type === 'star' ? 'animate-pulse' : ''}`}
                    style={{
                        left: `${p.left}%`,
                        bottom: '-10px',
                        width: p.size,
                        height: p.size,
                        borderRadius: p.type === 'star' ? '2px' : '50%',
                        background: p.id % 3 === 0 ? color : p.id % 2 === 0 ? '#00ff88' : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 6}px ${color}`,
                        animation: `arena-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        transform: p.type === 'star' ? 'rotate(45deg)' : 'none'
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// STREAK FIRE ANIMATION
// ============================================
const StreakFire = ({ streak, color }) => {
    if (streak < 1) return null
    const intensity = Math.min(streak, 7)

    return (
        <div className="relative">
            {Array.from({ length: intensity }).map((_, i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        left: `${50 + (i - intensity / 2) * 8}%`,
                        bottom: 0,
                        width: 8 + i * 2,
                        height: 20 + i * 5,
                        background: `linear-gradient(to top, ${color}, #ff6b35, #ffd700)`,
                        borderRadius: '50% 50% 20% 20%',
                        filter: 'blur(2px)',
                        animation: `fire-dance ${0.3 + i * 0.1}s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.05}s`,
                        opacity: 0.7
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// TIER BADGE COMPONENT
// ============================================
const TierBadge = ({ tier, progress, pointsToNext, compact = false }) => {
    return (
        <div className={`flex items-center gap-2 ${compact ? 'scale-90' : ''}`}>
            <div
                className="relative"
                style={{
                    filter: `drop-shadow(0 0 10px ${tier.color})`
                }}
            >
                <span className={`${compact ? 'text-2xl' : 'text-3xl'}`}>{tier.emoji}</span>
                {/* Tier glow ring */}
                <div
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ background: tier.color }}
                />
            </div>
            <div className="text-left">
                <div className="flex items-center gap-2">
                    <span className="font-black text-white" style={{ color: tier.color }}>
                        {tier.name}
                    </span>
                </div>
                {pointsToNext > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${progress}%`,
                                    background: `linear-gradient(90deg, ${tier.color}, #00ff88)`
                                }}
                            />
                        </div>
                        <span className="text-[10px] text-white/40">{pointsToNext} to next</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================
// STATS DASHBOARD CARD
// ============================================
const StatsDashboard = ({ stats, winRate, winStreak, modeColor }) => {
    return (
        <div
            className="w-full p-4 rounded-2xl relative overflow-hidden"
            style={{
                background: 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)'
            }}
        >
            {/* Glass shine effect */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                }}
            />

            <div className="flex items-center justify-between mb-3">
                <span className="text-white/50 text-xs uppercase tracking-widest">Your Stats</span>
                {winStreak.currentWinStreak > 0 && (
                    <div
                        className="flex items-center gap-1 px-2 py-1 rounded-full"
                        style={{
                            background: 'linear-gradient(135deg, #ff6b35, #ffd700)',
                            animation: 'pulse 2s ease-in-out infinite'
                        }}
                    >
                        <span className="text-xs">🔥</span>
                        <span className="text-xs font-black text-white">{winStreak.currentWinStreak}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-4 gap-3">
                <div className="text-center">
                    <div className="text-2xl font-black text-white">{stats.totalWins}</div>
                    <div className="text-[10px] text-white/40 uppercase">Wins</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black" style={{ color: modeColor }}>{winRate}%</div>
                    <div className="text-[10px] text-white/40 uppercase">Win Rate</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-amber-400">{winStreak.bestWinStreak}</div>
                    <div className="text-[10px] text-white/40 uppercase">Best Streak</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-black text-purple-400">{stats.totalBattles}</div>
                    <div className="text-[10px] text-white/40 uppercase">Battles</div>
                </div>
            </div>
        </div>
    )
}

// ============================================
// DAILY STREAK CARD
// ============================================
const StreakCard = ({ streakData, nextReward, modeColor, onClaim }) => {
    const streak = streakData.currentStreak

    return (
        <div
            className="w-full p-4 rounded-2xl relative overflow-hidden"
            style={{
                background: streak > 0
                    ? `linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,215,0,0.1))`
                    : 'rgba(255,255,255,0.03)',
                backdropFilter: 'blur(20px)',
                border: streak > 0
                    ? '1px solid rgba(255,107,53,0.3)'
                    : '1px solid rgba(255,255,255,0.08)'
            }}
        >
            {/* Fire effect for active streaks */}
            {streak >= 3 && (
                <div className="absolute bottom-0 left-0 right-0 h-8 overflow-hidden opacity-30">
                    <StreakFire streak={streak} color="#ff6b35" />
                </div>
            )}

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <span className="text-4xl" style={{ filter: streak > 0 ? 'drop-shadow(0 0 10px #ff6b35)' : 'none' }}>
                            {streak > 0 ? '🔥' : '❄️'}
                        </span>
                        {streak > 0 && (
                            <div
                                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                                style={{ background: 'linear-gradient(135deg, #ff6b35, #ffd700)' }}
                            >
                                {streak}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-white font-bold">
                            {streak > 0 ? `${streak} Day Streak!` : 'Start Your Streak'}
                        </div>
                        <div className="text-white/50 text-xs">
                            {nextReward?.claimable
                                ? `Claim: ${nextReward.label}`
                                : nextReward?.daysUntil
                                    ? `${nextReward.daysUntil} days to ${nextReward.label}`
                                    : 'Play daily for rewards'}
                        </div>
                    </div>
                </div>

                {nextReward?.claimable && (
                    <button
                        onClick={onClaim}
                        className="px-4 py-2 rounded-xl font-bold text-sm text-black transition-all active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #ffd700, #ff6b35)',
                            boxShadow: '0 0 20px rgba(255,215,0,0.5)'
                        }}
                    >
                        Claim!
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================
// SEASON COUNTDOWN
// ============================================
const SeasonCountdown = ({ timeRemaining, tier }) => {
    return (
        <div className="flex items-center gap-2 text-xs text-white/40">
            <span>⏱️</span>
            <span>Season ends in {timeRemaining.days}d {timeRemaining.hours}h</span>
        </div>
    )
}

// ============================================
// SCAN LINES ANIMATION
// ============================================
const ScanLines = ({ color }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
        <div
            className="absolute inset-0"
            style={{
                background: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    ${color}10 2px,
                    ${color}10 4px
                )`,
                animation: 'scan-move 2s linear infinite'
            }}
        />
        <div
            className="absolute left-0 right-0 h-20"
            style={{
                background: `linear-gradient(180deg, ${color}40, transparent)`,
                animation: 'scan-line 1.5s ease-in-out infinite'
            }}
        />
    </div>
)

// ============================================
// ERROR MODAL
// ============================================
const ErrorModal = ({ message, onRetry, onCancel, modeColor }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
        <div
            className="w-full max-w-sm p-6 rounded-3xl text-center"
            style={{
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            <div className="text-6xl mb-4">😅</div>
            <h2 className="text-xl font-bold text-white mb-2">Oops!</h2>
            <p className="text-white/60 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
                <button
                    onClick={onRetry}
                    className="w-full py-4 rounded-xl font-bold text-lg text-black transition-all active:scale-[0.97]"
                    style={{ background: modeColor }}
                >
                    Try Again
                </button>
                <button
                    onClick={onCancel}
                    className="w-full py-3 rounded-xl font-medium text-white/60 transition-all active:scale-[0.97]"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                    Go Back
                </button>
            </div>
        </div>
    </div>
)

// ============================================
// PROGRESS STEPS INDICATOR
// ============================================
const ProgressSteps = ({ currentStep, modeColor }) => {
    const steps = [
        { icon: '📸', label: 'Photo' },
        { icon: '⚡', label: 'Analyze' },
        { icon: '🔍', label: 'Queue' },
        { icon: '⚔️', label: 'Battle' }
    ]

    return (
        <div className="flex items-center justify-center gap-1">
            {steps.map((step, i) => (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-500 ${i < currentStep ? 'scale-95' : i === currentStep ? 'scale-105' : 'scale-95 opacity-40'
                                }`}
                            style={{
                                background: i <= currentStep
                                    ? `linear-gradient(135deg, ${modeColor}, ${modeColor}80)`
                                    : 'rgba(255,255,255,0.1)',
                                boxShadow: i === currentStep ? `0 0 15px ${modeColor}50` : 'none'
                            }}
                        >
                            {i < currentStep ? '✓' : step.icon}
                        </div>
                        <span className={`text-[9px] mt-0.5 transition-all ${i <= currentStep ? 'text-white/80' : 'text-white/30'
                            }`}>
                            {step.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div
                            className="w-6 h-0.5 rounded-full transition-all duration-500 -mt-3"
                            style={{
                                background: i < currentStep ? modeColor : 'rgba(255,255,255,0.15)'
                            }}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}

// ============================================
// ARENA MODE TABS - Switch between game modes
// ============================================
const ArenaModeTab = ({ activeMode, onModeChange, modeColor, wardrobeCount = 0, crownCount = 0 }) => {
    const modes = [
        { id: 'quick', emoji: '⚡', label: 'Quick Battle', sublabel: '1v1' },
        { id: 'wardrobe', emoji: '👕', label: 'Wardrobe Wars', sublabel: wardrobeCount > 0 ? `${wardrobeCount}/5 fits` : 'Best of 5', isNew: wardrobeCount === 0 },
        { id: 'kings', emoji: '👑', label: 'King of Hill', sublabel: crownCount > 0 ? `${crownCount} crown${crownCount > 1 ? 's' : ''}` : '12 Thrones', isNew: crownCount === 0 }
    ]

    return (
        <div className="w-full max-w-md mb-4">
            <div
                className="flex rounded-2xl p-1 gap-1"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                {modes.map(mode => (
                    <button
                        key={mode.id}
                        onClick={() => onModeChange(mode.id)}
                        className="flex-1 flex flex-col items-center py-2.5 px-2 rounded-xl transition-all relative"
                        style={{
                            background: activeMode === mode.id
                                ? `linear-gradient(135deg, ${modeColor}30, ${modeColor}10)`
                                : 'transparent',
                            border: activeMode === mode.id
                                ? `1px solid ${modeColor}50`
                                : '1px solid transparent'
                        }}
                    >
                        {mode.isNew && (
                            <span
                                className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-black"
                                style={{ background: '#00ff88' }}
                            >
                                NEW
                            </span>
                        )}
                        {/* Crown indicator for Kings */}
                        {mode.id === 'kings' && crownCount > 0 && (
                            <span
                                className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold text-black"
                                style={{ background: '#ffd700' }}
                            >
                                👑 {crownCount}
                            </span>
                        )}
                        <span className="text-lg mb-0.5">{mode.emoji}</span>
                        <span className={`text-[10px] font-bold ${activeMode === mode.id ? 'text-white' : 'text-white/50'}`}>
                            {mode.label}
                        </span>
                        <span className="text-[8px] text-white/30">{mode.sublabel}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

// ============================================
// MAIN ARENA ENTRY SCREEN
// ============================================
export default function ArenaEntryScreen({
    userId,
    onAnalysisComplete,
    onBack,
    onShowLeaderboard,
    onStartWardrobe,
    onStartKings,
    playSound,
    vibrate
}) {
    const [screenState, setScreenState] = useState('entry')
    const [onlineCount, setOnlineCount] = useState(null)
    const [battlesToday, setBattlesToday] = useState(0)
    const [photoData, setPhotoData] = useState(null)
    const [analysisProgress, setAnalysisProgress] = useState(0)
    const [error, setError] = useState(null)
    const [analysisTip, setAnalysisTip] = useState(0)
    const [showStatsExpanded, setShowStatsExpanded] = useState(false)
    const [showDisplayNameModal, setShowDisplayNameModal] = useState(false)
    const [displayName, setDisplayNameState] = useState(() => getDisplayName())
    const [arenaMode, setArenaMode] = useState('quick') // 'quick' | 'wardrobe' | 'kings'

    const todayMode = getTodayArenaMode()
    const fileInputRef = useRef(null)
    const abortControllerRef = useRef(null)

    // Fetch all progression data
    const streakData = getStreakData()
    const nextStreakReward = getNextStreakReward()
    const winStreakData = getWinStreakData()
    const allTimeStats = getAllTimeStats()
    const winRate = getWinRate()
    const tierData = getCurrentTier()
    const seasonTimeRemaining = getSeasonTimeRemaining()
    const dailyRecord = getDailyArenaRecord()
    const nextMilestone = getNextMilestone()

    // Get wardrobe and crown counts for mode tabs
    const wardrobeCount = useMemo(() => getWardrobe().outfits?.length || 0, [])
    const crownCount = useMemo(() => {
        const kings = getKings()
        const myName = getDisplayName()
        return Object.values(kings).filter(k => k.displayName === myName).length
    }, [])

    const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')

    const ANALYSIS_TIPS = [
        "Scanning your fit...",
        "Calculating drip levels...",
        "Measuring aura intensity...",
        "Consulting the fashion gods...",
        "Finding your opponent..."
    ]

    // Update daily streak on entry
    useEffect(() => {
        updateDailyStreak()
    }, [])

    // Rotate tips during analysis
    useEffect(() => {
        if (screenState !== 'analyzing') return
        const interval = setInterval(() => {
            setAnalysisTip(prev => (prev + 1) % ANALYSIS_TIPS.length)
        }, 2000)
        return () => clearInterval(interval)
    }, [screenState])

    // Fetch arena stats (online + battles today)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/arena/stats`)
                if (res.ok) {
                    const data = await res.json()
                    setOnlineCount(data.online || 0)
                    setBattlesToday(data.battlesToday || 0)
                }
            } catch (err) {
                console.log('[Arena] Stats fetch failed:', err)
            }
        }
        fetchStats()
        const interval = setInterval(fetchStats, 10000)
        return () => clearInterval(interval)
    }, [API_BASE])

    // Simulate progress during analysis
    useEffect(() => {
        if (screenState !== 'analyzing') return
        const interval = setInterval(() => {
            setAnalysisProgress(prev => {
                if (prev >= 90) return prev
                return prev + Math.random() * 15
            })
        }, 300)
        return () => clearInterval(interval)
    }, [screenState])

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        playSound?.('click')
        vibrate?.([50, 30, 50])

        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result
            setPhotoData(dataUrl)
            setScreenState('analyzing')
            setAnalysisProgress(0)
            analyzePhoto(dataUrl)
        }
        reader.onerror = () => {
            setError("Couldn't read photo. Please try again!")
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    const analyzePhoto = async (imageData) => {
        abortControllerRef.current = new AbortController()

        try {
            playSound?.('whoosh')

            const response = await fetch(`${API_BASE}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    image: imageData,
                    mode: todayMode.mode,
                    userId: userId,
                    arenaMode: true  // Arena is free - bypass scan limits
                }),
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) throw new Error('Analysis failed')

            const result = await response.json()
            const score = result.scores?.overall || result.score || 75

            setAnalysisProgress(100)
            playSound?.('celebrate')
            vibrate?.([100, 50, 100])

            setTimeout(() => {
                onAnalysisComplete(score, imageData, todayMode.mode)
            }, 500)

        } catch (err) {
            if (err.name === 'AbortError') return
            console.error('[Arena] Analysis failed:', err)
            setError("Couldn't analyze your photo. Want to try again?")
            vibrate?.([100, 100, 100])
        }
    }

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }
        playSound?.('click')
        vibrate?.(20)
        setScreenState('entry')
        setPhotoData(null)
        setError(null)
    }

    const handleRetry = () => {
        setError(null)
        setScreenState('entry')
        setPhotoData(null)
        setTimeout(() => fileInputRef.current?.click(), 100)
    }

    const handleEnterArena = () => {
        playSound?.('click')
        vibrate?.([30, 20, 30])

        // Check daily battle limit (10 per day)
        if (totalBattlesToday >= ARENA_DAILY_LIMIT) {
            setError(`You've reached today's limit of ${ARENA_DAILY_LIMIT} battles. Come back tomorrow!`)
            return
        }

        // Check if display name is set before entering
        if (!hasDisplayName()) {
            setShowDisplayNameModal(true)
            return
        }

        fileInputRef.current?.click()
    }

    // Handle display name submission from modal
    const handleDisplayNameSubmit = (name) => {
        setDisplayName(name)
        setDisplayNameState(name)
        setShowDisplayNameModal(false)
        // Proceed to arena after setting name
        playSound?.('success')
        vibrate?.([50, 30, 50])
        fileInputRef.current?.click()
    }

    const handleClaimReward = () => {
        // TODO: Implement reward claiming logic
        playSound?.('celebrate')
        vibrate?.([100, 50, 100, 50, 100])
    }

    const currentStep = screenState === 'entry' ? 0 : 1
    const totalBattlesToday = dailyRecord.wins + dailyRecord.losses + dailyRecord.ties
    const hasPlayedBefore = allTimeStats.totalBattles > 0

    // ============================================
    // ANALYZING SCREEN
    // ============================================
    if (screenState === 'analyzing') {
        return (
            <div
                className="fixed inset-0 flex flex-col items-center justify-center p-6 overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, #0a0a1a 0%, ${todayMode.color}20 50%, #0a0a1a 100%)`
                }}
            >
                <AnimatedBackground color={todayMode.color} />

                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCancel()
                    }}
                    className="absolute top-4 left-4 w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        zIndex: 9999,
                        touchAction: 'manipulation'
                    }}
                >
                    <span className="text-white text-xl font-bold">✕</span>
                </button>

                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                    <ProgressSteps currentStep={currentStep} modeColor={todayMode.color} />
                </div>

                <div className="flex flex-col items-center text-center z-10 max-w-md w-full">
                    <div className="relative mb-8">
                        <div
                            className="w-48 h-48 rounded-2xl overflow-hidden relative"
                            style={{
                                boxShadow: `0 0 60px ${todayMode.color}40, 0 20px 40px rgba(0,0,0,0.5)`
                            }}
                        >
                            {photoData && (
                                <img
                                    src={photoData}
                                    alt="Your fit"
                                    className="w-full h-full object-cover"
                                />
                            )}
                            <ScanLines color={todayMode.color} />
                        </div>
                        <div
                            className="absolute -inset-4 rounded-3xl animate-ping opacity-20"
                            style={{ border: `2px solid ${todayMode.color}` }}
                        />
                    </div>

                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-full mb-4"
                        style={{
                            background: `${todayMode.color}20`,
                            border: `1px solid ${todayMode.color}40`
                        }}
                    >
                        <span className="text-xl">{todayMode.emoji}</span>
                        <span style={{ color: todayMode.color }} className="font-bold">
                            {todayMode.name} Mode
                        </span>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-2">
                        Analyzing Your Fit
                    </h2>
                    <p className="text-white/50 text-sm mb-8 h-5 transition-all">
                        {ANALYSIS_TIPS[analysisTip]}
                    </p>

                    <div className="w-full max-w-xs mb-4">
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(100, analysisProgress)}%`,
                                    background: `linear-gradient(90deg, ${todayMode.color}, #00ff88)`
                                }}
                            />
                        </div>
                        <p className="text-white/40 text-xs mt-2 text-center">
                            {Math.round(Math.min(100, analysisProgress))}%
                        </p>
                    </div>

                    <p className="text-white/30 text-xs">
                        Tap ✕ to cancel
                    </p>
                </div>

                {error && (
                    <ErrorModal
                        message={error}
                        onRetry={handleRetry}
                        onCancel={() => {
                            setError(null)
                            onBack()
                        }}
                        modeColor={todayMode.color}
                    />
                )}

                <style>{`
                    @keyframes arena-float {
                        0%, 100% { transform: translateY(0); opacity: 0; }
                        10% { opacity: 0.3; }
                        90% { opacity: 0.1; }
                        100% { transform: translateY(-100vh); }
                    }
                    @keyframes scan-move {
                        0% { transform: translateY(0); }
                        100% { transform: translateY(4px); }
                    }
                    @keyframes scan-line {
                        0%, 100% { top: -20%; opacity: 0; }
                        50% { opacity: 1; }
                        100% { top: 100%; opacity: 0; }
                    }
                    @keyframes orb-float {
                        0%, 100% { transform: translate(0, 0) scale(1); }
                        50% { transform: translate(-20px, 20px) scale(1.1); }
                    }
                `}</style>
            </div>
        )
    }

    // ============================================
    // ENTRY SCREEN - LEGENDARY VERSION
    // ============================================
    return (
        <div
            className="fixed inset-0 flex flex-col overflow-y-auto overflow-x-hidden"
            style={{
                background: `linear-gradient(180deg, #0a0a1a 0%, ${todayMode.color}08 50%, #0a0a1a 100%)`
            }}
        >
            <AnimatedBackground color={todayMode.color} />

            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="sr-only"
                aria-hidden="true"
            />

            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between p-4 pt-6">
                <button
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        playSound?.('click')
                        vibrate?.(10)
                        onBack?.()
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-white text-lg">←</span>
                </button>

                {/* Live Stats */}
                <div className="flex flex-col items-end gap-2">
                    {/* Online Count */}
                    {onlineCount !== null && (
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{
                                background: onlineCount <= 1 ? 'rgba(255,170,0,0.1)' : 'rgba(0,255,136,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${onlineCount <= 1 ? 'rgba(255,170,0,0.2)' : 'rgba(0,255,136,0.2)'}`
                            }}
                        >
                            <span className={`w-2 h-2 rounded-full ${onlineCount <= 1 ? 'bg-amber-400' : 'bg-green-400'} animate-pulse`} />
                            <span className={`${onlineCount <= 1 ? 'text-amber-400' : 'text-green-400'} text-xs font-bold`}>
                                {onlineCount <= 1 ? '👋 Be first!' : `${onlineCount} live`}
                            </span>
                        </div>
                    )}

                    {/* Battles Today - FOMO badge */}
                    {battlesToday > 0 && (
                        <div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                            style={{
                                background: 'rgba(255,107,53,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,107,53,0.2)'
                            }}
                        >
                            <span className="text-xs">🔥</span>
                            <span className="text-orange-400 text-xs font-bold">{battlesToday} today</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center px-5 pb-8 z-10">
                {/* Hero Section */}
                <div className="text-center mb-6">
                    <div className="relative inline-block mb-4">
                        <span
                            className="text-7xl"
                            style={{
                                filter: `drop-shadow(0 0 40px ${todayMode.color})`,
                                animation: 'globe-pulse 3s ease-in-out infinite'
                            }}
                        >
                            🌍
                        </span>
                        {/* Orbiting rings */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                border: `1px solid ${todayMode.color}30`,
                                transform: 'scale(1.8)',
                                animation: 'orbit 10s linear infinite'
                            }}
                        />
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                border: `1px dashed ${todayMode.color}20`,
                                transform: 'scale(2.2)',
                                animation: 'orbit 15s linear infinite reverse'
                            }}
                        />
                    </div>

                    <h1
                        className="text-4xl font-black text-white mb-1"
                        style={{ textShadow: `0 0 40px ${todayMode.color}60` }}
                    >
                        Global Arena
                    </h1>
                    <p className="text-white/50 text-base">Battle anyone in the world</p>

                    {/* Live Stats Badges */}
                    <div className="flex items-center justify-center gap-4 mt-3">
                        {onlineCount && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-green-400 text-xs font-bold">{onlineCount.toLocaleString()} online</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                            style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)' }}>
                            <span className="text-yellow-400 text-xs font-bold">⚔️ {Math.floor(Math.random() * 50) + 150} live battles</span>
                        </div>
                    </div>
                </div>

                {/* Arena Mode Tabs */}
                <ArenaModeTab
                    activeMode={arenaMode}
                    onModeChange={(mode) => {
                        playSound?.('click')
                        vibrate?.(15)
                        setArenaMode(mode)
                    }}
                    modeColor={todayMode.color}
                    wardrobeCount={wardrobeCount}
                    crownCount={crownCount}
                />

                {/* Wardrobe Wars */}
                <div className={`w-full max-w-md p-8 rounded-2xl text-center mb-4 ${arenaMode !== 'wardrobe' ? 'hidden' : ''}`}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                    <span className="text-6xl mb-4 block">👕</span>
                    <h3 className="text-2xl font-black text-white mb-2">Wardrobe Wars</h3>
                    <p className="text-white/50 mb-4">Build your 5-outfit wardrobe.<br />Best of 5 rounds. First to 3 wins!</p>
                    <button
                        onClick={() => {
                            playSound?.('click')
                            vibrate?.([50, 30, 50])
                            onStartWardrobe?.()
                        }}
                        className="px-6 py-3 rounded-2xl font-bold text-black transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #9b59b6, #00ff88)' }}
                    >
                        🏗️ Build Your Wardrobe
                    </button>
                </div>

                {/* King of the Hill */}
                <div className={`w-full max-w-md p-8 rounded-2xl text-center mb-4 ${arenaMode !== 'kings' ? 'hidden' : ''}`}
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                    <span className="text-6xl mb-4 block">👑</span>
                    <h3 className="text-2xl font-black text-white mb-2">King of the Hill</h3>
                    <p className="text-white/50 mb-4">12 thrones. 12 modes.<br />Dethrone the King. Defend your crown!</p>
                    <div className="grid grid-cols-6 gap-2 mb-4 mx-auto w-fit">
                        {['😐', '😇', '🔥', '💀', '😏', '🎀', '🔮', '📱', '📚', '🌊', '🎪', '✨'].map((e, i) => (
                            <div key={i} className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                style={{ background: 'rgba(255,255,255,0.05)' }}>
                                {e}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => {
                            playSound?.('click')
                            vibrate?.([50, 30, 50])
                            onStartKings?.()
                        }}
                        className="px-6 py-3 rounded-2xl font-bold text-black transition-all active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #ffd700, #ffa500)' }}
                    >
                        👑 Enter Throne Room
                    </button>
                </div>

                {/* Quick Battle Content - Season Tier + Countdown */}
                <div className={arenaMode !== 'quick' ? 'hidden' : 'contents'}>
                    <div
                        className="w-full max-w-md p-4 rounded-2xl mb-4 relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${tierData.tier.color}15, transparent)`,
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${tierData.tier.color}30`
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <TierBadge
                                tier={tierData.tier}
                                progress={tierData.progress}
                                pointsToNext={tierData.pointsToNext}
                            />
                            <div className="flex items-center gap-2">
                                <SeasonCountdown timeRemaining={seasonTimeRemaining} tier={tierData.tier} />
                                {/* Leaderboard Button */}
                                <button
                                    onClick={() => {
                                        playSound?.('click')
                                        vibrate?.(10)
                                        onShowLeaderboard?.()
                                    }}
                                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                                    style={{
                                        background: `${tierData.tier.color}20`,
                                        border: `1px solid ${tierData.tier.color}40`
                                    }}
                                >
                                    <span className="text-lg">🏆</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Today's Mode Card */}
                    <div
                        className="w-full max-w-md p-5 rounded-2xl mb-4 relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, ${todayMode.color}20, ${todayMode.color}05)`,
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${todayMode.color}40`
                        }}
                    >
                        <div
                            className="absolute inset-0"
                            style={{
                                background: `linear-gradient(90deg, transparent, ${todayMode.color}15, transparent)`,
                                animation: 'shimmer 4s ease-in-out infinite'
                            }}
                        />
                        <p className="text-white/40 text-[10px] uppercase tracking-widest mb-2 relative z-10">
                            Today's Battle Mode
                        </p>
                        <div className="flex items-center gap-4 relative z-10">
                            <span
                                className="text-5xl"
                                style={{ filter: `drop-shadow(0 0 15px ${todayMode.color})` }}
                            >
                                {todayMode.emoji}
                            </span>
                            <div>
                                <div className="text-white font-black text-2xl">{todayMode.name}</div>
                                <div style={{ color: todayMode.color }} className="text-sm font-medium">
                                    {todayMode.tagline}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Weekly Arena Prizes */}
                    <div
                        className="w-full max-w-md p-4 rounded-2xl mb-4 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.12) 0%, rgba(251, 146, 60, 0.12) 100%)',
                            border: '1px solid rgba(255, 215, 0, 0.3)'
                        }}
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-2xl">🏆</span>
                            <p className="text-yellow-300 font-bold">WEEKLY PRIZES</p>
                            <span className="text-white/40 text-xs ml-auto">Distributed Monday</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white/5 rounded-lg py-2 px-1">
                                <p className="text-yellow-400 text-lg font-black">🥇</p>
                                <p className="text-white font-bold text-sm">25</p>
                                <p className="text-white/40 text-[10px]">scans</p>
                            </div>
                            <div className="bg-white/5 rounded-lg py-2 px-1">
                                <p className="text-gray-300 text-lg font-black">🥈🥉</p>
                                <p className="text-white font-bold text-sm">15</p>
                                <p className="text-white/40 text-[10px]">scans</p>
                            </div>
                            <div className="bg-white/5 rounded-lg py-2 px-1">
                                <p className="text-amber-600 text-xs font-bold">#4-10</p>
                                <p className="text-white font-bold text-sm">5</p>
                                <p className="text-white/40 text-[10px]">scans</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full max-w-md mb-4">
                        <StreakCard
                            streakData={streakData}
                            nextReward={nextStreakReward}
                            modeColor={todayMode.color}
                            onClaim={handleClaimReward}
                        />
                    </div>

                    {/* Stats Dashboard (only if played before) */}
                    {hasPlayedBefore && (
                        <div className="w-full max-w-md mb-4">
                            <StatsDashboard
                                stats={allTimeStats}
                                winRate={winRate}
                                winStreak={winStreakData}
                                modeColor={todayMode.color}
                            />
                        </div>
                    )}

                    {/* Today's Record */}
                    {totalBattlesToday > 0 && (
                        <div
                            className="w-full max-w-md flex items-center justify-center gap-4 px-4 py-3 rounded-2xl mb-4"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}
                        >
                            <span className="text-white/40 text-xs uppercase tracking-wider">Today ({totalBattlesToday}/{ARENA_DAILY_LIMIT})</span>
                            <div className="flex items-center gap-3 text-lg font-black">
                                <span className="text-green-400">{dailyRecord.wins}W</span>
                                <span className="text-white/20">·</span>
                                <span className="text-red-400">{dailyRecord.losses}L</span>
                                <span className="text-white/20">·</span>
                                <span className="text-yellow-400">{dailyRecord.ties}T</span>
                            </div>
                        </div>
                    )}

                    {/* Next Milestone Teaser */}
                    {nextMilestone && (
                        <div className="w-full max-w-md flex items-center justify-center gap-2 text-white/30 text-xs mb-6">
                            <span>{nextMilestone.emoji}</span>
                            <span>Next: {nextMilestone.name} - {nextMilestone.description}</span>
                        </div>
                    )}

                    {/* BATTLE BUTTON */}
                    <button
                        onClick={handleEnterArena}
                        disabled={totalBattlesToday >= ARENA_DAILY_LIMIT}
                        className={`w-full max-w-md py-5 rounded-2xl font-black text-xl text-white transition-all relative overflow-hidden group ${totalBattlesToday >= ARENA_DAILY_LIMIT ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'
                            }`}
                        style={{
                            background: totalBattlesToday >= ARENA_DAILY_LIMIT
                                ? 'linear-gradient(135deg, #666, #444)'
                                : `linear-gradient(135deg, ${todayMode.color}, #00ff88)`,
                            boxShadow: totalBattlesToday >= ARENA_DAILY_LIMIT
                                ? 'none'
                                : `0 0 60px ${todayMode.color}50, 0 8px 40px rgba(0,0,0,0.4)`
                        }}
                    >
                        {/* Animated shine (only when active) */}
                        {totalBattlesToday < ARENA_DAILY_LIMIT && (
                            <div
                                className="absolute inset-0"
                                style={{
                                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                    animation: 'button-shine 3s ease-in-out infinite'
                                }}
                            />
                        )}
                        {/* Content */}
                        <span className="flex items-center justify-center gap-3 relative z-10">
                            <span className="text-3xl">{totalBattlesToday >= ARENA_DAILY_LIMIT ? '😴' : '⚔️'}</span>
                            <span className="tracking-wide">
                                {totalBattlesToday >= ARENA_DAILY_LIMIT
                                    ? 'DAILY LIMIT REACHED'
                                    : `ENTER BATTLE (${ARENA_DAILY_LIMIT - totalBattlesToday} left)`}
                            </span>
                        </span>
                        {/* Pulsing glow (only when active) */}
                        {totalBattlesToday < ARENA_DAILY_LIMIT && (
                            <div
                                className="absolute inset-0 rounded-2xl animate-pulse opacity-40"
                                style={{ boxShadow: `inset 0 0 30px ${todayMode.color}` }}
                            />
                        )}
                    </button>

                    {/* Privacy */}
                    <p className="text-white/20 text-[10px] mt-4 flex items-center gap-1">
                        <span>🔒</span>
                        Photos deleted after battle
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes arena-float {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 0.3; }
                    90% { opacity: 0.1; }
                    100% { transform: translateY(-100vh); }
                }
                @keyframes globe-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.08); }
                }
                @keyframes orbit {
                    0% { transform: rotate(0deg) scale(1.8); }
                    100% { transform: rotate(360deg) scale(1.8); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                @keyframes orb-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-30px, 30px) scale(1.15); }
                }
                @keyframes fire-dance {
                    0% { transform: scaleY(1) translateX(0); }
                    100% { transform: scaleY(1.2) translateX(2px); }
                }
                @keyframes button-shine {
                    0% { transform: translateX(-100%); }
                    50%, 100% { transform: translateX(200%); }
                }
            `}</style>

            {/* Display Name Modal */}
            {showDisplayNameModal && (
                <DisplayNameModal
                    userId={userId}
                    onSubmit={handleDisplayNameSubmit}
                    onClose={() => setShowDisplayNameModal(false)}
                />
            )}
        </div>
    )
}
