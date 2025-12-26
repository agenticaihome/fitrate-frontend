/**
 * FashionShowCreate Screen
 *
 * Host creates a new Fashion Show with:
 * - Show name
 * - Vibe/AI Mode (8 options)
 * - Duration (24h or 7 days)
 * - Family Safe toggle
 */

import React, { useState } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { trackFashionShowCreate } from '../utils/analytics'

// All 12 AI modes for Fashion Show - everyone competes in same mode
const VIBES = [
    { id: 'nice', emoji: '😇', label: 'Nice', desc: 'Supportive & encouraging', color: 'cyan', proOnly: false },
    { id: 'roast', emoji: '🔥', label: 'Roast', desc: 'Brutally honest', color: 'orange', proOnly: false },
    { id: 'honest', emoji: '📊', label: 'Honest', desc: 'Balanced analysis', color: 'blue', proOnly: false },
    { id: 'savage', emoji: '💀', label: 'Savage', desc: 'No mercy', color: 'purple', proOnly: false },
    { id: 'rizz', emoji: '😏', label: 'Rizz', desc: 'Dating vibes', color: 'pink', proOnly: false },
    { id: 'celeb', emoji: '⭐', label: 'Celebrity', desc: 'Star treatment', color: 'yellow', proOnly: false },
    { id: 'aura', emoji: '🔮', label: 'Aura', desc: 'Mystical energy', color: 'violet', proOnly: false },
    { id: 'chaos', emoji: '🎪', label: 'Chaos', desc: 'Unhinged chaos', color: 'red', proOnly: false },
    { id: 'y2k', emoji: '💎', label: 'Y2K', desc: "That's hot", color: 'pink', proOnly: false },
    { id: 'villain', emoji: '🖤', label: 'Villain', desc: 'Main villain', color: 'slate', proOnly: false },
    { id: 'coquette', emoji: '🎀', label: 'Coquette', desc: 'Soft & dainty', color: 'rose', proOnly: false },
    { id: 'hypebeast', emoji: '👟', label: 'Hypebeast', desc: 'Drip check', color: 'amber', proOnly: false }
]

// Color mappings for each mode
const VIBE_COLORS = {
    nice: { bg: 'rgba(0,212,255,0.15)', ring: 'ring-cyan-400', text: 'text-cyan-300' },
    roast: { bg: 'rgba(255,68,68,0.15)', ring: 'ring-orange-400', text: 'text-orange-300' },
    honest: { bg: 'rgba(59,130,246,0.15)', ring: 'ring-blue-400', text: 'text-blue-300' },
    savage: { bg: 'rgba(139,0,255,0.15)', ring: 'ring-purple-400', text: 'text-purple-300' },
    rizz: { bg: 'rgba(255,105,180,0.15)', ring: 'ring-pink-400', text: 'text-pink-300' },
    celeb: { bg: 'rgba(255,215,0,0.15)', ring: 'ring-yellow-400', text: 'text-yellow-300' },
    aura: { bg: 'rgba(155,89,182,0.15)', ring: 'ring-violet-400', text: 'text-violet-300' },
    chaos: { bg: 'rgba(255,107,107,0.15)', ring: 'ring-red-400', text: 'text-red-300' },
    y2k: { bg: 'rgba(255,192,203,0.15)', ring: 'ring-pink-400', text: 'text-pink-300' },
    villain: { bg: 'rgba(71,85,105,0.15)', ring: 'ring-slate-400', text: 'text-slate-300' },
    coquette: { bg: 'rgba(251,207,232,0.15)', ring: 'ring-rose-400', text: 'text-rose-300' },
    hypebeast: { bg: 'rgba(251,191,36,0.15)', ring: 'ring-amber-400', text: 'text-amber-300' }
}

const DURATIONS = [
    { hours: 24, label: '24 Hours' },
    { hours: 72, label: '3 Days' },
    { hours: 120, label: '5 Days' },
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
            trackFashionShowCreate(vibe)
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

                {/* Vibe/AI Mode Selector */}
                <div className="mb-6">
                    <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">
                        AI Mode
                    </label>
                    <p className="text-xs text-white/40 mb-3">Everyone in the show gets rated in this mode</p>
                    <div className="grid grid-cols-4 gap-2">
                        {VIBES.map((v) => {
                            const isLocked = v.proOnly && !isPro
                            const isSelected = vibe === v.id
                            const colors = VIBE_COLORS[v.id]
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
                                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all active:scale-95 ${isSelected ? `ring-2 ${colors.ring}` : ''
                                        } ${isLocked ? 'opacity-40' : ''}`}
                                    style={{ background: colors.bg }}
                                >
                                    <span className="text-2xl">{v.emoji}</span>
                                    <span className={`text-[10px] font-semibold ${colors.text}`}>{v.label}</span>
                                    {isLocked && (
                                        <span className="absolute top-1 right-1 text-[8px] bg-yellow-500/30 text-yellow-400 px-1 rounded">PRO</span>
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
