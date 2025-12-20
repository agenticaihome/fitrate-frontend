import React from 'react'
import ModalHeader from '../common/ModalHeader'
import { PRICES } from '../../config/constants'
import { playSound } from '../../utils/soundEffects'

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)'
        }}>
            {/* Decline Offer Popup - higher z-index to overlay main paywall */}
            {showDeclineOffer && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{
                    background: 'rgba(0,0,0,0.95)'
                }}>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-sm w-full border border-yellow-500/30 relative" style={{
                        boxShadow: '0 0 60px rgba(255,215,0,0.2)'
                    }}>
                        {/* Close X for decline offer */}
                        <button
                            onClick={() => {
                                setShowDeclineOffer(false)
                                setShowPaywall(false)
                            }}
                            className="absolute top-3 right-3 text-gray-500 hover:text-white text-xl p-1"
                            aria-label="Close"
                        >
                            ×
                        </button>
                        <p className="text-yellow-400 font-bold text-lg mb-2">⏰ Wait!</p>
                        <h2 className="text-white text-2xl font-black mb-4">First week on us...</h2>

                        <p className="text-gray-400 mb-2">
                            Get Pro for just <span className="text-yellow-400 font-bold">$1.99/week</span> for your first month
                            <br />
                            <span className="text-xs">(then ${PRICES.PRO_WEEKLY}/week, cancel anytime)</span>
                        </p>

                        {/* Countdown Timer */}
                        {declineCountdown && (
                            <p className="text-center mb-4 text-yellow-400/80 font-bold">
                                ⏳ Offer expires in {Math.floor(declineCountdown / 60)}:{String(declineCountdown % 60).padStart(2, '0')}
                            </p>
                        )}

                        <button
                            onClick={() => startCheckout('proWeeklyDiscount')}
                            disabled={checkoutLoading}
                            className="btn-stable-width w-full py-4 rounded-2xl text-black font-bold text-lg mb-3 transition-all duration-100 active:scale-[0.97] disabled:opacity-70"
                            style={{
                                background: 'linear-gradient(135deg, #ffd700 0%, #ffb800 100%)',
                                boxShadow: '0 8px 30px rgba(255,215,0,0.35)'
                            }}
                        >
                            {checkoutLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                    Loading...
                                </span>
                            ) : '🔥 Claim This Deal'}
                        </button>

                        <p className="text-center text-[10px] text-gray-500 mb-3">
                            🔐 Secure checkout · Cancel anytime
                        </p>

                        <button
                            onClick={() => {
                                setShowDeclineOffer(false)
                                setShowPaywall(false)
                            }}
                            className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60"
                        >
                            No thanks
                        </button>
                    </div>
                </div>
            )}

            {/* Main Paywall */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-sm w-full border border-cyan-500/20 relative max-h-[90vh] overflow-y-auto" style={{
                boxShadow: '0 0 60px rgba(0,212,255,0.1)'
            }}>
                <ModalHeader
                    title="Unlock Pro"
                    subtitle="Get the full breakdown"
                    icon="⚡"
                    onClose={() => {
                        playSound('click')
                        setShowPaywall(false)
                    }}
                />

                {/* 👑 PRO SUBSCRIPTION - Best Value */}
                <div className="relative w-full mb-5">
                    <button
                        onClick={() => startCheckout('proWeekly')}
                        disabled={checkoutLoading}
                        className="btn-physical w-full p-4 rounded-3xl text-left transition-all group relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ffb800 100%)',
                            border: '2px solid rgba(255,255,255,0.3)',
                            boxShadow: 'var(--shadow-physical), 0 0 40px rgba(255,215,0,0.25)'
                        }}
                    >
                        {/* Best Value Badge */}
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider z-10" style={{
                            boxShadow: '-2px 2px 10px rgba(255,68,68,0.3)'
                        }}>
                            Best Value
                        </div>

                        {/* Shine effect */}
                        <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000 pointer-events-none" />

                        {/* Header: Crown + Title + Price */}
                        <div className="flex flex-col w-full relative z-10">
                            <div className="flex items-center gap-3 mb-3 pr-8">
                                <span className="text-2xl sm:text-3xl flex-shrink-0">👑</span>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-black text-lg sm:text-2xl font-black leading-tight truncate">Pro Weekly</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black text-black">${PRICES.PRO_WEEKLY}</span>
                                        <span className="text-black/60 text-sm font-bold">/wk</span>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Lock Tease - The Core "Non-Greedy" Hook */}
                            <div className="flex items-center gap-2 mb-3 bg-black/10 p-2 rounded-lg">
                                <span className="text-[10px] uppercase font-black text-black/60 mr-1">Modes:</span>
                                <div className="flex gap-2 text-lg">
                                    <span title="Nice">😌</span>
                                    <span title="Roast">🔥</span>
                                    <div className="relative">
                                        <span>🧠</span>
                                        <div className="absolute -top-1 -right-1 text-[8px] bg-black text-white px-1 rounded-full">🔒</div>
                                    </div>
                                    <div className="relative">
                                        <span>😈</span>
                                        <div className="absolute -top-1 -right-1 text-[8px] bg-black text-white px-1 rounded-full">🔒</div>
                                    </div>
                                </div>
                            </div>

                            {/* Benefits - Precision Focus */}
                            <div className="space-y-1.5 pl-1">
                                {[
                                    'GPT-4o High-Fidelity Analysis',
                                    'Expert Style Critique',
                                    'Unlock Honest & Savage Modes',
                                    'Precision Scoring (e.g. 87.4)'
                                ].map((benefit, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm font-bold text-black/90">
                                        <span className="text-black text-sm flex-shrink-0">✓</span>
                                        <span className="truncate">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </button>
                </div>

                <p className="text-center text-[10px] font-bold text-gray-500 mb-4 tracking-wider uppercase">— OR PAY AS YOU GO —</p>

                {/* 🎟️ SCAN PACKS - 2-Column Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* 5 Scans */}
                    <button
                        onClick={() => startCheckout('starterPack')}
                        disabled={checkoutLoading}
                        className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px]"
                        style={{
                            background: 'rgba(100,200,255,0.08)',
                            border: '1.5px solid rgba(100,200,255,0.3)'
                        }}
                    >
                        <span className="block text-4xl font-black text-cyan-400 mb-1">5</span>
                        <span className="block text-xs text-gray-400 uppercase font-bold mb-2 tracking-wide">Pro Scans</span>
                        <span className="block text-[10px] text-yellow-400/80 mb-2">⚡ GPT-4o • All 4 modes</span>
                        <span className="block text-lg font-black text-white">$1.99</span>
                    </button>

                    {/* 15 Scans - Highlighted */}
                    <button
                        onClick={() => startCheckout('popularPack')}
                        disabled={checkoutLoading}
                        className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden"
                        style={{
                            background: 'rgba(0,212,255,0.15)',
                            border: '2px solid #00d4ff',
                            boxShadow: 'var(--shadow-physical), 0 0 25px rgba(0,212,255,0.3)'
                        }}
                    >
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400" />
                        <span className="block text-5xl font-black text-cyan-400 mb-1">15</span>
                        <span className="block text-xs text-cyan-400/80 uppercase font-bold mb-2 tracking-wide">Pro Scans</span>
                        <span className="block text-[10px] text-yellow-400/80 mb-2">⚡ GPT-4o • All 4 modes</span>
                        <span className="block text-lg font-black text-white">$3.99</span>
                    </button>

                    {/* 50 Scans */}
                    <button
                        onClick={() => startCheckout('powerPack')}
                        disabled={checkoutLoading}
                        className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px] col-span-2"
                        style={{
                            background: 'rgba(138,75,255,0.1)',
                            border: '1.5px solid rgba(138,75,255,0.4)'
                        }}
                    >
                        <span className="block text-5xl font-black text-purple-400 mb-1">50</span>
                        <span className="block text-xs text-purple-400/70 uppercase font-bold mb-2 tracking-wide">Pro Scans</span>
                        <span className="block text-[10px] text-yellow-400/80 mb-2">⚡ GPT-4o • All 4 modes</span>
                        <span className="block text-lg font-black text-white">${PRICES.SCAN_PACK_50}</span>
                    </button>
                </div>

                {/* ☠️ SAVAGE ONE-OFF - "Curiosity" Framing */}
                <div className="relative w-full mb-5">
                    <button
                        onClick={() => startCheckout('proRoast')}
                        disabled={checkoutLoading}
                        className="btn-physical w-full p-5 rounded-2xl text-center transition-all group"
                        style={{
                            background: 'linear-gradient(135deg, #1a0000 0%, #330000 100%)',
                            border: '2px solid rgba(255,68,68,0.5)',
                            boxShadow: 'var(--shadow-physical), 0 0 30px rgba(255,68,68,0.2)'
                        }}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">☠️</span>
                            <h3 className="text-red-400 text-xl font-black mb-1">Curious? Savage Mode</h3>
                            <p className="text-red-300/60 text-sm font-bold mb-2">Try the brutal truth once</p>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 line-through">${PRICES.PRO_WEEKLY}</span>
                                <span className="text-2xl font-black text-white">$0.99</span>
                            </div>
                        </div>
                    </button>
                </div>

                {/* MODEL CAPABILITIES COMPARISON - The "Why Control" */}
                <div className="mb-5 p-4 rounded-2xl bg-black/40 border border-white/10">
                    <h4 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4 text-center">Engine Comparison</h4>
                    <div className="grid grid-cols-3 gap-y-3 text-[11px]">
                        {/* Headers */}
                        <div className="col-span-1 text-gray-500 font-bold">Feature</div>
                        <div className="col-span-1 text-center text-gray-400 font-bold">Free</div>
                        <div className="col-span-1 text-center text-yellow-400 font-black">PRO</div>

                        {/* Rows */}
                        {[
                            { label: 'AI Model', free: 'Gemini Flash', pro: 'GPT-4o (Elite)' },
                            { label: 'Style IQ', free: 'Standard', pro: 'High-Fidelity' },
                            { label: 'Critique', free: 'Basic', pro: 'Expert Level' },
                            { label: 'Precision', free: 'Integer (87)', pro: 'Decimal (87.4)' }
                        ].map((row, i) => (
                            <React.Fragment key={i}>
                                <div className="col-span-3 h-px bg-white/5 my-1" />
                                <div className="col-span-1 text-gray-300 font-medium self-center">{row.label}</div>
                                <div className="col-span-1 text-center text-gray-500 self-center">{row.free}</div>
                                <div className="col-span-1 text-center text-yellow-400 font-bold self-center">{row.pro}</div>
                            </React.Fragment>
                        ))}
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
                    className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60"
                >
                    ← Not now, go back
                </button>
            </div>
        </div>
    )
}
