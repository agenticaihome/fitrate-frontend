import React, { useState, useEffect } from 'react'
import Footer from '../components/common/Footer'
import { playSound, vibrate } from '../utils/soundEffects'

export default function AnalyzingScreen({
    uploadedImage,
    mode,
    isPro,
    onBack, // If user cancels? Usually no back here.
}) {
    const [analysisProgress, setAnalysisProgress] = useState(0)
    const [analysisText, setAnalysisText] = useState(0)

    // Helpers locally scoped
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

    // Analysis messages
    const analysisMessages = mode === 'savage'
        ? ['Preparing total destruction...', 'Loading maximum violence...', 'Calculating devastation...', 'Arming nuclear roasts...', 'Deploying fashion death....']
        : mode === 'roast'
            ? ['Synthesizing social suicide...', 'Detecting fabric failure...', 'Calculating ego damage...', 'Calibrating savagery...', 'Finalizing the damage...']
            : mode === 'honest'
                ? ['Analyzing social positioning...', 'Calculating wardrobe ROI...', 'Synthesizing aesthetic metrics...', 'Detecting style efficiency...', 'Finalizing objective data...']
                : ['Detecting main character signal...', 'Optimizing social ROI...', 'Synthesizing aesthetic value...', 'Calculating aura level...', 'Finalizing the flex...']

    useEffect(() => {
        // Reset progress when mounting
        setAnalysisProgress(0)
        setAnalysisText(0)

        // Progress animation (0-90 over ~8-10s, caps at 90% until API responds)
        const progressInterval = setInterval(() => {
            setAnalysisProgress(p => {
                if (p >= 90) return 90  // Cap at 90%, API response will complete it
                // Slow ramp: 0.5-2% per tick for realistic ~10s duration
                const increment = Math.random() * 1.5 + 0.5
                const next = p + increment
                if (p < 50 && next >= 50) {
                    vibrate(20)
                }
                if (p < 80 && next >= 80) {
                    vibrate(30)
                    playSound('tick')
                }
                return Math.min(90, next)
            })
        }, 200)

        // Rotating text
        const textInterval = setInterval(() => {
            setAnalysisText(t => (t + 1) % 5)
        }, 2000)

        return () => {
            clearInterval(progressInterval)
            clearInterval(textInterval)
        }
    }, [mode])


    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden relative" style={{
            background: '#0a0a0f',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}>
            {/* Full Screen Scanning Container */}
            <div className="relative w-full max-w-sm aspect-[3/4] mb-8 rounded-2xl overflow-hidden" style={{
                border: `2px solid ${accent}40`,
                boxShadow: `0 0 40px ${accentGlow}, inset 0 0 60px rgba(0,0,0,0.5)`
            }}>
                {/* Full Image */}
                {uploadedImage && (
                    <img
                        src={uploadedImage}
                        alt="Analyzing"
                        className="w-full h-full object-cover"
                    />
                )}

                {/* Scanning Line Animation */}
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
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                        <div
                            className="h-full rounded-full transition-all duration-200"
                            style={{
                                width: `${analysisProgress}%`,
                                background: `linear-gradient(90deg, ${accent}, ${accent}cc)`,
                                boxShadow: `0 0 10px ${accent}`
                            }}
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold" style={{ color: accent }}>
                            {Math.round(analysisProgress)}%
                        </span>
                        <span className="text-xs text-white/50">ANALYZING</span>
                    </div>
                </div>
            </div>

            {/* Rotating analysis text */}
            <p className="text-lg font-semibold text-white text-center h-7 transition-opacity duration-300" style={{
                textShadow: `0 0 20px ${accentGlow}`
            }}>
                {analysisMessages[analysisText]}
            </p>

            {/* Pro Features Checklist - Primes users before results */}
            {!isPro && (
                <div className="mt-6 space-y-1.5 text-left">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <span className="text-green-400">✓</span><span>Score + sub-ratings</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <span className="text-green-400">✓</span><span>Celeb style match</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        <span className="text-green-400">✓</span><span>Styling tip</span>
                    </div>
                    <div className="h-px my-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>
                        <span>🔒</span><span>Savage Level (Pro)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>
                        <span>🔒</span><span>Item-by-item roasts (Pro)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>
                        <span>🔒</span><span>Advanced AI analysis (Pro)</span>
                    </div>
                </div>
            )}

            {/* Subtle reassurance */}
            <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {mode === 'roast' ? 'Brutally honest AI incoming...' : mode === 'honest' ? 'Analyzing objectively...' : 'AI analyzing your style...'}
            </p>

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

