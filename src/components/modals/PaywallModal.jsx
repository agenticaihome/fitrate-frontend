import React, { useState, useEffect } from 'react'
import ModalHeader from '../common/ModalHeader'
import { PRICES, STRIPE_LINKS } from '../../config/constants'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * PaywallModal - Premium Monetization System
 * - 5-tier scan pack pricing (Clash of Clans style)
 * - First-time buyer offer (one-time 67% off)
 * - Psychological pricing with "Most Popular" highlight
 * - Savings callouts and urgency triggers
 */
export default function PaywallModal({
    showPaywall,
    setShowPaywall,
    checkoutLoading,
    startCheckout,
    userId
}) {
    // Track if user has ever purchased (for first-time offer)
    const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true)
    const [showFirstTimeOffer, setShowFirstTimeOffer] = useState(false)

    // Check localStorage for purchase history
    useEffect(() => {
        const hasPurchased = localStorage.getItem('fitrate_has_purchased')
        if (hasPurchased) {
            setIsFirstTimeBuyer(false)
        } else {
            // Show first-time offer after a slight delay for impact
            const timer = setTimeout(() => setShowFirstTimeOffer(true), 500)
            return () => clearTimeout(timer)
        }
    }, [])

    if (!showPaywall) return null

    // Handle checkout and mark as purchased
    const handleCheckout = (product) => {
        // Mark as purchased when they click (optimistic)
        localStorage.setItem('fitrate_has_purchased', 'true')
        playSound('click')
        vibrate(20)
        startCheckout(product)
    }

    // Scan pack tiers with psychology-optimized pricing
    const scanPacks = [
        {
            id: 'tinyPack',
            scans: 3,
            price: PRICES.SCAN_PACK_3,
            perScan: (PRICES.SCAN_PACK_3 / 3).toFixed(2),
            label: 'Quick Fix',
            emoji: '⚡',
            color: 'cyan',
            highlight: false,
        },
        {
            id: 'starterPack',
            scans: 10,
            price: PRICES.SCAN_PACK_10,
            perScan: (PRICES.SCAN_PACK_10 / 10).toFixed(2),
            label: 'Starter',
            emoji: '🎯',
            color: 'blue',
            highlight: false,
            savePercent: 10,
        },
        {
            id: 'popularPack',
            scans: 25,
            price: PRICES.SCAN_PACK_25,
            perScan: (PRICES.SCAN_PACK_25 / 25).toFixed(2),
            label: 'Most Popular',
            emoji: '🔥',
            color: 'orange',
            highlight: true, // This is the anchor
            savePercent: 40,
        },
        {
            id: 'valuePack',
            scans: 50,
            price: PRICES.SCAN_PACK_50,
            perScan: (PRICES.SCAN_PACK_50 / 50).toFixed(2),
            label: 'Best Value',
            emoji: '💎',
            color: 'purple',
            highlight: false,
            savePercent: 52,
        },
        {
            id: 'proPack',
            scans: 100,
            price: PRICES.SCAN_PACK_100,
            perScan: (PRICES.SCAN_PACK_100 / 100).toFixed(2),
            label: 'Pro Pack',
            emoji: '👑',
            color: 'gold',
            highlight: false,
            savePercent: 61,
        },
    ]

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            style={{
                background: 'rgba(0,0,0,0.95)',
                backdropFilter: 'blur(12px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 max-w-sm w-full border border-white/10 relative max-h-[90vh] overflow-y-auto" style={{
                boxShadow: '0 0 80px rgba(0,212,255,0.15), 0 0 40px rgba(139,92,246,0.1)'
            }}>

                {/* Header */}
                <div className="text-center mb-5">
                    <div className="text-4xl mb-2">💎</div>
                    <h2 className="text-xl font-black text-white mb-1">Get More Scans</h2>
                    <p className="text-sm text-white/50">All 8 AI modes included free!</p>
                </div>

                {/* First-Time Buyer Offer - Only shows once ever */}
                {isFirstTimeBuyer && showFirstTimeOffer && (
                    <div
                        className="mb-5 p-4 rounded-2xl relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={() => handleCheckout('firstTimeOffer')}
                        style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                            boxShadow: '0 4px 30px rgba(255,215,0,0.4)'
                        }}
                    >
                        {/* Animated shimmer */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-shimmer" />
                        </div>

                        {/* Badge */}
                        <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg uppercase">
                            One-Time Only
                        </div>

                        <div className="relative flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">🎁</span>
                                    <span className="text-black font-black text-lg">Welcome Gift!</span>
                                </div>
                                <p className="text-black/70 text-sm font-bold">
                                    {PRICES.FIRST_TIME_SCANS} scans for just ${PRICES.FIRST_TIME_PRICE}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-black/40 text-sm line-through">${PRICES.FIRST_TIME_ORIGINAL}</div>
                                <div className="text-black text-2xl font-black">${PRICES.FIRST_TIME_PRICE}</div>
                                <div className="text-red-700 text-xs font-black">67% OFF</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Divider */}
                {isFirstTimeBuyer && showFirstTimeOffer && (
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-white/30 text-xs font-bold uppercase">or choose a pack</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>
                )}

                {/* 5-Tier Scan Packs */}
                <div className="space-y-2.5 mb-5">
                    {scanPacks.map((pack) => (
                        <button
                            key={pack.id}
                            onClick={() => handleCheckout(pack.id)}
                            disabled={checkoutLoading || STRIPE_LINKS[pack.id]?.includes('PLACEHOLDER')}
                            className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all active:scale-[0.98] relative overflow-hidden ${pack.highlight
                                    ? 'ring-2 ring-orange-400 shadow-lg shadow-orange-500/20'
                                    : ''
                                } ${STRIPE_LINKS[pack.id]?.includes('PLACEHOLDER') ? 'opacity-50' : ''}`}
                            style={{
                                background: pack.highlight
                                    ? 'linear-gradient(135deg, rgba(255,140,0,0.2) 0%, rgba(255,100,0,0.15) 100%)'
                                    : 'rgba(255,255,255,0.05)',
                                border: pack.highlight ? '2px solid rgba(255,140,0,0.5)' : '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {/* Popular badge */}
                            {pack.highlight && (
                                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black py-1 text-center uppercase tracking-wider">
                                    ⭐ Most Popular ⭐
                                </div>
                            )}

                            <div className={`flex items-center gap-3 ${pack.highlight ? 'mt-4' : ''}`}>
                                <span className="text-2xl">{pack.emoji}</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-black text-lg">{pack.scans}</span>
                                        <span className="text-white/60 text-sm">scans</span>
                                    </div>
                                    <span className="text-white/40 text-xs">{pack.label}</span>
                                </div>
                            </div>

                            <div className={`text-right ${pack.highlight ? 'mt-4' : ''}`}>
                                <div className="text-white font-black text-lg">${pack.price}</div>
                                <div className="text-white/40 text-[10px]">${pack.perScan}/scan</div>
                                {pack.savePercent && (
                                    <div className="text-emerald-400 text-[10px] font-bold">Save {pack.savePercent}%</div>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Trust Signals */}
                <div className="flex items-center justify-center gap-4 mb-4 text-[10px] text-white/40">
                    <span>🔐 Secure checkout</span>
                    <span>•</span>
                    <span>⚡ Instant access</span>
                    <span>•</span>
                    <span>♾️ Never expire</span>
                </div>

                {/* Social Proof */}
                <div className="text-center mb-4 py-2 px-3 rounded-xl bg-white/5">
                    <p className="text-white/50 text-[11px]">
                        🔥 <span className="text-white/70 font-bold">2,847 scans</span> purchased today
                    </p>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => {
                        playSound('click')
                        setShowPaywall(false)
                    }}
                    className="w-full py-3 text-sm text-white/40 font-medium transition-all active:opacity-60"
                >
                    Maybe later
                </button>
            </div>

            {/* CSS for shimmer animation */}
            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-12deg); }
                    100% { transform: translateX(200%) skewX(-12deg); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    )
}
