import React, { useState, useEffect, useRef, useMemo } from 'react'
import Footer from '../components/common/Footer'
import { playSound, vibrate } from '../utils/soundEffects'

// === COPY POOLS (curious → clever → spicy progression) ===
const COPY_CURIOUS = [
    "Running vibe diagnostics…",
    "Checking fit chemistry…",
    "Assessing confidence signal…",
    "Detecting fabric decisions…"
]

const COPY_CLEVER = [
    "Consulting the fashion gods…",
    "Measuring drip integrity…",
    "Cross-checking with the internet's opinion…",
    "Calculating style potential…"
]

const COPY_SPICY = [
    "Synthesizing social risk…",
    "Evaluating outfit bravery…",
    "Detecting fabric failure…",
    "Assessing the bold choices…"
]

// Shuffle array helper
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

// ============================================
// PREMIUM SCAN PARTICLES
// ============================================
const ScanParticles = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: 10 + Math.random() * 80,
            size: 2 + Math.random() * 3,
            delay: Math.random() * 3,
            duration: 2 + Math.random() * 2,
            opacity: 0.4 + Math.random() * 0.4
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        top: '50%',
                        width: p.size,
                        height: p.size,
                        background: color,
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${color}`,
                        animation: `particle-twinkle ${p.duration}s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`
                    }}
                />
            ))}
        </div>
    )
}

// ============================================
// FLOATING AMBIENT PARTICLES
// ============================================
const FloatingParticles = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 10,
            duration: 12 + Math.random() * 8,
            opacity: 0.2 + Math.random() * 0.3,
            drift: -20 + Math.random() * 40
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
                        bottom: '-5px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 3 === 0 ? color : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 3 === 0 ? color : '#fff'}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}
        </div>
    )
}

export default function AnalyzingScreen({
    uploadedImage,
    mode,
    isPro,
    onBack,
}) {
    const [progress, setProgress] = useState(0)
    const [copyIndex, setCopyIndex] = useState(0)
    const [copyPool, setCopyPool] = useState([])
    const [checklistVisible, setChecklistVisible] = useState([false, false, false, false, false, false])
    const [showFlash, setShowFlash] = useState(false)
    const pauseRef = useRef(false)

    // Mode colors - all 12 modes with distinct colors
    const getModeColor = () => {
        const colors = {
            nice: '#00ff88',
            roast: '#ff6b35',
            honest: '#3b82f6',
            savage: '#ff1493',
            rizz: '#ff69b4',
            celeb: '#ffd700',
            aura: '#9b59b6',
            chaos: '#ff4444',
            y2k: '#00CED1',
            villain: '#4c1d95',
            coquette: '#ffb6c1',
            hypebeast: '#f97316'
        }
        return colors[mode] || '#00d4ff'
    }

    const getModeGlow = () => {
        const glows = {
            nice: 'rgba(0,255,136,0.4)',
            roast: 'rgba(255,107,53,0.4)',
            honest: 'rgba(59,130,246,0.4)',
            savage: 'rgba(255,20,147,0.4)',
            rizz: 'rgba(255,105,180,0.4)',
            celeb: 'rgba(255,215,0,0.4)',
            aura: 'rgba(155,89,182,0.4)',
            chaos: 'rgba(255,68,68,0.4)',
            y2k: 'rgba(0,206,209,0.4)',
            villain: 'rgba(76,29,149,0.4)',
            coquette: 'rgba(255,182,193,0.4)',
            hypebeast: 'rgba(249,115,22,0.4)'
        }
        return glows[mode] || 'rgba(0,212,255,0.4)'
    }

    const accent = getModeColor()
    const accentGlow = getModeGlow()

    // Calculate image zoom based on progress (1 -> 1.05)
    const imageZoom = 1 + (progress / 90) * 0.05

    // Initialize shuffled copy pool (curious → clever → spicy)
    useEffect(() => {
        const pool = [
            ...shuffle(COPY_CURIOUS).slice(0, 2),
            ...shuffle(COPY_CLEVER).slice(0, 2),
            ...shuffle(COPY_SPICY).slice(0, 2)
        ]
        setCopyPool(pool)
    }, [])

    // Progress animation with micro-pauses at 15%, 45%, 80%
    useEffect(() => {
        setProgress(0)
        setCopyIndex(0)
        setChecklistVisible([false, false, false, false, false, false])

        const progressInterval = setInterval(() => {
            if (pauseRef.current) return

            setProgress(p => {
                if (p >= 90) return 90

                // Micro-pause logic with flash effects
                if (p >= 14 && p < 16) {
                    pauseRef.current = true
                    setShowFlash(true)
                    setTimeout(() => setShowFlash(false), 150)
                    setTimeout(() => { pauseRef.current = false }, 400)
                    return 16
                }
                if (p >= 44 && p < 46) {
                    pauseRef.current = true
                    setShowFlash(true)
                    setTimeout(() => setShowFlash(false), 150)
                    setTimeout(() => { pauseRef.current = false }, 600)
                    return 46
                }
                if (p >= 79 && p < 81) {
                    pauseRef.current = true
                    vibrate(30)
                    playSound('tick')
                    setShowFlash(true)
                    setTimeout(() => setShowFlash(false), 200)
                    setTimeout(() => { pauseRef.current = false }, 800)
                    return 81
                }

                // Variable speed (irregular feel)
                const increment = Math.random() * 1.8 + 0.4
                return Math.min(90, p + increment)
            })
        }, 180)

        return () => clearInterval(progressInterval)
    }, [mode])

    // Rotate copy every 2s
    useEffect(() => {
        if (copyPool.length === 0) return

        const copyInterval = setInterval(() => {
            setCopyIndex(i => (i + 1) % copyPool.length)
        }, 2000)

        return () => clearInterval(copyInterval)
    }, [copyPool])

    // Animate checklist items one by one with enhanced timing
    useEffect(() => {
        const delays = [300, 800, 1300, 2200, 2800, 3400]
        const timers = delays.map((delay, idx) =>
            setTimeout(() => {
                vibrate(10) // Subtle haptic on each reveal
                setChecklistVisible(prev => {
                    const next = [...prev]
                    next[idx] = true
                    return next
                })
            }, delay)
        )
        return () => timers.forEach(clearTimeout)
    }, [])

    const currentCopy = copyPool[copyIndex] || "Analyzing your style…"

    // Checklist items
    const freeItems = [
        "Overall score + breakdown",
        "Celeb style match",
        "Quick styling tip"
    ]
    const proItems = [
        "Deep analysis (Pro)",
        "Item-by-item feedback (Pro)",
        "All AI modes (Pro)"
    ]

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative" style={{
            background: 'radial-gradient(ellipse at center, #12121f 0%, #0a0a0f 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}>
            {/* Background Glow with breathing effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Primary glow */}
                <div className="absolute w-[600px] h-[600px] rounded-full" style={{
                    background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
                    top: '30%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite',
                    opacity: 0.25,
                    '--glow-color': accentGlow
                }} />
                {/* Secondary glow */}
                <div className="absolute w-[400px] h-[400px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)',
                    bottom: '10%', right: '-10%',
                    animation: 'float-gentle 5s ease-in-out infinite',
                    opacity: 0.15
                }} />
                {/* Floating ambient particles */}
                <FloatingParticles color={accent} />
            </div>

            {/* Vignette overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
            }} />

            {/* Flash overlay on milestones */}
            {showFlash && (
                <div
                    className="absolute inset-0 pointer-events-none z-50"
                    style={{
                        background: `radial-gradient(circle at center, ${accent}40 0%, transparent 60%)`,
                        animation: 'flash-white-cinematic 0.2s ease-out forwards'
                    }}
                />
            )}

            {/* Scan Container with zoom effect */}
            <div className="relative w-full max-w-sm aspect-[3/4] mb-8 rounded-3xl overflow-hidden" style={{
                border: `2px solid ${accent}50`,
                boxShadow: `0 0 60px ${accentGlow}, 0 0 120px ${accentGlow}40, 0 20px 60px rgba(0,0,0,0.5), inset 0 0 80px rgba(0,0,0,0.5)`,
                animation: 'neon-pulse 3s ease-in-out infinite',
                '--neon-color': accent
            }}>
                {uploadedImage && (
                    <img
                        src={uploadedImage}
                        alt="Analyzing"
                        className="w-full h-full object-cover transition-transform duration-300 ease-out"
                        style={{
                            transform: `scale(${imageZoom})`,
                            filter: 'brightness(0.95)'
                        }}
                    />
                )}

                {/* Scan particles */}
                <ScanParticles color={accent} />

                {/* Horizontal Scanning Line */}
                <div
                    className="absolute left-0 right-0 h-1 pointer-events-none z-20"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                        boxShadow: `0 0 20px ${accent}, 0 0 40px ${accent}, 0 0 60px ${accent}80`,
                        animation: 'scanLine 2.5s ease-in-out infinite'
                    }}
                />

                {/* Vertical Scanning Line */}
                <div
                    className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-20"
                    style={{
                        background: `linear-gradient(180deg, transparent, ${accent}80, transparent)`,
                        boxShadow: `0 0 15px ${accent}, 0 0 30px ${accent}`,
                        animation: 'scan-vertical 3s ease-in-out infinite 0.5s'
                    }}
                />

                {/* Corner Brackets with glow */}
                <div className="absolute top-2 left-2 w-8 h-8 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: accent, boxShadow: `0 0 10px ${accent}` }} />
                <div className="absolute top-2 right-2 w-8 h-8 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: accent, boxShadow: `0 0 10px ${accent}` }} />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: accent, boxShadow: `0 0 10px ${accent}` }} />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: accent, boxShadow: `0 0 10px ${accent}` }} />

                {/* Center crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10" style={{ opacity: 0.3 }}>
                    <div className="w-8 h-0.5 rounded-full" style={{ background: accent }} />
                    <div className="absolute w-0.5 h-8 rounded-full" style={{ background: accent }} />
                </div>

                {/* Progress Overlay - Glassmorphism */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-30" style={{
                    background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)'
                }}>
                    {/* Progress Bar with shimmer */}
                    <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-3 progress-bar-premium" style={{
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        <div
                            className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                            style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                                boxShadow: `0 0 20px ${accent}, 0 0 40px ${accentGlow}`,
                                animation: 'progress-glow 2s ease-in-out infinite',
                                '--progress-color': accent
                            }}
                        >
                            {/* Shimmer effect */}
                            <div className="absolute inset-0" style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer-sweep 2s ease-in-out infinite'
                            }} />
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-black" style={{
                            color: accent,
                            textShadow: `0 0 15px ${accentGlow}, 0 0 30px ${accentGlow}`,
                            animation: progress >= 80 ? 'timer-pulse 0.5s ease-in-out infinite' : 'none'
                        }}>
                            {Math.round(progress)}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 flex items-center gap-2">
                            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                            Analyzing
                        </span>
                    </div>
                </div>
            </div>

            {/* Rotating Copy with fade effect */}
            <div className="h-8 relative z-10 overflow-hidden">
                <p className="text-lg font-bold text-white text-center animate-stagger-fade-up" style={{
                    textShadow: `0 0 30px ${accentGlow}`,
                    animationDuration: '0.5s'
                }} key={copyIndex}>
                    {currentCopy}
                </p>
            </div>

            {/* Animated Checklist - Enhanced with glassmorphism */}
            {!isPro && (
                <div className="mt-6 p-5 rounded-2xl glass-premium relative z-10" style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}>
                    <div className="space-y-2.5 text-left">
                        {freeItems.map((item, idx) => (
                            <div
                                key={item}
                                className={`flex items-center gap-3 text-sm transition-all duration-500 ${checklistVisible[idx] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                                style={{ color: 'rgba(255,255,255,0.8)' }}
                            >
                                <span
                                    className="text-green-400 text-base"
                                    style={{
                                        animation: checklistVisible[idx] ? 'checkmark-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
                                        textShadow: '0 0 10px rgba(0,255,136,0.5)'
                                    }}
                                >✓</span>
                                <span className="font-medium">{item}</span>
                            </div>
                        ))}

                        <div className="h-px my-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

                        {proItems.map((item, idx) => (
                            <div
                                key={item}
                                className={`flex items-center gap-3 text-sm transition-all duration-500 ${checklistVisible[idx + 3] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}
                                style={{ color: 'rgba(255,215,0,0.7)' }}
                            >
                                <span className="text-base" style={{ filter: 'drop-shadow(0 0 5px rgba(255,215,0,0.3))' }}>🔒</span>
                                <span className="font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Cancel Button - Glassmorphism */}
            {onBack && (
                <button
                    onClick={() => {
                        vibrate(20)
                        if (window.confirm('Cancel analysis? Your scan will be refunded.')) {
                            onBack()
                        }
                    }}
                    className="mt-6 px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-95 glass-premium"
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    ✕ Cancel
                </button>
            )}

            <Footer className="opacity-50" />

            <style>{`
                @keyframes scanLine {
                    0% { top: 0; }
                    50% { top: calc(100% - 4px); }
                    100% { top: 0; }
                }
                @keyframes scan-vertical {
                    0% { left: 0; }
                    50% { left: calc(100% - 2px); }
                    100% { left: 0; }
                }
                @keyframes flash-white-cinematic {
                    0% { opacity: 0; }
                    30% { opacity: 1; }
                    100% { opacity: 0; }
                }
            `}</style>
        </div>
    )
}
