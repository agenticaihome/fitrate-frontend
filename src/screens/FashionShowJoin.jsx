/**
 * FashionShowJoin Screen
 * 
 * Guest joins a Fashion Show via invite link:
 * - Sees show name + vibe
 * - Picks nickname + emoji
 * - Taps "Join the Fashion Show"
 */

import React, { useState, useEffect } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

const EMOJI_OPTIONS = ['😎', '🔥', '✨', '💅', '👑', '🎭', '💜', '🌟', '😏', '🦋', '💫', '🎪']

export default function FashionShowJoin({
    showId,
    showData,
    userId,
    onJoined,
    onShowNotFound,
    loading: showLoading
}) {
    const [nickname, setNickname] = useState('')
    const [emoji, setEmoji] = useState('😎')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/analyze', '/api') || 'https://fitrate-production.up.railway.app/api'

    // If show not found or ended
    if (!showLoading && !showData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center px-4">
                <div className="text-6xl mb-4">🎭</div>
                <h1 className="text-2xl font-black text-white mb-2">Fashion Show Not Found</h1>
                <p className="text-white/50 text-center mb-6">
                    This show may have ended or the link is invalid
                </p>
                <button
                    onClick={() => {
                        playSound('click')
                        window.location.href = '/'
                    }}
                    className="px-6 py-3 rounded-xl bg-white/10 text-white font-semibold"
                >
                    Start Your Own Show
                </button>
            </div>
        )
    }

    // Show ended
    if (showData?.status === 'ended') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center px-4">
                <div className="text-6xl mb-4">🏁</div>
                <h1 className="text-2xl font-black text-white mb-2">Show Ended</h1>
                <p className="text-white/50 text-center mb-2">
                    "{showData.name}" has finished
                </p>
                <button
                    onClick={() => {
                        playSound('click')
                        window.location.href = '/'
                    }}
                    className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
                >
                    Start a New Show
                </button>
            </div>
        )
    }

    const handleJoin = async () => {
        if (!nickname.trim()) {
            setError('Pick a nickname!')
            return
        }

        setLoading(true)
        setError('')
        playSound('click')
        vibrate(30)

        try {
            const res = await fetch(`${API_BASE}/show/${showId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    nickname: nickname.trim(),
                    emoji
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to join')
            }

            playSound('success')
            vibrate([50, 30, 50])

            // Store nickname in localStorage for this show
            localStorage.setItem(`fashionshow_${showId}_nickname`, nickname.trim())
            localStorage.setItem(`fashionshow_${showId}_emoji`, emoji)

            onJoined(data)
        } catch (err) {
            console.error('[FashionShow] Join error:', err)
            setError(err.message || 'Something went wrong')
            playSound('error')
        } finally {
            setLoading(false)
        }
    }

    if (showLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center">
                <div className="text-5xl animate-pulse mb-4">🎭</div>
                <p className="text-white/50">Loading Fashion Show...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col">
            {/* Hero */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
                {/* Show Badge */}
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🎭</div>
                        <h1 className="text-3xl font-black text-white mb-2">
                            {showData.name}
                        </h1>
                        <div className="flex items-center justify-center gap-3 text-white/60">
                            <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
                                {showData.vibeLabel}
                            </span>
                            {showData.familySafe && (
                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                                    Family Safe ✅
                                </span>
                            )}
                        </div>
                        {showData.participantCount > 0 && (
                            <p className="text-white/40 text-sm mt-3">
                                {showData.participantCount} {showData.participantCount === 1 ? 'person' : 'people'} joined
                            </p>
                        )}
                    </div>

                    {/* Nickname Input */}
                    <div className="mb-4">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">
                            Your Nickname
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Your name"
                            maxLength={20}
                            className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg font-semibold placeholder:text-white/30 focus:outline-none focus:border-purple-500"
                        />
                    </div>

                    {/* Emoji Picker */}
                    <div className="mb-6">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">
                            Pick Your Emoji
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_OPTIONS.map((e) => (
                                <button
                                    key={e}
                                    onClick={() => {
                                        setEmoji(e)
                                        playSound('click')
                                        vibrate(10)
                                    }}
                                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${emoji === e
                                            ? 'bg-purple-500/30 border-2 border-purple-500 scale-110'
                                            : 'bg-white/10 border border-white/20'
                                        }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Join Button */}
                    <button
                        onClick={handleJoin}
                        disabled={loading || !nickname.trim()}
                        className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${loading || !nickname.trim()
                                ? 'bg-white/10 text-white/30'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 active:scale-[0.98]'
                            }`}
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin">⏳</span> Joining...
                            </>
                        ) : (
                            <>
                                <span>✨</span> Join the Fashion Show
                            </>
                        )}
                    </button>

                    {/* Privacy Note */}
                    <p className="text-white/30 text-xs text-center mt-4">
                        No account needed. Your nickname is only visible in this show.
                    </p>
                </div>
            </div>
        </div>
    )
}
