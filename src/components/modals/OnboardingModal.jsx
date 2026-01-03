import React, { useState } from 'react'

// ============================================
// SINGLE-SCREEN ONBOARDING - Zero friction first impression
// Based on Founder Tri-Audit Phase 1.1 recommendation
// ============================================
export default function OnboardingModal({ onComplete, playSound, vibrate }) {
    const [isExiting, setIsExiting] = useState(false)

    const handleStart = () => {
        playSound?.('click')
        vibrate?.([20, 15, 30])
        setIsExiting(true)
        setTimeout(() => {
            localStorage.setItem('fitrate_onboarded', 'true')
            onComplete()
        }, 400)
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            aria-describedby="onboarding-desc"
            className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-opacity duration-400 ${isExiting ? 'opacity-0' : 'opacity-100'}`}
            style={{
                background: 'linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 50%, #0a0610 100%)',
            }}
        >
            {/* Animated background glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 40%, rgba(0,212,255,0.2) 0%, transparent 50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite'
                }}
            />

            {/* Floating particles */}
            {Array.from({ length: 15 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                        background: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#8b5cf6' : '#fff',
                        left: `${10 + (i * 5.5) % 80}%`,
                        top: `${10 + (i * 7.3) % 80}%`,
                        boxShadow: `0 0 8px ${i % 3 === 0 ? '#00d4ff' : '#8b5cf6'}`,
                        opacity: 0.3 + (i % 3) * 0.2,
                        animation: `particle-float ${3 + (i % 3)}s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`
                    }}
                />
            ))}

            <div className="w-full max-w-sm text-center relative z-10">
                {/* Hero emoji with glow */}
                <div
                    className="text-[100px] mb-6 inline-block"
                    style={{
                        filter: 'drop-shadow(0 0 40px rgba(0,212,255,0.5))',
                        animation: 'float-gentle 4s ease-in-out infinite'
                    }}
                >
                    📸
                </div>

                {/* Main headline */}
                <h1
                    id="onboarding-title"
                    className="text-3xl font-black mb-3 text-white"
                    style={{
                        animation: 'stagger-fade-up 0.5s ease-out forwards'
                    }}
                >
                    Snap your outfit
                </h1>

                {/* Subheadline */}
                <p
                    id="onboarding-desc"
                    className="text-xl text-gray-300 mb-10"
                    style={{
                        animation: 'stagger-fade-up 0.5s ease-out 0.1s forwards',
                        opacity: 0,
                        animationFillMode: 'forwards'
                    }}
                >
                    Let's see what you've got 👀
                </p>

                {/* Big CTA Button */}
                <button
                    onClick={handleStart}
                    aria-label="Start using FitRate"
                    className="w-full py-5 min-h-[56px] rounded-2xl font-black text-xl relative overflow-hidden transition-all active:scale-[0.97] btn-premium-shine focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        color: '#000',
                        boxShadow: '0 8px 40px rgba(0,212,255,0.4), 0 0 80px rgba(0,255,136,0.2)',
                        animation: 'stagger-fade-up 0.5s ease-out 0.2s forwards',
                        opacity: 0,
                        animationFillMode: 'forwards'
                    }}
                    autoFocus
                >
                    Let's Go! 🚀
                </button>

                {/* Privacy note */}
                <p
                    className="mt-6 text-gray-500 text-xs"
                    style={{
                        animation: 'stagger-fade-up 0.5s ease-out 0.3s forwards',
                        opacity: 0,
                        animationFillMode: 'forwards'
                    }}
                >
                    🔒 Your photos stay private • Auto-deleted
                </p>
            </div>
        </div>
    )
}
