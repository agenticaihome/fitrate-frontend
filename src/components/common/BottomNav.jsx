import React from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

const TABS = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'scan', icon: '📸', label: 'Scan' },
    { id: 'gala', icon: '🏆', label: 'Event' },
]

/**
 * Persistent Bottom Navigation Bar
 * Shows on: home, results, share-success screens
 * Provides quick navigation between core features
 * 
 * @param {string} activeTab - Current active tab ('home', 'gala', or null)
 * @param {boolean} eventMode - Whether user is in competition/event mode
 * @param {function} onNavigate - Called with tab id when tab is tapped
 * @param {function} onScan - Called when scan button is tapped
 */
export default function BottomNav({ activeTab, eventMode, onNavigate, onScan }) {
    const handleTap = (tabId) => {
        playSound('click')
        vibrate(15)

        if (tabId === 'scan') {
            // Scan button triggers camera flow directly
            onScan?.()
        } else {
            onNavigate?.(tabId)
        }
    }

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
            style={{
                height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                background: 'rgba(10, 10, 15, 0.95)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 -4px 30px rgba(0,0,0,0.3)'
            }}
        >
            {TABS.map(tab => {
                const isActive = activeTab === tab.id
                const isScan = tab.id === 'scan'
                const isGala = tab.id === 'gala'

                // When in event mode, highlight Gala tab
                const isEventHighlight = eventMode && isGala

                return (
                    <button
                        key={tab.id}
                        onClick={() => handleTap(tab.id)}
                        className="flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90"
                        style={{
                            flex: 1,
                            minHeight: '56px',
                            minWidth: '64px', // Accessibility: 44px+ tap target
                            color: isActive || isEventHighlight ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                            transform: isScan ? 'translateY(-8px)' : 'none'
                        }}
                    >
                        {isScan ? (
                            // Floating Scan Button - Primary CTA
                            // Changes to gold/orange when in event mode
                            <div
                                className="flex items-center justify-center rounded-full transition-all"
                                style={{
                                    width: 56,
                                    height: 56,
                                    background: eventMode
                                        ? 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)'
                                        : 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                    boxShadow: eventMode
                                        ? '0 4px 20px rgba(255,215,0,0.5)'
                                        : '0 4px 20px rgba(0,212,255,0.4)',
                                }}
                            >
                                <span className="text-2xl">{eventMode ? '🏆' : '📸'}</span>
                            </div>
                        ) : (
                            <>
                                <span className="text-xl" style={{
                                    // Pulse animation when in event mode and this is the Gala tab
                                    animation: isEventHighlight ? 'pulse 2s infinite' : 'none'
                                }}>{tab.icon}</span>
                                <span className="text-[10px] font-medium" style={{
                                    color: isEventHighlight ? '#ffd700' : undefined
                                }}>
                                    {isEventHighlight ? '⚡ Event' : tab.label}
                                </span>
                            </>
                        )}
                    </button>
                )
            })}
        </nav>
    )
}
