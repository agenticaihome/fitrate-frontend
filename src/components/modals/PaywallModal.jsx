import React from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

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
                backdropFilter: 'blur(12px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 max-w-sm w-full border border-white/10 text-center" style={{
                boxShadow: '0 0 80px rgba(0,212,255,0.15)'
            }}>

                {/* Rocket Icon */}
                <div className="text-6xl mb-4">🚀</div>

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

                {/* CTA */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        setShowPaywall(false)
                    }}
                    className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97]"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        color: '#000',
                        boxShadow: '0 4px 20px rgba(0,212,255,0.3)'
                    }}
                >
                    Got it! 👍
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
