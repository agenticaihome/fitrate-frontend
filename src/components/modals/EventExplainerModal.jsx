import React from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * EventExplainerModal
 * 
 * A "dummy and grandma-proof" modal that explains what the weekly event is
 * and how to participate. Triggered on first tap of the event bar.
 * 
 * Accessibility: Full ARIA support, large touch targets, clear language
 */
export default function EventExplainerModal({
    event,
    isPro,
    onJoin,          // Called when user wants to join event
    onClose,         // Called when user dismisses
    onUpgrade        // Called if free user taps join (needs Pro)
}) {
    if (!event) return null

    const handleJoin = () => {
        playSound('click')
        vibrate(30)
        if (isPro) {
            onJoin()
        } else {
            onUpgrade()
        }
    }

    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-explainer-title"
            aria-describedby="event-explainer-desc"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-sm w-full border border-emerald-500/30 relative"
                style={{ boxShadow: '0 0 60px rgba(16,185,129,0.2)' }}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    aria-label="Close event explanation"
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <span className="text-white text-xl" aria-hidden="true">×</span>
                </button>

                {/* Header with Theme Emoji */}
                <div className="text-center mb-6">
                    <span className="text-5xl block mb-3" aria-hidden="true">{event.themeEmoji}</span>
                    <h2
                        id="event-explainer-title"
                        className="text-2xl font-black text-white mb-2"
                    >
                        Weekly Style Challenge
                    </h2>
                    <p
                        id="event-explainer-desc"
                        className="text-sm text-gray-400"
                    >
                        This week's theme: <span className="text-emerald-400 font-bold">{event.theme}</span>
                    </p>
                </div>

                {/* How It Works - Big, Clear Steps */}
                <div className="bg-white/5 rounded-2xl p-4 mb-6">
                    <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4 text-center">
                        How It Works
                    </h3>
                    <ol className="space-y-4" role="list">
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">1</span>
                            <div>
                                <p className="text-white font-medium">Take a themed photo</p>
                                <p className="text-sm text-gray-400">Wear your best {event.theme.toLowerCase()} outfit</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">2</span>
                            <div>
                                <p className="text-white font-medium">AI rates your fit</p>
                                <p className="text-sm text-gray-400">Get your score automatically</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">3</span>
                            <div>
                                <p className="text-white font-medium">Compete on leaderboard!</p>
                                <p className="text-sm text-gray-400">Top fits win free Pro scans 🎁</p>
                            </div>
                        </li>
                    </ol>
                </div>

                {/* Timer + Info */}
                <div className="text-center mb-6">
                    <p className="text-sm text-gray-500">
                        <span aria-hidden="true">⏱️</span> Ends Sunday midnight • New theme every Monday
                    </p>
                </div>

                {/* CTA Button - Large and Clear */}
                <button
                    onClick={handleJoin}
                    aria-label={isPro
                        ? `Join the ${event.theme} challenge`
                        : `Upgrade to Pro to join the ${event.theme} challenge`
                    }
                    className="w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] mb-3"
                    style={{
                        background: isPro
                            ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        color: isPro ? 'white' : 'black',
                        boxShadow: isPro
                            ? '0 8px 30px rgba(16,185,129,0.4)'
                            : '0 8px 30px rgba(251,191,36,0.4)'
                    }}
                >
                    {isPro ? (
                        <>
                            <span aria-hidden="true">🎉</span> Join This Week's Challenge
                        </>
                    ) : (
                        <>
                            <span aria-hidden="true">👑</span> Upgrade to Join
                        </>
                    )}
                </button>

                {/* Secondary Action */}
                <button
                    onClick={handleClose}
                    aria-label="Maybe later"
                    className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60"
                >
                    Maybe later
                </button>
            </div>
        </div>
    )
}
