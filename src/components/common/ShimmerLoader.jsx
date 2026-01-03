/**
 * ShimmerLoader Component
 * 
 * Animated shimmer/skeleton loader for loading states
 * Provides consistent loading experience across the app
 */

import React from 'react'

// Base shimmer animation
const shimmerStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
}

// Single shimmer line
export const ShimmerLine = ({ width = 'w-full', height = 'h-4', rounded = 'rounded' }) => (
    <div
        className={`${width} ${height} ${rounded}`}
        style={shimmerStyle}
    />
)

// Circle shimmer (for avatars)
export const ShimmerCircle = ({ size = 'w-10 h-10' }) => (
    <div
        className={`${size} rounded-full`}
        style={shimmerStyle}
    />
)

// Card shimmer (for scoreboard entries, etc)
export const ShimmerCard = ({ height = 'h-16' }) => (
    <div className={`p-3 rounded-xl bg-white/5 flex items-center gap-3 ${height}`}>
        <ShimmerCircle size="w-8 h-8" />
        <ShimmerCircle size="w-12 h-12" />
        <div className="flex-1">
            <ShimmerLine width="w-3/4" height="h-4" rounded="rounded" />
        </div>
        <ShimmerLine width="w-12" height="h-6" rounded="rounded" />
    </div>
)

// Scoreboard loader
export const ScoreboardLoader = ({ rows = 3 }) => (
    <div className="space-y-2 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
            <ShimmerCard key={i} />
        ))}
    </div>
)

// Text block loader
export const TextBlockLoader = ({ lines = 3 }) => (
    <div className="space-y-2 animate-pulse">
        {Array.from({ length: lines }).map((_, i) => (
            <ShimmerLine
                key={i}
                width={i === lines - 1 ? 'w-2/3' : 'w-full'}
                height="h-4"
            />
        ))}
    </div>
)

// Full screen loader
export const FullScreenLoader = ({ emoji = '✨', message = 'Loading...' }) => (
    <div
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900"
        role="status"
        aria-live="polite"
        aria-label={message}
    >
        <span className="text-5xl animate-pulse mb-4" aria-hidden="true">{emoji}</span>
        <p className="text-gray-400 text-sm animate-pulse">{message}</p>
    </div>
)

// CSS keyframes (add to global CSS or inject)
export const shimmerCSS = `
@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}
`

// Default export for simple usage
export default function ShimmerLoader({ type = 'card', ...props }) {
    switch (type) {
        case 'line': return <ShimmerLine {...props} />
        case 'circle': return <ShimmerCircle {...props} />
        case 'card': return <ShimmerCard {...props} />
        case 'scoreboard': return <ScoreboardLoader {...props} />
        case 'text': return <TextBlockLoader {...props} />
        case 'fullscreen': return <FullScreenLoader {...props} />
        default: return <ShimmerCard {...props} />
    }
}
