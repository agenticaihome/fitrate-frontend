import React, { useState, useMemo, useEffect } from 'react'
import { vibrate, playSound } from '../utils/soundEffects'
import NotificationOptIn from '../components/common/NotificationOptIn'

// Premium celebration confetti with mode-aware colors
const CelebrationConfetti = ({ intensity = 'normal', scoreColor }) => {
    const count = intensity === 'legendary' ? 50 : intensity === 'high' ? 30 : 18
    const pieces = useMemo(() =>
        Array.from({ length: count }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 1.5,
            duration: 2.5 + Math.random() * 2,
            color: intensity === 'legendary'
                ? ['#ffd700', '#fff', '#ffe066', '#ff8c00'][i % 4]
                : ['#ffd700', '#00d4ff', '#ff6b9d', '#00ff88', '#8b5cf6', scoreColor][i % 6],
            size: 6 + Math.random() * 10,
            rotation: Math.random() * 360,
            rotationSpeed: 360 + Math.random() * 720
        })), [count, scoreColor, intensity]
    )

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="absolute"
                    style={{
                        left: `${p.left}%`,
                        top: '-20px',
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        borderRadius: p.id % 3 === 0 ? '50%' : p.id % 2 === 0 ? '2px' : '4px',
                        boxShadow: `0 0 ${p.size}px ${p.color}50`,
                        animation: `confetti-fall-3d ${p.duration}s ease-out ${p.delay}s forwards`,
                        transform: `rotate(${p.rotation}deg)`,
                        '--rotation-speed': `${p.rotationSpeed}deg`
                    }}
                />
            ))}
        </div>
    )
}

// Premium floating particles
const FloatingParticles = ({ color }) => {
    const particles = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 8,
            duration: 10 + Math.random() * 10,
            opacity: 0.2 + Math.random() * 0.3,
            drift: -20 + Math.random() * 40
        })), []
    )

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-5px',
                        width: p.size,
                        height: p.size,
                        background: p.id % 3 === 0 ? color : '#fff',
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.id % 3 === 0 ? color : '#fff'}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
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
            intensity: 'normal',
            color: '#ff6b6b'
        }
    }
    if (score < 60) {
        return {
            emoji: '🎯',
            headline: 'Out in the World!',
            subtext: "That took confidence. We respect it.",
            vibe: 'confident',
            intensity: 'normal',
            color: '#ffd700'
        }
    }
    if (score < 75) {
        return {
            emoji: '✨',
            headline: 'Looking Good!',
            subtext: 'Your fit is making moves out there',
            vibe: 'stylish',
            intensity: 'normal',
            color: '#00d4ff'
        }
    }
    if (score < 85) {
        return {
            emoji: '🔥',
            headline: 'Fit Posted!',
            subtext: "They're not ready for this",
            vibe: 'fire',
            intensity: 'high',
            color: '#ff6b35'
        }
    }
    if (score < 95) {
        return {
            emoji: '👑',
            headline: 'Royalty Detected',
            subtext: 'The timeline just got better',
            vibe: 'elite',
            intensity: 'high',
            color: '#ffd700'
        }
    }
    return {
        emoji: '💎',
        headline: 'LEGENDARY',
        subtext: 'History has been made',
        vibe: 'legendary',
        intensity: 'legendary',
        color: '#ffd700'
    }
}

export default function ShareSuccessScreen({
    mode,
    setMode,
    setScreen,
    userId,
    score,
    wasBattle = false,
    activeBattles = [],
    onNavigateToBattle,
    onCreateChallenge  // New: create a challenge from current score
}) {
    const [showNotifications, setShowNotifications] = useState(false)

    // Get the most recent battle if wasBattle is true
    const recentBattle = wasBattle && activeBattles.length > 0
        ? activeBattles[0]
        : null

    const celebration = wasBattle
        ? {
            emoji: '⚔️',
            headline: 'Battle Created!',
            subtext: 'Share the link and wait for a challenger',
            vibe: 'battle',
            intensity: 'high',
            color: '#00d4ff'
        }
        : getCelebrationContent(score)

    // Play celebration sound on mount with haptic
    useEffect(() => {
        playSound(celebration.intensity === 'legendary' ? 'legendary' : 'success')
        vibrate(celebration.intensity === 'legendary' ? [100, 50, 100, 50, 200] : [50, 30, 50])
    }, [celebration.intensity])

    const handleAction = (screen) => {
        playSound('click')
        vibrate(20)
        setScreen(screen)
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white p-6 overflow-hidden" style={{
            background: 'radial-gradient(ellipse at center, #12121f 0%, #0a0a0f 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(2rem, env(safe-area-inset-top, 2rem))',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))'
        }}>
            {/* Premium floating particles */}
            <FloatingParticles color={celebration.color} />

            {/* Background glow with breathing */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div
                    className="absolute w-[500px] h-[500px] rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${celebration.color}40 0%, transparent 70%)`,
                        top: '30%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        animation: 'glow-breathe 4s ease-in-out infinite',
                        opacity: 0.4
                    }}
                />
            </div>

            {/* Vignette */}
            <div className="fixed inset-0 pointer-events-none z-[1]" style={{
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)'
            }} />

            <CelebrationConfetti intensity={celebration.intensity} scoreColor={celebration.color} />

            {/* Main Celebration - Big Moment */}
            <div className="flex flex-col items-center text-center mb-8 relative z-10">
                <span
                    className="text-8xl mb-6"
                    style={{
                        animation: 'bounce-attention 1s ease-out, float-gentle 3s ease-in-out 1s infinite',
                        filter: celebration.intensity === 'legendary'
                            ? 'drop-shadow(0 0 30px rgba(255,215,0,0.7))'
                            : celebration.intensity === 'high'
                                ? `drop-shadow(0 0 20px ${celebration.color}80)`
                                : 'none'
                    }}
                >
                    {celebration.emoji}
                </span>

                <h1
                    className="text-4xl font-black mb-3 animate-stagger-fade-up"
                    style={{
                        background: celebration.intensity === 'legendary'
                            ? 'linear-gradient(135deg, #ffd700, #fff, #ffd700)'
                            : celebration.intensity === 'high'
                                ? `linear-gradient(135deg, ${celebration.color}, #fff)`
                                : 'white',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: celebration.intensity !== 'normal' ? 'transparent' : 'white',
                        textShadow: celebration.intensity === 'legendary'
                            ? '0 0 40px rgba(255,215,0,0.4)'
                            : 'none',
                        opacity: 0,
                        animationDelay: '0.2s'
                    }}
                >
                    {celebration.headline}
                </h1>

                <p
                    className="text-lg animate-stagger-fade-up"
                    style={{
                        color: 'rgba(255,255,255,0.6)',
                        opacity: 0,
                        animationDelay: '0.35s'
                    }}
                >
                    {celebration.subtext}
                </p>
            </div>

            {/* Score Reminder - Premium glass pill */}
            {score && (
                <div
                    className="mb-8 px-8 py-4 rounded-full glass-premium animate-stagger-fade-up relative z-10"
                    style={{
                        border: `1px solid ${celebration.color}30`,
                        boxShadow: `0 0 30px ${celebration.color}20`,
                        opacity: 0,
                        animationDelay: '0.5s'
                    }}
                >
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Your score:
                    </span>
                    <span
                        className="text-2xl font-black ml-3"
                        style={{
                            color: celebration.color,
                            textShadow: `0 0 20px ${celebration.color}60`
                        }}
                    >
                        {Math.round(score)}
                    </span>
                </div>
            )}

            {/* Primary CTA - Premium shine effect */}
            <button
                onClick={() => handleAction('home')}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 mb-4 btn-premium-shine relative overflow-hidden z-10 animate-stagger-fade-up"
                style={{
                    background: `linear-gradient(135deg, ${celebration.color} 0%, ${celebration.color}cc 100%)`,
                    boxShadow: `0 8px 30px ${celebration.color}50`,
                    opacity: 0,
                    animationDelay: '0.65s'
                }}
            >
                📸 Rate Another Fit
            </button>

            {/* Secondary Option - View Battle if just created, else Challenge a Friend */}
            <button
                onClick={() => {
                    playSound('click')
                    vibrate(20)
                    if (wasBattle && recentBattle && onNavigateToBattle) {
                        // Navigate to the battle that was just created
                        onNavigateToBattle(recentBattle.id)
                    } else if (onCreateChallenge) {
                        // Create a challenge from the current score
                        onCreateChallenge()
                    } else {
                        // Fallback: go home
                        setScreen('home')
                    }
                }}
                className="w-full max-w-xs py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all active:scale-95 mb-6 glass-premium z-10 animate-stagger-fade-up"
                style={{
                    border: wasBattle ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(139,92,246,0.3)',
                    color: wasBattle ? '#00d4ff' : '#a855f7',
                    background: wasBattle ? 'rgba(0,212,255,0.08)' : 'rgba(139,92,246,0.08)',
                    opacity: 0,
                    animationDelay: '0.75s'
                }}
            >
                {wasBattle ? '⚔️ View Battle Status' : '⚔️ Challenge a Friend'}
            </button>

            {/* Push Notification - Subtle, collapsible */}
            <div className="relative z-10">
                {!showNotifications ? (
                    <button
                        onClick={() => {
                            playSound('click')
                            vibrate(10)
                            setShowNotifications(true)
                        }}
                        className="text-xs transition-all animate-stagger-fade-up"
                        style={{
                            color: 'rgba(255,255,255,0.3)',
                            opacity: 0,
                            animationDelay: '0.85s'
                        }}
                    >
                        🔔 Get notified when friends join
                    </button>
                ) : (
                    <div className="w-full max-w-xs" style={{ animation: 'stagger-fade-up 0.3s ease-out forwards' }}>
                        <NotificationOptIn userId={userId} />
                    </div>
                )}
            </div>

            {/* Floating back button - glassmorphism */}
            <button
                onClick={() => handleAction('home')}
                className="absolute top-6 left-6 p-3 rounded-full transition-all active:scale-90 glass-premium z-10"
                style={{
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: 'max(1.5rem, env(safe-area-inset-top))',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                ←
            </button>

            {/* Inline styles for 3D confetti */}
            <style>{`
                @keyframes confetti-fall-3d {
                    0% {
                        transform: translateY(0) rotate(0deg) rotateX(0deg) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotate(var(--rotation-speed, 720deg)) rotateX(720deg) scale(0.5);
                        opacity: 0;
                    }
                }
                @keyframes bounce-attention {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-20px); }
                    60% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    )
}
