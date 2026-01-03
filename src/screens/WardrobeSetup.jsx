import React, { useState, useRef, useEffect } from 'react'
import { getDisplayName } from '../utils/displayNameStorage'

// ============================================
// LOCAL STORAGE FOR WARDROBE
// ============================================
const WARDROBE_KEY = 'fitrate_wardrobe'

export const getWardrobe = () => {
    try {
        const stored = localStorage.getItem(WARDROBE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('[Wardrobe] Failed to load:', e)
    }
    return { outfits: [], lastUpdated: null }
}

export const saveWardrobe = (outfits) => {
    try {
        const data = {
            outfits: outfits.slice(0, 5), // Max 5
            lastUpdated: new Date().toISOString()
        }
        localStorage.setItem(WARDROBE_KEY, JSON.stringify(data))
        return data
    } catch (e) {
        console.error('[Wardrobe] Failed to save:', e)
        return null
    }
}

// Sync wardrobe to backend for matchmaking
export const syncWardrobeToBackend = async (userId, outfits, displayName) => {
    if (!outfits || outfits.length < 5) return { success: false }

    const API_BASE = (import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze').replace('/api/analyze', '/api')

    try {
        const response = await fetch(`${API_BASE}/wardrobe/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId,
                outfits: outfits.map(o => ({ id: o.id, thumb: o.thumb })),
                displayName: displayName || 'Anonymous'
            })
        })

        if (response.ok) {
            const data = await response.json()
            console.log('[Wardrobe] Synced to backend:', data.outfitCount, 'outfits')
            return { success: true, ...data }
        }
    } catch (e) {
        console.error('[Wardrobe] Backend sync failed:', e)
    }
    return { success: false }
}

export const hasCompleteWardrobe = () => {
    const { outfits } = getWardrobe()
    return outfits.length >= 5
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
                background: `radial-gradient(circle, #00ff88, transparent)`,
                bottom: '-5%',
                left: '-10%',
                animation: 'orb-float 12s ease-in-out infinite reverse'
            }}
        />
    </div>
)

// ============================================
// OUTFIT SLOT COMPONENT
// ============================================
const OutfitSlot = ({ index, outfit, onAdd, onRemove, isActive, color }) => {
    const isEmpty = !outfit

    return (
        <div
            className={`relative aspect-[3/4] rounded-2xl overflow-hidden transition-all duration-300 ${isActive ? 'ring-2 ring-offset-2 ring-offset-black' : ''
                }`}
            style={{
                background: isEmpty ? 'rgba(255,255,255,0.05)' : 'transparent',
                border: isEmpty ? '2px dashed rgba(255,255,255,0.2)' : 'none',
                ringColor: color
            }}
        >
            {outfit ? (
                <>
                    <img
                        src={outfit.thumb}
                        alt={`Outfit ${index + 1}`}
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={() => onRemove(index)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white text-sm active:scale-90 transition-transform"
                    >
                        ✕
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <span className="text-white/90 text-xs font-medium">#{index + 1}</span>
                    </div>
                </>
            ) : (
                <button
                    onClick={() => onAdd(index)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 active:bg-white/5 transition-colors"
                >
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center"
                        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                    >
                        <span className="text-2xl">+</span>
                    </div>
                    <span className="text-gray-400 text-xs">Add Fit #{index + 1}</span>
                </button>
            )}
        </div>
    )
}

// ============================================
// MAIN WARDROBE SETUP SCREEN
// ============================================
export default function WardrobeSetup({
    onComplete,
    onBack,
    playSound,
    vibrate,
    color = '#9b59b6'
}) {
    const [outfits, setOutfits] = useState(() => {
        const { outfits: stored } = getWardrobe()
        return stored.length > 0 ? stored : Array(5).fill(null)
    })
    const [activeSlot, setActiveSlot] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef(null)
    const multiFileInputRef = useRef(null)
    const displayName = getDisplayName()

    const filledCount = outfits.filter(o => o !== null).length
    const isComplete = filledCount >= 5

    const handleAddClick = (index) => {
        playSound?.('click')
        vibrate?.(15)
        setActiveSlot(index)
        fileInputRef.current?.click()
    }

    const handleRemove = (index) => {
        playSound?.('click')
        vibrate?.(20)
        const updated = [...outfits]
        updated[index] = null
        setOutfits(updated)
        saveWardrobe(updated.filter(Boolean))
    }

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file || activeSlot === null) return

        setIsUploading(true)
        playSound?.('whoosh')

        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result

            // Create thumbnail
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const size = 400
                canvas.width = size
                canvas.height = size * (img.height / img.width)
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                const thumb = canvas.toDataURL('image/jpeg', 0.7)

                const updated = [...outfits]
                updated[activeSlot] = {
                    id: Date.now().toString(),
                    thumb,
                    addedAt: new Date().toISOString()
                }
                setOutfits(updated)
                saveWardrobe(updated.filter(Boolean))
                setIsUploading(false)
                setActiveSlot(null)
                playSound?.('success')
                vibrate?.([50, 30, 50])
            }
            img.src = dataUrl
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    // Handle bulk file selection (multiple files at once)
    const handleBulkSelect = async (e) => {
        const files = Array.from(e.target.files || []).slice(0, 5)
        if (files.length === 0) return

        setIsUploading(true)
        playSound?.('whoosh')

        const processFile = (file, index) => {
            return new Promise((resolve) => {
                const reader = new FileReader()
                reader.onload = () => {
                    const img = new Image()
                    img.onload = () => {
                        const canvas = document.createElement('canvas')
                        const size = 400
                        canvas.width = size
                        canvas.height = size * (img.height / img.width)
                        const ctx = canvas.getContext('2d')
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                        const thumb = canvas.toDataURL('image/jpeg', 0.7)
                        resolve({
                            id: `${Date.now()}_${index}`,
                            thumb,
                            addedAt: new Date().toISOString()
                        })
                    }
                    img.src = reader.result
                }
                reader.readAsDataURL(file)
            })
        }

        // Process all files in parallel
        const newOutfits = await Promise.all(files.map((f, i) => processFile(f, i)))

        // Fill empty slots first, then overwrite from start
        const updated = [...outfits]
        let fileIndex = 0
        for (let i = 0; i < 5 && fileIndex < newOutfits.length; i++) {
            if (updated[i] === null) {
                updated[i] = newOutfits[fileIndex++]
            }
        }
        // If we still have files, overwrite from the beginning
        for (let i = 0; i < 5 && fileIndex < newOutfits.length; i++) {
            updated[i] = newOutfits[fileIndex++]
        }

        setOutfits(updated)
        saveWardrobe(updated.filter(Boolean))
        setIsUploading(false)
        playSound?.('success')
        vibrate?.([50, 30, 50, 30, 50])
        e.target.value = ''
    }

    const handleContinue = () => {
        if (!isComplete) return
        playSound?.('celebrate')
        vibrate?.([100, 50, 100])
        onComplete?.(outfits.filter(Boolean))
    }

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden"
            style={{
                background: `linear-gradient(180deg, #0a0a1a 0%, ${color}08 50%, #0a0a1a 100%)`
            }}
        >
            <AnimatedBackground color={color} />

            {/* Hidden file inputs */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="sr-only"
            />
            <input
                type="file"
                accept="image/*"
                multiple
                ref={multiFileInputRef}
                onChange={handleBulkSelect}
                className="sr-only"
            />

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
                    <h1 className="text-xl font-black text-white">Build Your Wardrobe</h1>
                    <p className="text-gray-400 text-xs">{filledCount}/5 outfits added</p>
                </div>

                <div className="w-11" /> {/* Spacer */}
            </div>

            {/* Progress bar */}
            <div className="px-6 mb-4">
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${(filledCount / 5) * 100}%`,
                            background: `linear-gradient(90deg, ${color}, #00ff88)`
                        }}
                    />
                </div>
            </div>

            {/* Instructions */}
            <div className="px-6 mb-4">
                <div
                    className="p-4 rounded-2xl text-center"
                    style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-3xl block mb-2">👕</span>
                    <p className="text-gray-300 text-sm">
                        Upload your <span className="text-white font-bold">5 best outfits</span>.<br />
                        You'll battle opponents in a Best of 5 showdown!
                    </p>
                </div>
            </div>

            {/* Bulk Upload Button */}
            <div className="px-6 mb-4">
                <button
                    onClick={() => {
                        playSound?.('click')
                        vibrate?.(15)
                        multiFileInputRef.current?.click()
                    }}
                    disabled={isUploading}
                    className="w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    style={{
                        background: `linear-gradient(135deg, ${color}40, ${color}20)`,
                        border: `1px solid ${color}50`
                    }}
                >
                    <span className="text-lg">📁</span>
                    <span className="text-white">Select All 5 Photos</span>
                </button>
                <p className="text-gray-400 text-xs text-center mt-2">
                    Or tap individual slots below
                </p>
            </div>

            {/* Outfit Grid */}
            <div className="flex-1 px-6 overflow-y-auto">
                <div className="grid grid-cols-3 gap-3 pb-6">
                    {outfits.slice(0, 3).map((outfit, i) => (
                        <OutfitSlot
                            key={i}
                            index={i}
                            outfit={outfit}
                            onAdd={handleAddClick}
                            onRemove={handleRemove}
                            isActive={activeSlot === i}
                            color={color}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3 max-w-[66%] mx-auto pb-24">
                    {outfits.slice(3, 5).map((outfit, i) => (
                        <OutfitSlot
                            key={i + 3}
                            index={i + 3}
                            outfit={outfit}
                            onAdd={handleAddClick}
                            onRemove={handleRemove}
                            isActive={activeSlot === i + 3}
                            color={color}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black/90 to-transparent">
                <button
                    onClick={handleContinue}
                    disabled={!isComplete || isUploading}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] ${isComplete ? 'text-black' : 'text-gray-400'
                        }`}
                    style={{
                        background: isComplete
                            ? `linear-gradient(135deg, ${color}, #00ff88)`
                            : 'rgba(255,255,255,0.1)',
                        opacity: isComplete ? 1 : 0.6
                    }}
                >
                    {isUploading ? '📸 Processing...' : isComplete ? '⚔️ Ready to Battle!' : `Add ${5 - filledCount} More Outfits`}
                </button>
            </div>

            {/* Keyframe animations */}
            <style>{`
                @keyframes orb-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 20px) scale(1.1); }
                }
            `}</style>
        </div>
    )
}
