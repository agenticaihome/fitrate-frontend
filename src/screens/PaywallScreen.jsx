import React, { useMemo } from 'react'
import Footer from '../components/common/Footer'

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
        return { accent: '#00d4ff', end: '#00ff88', glow: 'rgba(0,212,255,0.4)' }
    }, [mode])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{
            background: 'radial-gradient(ellipse at top, rgba(0,212,255,0.08) 0%, #0a0a0f 50%, #12121f 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] rounded-full opacity-20" style={{
                    background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
                    top: '30%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'pulse 4s ease-in-out infinite'
                }} />
            </div>

            {/* Content Card */}
            <div className="glass-card p-8 rounded-3xl text-center relative z-10 max-w-sm w-full" style={{
                boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation: 'cardSlideUp 0.5s ease-out'
            }}>
                {/* Icon with Glow */}
                <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-50" style={{
                        background: mode === 'roast' ? '#ff4444' : '#ffd700'
                    }} />
                    <span className="text-6xl relative block" style={{
                        filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))'
                    }}>{mode === 'roast' ? '🔥' : screen === 'limit-reached' ? '⏳' : '👑'}</span>
                </div>

                <h2 className="text-2xl font-black text-white mb-2">
                    {screen === 'limit-reached' ? "You've used today's free scans" : 'Upgrade to Pro'}
                </h2>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Unlock 25 ratings per day'}
                </p>

                {/* Pro Benefits */}
                <div className="space-y-2 mb-6 text-left">
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03]">
                        <span className="text-lg">⚡</span>
                        <span className="text-sm text-white/80 font-medium">25 ratings per day</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03]">
                        <span className="text-lg">🎯</span>
                        <span className="text-sm text-white/80 font-medium">All AI modes unlocked</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03]">
                        <span className="text-lg">✨</span>
                        <span className="text-sm text-white/80 font-medium">Advanced style insights</span>
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={onShowPaywall}
                    className="btn-physical btn-shine w-full py-4 rounded-2xl text-black font-black text-lg relative overflow-hidden"
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
                    onClick={onClose}
                    className="w-full mt-4 py-3 text-sm font-medium transition-all active:scale-95 hover:text-white/60"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    ← Maybe later
                </button>
            </div>

            <Footer className="opacity-50 pb-8" />
        </div>
    )
}
