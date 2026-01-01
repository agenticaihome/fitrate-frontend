import React from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * Premium Bottom Navigation Bar
 * Clean, purposeful design with 4 clear destinations
 * No redundant scan button - main CTA is on HomeScreen
 */
export default function BottomNav({ activeTab, eventMode, onNavigate, onScan, onOpenArena, onStartFashionShow }) {
    const handleTap = (tabId) => {
        playSound('click')
        vibrate(15)

        if (tabId === 'scan') {
            onScan?.()
        } else if (tabId === 'arena') {
            onOpenArena?.()
        } else if (tabId === 'fashionshow') {
            onStartFashionShow?.()
        } else {
            onNavigate?.(tabId)
        }
    }

    // Clean icon components
    const HomeIcon = ({ active }) => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={active ? '#fff' : 'rgba(255,255,255,0.5)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                filter: active ? 'drop-shadow(0 0 8px rgba(255,255,255,0.6))' : 'none',
                transition: 'all 0.3s ease-out'
            }}
        >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    )

    const ArenaIcon = ({ active }) => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={active ? '#00d4ff' : 'rgba(255,255,255,0.5)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                filter: active ? 'drop-shadow(0 0 8px rgba(0,212,255,0.6))' : 'none',
                transition: 'all 0.3s ease-out'
            }}
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    )

    const TrophyIcon = ({ active, eventMode }) => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={eventMode ? '#ffd700' : active ? '#10b981' : 'rgba(255,255,255,0.5)'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                filter: eventMode
                    ? 'drop-shadow(0 0 10px rgba(255,215,0,0.6))'
                    : active
                        ? 'drop-shadow(0 0 8px rgba(16,185,129,0.6))'
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

    // Active indicator with subtle animation
    const ActiveIndicator = ({ color = '#fff' }) => (
        <span
            className="absolute -bottom-1"
            style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 10px ${color}`,
                animation: 'nav-indicator-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
        />
    )

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 pwa-bottom-nav"
            style={{
                height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {/* Premium frosted glass background */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, rgba(15,15,20,0.9) 0%, rgba(10,10,15,0.98) 100%)',
                    backdropFilter: 'blur(24px) saturate(1.3)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
                    borderTop: '0.5px solid rgba(255,255,255,0.1)',
                }}
            />

            {/* Subtle top glow line */}
            <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                    background: 'linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.15) 50%, transparent 90%)'
                }}
            />

            {/* Nav items - 4 clear destinations */}
            <div className="relative h-full flex items-center justify-around px-4">
                {/* Home */}
                <button
                    onClick={() => handleTap('home')}
                    aria-label="Home"
                    className="relative flex flex-col items-center justify-center w-14 h-14 transition-all active:scale-90"
                    style={{
                        transform: activeTab === 'home' ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    <span className="text-xl transition-all duration-200" style={{
                        filter: activeTab === 'home' ? 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' : 'none',
                        transform: activeTab === 'home' ? 'scale(1.1)' : 'scale(1)'
                    }}>🏠</span>
                    <span className={`text-[10px] mt-0.5 font-medium ${activeTab === 'home' ? 'text-white' : 'text-white/50'}`}>
                        Home
                    </span>
                    {activeTab === 'home' && <ActiveIndicator />}
                </button>

                {/* Fashion Show */}
                <button
                    onClick={() => handleTap('fashionshow')}
                    aria-label="Fashion Show"
                    className="relative flex flex-col items-center justify-center w-14 h-14 transition-all active:scale-90"
                    style={{
                        transform: activeTab === 'fashionshow' ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    <span className="text-xl transition-all duration-200" style={{
                        filter: activeTab === 'fashionshow' ? 'drop-shadow(0 0 10px rgba(168,85,247,0.8))' : 'none',
                        transform: activeTab === 'fashionshow' ? 'scale(1.1)' : 'scale(1)'
                    }}>🎭</span>
                    <span className={`text-[10px] mt-0.5 font-medium ${activeTab === 'fashionshow' ? 'text-purple-400' : 'text-white/50'}`}>
                        Show
                    </span>
                    {activeTab === 'fashionshow' && <ActiveIndicator color="#a855f7" />}
                </button>

                {/* Challenges */}
                <button
                    onClick={() => handleTap('challenges')}
                    aria-label="Challenges"
                    className="relative flex flex-col items-center justify-center w-14 h-14 transition-all active:scale-90"
                    style={{
                        transform: (activeTab === 'challenges' || eventMode) ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    <span className="text-xl transition-all duration-200" style={{
                        filter: eventMode
                            ? 'drop-shadow(0 0 10px rgba(255,215,0,0.8))'
                            : activeTab === 'challenges'
                                ? 'drop-shadow(0 0 10px rgba(16,185,129,0.8))'
                                : 'none',
                        transform: (activeTab === 'challenges' || eventMode) ? 'scale(1.1)' : 'scale(1)'
                    }}>🏆</span>
                    <span className={`text-[10px] mt-0.5 font-medium ${eventMode ? 'text-yellow-400' :
                            activeTab === 'challenges' ? 'text-emerald-400' : 'text-white/50'
                        }`}>
                        Challenges
                    </span>
                    {(activeTab === 'challenges' || eventMode) && (
                        <ActiveIndicator color={eventMode ? '#ffd700' : '#10b981'} />
                    )}
                </button>

                {/* Arena */}
                <button
                    onClick={() => handleTap('arena')}
                    aria-label="Arena - 1v1 Battles"
                    className="relative flex flex-col items-center justify-center w-14 h-14 transition-all active:scale-90 overflow-visible"
                    style={{
                        transform: activeTab === 'arena' ? 'translateY(-2px)' : 'translateY(0)',
                        transition: 'transform 0.2s ease-out'
                    }}
                >
                    {/* Live indicator */}
                    <div className="absolute top-0.5 right-0 flex items-center gap-0.5 z-10">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{
                            boxShadow: '0 0 6px rgba(74, 222, 128, 0.9)'
                        }} />
                    </div>
                    <span className="text-xl transition-all duration-200" style={{
                        filter: activeTab === 'arena' ? 'drop-shadow(0 0 10px rgba(0,212,255,0.8))' : 'none',
                        transform: activeTab === 'arena' ? 'scale(1.1)' : 'scale(1)'
                    }}>🌍</span>
                    <span className={`text-[10px] mt-0.5 font-medium ${activeTab === 'arena' ? 'text-cyan-400' : 'text-white/50'}`}>
                        Arena
                    </span>
                    {activeTab === 'arena' && <ActiveIndicator color="#00d4ff" />}
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
