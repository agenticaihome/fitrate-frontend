/**
 * Tooltip Component
 * 
 * Onboarding tooltips for first-time users
 * Points to elements with arrow and helpful hints
 */

import React, { useState, useEffect } from 'react'

// Storage helpers for tracking shown tooltips
const SHOWN_TOOLTIPS_KEY = 'fitrate_shown_tooltips'

const getShownTooltips = () => {
    try {
        return JSON.parse(localStorage.getItem(SHOWN_TOOLTIPS_KEY) || '[]')
    } catch {
        return []
    }
}

const markTooltipShown = (id) => {
    const shown = getShownTooltips()
    if (!shown.includes(id)) {
        shown.push(id)
        localStorage.setItem(SHOWN_TOOLTIPS_KEY, JSON.stringify(shown))
    }
}

const hasTooltipBeenShown = (id) => {
    return getShownTooltips().includes(id)
}

// Reset all tooltips (for testing)
export const resetTooltips = () => {
    localStorage.removeItem(SHOWN_TOOLTIPS_KEY)
}

/**
 * Tooltip Component
 * 
 * @param {string} id - Unique identifier (tracks if already shown)
 * @param {string} message - The hint text
 * @param {string} position - 'top' | 'bottom' | 'left' | 'right'
 * @param {boolean} show - Override to force show/hide
 * @param {Function} onDismiss - Called when tooltip is dismissed
 */
export default function Tooltip({
    id,
    message,
    position = 'bottom',
    emoji = '💡',
    show = true,
    delay = 500, // Delay before showing
    children
}) {
    const [isVisible, setIsVisible] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        // Don't show if already shown before
        if (hasTooltipBeenShown(id)) {
            return
        }

        if (show && !isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), delay)
            return () => clearTimeout(timer)
        }
    }, [id, show, isDismissed, delay])

    const handleDismiss = (e) => {
        e?.stopPropagation()
        setIsVisible(false)
        setIsDismissed(true)
        markTooltipShown(id)
    }

    // Arrow styles based on position
    const arrowStyles = {
        top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
        left: 'right-full mr-2 top-1/2 -translate-y-1/2',
        right: 'left-full ml-2 top-1/2 -translate-y-1/2'
    }

    const arrowDirection = {
        top: 'after:top-full after:border-t-purple-500',
        bottom: 'after:bottom-full after:border-b-purple-500',
        left: 'after:left-full after:border-l-purple-500',
        right: 'after:right-full after:border-r-purple-500'
    }

    return (
        <div className="relative inline-block">
            {children}

            {isVisible && (
                <div
                    className={`absolute z-50 ${arrowStyles[position]}`}
                    style={{ animation: 'tooltip-pop 0.3s ease-out forwards' }}
                >
                    <div
                        role="tooltip"
                        tabIndex={0}
                        onClick={handleDismiss}
                        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && handleDismiss(e)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/90 backdrop-blur-sm
                            text-white text-sm font-medium cursor-pointer shadow-lg
                            hover:bg-purple-500 transition-colors whitespace-nowrap
                            focus-visible:ring-2 focus-visible:ring-white"
                        aria-label={`${message}. Press Enter or Escape to dismiss.`}
                    >
                        <span aria-hidden="true">{emoji}</span>
                        <span>{message}</span>
                        <span className="text-white/80 text-xs ml-1" aria-hidden="true">✕</span>
                    </div>
                    <style>{`
                        @keyframes tooltip-pop {
                            0% {
                                transform: scale(0.9) translateX(-50%);
                                opacity: 0;
                            }
                            100% {
                                transform: scale(1) translateX(-50%);
                                opacity: 1;
                            }
                        }
                    `}</style>
                </div>
            )}
        </div>
    )
}

/**
 * Floating Tooltip - Not attached to any element
 * Appears at a fixed position on screen
 */
export function FloatingTooltip({
    id,
    message,
    emoji = '💡',
    position = 'bottom', // 'top' | 'bottom' | 'center'
    show = true,
    delay = 1000
}) {
    const [isVisible, setIsVisible] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        if (hasTooltipBeenShown(id)) return

        if (show && !isDismissed) {
            const timer = setTimeout(() => setIsVisible(true), delay)
            return () => clearTimeout(timer)
        }
    }, [id, show, isDismissed, delay])

    const handleDismiss = () => {
        setIsVisible(false)
        setIsDismissed(true)
        markTooltipShown(id)
    }

    if (!isVisible) return null

    const positionStyles = {
        top: 'top-20',
        bottom: 'bottom-32',
        center: 'top-1/2 -translate-y-1/2'
    }

    return (
        <div
            className={`fixed left-4 right-4 z-50 flex justify-center pointer-events-none ${positionStyles[position]}`}
        >
            <div
                role="tooltip"
                tabIndex={0}
                onClick={handleDismiss}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && handleDismiss()}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-500/90 backdrop-blur-xl
                    text-white font-medium shadow-xl pointer-events-auto cursor-pointer
                    hover:bg-purple-500 transition-colors focus-visible:ring-2 focus-visible:ring-white"
                style={{
                    animation: 'floating-tooltip 0.4s ease-out forwards',
                    boxShadow: '0 10px 40px rgba(139, 92, 246, 0.4)'
                }}
                aria-label={`${message}. Tap or press Enter to dismiss.`}
            >
                <span className="text-xl" aria-hidden="true">{emoji}</span>
                <span className="text-sm">{message}</span>
                <span className="text-white/80 text-xs ml-2" aria-hidden="true">Tap to dismiss</span>
            </div>
            <style>{`
                @keyframes floating-tooltip {
                    0% {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    )
}
