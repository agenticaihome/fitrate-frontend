import React, { useState, useEffect, useRef, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

// Floating particles for premium feel
const FloatingParticles = () => {
    const particles = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 10,
            duration: 10 + Math.random() * 15,
            opacity: 0.1 + Math.random() * 0.2,
            color: i % 3 === 0 ? '#00d4ff' : i % 2 === 0 ? '#00ff88' : '#fff'
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
                        background: p.color,
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`
                    }}
                />
            ))}
        </div>
    )
}

// Pulsing search ring
const SearchRing = ({ color }) => (
    <div className="relative w-32 h-32 mx-auto">
        <div className="absolute inset-0 rounded-full animate-ping"
            style={{ background: `${color}20`, animationDuration: '2s' }} />
        <div className="absolute inset-2 rounded-full animate-ping"
            style={{ background: `${color}30`, animationDuration: '2s', animationDelay: '0.3s' }} />
        <div className="absolute inset-4 rounded-full animate-ping"
            style={{ background: `${color}40`, animationDuration: '2s', animationDelay: '0.6s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl">🌍</span>
        </div>
    </div>
)

/**
 * ArenaQueueScreen - Global matchmaking queue experience
 * 
 * Shows searching animation while polling for matches.
 * Auto-polls every 2 seconds for match status.
 */
export default function ArenaQueueScreen({
    userId,
    score,
    thumb,
    mode,
    onMatchFound,   // Called with battleId when match is found
    onCancel,       // Called when user cancels
    onError,        // Called on error
    onTimeout       // Called when queue times out
}) {
    const [waitTime, setWaitTime] = useState(0)
    const [onlineCount, setOnlineCount] = useState(null)
    const [status, setStatus] = useState('joining') // joining → queued → matched → timeout
    const pollIntervalRef = useRef(null)
    const waitTimerRef = useRef(null)
    const hasJoinedRef = useRef(false)

    const API_BASE = import.meta.env.VITE_API_URL || 'https://api.fitrate.app'
    const TIMEOUT_MS = 60000 // 60 second timeout

    // Mode color mapping
    const getModeColor = () => {
        const colors = {
            nice: '#00ff88', roast: '#ff6b35', honest: '#00d4ff', savage: '#8b00ff',
            rizz: '#ff1493', celeb: '#ffd700', aura: '#9b59b6', chaos: '#ee5a24',
            y2k: '#ff69b4', villain: '#4b0082', coquette: '#ffb6c1', hypebeast: '#f97316'
        }
        return colors[mode] || '#00d4ff'
    }

    const getModeEmoji = () => {
        const emojis = {
            nice: '😇', roast: '🔥', honest: '📊', savage: '💀', rizz: '😏', celeb: '⭐',
            aura: '🔮', chaos: '🎪', y2k: '💎', villain: '🖤', coquette: '🎀', hypebeast: '👟'
        }
        return emojis[mode] || '🔥'
    }

    const accentColor = getModeColor()

    // Join queue on mount
    useEffect(() => {
        if (hasJoinedRef.current) return
        hasJoinedRef.current = true

        const joinQueue = async () => {
            try {
                const res = await fetch(`${API_BASE}/arena/join`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, score, thumb, mode })
                })
                const data = await res.json()

                if (data.status === 'matched') {
                    // Instant match!
                    setStatus('matched')
                    playSound('celebrate')
                    vibrate([100, 50, 100])
                    setTimeout(() => onMatchFound?.(data.battleId), 500)
                } else {
                    setStatus('queued')
                    startPolling()
                }
            } catch (err) {
                console.error('[Arena] Join error:', err)
                onError?.('Failed to join arena')
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
            onTimeout?.()
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
                    playSound('celebrate')
                    vibrate([100, 50, 100])
                    setTimeout(() => onMatchFound?.(data.battleId), 500)
                } else if (data.status === 'expired') {
                    setStatus('timeout')
                    clearInterval(pollIntervalRef.current)
                    onTimeout?.()
                }
            } catch (err) {
                console.warn('[Arena] Poll error:', err)
            }
        }, 2000) // Poll every 2 seconds
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
        playSound('click')
        vibrate(20)
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

    // Timeout screen
    if (status === 'timeout') {
        return (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center"
                style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2a 50%, #0a0a1a 100%)' }}>
                <div className="text-7xl mb-6">😔</div>
                <h1 className="text-2xl font-black text-white mb-2">No Opponents Found</h1>
                <p className="text-white/50 mb-8 max-w-xs">
                    The arena is quiet right now. Try again later or challenge a friend directly!
                </p>
                <button
                    onClick={onCancel}
                    className="w-full max-w-xs py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97]"
                    style={{ background: accentColor, color: '#000' }}
                >
                    Back to Home
                </button>
            </div>
        )
    }

    // Match found screen (brief flash before reveal)
    if (status === 'matched') {
        return (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
                style={{ background: 'linear-gradient(180deg, #0a1a0a 0%, #001a00 50%, #0a1a0a 100%)' }}>
                <div className="text-8xl animate-bounce">⚔️</div>
                <h1 className="text-3xl font-black mt-4" style={{ color: '#00ff88' }}>
                    OPPONENT FOUND!
                </h1>
            </div>
        )
    }

    // Main queue screen
    return (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2a 50%, #0a0a1a 100%)' }}>

            <FloatingParticles />

            {/* Background glow */}
            <div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{
                    background: `radial-gradient(circle, ${accentColor}20 0%, transparent 60%)`,
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                }} />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <h1 className="text-3xl font-black text-white mb-2">
                    🌍 Global Arena
                </h1>
                {onlineCount !== null && (
                    <p className="text-white/50 text-sm">
                        <span style={{ color: '#00ff88' }}>{onlineCount}</span> players online
                    </p>
                )}
            </div>

            {/* Search animation */}
            <div className="relative z-10 mb-8">
                <SearchRing color={accentColor} />
            </div>

            {/* Status */}
            <div className="relative z-10 mb-4">
                <p className="text-xl font-bold text-white mb-2">
                    {status === 'joining' ? 'Entering Arena...' : 'Finding Opponent...'}
                </p>
                <p className="text-white/40 text-sm">
                    {getModeEmoji()} {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
                </p>
            </div>

            {/* Your score card */}
            <div className="relative z-10 bg-white/5 rounded-2xl p-4 border border-white/10 mb-6 w-full max-w-xs">
                <div className="flex items-center gap-4">
                    {thumb ? (
                        <img src={thumb} alt="Your fit" className="w-16 h-16 rounded-xl object-cover" />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                            <span className="text-2xl">👤</span>
                        </div>
                    )}
                    <div className="text-left">
                        <p className="text-white/50 text-xs uppercase tracking-wider">Your Score</p>
                        <p className="text-3xl font-black" style={{ color: accentColor }}>
                            {Math.round(score)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Timer + progress */}
            <div className="relative z-10 w-full max-w-xs mb-8">
                <div className="flex justify-between text-sm text-white/40 mb-2">
                    <span>Searching</span>
                    <span>{formatWait(waitTime)}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${Math.min(100, (waitTime / TIMEOUT_MS) * 100)}%`,
                            background: `linear-gradient(90deg, ${accentColor}, #00d4ff)`
                        }}
                    />
                </div>
            </div>

            {/* Cancel button */}
            <button
                onClick={handleCancel}
                className="relative z-10 w-full max-w-xs py-4 rounded-xl font-medium text-white/60 transition-all active:scale-[0.97]"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                Cancel
            </button>
        </div>
    )
}
