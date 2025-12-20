import React, { useState, useEffect } from 'react'
import Footer from '../components/common/Footer'
import { getScoreColor, getPercentile } from '../utils/scoreUtils'
import { downloadImage } from '../utils/imageUtils'

export default function ResultsScreen({
    scores,
    mode,
    uploadedImage,
    isPro,
    scansRemaining,
    onReset,
    onSetMode,
    onGenerateShareCard,
    onShowPaywall,
    onBack, // If applicable
    playSound,
    vibrate
}) {
    const [revealStage, setRevealStage] = useState(0)
    const [displayedScore, setDisplayedScore] = useState(0)

    // Merged Animation Logic
    useEffect(() => {
        if (!scores) return

        setRevealStage(0)
        setDisplayedScore(0)

        // Sound & Haptics for Verdict (Immediate)
        const sound = scores.isLegendary ? 'legendary' : (scores.roastMode ? 'roast' : 'success')
        // Slight delay for sound to match verdict reveal
        const initialTimer = setTimeout(() => {
            playSound(sound)
            vibrate(scores.isLegendary ? [100, 50, 100, 50, 200] : (scores.roastMode ? [50, 50, 200] : [50, 50, 50]))
            setRevealStage(1) // Verdict Reveal
        }, 100)

        // Score Counting Animation
        const duration = 1200
        const start = Date.now() + 600 // Start after 600ms delay
        const endScore = scores.overall

        let animationFrameId

        const animateScore = () => {
            const now = Date.now()
            const elapsed = now - start
            if (elapsed < 0) {
                animationFrameId = requestAnimationFrame(animateScore)
                return
            }

            const progress = Math.min(elapsed / duration, 1)
            // EaseOutExpo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
            const currentScore = Math.floor(easeProgress * endScore)

            setDisplayedScore(currentScore)

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animateScore)
            }
        }

        const timers = [
            initialTimer,
            setTimeout(() => {
                setRevealStage(2) // Photo & Score Start
                requestAnimationFrame(animateScore)
                playSound('pop')
                vibrate(10)
            }, 600),
            setTimeout(() => {
                setRevealStage(3) // Details
                playSound('pop')
            }, 1000),
            setTimeout(() => setRevealStage(4), 1300), // Tip
            setTimeout(() => setRevealStage(5), 1600), // Breakdown
            setTimeout(() => setRevealStage(6), 2000), // Share Button
        ]

        if (navigator.vibrate) {
            setTimeout(() => navigator.vibrate(50), 600)
        }

        return () => {
            timers.forEach(t => clearTimeout(t))
            cancelAnimationFrame(animationFrameId)
        }
    }, [scores, playSound, vibrate]) // Re-run if scores change

    // Helpers for Mode Styles
    const modeAccent = (() => {
        switch (scores.mode) {
            case 'savage': return '#8b00ff'
            case 'roast': return '#ff4444'
            case 'honest': return '#0077ff'
            default: return '#00d4ff'
        }
    })()

    const modeGlow = (() => {
        switch (scores.mode) {
            case 'savage': return 'rgba(139,0,255,0.4)'
            case 'roast': return 'rgba(255,68,68,0.4)'
            case 'honest': return 'rgba(0,119,255,0.4)'
            default: return 'rgba(0,212,255,0.4)'
        }
    })()

    const modeGradientEnd = (() => {
        switch (scores.mode) {
            case 'savage': return '#ff0044'
            case 'roast': return '#ff8800'
            case 'honest': return '#00d4ff'
            default: return '#00ff88'
        }
    })()

    return (
        <div className="min-h-screen flex flex-col items-center p-4 overflow-x-hidden relative" style={{
            background: '#0a0a0f',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
        }}>
            {/* DOPAMINE GLOW */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] rounded-full opacity-25 blur-[120px] animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${modeAccent} 0%, ${modeGradientEnd} 40%, transparent 70%)`,
                        animationDuration: '4s'
                    }}
                />
            </div>

            {/* OVERALL SCORE */}
            <div className={`relative mb-3 transition-all duration-700 ${revealStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke={modeAccent}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${displayedScore * 2.83} 283`}
                            style={{
                                transition: 'stroke-dasharray 1s ease-out',
                                filter: `drop-shadow(0 0 15px ${modeAccent})`
                            }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black" style={{ color: modeAccent }}>{displayedScore}</span>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '-4px' }}>/ 100</span>
                    </div>
                </div>

                {/* Certified Badge */}
                {scores.overall >= 90 && (
                    <div className="absolute -top-2 -right-6 rotate-12 animate-in zoom-in-50 duration-500 delay-700">
                        <div className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-lg shadow-yellow-400/20">
                            DRIP APPROVED
                        </div>
                    </div>
                )}
            </div>

            {/* Verdict & Tagline */}
            <div className={`flex flex-col items-center gap-2 mb-6 transition-all duration-700 delay-100 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-2xl font-black text-white text-center px-4" style={{
                    textShadow: `0 0 30px ${modeAccent}66`,
                    lineHeight: 1.1
                }}>
                    {scores.verdict}
                </p>

                {scores.lines && scores.lines.length >= 2 && (
                    <div className="flex flex-col items-center gap-1.5 mt-2">
                        <p className="text-sm font-semibold text-white/80 italic text-center max-w-[280px]">"{scores.lines[0]}"</p>
                        <p className="text-sm font-semibold text-white/80 italic text-center max-w-[280px]">"{scores.lines[1]}"</p>
                    </div>
                )}

                <div className="mt-5 px-6 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl" style={{
                    borderColor: `${modeAccent}33`
                }}>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{
                        color: modeAccent,
                        textShadow: `0 0 15px ${modeAccent}66`
                    }}>
                        {scores.tagline}
                    </p>
                </div>
            </div>

            {/* Social Proof */}
            <div className={`mb-4 transition-all duration-500 delay-200 text-center ${revealStage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                <p className="text-sm font-bold mb-1" style={{
                    color: scores.overall >= 80 ? '#00ff88' : (scores.overall >= 60 ? '#00d4ff' : '#ff6b6b')
                }}>
                    {(() => {
                        if (scores.roastMode) {
                            if (scores.mode === 'savage') {
                                if (scores.overall >= 40) return '💀 YOU SURVIVED (Barely)'
                                if (scores.overall >= 20) return '🩸 AI drew blood'
                                return '☠️ ABSOLUTE ANNIHILATION'
                            }
                            if (scores.overall >= 60) return '😏 You survived'
                            if (scores.overall >= 45) return '💀 Rough day for your closet'
                            return '☠️ AI showed no mercy'
                        } else if (scores.mode === 'honest') {
                            if (scores.overall >= 95) return '💎 STYLE GOD — Pure Perfection'
                            if (scores.overall >= 85) return '🔥 Post this immediately'
                            if (scores.overall >= 70) return '👍 Solid fit, respectable'
                            if (scores.overall >= 55) return '📊 Average range'
                            return '📉 Needs work'
                        } else {
                            if (scores.overall >= 90) return '🔥 LEGENDARY — Post this NOW'
                            if (scores.overall >= 80) return '✨ Main character energy'
                            if (scores.overall >= 70) return '💅 Serve! TikTok would approve'
                            if (scores.overall >= 60) return '👀 Cute! Minor tweaks = viral'
                            return '💪 Good foundation, keep styling!'
                        }
                    })()}
                </p>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Better than {scores.percentile}% of fits today
                </p>
            </div>

            {/* PHOTO PREVIEW */}
            <div className={`w-full max-w-xs mb-8 transition-all duration-700 delay-300 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="relative group">
                    {/* Shimmering border for top scores */}
                    {scores.overall >= 90 && (
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 rounded-[34px] opacity-30 blur-sm animate-pulse" />
                    )}
                    <div className={`w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl relative ${scores.overall >= 95 ? 'card-golden' : ''}`} style={{
                        border: scores.overall >= 95 ? 'none' : `2px solid ${modeAccent}44`,
                        boxShadow: scores.overall >= 95 ? undefined : `0 20px 60px rgba(0,0,0,0.6), inset 0 0 40px ${modeAccent}11`
                    }}>
                        <img src={uploadedImage} alt="Your outfit being rated" className="w-full h-full object-cover" />

                        {/* Branding */}
                        <div className="absolute top-4 left-4 opacity-40">
                            <span className="text-[10px] font-black text-white tracking-widest uppercase">FitRate.app</span>
                        </div>

                        {/* Pro Tip Overlay */}
                        {isPro && scores.proTip && revealStage >= 4 && (
                            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/60 backdrop-blur-md border animate-in fade-in slide-in-from-bottom-2" style={{
                                borderColor: `${modeAccent}33`
                            }}>
                                <span className="text-[9px] font-black uppercase tracking-widest block mb-1" style={{ color: modeAccent }}>💡 Pro Suggestion</span>
                                <p className="text-xs text-white/90 font-medium">"{scores.proTip}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* GOLDEN INSIGHT (PRO) */}
            <div className={`w-full max-w-xs mb-6 transition-all duration-700 delay-500 ${revealStage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                {isPro && (
                    <div className="card-physical p-5 border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_40px_rgba(0,212,255,0.15)]" style={{
                        borderColor: `${modeAccent}50`,
                        backgroundColor: `${modeAccent}15`,
                        boxShadow: `0 0 40px ${modeGlow}`
                    }}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm">✨</span>
                            <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: modeAccent }}>Golden Insight</span>
                        </div>
                        <div className="space-y-4 text-left">
                            {scores.identityReflection && (
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Identity Reflection</span>
                                    <p className="text-sm text-white font-medium leading-relaxed">{scores.identityReflection}</p>
                                </div>
                            )}
                            {scores.socialPerception && (
                                <div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Social Perception</span>
                                    <p className="text-sm text-white font-medium leading-relaxed">{scores.socialPerception}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* SUB-RATINGS & ROASTS */}
            <div className={`w-full max-w-xs mb-8 transition-all duration-700 delay-700 ${revealStage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[{ l: 'Color', s: scores.color }, { l: 'Fit', s: scores.fit }, { l: 'Style', s: scores.style }].map(x => (
                        <div key={x.l} className="text-center p-2 rounded-xl bg-white/5">
                            <p className="text-[9px] text-white/30 uppercase font-black mb-1">{x.l}</p>
                            <p className="text-lg font-bold" style={{ color: getScoreColor(x.s) }}>{x.s}</p>
                        </div>
                    ))}
                </div>

                {scores.savageLevel && (
                    <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 text-left">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Savage Level</span>
                            <span className="text-lg font-black text-red-500">{scores.savageLevel}/10 🔥</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${scores.savageLevel * 10}%` }} />
                        </div>
                        {scores.itemRoasts && (
                            <div className="mt-4 space-y-2">
                                {Object.entries(scores.itemRoasts).filter(([_, r]) => r && r !== 'N/A').map(([k, v]) => (
                                    <div key={k} className="text-xs text-white/80 leading-snug">
                                        <span className="font-black text-red-500/70 uppercase text-[9px] mr-2">{k}:</span>
                                        {v}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* CTAs */}
            <div className={`w-full max-w-xs transition-all duration-700 delay-1000 ${revealStage >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <button
                    onClick={onGenerateShareCard}
                    aria-label="Share your outfit rating to social media"
                    className="btn-physical animate-pulse-glow w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 overflow-hidden group mb-4"
                    style={{
                        background: `linear-gradient(135deg, ${modeGradientEnd} 0%, ${modeAccent} 100%)`,
                        boxShadow: `0 10px 40px ${modeGlow}, var(--shadow-physical)`,
                        color: (scores.mode === 'roast' || scores.mode === 'savage') ? 'white' : 'black'
                    }}
                >
                    <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" aria-hidden="true" />
                    <span className="text-2xl" aria-hidden="true">📤</span> SHARE THIS FIT
                </button>

                <button
                    onClick={onReset}
                    aria-label="Rate another outfit"
                    className="btn-physical w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest active:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                    <span aria-hidden="true">🔄</span>
                    {scores.overall >= 85 ? "Can you beat this? Scan again" :
                        scores.overall < 50 ? "Redeem yourself? Try again" :
                            "Rate Another Fit"}
                </button>

                {/* Daily Limit Tracker */}
                {!isPro && (
                    <p className="text-center text-[10px] uppercase font-bold tracking-widest mt-3 transition-opacity duration-300" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {scansRemaining > 0 ? `⚡ ${scansRemaining} free scan${scansRemaining !== 1 ? 's' : ''} left today` : 'Daily limit reached • Reset in 12h'}
                    </p>
                )}

                {/* Mode Switch Teaser (Nice -> Roast) */}
                {!isPro && scores.mode === 'nice' && (
                    <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2 delay-1000">
                        <p className="text-[10px] text-white/40 mb-1.5 font-medium">Too nice? Try the viral Roast Mode</p>
                        <button
                            onClick={() => { onSetMode('roast'); onReset(); }}
                            aria-label="Try Roast Mode for more honest feedback"
                            className="text-xs text-red-400 font-black uppercase tracking-wider border-b border-red-400/30 pb-0.5 hover:text-red-300 transition-colors"
                        >
                            See what AI really thinks <span aria-hidden="true">😈</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Confetti */}
            {scores.overall >= 90 && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="absolute animate-bounce" style={{
                            left: `${Math.random() * 100}%`,
                            top: `${-20 - Math.random() * 50}px`,
                            width: '8px',
                            height: '8px',
                            background: ['#ffd700', modeGradientEnd, modeAccent][i % 3],
                            borderRadius: '50%',
                            animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                            animationDelay: `${Math.random() * 3}s`
                        }} />
                    ))}
                </div>
            )}

            <Footer className="opacity-50 pb-8" />

            <style>{`
                @keyframes fall {
                    to { transform: translateY(100vh) rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
