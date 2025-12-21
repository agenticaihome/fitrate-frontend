import React from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

/**
 * RulesScreen
 * 
 * Standalone rules page for the Weekly Challenge.
 * Can be accessed from footer link or shared directly.
 */
export default function RulesScreen({ onClose, currentEvent }) {
    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    return (
        <div className="min-h-screen flex flex-col p-6 overflow-auto" style={{
            background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))'
        }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10"
                >
                    <span className="text-white text-xl">←</span>
                </button>
                <h1 className="text-xl font-black text-white">Challenge Rules</h1>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Current Theme */}
            {currentEvent && (
                <div className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-4 mb-6 text-center">
                    <span className="text-3xl">{currentEvent.themeEmoji}</span>
                    <p className="text-emerald-400 font-bold text-lg mt-1">{currentEvent.theme}</p>
                    <p className="text-xs text-gray-400 mt-1">{currentEvent.themeDescription}</p>
                </div>
            )}

            {/* Rules Sections */}
            <div className="space-y-4">
                {/* Timing */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h2 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>⏰</span> Timing
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>Runs <strong className="text-white">Monday 00:00 UTC</strong> to <strong className="text-white">Sunday 23:59 UTC</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>New theme every Monday</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-400">•</span>
                            <span>Scores locked at week end</span>
                        </li>
                    </ul>
                </div>

                {/* Entries */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>🎫</span> Entries
                    </h2>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-cyan-500/10 rounded-xl p-3 text-center">
                            <p className="text-cyan-400 font-bold text-lg">1</p>
                            <p className="text-[10px] text-gray-400 uppercase">Free / Week</p>
                        </div>
                        <div className="bg-amber-500/10 rounded-xl p-3 text-center">
                            <p className="text-amber-400 font-bold text-lg">5</p>
                            <p className="text-[10px] text-gray-400 uppercase">Pro / Day</p>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 text-center">Only your highest score counts</p>
                </div>

                {/* Scoring */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>📊</span> Scoring
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            <span>AI rates <strong className="text-white">0-100</strong> based on theme + style</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            <span><strong className="text-cyan-400">Free:</strong> Whole numbers (87)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            <span><strong className="text-amber-400">Pro:</strong> Decimal precision (87.4)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-emerald-400">•</span>
                            <span>Ties: Earlier submission wins</span>
                        </li>
                    </ul>
                </div>

                {/* Prizes */}
                <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-2xl p-4 border border-yellow-500/30">
                    <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>🏆</span> Prizes
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400">👑</span>
                            <span><strong className="text-yellow-300">Top 5</strong> win 1 Year FREE Pro</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400">⏳</span>
                            <span>Previous winners sit out 4 weeks</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-yellow-400">🎉</span>
                            <span>Pro granted automatically at week end</span>
                        </li>
                    </ul>
                </div>

                {/* Fair Play */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <h2 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span>🛡️</span> Fair Play
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-rose-400">•</span>
                            <span>One account per person</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-rose-400">•</span>
                            <span>Original photos only</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-rose-400">•</span>
                            <span>Theme interpretation is final</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-rose-400">•</span>
                            <span>Abuse = permanent ban</span>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Back Button */}
            <button
                onClick={handleClose}
                className="mt-6 w-full py-4 rounded-2xl font-bold text-lg bg-white/10 text-white active:scale-[0.97] transition-transform"
            >
                ← Back to Challenge
            </button>

            {/* Footer */}
            <p className="text-center text-[10px] text-gray-600 mt-4">
                Last updated: December 2024 • FitRate.app
            </p>
        </div>
    )
}
