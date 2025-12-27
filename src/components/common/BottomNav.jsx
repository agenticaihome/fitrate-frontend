import React from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * Premium Bottom Navigation Bar
 * Ultra-minimal, sleek design with icons only
 * Enhanced with animated indicators and glow effects
 */
export default function BottomNav({ activeTab, eventMode, onNavigate, onScan }) {
    const handleTap = (tabId) => {
        playSound('click')
        vibrate(15)

        if (tabId === 'scan') {
            onScan?.()
        } else {
            onNavigate?.(tabId)
        }
    }

    // Clean icon components (SVG-like using simple shapes)
    const HomeIcon = ({ active }) => (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={active ? '#fff' : 'rgba(255,255,255,0.4)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                filter: active ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none',
                transition: 'all 0.3s ease-out'
            }}
        >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    )

    const TrophyIcon = ({ active, eventMode }) => (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke={eventMode ? '#ffd700' : active ? '#fff' : 'rgba(255,255,255,0.4)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                filter: eventMode
                    ? 'drop-shadow(0 0 10px rgba(255,215,0,0.6))'
                    : active
                        ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
                        : 'none',
                transition: 'all 0.3s ease-out'
            }}
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )

    // Active indicator with pop animation
    const ActiveIndicator = ({ color = '#fff', glow = false }) => (
        <span
            className="absolute -bottom-1"
            style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: color,
                boxShadow: glow ? `0 0 10px ${color}, 0 0 20px ${color}` : `0 0 8px ${color}80`,
                animation: 'nav-indicator-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        />
    )

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 pwa-bottom-nav"
            style={{
                height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {/* Premium frosted glass with gradient */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, rgba(15,15,20,0.85) 0%, rgba(10,10,15,0.98) 100%)',
                    backdropFilter: 'blur(24px) saturate(1.3)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
                    borderTop: '0.5px solid rgba(255,255,255,0.08)',
                }}
            />

            {/* Subtle top glow line */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.1) 50%, transparent 90%)'
                }}
            />

            {/* Nav items */}
            <div className="relative h-full flex items-center justify-around px-4">
                {/* Home */}
                <button
                    onClick={() => handleTap('home')}
                    aria-label="Go to home"
                    className="relative flex flex-col items-center justify-center w-14 h-12 transition-all active:scale-90"
                    style={{
                        transform: activeTab === 'home' ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    <HomeIcon active={activeTab === 'home'} />
                    {activeTab === 'home' && <ActiveIndicator />}
                </button>

                {/* Scan - Elegant floating button with breathing glow */}
                <div className="relative">
                    {/* Breathing glow rings */}
                    <div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{
                            marginTop: -16,
                            width: 44,
                            height: 44,
                            background: eventMode
                                ? 'rgba(255,215,0,0.2)'
                                : 'rgba(255,255,255,0.1)',
                            animation: 'ring-breathe 2s ease-in-out infinite',
                            transform: 'scale(1.2)',
                            borderRadius: 14
                        }}
                    />
                    <button
                        onClick={() => handleTap('scan')}
                        aria-label="Take a photo to rate your outfit"
                        className="relative flex items-center justify-center transition-all active:scale-95"
                        style={{
                            width: 44,
                            height: 44,
                            marginTop: -16,
                            borderRadius: 14,
                            background: eventMode
                                ? 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)'
                                : 'linear-gradient(135deg, #fff 0%, #e8e8e8 100%)',
                            boxShadow: eventMode
                                ? '0 4px 20px rgba(255,215,0,0.5), 0 0 0 1px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                                : '0 4px 20px rgba(255,255,255,0.2), 0 0 0 1px rgba(255,255,255,0.15), inset 0 1px 0 rgba(255,255,255,0.5)',
                        }}
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#000"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                        </svg>
                    </button>
                </div>

                {/* Challenges */}
                <button
                    onClick={() => handleTap('challenges')}
                    aria-label="View challenges"
                    className="relative flex flex-col items-center justify-center w-14 h-12 transition-all active:scale-90"
                    style={{
                        transform: (activeTab === 'challenges' || eventMode) ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    <TrophyIcon active={activeTab === 'challenges'} eventMode={eventMode} />
                    {(activeTab === 'challenges' || eventMode) && (
                        <ActiveIndicator
                            color={eventMode ? '#ffd700' : '#fff'}
                            glow={eventMode}
                        />
                    )}
                </button>
            </div>

            {/* Inline keyframe for indicator pop */}
            <style>{`
                @keyframes nav-indicator-pop {
                    0% { transform: scale(0); opacity: 0; }
                    70% { transform: scale(1.4); }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </nav>
    )
}
