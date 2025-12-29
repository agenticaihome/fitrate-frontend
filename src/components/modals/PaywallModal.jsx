import React, { useMemo, useState, useEffect } from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'
import { PRICES, STRIPE_LINKS } from '../../config/constants'

// Gentle floating hearts/stars animation
const FloatingEmojis = () => {
    const emojis = useMemo(() =>
        ['👗', '👠', '💄', '👜', '👔', '✨'].flatMap((emoji, i) =>
            Array.from({ length: 3 }, (_, j) => ({
                id: i * 3 + j,
                emoji,
                left: 10 + Math.random() * 80,
                delay: Math.random() * 10,
                duration: 15 + Math.random() * 10,
                size: 12 + Math.random() * 8
            }))
        ), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            {emojis.map(e => (
                <div
                    key={e.id}
                    className="absolute"
                    style={{
                        left: `${e.left}%`,
                        bottom: '-20px',
                        fontSize: e.size,
                        opacity: 0.6,
                        animation: `float-up ${e.duration}s linear infinite`,
                        animationDelay: `${e.delay}s`
                    }}
                >
                    {e.emoji}
                </div>
            ))}
            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                    10% { opacity: 0.6; }
                    90% { opacity: 0.6; }
                    100% { transform: translateY(-500px) rotate(360deg); opacity: 0; }
                }
            `}</style>
        </div>
    )
}

// Encouraging messages that rotate
const ENCOURAGEMENTS = [
    "You're going to look amazing! ✨",
    "Your style journey continues! 💫",
    "Let's unlock more fits! 🔥",
    "Your wardrobe thanks you! 👗",
    "More scans, more confidence! 💪"
]

// Check if user has made a purchase before
const hasUsedFirstTimeOffer = () => localStorage.getItem('fitrate_first_purchase') === 'true'
const markFirstTimeOfferUsed = () => localStorage.setItem('fitrate_first_purchase', 'true')

/**
 * PaywallModal - The Friendliest Payment Page on the Internet
 * Warm, encouraging, and celebrates the user's style journey
 */
export default function PaywallModal({
    showPaywall,
    setShowPaywall,
    checkoutLoading,
    startCheckout,
    userId
}) {
    const [activeTab, setActiveTab] = useState('packs') // 'packs' or 'unlimited'
    const [selectedPlan, setSelectedPlan] = useState('yearly')
    const [encouragement, setEncouragement] = useState(ENCOURAGEMENTS[0])

    const isFirstTime = !hasUsedFirstTimeOffer()

    // Rotate encouragement messages
    useEffect(() => {
        if (!showPaywall) return
        const interval = setInterval(() => {
            setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)])
        }, 4000)
        return () => clearInterval(interval)
    }, [showPaywall])

    if (!showPaywall) return null

    const handlePurchase = (link, product) => {
        playSound('success')
        vibrate([30, 20, 30])

        if (product === 'firstTime') markFirstTimeOfferUsed()

        const separator = link.includes('?') ? '&' : '?'
        const checkoutUrl = `${link}${separator}client_reference_id=${userId}`
        window.open(checkoutUrl, '_blank')
    }

    // Friendly pack options with encouraging copy
    const scanPacks = [
        {
            id: 'impulse',
            scans: 3,
            price: PRICES.SCAN_PACK_3,
            link: STRIPE_LINKS.impulsePack,
            emoji: '👕',
            label: 'Try it out',
            subtext: 'Perfect for a quick vibe check'
        },
        {
            id: 'starter',
            scans: 10,
            price: PRICES.SCAN_PACK_10,
            link: STRIPE_LINKS.starterPack,
            emoji: '👗',
            label: 'Getting started',
            subtext: 'A week of daily fits'
        },
        {
            id: 'popular',
            scans: 25,
            price: PRICES.SCAN_PACK_25,
            link: STRIPE_LINKS.popularPack,
            popular: true,
            emoji: '👠',
            label: 'Fan favorite',
            subtext: 'Most loved by our community'
        },
        {
            id: 'value',
            scans: 50,
            price: PRICES.SCAN_PACK_50,
            link: STRIPE_LINKS.valuePack,
            emoji: '💎',
            label: 'Style enthusiast',
            subtext: 'For serious outfit queens'
        },
        {
            id: 'mega',
            scans: 100,
            price: PRICES.SCAN_PACK_100,
            link: STRIPE_LINKS.megaPack,
            emoji: '👑',
            label: 'Fashionista pack',
            subtext: 'Best value for trendsetters'
        },
    ]

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center p-4 py-8 overflow-y-auto"
            style={{
                background: 'linear-gradient(180deg, rgba(15,10,25,0.97) 0%, rgba(25,15,40,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
            }}
            onClick={(e) => e.target === e.currentTarget && setShowPaywall(false)}
        >

            {/* Warm ambient glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(255,182,193,0.15) 0%, transparent 70%)',
                    top: '20%',
                    left: '30%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'breathe 6s ease-in-out infinite'
                }} />
                <div className="absolute w-[400px] h-[400px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(186,156,255,0.12) 0%, transparent 70%)',
                    bottom: '20%',
                    right: '20%',
                    animation: 'breathe 8s ease-in-out infinite reverse'
                }} />
            </div>

            <style>{`
                @keyframes breathe {
                    0%, 100% { transform: scale(1); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                }
                @keyframes gentle-bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
            `}</style>

            <div className="rounded-3xl p-6 max-w-md w-full border border-white/10 text-center relative overflow-hidden" style={{
                background: 'linear-gradient(180deg, rgba(40,30,60,0.95) 0%, rgba(25,20,45,0.98) 100%)',
                boxShadow: '0 25px 100px rgba(186,156,255,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                animation: 'modal-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
                <FloatingEmojis />

                {/* Friendly Header */}
                <div className="relative z-10 mb-4">
                    <div className="text-5xl mb-3" style={{ animation: 'gentle-bounce 2s ease-in-out infinite' }}>
                        👋
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">
                        Hey, style icon!
                    </h2>
                    <p className="text-purple-200/80 text-base transition-all duration-500">
                        {encouragement}
                    </p>
                </div>

                {/* First-Time Welcome Offer */}
                {isFirstTime && (
                    <button
                        onClick={() => handlePurchase(STRIPE_LINKS.firstTimeOffer, 'firstTime')}
                        className="w-full p-4 rounded-2xl mb-5 text-left relative overflow-hidden active:scale-[0.98] transition-all group"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,182,193,0.15) 100%)',
                            border: '2px solid rgba(255,215,0,0.4)',
                        }}
                    >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite'
                        }} />
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="text-4xl" style={{ animation: 'gentle-bounce 2s ease-in-out infinite' }}>
                                🎁
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-bold text-lg">Welcome gift!</span>
                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-pink-400 text-black">
                                        67% OFF
                                    </span>
                                </div>
                                <p className="text-amber-200/80 text-sm">10 scans to start your journey ✨</p>
                            </div>
                            <div className="text-right">
                                <div className="text-white/40 text-sm line-through">${PRICES.FIRST_TIME_ORIGINAL}</div>
                                <div className="text-2xl font-black text-amber-400">${PRICES.FIRST_TIME_PRICE}</div>
                            </div>
                        </div>
                    </button>
                )}

                {/* Friendly Tab Toggle */}
                <div className="flex rounded-2xl bg-white/5 p-1.5 mb-5 relative">
                    <div
                        className="absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-purple-500/30 to-pink-500/30 transition-all duration-300"
                        style={{
                            left: activeTab === 'packs' ? '6px' : '50%',
                            width: 'calc(50% - 6px)'
                        }}
                    />
                    <button
                        onClick={() => { playSound('click'); setActiveTab('packs'); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${activeTab === 'packs' ? 'text-white' : 'text-white/50'
                            }`}
                    >
                        🎨 Scan Packs
                    </button>
                    <button
                        onClick={() => { playSound('click'); setActiveTab('unlimited'); }}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all relative z-10 ${activeTab === 'unlimited' ? 'text-white' : 'text-white/50'
                            }`}
                    >
                        👑 Go Unlimited
                    </button>
                </div>

                {activeTab === 'packs' ? (
                    /* Friendly Scan Packs */
                    <div className="space-y-3 mb-5">
                        {scanPacks.map((pack) => (
                            <button
                                key={pack.id}
                                onClick={() => handlePurchase(pack.link, pack.id)}
                                className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] group relative overflow-hidden ${pack.popular
                                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400/50'
                                    : 'bg-white/5 border border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {pack.popular && (
                                    <div className="absolute -top-1 -right-1 px-3 py-1 rounded-bl-xl rounded-tr-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        ❤️ LOVED
                                    </div>
                                )}
                                <div className="text-3xl group-hover:scale-110 transition-transform">
                                    {pack.emoji}
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{pack.scans} Scans</span>
                                        <span className="text-white/40 text-xs">• {pack.label}</span>
                                    </div>
                                    <span className="text-white/50 text-xs">{pack.subtext}</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-black text-white">${pack.price}</div>
                                    <div className="text-white/40 text-xs">${(pack.price / pack.scans).toFixed(2)} ea</div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    /* Friendly Subscription Options */
                    <div className="space-y-4 mb-5">
                        <p className="text-purple-200/70 text-sm mb-3">
                            Never worry about running out! 🌈
                        </p>

                        {/* Yearly - Best Value */}
                        <button
                            onClick={() => { playSound('click'); setSelectedPlan('yearly'); }}
                            className={`w-full p-4 rounded-2xl text-left transition-all relative overflow-hidden ${selectedPlan === 'yearly'
                                ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 border-2 border-purple-400/50'
                                : 'bg-white/5 border border-white/10'
                                }`}
                        >
                            {selectedPlan === 'yearly' && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">🌟</span>
                                <span className="text-white font-bold text-lg">Yearly Bestie</span>
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/80 text-white">
                                    2 MONTHS FREE
                                </span>
                            </div>
                            <p className="text-white/60 text-sm ml-9">
                                Unlimited scans* • Just ${(PRICES.PRO_YEARLY / 12).toFixed(2)}/month
                            </p>
                            <div className="mt-3 ml-9 text-2xl font-black text-white">
                                ${PRICES.PRO_YEARLY}<span className="text-white/50 text-sm font-normal">/year</span>
                            </div>
                        </button>

                        {/* Monthly */}
                        <button
                            onClick={() => { playSound('click'); setSelectedPlan('monthly'); }}
                            className={`w-full p-4 rounded-2xl text-left transition-all relative ${selectedPlan === 'monthly'
                                ? 'bg-gradient-to-r from-purple-500/25 to-pink-500/25 border-2 border-purple-400/50'
                                : 'bg-white/5 border border-white/10'
                                }`}
                        >
                            {selectedPlan === 'monthly' && (
                                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                    <span className="text-white text-sm">✓</span>
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">⚡</span>
                                <span className="text-white font-bold text-lg">Monthly Flex</span>
                            </div>
                            <p className="text-white/60 text-sm ml-9">
                                Unlimited scans* • Cancel anytime
                            </p>
                            <div className="mt-3 ml-9 text-2xl font-black text-white">
                                ${PRICES.PRO_MONTHLY}<span className="text-white/50 text-sm font-normal">/month</span>
                            </div>
                        </button>

                        {/* Subscribe Button */}
                        <button
                            onClick={() => handlePurchase(
                                selectedPlan === 'yearly' ? STRIPE_LINKS.proYearly : STRIPE_LINKS.proMonthly,
                                selectedPlan
                            )}
                            className="w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.97] relative overflow-hidden group"
                            style={{
                                background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                boxShadow: '0 8px 30px rgba(168,85,247,0.4)'
                            }}
                        >
                            <span className="relative z-10 text-white">
                                Start My {selectedPlan === 'yearly' ? 'Yearly' : 'Monthly'} Journey ✨
                            </span>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s infinite'
                            }} />
                        </button>
                    </div>
                )}

                {/* Friendly reassurance */}
                <div className="flex items-center justify-center gap-4 text-white/40 text-xs mb-3">
                    <span>🔒 Secure</span>
                    <span>•</span>
                    <span>⏱️ Never expires</span>
                    <span>•</span>
                    <span>💬 Support</span>
                </div>

                {/* Fair use note for unlimited */}
                {activeTab === 'unlimited' && (
                    <p className="text-white/25 text-[10px] text-center mb-3">
                        *Fair use: up to 100 scans/day – more than you'll ever need! 💫
                    </p>
                )}

                {/* Legal links */}
                <div className="flex items-center justify-center gap-3 text-white/30 text-[10px] mb-4">
                    <a href="/terms" target="_blank" className="hover:text-white/50 transition-colors underline">Terms of Service</a>
                    <span>•</span>
                    <a href="/privacy" target="_blank" className="hover:text-white/50 transition-colors underline">Privacy Policy</a>
                </div>

                {/* Warm close option */}
                <button
                    onClick={() => { playSound('click'); setShowPaywall(false); }}
                    className="w-full py-3 text-sm text-white/40 font-medium hover:text-white/60 transition-colors"
                >
                    Maybe next time 💫
                </button>
            </div>
        </div>
    )
}

