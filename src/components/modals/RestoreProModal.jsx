import React from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * RestoreProModal
 * 
 * Shows contact support info for Pro restoration.
 * Manual verification via Stripe dashboard is more secure than email-only.
 */
export default function RestoreProModal({ onClose }) {
    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    const handleContactSupport = () => {
        playSound('click')
        vibrate(20)
        // Open email client with pre-filled subject
        window.location.href = 'mailto:support@agenticaihome.com?subject=Restore%20Pro%20Access&body=Hi%2C%0A%0AI%20need%20to%20restore%20my%20Pro%20access.%0A%0AEmail%20used%20for%20purchase%3A%20%0A%0AThank%20you!'
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
                        New device or cleared data?
                    </p>
                </div>

                {/* Info */}
                <div className="bg-white/5 rounded-2xl p-4 mb-4 text-center">
                    <p className="text-sm text-white/80 mb-3">
                        To restore your Pro access on a new device, contact our support team.
                    </p>
                    <p className="text-xs text-white/50">
                        We'll verify your purchase via Stripe and restore access within 24 hours.
                    </p>
                </div>

                {/* Contact Button */}
                <button
                    onClick={handleContactSupport}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] mb-3"
                    style={{
                        background: 'linear-gradient(135deg, #A855F7 0%, #3B82F6 100%)',
                        color: 'white',
                        boxShadow: '0 8px 30px rgba(139, 92, 246, 0.4)'
                    }}
                >
                    ✉️ Contact Support
                </button>

                {/* Cancel */}
                <button
                    onClick={handleClose}
                    className="w-full py-2 text-sm text-gray-500 font-medium"
                >
                    Maybe later
                </button>

                {/* Why manual? */}
                <p className="text-[10px] text-white/30 text-center mt-4">
                    🔒 Manual verification protects your account from unauthorized access
                </p>
            </div>
        </div>
    )
}
