import React, { useState, useRef, useCallback, useEffect } from 'react'
import Footer from '../components/common/Footer'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'
import { formatTimeRemaining } from '../utils/dateUtils'
import { LIMITS } from '../config/constants'

export default function HomeScreen({
    mode,
    setMode,
    isPro,
    scansRemaining,
    dailyStreak,
    currentEvent,
    eventMode,
    setEventMode,
    purchasedScans,
    challengeScore,
    showToast,
    toastMessage,
    showInstallBanner,
    onShowInstallBanner, // To set false
    onImageSelected,
    onShowPaywall,
    onShowLeaderboard,
    onShowRules,
    onError
}) {
    // Local State
    const [view, setView] = useState('dashboard') // 'dashboard' or 'camera'
    const [cameraStream, setCameraStream] = useState(null)
    const [facingMode, setFacingMode] = useState('environment')
    const [countdown, setCountdown] = useState(null)
    const [cameraError, setCameraError] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)

    // Refs
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const fileInputRef = useRef(null)

    // ==========================================
    // Camera Handlers
    // ==========================================
    const startCamera = useCallback(async (facing = facingMode) => {
        setCameraError(null)
        // Stop existing
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facing },
                audio: false
            })
            setCameraStream(stream)
            setFacingMode(facing)
            setView('camera')

            // Connect stream
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.play()
                }
            }, 100)
        } catch (err) {
            console.error('Camera error:', err)
            // Fallback
            setCameraError(err.message)
            // If camera access fails, trigger file input directly? 
            // Or show error in dashboard?
            // Let's trigger file input 
            fileInputRef.current?.click()
        }
    }, [facingMode, cameraStream])

    const stopCamera = useCallback(() => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        setView('dashboard')
        setCountdown(null)
    }, [cameraStream])

    const flipCamera = useCallback(() => {
        const newFacing = facingMode === 'environment' ? 'user' : 'environment'
        startCamera(newFacing)
    }, [facingMode, startCamera])

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        if (video.readyState < 2) return

        playSound('shutter')
        vibrate(50)

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Flip if user facing
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        stopCamera()
        onImageSelected(imageData)

    }, [facingMode, stopCamera, onImageSelected])

    const timerCapture = useCallback(() => {
        if (countdown !== null) return
        setCountdown(3)
    }, [countdown])

    // Countdown Effect
    useEffect(() => {
        if (countdown === null) return

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev === null) {
                    clearInterval(timer)
                    return null
                }
                if (prev <= 1) {
                    clearInterval(timer)
                    setTimeout(() => capturePhoto(), 100)
                    return null
                }
                playSound('tick')
                vibrate(20)
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [countdown, capturePhoto])

    // Clean up camera on unmount
    useEffect(() => {
        return () => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop())
            }
        }
    }, [cameraStream])

    // ==========================================
    // File Upload Handler
    // ==========================================
    const handleFileUpload = useCallback(async (e) => {
        const file = e.target.files?.[0]
        if (!file || isProcessing) return

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            onError('Image is too large. Please try a smaller photo.')
            return
        }

        setIsProcessing(true)
        playSound('shutter')
        vibrate(50)

        try {
            let imageData
            if (file.size > 500 * 1024) {
                imageData = await compressImage(file, 1200, 0.7)
            } else {
                imageData = await new Promise((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = (e) => resolve(e.target.result)
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })
            }
            onImageSelected(imageData)
        } catch (err) {
            console.error('Image processing error:', err)
            onError('Something went wrong — try again!')
        } finally {
            setIsProcessing(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }, [isProcessing, onError, onImageSelected])


    // ==========================================
    // Helpers
    // ==========================================
    const getModeColor = () => {
        switch (mode) {
            case 'savage': return '#8b00ff'
            case 'roast': return '#ff4444'
            case 'honest': return '#0077ff'
            default: return '#00d4ff'
        }
    }
    const getModeGlow = () => {
        switch (mode) {
            case 'savage': return 'rgba(139,0,255,0.4)'
            case 'roast': return 'rgba(255,68,68,0.4)'
            case 'honest': return 'rgba(0,119,255,0.4)'
            default: return 'rgba(0,212,255,0.4)'
        }
    }

    // Derived Styles
    const accent = getModeColor()
    const accentGlow = getModeGlow()
    const accentEnd = mode === 'savage' ? '#ff0044' : mode === 'roast' ? '#ff8800' : mode === 'honest' ? '#00d4ff' : '#00ff88'

    const handleStart = () => {
        playSound('click')
        vibrate(20)
        if (scansRemaining > 0 || isPro || purchasedScans > 0) {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
            if (isMobile) {
                document.getElementById('mobileCameraInput')?.click()
            } else {
                startCamera()
            }
        } else {
            onShowPaywall()
        }
    }

    // ==========================================
    // RENDER: Camera View
    // ==========================================
    if (view === 'camera') {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}>
                {/* Live camera preview */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                />

                {/* Top bar */}
                <div className="relative z-10 flex items-center justify-between px-4 pt-4">
                    <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                        <span className="text-white text-sm font-medium">
                            {mode === 'roast' ? '🔥 Roast' : mode === 'honest' ? '📊 Honest' : '✨ Nice'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { playSound('click'); vibrate(10); flipCamera(); }}
                            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-95"
                        >
                            <span className="text-xl">🔄</span>
                        </button>
                    </div>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Bottom controls */}
                <div className="relative z-10 pb-6">
                    <div className="flex items-center justify-center gap-6 py-4" style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
                    }}>
                        {/* Cancel */}
                        <button
                            onClick={() => { playSound('click'); vibrate(15); stopCamera(); }}
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95"
                        >
                            <span className="text-white text-xl">✕</span>
                        </button>

                        {/* Capture */}
                        <button
                            onClick={() => { playSound('click'); vibrate(30); capturePhoto(); }}
                            disabled={countdown !== null}
                            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50"
                            style={{
                                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                boxShadow: '0 0 30px rgba(0,212,255,0.5)',
                                border: '4px solid white'
                            }}
                        >
                            <span className="text-3xl">📸</span>
                        </button>

                        {/* Timer */}
                        <button
                            onClick={() => { playSound('click'); vibrate(20); timerCapture(); }}
                            disabled={countdown !== null}
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 disabled:opacity-50"
                        >
                            <span className="text-white text-lg">⏱️</span>
                        </button>
                    </div>
                </div>

                {/* Countdown overlay */}
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="text-8xl font-black text-white" style={{
                            textShadow: '0 0 40px rgba(0,212,255,0.8), 0 0 80px rgba(0,212,255,0.5)',
                            animation: 'pulse 0.5s ease-in-out'
                        }}>
                            {countdown}
                        </div>
                    </div>
                )}

                {/* Canvas hidden */}
                <canvas ref={canvasRef} className="hidden" />
            </div>
        )
    }

    // ==========================================
    // RENDER: Dashboard View (Default)
    // ==========================================
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative" style={{
            background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
        }}>
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] rounded-full opacity-20" style={{
                    background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
                    top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'pulse 4s ease-in-out infinite'
                }} />
            </div>

            {/* Toast */}
            {showToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-60 animate-bounce" style={{
                    background: 'rgba(0,255,136,0.9)',
                    boxShadow: '0 4px 20px rgba(0,255,136,0.4)'
                }}>
                    <span className="text-black font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Inputs */}
            <input type="file" accept="image/*" capture="environment" id="mobileCameraInput" onChange={handleFileUpload} className="hidden" />
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <canvas ref={canvasRef} className="hidden" />

            {/* Pro Badge */}
            {isPro && (
                <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full" style={{
                    background: 'rgba(0,255,136,0.15)',
                    border: '1px solid rgba(0,255,136,0.3)'
                }}>
                    <span className="text-xs font-bold" style={{ color: '#00ff88' }}>⚡ PRO</span>
                </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-black mb-1 tracking-tight" style={{
                background: `linear-gradient(135deg, #fff 0%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>FITRATE</h1>
            <p className="text-sm mb-2 tracking-wide font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Your AI style coach
            </p>
            <p className="text-xs mb-6 tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Snap a photo • Get instant feedback • Have fun
            </p>

            {/* Install Banner */}
            {showInstallBanner && (
                <div className="mb-6 w-full max-w-sm px-4 py-3 rounded-2xl relative" style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)'
                }}>
                    <button
                        onClick={() => {
                            if (onShowInstallBanner) onShowInstallBanner(false)
                            localStorage.setItem('fitrate_install_dismissed', 'true')
                            vibrate(10)
                        }}
                        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/10"
                    >
                        <span className="text-white/50 text-xs">✕</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">📲</span>
                        <div>
                            <p className="text-sm font-bold text-white mb-0.5">Install FitRate</p>
                            <p className="text-[10px] text-gray-400">
                                {/iPhone|iPad/.test(navigator.userAgent)
                                    ? 'Tap Share ↗ then "Add to Home Screen"'
                                    : /Android/.test(navigator.userAgent)
                                        ? 'Tap ⋮ menu then "Install app"'
                                        : 'Add to your home screen for quick access'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Challenge Banner */}
            {challengeScore && (
                <div className="mb-8 px-6 py-4 rounded-2xl text-center" style={{
                    background: 'linear-gradient(135deg, rgba(255,68,68,0.2) 0%, rgba(255,136,0,0.2) 100%)',
                    border: '1px solid rgba(255,136,0,0.4)'
                }}>
                    <p className="text-2xl font-black text-white mb-1">👊 Beat {challengeScore}?</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Your friend scored {challengeScore}/100 — can you do better?
                    </p>
                </div>
            )}

            {/* Streak */}
            {dailyStreak > 0 && (
                <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-[0_0_20px_rgba(255,165,0,0.1)]">
                        <span className="text-sm">🔥</span>
                        <span className="text-xs font-black text-orange-400 uppercase tracking-widest">{dailyStreak} DAY STREAK</span>
                    </div>
                </div>
            )}

            {/* MAIN ACTION CTA */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <button
                    onClick={handleStart}
                    className="btn-physical relative w-72 h-72 rounded-full flex flex-col items-center justify-center group"
                    style={{
                        background: `radial-gradient(circle, ${getModeGlow()} 0%, transparent 70%)`,
                        border: `3px solid ${accent}99`,
                        boxShadow: `var(--shadow-physical), 0 0 100px ${accentGlow}, inset 0 0 80px rgba(255,255,255,0.03)`,
                        opacity: (scansRemaining === 0 && !isPro && purchasedScans === 0) ? 0.6 : 1
                    }}
                >
                    {/* Inner pulse */}
                    <div className="absolute inset-4 rounded-full transition-all duration-300 group-hover:scale-105 group-active:scale-95" style={{
                        background: `linear-gradient(135deg, ${accent} 0%, ${accentEnd} 100%)`,
                        boxShadow: `0 0 60px ${accentGlow}`,
                        animation: 'pulse 2s ease-in-out infinite'
                    }} />

                    {/* Icon & Text */}
                    <span className="relative text-8xl mb-4 drop-shadow-2xl">
                        {eventMode && currentEvent ? currentEvent.themeEmoji : mode === 'roast' ? '🔥' : mode === 'savage' ? '💀' : mode === 'honest' ? '📊' : '📸'}
                    </span>
                    <span className="relative text-white text-2xl font-black tracking-widest uppercase">
                        {eventMode && currentEvent ? currentEvent.theme.toUpperCase() : mode === 'roast' ? 'ROAST MY FIT' : mode === 'savage' ? 'DESTROY MY FIT' : mode === 'honest' ? 'ANALYZE FIT' : 'RATE MY FIT'}
                    </span>

                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                        <p className="text-[12px] font-black text-white/50 uppercase tracking-[0.15em] animate-pulse">
                            {eventMode ? 'Submit for Leaderboard' : 'Tap to Start'}
                        </p>
                    </div>
                </button>
            </div>

            {/* Mode Selectors */}
            <div className="mt-6 mb-10 grid grid-cols-2 gap-2 p-2 rounded-2xl" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Nice */}
                <button
                    onClick={() => { playSound('click'); vibrate(15); setMode('nice'); }}
                    className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 active:scale-[0.97] ${mode === 'nice' ? 'opacity-100' : 'opacity-60'}`}
                    style={{
                        background: mode === 'nice' ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.05)',
                        border: mode === 'nice' ? '1px solid #00d4ff' : '1px solid transparent'
                    }}
                >
                    <span className={`text-base transition-opacity ${mode === 'nice' ? 'opacity-100' : 'opacity-50'}`}>😇</span>
                    <span className={`text-sm font-medium transition-opacity ${mode === 'nice' ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>Nice</span>
                </button>

                {/* Roast */}
                <button
                    onClick={() => { playSound('click'); vibrate(15); setMode('roast'); }}
                    className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 active:scale-[0.97] ${mode === 'roast' ? 'opacity-100' : 'opacity-60'}`}
                    style={{
                        background: mode === 'roast' ? 'rgba(255,68,68,0.25)' : 'rgba(255,255,255,0.05)',
                        border: mode === 'roast' ? '1px solid #ff4444' : '1px solid transparent'
                    }}
                >
                    <span className={`text-base transition-opacity ${mode === 'roast' ? 'opacity-100' : 'opacity-50'}`}>😈</span>
                    <span className={`text-sm font-medium transition-opacity ${mode === 'roast' ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>Roast</span>
                </button>

                {/* PRO: Honest */}
                <button
                    onClick={() => {
                        playSound('click'); vibrate(15);
                        if (isPro) setMode('honest');
                        else onShowPaywall();
                    }}
                    className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'honest' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                    style={{
                        background: mode === 'honest' && isPro ? 'rgba(74,144,217,0.25)' : 'rgba(74,144,217,0.1)',
                        border: mode === 'honest' && isPro ? '1px solid #4A90D9' : '1px dashed rgba(74,144,217,0.4)'
                    }}
                >
                    <span className={`text-base ${mode === 'honest' && isPro ? 'opacity-100' : 'opacity-50'}`}>📊</span>
                    <span className={`text-sm font-medium ${mode === 'honest' && isPro ? 'text-white' : 'text-gray-400'}`}>Honest</span>
                    {!isPro && <span className="text-[8px] ml-1 text-yellow-400 font-bold">PRO</span>}
                </button>

                {/* PRO: Savage */}
                <button
                    onClick={() => {
                        playSound('click'); vibrate(15);
                        if (isPro) setMode('savage');
                        else onShowPaywall();
                    }}
                    className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'savage' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                    style={{
                        background: mode === 'savage' && isPro ? 'rgba(255,68,68,0.25)' : 'rgba(255,68,68,0.1)',
                        border: mode === 'savage' && isPro ? '1px solid #ff4444' : '1px dashed rgba(255,68,68,0.4)'
                    }}
                >
                    <span className={`text-base ${mode === 'savage' && isPro ? 'opacity-100' : 'opacity-50'}`}>💀</span>
                    <span className={`text-sm font-medium ${mode === 'savage' && isPro ? 'text-white' : 'text-gray-400'}`}>Savage</span>
                    {!isPro && <span className="text-[8px] ml-1 text-yellow-400 font-bold">PRO</span>}
                </button>
            </div>

            {/* Weekly Event Bar */}
            {currentEvent && (
                <button
                    onClick={() => {
                        vibrate(15); playSound('click');
                        if (isPro) setEventMode(!eventMode);
                        else onShowPaywall();
                    }}
                    className={`w-full max-w-sm mt-4 px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${eventMode && isPro ? 'ring-2 ring-emerald-400' : ''}`}
                    style={{
                        background: eventMode && isPro
                            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)'
                            : isPro
                                ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                                : 'linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                        border: eventMode && isPro
                            ? '1px solid rgba(16, 185, 129, 0.5)'
                            : isPro
                                ? '1px solid rgba(16, 185, 129, 0.25)'
                                : '1px dashed rgba(251, 191, 36, 0.4)'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-sm">{currentEvent.themeEmoji}</span>
                        <span className="text-sm font-bold text-white">{currentEvent.theme}</span>
                        {isPro ? (
                            <span className={`text-[10px] font-bold uppercase ${eventMode ? 'text-emerald-300' : 'text-emerald-400'}`}>
                                {eventMode ? '✓ ACTIVE' : 'Event'}
                            </span>
                        ) : (
                            <span className="text-[10px] text-amber-400 font-bold uppercase">PRO</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">⏱️ {formatTimeRemaining(currentEvent.endDate)}</span>
                        {isPro ? (
                            <span className={`text-sm ${eventMode ? 'text-emerald-400' : 'text-cyan-400'}`}>{eventMode ? '✓' : '+'}</span>
                        ) : (
                            <span className="text-amber-400 text-sm">🔒</span>
                        )}
                    </div>
                </button>
            )}

            {/* Leaderboard Link */}
            {currentEvent && (
                <button
                    onClick={() => { onShowLeaderboard(); vibrate(10); }}
                    className="mt-2 text-xs font-medium text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                >
                    <span>🏆</span> See Leaderboard
                </button>
            )}

            {/* Trust Message */}
            <p className="mt-6 text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                <span>🔒</span> Photos analyzed instantly, never stored
            </p>

            {/* Scans Remaining */}
            <div style={{
                width: '100%',
                marginTop: 'auto',
                paddingTop: '16px',
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                zIndex: 50
            }}>
                <p style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    margin: 0
                }}>
                    {isPro
                        ? '⚡ Pro: 25 ratings/day'
                        : `${scansRemaining} free scan${scansRemaining !== 1 ? 's' : ''} left`}
                </p>

                {/* GO PRO BUTTON */}
                {!isPro && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            playSound('click'); vibrate(20);
                            onShowPaywall();
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            padding: '14px 28px', backgroundColor: '#ffd700', color: '#000',
                            fontSize: '16px', fontWeight: 'bold', borderRadius: '50px', border: 'none',
                            cursor: 'pointer', minHeight: '52px', minWidth: '160px',
                            boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
                            zIndex: 100
                        }}
                    >
                        👑 Go Pro
                    </button>
                )}
            </div>

            <Footer className="opacity-50" />
        </div>
    )
}
