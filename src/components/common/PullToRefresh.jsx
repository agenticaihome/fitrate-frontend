import React, { useState, useRef, useCallback, useEffect } from 'react'

/**
 * PullToRefresh - Native-feeling pull-to-refresh for PWA
 * 
 * Usage:
 * <PullToRefresh onRefresh={async () => { await fetchData() }}>
 *   <YourContent />
 * </PullToRefresh>
 */
export default function PullToRefresh({
    children,
    onRefresh,
    threshold = 80,      // Pull distance to trigger refresh
    disabled = false     // Disable when modals are open
}) {
    const [pulling, setPulling] = useState(false)
    const [pullDistance, setPullDistance] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const startY = useRef(0)
    const containerRef = useRef(null)

    // Check if at top of scroll
    const isAtTop = useCallback(() => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop
        return scrollTop <= 0
    }, [])

    const handleTouchStart = useCallback((e) => {
        if (disabled || refreshing || !isAtTop()) return
        startY.current = e.touches[0].clientY
        setPulling(true)
    }, [disabled, refreshing, isAtTop])

    const handleTouchMove = useCallback((e) => {
        if (!pulling || disabled || refreshing) return

        const currentY = e.touches[0].clientY
        const diff = currentY - startY.current

        // Only allow pulling down, not up
        if (diff > 0 && isAtTop()) {
            // Apply resistance (slower as you pull more)
            const distance = Math.min(diff * 0.5, threshold * 1.5)
            setPullDistance(distance)

            // Prevent default scroll when pulling
            if (distance > 10) {
                e.preventDefault()
            }
        }
    }, [pulling, disabled, refreshing, isAtTop, threshold])

    const handleTouchEnd = useCallback(async () => {
        if (!pulling) return

        if (pullDistance >= threshold && onRefresh) {
            setRefreshing(true)
            setPullDistance(threshold) // Lock at threshold during refresh

            try {
                await onRefresh()
            } catch (err) {
                console.error('[PullToRefresh] Refresh failed:', err)
            }

            setRefreshing(false)
        }

        setPulling(false)
        setPullDistance(0)
    }, [pulling, pullDistance, threshold, onRefresh])

    // Add touch listeners
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener('touchstart', handleTouchStart, { passive: true })
        container.addEventListener('touchmove', handleTouchMove, { passive: false })
        container.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchmove', handleTouchMove)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [handleTouchStart, handleTouchMove, handleTouchEnd])

    // Calculate spinner state
    const progress = Math.min(pullDistance / threshold, 1)
    const showSpinner = pullDistance > 20 || refreshing

    return (
        <div ref={containerRef} className="relative min-h-screen">
            {/* Pull indicator */}
            <div
                className="fixed left-1/2 z-[100] pointer-events-none flex items-center justify-center"
                style={{
                    transform: `translateX(-50%) translateY(${pullDistance - 60}px)`,
                    opacity: showSpinner ? 1 : 0,
                    transition: pulling ? 'none' : 'all 0.3s ease-out',
                    top: 'env(safe-area-inset-top, 0px)'
                }}
            >
                <div
                    className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center"
                    style={{
                        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        transform: `rotate(${progress * 360}deg) scale(${0.8 + progress * 0.2})`,
                        transition: pulling ? 'none' : 'transform 0.3s ease-out'
                    }}
                >
                    {refreshing ? (
                        // Spinning loader
                        <div
                            className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full"
                            style={{ animation: 'spin 0.8s linear infinite' }}
                        />
                    ) : (
                        // Arrow indicator
                        <svg
                            className="w-5 h-5 text-cyan-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{
                                transform: `rotate(${progress >= 1 ? 180 : 0}deg)`,
                                transition: 'transform 0.2s ease-out'
                            }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Content with pull offset */}
            <div
                style={{
                    transform: `translateY(${pullDistance}px)`,
                    transition: pulling ? 'none' : 'transform 0.3s ease-out'
                }}
            >
                {children}
            </div>
        </div>
    )
}
