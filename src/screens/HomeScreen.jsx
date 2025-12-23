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
    onShowRestore,          // Show restore Pro modal
    onError,
    onStartFashionShow,     // Start Fashion Show flow
    onShowWeeklyChallenge,  // Navigate to Weekly Challenge page
    pendingFashionShowWalk, // Auto-trigger camera for Fashion Show walk
    onClearPendingWalk,     // Clear the pending walk flag
    fashionShowName,        // Name of current Fashion Show (for display)
    activeShows = [],       // User's active Fashion Shows
    onNavigateToShow        // Navigate to a specific Fashion Show
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

    // One-time discoverability nudge for Nice/Roast toggle
    const [hasSeenNudge] = useState(() => localStorage.getItem('fitrate_seen_mode_nudge') === 'true')
    const [showNudge, setShowNudge] = useState(!hasSeenNudge)
    const [nudgePhase, setNudgePhase] = useState(0) // 0=pulse, 1=crossfade to nice, 2=crossfade back

    // Run one-time nudge animation on first load
    useEffect(() => {
        if (!showNudge) return

        // Phase 1: Show Nice for 400ms
        const t1 = setTimeout(() => setNudgePhase(1), 400)
        // Phase 2: Back to Roast at 800ms
        const t2 = setTimeout(() => setNudgePhase(2), 800)
        // Phase 3: End nudge at 1200ms
        const t3 = setTimeout(() => {
            localStorage.setItem('fitrate_seen_mode_nudge', 'true')
            setShowNudge(false)
            setNudgePhase(0)
        }, 1200)

        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [showNudge])

    // Platform Detection Helpers
    const isAndroid = () => /Android/i.test(navigator.userAgent)
    const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream

    // Auto-trigger camera when walking Fashion Show runway
    useEffect(() => {
        if (pendingFashionShowWalk) {
            console.log('[FashionShow] Auto-triggering camera for walk')
            onClearPendingWalk?.()
            // Small delay to let component mount
            setTimeout(() => {
                if (isAndroid()) {
                    setShowAndroidPhotoModal(true)
                } else if (isIOS()) {
                    document.getElementById('androidCameraInput')?.click()
                } else {
                    startCamera()
                }
            }, 300)
        }
    }, [pendingFashionShowWalk])

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

    // iOS Safari: Restart camera when returning from background
    // Camera stream can die silently when app is backgrounded
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && view === 'camera' && cameraStream) {
                // Check if stream is still active
                const tracks = cameraStream.getTracks()
                const isActive = tracks.some(track => track.readyState === 'live')
                if (!isActive) {
                    console.log('[Camera] Stream died during background - restarting')
                    startCamera(facingMode)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [view, cameraStream, startCamera, facingMode])

    const flipCamera = useCallback(() => {
        const newFacing = facingMode === 'environment' ? 'user' : 'environment'
        startCamera(newFacing)
    }, [facingMode, startCamera])

    const capturePhoto = useCallback(() => {
        // GUARD: Prevent double-capture from rapid taps
        if (isProcessing) return
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        if (video.readyState < 2) return

        setIsProcessing(true) // Lock to prevent double-tap
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
        // Note: Don't reset isProcessing - screen navigation will unmount component

    }, [facingMode, stopCamera, onImageSelected, isProcessing])

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
        // GUARD: Prevent rapid double-taps
        if (isProcessing) return

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
            background: 'linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 25%, #12091f 60%, #0a0610 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
        }}>
            {/* Background Glow - Main accent */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[600px] h-[600px] rounded-full opacity-30" style={{
                    background: `radial-gradient(circle, ${accentGlow} 0%, transparent 60%)`,
                    top: '30%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'pulse 3s ease-in-out infinite'
                }} />
                {/* Secondary glow for depth */}
                <div className="absolute w-[400px] h-[400px] rounded-full opacity-15" style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)',
                    bottom: '20%', left: '50%',
                    transform: 'translateX(-50%)'
                }} />
                {/* Sparkle particles */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.4) 0%, transparent 100%),
                                      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.3) 0%, transparent 100%),
                                      radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.5) 0%, transparent 100%),
                                      radial-gradient(2px 2px at 130px 90px, rgba(255,255,255,0.2) 0%, transparent 100%),
                                      radial-gradient(1px 1px at 160px 20px, rgba(255,255,255,0.4) 0%, transparent 100%)`,
                    backgroundSize: '200px 150px',
                    animation: 'sparkle 4s ease-in-out infinite'
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

            {/* Fashion Show Walk Context Banner */}
            {fashionShowName && (
                <div className="w-full max-w-sm p-4 rounded-2xl text-center mb-4" style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(168,85,247,0.15) 100%)',
                    border: '1px solid rgba(139,92,246,0.4)'
                }}>
                    <p className="text-lg font-bold text-white mb-1">🎭 Walking in "{fashionShowName}"</p>
                    <p className="text-xs text-purple-300/70">
                        Take a photo to submit your fit!
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
                ) : (() => {
                    // Compute visual mode based on nudge animation
                    const visualMode = showNudge && nudgePhase === 1 ? 'nice' : mode
                    const isRoast = visualMode === 'roast'

                    // EVENT MODE: Special styling when competing in Weekly Challenge
                    const isCompeting = eventMode && currentEvent;

                    // Choose colors based on mode
                    let buttonAccent, buttonAccentEnd, buttonGlow, innerGradient;
                    if (isCompeting) {
                        // Teal/emerald for competition mode
                        buttonAccent = '#10b981';
                        buttonAccentEnd = '#0d9488';
                        buttonGlow = 'rgba(16,185,129,0.5)';
                        innerGradient = 'linear-gradient(135deg, #10b981 0%, #0d9488 50%, #047857 100%)';
                    } else if (isRoast) {
                        buttonAccent = '#ff6b35';
                        buttonAccentEnd = '#ff4444';
                        buttonGlow = 'rgba(255,68,68,0.4)';
                        innerGradient = 'linear-gradient(135deg, #ff6b35 0%, #ff4444 50%, #cc2200 100%)';
                    } else {
                        buttonAccent = '#00d4ff';
                        buttonAccentEnd = '#00a8cc';
                        buttonGlow = 'rgba(0,212,255,0.4)';
                        innerGradient = 'linear-gradient(135deg, #00d4ff 0%, #00a8cc 50%, #0077aa 100%)';
                    }

                    return (
                        <div className="flex flex-col items-center">
                            {/* Main Circular Button */}
                            <button
                                onClick={handleStart}
                                aria-label={isCompeting ? `Submit to ${currentEvent.theme}` : `Take a photo to ${isRoast ? 'roast' : 'rate'} your outfit`}
                                className="btn-physical relative w-72 h-72 rounded-full flex flex-col items-center justify-center group"
                                style={{
                                    background: `radial-gradient(circle, ${isCompeting ? 'rgba(16,185,129,0.4)' : isRoast ? 'rgba(255,100,50,0.4)' : 'rgba(0,212,255,0.3)'} 0%, transparent 65%)`,
                                    border: `4px solid ${isCompeting ? 'rgba(45,212,191,0.6)' : isRoast ? 'rgba(255,100,50,0.5)' : 'rgba(0,212,255,0.4)'}`,
                                    boxShadow: `
                                        var(--shadow-physical), 
                                        0 0 60px ${buttonGlow}, 
                                        0 0 120px ${isCompeting ? 'rgba(16,185,129,0.3)' : isRoast ? 'rgba(255,68,68,0.3)' : 'rgba(0,212,255,0.3)'}, 
                                        inset 0 0 60px rgba(255,255,255,0.05)
                                    `,
                                    animation: isCompeting ? 'tealPulse 2s ease-in-out infinite' : undefined
                                }}
                            >
                                {/* Animated sparkles for competition mode */}
                                {isCompeting && (
                                    <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
                                        <div className="absolute" style={{ top: '10%', left: '20%', animation: 'sparkle 1.5s ease-in-out infinite', fontSize: '1.5rem' }}>✨</div>
                                        <div className="absolute" style={{ top: '15%', right: '15%', animation: 'sparkle 2s ease-in-out infinite 0.3s', fontSize: '1.2rem' }}>⭐</div>
                                        <div className="absolute" style={{ bottom: '15%', left: '15%', animation: 'sparkleFloat 2.5s ease-in-out infinite 0.5s', fontSize: '1.2rem' }}>⭐</div>
                                        <div className="absolute" style={{ bottom: '20%', right: '20%', animation: 'sparkle 1.8s ease-in-out infinite 0.8s', fontSize: '1.5rem' }}>✨</div>
                                    </div>
                                )}

                                {/* Inner gradient circle - more vibrant */}
                                <div
                                    className="absolute inset-4 rounded-full transition-all duration-500 group-hover:scale-[1.02] group-active:scale-95"
                                    style={{
                                        background: innerGradient,
                                        boxShadow: `0 0 80px ${buttonGlow}, 0 0 40px ${buttonGlow}`,
                                        animation: 'pulse 2s ease-in-out infinite'
                                    }}
                                    aria-hidden="true"
                                />

                                {/* Emoji */}
                                <span className="relative text-7xl mb-2 drop-shadow-2xl transition-all duration-300" aria-hidden="true">
                                    {isCompeting ? '🏆' : isRoast ? '🔥' : '😇'}
                                </span>

                                {/* Main Text */}
                                <span className="relative text-white font-black text-2xl tracking-wide uppercase text-center transition-all duration-300">
                                    {isCompeting ? (currentEvent.theme || 'COMPETE') : isRoast ? 'ROAST MY FIT' : 'RATE MY FIT'}
                                </span>

                                {/* Subtitle */}
                                <span className="relative text-white/50 text-sm font-medium mt-1 transition-all duration-300">
                                    {isCompeting ? 'Tap to enter competition!' : isRoast ? 'Brutally honest AI' : 'Supportive AI feedback'}
                                </span>

                                {/* Mode Toggle or Exit Competition */}
                                {isCompeting ? (
                                    <div
                                        className="relative mt-4 px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all duration-300"
                                        style={{
                                            background: 'rgba(0,0,0,0.5)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(45,212,191,0.4)'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            playSound('click')
                                            vibrate(15)
                                            setEventMode(false)
                                        }}
                                    >
                                        <span className="text-teal-400 font-semibold text-sm">Exit Competition Mode</span>
                                    </div>
                                ) : (
                                    <div
                                        className={`relative mt-4 px-6 py-2 rounded-full flex items-center gap-2 cursor-pointer transition-all duration-300 ${showNudge ? 'animate-pulse' : ''}`}
                                        style={{
                                            background: 'rgba(0,0,0,0.4)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            playSound('click')
                                            vibrate(15)
                                            setMode(mode === 'roast' ? 'nice' : 'roast')
                                            setEventMode(false)
                                            // Clear nudge on interaction
                                            if (showNudge) {
                                                localStorage.setItem('fitrate_seen_mode_nudge', 'true')
                                                setShowNudge(false)
                                            }
                                        }}
                                    >
                                        <span className="text-lg">{mode === 'roast' ? '😇' : '🔥'}</span>
                                        <span className="text-lg">{mode === 'roast' ? '🔥' : '😇'}</span>
                                        <span className="text-white font-semibold">{mode === 'roast' ? 'Roast' : 'Nice'}</span>
                                    </div>
                                )}
                            </button>
                        </div>
                    )
                })()}
            </div>


            {/* Status Pill - Directly below the main button */}
            <div
                className="mt-6 mb-6 px-5 py-2.5 rounded-full"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.03)'
                }}
            >
                <p className="text-center text-white/60 text-sm">
                    {isPro ? '⚡ Unlimited scans' : `✨ ${scansRemaining} scan${scansRemaining !== 1 ? 's' : ''} left today`}
                    {dailyStreak > 0 && <span className="ml-2">• 🔥 {dailyStreak}-day streak</span>}
                </p>
            </div>

            {/* My Shows Section - Active Fashion Shows */}
            {activeShows.length > 0 && (
                <div className="w-full max-w-sm mb-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🎭</span>
                            <span className="text-white/60 text-sm font-semibold">My Shows</span>
                            <span className="text-white/30 text-xs">({activeShows.length})</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {activeShows.map((show) => (
                            <button
                                key={show.showId}
                                onClick={() => {
                                    playSound('click')
                                    vibrate(15)
                                    onNavigateToShow?.(show.showId)
                                }}
                                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(168,85,247,0.1) 100%)',
                                    border: '1px solid rgba(139,92,246,0.25)'
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🎭</span>
                                    <div className="text-left">
                                        <p className="text-white font-semibold text-sm">{show.name}</p>
                                        <p className="text-purple-300/60 text-[10px]">Tap to rejoin</p>
                                    </div>
                                </div>
                                <span className="text-purple-400 text-lg">→</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Event Destination Cards - Side by side */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                {/* Fashion Show - Purple gradient with animated sparkles */}
                {onStartFashionShow && (
                    <button
                        onClick={() => { playSound('click'); vibrate(15); onStartFashionShow(); }}
                        className="relative overflow-hidden rounded-2xl p-4 transition-all active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #4c1d95 100%)',
                            border: '2px solid rgba(167,139,250,0.5)',
                            boxShadow: '0 4px 20px rgba(139,92,246,0.4), 0 0 40px rgba(167,139,250,0.2)'
                        }}
                    >
                        {/* Animated sparkle overlay */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute" style={{ top: '12%', left: '15%', animation: 'sparkle 1.8s ease-in-out infinite' }}>✨</div>
                            <div className="absolute" style={{ top: '30%', right: '20%', animation: 'sparkle 2.2s ease-in-out infinite 0.4s' }}>💜</div>
                            <div className="absolute" style={{ bottom: '25%', left: '25%', animation: 'sparkleFloat 2.5s ease-in-out infinite 0.2s' }}>✨</div>
                        </div>
                        <span className="relative text-4xl block mb-2 drop-shadow-lg">🎭</span>
                        <span className="relative text-white font-bold block">Fashion Show</span>
                        <span className="relative text-purple-200/70 text-xs">Compete with friends</span>
                    </button>
                )}

                {/* Weekly Challenge - Large teal gradient with animated sparkles */}
                {currentEvent && (
                    <button
                        onClick={() => {
                            playSound('click');
                            vibrate(15);
                            // Set event mode so the hero button transforms for competition
                            setEventMode(true);
                        }}
                        className="relative overflow-hidden rounded-2xl p-4 transition-all active:scale-[0.98]"
                        style={{
                            background: eventMode
                                ? 'linear-gradient(135deg, #10b981 0%, #34d399 40%, #0d9488 70%, #047857 100%)'
                                : 'linear-gradient(135deg, #047857 0%, #10b981 40%, #0d9488 70%, #115e59 100%)',
                            border: eventMode ? '3px solid rgba(52,211,153,0.8)' : '2px solid rgba(45,212,191,0.5)',
                            boxShadow: eventMode
                                ? '0 4px 30px rgba(16,185,129,0.6), 0 0 60px rgba(45,212,191,0.4)'
                                : '0 4px 20px rgba(16,185,129,0.4), 0 0 40px rgba(45,212,191,0.2)',
                            animation: 'tealPulse 2s ease-in-out infinite'
                        }}
                    >
                        {/* Active indicator */}
                        {eventMode && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                                ACTIVE
                            </div>
                        )}
                        {/* Animated sparkle overlay */}
                        <div className="absolute inset-0 overflow-hidden">
                            {/* Sparkle dots */}
                            <div className="absolute" style={{ top: '15%', left: '20%', animation: 'sparkle 1.5s ease-in-out infinite' }}>✨</div>
                            <div className="absolute" style={{ top: '25%', right: '15%', animation: 'sparkle 2s ease-in-out infinite 0.3s' }}>⭐</div>
                            <div className="absolute" style={{ bottom: '20%', left: '30%', animation: 'sparkle 1.8s ease-in-out infinite 0.6s' }}>✨</div>
                            <div className="absolute" style={{ top: '60%', right: '25%', animation: 'sparkleFloat 2.5s ease-in-out infinite' }}>⭐</div>
                        </div>
                        {/* Gold shimmer line */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl">
                            <div className="absolute top-0 left-0 w-full h-full" style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)',
                                transform: 'translateX(-100%)',
                                animation: 'shimmer 3s infinite'
                            }} />
                        </div>
                        <span className="relative text-4xl block mb-2 drop-shadow-lg">🏆</span>
                        <span className="relative text-white font-bold block text-lg">{currentEvent.theme || 'Weekly Challenge'}</span>
                        <span className="relative text-teal-100/80 text-xs">{eventMode ? 'Now competing!' : 'Tap to compete!'}</span>
                    </button>
                )}
            </div>

            {/* Advanced AI Modes Section */}
            <button
                onClick={() => {
                    playSound('click'); vibrate(15);
                    if (isPro) {
                        setShowModeDrawer(true);
                    } else {
                        onShowPaywall();
                    }
                }}
                className="w-full max-w-sm p-4 rounded-2xl transition-all active:scale-[0.99] mb-4"
                style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px dashed rgba(255,255,255,0.15)'
                }}
            >
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-lg">⚡</span>
                    <span className="text-white/80 font-semibold">Advanced AI Modes</span>
                    <span className="text-white/40">(6)</span>
                    {!isPro && <span className="text-sm">🔒</span>}
                </div>
                <p className="text-white/40 text-xs text-center">
                    Honest • Savage • Rizz • Celebrity • Aura • Chaos
                </p>
            </button>

            {/* Pro CTA Button - Yellow, rounded, premium with pulsing glow */}
            {!isPro && (
                <button
                    onClick={() => { playSound('click'); vibrate(20); onShowPaywall(); }}
                    className="px-10 py-4 rounded-full font-bold text-lg transition-all active:scale-95"
                    style={{
                        background: 'linear-gradient(135deg, #ffd700 0%, #ffb800 50%, #ff9500 100%)',
                        color: '#000',
                        boxShadow: '0 4px 30px rgba(255,215,0,0.4), 0 0 60px rgba(255,180,0,0.2)',
                        animation: 'pulseGlow 2s ease-in-out infinite'
                    }}
                >
                    👑 Get More Scans
                </button>
            )}

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
            )
            }

            {/* Pro Mode Drawer */}
            {
                showModeDrawer && (
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
                )
            }
        </div >
    )
}
