import React from 'react'
import ModalHeader from '../common/ModalHeader'
import { PRICES } from '../../config/constants'
import { playSound } from '../../utils/soundEffects'

/**
 * PaywallModal - Clash of Clans style: Scan Packs only
 * All modes are FREE, just buy scans when you run out
 */
export default function PaywallModal({
    showPaywall,
    setShowPaywall,
    showDeclineOffer,
    setShowDeclineOffer,
    declineCountdown,
    checkoutLoading,
    startCheckout
}) {
    if (!showPaywall) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="paywall-title"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-sm w-full border border-cyan-500/20 relative max-h-[90vh] overflow-y-auto" style={{
                boxShadow: '0 0 60px rgba(0,212,255,0.1)'
            }}>
                <ModalHeader
                    title="Get More Scans"
                    subtitle="All 8 modes included free!"
                    icon="💎"
                    onClose={() => {
                        playSound('click')
                        setShowPaywall(false)
                    }}
                />

                {/* All Modes Free Badge */}
                <div className="flex items-center justify-center gap-2 mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-lg">✅</span>
                    <span className="text-sm font-bold text-emerald-400">All 8 AI Modes Unlocked Free!</span>
                </div>

                {/* 🎟️ SCAN PACKS - Main Focus */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    {/* 5 Scans - Starter */}
                    <button
                        onClick={() => startCheckout('starterPack')}
                        disabled={checkoutLoading}
                        aria-label="Buy 5 scans for $1.99"
                        className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px] transition-all active:scale-95"
                        style={{
                            background: 'rgba(100,200,255,0.08)',
                            border: '1.5px solid rgba(100,200,255,0.3)'
                        }}
                    >
                        <span className="block text-4xl font-black text-cyan-400 mb-1">5</span>
                        <span className="block text-xs text-gray-400 uppercase font-bold mb-2 tracking-wide">Scans</span>
                        <span className="block text-lg font-black text-white">$1.99</span>
                        <span className="block text-[10px] text-white/40">$0.40/scan</span>
                    </button>

                    {/* 15 Scans - Most Popular */}
                    <button
                        onClick={() => startCheckout('popularPack')}
                        disabled={checkoutLoading}
                        aria-label="Buy 15 scans for $3.99. Most popular."
                        className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden transition-all active:scale-95"
                        style={{
                            background: 'rgba(0,212,255,0.15)',
                            border: '2px solid #00d4ff',
                            boxShadow: '0 0 25px rgba(0,212,255,0.3)'
                        }}
                    >
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[9px] font-black py-1 text-center uppercase tracking-wider">
                            Most Popular
                        </div>
                        <span className="block text-5xl font-black text-cyan-400 mb-1 mt-2">15</span>
                        <span className="block text-xs text-cyan-400/80 uppercase font-bold mb-2 tracking-wide">Scans</span>
                        <span className="block text-lg font-black text-white">$3.99</span>
                        <span className="block text-[10px] text-emerald-400">$0.27/scan • Save 33%</span>
                    </button>

                    {/* 50 Scans - Best Value (Full Width) */}
                    <button
                        onClick={() => startCheckout('powerPack')}
                        disabled={checkoutLoading}
                        aria-label={`Buy 50 scans for ${PRICES.SCAN_PACK_50} dollars. Best value.`}
                        className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px] col-span-2 relative overflow-hidden transition-all active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,140,0,0.1) 100%)',
                            border: '2px solid rgba(255,215,0,0.4)',
                            boxShadow: '0 0 30px rgba(255,215,0,0.2)'
                        }}
                    >
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-black text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                            Best Value
                        </div>
                        <span className="block text-6xl font-black text-yellow-400 mb-1">50</span>
                        <span className="block text-sm text-yellow-400/80 uppercase font-bold mb-2 tracking-wide">Scans</span>
                        <span className="block text-xl font-black text-white">${PRICES.SCAN_PACK_50}</span>
                        <span className="block text-xs text-emerald-400 font-bold">$0.20/scan • Save 50%!</span>
                    </button>
                </div>


                {/* How It Works */}
                <div className="mb-5 p-4 rounded-2xl bg-white/5 border border-white/10">
                    <h4 className="text-xs font-black text-white/60 uppercase tracking-widest mb-3 text-center">How It Works</h4>
                    <div className="space-y-2 text-[11px] text-white/70">
                        <div className="flex items-center gap-2">
                            <span className="text-base">📸</span>
                            <span>2 free scans every day (resets at midnight)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-base">💎</span>
                            <span>Purchased scans never expire</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-base">✨</span>
                            <span>All 8 AI modes always available</span>
                        </div>
                    </div>
                </div>

                {/* Reassurance + Close */}
                <p className="text-center text-[10px] text-gray-500 mb-3">
                    🔐 Secure checkout · Instant access
                </p>
                <button
                    onClick={() => {
                        playSound('click')
                        setShowPaywall(false)
                    }}
                    aria-label="Close and go back"
                    className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60"
                >
                    ← Not now
                </button>
            </div>
        </div>
    )
}
