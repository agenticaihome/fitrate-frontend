/**
 * Celebration Components
 * 
 * Confetti burst, "You're Leading!" banner, and other celebrations
 */

import React, { useEffect, useState, useRef } from 'react'

// ============================================
// CONFETTI BURST
// Radial explosion from center
// ============================================

export function ConfettiBurst({
    trigger, // Boolean to trigger burst
    count = 50,
    colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#a855f7', '#ec4899'],
    duration = 3000,
    onComplete
}) {
    const [particles, setParticles] = useState([])

    useEffect(() => {
        if (!trigger) return

        // Generate particles
        const newParticles = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: 50 + (Math.random() - 0.5) * 10, // Start near center
            y: 50 + (Math.random() - 0.5) * 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            angle: (i / count) * 360 + Math.random() * 30, // Spread evenly
            velocity: 2 + Math.random() * 3,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 10,
            size: 6 + Math.random() * 6,
            shape: Math.random() > 0.5 ? 'circle' : 'rect'
        }))

        setParticles(newParticles)

        // Clear after duration
        const timer = setTimeout(() => {
            setParticles([])
            onComplete?.()
        }, duration)

        return () => clearTimeout(timer)
    }, [trigger])

    if (particles.length === 0) return null

    return (
        <div
            className="fixed inset-0 pointer-events-none z-50"
            style={{ overflow: 'hidden' }}
        >
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.shape === 'circle' ? p.size : p.size * 0.6,
                        backgroundColor: p.color,
                        borderRadius: p.shape === 'circle' ? '50%' : '2px',
                        transform: `rotate(${p.rotation}deg)`,
                        animation: `confetti-fly ${duration}ms ease-out forwards`,
                        '--confetti-x': `${Math.cos(p.angle * Math.PI / 180) * p.velocity * 100}px`,
                        '--confetti-y': `${Math.sin(p.angle * Math.PI / 180) * p.velocity * 100 - 200}px`,
                        '--confetti-rotate': `${p.rotation + p.rotationSpeed * 50}deg`
                    }}
                />
            ))}
            <style>{`
                @keyframes confetti-fly {
                    0% {
                        transform: translate(0, 0) rotate(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(var(--confetti-x), var(--confetti-y)) rotate(var(--confetti-rotate)) scale(0);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}

// ============================================
// "YOU'RE LEADING!" BANNER
// Flash banner when user takes #1
// ============================================

export function LeadingBanner({
    show,
    message = "You're in the lead! 👑",
    duration = 3000,
    onComplete
}) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (show) {
            setIsVisible(true)
            const timer = setTimeout(() => {
                setIsVisible(false)
                onComplete?.()
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [show, duration])

    if (!isVisible) return null

    return (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center pointer-events-none">
            <div
                className="px-6 py-3 rounded-2xl font-black text-lg text-black shadow-xl"
                style={{
                    background: 'linear-gradient(135deg, #ffd700 0%, #ffaa00 100%)',
                    animation: 'leading-banner 0.5s ease-out forwards',
                    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.5)'
                }}
            >
                {message}
            </div>
            <style>{`
                @keyframes leading-banner {
                    0% {
                        transform: translateY(-100%) scale(0.8);
                        opacity: 0;
                    }
                    20% {
                        transform: translateY(0) scale(1.1);
                        opacity: 1;
                    }
                    30% {
                        transform: translateY(0) scale(1);
                    }
                    80% {
                        transform: translateY(0) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}

// ============================================
// FIRST REACTION CELEBRATION
// Shows confetti + message on first reaction
// ============================================

export function FirstReactionCelebration({
    show,
    onComplete
}) {
    if (!show) return null

    return (
        <>
            <ConfettiBurst
                trigger={show}
                count={60}
                colors={['#ff6b6b', '#ffd700', '#ff8c00', '#ec4899']}
                duration={2500}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div
                    className="text-center px-8 py-6 rounded-3xl"
                    style={{
                        background: 'rgba(0, 0, 0, 0.85)',
                        animation: 'celebration-pop 2.5s ease-out forwards'
                    }}
                >
                    <div className="text-6xl mb-3">🔥</div>
                    <div className="text-2xl font-black text-white mb-1">Your first reaction!</div>
                    <div className="text-white/60">Someone loves your fit!</div>
                </div>
                <style>{`
                    @keyframes celebration-pop {
                        0% {
                            transform: scale(0);
                            opacity: 0;
                        }
                        15% {
                            transform: scale(1.1);
                            opacity: 1;
                        }
                        25% {
                            transform: scale(1);
                        }
                        75% {
                            transform: scale(1);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(0.8);
                            opacity: 0;
                        }
                    }
                `}</style>
            </div>
        </>
    )
}
