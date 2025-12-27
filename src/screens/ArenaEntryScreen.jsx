import React, { useState, useEffect, useRef, useCallback } from 'react'

// ============================================
// ARENA MODE OF THE DAY
// Rotates daily for shared global experience
// ============================================
const ARENA_DAILY_MODES = [
    { mode: 'aura', emoji: '🔮', name: 'Aura', tagline: 'Mystical Sunday' },
    { mode: 'roast', emoji: '🔥', name: 'Roast', tagline: 'Spicy Monday' },
    { mode: 'nice', emoji: '😇', name: 'Nice', tagline: 'Wholesome Tuesday' },
    { mode: 'savage', emoji: '💀', name: 'Savage', tagline: 'Wild Wednesday' },
    { mode: 'rizz', emoji: '😏', name: 'Rizz', tagline: 'Flirty Thursday' },
    { mode: 'chaos', emoji: '🎪', name: 'Chaos', tagline: 'Chaotic Friday' },
    { mode: 'celeb', emoji: '✨', name: 'Celeb', tagline: 'Star Saturday' }
]

const getTodayArenaMode = () => {
    const dayIndex = new Date().getDay() // 0=Sunday, 1=Monday, etc.
    return ARENA_DAILY_MODES[dayIndex]
}

// ============================================
// FLOATING PARTICLES
// ============================================
const FloatingParticles = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15)].map((_, i) => (
                <div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: 2 + Math.random() * 3,
                        height: 2 + Math.random() * 3,
                        background: i % 3 === 0 ? '#00d4ff' : i % 2 === 0 ? '#00ff88' : '#fff',
                        opacity: 0.2 + Math.random() * 0.3,
                        animation: `float ${10 + Math.random() * 20}s linear infinite`,
                        animationDelay: `${Math.random() * 10}s`
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// ARENA ENTRY SCREEN
// ============================================
export default function ArenaEntryScreen({
    userId,
    onTakePhoto,
    onBack,
    playSound,
    vibrate
}) {
    const [onlineCount, setOnlineCount] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const todayMode = getTodayArenaMode()

    // Fetch online count
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const API_URL = import.meta.env.VITE_API_URL || ''
                const res = await fetch(`${API_URL}/api/arena/stats`)
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
    }, [])

    const handleEnter = () => {
        playSound?.('click')
        vibrate?.(30)
        setIsLoading(true)
        onTakePhoto(todayMode.mode)
    }

    return (
        <div
            className="fixed inset-0 flex flex-col items-center justify-center p-6 overflow-hidden"
            style={{
                background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 50%, #0a1a2a 100%)'
            }}
        >
            <FloatingParticles />

            {/* Back Button */}
            <button
                onClick={() => {
                    playSound?.('click')
                    vibrate?.(10)
                    onBack()
                }}
                className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 z-10"
                style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}
            >
                <span className="text-white text-lg">←</span>
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

            {/* Main Content */}
            <div className="flex flex-col items-center text-center z-10 max-w-md">
                {/* Globe Icon */}
                <div
                    className="text-8xl mb-4"
                    style={{
                        filter: 'drop-shadow(0 0 30px rgba(0,212,255,0.5))',
                        animation: 'pulse 3s ease-in-out infinite'
                    }}
                >
                    🌍
                </div>

                {/* Title */}
                <h1
                    className="text-4xl font-black text-white mb-2"
                    style={{
                        textShadow: '0 0 30px rgba(0,212,255,0.5)'
                    }}
                >
                    Global Arena
                </h1>

                {/* Subtitle */}
                <p className="text-white/60 text-lg mb-8">
                    Battle anyone in the world
                </p>

                {/* Today's Mode Card */}
                <div
                    className="w-full p-5 rounded-2xl mb-6"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)'
                    }}
                >
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2">
                        Today's Mode
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        <span className="text-4xl">{todayMode.emoji}</span>
                        <div className="text-left">
                            <p className="text-white font-black text-2xl">{todayMode.name}</p>
                            <p className="text-cyan-400 text-sm">{todayMode.tagline}</p>
                        </div>
                    </div>
                </div>

                {/* How it Works */}
                <div className="flex items-center justify-center gap-4 mb-8 text-white/40 text-xs">
                    <span>📸 Take photo</span>
                    <span>→</span>
                    <span>🔍 Get matched</span>
                    <span>→</span>
                    <span>⚔️ Battle!</span>
                </div>

                {/* Enter Button */}
                <button
                    onClick={handleEnter}
                    disabled={isLoading}
                    className="w-full py-5 rounded-2xl font-black text-xl text-white transition-all active:scale-[0.97] disabled:opacity-50"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        boxShadow: '0 0 40px rgba(0,212,255,0.4), 0 4px 20px rgba(0,0,0,0.3)'
                    }}
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⚡</span>
                            Starting...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <span>📸</span>
                            Enter Arena
                        </span>
                    )}
                </button>

                {/* Privacy Note */}
                <p className="text-white/30 text-[10px] mt-4">
                    🔒 Photos auto-deleted after battle
                </p>
            </div>

            {/* CSS for float animation */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 0.3; }
                    50% { transform: translateY(-100vh) translateX(20px); opacity: 0.2; }
                    90% { opacity: 0.1; }
                }
            `}</style>
        </div>
    )
}
