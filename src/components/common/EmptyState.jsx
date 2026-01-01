/**
 * EmptyState Component
 * 
 * Animated empty state with floating emoji illustration
 * Used when there's no content to display
 */

import React from 'react'

const FloatingEmoji = ({ emoji, delay = 0, size = 'text-4xl' }) => (
    <span
        className={`${size} animate-bounce`}
        style={{
            animationDelay: `${delay}s`,
            animationDuration: '2s',
            display: 'inline-block'
        }}
    >
        {emoji}
    </span>
)

export default function EmptyState({
    emoji = '🎭',
    title = 'Nothing here yet',
    subtitle = 'Be the first!',
    action = null,
    actionLabel = 'Get Started',
    variant = 'default' // 'default', 'fashion', 'battle', 'challenge'
}) {
    const variants = {
        default: { emojis: [emoji], color: 'white' },
        fashion: { emojis: ['👗', '✨', '👠'], color: 'purple' },
        battle: { emojis: ['⚔️', '🔥', '💪'], color: 'cyan' },
        challenge: { emojis: ['🏆', '⭐', '🎯'], color: 'amber' },
        arena: { emojis: ['🌍', '👑', '🔥'], color: 'emerald' }
    }

    const { emojis, color } = variants[variant] || variants.default

    return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
            {/* Floating Emojis */}
            <div className="flex items-center gap-3 mb-4">
                {emojis.map((e, idx) => (
                    <FloatingEmoji key={idx} emoji={e} delay={idx * 0.3} />
                ))}
            </div>

            {/* Title */}
            <h3 className={`text-lg font-bold text-${color === 'white' ? 'white/80' : `${color}-400`} mb-1`}>
                {title}
            </h3>

            {/* Subtitle */}
            <p className="text-sm text-white/50 text-center max-w-[200px]">
                {subtitle}
            </p>

            {/* Optional Action Button */}
            {action && (
                <button
                    onClick={action}
                    className={`mt-4 px-5 py-2 rounded-xl font-bold text-sm transition-all active:scale-95
                        bg-${color === 'white' ? 'white/10' : `${color}-500/20`} 
                        text-${color === 'white' ? 'white' : `${color}-400`}
                        hover:bg-${color === 'white' ? 'white/20' : `${color}-500/30`}`}
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}
