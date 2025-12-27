import React, { useMemo } from 'react'
import Footer from '../components/common/Footer'
import { playSound, vibrate } from '../utils/soundEffects'

// Premium floating particles
const FloatingParticles = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 10,
            duration: 12 + Math.random() * 8,
            opacity: 0.15 + Math.random() * 0.2,
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

export default function PaywallScreen({
    screen, // 'paywall' or 'limit-reached'
    mode,
    timeUntilReset,
    onShowPaywall, // setShowPaywall(true)
    onClose // setScreen('home')
}) {
    // Theme colors based on mode
    const theme = useMemo(() => {
        if (mode === 'roast' || mode === 'savage') {
            return { accent: '#ff4444', end: '#ff8800', glow: 'rgba(255,68,68,0.4)' }
        }
        return { accent: '#ffd700', end: '#ff8c00', glow: 'rgba(255,215,0,0.4)' }
    }, [mode])

    const handleCTA = () => {
        playSound('click')
        vibrate(30)
        onShowPaywall()
    }

    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{
            background: 'radial-gradient(ellipse at top, rgba(255,215,0,0.08) 0%, #0a0a0f 50%, #12121f 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            {/* Premium floating particles */}
            <FloatingParticles color={theme.accent} />

            {/* Background Glow with breathing effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] rounded-full" style={{
                    background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
                    top: '30%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite',
                    opacity: 0.25
                }} />
                <div className="absolute w-[300px] h-[300px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
                    bottom: '20%', right: '-10%',
                    animation: 'float-gentle 5s ease-in-out infinite',
                    opacity: 0.2
                }} />
            </div>

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
            }} />

            {/* Logo */}
            <img
                src="/logo.svg"
                alt="FitRate"
                className="h-10 mb-6 opacity-70 relative z-10"
            />

            {/* Content Card - Glassmorphism */}
            <div
                className="glass-premium p-8 rounded-3xl text-center relative z-10 max-w-sm w-full"
                style={{
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                    animation: 'modal-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    border: '1px solid rgba(255,255,255,0.08)'
                }}
            >
                {/* Icon with Glow and breathing effect */}
                <div className="relative inline-block mb-4">
                    <div
                        className="absolute inset-0 rounded-full blur-2xl"
                        style={{
                            background: mode === 'roast' ? '#ff4444' : '#ffd700',
                            animation: 'glow-breathe 3s ease-in-out infinite',
                            opacity: 0.4
                        }}
                    />
                    <span
                        className="text-6xl relative block"
                        style={{
                            filter: 'drop-shadow(0 0 25px rgba(255,215,0,0.6))',
                            animation: 'float-gentle 3s ease-in-out infinite'
                        }}
                    >
                        {mode === 'roast' ? '🔥' : screen === 'limit-reached' ? '⏳' : '👑'}
                    </span>
                </div>

                <h2 className="text-2xl font-black text-white mb-2">
                    {screen === 'limit-reached' ? "You've used today's free scans" : 'Upgrade to Pro'}
                </h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Unlock 25 ratings per day'}
                </p>

                {/* Pro Benefits with staggered reveal */}
                <div className="space-y-2 mb-6 text-left">
                    {[
                        { icon: '⚡', text: '25 ratings per day' },
                        { icon: '🎭', text: '6 Pro modes: Honest, Savage, Rizz & more' },
                        { icon: '📊', text: 'Precision scoring (87.4 vs 87)' },
                        { icon: '🏆', text: '1 Weekly Challenge entry/day' },
                        { icon: '✨', text: 'Golden Insights + Pro Tips' }
                    ].map((benefit, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-xl animate-stagger-fade-up"
                            style={{
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                opacity: 0,
                                animationDelay: `${0.1 + index * 0.08}s`
                            }}
                        >
                            <span className="text-lg">{benefit.icon}</span>
                            <span className="text-sm text-white/80 font-medium">{benefit.text}</span>
                        </div>
                    ))}
                </div>

                {/* CTA Button with premium shine effect */}
                <button
                    onClick={handleCTA}
                    className="btn-physical btn-premium-shine w-full py-4 rounded-2xl text-black font-black text-lg relative overflow-hidden transition-all active:scale-[0.97]"
                    style={{
                        background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                        boxShadow: '0 6px 0 rgba(180,130,0,0.5), 0 8px 30px rgba(255,215,0,0.4)',
                        minHeight: '56px'
                    }}
                >
                    👑 View Options
                </button>

                {/* Back button */}
                <button
                    onClick={handleClose}
                    className="w-full mt-4 py-3 text-sm font-medium transition-all active:scale-95 glass-premium rounded-xl"
                    style={{
                        color: 'rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    ← Maybe later
                </button>
            </div>

            <Footer className="opacity-50 pb-8" />
        </div>
    )
}
