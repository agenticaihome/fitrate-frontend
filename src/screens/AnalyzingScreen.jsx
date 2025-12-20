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
        <div className="min-h-screen flex flex-col items-center justify-center p-8 overflow-hidden relative" style={{
            background: '#0a0a0f',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
        }}>
            {/* Background Image Blur */}
            {uploadedImage && (
                <div className="absolute inset-0 opacity-20 blur-3xl scale-110 pointer-events-none">
                    <img src={uploadedImage} alt="Background" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60" />
                </div>
            )}

            {/* Scanning Animation Container */}
            <div className="relative w-64 h-64 mb-12">
                {/* Central Photo */}
                <div className="absolute inset-4 rounded-full overflow-hidden border-4 z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)]" style={{
                    borderColor: `${accent}40`,
                    boxShadow: `0 0 30px ${accentGlow}`
                }}>
                    <img src={uploadedImage} alt="Analyzing" className="w-full h-full object-cover opacity-80" />
                    {/* Scanning overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent w-full h-1/4 animate-[scanLine_2s_linear_infinite]" style={{
                        boxShadow: `0 0 20px ${accent}`
                    }} />
                </div>

                {/* Outer Rotating Rings */}
                <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r="48"
                        fill="none"
                        stroke={accent}
                        strokeWidth="1"
                        strokeDasharray="10 5"
                        className="opacity-50"
                    />
                </svg>
                <svg className="absolute inset-0 w-full h-full animate-reverse-spin" viewBox="0 0 100 100">
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8"
                    />
                    {/* Progress ring */}
                    <circle
                        cx="50" cy="50" r="45"
                        fill="none"
                        stroke={accent}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${analysisProgress * 2.83} 283`}
                        style={{
                            filter: `drop-shadow(0 0 10px ${accent})`,
                            transition: 'stroke-dasharray 0.1s ease-out'
                        }}
                    />
                </svg>
                {/* Percentage text */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black" style={{ color: accent }}>
                        {Math.round(analysisProgress)}%
                    </span>
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
