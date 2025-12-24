import React from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * EventExplainerModal
 * 
 * A "dummy and grandma-proof" modal that explains what the weekly event is
 * and how to participate. Shows tier differences for free vs pro users.
 * 
 * Accessibility: Full ARIA support, large touch targets, clear language
 */
export default function EventExplainerModal({
    event,
    isPro,
    freeEventEntryUsed,
    onJoin,          // Called when user wants to join event
    onClose,         // Called when user dismisses
    onUpgrade        // Called if free user who used their entry taps join
}) {
    if (!event) return null

    const handleJoin = () => {
        playSound('click')
        vibrate(30)
        // Free users who haven't used their entry can join
        if (isPro || !freeEventEntryUsed) {
            onJoin()
        } else {
            // Free user already used their entry - upgrade
            onUpgrade()
        }
    }

    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    // Can the current user join?
    const canJoin = isPro || !freeEventEntryUsed

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-explainer-title"
            aria-describedby="event-explainer-desc"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                paddingTop: 'max(1rem, env(safe-area-inset-top))',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
        >
            <div
                className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-sm w-full border border-emerald-500/30 relative flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
                style={{ boxShadow: '0 0 60px rgba(16,185,129,0.2)' }}
            >
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    aria-label="Close event explanation"
                    className="absolute top-4 right-4 w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors active:scale-95 z-10"
                    style={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                >
                    <span className="text-white text-3xl font-bold" aria-hidden="true">×</span>
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                    {/* Header with Theme Emoji */}
                    <div className="text-center mb-4">
                        <span className="text-5xl block mb-2" aria-hidden="true">{event.themeEmoji}</span>
                        <h2
                            id="event-explainer-title"
                            className="text-2xl font-black text-white mb-1"
                        >
                            Weekly Challenge
                        </h2>
                        <p
                            id="event-explainer-desc"
                            className="text-sm text-gray-400"
                        >
                            This week: <span className="text-emerald-400 font-bold">{event.theme}</span>
                        </p>
                    </div>

                    {/* Prize Banner */}
                    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl p-3 mb-4 text-center">
                        <span className="text-2xl" aria-hidden="true">👑</span>
                        <p className="text-yellow-300 font-black text-lg">WIN 1 YEAR FREE PRO</p>
                        <p className="text-yellow-400/70 text-xs">#1 wins Pro • Top 5 featured!</p>
                    </div>

                    {/* How It Works */}
                    <div className="bg-white/5 rounded-2xl p-4 mb-4">
                        <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3 text-center">
                            How It Works
                        </h3>
                        <ol className="space-y-3" role="list">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">1</span>
                                <div>
                                    <p className="text-white font-medium text-sm">Snap your themed outfit</p>
                                    <p className="text-xs text-gray-400">Show your best {event.theme.toLowerCase()} look</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">2</span>
                                <div>
                                    <p className="text-white font-medium text-sm">AI rates your fit</p>
                                    <p className="text-xs text-gray-400">Theme = 50% of your score!</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">3</span>
                                <div>
                                    <p className="text-white font-medium text-sm">Compete for #1!</p>
                                    <p className="text-xs text-gray-400">Only your best score counts</p>
                                </div>
                            </li>
                        </ol>
                    </div>

                    {/* Judging Criteria - What AI Looks For */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-4 mb-4 border border-purple-500/20">
                        <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest mb-3 text-center">
                            🎯 What AI Judges
                        </h3>
                        <p className="text-sm text-gray-300 text-center mb-3">
                            <span className="font-bold text-white">"{event.theme}"</span>
                            <span className="block text-xs text-gray-400 mt-1">{event.themeDescription}</span>
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 text-gray-300">
                                <span className="text-purple-400">✓</span> Theme match
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <span className="text-purple-400">✓</span> Color harmony
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <span className="text-purple-400">✓</span> Fit & silhouette
                            </div>
                            <div className="flex items-center gap-2 text-gray-300">
                                <span className="text-purple-400">✓</span> Styling details
                            </div>
                        </div>
                    </div>

                    {/* Tier Comparison */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {/* Free Tier */}
                        <div className={`rounded-xl p-3 ${!isPro ? 'ring-2 ring-cyan-400' : ''}`} style={{
                            background: 'rgba(0, 200, 255, 0.1)',
                            border: '1px solid rgba(0, 200, 255, 0.2)'
                        }}>
                            <p className="text-cyan-400 font-bold text-xs uppercase mb-2">Free</p>
                            <ul className="space-y-1 text-[11px] text-gray-300">
                                <li>• 1 entry per week</li>
                                <li>• Whole number score</li>
                                <li className="text-gray-500">• (e.g., 87)</li>
                            </ul>
                        </div>
                        {/* Pro Tier */}
                        <div className={`rounded-xl p-3 ${isPro ? 'ring-2 ring-emerald-400' : ''}`} style={{
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(251, 191, 36, 0.15) 100%)',
                            border: '1px solid rgba(251, 191, 36, 0.3)'
                        }}>
                            <p className="text-yellow-400 font-bold text-xs uppercase mb-2">⚡ Pro</p>
                            <ul className="space-y-1 text-[11px] text-gray-300">
                                <li>• 1 entry per day</li>
                                <li>• Decimal precision</li>
                                <li className="text-emerald-400">• (e.g., 87.4)</li>
                            </ul>
                        </div>
                    </div>

                    {/* Timer */}
                    <p className="text-center text-xs text-gray-500 mb-4">
                        <span aria-hidden="true">⏱️</span> Ends Sunday midnight • New theme Monday
                    </p>
                </div>

                {/* Fixed Footer with Action Buttons */}
                <div className="p-6 pt-0 flex-shrink-0">
                    {/* CTA Button */}
                    <button
                        onClick={handleJoin}
                        aria-label={canJoin
                            ? `Join the ${event.theme} challenge`
                            : `Upgrade to Pro to get more entries`
                        }
                        className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] mb-2"
                        style={{
                            background: canJoin
                                ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                                : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            color: canJoin ? 'white' : 'black',
                            boxShadow: canJoin
                                ? '0 8px 30px rgba(16,185,129,0.4)'
                                : '0 8px 30px rgba(251,191,36,0.4)'
                        }}
                    >
                        {canJoin ? (
                            <>
                                <span aria-hidden="true">🎉</span> Join Challenge {!isPro && '(1 Free Entry)'}
                            </>
                        ) : (
                            <>
                                <span aria-hidden="true">👑</span> Upgrade for More Tries
                            </>
                        )}
                    </button>

                    {/* Secondary Action */}
                    <button
                        onClick={handleClose}
                        aria-label="Maybe later"
                        className="w-full py-3 text-base text-white font-bold transition-all active:opacity-60 bg-white/10 rounded-xl hover:bg-white/20"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    )
}

