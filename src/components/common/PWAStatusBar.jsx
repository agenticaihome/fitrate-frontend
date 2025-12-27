import React from 'react'

/**
 * PWA Status Bar - Premium glass effect header for standalone mode
 * Fills the safe area inset at the top with a subtle gradient
 */
export default function PWAStatusBar({ isStandalone }) {
    if (!isStandalone) return null

    return (
        <div
            className="pwa-status-bar"
            aria-hidden="true"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 'env(safe-area-inset-top, 0px)',
                background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(10, 10, 15, 0.85) 100%)',
                backdropFilter: 'blur(20px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                zIndex: 9998,
                pointerEvents: 'none',
            }}
        />
    )
}
