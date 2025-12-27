import React, { useState, useEffect, useRef, useMemo } from 'react'
import { getTodayArenaMode } from './ArenaEntryScreen'

// ============================================
// FLOATING PARTICLES
// ============================================
const FloatingParticles = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 25 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 10,
            duration: 10 + Math.random() * 15,
            opacity: 0.1 + Math.random() * 0.2,
            color: i % 3 === 0 ? color : i % 2 === 0 ? '#00ff88' : '#fff'
        })), [color]
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
                        background: p.color,
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                        animation: `queue-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// PROGRESS STEPS - Compact for mobile
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
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all duration-500 ${
                                i < currentStep ? 'scale-95' : i === currentStep ? 'scale-105' : 'scale-95 opacity-40'
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
                        <span className={`text-[9px] mt-0.5 transition-all ${
                            i <= currentStep ? 'text-white/80' : 'text-white/30'
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
// PULSING SEARCH ANIMATION
// ============================================
const SearchAnimation = ({ color }) => (
    <div className="relative w-32 h-32 mx-auto">
        {/* Outer rings */}
        {[0, 1, 2].map(i => (
            <div
                key={i}
                className="absolute inset-0 rounded-full"
                style={{
                    border: `2px solid ${color}`,
                    opacity: 0.2 - i * 0.05,
                    animation: `search-ping 2s ease-out infinite`,
                    animationDelay: `${i * 0.4}s`
                }}
            />
        ))}

        {/* Center globe */}
        <div className="absolute inset-0 flex items-center justify-center">
            <div
                className="text-5xl"
                style={{
                    filter: `drop-shadow(0 0 15px ${color})`,
                    animation: 'globe-spin 3s linear infinite'
                }}
            >
                🌍
            </div>
        </div>

        {/* Scanning line */}
        <div
            className="absolute left-1/2 top-0 w-0.5 h-full -translate-x-1/2"
            style={{
                background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
                animation: 'scan-rotate 2s linear infinite'
            }}
        />
    </div>
)

// ============================================
// OPPONENT SILHOUETTE
// ============================================
const OpponentSilhouette = ({ color }) => (
    <div
        className="w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden"
        style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px dashed rgba(255,255,255,0.2)'
        }}
    >
        <span className="text-2xl opacity-30">👤</span>
        {/* Shimmer effect */}
        <div
            className="absolute inset-0"
            style={{
                background: `linear-gradient(90deg, transparent, ${color}20, transparent)`,
                animation: 'shimmer 2s ease-in-out infinite'
            }}
        />
    </div>
)

// ============================================
// ARENA QUEUE SCREEN
// ============================================
export default function ArenaQueueScreen({
    userId,
    score,
    thumb,
    mode,
    onMatchFound,
    onCancel,
    onError,
    onTimeout,
    playSound,
    vibrate
}) {
    const [waitTime, setWaitTime] = useState(0)
    const [onlineCount, setOnlineCount] = useState(null)
    const [status, setStatus] = useState('joining') // joining → queued → matched → timeout
    const [searchMessage, setSearchMessage] = useState(0)

    const pollIntervalRef = useRef(null)
    const waitTimerRef = useRef(null)
    const hasJoinedRef = useRef(false)

    // Use consistent API_BASE
    const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')
    const TIMEOUT_MS = 60000 // 60 seconds

    const todayMode = getTodayArenaMode()
    const modeColor = todayMode.color

    // Fun searching messages
    const SEARCH_MESSAGES = [
        "Scanning the globe...",
        "Finding worthy opponents...",
        "Matching style levels...",
        "Connecting fashionistas...",
        "Almost there..."
    ]

    // Rotate messages
    useEffect(() => {
        if (status !== 'queued') return
        const interval = setInterval(() => {
            setSearchMessage(prev => (prev + 1) % SEARCH_MESSAGES.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [status])

    // Join queue on mount
    useEffect(() => {
        if (hasJoinedRef.current) return
        hasJoinedRef.current = true

        const joinQueue = async () => {
            try {
                playSound?.('whoosh')

                const res = await fetch(`${API_BASE}/arena/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, score, thumb, mode })
                })
                const data = await res.json()

                if (data.status === 'matched') {
                    // Instant match!
                    setStatus('matched')
                    playSound?.('celebrate')
                    vibrate?.([100, 50, 100, 50, 100])
                    setTimeout(() => onMatchFound?.(data.battleId), 800)
                } else {
                    setStatus('queued')
                    vibrate?.(50)
                    startPolling()
                }
            } catch (err) {
                console.error('[Arena] Join error:', err)
                onError?.('Failed to join arena. Check your connection!')
            }
        }

        // Fetch online count
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/arena/stats`)
                const data = await res.json()
                setOnlineCount(data.online || 0)
            } catch (err) {
                console.warn('[Arena] Stats error:', err)
            }
        }

        joinQueue()
        fetchStats()

        // Start wait timer
        waitTimerRef.current = setInterval(() => {
            setWaitTime(prev => prev + 1000)
        }, 1000)

        return () => {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
            if (waitTimerRef.current) clearInterval(waitTimerRef.current)
        }
    }, [])

    // Check for timeout
    useEffect(() => {
        if (waitTime >= TIMEOUT_MS && status === 'queued') {
            setStatus('timeout')
            leaveQueue()
            vibrate?.([100, 100, 100])
        }
    }, [waitTime, status])

    // Polling for match
    const startPolling = () => {
        pollIntervalRef.current = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/arena/poll?userId=${encodeURIComponent(userId)}`)
                const data = await res.json()

                if (data.status === 'matched') {
                    setStatus('matched')
                    clearInterval(pollIntervalRef.current)
                    playSound?.('celebrate')
                    vibrate?.([100, 50, 100, 50, 100])
                    setTimeout(() => onMatchFound?.(data.battleId), 800)
                } else if (data.status === 'expired') {
                    setStatus('timeout')
                    clearInterval(pollIntervalRef.current)
                }
            } catch (err) {
                console.warn('[Arena] Poll error:', err)
            }
        }, 2000)
    }

    // Leave queue
    const leaveQueue = async () => {
        try {
            await fetch(`${API_BASE}/arena/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })
        } catch (err) {
            console.warn('[Arena] Leave error:', err)
        }
    }

    // Handle cancel
    const handleCancel = () => {
        playSound?.('click')
        vibrate?.(20)
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        if (waitTimerRef.current) clearInterval(waitTimerRef.current)
        leaveQueue()
        onCancel?.()
    }

    // Format wait time
    const formatWait = (ms) => {
        const seconds = Math.floor(ms / 1000)
        if (seconds < 60) return `${seconds}s`
        return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    }

    // Progress percentage for timeout
    const timeoutProgress = Math.min(100, (waitTime / TIMEOUT_MS) * 100)

    // ============================================
    // TIMEOUT SCREEN
    // ============================================
    if (status === 'timeout') {
        return (
            <div
                className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center overflow-hidden"
                style={{ background: `linear-gradient(180deg, #0a0a1a 0%, ${modeColor}15 50%, #0a0a1a 100%)` }}
            >
                <FloatingParticles color={modeColor} />

                <div className="relative z-10 flex flex-col items-center max-w-sm">
                    <div className="text-8xl mb-6 animate-bounce">😔</div>

                    <h1 className="text-3xl font-black text-white mb-3">
                        No Opponents Found
                    </h1>

                    <p className="text-white/50 mb-8 text-lg">
                        The arena is quiet right now. Try again or challenge a friend directly!
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => {
                                playSound?.('click')
                                vibrate?.(30)
                                // Reset and retry
                                setWaitTime(0)
                                setStatus('joining')
                                hasJoinedRef.current = false
                            }}
                            className="w-full py-4 rounded-2xl font-bold text-lg text-black transition-all active:scale-[0.97]"
                            style={{ background: modeColor }}
                        >
                            Try Again
                        </button>

                        <button
                            onClick={handleCancel}
                            className="w-full py-4 rounded-xl font-medium text-white/60 transition-all active:scale-[0.97]"
                            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            Back to Home
                        </button>
                    </div>
                </div>

                <style>{`
                    @keyframes queue-float {
                        0%, 100% { transform: translateY(0); opacity: 0; }
                        10% { opacity: 0.3; }
                        90% { opacity: 0.1; }
                        100% { transform: translateY(-100vh); }
                    }
                `}</style>
            </div>
        )
    }

    // ============================================
    // MATCH FOUND SCREEN
    // ============================================
    if (status === 'matched') {
        return (
            <div
                className="fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(180deg, #001a00 0%, ${modeColor}30 50%, #001a00 100%)` }}
            >
                {/* Victory burst */}
                <div
                    className="absolute w-96 h-96 rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${modeColor}60, transparent)`,
                        animation: 'victory-burst 0.5s ease-out forwards'
                    }}
                />

                <div className="relative z-10 flex flex-col items-center">
                    <div
                        className="text-9xl mb-4"
                        style={{
                            filter: `drop-shadow(0 0 40px ${modeColor})`,
                            animation: 'match-bounce 0.5s ease-out'
                        }}
                    >
                        ⚔️
                    </div>

                    <h1
                        className="text-4xl font-black mb-2"
                        style={{
                            color: '#00ff88',
                            textShadow: '0 0 30px #00ff8860',
                            animation: 'text-glow 1s ease-in-out infinite'
                        }}
                    >
                        OPPONENT FOUND!
                    </h1>

                    <p className="text-white/60">Get ready to battle...</p>
                </div>

                <style>{`
                    @keyframes victory-burst {
                        0% { transform: scale(0); opacity: 1; }
                        100% { transform: scale(3); opacity: 0; }
                    }
                    @keyframes match-bounce {
                        0% { transform: scale(0) rotate(-180deg); }
                        50% { transform: scale(1.2) rotate(10deg); }
                        100% { transform: scale(1) rotate(0deg); }
                    }
                    @keyframes text-glow {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.8; }
                    }
                `}</style>
            </div>
        )
    }

    // ============================================
    // MAIN QUEUE SCREEN
    // ============================================
    return (
        <div
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
            style={{ background: `linear-gradient(180deg, #0a0a1a 0%, ${modeColor}15 50%, #0a0a1a 100%)` }}
        >
            <FloatingParticles color={modeColor} />

            {/* Cancel Button */}
            <button
                onClick={handleCancel}
                className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 z-20"
                style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            >
                <span className="text-white text-lg">✕</span>
            </button>

            {/* Online count */}
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

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center w-full max-w-md pt-14 pb-4">
                {/* Progress Steps - In flow, not absolute */}
                <div className="mb-4">
                    <ProgressSteps currentStep={2} modeColor={modeColor} />
                </div>

                {/* Search Animation */}
                <div className="mb-6">
                    <SearchAnimation color={modeColor} />
                </div>

                {/* Status Text */}
                <h2 className="text-xl font-black text-white mb-1">
                    {status === 'joining' ? 'Entering Arena...' : 'Finding Opponent...'}
                </h2>
                <p className="text-white/50 text-sm mb-4 h-5">
                    {status === 'queued' ? SEARCH_MESSAGES[searchMessage] : 'Connecting to arena...'}
                </p>

                {/* VS Card - Your photo vs silhouette */}
                <div className="flex items-center justify-center gap-4 mb-4">
                    {/* Your photo */}
                    <div className="flex flex-col items-center">
                        <div
                            className="w-16 h-16 rounded-xl overflow-hidden relative"
                            style={{
                                boxShadow: `0 0 20px ${modeColor}40`,
                                border: `2px solid ${modeColor}`
                            }}
                        >
                            {thumb ? (
                                <img src={thumb} alt="You" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                    <span className="text-xl">👤</span>
                                </div>
                            )}
                        </div>
                        <p className="text-white/60 text-[10px] mt-1">You</p>
                        <p className="font-black text-base" style={{ color: modeColor }}>
                            {Math.round(score)}
                        </p>
                    </div>

                    {/* VS */}
                    <div
                        className="text-xl font-black"
                        style={{
                            color: modeColor,
                            textShadow: `0 0 15px ${modeColor}60`,
                            animation: 'vs-pulse 1s ease-in-out infinite'
                        }}
                    >
                        VS
                    </div>

                    {/* Opponent silhouette */}
                    <div className="flex flex-col items-center">
                        <OpponentSilhouette color={modeColor} />
                        <p className="text-white/40 text-[10px] mt-1">???</p>
                        <p className="font-black text-base text-white/30">??</p>
                    </div>
                </div>

                {/* Mode Badge */}
                <div
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                    style={{
                        background: `${modeColor}20`,
                        border: `1px solid ${modeColor}40`
                    }}
                >
                    <span className="text-lg">{todayMode.emoji}</span>
                    <span style={{ color: modeColor }} className="font-bold text-sm">
                        {todayMode.name} Mode
                    </span>
                </div>

                {/* Circular Timeout Progress */}
                <div className="relative w-24 h-24 mb-4">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                        {/* Background circle */}
                        <circle
                            cx="48"
                            cy="48"
                            r="42"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="6"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="48"
                            cy="48"
                            r="42"
                            fill="none"
                            stroke={timeoutProgress > 75 ? '#ff6b6b' : modeColor}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            strokeDashoffset={`${2 * Math.PI * 42 * (1 - timeoutProgress / 100)}`}
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-black text-white">
                            {formatWait(waitTime)}
                        </span>
                        <span className="text-white/40 text-[10px]">
                            {timeoutProgress > 75 ? 'Almost done...' : 'Searching'}
                        </span>
                    </div>
                </div>

                {/* Cancel Button */}
                <button
                    onClick={handleCancel}
                    className="w-full max-w-xs py-3 rounded-xl font-medium text-white/60 transition-all active:scale-[0.97]"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                    Cancel
                </button>
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes queue-float {
                    0%, 100% { transform: translateY(0); opacity: 0; }
                    10% { opacity: 0.3; }
                    90% { opacity: 0.1; }
                    100% { transform: translateY(-100vh); }
                }
                @keyframes search-ping {
                    0% { transform: scale(1); opacity: 0.3; }
                    100% { transform: scale(2); opacity: 0; }
                }
                @keyframes globe-spin {
                    0% { transform: rotateY(0deg); }
                    100% { transform: rotateY(360deg); }
                }
                @keyframes scan-rotate {
                    0% { transform: translateX(-50%) rotate(0deg); }
                    100% { transform: translateX(-50%) rotate(360deg); }
                }
                @keyframes vs-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    )
}
