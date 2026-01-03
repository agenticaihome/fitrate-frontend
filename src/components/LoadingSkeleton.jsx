import React from 'react'

/**
 * Loading Skeleton - Premium loading state for lazy-loaded screens
 * Shows animated shimmer effect while content loads
 */
export default function LoadingSkeleton({ type = 'screen' }) {
    if (type === 'screen') {
        return (
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                style={{
                    background: 'linear-gradient(180deg, #0a0a1a 0%, #0f1525 100%)'
                }}
            >
                {/* Pulsing logo */}
                <div
                    className="text-6xl mb-6"
                    style={{
                        animation: 'pulse-glow 1.5s ease-in-out infinite'
                    }}
                >
                    ✨
                </div>

                {/* Loading text */}
                <div
                    className="text-gray-300 font-medium"
                    role="status"
                    aria-live="polite"
                    style={{
                        animation: 'fade-pulse 1.5s ease-in-out infinite'
                    }}
                >
                    Loading...
                </div>

                {/* Shimmer bar */}
                <div
                    className="w-48 h-1 mt-4 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: '40%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            animation: 'shimmer-slide 1.2s ease-in-out infinite'
                        }}
                    />
                </div>

                <style>{`
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.6; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.1); }
                    }
                    @keyframes fade-pulse {
                        0%, 100% { opacity: 0.4; }
                        50% { opacity: 0.8; }
                    }
                    @keyframes shimmer-slide {
                        0% { transform: translateX(-200%); }
                        100% { transform: translateX(400%); }
                    }
                `}</style>
            </div>
        )
    }

    // Compact inline skeleton
    return (
        <div
            className="w-full h-32 rounded-xl"
            style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite'
            }}
        />
    )
}
