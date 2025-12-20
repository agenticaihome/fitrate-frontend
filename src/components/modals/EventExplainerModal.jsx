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
                background: 'rgba(0,0,0,0.95)',
                backdropFilter: 'blur(20px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            <div
                className="rounded-3xl p-6 max-w-sm w-full relative overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, #12121f 0%, #0a0a0f 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 80px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                }}
            >
                {/* Animated glow effect */}
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at 50% 0%, rgba(16,185,129,0.3) 0%, transparent 50%)'
                    }}
                />

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    aria-label="Close event explanation"
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-white/70 text-xl" aria-hidden="true">×</span>
                </button>

                {/* Header with Theme Emoji */}
                <div className="text-center mb-5 relative">
                    <div
                        className="text-6xl block mb-3 animate-bounce"
                        aria-hidden="true"
                        style={{ animationDuration: '2s' }}
                    >
                        {event.themeEmoji}
                    </div>
                    <h2
                        id="event-explainer-title"
                        className="text-2xl font-black text-white mb-2"
                        style={{ textShadow: '0 2px 20px rgba(16,185,129,0.3)' }}
                    >
                        Weekly Style Challenge
                    </h2>
                    <p
                        id="event-explainer-desc"
                        className="text-sm text-gray-400"
                    >
                        This week: <span className="text-emerald-400 font-bold">{event.theme}</span>
                    </p>
                </div>

                {/* Grand Prize Banner */}
                <div
                    className="mb-5 p-4 rounded-2xl text-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)',
                        border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}
                >
                    <div className="absolute inset-0 opacity-20" style={{
                        background: 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.4) 0%, transparent 70%)'
                    }} />
                    <div className="relative">
                        <span className="text-3xl block mb-1">👑</span>
                        <p className="text-amber-400 font-black text-lg mb-1">Weekly Winner Gets</p>
                        <p className="text-white font-black text-xl">1 YEAR FREE PRO</p>
                        <p className="text-amber-400/70 text-xs mt-1">Top rated fit wins it all!</p>
                    </div>
                </div>

                {/* How It Works - Big, Clear Steps */}
                <div
                    className="rounded-2xl p-4 mb-5"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3 text-center">
                        How It Works
                    </h3>
                    <ol className="space-y-3" role="list">
                        <li className="flex items-start gap-3">
                            <span
                                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.1) 100%)',
                                    border: '1px solid rgba(16,185,129,0.3)'
                                }}
                            >1</span>
                            <div>
                                <p className="text-white font-semibold text-sm">Dress the theme</p>
                                <p className="text-xs text-gray-500">Rock your best {event.theme.toLowerCase()} look</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span
                                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.1) 100%)',
                                    border: '1px solid rgba(16,185,129,0.3)'
                                }}
                            >2</span>
                            <div>
                                <p className="text-white font-semibold text-sm">Get AI rated</p>
                                <p className="text-xs text-gray-500">Your fit gets scored instantly</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <span
                                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-emerald-400 font-bold text-sm"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.1) 100%)',
                                    border: '1px solid rgba(16,185,129,0.3)'
                                }}
                            >3</span>
                            <div>
                                <p className="text-white font-semibold text-sm">Climb the leaderboard</p>
                                <p className="text-xs text-gray-500">Best score by Sunday wins!</p>
                            </div>
                        </li>
                    </ol>
                </div>

                {/* Timer + Info */}
                <div className="text-center mb-5">
                    <p className="text-xs text-gray-500">
                        ⏱️ Ends Sunday midnight • New theme every Monday
                    </p>
                </div>

                {/* CTA Button - Large and Clear */}
                <button
                    onClick={handleJoin}
                    aria-label={isPro
                        ? `Join the ${event.theme} challenge`
                        : `Upgrade to Pro to join the ${event.theme} challenge`
                    }
                    className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.97] mb-3 relative overflow-hidden"
                    style={{
                        background: isPro
                            ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                            : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                        color: isPro ? 'white' : 'black',
                        boxShadow: isPro
                            ? '0 6px 0 rgba(4,120,87,0.5), 0 8px 30px rgba(16,185,129,0.4)'
                            : '0 6px 0 rgba(180,130,0,0.5), 0 8px 30px rgba(251,191,36,0.4)'
                    }}
                >
                    {isPro ? (
                        <>🎉 Join This Week's Challenge</>
                    ) : (
                        <>👑 Upgrade to Compete</>
                    )}
                </button>

                {/* Secondary Action */}
                <button
                    onClick={handleClose}
                    aria-label="Maybe later"
                    className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60 hover:text-gray-300"
                >
                    Maybe later
                </button>
            </div>
        </div>
    )
}
