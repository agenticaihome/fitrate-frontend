import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getDisplayName } from '../utils/displayNameStorage'

// ============================================
// 12 THRONE DEFINITIONS - One per AI mode
// ============================================
export const THRONES = [
    { id: 'honest', emoji: '😐', name: 'Truth King', color: '#6b7280', mode: 'Honest' },
    { id: 'nice', emoji: '😇', name: 'Kind King', color: '#10b981', mode: 'Nice' },
    { id: 'roast', emoji: '🔥', name: 'Roast King', color: '#ef4444', mode: 'Roast' },
    { id: 'savage', emoji: '💀', name: 'Savage King', color: '#1f2937', mode: 'Savage' },
    { id: 'rizz', emoji: '😏', name: 'Rizz King', color: '#ec4899', mode: 'Rizz' },
    { id: 'coquette', emoji: '🎀', name: 'Coquette King', color: '#f472b6', mode: 'Coquette' },
    { id: 'aura', emoji: '🔮', name: 'Aura King', color: '#8b5cf6', mode: 'Aura' },
    { id: 'y2k', emoji: '📱', name: 'Y2K King', color: '#06b6d4', mode: 'Y2K' },
    { id: 'academia', emoji: '📚', name: 'Scholar King', color: '#78350f', mode: 'Dark Academia' },
    { id: 'coastal', emoji: '🌊', name: 'Coastal King', color: '#0ea5e9', mode: 'Coastal' },
    { id: 'chaos', emoji: '🎪', name: 'Chaos King', color: '#f59e0b', mode: 'Chaos' },
    { id: 'celeb', emoji: '✨', name: 'Star King', color: '#fbbf24', mode: 'Celeb Match' }
]

// ============================================
// LOCAL STORAGE FOR KINGS
// ============================================
const KINGS_KEY = 'fitrate_kings'

export const getKings = () => {
    try {
        const stored = localStorage.getItem(KINGS_KEY)
        if (stored) {
            const data = JSON.parse(stored)
            // Check if kings are still valid (within 24 hours)
            const now = Date.now()
            const validKings = {}
            for (const [throneId, king] of Object.entries(data)) {
                if (now - king.crownedAt < 24 * 60 * 60 * 1000) {
                    validKings[throneId] = king
                }
            }
            return validKings
        }
    } catch (e) {
        console.error('[Kings] Failed to load:', e)
    }
    return {}
}

export const setKing = (throneId, kingData) => {
    try {
        const kings = getKings()
        kings[throneId] = {
            ...kingData,
            crownedAt: Date.now(),
            defenses: 0
        }
        localStorage.setItem(KINGS_KEY, JSON.stringify(kings))
        return kings[throneId]
    } catch (e) {
        console.error('[Kings] Failed to save:', e)
        return null
    }
}

export const recordDefense = (throneId) => {
    try {
        const kings = getKings()
        if (kings[throneId]) {
            kings[throneId].defenses = (kings[throneId].defenses || 0) + 1
            localStorage.setItem(KINGS_KEY, JSON.stringify(kings))
            return kings[throneId]
        }
    } catch (e) {
        console.error('[Kings] Failed to record defense:', e)
    }
    return null
}

// ============================================
// ANIMATED BACKGROUND
// ============================================
const AnimatedBackground = ({ color }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
                background: `radial-gradient(circle, ${color}, transparent)`,
                top: '-10%',
                right: '-20%',
                animation: 'orb-float 8s ease-in-out infinite'
            }}
        />
        <div
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{
                background: `radial-gradient(circle, #ffd700, transparent)`,
                bottom: '-5%',
                left: '-10%',
                animation: 'orb-float 12s ease-in-out infinite reverse'
            }}
        />
    </div>
)

// ============================================
// THRONE CARD COMPONENT
// ============================================
const ThroneCard = ({ throne, king, isMyThrone, onChallenge, playSound, vibrate }) => {
    const hasKing = !!king
    const displayName = getDisplayName()

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                playSound?.('click')
                vibrate?.(15)
                onChallenge(throne)
            }}
            className="relative p-4 rounded-2xl text-left transition-all"
            style={{
                background: hasKing
                    ? `linear-gradient(135deg, ${throne.color}20, ${throne.color}05)`
                    : 'rgba(255,255,255,0.03)',
                border: isMyThrone
                    ? `2px solid ${throne.color}`
                    : hasKing
                        ? `1px solid ${throne.color}40`
                        : '1px solid rgba(255,255,255,0.1)'
            }}
        >
            {/* Crown badge for current king */}
            {isMyThrone && (
                <div
                    className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: '#ffd700', color: '#000' }}
                >
                    👑 YOU
                </div>
            )}

            <div className="flex items-center gap-3">
                {/* Throne emoji */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                        background: hasKing ? `${throne.color}30` : 'rgba(255,255,255,0.05)',
                        boxShadow: hasKing ? `0 0 20px ${throne.color}40` : 'none'
                    }}
                >
                    {throne.emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-bold text-sm truncate">{throne.name}</h3>
                    {hasKing ? (
                        <p className="text-gray-400 text-xs truncate">
                            {isMyThrone ? 'Defend your crown!' : `${king.displayName || 'Anonymous'}`}
                        </p>
                    ) : (
                        <p className="text-green-400 text-xs">🏆 Vacant - Claim it!</p>
                    )}
                </div>

                {/* Defense count or challenge arrow */}
                <div className="flex-shrink-0">
                    {hasKing && king.defenses > 0 ? (
                        <div className="text-center">
                            <span className="text-white/80 text-sm font-bold">{king.defenses}</span>
                            <p className="text-gray-500 text-[8px]">defenses</p>
                        </div>
                    ) : (
                        <span className="text-gray-500 text-lg">→</span>
                    )}
                </div>
            </div>
        </motion.button>
    )
}

// ============================================
// MAIN THRONE ROOM SCREEN
// ============================================
export default function ThroneRoom({
    onChallenge,
    onBack,
    playSound,
    vibrate,
    color = '#ffd700'
}) {
    const [kings, setKingsState] = useState(() => getKings())
    const displayName = getDisplayName()

    // Refresh kings periodically
    useEffect(() => {
        const interval = setInterval(() => {
            setKingsState(getKings())
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const myThrones = THRONES.filter(t => kings[t.id]?.displayName === displayName)
    const vacantCount = THRONES.filter(t => !kings[t.id]).length

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden"
            style={{
                background: `linear-gradient(180deg, #0a0a1a 0%, ${color}08 50%, #0a0a1a 100%)`
            }}
        >
            <AnimatedBackground color={color} />

            {/* Header */}
            <div className="relative z-20 flex items-center justify-between p-4 pt-6">
                <button
                    onClick={() => {
                        playSound?.('click')
                        vibrate?.(10)
                        onBack?.()
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-white text-lg">←</span>
                </button>

                <div className="text-center">
                    <h1 className="text-xl font-black text-white">👑 Throne Room</h1>
                    <p className="text-gray-400 text-xs">12 Thrones • {vacantCount} Vacant</p>
                </div>

                <div className="w-11" />
            </div>

            {/* My Thrones Banner */}
            {myThrones.length > 0 && (
                <div className="px-6 mb-4">
                    <div
                        className="p-4 rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
                            border: '1px solid rgba(255,215,0,0.3)'
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">👑</span>
                            <div>
                                <h3 className="text-white font-bold">You are King!</h3>
                                <p className="text-gray-400 text-xs">
                                    Ruling {myThrones.length} throne{myThrones.length > 1 ? 's' : ''}: {myThrones.map(t => t.emoji).join(' ')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="px-6 mb-4">
                <div
                    className="p-3 rounded-xl text-center"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <p className="text-gray-300 text-sm">
                        <span className="text-green-400">🏆 Vacant</span> = Claim it instantly! &nbsp;
                        <span className="text-yellow-400">👑 Occupied</span> = Battle the King!
                    </p>
                </div>
            </div>

            {/* Throne Grid */}
            <div className="flex-1 px-6 overflow-y-auto pb-24">
                <div className="grid grid-cols-2 gap-3">
                    {THRONES.map(throne => (
                        <ThroneCard
                            key={throne.id}
                            throne={throne}
                            king={kings[throne.id]}
                            isMyThrone={kings[throne.id]?.displayName === displayName}
                            onChallenge={onChallenge}
                            playSound={playSound}
                            vibrate={vibrate}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom Stats */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black/90 to-transparent">
                <div className="flex items-center justify-center gap-6 text-center">
                    <div>
                        <span className="text-2xl font-black text-white">{myThrones.length}</span>
                        <p className="text-gray-400 text-xs">Your Crowns</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div>
                        <span className="text-2xl font-black text-white">{12 - vacantCount}</span>
                        <p className="text-gray-400 text-xs">Total Kings</p>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div>
                        <span className="text-2xl font-black text-green-400">{vacantCount}</span>
                        <p className="text-gray-400 text-xs">Up for Grabs</p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes orb-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 20px) scale(1.1); }
                }
            `}</style>
        </div>
    )
}
