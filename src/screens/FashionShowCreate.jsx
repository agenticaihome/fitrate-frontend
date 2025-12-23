/**
 * FashionShowCreate Screen
 * 
 * Host creates a new Fashion Show with:
 * - Show name
 * - Vibe (Nice, Roast, Savage, Chaos)
 * - Duration (24h or 7 days)
 * - Family Safe toggle
 */

import React, { useState } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

const VIBES = [
    { id: 'nice', label: 'Nice 😇', desc: 'Supportive & encouraging', proOnly: false },
    { id: 'roast', label: 'Roast 🔥', desc: 'Playful teasing', proOnly: false },
    { id: 'savage', label: 'Savage 😈', desc: 'No mercy (Pro)', proOnly: true },
    { id: 'chaos', label: 'Chaos 🌀', desc: 'Unhinged fun (Pro)', proOnly: true }
]

const DURATIONS = [
    { hours: 24, label: '24 Hours' },
    { hours: 168, label: '7 Days' }
]

export default function FashionShowCreate({
    isPro,
    userId,
    onShowCreated,
    onBack
}) {
    const [showName, setShowName] = useState('')
    const [vibe, setVibe] = useState('nice')
    const [duration, setDuration] = useState(24)
    const [familySafe, setFamilySafe] = useState(true) // Default ON
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/analyze', '/api') || 'https://fitrate-production.up.railway.app/api'

    const handleCreate = async () => {
        if (!showName.trim()) {
            setError('Give your Fashion Show a name!')
            return
        }

        if (showName.length < 2 || showName.length > 50) {
            setError('Name must be 2-50 characters')
            return
        }

        // Check Pro for Pro-only vibes
        const selectedVibe = VIBES.find(v => v.id === vibe)
        if (selectedVibe?.proOnly && !isPro) {
            setError(`${selectedVibe.label} requires Pro subscription`)
            return
        }

        setLoading(true)
        setError('')
        playSound('click')
        vibrate(30)

        try {
            const res = await fetch(`${API_BASE}/show/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: showName.trim(),
                    vibe,
                    familySafe,
                    durationHours: duration,
                    entriesPerPerson: 1,
                    userId
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to create show')
            }

            playSound('success')
            vibrate([50, 30, 50])
            onShowCreated(data)
        } catch (err) {
            console.error('[FashionShow] Create error:', err)
            setError(err.message || 'Something went wrong')
            playSound('error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col">
            {/* Header */}
            <div className="pt-safe px-4 py-4">
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        onBack()
                    }}
                    className="text-white/60 text-sm flex items-center gap-1"
                >
                    ← Back
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 pb-8 flex flex-col">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white mb-2">
                        Start a Fashion Show ✨
                    </h1>
                    <p className="text-white/50 text-sm">
                        Create a private runway for friends & family
                    </p>
                </div>

                {/* Show Name */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">
                        Show Name
                    </label>
                    <input
                        type="text"
                        value={showName}
                        onChange={(e) => setShowName(e.target.value)}
                        placeholder="Friday Night Fits"
                        maxLength={50}
                        className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 text-white text-lg font-semibold placeholder:text-white/30 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                    />
                    <p className="text-xs text-white/40 mt-1 text-right">
                        {showName.length}/50
                    </p>
                </div>

                {/* Vibe Selector */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">
                        Vibe
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {VIBES.map((v) => {
                            const isLocked = v.proOnly && !isPro
                            const isSelected = vibe === v.id
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => {
                                        if (!isLocked) {
                                            setVibe(v.id)
                                            playSound('click')
                                            vibrate(15)
                                        }
                                    }}
                                    disabled={isLocked}
                                    className={`p-4 rounded-2xl border-2 transition-all text-left relative ${isSelected
                                            ? 'border-purple-500 bg-purple-500/20'
                                            : isLocked
                                                ? 'border-white/10 bg-white/5 opacity-50'
                                                : 'border-white/20 bg-white/5 hover:border-white/30'
                                        }`}
                                >
                                    <div className="text-xl mb-1">{v.label}</div>
                                    <div className="text-xs text-white/50">{v.desc}</div>
                                    {isLocked && (
                                        <div className="absolute top-2 right-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                                            PRO
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Duration */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">
                        Duration
                    </label>
                    <div className="flex gap-3">
                        {DURATIONS.map((d) => {
                            const isSelected = duration === d.hours
                            return (
                                <button
                                    key={d.hours}
                                    onClick={() => {
                                        setDuration(d.hours)
                                        playSound('click')
                                        vibrate(15)
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl border transition-all ${isSelected
                                            ? 'border-purple-500 bg-purple-500/20 text-white font-bold'
                                            : 'border-white/20 bg-white/5 text-white/60'
                                        }`}
                                >
                                    {d.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Family Safe Toggle */}
                <div className="mb-8">
                    <button
                        onClick={() => {
                            setFamilySafe(!familySafe)
                            playSound('click')
                            vibrate(15)
                        }}
                        className="w-full p-4 rounded-2xl border border-white/20 bg-white/5 flex items-center justify-between"
                    >
                        <div>
                            <div className="text-white font-semibold flex items-center gap-2">
                                Family Safe Mode
                                {familySafe && <span className="text-green-400 text-sm">✅</span>}
                            </div>
                            <div className="text-xs text-white/50">
                                Clean humor only — great for all ages
                            </div>
                        </div>
                        <div
                            className={`w-12 h-7 rounded-full transition-all flex items-center px-1 ${familySafe ? 'bg-green-500' : 'bg-white/20'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 rounded-full bg-white transition-transform ${familySafe ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </div>
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                {/* Create Button */}
                <button
                    onClick={handleCreate}
                    disabled={loading || !showName.trim()}
                    className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all ${loading || !showName.trim()
                            ? 'bg-white/10 text-white/30'
                            : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 active:scale-[0.98]'
                        }`}
                >
                    {loading ? (
                        <>
                            <span className="animate-spin">⏳</span> Creating...
                        </>
                    ) : (
                        <>
                            <span>🎭</span> Start the Show
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
