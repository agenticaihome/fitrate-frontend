import React, { useState, useRef, useCallback, useEffect } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'
import { formatTimeRemaining } from '../utils/dateUtils'
import { LIMITS } from '../config/constants'

export default function HomeScreen({
    mode,
    setMode,
    isPro,
    scansRemaining,
    // proPreviewAvailable removed - now just 2 free Gemini scans/day
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
    onError,
    onStartFashionShow  // Start Fashion Show flow
}) {
    // Local State
    const [view, setView] = useState('dashboard') // 'dashboard' or 'camera'
    const [cameraStream, setCameraStream] = useState(null)
    const [facingMode, setFacingMode] = useState('environment')
    const [countdown, setCountdown] = useState(null)
    const [cameraError, setCameraError] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showAndroidPhotoModal, setShowAndroidPhotoModal] = useState(false) // Android dual-button picker
    const [showModeDrawer, setShowModeDrawer] = useState(false) // Pro mode drawer
    // Scan type choice modal removed - now just 2 free Gemini scans/day

    // Platform Detection Helpers
    const isAndroid = () => /Android/i.test(navigator.userAgent)
    const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream

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
            // Pass the scan type choice (if any) to the parent
            onImageSelected(imageData, null) // scanType removed - always null now
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

    // Samsung Galaxy devices have issues with capture="environment" silently failing
    // Detect Samsung devices to conditionally omit the capture attribute
    const isSamsungDevice = () => {
        const ua = navigator.userAgent.toLowerCase();
        return ua.includes('samsung') || ua.includes('sm-') || ua.includes('galaxy');
    }

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
            // PLATFORM-SPECIFIC CAMERA HANDLING:
            // - Android: Show dual-button modal (Take Photo / Upload) due to Chrome 14/15 bug
            // - iOS: Use native camera app via file input with capture attribute
            // - Desktop: getUserMedia for live camera preview
            proceedToCamera()
        } else {
            onShowPaywall()
        }
    }

    // Handle camera opening after scan type is chosen (or directly if no choice needed)
    const proceedToCamera = () => {
        if (isAndroid()) {
            // Android: Show dual-button picker modal
            setShowAndroidPhotoModal(true)
        } else if (isIOS()) {
            // iOS: Open native Camera app directly (not our custom camera view)
            document.getElementById('androidCameraInput')?.click()
        } else {
            // Desktop: Use getUserMedia for live camera preview
            startCamera()
        }
    }

    // Android-specific handlers for dual-button modal
    const handleAndroidTakePhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        // Directly click camera input with capture attribute (forces native camera)
        document.getElementById('androidCameraInput')?.click()
    }

    const handleAndroidUploadPhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        // Click gallery input without capture attribute
        document.getElementById('androidGalleryInput')?.click()
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

            {/* Visually Hidden Inputs - Android needs separate camera vs gallery inputs
                Using visibility technique instead of display:none for Android compatibility */}
            {/* Android Camera Input - with capture attribute to force native camera */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                id="androidCameraInput"
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            {/* Android Gallery Input - no capture, opens gallery picker */}
            <input
                type="file"
                accept="image/*"
                id="androidGalleryInput"
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            {/* Fallback input for iOS/desktop when getUserMedia fails */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Header with Logo and Profile */}
            <div className="w-full flex items-center justify-between px-4 mb-6">
                {/* Empty spacer for centering */}
                <div className="w-10" />

                {/* Logo - centered */}
                <img
                    src="/logo.svg"
                    alt="FitRate"
                    className="h-12"
                    style={{
                        filter: 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))'
                    }}
                />

                {/* Profile/Settings Icon */}
                <button
                    onClick={() => { playSound('click'); vibrate(10); onShowRestore?.(); }}
                    aria-label="Settings and Restore Purchase"
                    className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-white/60 text-lg">⚙️</span>
                </button>
            </div>

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
                    <div className="flex flex-col items-center justify-center gap-6 py-8">
                        {/* Out of Scans Message */}
                        <div className="text-center">
                            <span className="text-5xl mb-3 block">⏳</span>
                            <h2 className="text-white text-xl font-bold mb-1">Out of Scans</h2>
                            <p className="text-white/50 text-sm">
                                {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Resets at midnight'}
                            </p>
                        </div>

                        {/* Primary CTA: Go Pro */}
                        <button
                            onClick={() => { playSound('click'); vibrate(20); onShowPaywall(); }}
                            className="px-8 py-4 rounded-full font-bold text-lg transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                color: '#000',
                                boxShadow: '0 4px 20px rgba(255,215,0,0.4)'
                            }}
                        >
                            👑 Go Pro — Unlimited
                        </button>

                        {/* Alternative Actions */}
                        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                            <p className="text-white/40 text-xs uppercase tracking-wide">or keep playing</p>

                            {/* Fashion Show - Free! */}
                            {onStartFashionShow && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(15); onStartFashionShow(); }}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all active:scale-95"
                                    style={{
                                        background: 'rgba(139,92,246,0.2)',
                                        border: '1px solid rgba(139,92,246,0.3)'
                                    }}
                                >
                                    <span>🎭</span>
                                    <span className="text-purple-300 font-medium">Fashion Show with Friends</span>
                                    <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">FREE</span>
                                </button>
                            )}

                            {/* Leaderboard */}
                            {currentEvent && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(10); onShowLeaderboard(); }}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all active:scale-95"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <span>🏆</span>
                                    <span className="text-white/70 font-medium">View Leaderboard</span>
                                </button>
                            )}
                        </div>

                        {/* Escape Hatch */}
                        <p className="text-white/30 text-xs">or wait for daily reset</p>
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


            {/* Mode Selectors - Nice/Roast + More for Pro */}
            <div className="mt-6 mb-4 flex flex-col gap-2 p-2 rounded-2xl" style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div className={`grid gap-2 ${isPro ? 'grid-cols-3' : 'grid-cols-2'}`}>
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

                    {/* More (Pro only) */}
                    {isPro && (
                        <button
                            onClick={() => { playSound('click'); vibrate(15); setShowModeDrawer(true); }}
                            aria-label="Open more Pro modes"
                            className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 active:scale-[0.97] ${!['nice', 'roast'].includes(mode) ? 'opacity-100' : 'opacity-60'}`}
                            style={{
                                background: !['nice', 'roast'].includes(mode) ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.05)',
                                border: !['nice', 'roast'].includes(mode) ? '1px solid #ffd700' : '1px solid transparent'
                            }}
                        >
                            <span className="text-base" aria-hidden="true">⚡</span>
                            <span className={`text-sm font-medium ${!['nice', 'roast'].includes(mode) ? 'text-yellow-400' : 'text-gray-400'}`}>
                                {!['nice', 'roast'].includes(mode) ? mode.charAt(0).toUpperCase() + mode.slice(1) : 'More'}
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* Scans Remaining + Pro Badge + Streak */}
            <div className="mb-6 flex flex-col items-center gap-3">
                <div className="flex items-center justify-center gap-3">
                    {!isPro && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {scansRemaining > 0 ? (
                                <span className="text-xs font-medium text-cyan-400">✨ {scansRemaining} Free scan{scansRemaining > 1 ? 's' : ''} left</span>
                            ) : (
                                <span className="text-xs font-medium text-white/40">No scans left</span>
                            )}
                        </div>
                    )}
                    {isPro && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                            background: 'rgba(0,255,136,0.15)',
                            color: '#00ff88',
                            border: '1px solid rgba(0,255,136,0.3)'
                        }}>⚡ PRO</span>
                    )}
                </div>

                {/* Streak - simplified to inline badge */}
                {dailyStreak > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1" style={{
                        background: 'rgba(255,136,0,0.15)',
                        color: '#ff8800',
                        border: '1px solid rgba(255,136,0,0.3)'
                    }}>
                        🔥 {dailyStreak}
                    </span>
                )}
            </div>

            {/* Weekly Challenge - simplified to minimal pill */}
            {currentEvent && (
                <button
                    onClick={() => {
                        vibrate(15); playSound('click');
                        if (!hasSeenEventExplainer) {
                            onShowEventExplainer();
                            return;
                        }
                        if (isPro || !freeEventEntryUsed) {
                            setEventMode(!eventMode);
                        } else {
                            onShowPaywall();
                        }
                    }}
                    aria-label={`${currentEvent.theme} weekly challenge`}
                    className={`mt-4 px-4 py-2 rounded-full flex items-center gap-2 transition-all active:scale-[0.98] ${eventMode ? 'ring-2 ring-emerald-400' : ''}`}
                    style={{
                        background: eventMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: eventMode ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-base">{currentEvent.themeEmoji}</span>
                    <span className="text-sm font-medium text-white/80">{currentEvent.theme}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${eventMode ? 'bg-emerald-500/30 text-emerald-300' : 'bg-white/10 text-white/50'}`}>
                        {eventMode ? '✓' : isPro || !freeEventEntryUsed ? '→' : '🔒'}
                    </span>
                </button>
            )}

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

            {/* Android Photo Picker Modal - dual buttons for camera vs gallery */}
            {showAndroidPhotoModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{ background: 'rgba(0,0,0,0.8)' }}
                    onClick={() => setShowAndroidPhotoModal(false)}
                >
                    <div
                        className="w-full max-w-md p-6 pb-10 rounded-t-3xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,40,0.98) 0%, rgba(20,20,28,0.99) 100%)',
                            boxShadow: '0 -4px 30px rgba(0,0,0,0.5)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
                        <h3 className="text-white text-lg font-bold text-center mb-6">
                            Choose Photo Source
                        </h3>
                        <div className="flex flex-col gap-3">
                            {/* Take Photo Button */}
                            <button
                                onClick={handleAndroidTakePhoto}
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                    color: '#000',
                                    boxShadow: '0 4px 20px rgba(0,212,255,0.3)'
                                }}
                            >
                                <span className="text-2xl">📷</span>
                                Take Photo
                            </button>
                            {/* Upload Photo Button */}
                            <button
                                onClick={handleAndroidUploadPhoto}
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                <span className="text-2xl">🖼️</span>
                                Upload Photo
                            </button>
                            {/* Cancel Button */}
                            <button
                                onClick={() => setShowAndroidPhotoModal(false)}
                                className="w-full py-3 text-white/50 text-sm font-medium mt-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pro Mode Drawer */}
            {showModeDrawer && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{ background: 'rgba(0,0,0,0.8)' }}
                    onClick={() => setShowModeDrawer(false)}
                >
                    <div
                        className="w-full max-w-md p-6 pb-10 rounded-t-3xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,40,0.98) 0%, rgba(20,20,28,0.99) 100%)',
                            boxShadow: '0 -4px 30px rgba(0,0,0,0.5)'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
                        <h3 className="text-white text-lg font-bold text-center mb-4">
                            Choose Your Mode
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Honest */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('honest'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all active:scale-95 ${mode === 'honest' ? 'ring-2 ring-blue-400' : ''}`}
                                style={{ background: 'rgba(74,144,217,0.2)' }}
                            >
                                <span className="text-2xl">📊</span>
                                <span className="text-xs font-medium text-white/80">Honest</span>
                            </button>
                            {/* Savage */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('savage'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all active:scale-95 ${mode === 'savage' ? 'ring-2 ring-purple-400' : ''}`}
                                style={{ background: 'rgba(139,0,255,0.2)' }}
                            >
                                <span className="text-2xl">💀</span>
                                <span className="text-xs font-medium text-white/80">Savage</span>
                            </button>
                            {/* Rizz */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('rizz'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all active:scale-95 ${mode === 'rizz' ? 'ring-2 ring-pink-400' : ''}`}
                                style={{ background: 'rgba(255,105,180,0.2)' }}
                            >
                                <span className="text-2xl">😏</span>
                                <span className="text-xs font-medium text-white/80">Rizz</span>
                            </button>
                            {/* Celeb */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('celeb'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all active:scale-95 ${mode === 'celeb' ? 'ring-2 ring-yellow-400' : ''}`}
                                style={{ background: 'rgba(255,215,0,0.2)' }}
                            >
                                <span className="text-2xl">🎭</span>
                                <span className="text-xs font-medium text-white/80">Celeb</span>
                            </button>
                            {/* Aura */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('aura'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all active:scale-95 ${mode === 'aura' ? 'ring-2 ring-purple-400' : ''}`}
                                style={{ background: 'rgba(155,89,182,0.2)' }}
                            >
                                <span className="text-2xl">🔮</span>
                                <span className="text-xs font-medium text-white/80">Aura</span>
                            </button>
                            {/* Chaos */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('chaos'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-4 rounded-xl transition-all active:scale-95 ${mode === 'chaos' ? 'ring-2 ring-red-400' : ''}`}
                                style={{ background: 'rgba(255,107,107,0.2)' }}
                            >
                                <span className="text-2xl">🎪</span>
                                <span className="text-xs font-medium text-white/80">Chaos</span>
                            </button>
                        </div>
                        <p className="text-center text-white/40 text-xs mt-4">Nice & Roast always available above</p>
                        <button
                            onClick={() => setShowModeDrawer(false)}
                            className="w-full py-3 text-white/50 text-sm font-medium mt-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div >
    )
}
