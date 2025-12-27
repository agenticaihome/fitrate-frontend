import React, { useState, useMemo } from 'react'
import { vibrate, playSound } from '../utils/soundEffects'
import NotificationOptIn from '../components/common/NotificationOptIn'

// Celebration confetti - more elegant, larger pieces
const CelebrationConfetti = ({ intensity = 'normal' }) => {
    const count = intensity === 'legendary' ? 40 : intensity === 'high' ? 25 : 15
    const pieces = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 1.5,
            duration: 2.5 + Math.random() * 2,
            color: ['#ffd700', '#00d4ff', '#ff6b9d', '#00ff88', '#8b5cf6'][i % 5],
            size: 6 + Math.random() * 8,
            rotation: Math.random() * 360
        })), [count]
    )

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        borderRadius: p.id % 3 === 0 ? '50%' : '2px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        transform: `rotate(${p.rotation}deg)`
                    }}
                />
            ))}
        </div>
    )
}

// Get celebration message based on score
const getCelebrationContent = (score) => {
    if (!score || score < 40) {
        return {
            emoji: '💪',
            headline: 'Shared & Proud!',
            subtext: 'Real ones post their scores, no matter what',
            vibe: 'brave',
            intensity: 'normal'
        }
    }
    if (score < 60) {
        return {
            emoji: '🎯',
            headline: 'Out in the World!',
            subtext: "That took confidence. We respect it.",
            vibe: 'confident',
            intensity: 'normal'
        }
    }
    if (score < 75) {
        return {
            emoji: '✨',
            headline: 'Looking Good!',
            subtext: 'Your fit is making moves out there',
            vibe: 'stylish',
            intensity: 'normal'
        }
    }
    if (score < 85) {
        return {
            emoji: '🔥',
            headline: 'Fit Posted!',
            subtext: "They're not ready for this",
            vibe: 'fire',
            intensity: 'high'
        }
    }
    if (score < 95) {
        return {
            emoji: '👑',
            headline: 'Royalty Detected',
            subtext: 'The timeline just got better',
            vibe: 'elite',
            intensity: 'high'
        }
    }
    return {
        emoji: '💎',
        headline: 'LEGENDARY',
        subtext: 'History has been made',
        vibe: 'legendary',
        intensity: 'legendary'
    }
}

export default function ShareSuccessScreen({
    mode,
    setMode,
    setScreen,
    userId,
    score
}) {
    const [showNotifications, setShowNotifications] = useState(false)
    const celebration = getCelebrationContent(score)

    // Play celebration sound on mount
    React.useEffect(() => {
        playSound('success')
        vibrate([50, 30, 50])
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6" style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(2rem, env(safe-area-inset-top, 2rem))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))'
        }}>
            <CelebrationConfetti intensity={celebration.intensity} />

            {/* Main Celebration - Big Moment */}
            <div className="flex flex-col items-center text-center mb-8 animate-fade-in">
                <span
                    className="text-7xl mb-6"
                    style={{
                        animation: 'bounce 0.6s ease-out',
                        filter: celebration.intensity === 'legendary'
                            ? 'drop-shadow(0 0 20px rgba(255,215,0,0.5))'
                            : 'none'
                    }}
                >
                    {celebration.emoji}
                </span>

                <h1
                    className="text-3xl font-black mb-3"
                    style={{
                        background: celebration.intensity === 'legendary'
                            ? 'linear-gradient(135deg, #ffd700, #fff, #ffd700)'
                            : celebration.intensity === 'high'
                                ? 'linear-gradient(135deg, #00d4ff, #00ff88)'
                                : 'white',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: celebration.intensity !== 'normal' ? 'transparent' : 'white',
                        textShadow: celebration.intensity === 'legendary'
                            ? '0 0 30px rgba(255,215,0,0.3)'
                            : 'none'
                    }}
                >
                    {celebration.headline}
                </h1>

                <p className="text-base" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {celebration.subtext}
                </p>
            </div>

            {/* Score Reminder - Smaller, elegant */}
            {score && (
                <div
                    className="mb-8 px-6 py-3 rounded-full"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Your score:
                    </span>
                    <span
                        className="text-lg font-bold ml-2"
                        style={{
                            color: score >= 85 ? '#00ff88' : score >= 70 ? '#00d4ff' : score >= 50 ? '#ffd700' : '#ff6b6b'
                        }}
                    >
                        {Math.round(score)}
                    </span>
                </div>
            )}

            {/* Primary CTA - Rate Another (not pushy) */}
            <button
                onClick={() => setScreen('home')}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
                style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                    boxShadow: '0 8px 30px rgba(0,212,255,0.3)'
                }}
            >
                📸 Rate Another Fit
            </button>

            {/* Secondary Option - Start a Battle */}
            <button
                onClick={() => {
                    setScreen('battle')
                }}
                className="w-full max-w-xs py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-95 mb-6"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'rgba(255,255,255,0.8)'
                }}
            >
                ⚔️ Challenge a Friend
            </button>

            {/* Push Notification - Subtle, collapsible */}
            {!showNotifications ? (
                <button
                    onClick={() => setShowNotifications(true)}
                    className="text-xs transition-all"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                    🔔 Get notified when friends join
                </button>
            ) : (
                <div className="w-full max-w-xs animate-fade-in">
                    <NotificationOptIn userId={userId} />
                </div>
            )}

            {/* Floating back button - very subtle */}
            <button
                onClick={() => setScreen('home')}
                className="absolute top-6 left-6 p-2 rounded-full transition-all active:scale-90"
                style={{
                    color: 'rgba(255,255,255,0.3)',
                    paddingTop: 'max(1.5rem, env(safe-area-inset-top))'
                }}
            >
                ←
            </button>
        </div>
    )
}
