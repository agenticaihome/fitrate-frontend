import React, { useState, useEffect, useRef } from 'react'
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
    const pauseRef = useRef(false)

    // Mode colors
    const getModeColor = () => {
        if (mode === 'savage') return '#8b00ff'
        if (mode === 'roast') return '#ff4444'
        if (mode === 'honest') return '#4A90D9'
        return '#00d4ff'
    }

    const getModeGlow = () => {
        if (mode === 'savage') return 'rgba(139,0,255,0.4)'
        if (mode === 'roast') return 'rgba(255,68,68,0.4)'
        if (mode === 'honest') return 'rgba(74,144,217,0.4)'
        return 'rgba(0,212,255,0.4)'
    }

    const accent = getModeColor()
    const accentGlow = getModeGlow()

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

                // Micro-pause logic
                if (p >= 14 && p < 16) {
                    pauseRef.current = true
                    setTimeout(() => { pauseRef.current = false }, 400)
                    return 16
                }
                if (p >= 44 && p < 46) {
                    pauseRef.current = true
                    setTimeout(() => { pauseRef.current = false }, 600)
                    return 46
                }
                if (p >= 79 && p < 81) {
                    pauseRef.current = true
                    vibrate(30)
                    playSound('tick')
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

    // Animate checklist items one by one
    useEffect(() => {
        const delays = [300, 800, 1300, 2200, 2800, 3400]
        const timers = delays.map((delay, idx) =>
            setTimeout(() => {
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
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full opacity-20" style={{
                    background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
                    top: '30%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'pulse 3s ease-in-out infinite'
                }} />
            </div>

            {/* Scan Container */}
            <div className="relative w-full max-w-sm aspect-[3/4] mb-8 rounded-3xl overflow-hidden" style={{
                border: `2px solid ${accent}50`,
                boxShadow: `0 0 60px ${accentGlow}, 0 20px 60px rgba(0,0,0,0.5), inset 0 0 80px rgba(0,0,0,0.5)`
            }}>
                {uploadedImage && (
                    <img
                        src={uploadedImage}
                        alt="Analyzing"
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Scanning Line */}
                <div
                    className="absolute left-0 right-0 h-1 pointer-events-none"
                    style={{
                        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
                        boxShadow: `0 0 20px ${accent}, 0 0 40px ${accent}`,
                        animation: 'scanLine 2.5s ease-in-out infinite'
                    }}
                />

                {/* Corner Brackets */}
                <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2" style={{ borderColor: accent }} />
                <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2" style={{ borderColor: accent }} />
                <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2" style={{ borderColor: accent }} />
                <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2" style={{ borderColor: accent }} />

                {/* Progress Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden mb-3" style={{
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        <div
                            className="h-full rounded-full transition-all duration-300 ease-out"
                            style={{
                                width: `${progress}%`,
                                background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                                boxShadow: `0 0 15px ${accent}, 0 0 30px ${accentGlow}`
                            }}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-black" style={{ color: accent, textShadow: `0 0 10px ${accentGlow}` }}>
                            {Math.round(progress)}%
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">Analyzing</span>
                    </div>
                </div>
            </div>

            {/* Rotating Copy */}
            <p className="text-lg font-bold text-white text-center h-7 transition-opacity duration-500 relative z-10" style={{
                textShadow: `0 0 30px ${accentGlow}`
            }}>
                {currentCopy}
            </p>

            {/* Animated Checklist */}
            {!isPro && (
                <div className="mt-6 p-4 rounded-2xl glass-card relative z-10" style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}>
                    <div className="space-y-2 text-left">
                        {freeItems.map((item, idx) => (
                            <div
                                key={item}
                                className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${checklistVisible[idx] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                                style={{ color: 'rgba(255,255,255,0.7)' }}
                            >
                                <span className="text-green-400 text-sm">✓</span>
                                <span className="font-medium">{item}</span>
                            </div>
                        ))}

                        <div className="h-px my-2" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />

                        {proItems.map((item, idx) => (
                            <div
                                key={item}
                                className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${checklistVisible[idx + 3] ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
                                style={{ color: 'rgba(255,215,0,0.6)' }}
                            >
                                <span className="text-sm">🔒</span>
                                <span className="font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Footer className="opacity-50" />

            <style>{`
                @keyframes scanLine { 
                    0% { top: 0; } 
                    50% { top: calc(100% - 4px); } 
                    100% { top: 0; } 
                }
            `}</style>
        </div>
    )
}
