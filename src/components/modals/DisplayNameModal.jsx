import React, { useState, useMemo } from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'
import { validateDisplayName, generateSuggestedName } from '../../utils/displayNameStorage'

// Premium floating particles
const FloatingParticles = () => {
    const particles = useMemo(() =>
        Array.from({ length: 8 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 8,
            duration: 12 + Math.random() * 8,
            opacity: 0.15 + Math.random() * 0.2,
            drift: -15 + Math.random() * 30
        })), []
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-5px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 2 === 0 ? '#00d4ff' : '#00ff88',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? '#00d4ff' : '#00ff88'}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}
        </div>
    )
}

/**
 * DisplayNameModal
 * 
 * Prompts user to set a display name before entering Arena.
 * Premium glassmorphism design with validation.
 */
export default function DisplayNameModal({ onSubmit, onClose, userId }) {
    const [name, setName] = useState('')
    const [error, setError] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = () => {
        const validation = validateDisplayName(name)
        if (!validation.valid) {
            setError(validation.error)
            playSound('error')
            vibrate(50)
            return
        }

        setIsSubmitting(true)
        playSound('success')
        vibrate(20)
        onSubmit(name.trim())
    }

    const handleRandomize = () => {
        // Generate a new random name each time
        const randomName = generateSuggestedName(Date.now().toString())
        setName(randomName)
        setError(null)
        playSound('click')
        vibrate(10)
    }

    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose?.()
    }

    const handleInputChange = (e) => {
        const val = e.target.value
        // Limit to 15 characters
        if (val.length <= 15) {
            setName(val)
            setError(null)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="displayname-title"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[400px] h-[400px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(0,212,255,0.2) 0%, transparent 70%)',
                    top: '25%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite'
                }} />
            </div>

            <div
                className="glass-premium rounded-3xl p-6 max-w-sm w-full border border-cyan-500/30 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)',
                    boxShadow: '0 0 60px rgba(0,212,255,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    animation: 'modal-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                <FloatingParticles />

                {/* Close Button (only if onClose provided) */}
                {onClose && (
                    <button
                        onClick={handleClose}
                        aria-label="Close"
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <span className="text-white text-xl">×</span>
                    </button>
                )}

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3 relative inline-block" style={{
                        animation: 'float-gentle 3s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.5))'
                    }}>⚔️</div>
                    <h2 id="displayname-title" className="text-2xl font-black text-white mb-1">
                        Choose Your Name
                    </h2>
                    <p className="text-sm text-gray-400">
                        This is how you'll appear on leaderboards
                    </p>
                </div>

                {/* Input */}
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={name}
                            onChange={handleInputChange}
                            placeholder="Enter display name..."
                            maxLength={15}
                            autoFocus
                            className="w-full px-4 py-4 rounded-xl text-white text-lg font-semibold placeholder-white/30 transition-all focus:outline-none"
                            style={{
                                background: 'rgba(255,255,255,0.08)',
                                border: error ? '2px solid #ef4444' : '2px solid rgba(0,212,255,0.3)',
                                boxShadow: error ? '0 0 20px rgba(239,68,68,0.2)' : '0 0 20px rgba(0,212,255,0.1)'
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
                            {name.length}/15
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-red-400 text-xs mt-2 pl-1">{error}</p>
                    )}

                    {/* Randomize button */}
                    <button
                        onClick={handleRandomize}
                        className="mt-3 flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                        <span>🎲</span>
                        <span>Randomize</span>
                    </button>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || name.length < 3}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] mb-3 btn-premium-shine relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        background: name.length >= 3
                            ? 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)'
                            : 'rgba(255,255,255,0.1)',
                        color: name.length >= 3 ? '#000' : 'rgba(255,255,255,0.5)',
                        boxShadow: name.length >= 3
                            ? '0 8px 30px rgba(0,212,255,0.4), 0 0 0 1px rgba(0,212,255,0.3)'
                            : 'none'
                    }}
                >
                    {isSubmitting ? '...' : 'Enter Arena'}
                </button>

                {/* Skip option */}
                {onClose && (
                    <button
                        onClick={handleClose}
                        className="w-full py-2 text-sm text-gray-500 font-medium"
                    >
                        Skip for now
                    </button>
                )}

                {/* Privacy note */}
                <p className="text-[10px] text-white/30 text-center mt-4">
                    ✨ Your name is visible to other players
                </p>
            </div>
        </div>
    )
}
