import React, { useState } from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * RestoreProModal
 * 
 * Allows users to restore Pro on a new device using their purchase email.
 * SECURITY: Backend revokes all old devices, only new device gets Pro.
 */
export default function RestoreProModal({
    onClose,
    onRestoreSuccess,
    userId
}) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const handleRestore = async () => {
        if (!email.trim()) {
            setError('Please enter your email')
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email')
            return
        }

        setLoading(true)
        setError('')

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'https://fitrate-backend-production.up.railway.app'
            const res = await fetch(`${apiUrl}/api/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, email: email.trim() })
            })

            const data = await res.json()

            if (data.success) {
                playSound('success')
                vibrate([50, 50, 100])
                setSuccess(true)

                // Notify parent after brief delay
                setTimeout(() => {
                    onRestoreSuccess?.()
                }, 1500)
            } else {
                setError(data.error || 'Could not find Pro subscription for this email')
            }
        } catch (err) {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}>
                <div className="bg-gradient-to-br from-emerald-900/80 to-slate-900 rounded-3xl p-8 max-w-sm w-full text-center border border-emerald-500/30"
                    style={{ boxShadow: '0 0 60px rgba(16,185,129,0.3)' }}>
                    <div className="text-6xl mb-4">✅</div>
                    <h2 className="text-2xl font-black text-white mb-2">Pro Restored!</h2>
                    <p className="text-emerald-400 text-sm">
                        Your Pro access has been restored to this device.
                    </p>
                    <p className="text-white/50 text-xs mt-2">
                        Previous devices have been signed out.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-sm w-full border border-purple-500/30 relative"
                style={{ boxShadow: '0 0 60px rgba(139, 92, 246, 0.2)' }}>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    aria-label="Close"
                    className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <span className="text-white text-xl">×</span>
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🔄</div>
                    <h2 id="restore-title" className="text-2xl font-black text-white mb-1">
                        Restore Pro
                    </h2>
                    <p className="text-sm text-gray-400">
                        New device? Enter the email you used to purchase Pro.
                    </p>
                </div>

                {/* Email Input */}
                <div className="mb-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all"
                        disabled={loading}
                        autoComplete="email"
                    />
                    {error && (
                        <p className="text-red-400 text-xs mt-2 text-center">{error}</p>
                    )}
                </div>

                {/* Security Notice */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-4">
                    <p className="text-xs text-yellow-400/90 text-center">
                        ⚠️ This will sign out any other devices using your Pro account
                    </p>
                </div>

                {/* Restore Button */}
                <button
                    onClick={handleRestore}
                    disabled={loading || !email.trim()}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                        background: 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
                        color: 'white',
                        boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)'
                    }}
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="animate-spin">⏳</span> Restoring...
                        </span>
                    ) : (
                        '🔓 Restore Pro'
                    )}
                </button>

                {/* Cancel */}
                <button
                    onClick={handleClose}
                    className="w-full py-2 text-sm text-gray-500 font-medium"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}
