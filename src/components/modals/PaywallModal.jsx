import React, { useMemo } from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

// Premium floating particles
const FloatingParticles = () => {
    const particles = useMemo(() =>
        Array.from({ length: 10 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 8,
            duration: 12 + Math.random() * 8,
            opacity: 0.15 + Math.random() * 0.2,
            drift: -15 + Math.random() * 30
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-5px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 2 === 0 ? '#00d4ff' : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? '#00d4ff' : '#fff'}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}
        </div>
    )
}

/**
 * PaywallModal - Coming Soon Pre-Launch Message
 * Replaces payment options with a friendly "launching soon" message
 */
export default function PaywallModal({
    showPaywall,
    setShowPaywall,
    checkoutLoading,
    startCheckout,
    userId
}) {
    if (!showPaywall) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: 'rgba(0,0,0,0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[400px] h-[400px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
                    top: '25%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite'
                }} />
            </div>

            <div className="glass-premium rounded-3xl p-6 max-w-sm w-full border border-white/10 text-center relative overflow-hidden" style={{
                background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)',
                boxShadow: '0 0 80px rgba(0,212,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                animation: 'modal-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <FloatingParticles />

                {/* Rocket Icon with glow */}
                <div className="text-6xl mb-4 relative inline-block" style={{
                    animation: 'float-gentle 3s ease-in-out infinite',
                    filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.5))'
                }}>🚀</div>

                {/* Title */}
                <h2 className="text-2xl font-black text-white mb-2">
                    Launching Soon!
                </h2>

                {/* Subtitle */}
                <p className="text-white/60 text-base mb-6">
                    Premium features are coming soon. Stay tuned!
                </p>

                {/* Free Scans Highlight */}
                <div
                    className="p-5 rounded-2xl mb-6"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,255,136,0.1) 100%)',
                        border: '2px solid rgba(0,212,255,0.3)'
                    }}
                >
                    <div className="text-4xl mb-2">🎁</div>
                    <p className="text-white font-black text-lg mb-1">
                        Enjoy 2 Free Scans Daily!
                    </p>
                    <p className="text-white/50 text-sm">
                        All 12 AI modes available to try
                    </p>
                </div>

                {/* What's Coming */}
                <div className="text-left mb-6">
                    <p className="text-xs font-bold text-white/40 uppercase mb-3 text-center">Coming at Full Launch</p>
                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-3 text-white/70">
                            <span>⚡</span>
                            <span>Unlimited daily scans</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/70">
                            <span>💎</span>
                            <span>Scan packs that never expire</span>
                        </div>
                        <div className="flex items-center gap-3 text-white/70">
                            <span>👑</span>
                            <span>Pro subscriptions with perks</span>
                        </div>
                    </div>
                </div>

                {/* CTA with premium shine */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        setShowPaywall(false)
                    }}
                    className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] btn-premium-shine relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        color: '#000',
                        boxShadow: '0 4px 20px rgba(0,212,255,0.3), 0 0 0 1px rgba(0,212,255,0.3)'
                    }}
                >
                    Got it!
                </button>

                {/* Close link */}
                <button
                    onClick={() => { playSound('click'); setShowPaywall(false) }}
                    className="w-full py-3 mt-2 text-sm text-white/30 font-medium"
                >
                    Close
                </button>
            </div>
        </div>
    )
}
