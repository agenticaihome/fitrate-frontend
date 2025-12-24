import React, { useState, useEffect, useMemo } from 'react'
import { vibrate } from '../utils/soundEffects'
import NotificationOptIn from '../components/common/NotificationOptIn'
import { LIMITS } from '../config/constants'

// Mini Confetti component
const MiniConfetti = () => {
    const pieces = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 1,
            duration: 2 + Math.random() * 1.5,
            color: ['#ffd700', '#00d4ff', '#ff6b9d', '#00ff88'][i % 4]
        })), []
    )

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        width: 8,
                        height: 8,
                        background: p.color,
                        borderRadius: p.id % 2 === 0 ? '50%' : '2px',
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    )
}

export default function ShareSuccessScreen({
    mode,
    setMode,
    setScreen,
    userId,
    score,
    totalReferrals = 0
}) {
    const [copied, setCopied] = useState(false)
    const referralLink = `https://fitrate.app/?ref=${userId}`

    // Calculate progress toward next Savage Roast
    const sharesPerReward = LIMITS.SHARES_PER_SAVAGE_ROAST || 3
    const currentProgress = totalReferrals % sharesPerReward
    const sharesUntilNext = sharesPerReward - currentProgress
    const totalRoastsEarned = Math.floor(totalReferrals / sharesPerReward)

    const copyReferralLink = async () => {
        try {
            await navigator.clipboard.writeText(referralLink)
            setCopied(true)
            vibrate(20)
            setTimeout(() => setCopied(false), 2000)

            // Track share for analytics
            fetch(`${import.meta.env.VITE_API_URL || 'https://fitrate.app/api'}/referral/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            }).catch(() => { }) // Silent fail
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6" style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
        }}>
            <MiniConfetti />

            <span className="text-6xl mb-4 animate-bounce">🎉</span>
            <h2 className="text-2xl font-black mb-2">Your Fit is Out There!</h2>
            <p className="text-sm mb-6 text-center" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {score && score >= 85 ? "Flex mode: activated 💅" : "Let's see if your friends can beat it"}
            </p>

            {/* Challenge Another Friend - Primary CTA */}
            <button
                onClick={() => {
                    if (mode !== 'roast') {
                        setMode('roast')
                        setScreen('home')
                    } else {
                        setScreen('home')
                    }
                }}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
                style={{
                    background: mode === 'roast'
                        ? 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)'
                        : 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)',
                    boxShadow: mode === 'roast'
                        ? '0 8px 30px rgba(0,212,255,0.3)'
                        : '0 8px 30px rgba(255,68,68,0.3)'
                }}
            >
                {mode === 'roast' ? '📸 Rate Another Fit' : '🔥 Roast It Harder'}
            </button>

            {/* REFERRAL REWARD SECTION - Clear Value Prop */}
            {userId && (
                <div className="w-full max-w-xs mt-2 rounded-2xl overflow-hidden" style={{
                    background: 'linear-gradient(135deg, rgba(255,68,68,0.15) 0%, rgba(255,136,0,0.15) 100%)',
                    border: '1px solid rgba(255,68,68,0.3)'
                }}>
                    {/* Header */}
                    <div className="px-4 py-3 text-center" style={{
                        background: 'rgba(0,0,0,0.3)',
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <p className="text-base font-black text-white">💀 3 Shares = 1 Savage Roast</p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            GPT-4o powered brutal honesty
                        </p>
                    </div>

                    {/* Progress Tracker */}
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                                Progress to next Savage Roast
                            </span>
                            <span className="text-xs font-bold text-white">
                                {currentProgress}/{sharesPerReward}
                            </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-3 rounded-full overflow-hidden mb-3" style={{
                            background: 'rgba(255,255,255,0.1)'
                        }}>
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${(currentProgress / sharesPerReward) * 100}%`,
                                    background: 'linear-gradient(90deg, #ff4444 0%, #ff8800 100%)'
                                }}
                            />
                        </div>

                        {/* Status */}
                        {totalRoastsEarned > 0 && (
                            <p className="text-center text-xs mb-3" style={{ color: '#00ff88' }}>
                                🎁 {totalRoastsEarned} Savage Roast{totalRoastsEarned > 1 ? 's' : ''} earned!
                            </p>
                        )}

                        {/* Copy Link Button */}
                        <button
                            onClick={copyReferralLink}
                            className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                            style={{
                                background: copied ? 'rgba(0,255,136,0.2)' : 'linear-gradient(135deg, #ff4444 0%, #ff8800 100%)',
                                color: copied ? '#00ff88' : '#fff',
                                boxShadow: copied ? 'none' : '0 4px 15px rgba(255,68,68,0.3)'
                            }}
                        >
                            {copied ? '✅ Link Copied!' : '📋 Copy Your Referral Link'}
                        </button>

                        <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {sharesUntilNext} more share{sharesUntilNext > 1 ? 's' : ''} to unlock!
                        </p>
                    </div>
                </div>
            )}

            {/* Push Notification Opt-in */}
            <div className="w-full max-w-xs mt-4">
                <NotificationOptIn userId={userId} />
            </div>

            {/* Back to home */}
            <button
                onClick={() => setScreen('home')}
                className="mt-6 text-sm transition-all active:opacity-60"
                style={{ color: 'rgba(255,255,255,0.4)' }}
            >
                ← Back to Home
            </button>
        </div>
    )
}

