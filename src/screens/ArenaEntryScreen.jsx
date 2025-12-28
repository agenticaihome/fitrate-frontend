import React, { useState, useEffect, useRef, useMemo } from 'react'

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

export const getTodayArenaMode = () => {
    const dayIndex = new Date().getDay() // 0=Sunday, 1=Monday, etc.
    return ARENA_DAILY_MODES[dayIndex]
}

// ============================================
// DAILY ARENA RECORD (Client-side tracking)
// Resets each day at midnight
// ============================================
const getTodayKey = () => new Date().toISOString().split('T')[0] // YYYY-MM-DD

export const getDailyArenaRecord = () => {
    try {
        const todayKey = getTodayKey()
        const stored = localStorage.getItem('fitrate_arena_daily')
        if (stored) {
            const data = JSON.parse(stored)
            if (data.date === todayKey) {
                return data
            }
        }
        return { date: todayKey, wins: 0, losses: 0, ties: 0 }
    } catch (e) {
        return { date: getTodayKey(), wins: 0, losses: 0, ties: 0 }
    }
}

export const recordArenaResult = (result) => { // 'win' | 'loss' | 'tie'
    const record = getDailyArenaRecord()

    if (result === 'win') record.wins++
    else if (result === 'loss') record.losses++
    else record.ties++

    localStorage.setItem('fitrate_arena_daily', JSON.stringify(record))
    return record
}

// ============================================
// FLOATING PARTICLES - Mode-themed
// ============================================
const FloatingParticles = ({ color = '#00d4ff' }) => {
    const particles = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 2 + Math.random() * 3,
            delay: Math.random() * 10,
            duration: 15 + Math.random() * 20,
            opacity: 0.15 + Math.random() * 0.25
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-10px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 3 === 0 ? color : p.id % 2 === 0 ? '#00ff88' : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 4}px ${color}`,
                        animation: `arena-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`
                    }}
                />
            ))}
        </div>
    )
}

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
// MAIN ARENA ENTRY SCREEN
// ============================================
export default function ArenaEntryScreen({
    userId,
    onAnalysisComplete,  // Called with (score, photoDataUrl, mode) when ready for queue
    onBack,
    playSound,
    vibrate
}) {
    // Screen state: 'entry' | 'analyzing'
    const [screenState, setScreenState] = useState('entry')
    const [onlineCount, setOnlineCount] = useState(null)
    const [photoData, setPhotoData] = useState(null)
    const [analysisProgress, setAnalysisProgress] = useState(0)
    const [error, setError] = useState(null)
    const [analysisTip, setAnalysisTip] = useState(0)

    const todayMode = getTodayArenaMode()
    const fileInputRef = useRef(null)
    const abortControllerRef = useRef(null)

    const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')

    // Fun tips during analysis
    const ANALYSIS_TIPS = [
        "Scanning your fit...",
        "Calculating drip levels...",
        "Measuring aura intensity...",
        "Consulting the fashion gods...",
        "Almost ready to battle..."
    ]

    // Rotate tips during analysis
    useEffect(() => {
        if (screenState !== 'analyzing') return
        const interval = setInterval(() => {
            setAnalysisTip(prev => (prev + 1) % ANALYSIS_TIPS.length)
        }, 2000)
        return () => clearInterval(interval)
    }, [screenState])

    // Fetch online count
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/arena/stats`)
                if (res.ok) {
                    const data = await res.json()
                    setOnlineCount(data.online || 0)
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
                if (prev >= 90) return prev // Cap at 90 until complete
                return prev + Math.random() * 15
            })
        }, 300)

        return () => clearInterval(interval)
    }, [screenState])

    // Handle file selection
    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) {
            return // User cancelled - do nothing
        }

        playSound?.('click')
        vibrate?.([50, 30, 50])

        // Convert to data URL
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

        // Reset file input for re-selection
        e.target.value = ''
    }

    // Analyze photo via API
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
                    userId: userId
                }),
                signal: abortControllerRef.current.signal
            })

            if (!response.ok) {
                throw new Error('Analysis failed')
            }

            const result = await response.json()
            const score = result.scores?.overall || result.score || 75

            // Success! Complete progress and move to queue
            setAnalysisProgress(100)
            playSound?.('celebrate')
            vibrate?.([100, 50, 100])

            // Brief pause to show 100% then transition
            setTimeout(() => {
                onAnalysisComplete(score, imageData, todayMode.mode)
            }, 500)

        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('[Arena] Analysis cancelled')
                return
            }
            console.error('[Arena] Analysis failed:', err)
            setError("Couldn't analyze your photo. Want to try again?")
            vibrate?.([100, 100, 100])
        }
    }

    // Cancel analysis
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

    // Retry after error
    const handleRetry = () => {
        setError(null)
        setScreenState('entry')
        setPhotoData(null)
        // Trigger file picker
        setTimeout(() => fileInputRef.current?.click(), 100)
    }

    // Open camera
    const handleEnterArena = () => {
        playSound?.('click')
        vibrate?.([30, 20, 30])
        fileInputRef.current?.click()
    }

    // Current step for progress indicator
    const currentStep = screenState === 'entry' ? 0 : 1

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
                <FloatingParticles color={todayMode.color} />

                {/* Cancel Button - High z-index and larger touch target */}
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

                {/* Progress Steps */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                    <ProgressSteps currentStep={currentStep} modeColor={todayMode.color} />
                </div>

                {/* Main Content */}
                <div className="flex flex-col items-center text-center z-10 max-w-md w-full">
                    {/* Photo Preview with Scan Effect */}
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

                        {/* Pulsing ring around photo */}
                        <div
                            className="absolute -inset-4 rounded-3xl animate-ping opacity-20"
                            style={{ border: `2px solid ${todayMode.color}` }}
                        />
                    </div>

                    {/* Mode Badge */}
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

                    {/* Analyzing Text */}
                    <h2 className="text-2xl font-black text-white mb-2">
                        Analyzing Your Fit
                    </h2>
                    <p className="text-white/50 text-sm mb-8 h-5 transition-all">
                        {ANALYSIS_TIPS[analysisTip]}
                    </p>

                    {/* Progress Bar */}
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

                    {/* Cancel text */}
                    <p className="text-white/30 text-xs">
                        Tap ✕ to cancel
                    </p>
                </div>

                {/* Error Modal */}
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

                {/* CSS Animations */}
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
                `}</style>
            </div>
        )
    }

    // ============================================
    // ENTRY SCREEN
    // ============================================
    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center p-6 overflow-hidden"
            style={{
                background: `linear-gradient(135deg, #0a0a1a 0%, ${todayMode.color}15 50%, #0a1a2a 100%)`
            }}
        >
            <FloatingParticles color={todayMode.color} />

            {/* Hidden file input - positioned off-screen to avoid any interference */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="sr-only"
                aria-hidden="true"
            />

            {/* Back Button - High z-index and larger touch target */}
            <button
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    playSound?.('click')
                    vibrate?.(10)
                    onBack?.()
                }}
                className="absolute top-4 left-4 w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90"
                style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    zIndex: 9999,
                    touchAction: 'manipulation'
                }}
            >
                <span className="text-white text-xl font-bold">←</span>
            </button>

            {/* Online Count Badge */}
            {onlineCount !== null && (
                <div
                    className="absolute top-6 right-6 flex items-center gap-2 px-3 py-2 rounded-full z-10"
                    style={{
                        background: 'rgba(0,255,136,0.15)',
                        border: '1px solid rgba(0,255,136,0.3)'
                    }}
                >
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-green-400 text-sm font-bold">{onlineCount} online</span>
                </div>
            )}

            {/* Main Content - Scrollable area */}
            <div className="flex flex-col items-center text-center z-10 max-w-md w-full pt-16 pb-6">
                {/* Progress Steps - Inside content flow, not absolute */}
                <div className="mb-4">
                    <ProgressSteps currentStep={currentStep} modeColor={todayMode.color} />
                </div>

                {/* Globe Icon with glow */}
                <div className="relative mb-3">
                    <div
                        className="text-7xl"
                        style={{
                            filter: `drop-shadow(0 0 30px ${todayMode.color}80)`,
                            animation: 'globe-pulse 3s ease-in-out infinite'
                        }}
                    >
                        🌍
                    </div>
                    {/* Orbiting ring */}
                    <div
                        className="absolute inset-0 rounded-full"
                        style={{
                            border: `2px solid ${todayMode.color}30`,
                            animation: 'orbit 8s linear infinite'
                        }}
                    />
                </div>

                {/* Title */}
                <h1
                    className="text-4xl font-black text-white mb-2"
                    style={{
                        textShadow: `0 0 30px ${todayMode.color}60`
                    }}
                >
                    Global Arena
                </h1>

                {/* Subtitle */}
                <p className="text-white/60 text-lg mb-6">
                    Battle anyone in the world
                </p>

                {/* Today's Mode Card - Enhanced */}
                <div
                    className="w-full p-5 rounded-2xl mb-6 relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${todayMode.color}15 0%, ${todayMode.color}05 100%)`,
                        border: `1px solid ${todayMode.color}30`,
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    {/* Shimmer effect */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            background: `linear-gradient(90deg, transparent, ${todayMode.color}20, transparent)`,
                            animation: 'shimmer 3s ease-in-out infinite'
                        }}
                    />

                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2 relative z-10">
                        Today's Mode
                    </p>
                    <div className="flex items-center justify-center gap-3 relative z-10">
                        <span className="text-5xl" style={{ filter: `drop-shadow(0 0 10px ${todayMode.color})` }}>
                            {todayMode.emoji}
                        </span>
                        <div className="text-left">
                            <p className="text-white font-black text-2xl">{todayMode.name}</p>
                            <p style={{ color: todayMode.color }} className="text-sm font-medium">
                                {todayMode.tagline}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Today's Record - Only shows if user has played today */}
                {(() => {
                    const record = getDailyArenaRecord()
                    const totalBattles = record.wins + record.losses + record.ties
                    if (totalBattles === 0) return null

                    return (
                        <div className="flex items-center justify-center gap-4 mb-4 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                            <span className="text-white/50 text-xs uppercase tracking-wider">Today</span>
                            <div className="flex items-center gap-3">
                                <span className="text-green-400 font-black">{record.wins}W</span>
                                <span className="text-white/20">-</span>
                                <span className="text-red-400 font-black">{record.losses}L</span>
                                <span className="text-white/20">-</span>
                                <span className="text-yellow-400 font-black">{record.ties}T</span>
                            </div>
                        </div>
                    )
                })()}

                {/* How it Works - Visual Steps */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    {[
                        { icon: '📸', label: 'Snap' },
                        { icon: '→', label: '' },
                        { icon: '🔍', label: 'Match' },
                        { icon: '→', label: '' },
                        { icon: '⚔️', label: 'Battle' }
                    ].map((step, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className={`text-xl ${step.label ? '' : 'text-white/30'}`}>{step.icon}</span>
                            {step.label && <span className="text-white/40 text-[10px] mt-1">{step.label}</span>}
                        </div>
                    ))}
                </div>

                {/* MEGA Enter Button */}
                <button
                    onClick={handleEnterArena}
                    className="w-full py-6 rounded-2xl font-black text-xl text-white transition-all active:scale-[0.97] relative overflow-hidden group"
                    style={{
                        background: `linear-gradient(135deg, ${todayMode.color} 0%, #00ff88 100%)`,
                        boxShadow: `0 0 50px ${todayMode.color}50, 0 4px 30px rgba(0,0,0,0.4)`
                    }}
                >
                    {/* Button glow effect */}
                    <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                            background: `radial-gradient(circle at center, ${todayMode.color}40, transparent)`
                        }}
                    />

                    {/* Button content */}
                    <span className="flex items-center justify-center gap-3 relative z-10">
                        <span className="text-3xl">📸</span>
                        <span>Enter Arena</span>
                    </span>

                    {/* Pulsing border */}
                    <div
                        className="absolute inset-0 rounded-2xl animate-pulse opacity-50"
                        style={{ border: `2px solid ${todayMode.color}` }}
                    />
                </button>

                {/* Privacy Note */}
                <p className="text-white/30 text-[10px] mt-4 flex items-center gap-1">
                    <span>🔒</span>
                    Photos auto-deleted after battle
                </p>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes arena-float {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 0.3; }
                    90% { opacity: 0.1; }
                    100% { transform: translateY(-100vh); }
                }
                @keyframes globe-pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                @keyframes orbit {
                    0% { transform: rotate(0deg) scale(1.5); }
                    100% { transform: rotate(360deg) scale(1.5); }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    )
}
