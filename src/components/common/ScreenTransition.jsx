/**
 * ScreenTransition Component
 * 
 * Wraps screen content with fade + slide animation
 * Apple-level smooth transitions between screens
 */

import React, { useEffect, useState } from 'react'

export default function ScreenTransition({
    children,
    screenKey, // Unique key for this screen (triggers animation on change)
    direction = 'up', // 'up', 'down', 'left', 'right'
    duration = 250 // ms
}) {
    const [isVisible, setIsVisible] = useState(false)
    const [currentKey, setCurrentKey] = useState(screenKey)
    const [displayChildren, setDisplayChildren] = useState(children)

    // Direction to transform values
    const getTransform = (dir, isEnter) => {
        const distance = isEnter ? 20 : -10 // Enter from further, exit closer
        switch (dir) {
            case 'up': return `translateY(${isEnter ? distance : -distance}px)`
            case 'down': return `translateY(${isEnter ? -distance : distance}px)`
            case 'left': return `translateX(${isEnter ? distance : -distance}px)`
            case 'right': return `translateX(${isEnter ? -distance : distance}px)`
            default: return `translateY(${isEnter ? distance : -distance}px)`
        }
    }

    useEffect(() => {
        // Initial mount - fade in
        const timer = setTimeout(() => setIsVisible(true), 10)
        return () => clearTimeout(timer)
    }, [])

    useEffect(() => {
        if (screenKey !== currentKey) {
            // Screen changed - animate out, then in
            setIsVisible(false)

            const timer = setTimeout(() => {
                setCurrentKey(screenKey)
                setDisplayChildren(children)
                setIsVisible(true)
            }, duration)

            return () => clearTimeout(timer)
        } else {
            setDisplayChildren(children)
        }
    }, [screenKey, children, currentKey, duration])

    return (
        <div
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) translateX(0)' : getTransform(direction, true),
                transition: `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`,
                willChange: 'opacity, transform'
            }}
        >
            {displayChildren}
        </div>
    )
}

/**
 * Simple fade-only version for modals/overlays
 */
export function FadeTransition({ children, show, duration = 200 }) {
    const [shouldRender, setShouldRender] = useState(show)

    useEffect(() => {
        if (show) {
            setShouldRender(true)
        } else {
            const timer = setTimeout(() => setShouldRender(false), duration)
            return () => clearTimeout(timer)
        }
    }, [show, duration])

    if (!shouldRender) return null

    return (
        <div
            style={{
                opacity: show ? 1 : 0,
                transition: `opacity ${duration}ms ease-out`,
                willChange: 'opacity'
            }}
        >
            {children}
        </div>
    )
}
