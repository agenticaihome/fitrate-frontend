import React, { useState, useMemo } from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

const API_URL = import.meta.env.VITE_API_URL || 'https://fitrate-api-production.up.railway.app'

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
                        background: p.id % 2 === 0 ? '#A855F7' : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 2 === 0 ? '#A855F7' : '#fff'}`,
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
 * RestoreProModal - Self-Service Purchase Recovery
 * Users enter their checkout email to restore Pro + purchased scans
 */
export default function RestoreProModal({ onClose, userId, onRestoreSuccess }) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(null)

    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    const handleRestore = async (e) => {
        e.preventDefault()
        if (!email.trim()) {
            setError('Please enter your email')
            return
        }

        playSound('click')
        vibrate(20)
        setLoading(true)
        setError('')

        try {
            const response = await fetch(`${API_URL}/api/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId || localStorage.getItem('fitrate_user_id'),
                    email: email.trim()
                })
            })

            const data = await response.json()

            if (data.success) {
                playSound('success')
                vibrate([30, 20, 30])
                setSuccess(data)

                // Notify parent component
                if (onRestoreSuccess) {
                    onRestoreSuccess(data)
                }
            } else {
                setError(data.error || 'No purchases found for this email')
            }
        } catch (err) {
            console.error('Restore error:', err)
            setError('Connection error. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
            {/* Background glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[400px] h-[400px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
                    top: '25%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite'
                }} />
            </div>

            <div className="glass-premium rounded-3xl p-6 max-w-sm w-full border border-purple-500/30 relative overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.98) 100%)',
                    boxShadow: '0 0 60px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                    animation: 'modal-slide-up 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}>
                <FloatingParticles />

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <span className="text-white text-xl">×</span>
                </button>

                {success ? (
                    /* Success State */
                    <div className="text-center py-4">
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-2xl font-black text-white mb-2">
                            Restored!
                        </h2>
                        <p className="text-purple-200/80 mb-4">
                            {success.message}
                        </p>

                        <div className="bg-white/5 rounded-2xl p-4 mb-6 space-y-2">
                            {success.restoredPro && (
                                <div className="flex items-center justify-center gap-2 text-green-400">
                                    <span>👑</span>
                                    <span>Pro Status Restored</span>
                                </div>
                            )}
                            {success.restoredScans > 0 && (
                                <div className="flex items-center justify-center gap-2 text-cyan-400">
                                    <span>📦</span>
                                    <span>{success.restoredScans} Scans Recovered</span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97]"
                            style={{
                                background: 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
                                color: 'white',
                                boxShadow: '0 8px 30px rgba(139,92,246,0.4)'
                            }}
                        >
                            Awesome! ✨
                        </button>
                    </div>
                ) : (
                    /* Restore Form */
                    <>
                        {/* Header */}
                        <div className="text-center mb-5">
                            <div className="text-5xl mb-3 relative inline-block" style={{
                                animation: 'float-gentle 3s ease-in-out infinite',
                                filter: 'drop-shadow(0 0 20px rgba(139,92,246,0.5))'
                            }}>🔄</div>
                            <h2 id="restore-title" className="text-2xl font-black text-white mb-1">
                                Restore Purchases
                            </h2>
                            <p className="text-sm text-gray-400">
                                New device or cleared data? No worries!
                            </p>
                        </div>

                        {/* Email Form */}
                        <form onSubmit={handleRestore}>
                            <div className="mb-4">
                                <label className="block text-sm text-white/60 mb-2">
                                    Email used at checkout
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    placeholder="your@email.com"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none transition-colors"
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] mb-3 relative overflow-hidden disabled:opacity-50"
                                style={{
                                    background: 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
                                    color: 'white',
                                    boxShadow: '0 8px 30px rgba(139,92,246,0.4), 0 0 0 1px rgba(139,92,246,0.3)'
                                }}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Restoring...
                                    </span>
                                ) : (
                                    'Restore My Purchases 🔓'
                                )}
                            </button>
                        </form>

                        {/* Cancel */}
                        <button
                            onClick={handleClose}
                            className="w-full py-2 text-sm text-gray-500 font-medium"
                        >
                            Cancel
                        </button>

                        {/* Security note */}
                        <p className="text-[10px] text-white/30 text-center mt-4">
                            🔒 We'll restore your Pro status and any purchased scans
                        </p>

                        {/* Legal links */}
                        <div className="flex items-center justify-center gap-3 text-white/20 text-[10px] mt-3">
                            <a href="/terms" target="_blank" className="hover:text-white/40 transition-colors underline">Terms</a>
                            <span>•</span>
                            <a href="/privacy" target="_blank" className="hover:text-white/40 transition-colors underline">Privacy</a>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

