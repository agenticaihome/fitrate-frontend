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
    hasSeenEventExplainer,
    onShowEventExplainer,
    freeEventEntryUsed,  // Track if free user has used their weekly entry
    onImageSelected,
    onShowPaywall,
    onShowLeaderboard,
    onShowRules,
    onShowRestore,      // Show restore Pro modal
    onError
}) {
    // Local State
    const [view, setView] = useState('dashboard') // 'dashboard' or 'camera'
    const [cameraStream, setCameraStream] = useState(null)
    const [facingMode, setFacingMode] = useState('environment')
    const [countdown, setCountdown] = useState(null)
    const [cameraError, setCameraError] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showProModes, setShowProModes] = useState(false) // For Pro mode expansion

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
            case 'rizz': return '#ff69b4'     // Hot pink
            case 'celeb': return '#ffd700'    // Gold
            case 'aura': return '#9b59b6'     // Purple
            case 'chaos': return '#ff6b6b'    // Coral
            default: return '#00d4ff'
        }
    }
    const getModeGlow = () => {
        switch (mode) {
            case 'savage': return 'rgba(139,0,255,0.4)'
            case 'roast': return 'rgba(255,68,68,0.4)'
            case 'honest': return 'rgba(0,119,255,0.4)'
            case 'rizz': return 'rgba(255,105,180,0.4)'
            case 'celeb': return 'rgba(255,215,0,0.4)'
            case 'aura': return 'rgba(155,89,182,0.4)'
            case 'chaos': return 'rgba(255,107,107,0.4)'
            default: return 'rgba(0,212,255,0.4)'
        }
    }

    // Derived Styles
    const accent = getModeColor()
    const accentGlow = getModeGlow()
    const accentEnd = {
        savage: '#ff0044', roast: '#ff8800', honest: '#00d4ff',
        rizz: '#ff1493', celeb: '#ff8c00', aura: '#8e44ad', chaos: '#ee5a24'
    }[mode] || '#00ff88'

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
                            aria-label="Flip camera to front or back"
                        >
                            <span className="text-xl" aria-hidden="true">🔄</span>
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
                            aria-label="Cancel and return to home"
                        >
                            <span className="text-white text-xl" aria-hidden="true">✕</span>
                        </button>

                        {/* Capture */}
                        <button
                            onClick={() => { playSound('click'); vibrate(30); capturePhoto(); }}
                            disabled={countdown !== null}
                            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50"
                            aria-label="Take photo"
                            style={{
                                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                boxShadow: '0 0 30px rgba(0,212,255,0.5)',
                                border: '4px solid white'
                            }}
                        >
                            <span className="text-3xl" aria-hidden="true">📸</span>
                        </button>

                        {/* Timer */}
                        <button
                            onClick={() => { playSound('click'); vibrate(20); timerCapture(); }}
                            disabled={countdown !== null}
                            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 disabled:opacity-50"
                            aria-label="Start 3 second countdown timer"
                        >
                            <span className="text-white text-lg" aria-hidden="true">⏱️</span>
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

            {/* Pro Badge - Moved to bottom/footer area for cleaner above-fold */}

            {/* Logo */}
            <img
                src="/logo.svg"
                alt="FitRate"
                className="h-12 mb-1"
                style={{
                    filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))'
                }}
            />
            <p className="text-sm mb-6 tracking-wide font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
                How hard is your fit?
            </p>

            {/* Install Banner moved to footer - not above-fold */}

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

            {/* Streak moved to bottom area - cleaner above-fold */}

            {/* MAIN ACTION CTA */}
            <div className="flex-1 flex flex-col items-center justify-center">
                {/* Out of scans state */}
                {scansRemaining === 0 && !isPro && purchasedScans === 0 ? (
                    <div className="relative w-72 h-72 rounded-full flex flex-col items-center justify-center"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '3px dashed rgba(255,255,255,0.2)',
                            cursor: 'not-allowed'
                        }}
                    >
                        <span className="text-6xl mb-4 opacity-40">⏳</span>
                        <span className="text-white/60 text-lg font-bold uppercase tracking-wide text-center px-8">
                            Out of Scans
                        </span>
                        <span className="text-white/40 text-sm mt-2 text-center px-8">
                            {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Resets at midnight'}
                        </span>
                        <button
                            onClick={() => { playSound('click'); vibrate(15); onShowPaywall(); }}
                            className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 active:brightness-90"
                            style={{
                                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                color: '#000'
                            }}
                        >
                            ⚡ Get Unlimited Scans
                        </button>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <p className="text-xs font-medium text-white/40">
                                or wait for daily reset
                            </p>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleStart}
                        aria-label={eventMode && currentEvent
                            ? `Submit outfit for ${currentEvent.theme} event in ${mode} mode`
                            : `Take a photo to rate your outfit in ${mode} mode`
                        }
                        className="btn-physical relative w-72 h-72 rounded-full flex flex-col items-center justify-center group"
                        style={{
                            background: `radial-gradient(circle, ${getModeGlow()} 0%, transparent 70%)`,
                            border: `3px solid ${accent}99`,
                            boxShadow: `var(--shadow-physical), 0 0 100px ${accentGlow}, inset 0 0 80px rgba(255,255,255,0.03)`
                        }}
                    >
                        {/* Inner pulse */}
                        <div className="absolute inset-4 rounded-full transition-all duration-300 group-hover:scale-105 group-active:scale-95" style={{
                            background: `linear-gradient(135deg, ${accent} 0%, ${accentEnd} 100%)`,
                            boxShadow: `0 0 60px ${accentGlow}`,
                            animation: 'pulse 2s ease-in-out infinite'
                        }} aria-hidden="true" />

                        {/* Icon & Text */}
                        <span className="relative text-8xl mb-4 drop-shadow-2xl" aria-hidden="true">
                            {eventMode && currentEvent ? currentEvent.themeEmoji :
                                mode === 'roast' ? '🔥' : mode === 'savage' ? '💀' : mode === 'honest' ? '📊' :
                                    mode === 'rizz' ? '😏' : mode === 'celeb' ? '🎭' : mode === 'aura' ? '🔮' : mode === 'chaos' ? '🎪' : '📸'}
                        </span>
                        <span className={`relative text-white font-black uppercase text-center px-4 leading-tight ${eventMode && currentEvent
                            ? 'text-base tracking-wide max-w-[200px]'  // Smaller for event themes
                            : 'text-2xl tracking-widest'  // Original size for mode names
                            }`}>
                            {eventMode && currentEvent ? currentEvent.theme.toUpperCase() :
                                mode === 'roast' ? 'ROAST MY FIT' : mode === 'savage' ? 'DESTROY MY FIT' : mode === 'honest' ? 'ANALYZE FIT' :
                                    mode === 'rizz' ? 'CHECK MY RIZZ' : mode === 'celeb' ? 'JUDGE MY FIT' : mode === 'aura' ? 'READ MY AURA' : mode === 'chaos' ? 'CHAOS MODE' : 'RATE MY FIT'}
                        </span>

                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <p className="text-[12px] font-black text-white/50 uppercase tracking-[0.15em] animate-pulse">
                                {eventMode ? 'Submit for Leaderboard' : 'Tap to Start'}
                            </p>
                        </div>
                    </button>
                )}
            </div>

            {/* Mode Selectors - Simplified: Nice/Roast visible, Pro modes collapsed */}
            <div className="mt-6 mb-4 flex flex-col gap-2 p-2 rounded-2xl" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {/* Primary modes: Nice & Roast */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Nice */}
                    <button
                        onClick={() => { playSound('click'); vibrate(15); setMode('nice'); setEventMode(false); }}
                        aria-label="Nice mode - get encouraging feedback"
                        aria-pressed={mode === 'nice'}
                        className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 active:scale-[0.97] ${mode === 'nice' ? 'opacity-100' : 'opacity-60'}`}
                        style={{
                            background: mode === 'nice' ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.05)',
                            border: mode === 'nice' ? '1px solid #00d4ff' : '1px solid transparent'
                        }}
                    >
                        <span className={`text-base transition-opacity ${mode === 'nice' ? 'opacity-100' : 'opacity-50'}`} aria-hidden="true">😇</span>
                        <span className={`text-sm font-medium transition-opacity ${mode === 'nice' ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>Nice</span>
                    </button>

                    {/* Roast */}
                    <button
                        onClick={() => { playSound('click'); vibrate(15); setMode('roast'); setEventMode(false); }}
                        aria-label="Roast mode - get humorous critiques"
                        aria-pressed={mode === 'roast'}
                        className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 active:scale-[0.97] ${mode === 'roast' ? 'opacity-100' : 'opacity-60'}`}
                        style={{
                            background: mode === 'roast' ? 'rgba(255,68,68,0.25)' : 'rgba(255,255,255,0.05)',
                            border: mode === 'roast' ? '1px solid #ff4444' : '1px solid transparent'
                        }}
                    >
                        <span className={`text-base transition-opacity ${mode === 'roast' ? 'opacity-100' : 'opacity-50'}`} aria-hidden="true">🔥</span>
                        <span className={`text-sm font-medium transition-opacity ${mode === 'roast' ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>Roast</span>
                    </button>
                </div>

                {/* More Modes Toggle */}
                <button
                    onClick={() => { playSound('click'); vibrate(10); setShowProModes(!showProModes); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs"
                    style={{ color: 'rgba(255,255,255,0.5)' }}
                >
                    <span>{showProModes ? '▲ Less' : '▼ More Modes'}</span>
                    {!isPro && <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-black text-[10px]">PRO</span>}
                </button>

                {/* Pro Modes - Collapsible (6 modes in 2x3 grid) */}
                {showProModes && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                        {/* PRO: Honest */}
                        <button
                            onClick={() => {
                                playSound('click'); vibrate(15);
                                if (isPro) { setMode('honest'); setEventMode(false); }
                                else onShowPaywall();
                            }}
                            aria-label={isPro ? "Honest mode - get balanced analysis" : "Honest mode - Pro feature, tap to upgrade"}
                            aria-pressed={mode === 'honest' && isPro}
                            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'honest' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                            style={{
                                background: mode === 'honest' && isPro ? 'rgba(74,144,217,0.25)' : 'rgba(74,144,217,0.1)',
                                border: mode === 'honest' && isPro ? '1px solid #4A90D9' : '1px dashed rgba(74,144,217,0.4)'
                            }}
                        >
                            {!isPro && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
                            <span className={`text-base ${mode === 'honest' && isPro ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true">📊</span>
                            <span className={`text-sm font-medium ${mode === 'honest' && isPro ? 'text-white' : 'text-gray-500'}`}>Honest</span>
                        </button>

                        {/* PRO: Savage */}
                        <button
                            onClick={() => {
                                playSound('click'); vibrate(15);
                                if (isPro) { setMode('savage'); setEventMode(false); }
                                else onShowPaywall();
                            }}
                            aria-label={isPro ? "Savage mode - get brutally honest feedback" : "Savage mode - Pro feature, tap to upgrade"}
                            aria-pressed={mode === 'savage' && isPro}
                            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'savage' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                            style={{
                                background: mode === 'savage' && isPro ? 'rgba(255,68,68,0.25)' : 'rgba(255,68,68,0.1)',
                                border: mode === 'savage' && isPro ? '1px solid #ff4444' : '1px dashed rgba(255,68,68,0.4)'
                            }}
                        >
                            {!isPro && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
                            <span className={`text-base ${mode === 'savage' && isPro ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true">💀</span>
                            <span className={`text-sm font-medium ${mode === 'savage' && isPro ? 'text-white' : 'text-gray-500'}`}>Savage</span>
                        </button>

                        {/* PRO: Rizz Rating */}
                        <button
                            onClick={() => {
                                playSound('click'); vibrate(15);
                                if (isPro) { setMode('rizz'); setEventMode(false); }
                                else onShowPaywall();
                            }}
                            aria-label={isPro ? "Rizz mode - rate your dating potential" : "Rizz mode - Pro feature, tap to upgrade"}
                            aria-pressed={mode === 'rizz' && isPro}
                            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'rizz' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                            style={{
                                background: mode === 'rizz' && isPro ? 'rgba(255,105,180,0.25)' : 'rgba(255,105,180,0.1)',
                                border: mode === 'rizz' && isPro ? '1px solid #ff69b4' : '1px dashed rgba(255,105,180,0.4)'
                            }}
                        >
                            {!isPro && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
                            <span className={`text-base ${mode === 'rizz' && isPro ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true">😏</span>
                            <span className={`text-sm font-medium ${mode === 'rizz' && isPro ? 'text-white' : 'text-gray-500'}`}>Rizz</span>
                        </button>

                        {/* PRO: Celebrity Judge */}
                        <button
                            onClick={() => {
                                playSound('click'); vibrate(15);
                                if (isPro) { setMode('celeb'); setEventMode(false); }
                                else onShowPaywall();
                            }}
                            aria-label={isPro ? "Celebrity mode - get judged by fashion icons" : "Celebrity mode - Pro feature, tap to upgrade"}
                            aria-pressed={mode === 'celeb' && isPro}
                            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'celeb' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                            style={{
                                background: mode === 'celeb' && isPro ? 'rgba(255,215,0,0.25)' : 'rgba(255,215,0,0.1)',
                                border: mode === 'celeb' && isPro ? '1px solid #ffd700' : '1px dashed rgba(255,215,0,0.4)'
                            }}
                        >
                            {!isPro && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
                            <span className={`text-base ${mode === 'celeb' && isPro ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true">🎭</span>
                            <span className={`text-sm font-medium ${mode === 'celeb' && isPro ? 'text-white' : 'text-gray-500'}`}>Celeb</span>
                        </button>

                        {/* PRO: Aura / Vibe Check */}
                        <button
                            onClick={() => {
                                playSound('click'); vibrate(15);
                                if (isPro) { setMode('aura'); setEventMode(false); }
                                else onShowPaywall();
                            }}
                            aria-label={isPro ? "Aura mode - read your vibe and energy" : "Aura mode - Pro feature, tap to upgrade"}
                            aria-pressed={mode === 'aura' && isPro}
                            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'aura' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                            style={{
                                background: mode === 'aura' && isPro ? 'rgba(155,89,182,0.25)' : 'rgba(155,89,182,0.1)',
                                border: mode === 'aura' && isPro ? '1px solid #9b59b6' : '1px dashed rgba(155,89,182,0.4)'
                            }}
                        >
                            {!isPro && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
                            <span className={`text-base ${mode === 'aura' && isPro ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true">🔮</span>
                            <span className={`text-sm font-medium ${mode === 'aura' && isPro ? 'text-white' : 'text-gray-500'}`}>Aura</span>
                        </button>

                        {/* PRO: Chaos Mode */}
                        <button
                            onClick={() => {
                                playSound('click'); vibrate(15);
                                if (isPro) { setMode('chaos'); setEventMode(false); }
                                else onShowPaywall();
                            }}
                            aria-label={isPro ? "Chaos mode - unhinged AI feedback" : "Chaos mode - Pro feature, tap to upgrade"}
                            aria-pressed={mode === 'chaos' && isPro}
                            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'chaos' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
                            style={{
                                background: mode === 'chaos' && isPro ? 'rgba(255,107,107,0.25)' : 'rgba(255,107,107,0.1)',
                                border: mode === 'chaos' && isPro ? '1px solid #ff6b6b' : '1px dashed rgba(255,107,107,0.4)'
                            }}
                        >
                            {!isPro && <span className="absolute -top-1 -right-1 text-xs">🔒</span>}
                            <span className={`text-base ${mode === 'chaos' && isPro ? 'opacity-100' : 'opacity-40'}`} aria-hidden="true">🎪</span>
                            <span className={`text-sm font-medium ${mode === 'chaos' && isPro ? 'text-white' : 'text-gray-500'}`}>Chaos</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Scans Remaining + Pro Badge + Streak */}
            <div className="mb-6 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-3">
                    {!isPro && (
                        <span className="text-xs text-white/40">
                            {scansRemaining} scan{scansRemaining !== 1 ? 's' : ''} left today
                        </span>
                    )}
                    {isPro && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                            background: 'rgba(0,255,136,0.15)',
                            color: '#00ff88',
                            border: '1px solid rgba(0,255,136,0.3)'
                        }}>⚡ PRO</span>
                    )}
                </div>

                {/* Streak with 7-day reward progress */}
                {dailyStreak > 0 && (
                    <div className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-xl" style={{
                        background: dailyStreak >= 7
                            ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,140,0,0.1) 100%)'
                            : 'rgba(255,136,0,0.08)',
                        border: dailyStreak >= 7
                            ? '1px solid rgba(255,215,0,0.4)'
                            : '1px solid rgba(255,136,0,0.2)'
                    }}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🔥</span>
                            <span className={`font-black ${dailyStreak >= 7 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                {dailyStreak} day streak{dailyStreak >= 7 ? '!' : ''}
                            </span>
                        </div>
                        {dailyStreak < 7 ? (
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full transition-all"
                                        style={{ width: `${(dailyStreak / 7) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] text-white/40">{7 - dailyStreak} to go</span>
                            </div>
                        ) : (
                            <span className="text-[10px] text-yellow-400/80 font-bold">🎁 +1 FREE Pro Scan!</span>
                        )}
                    </div>
                )}
            </div>

            {currentEvent && (
                <button
                    onClick={() => {
                        vibrate(15); playSound('click');
                        // First-time users: show explainer modal
                        if (!hasSeenEventExplainer) {
                            onShowEventExplainer();
                            return;
                        }
                        // User has seen explainer - toggle event mode
                        // Pro users: unlimited toggles
                        // Free users: can join if they haven't used their weekly entry
                        if (isPro) {
                            setEventMode(!eventMode);
                        } else if (!freeEventEntryUsed) {
                            // Free user with available entry - let them join!
                            setEventMode(!eventMode);
                        } else {
                            // Free user who already used their entry - show paywall
                            onShowPaywall();
                        }
                    }}
                    aria-label={isPro
                        ? `${currentEvent.theme} weekly event - ${eventMode ? 'currently active, tap to deactivate' : 'tap to join'}`
                        : freeEventEntryUsed
                            ? `${currentEvent.theme} weekly event - free entry used, upgrade for more`
                            : `${currentEvent.theme} weekly event - tap to use your free entry`
                    }
                    aria-pressed={eventMode}
                    className={`w-full max-w-sm mt-4 px-4 py-3 rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${eventMode ? 'ring-2 ring-emerald-400' : ''}`}
                    style={{
                        background: eventMode
                            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)'
                            : isPro
                                ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                                : !freeEventEntryUsed
                                    ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)'
                                    : 'linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.1) 100%)',
                        border: eventMode
                            ? '1px solid rgba(16, 185, 129, 0.5)'
                            : isPro || !freeEventEntryUsed
                                ? '1px solid rgba(16, 185, 129, 0.25)'
                                : '1px dashed rgba(251, 191, 36, 0.4)'
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-lg" aria-hidden="true">{currentEvent.themeEmoji}</span>
                        <div className="flex flex-col items-start">
                            <span className="text-sm font-bold text-white">{currentEvent.theme}</span>
                            <span className="text-[10px] text-gray-400">Weekly Challenge</span>
                        </div>
                        {isPro ? (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${eventMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {eventMode ? '✓ ACTIVE' : 'JOIN'}
                            </span>
                        ) : !freeEventEntryUsed ? (
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${eventMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                {eventMode ? '✓ ACTIVE' : '1 FREE'}
                            </span>
                        ) : (
                            <span className="text-[10px] bg-amber-500/20 text-amber-400 font-bold uppercase px-2 py-0.5 rounded-full">USED</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-400 font-medium">⏱️ {formatTimeRemaining(currentEvent.endDate)}</span>
                        {isPro ? (
                            <span className={`text-sm ${eventMode ? 'text-emerald-400' : 'text-cyan-400'}`}>{eventMode ? '✓' : '→'}</span>
                        ) : !freeEventEntryUsed ? (
                            <span className={`text-sm ${eventMode ? 'text-emerald-400' : 'text-cyan-400'}`}>{eventMode ? '✓' : '→'}</span>
                        ) : (
                            <span className="text-amber-400 text-sm">🔒</span>
                        )}
                    </div>
                </button>
            )
            }

            {/* Leaderboard & Rules Links */}
            {currentEvent && (
                <div className="flex items-center gap-4 mt-2">
                    <button
                        onClick={() => { onShowLeaderboard(); vibrate(10); }}
                        aria-label="View weekly event leaderboard"
                        className="text-xs font-medium text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <span aria-hidden="true">🏆</span> Leaderboard
                    </button>
                    <button
                        onClick={() => { onShowRules(); vibrate(10); }}
                        aria-label="View weekly event rules"
                        className="text-xs font-medium text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                    >
                        <span aria-hidden="true">📖</span> Rules
                    </button>
                </div>
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

                {/* Restore Pro link for returning users */}
                {!isPro && onShowRestore && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            playSound('click'); vibrate(10);
                            onShowRestore();
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: '8px'
                        }}
                    >
                        Already Pro? Restore purchase
                    </button>
                )}
            </div>

            <Footer className="opacity-50" />
        </div >
    )
}
