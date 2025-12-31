import React, { useState, useEffect } from 'react'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * PWA Update Banner - Shows refresh button for standalone (PWA) mode
 * Allows users to manually refresh for updates without losing data
 */
export default function PWAUpdateBanner({ isStandalone }) {
    const [showBanner, setShowBanner] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [updateAvailable, setUpdateAvailable] = useState(false)

    // Check for service worker updates
    useEffect(() => {
        if (!isStandalone) return

        // Listen for service worker updates
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                // Check for updates periodically
                registration.update()

                // Listen for update found
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                setUpdateAvailable(true)
                                setShowBanner(true)
                            }
                        })
                    }
                })
            })

            // Also check for waiting service worker on load
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg?.waiting) {
                    setUpdateAvailable(true)
                    setShowBanner(true)
                }
            })
        }

        // Show banner subtly after some time in PWA mode
        const timer = setTimeout(() => {
            setShowBanner(true)
        }, 60000) // Show after 1 minute

        return () => clearTimeout(timer)
    }, [isStandalone])

    const handleRefresh = async () => {
        playSound('click')
        vibrate(20)
        setIsRefreshing(true)

        try {
            if ('serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration()

                if (reg?.waiting) {
                    // Set up listener BEFORE telling SW to skip waiting
                    // This ensures we reload AFTER the new SW takes control
                    const controllerChanged = new Promise((resolve) => {
                        navigator.serviceWorker.addEventListener('controllerchange', () => {
                            resolve()
                        }, { once: true })
                    })

                    // Tell the waiting SW to activate
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' })

                    // Wait for the new SW to take control, then reload
                    await controllerChanged

                    // Small delay for iOS stability
                    await new Promise(r => setTimeout(r, 100))

                    // Use location.replace for iOS PWA compatibility
                    // This reloads in-place without escaping to Safari
                    window.location.replace(window.location.href)
                    return
                }
            }

            // Fallback: If no waiting SW, just clear caches and reload
            if ('caches' in window) {
                const keys = await caches.keys()
                await Promise.all(keys.map(key => caches.delete(key)))
            }

            // Use location.replace instead of reload for iOS PWA
            window.location.replace(window.location.href)
        } catch (err) {
            console.error('[PWA] Refresh failed:', err)
            // Even on error, use replace not reload
            window.location.replace(window.location.href)
        }
    }

    if (!isStandalone || !showBanner) return null

    return (
        <div
            className="pwa-update-banner"
            style={{
                position: 'fixed',
                top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
                right: 8,
                zIndex: 9999,
            }}
        >
            <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label={updateAvailable ? "Update available - tap to refresh" : "Refresh app"}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 20,
                    border: 'none',
                    background: updateAvailable
                        ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 255, 136, 0.2))'
                        : 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: updateAvailable ? '#00d4ff' : 'rgba(255, 255, 255, 0.6)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: updateAvailable
                        ? '0 0 20px rgba(0, 212, 255, 0.3), 0 4px 12px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.2)',
                }}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                    }}
                >
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                </svg>
                {updateAvailable && (
                    <span style={{ fontWeight: 600 }}>Update</span>
                )}
            </button>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .pwa-update-banner button:active {
                    transform: scale(0.95);
                    opacity: 0.9;
                }
            `}</style>
        </div>
    )
}
