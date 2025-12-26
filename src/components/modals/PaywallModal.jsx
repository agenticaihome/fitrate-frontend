import React, { useState, useEffect } from 'react'
import { PRICES, STRIPE_LINKS, SUBSCRIPTIONS } from '../../config/constants'
import { playSound, vibrate } from '../../utils/soundEffects'
import { trackPaywallView, trackBeginCheckout, trackFirstTimeOfferView } from '../../utils/analytics'

/**
 * PaywallModal - Premium Monetization System
 * - 5-tier scan pack pricing (Clash of Clans style)
 * - Monthly/Yearly subscriptions for power users
 * - First-time buyer offer (one-time 67% off)
 * - Psychological pricing with "Most Popular" highlight
 */
export default function PaywallModal({
    showPaywall,
    setShowPaywall,
    checkoutLoading,
    startCheckout,
    userId
}) {
    const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(true)
    const [showFirstTimeOffer, setShowFirstTimeOffer] = useState(false)
    const [viewMode, setViewMode] = useState('packs') // 'packs' or 'unlimited'

    // Track paywall view on mount
    useEffect(() => {
        if (showPaywall) {
            trackPaywallView('scan_limit')
        }
    }, [showPaywall])

    useEffect(() => {
        const hasPurchased = localStorage.getItem('fitrate_has_purchased')
        if (hasPurchased) {
            setIsFirstTimeBuyer(false)
        } else {
            const timer = setTimeout(() => {
                setShowFirstTimeOffer(true)
                trackFirstTimeOfferView()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [])

    if (!showPaywall) return null

    const handleCheckout = (product) => {
        const price = scanPacks.find(p => p.id === product)?.price ||
            (product === 'firstTimeOffer' ? PRICES.FIRST_TIME_PRICE :
                product === 'proMonthly' ? SUBSCRIPTIONS.MONTHLY_PRICE :
                    product === 'proYearly' ? SUBSCRIPTIONS.YEARLY_PRICE : 0)
        trackBeginCheckout(product, price)
        localStorage.setItem('fitrate_has_purchased', 'true')
        playSound('click')
        vibrate(20)
        startCheckout(product)
    }

    // 5-Tier Scan Packs
    const scanPacks = [
        { id: 'tinyPack', scans: 3, price: PRICES.SCAN_PACK_3, label: 'Quick Fix', emoji: '⚡' },
        { id: 'starterPack', scans: 10, price: PRICES.SCAN_PACK_10, label: 'Starter', emoji: '🎯', save: 10 },
        { id: 'popularPack', scans: 25, price: PRICES.SCAN_PACK_25, label: 'Most Popular', emoji: '🔥', highlight: true, save: 40 },
        { id: 'valuePack', scans: 50, price: PRICES.SCAN_PACK_50, label: 'Best Value', emoji: '💎', save: 52 },
        { id: 'proPack', scans: 100, price: PRICES.SCAN_PACK_100, label: 'Pro Pack', emoji: '👑', save: 61 },
    ]

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
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 max-w-sm w-full border border-white/10 max-h-[90vh] overflow-y-auto" style={{
                boxShadow: '0 0 80px rgba(0,212,255,0.15)'
            }}>

                {/* Header */}
                <div className="text-center mb-4">
                    <div className="text-4xl mb-2">💎</div>
                    <h2 className="text-xl font-black text-white mb-1">Get More Scans</h2>
                    <p className="text-sm text-white/50">All 12 AI modes included!</p>
                </div>

                {/* Toggle: Packs vs Unlimited */}
                <div className="flex bg-white/5 rounded-xl p-1 mb-4">
                    <button
                        onClick={() => setViewMode('packs')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'packs'
                            ? 'bg-cyan-500 text-black'
                            : 'text-white/50'
                            }`}
                    >
                        Scan Packs
                    </button>
                    <button
                        onClick={() => setViewMode('unlimited')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'unlimited'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'text-white/50'
                            }`}
                    >
                        ♾️ Unlimited
                    </button>
                </div>

                {/* SCAN PACKS VIEW */}
                {viewMode === 'packs' && (
                    <>
                        {/* First-Time Offer */}
                        {isFirstTimeBuyer && showFirstTimeOffer && (
                            <div
                                className="mb-4 p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                                onClick={() => handleCheckout('firstTimeOffer')}
                                style={{
                                    background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                    boxShadow: '0 4px 30px rgba(255,215,0,0.4)'
                                }}
                            >
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg uppercase">
                                    One-Time Only
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-2xl">🎁</span>
                                            <span className="text-black font-black text-lg">Welcome Gift!</span>
                                        </div>
                                        <p className="text-black/70 text-sm font-bold">10 scans for just $0.99</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-black/40 text-sm line-through">$2.99</div>
                                        <div className="text-black text-2xl font-black">$0.99</div>
                                        <div className="text-red-700 text-xs font-black">67% OFF</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5-Tier Packs */}
                        <div className="space-y-2 mb-4">
                            {scanPacks.map((pack) => (
                                <button
                                    key={pack.id}
                                    onClick={() => handleCheckout(pack.id)}
                                    disabled={checkoutLoading || STRIPE_LINKS[pack.id]?.includes('NEED_TO')}
                                    className={`w-full p-3 rounded-xl flex items-center justify-between transition-all active:scale-[0.98] relative ${pack.highlight ? 'ring-2 ring-orange-400' : ''
                                        } ${STRIPE_LINKS[pack.id]?.includes('NEED_TO') ? 'opacity-40' : ''}`}
                                    style={{
                                        background: pack.highlight
                                            ? 'linear-gradient(135deg, rgba(255,140,0,0.2) 0%, rgba(255,100,0,0.15) 100%)'
                                            : 'rgba(255,255,255,0.05)',
                                        border: pack.highlight ? '2px solid rgba(255,140,0,0.5)' : '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    {pack.highlight && (
                                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[8px] font-black px-3 py-0.5 rounded-full uppercase">
                                            ⭐ Most Popular
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{pack.emoji}</span>
                                        <div>
                                            <span className="text-white font-black">{pack.scans}</span>
                                            <span className="text-white/60 text-sm ml-1">scans</span>
                                            <div className="text-white/40 text-[10px]">{pack.label}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-white font-black">${pack.price}</div>
                                        {pack.save && <div className="text-emerald-400 text-[10px] font-bold">Save {pack.save}%</div>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* UNLIMITED VIEW (Subscriptions) */}
                {viewMode === 'unlimited' && (
                    <div className="space-y-3 mb-4">
                        {/* Yearly - Best Deal */}
                        <button
                            onClick={() => handleCheckout('proYearly')}
                            disabled={checkoutLoading || STRIPE_LINKS.proYearly?.includes('NEED_TO')}
                            className={`w-full p-4 rounded-2xl relative overflow-hidden transition-all active:scale-[0.98] ${STRIPE_LINKS.proYearly?.includes('NEED_TO') ? 'opacity-40' : ''
                                }`}
                            style={{
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.15) 100%)',
                                border: '2px solid rgba(139,92,246,0.5)',
                                boxShadow: '0 0 30px rgba(139,92,246,0.2)'
                            }}
                        >
                            <div className="absolute top-0 right-0 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase">
                                2 Months Free
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">👑</span>
                                    <div>
                                        <div className="text-white font-black text-lg">Yearly Pro</div>
                                        <div className="text-white/60 text-sm">25 scans/day • All modes</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white/40 text-sm line-through">${SUBSCRIPTIONS.MONTHLY_PRICE * 12}</div>
                                    <div className="text-white text-xl font-black">${SUBSCRIPTIONS.YEARLY_PRICE}/yr</div>
                                    <div className="text-emerald-400 text-xs font-bold">Save ${SUBSCRIPTIONS.YEARLY_SAVINGS}</div>
                                </div>
                            </div>
                        </button>

                        {/* Monthly */}
                        <button
                            onClick={() => handleCheckout('proMonthly')}
                            disabled={checkoutLoading || STRIPE_LINKS.proMonthly?.includes('NEED_TO')}
                            className={`w-full p-4 rounded-2xl transition-all active:scale-[0.98] ${STRIPE_LINKS.proMonthly?.includes('NEED_TO') ? 'opacity-40' : ''
                                }`}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.15)'
                            }}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">⚡</span>
                                    <div>
                                        <div className="text-white font-black text-lg">Monthly Pro</div>
                                        <div className="text-white/60 text-sm">25 scans/day • All modes</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white text-xl font-black">${SUBSCRIPTIONS.MONTHLY_PRICE}/mo</div>
                                    <div className="text-white/40 text-xs">Cancel anytime</div>
                                </div>
                            </div>
                        </button>

                        {/* Benefits */}
                        <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
                            <p className="text-xs font-bold text-white/60 uppercase mb-2 text-center">Pro Benefits</p>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-white/70">
                                <div>✓ 25 scans every day</div>
                                <div>✓ All 12 AI modes</div>
                                <div>✓ Priority processing</div>
                                <div>✓ Cancel anytime</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Trust Signals */}
                <div className="flex items-center justify-center gap-4 mb-3 text-[10px] text-white/40">
                    <span>🔐 Secure</span>
                    <span>•</span>
                    <span>⚡ Instant access</span>
                    <span>•</span>
                    <span>♾️ Never expire</span>
                </div>

                {/* Social Proof */}
                <div className="text-center mb-3 py-2 px-3 rounded-xl bg-white/5">
                    <p className="text-white/50 text-[11px]">
                        🔥 <span className="text-white/70 font-bold">2,847 scans</span> purchased today
                    </p>
                </div>

                {/* Close */}
                <button
                    onClick={() => { playSound('click'); setShowPaywall(false) }}
                    className="w-full py-3 text-sm text-white/40 font-medium"
                >
                    Maybe later
                </button>
            </div>
        </div>
    )
}
