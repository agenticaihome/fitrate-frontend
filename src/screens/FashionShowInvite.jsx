/**
 * FashionShowInvite Screen
 * 
 * Shown after host creates a show:
 * - Show name
 * - Invite link (copy to clipboard)
 * - Share button
 * - "Go to Runway" button
 */

import React, { useState } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

export default function FashionShowInvite({
    showData,
    onGoToRunway,
    onBack
}) {
    const [copied, setCopied] = useState(false)

    const inviteUrl = showData?.inviteUrl || `https://fitrate.app/f/${showData?.showId}`

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl)
            setCopied(true)
            playSound('success')
            vibrate([30, 20, 30])
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Copy failed:', err)
            playSound('error')
        }
    }

    const shareLink = async () => {
        playSound('click')
        vibrate(30)

        const shareData = {
            title: `Join my Fashion Show: ${showData?.name}`,
            text: `🎭 Join "${showData?.name}" on FitRate!\n\nLet's see who has the best fit.`,
            url: inviteUrl
        }

        try {
            if (navigator.share && navigator.canShare?.(shareData)) {
                await navigator.share(shareData)
            } else {
                // Fallback to copy
                await copyLink()
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err)
                await copyLink()
            }
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center px-4">
            {/* Success Animation */}
            <div className="text-center mb-8">
                <div className="text-7xl mb-4 animate-bounce">🎭</div>
                <h1 className="text-3xl font-black text-white mb-2">
                    Show Created!
                </h1>
                <p className="text-white/50">
                    "{showData?.name}" is ready
                </p>
            </div>

            {/* Invite Card */}
            <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-6">
                <div className="text-center mb-6">
                    <p className="text-white/60 text-sm mb-3">Invite friends with this link:</p>
                    <div
                        onClick={copyLink}
                        className="bg-black/30 rounded-xl p-4 cursor-pointer active:bg-black/50 transition-colors"
                    >
                        <p className="text-cyan-400 font-mono text-sm break-all">
                            {inviteUrl}
                        </p>
                    </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={copyLink}
                        className="w-full py-4 rounded-xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                    >
                        {copied ? (
                            <>
                                <span>✅</span> Copied!
                            </>
                        ) : (
                            <>
                                <span>📋</span> Copy Link
                            </>
                        )}
                    </button>

                    <button
                        onClick={shareLink}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/30"
                    >
                        <span>📤</span> Share with Friends
                    </button>
                </div>
            </div>

            {/* Show Info */}
            <div className="w-full max-w-sm flex items-center justify-center gap-3 text-white/50 text-sm mb-8">
                <span className="px-3 py-1 rounded-full bg-white/10">
                    {showData?.vibeLabel}
                </span>
                {showData?.familySafe && (
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                        Family Safe ✅
                    </span>
                )}
            </div>

            {/* Go to Runway */}
            <button
                onClick={() => {
                    playSound('click')
                    vibrate(30)
                    onGoToRunway?.()
                }}
                className="text-white font-semibold flex items-center gap-2 active:opacity-70"
            >
                Go to Runway <span>→</span>
            </button>
        </div>
    )
}
