import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'
import { formatTimeRemaining } from '../utils/dateUtils'
import { LIMITS } from '../config/constants'

// ============================================
// PREMIUM FLOATING PARTICLES
// ============================================
const FloatingParticles = ({ accentColor }) => {
    const particles = useMemo(() =>
        Array.from({ length: 25 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 3,
            delay: Math.random() * 15,
            duration: 15 + Math.random() * 20,
            opacity: 0.15 + Math.random() * 0.25,
            drift: -30 + Math.random() * 60,
            color: i % 4 === 0 ? accentColor : i % 3 === 0 ? '#8b5cf6' : '#fff'
        })), [accentColor]
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.left}%`,
                        bottom: '-10px',
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        opacity: p.opacity,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}
        </div>
    )
}

// Daily Challenge: Rotating mode based on day of year (12 modes)
const DAILY_MODES = [
    { id: 'nice', emoji: '😇', label: 'Nice' },
    { id: 'roast', emoji: '🔥', label: 'Roast' },
    { id: 'honest', emoji: '📊', label: 'Honest' },
    { id: 'savage', emoji: '💀', label: 'Savage' },
    { id: 'rizz', emoji: '😏', label: 'Rizz' },
    { id: 'celeb', emoji: '⭐', label: 'Celebrity' },
    { id: 'aura', emoji: '🔮', label: 'Aura' },
    { id: 'chaos', emoji: '🎪', label: 'Chaos' },
    { id: 'y2k', emoji: '💎', label: 'Y2K' },
    { id: 'villain', emoji: '🖤', label: 'Villain' },
    { id: 'coquette', emoji: '🎀', label: 'Coquette' },
    { id: 'hypebeast', emoji: '👟', label: 'Hypebeast' }
]

const getDailyMode = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    return DAILY_MODES[dayOfYear % DAILY_MODES.length]
}

export default function HomeScreen({
    mode,
    setMode,
    isPro,
    scansRemaining,
    // proPreviewAvailable removed - now just 2 free Gemini scans/day
    dailyStreak,
    currentEvent,
    eventMode,
    dailyChallengeMode,  // Daily challenge mode flag
    setDailyChallengeMode,  // Setter for daily challenge mode
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
    onShowRules,
    onShowRestore,          // Show restore Pro modal
    onError,
    onStartFashionShow,     // Start Fashion Show flow
    onShowWeeklyChallenge,  // Navigate to Weekly Challenge page
    pendingFashionShowWalk, // Auto-trigger camera for Fashion Show walk
    onClearPendingWalk,     // Clear the pending walk flag
    fashionShowName,        // Name of current Fashion Show (for display)
    fashionShowVibe,        // Vibe/mode of current Fashion Show
    fashionShowVibeLabel,   // Human-readable vibe label
    activeShows = [],       // User's active Fashion Shows
    onNavigateToShow,       // Navigate to a specific Fashion Show
    onRemoveShow,           // Remove a show from the list
    activeBattles = [],     // User's active 1v1 Battles
    onNavigateToBattle,     // Navigate to a specific Battle
    onRemoveBattle,         // Remove a battle from the list
    onNavigate,             // General navigation callback (for judges, etc.)
    onOpenArena             // Open Global Arena entry screen
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
                    // iOS/iPad: Use gallery input (shows native picker with camera + gallery)
                    document.getElementById('androidGalleryInput')?.click()
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
        const colors = {
            nice: '#00ff88',
            roast: '#ff6b35',
            honest: '#3b82f6',
            savage: '#ff1493',
            rizz: '#ff69b4',
            celeb: '#ffd700',
            aura: '#9b59b6',
            chaos: '#ff4444',
            y2k: '#00CED1',
            villain: '#4c1d95',
            coquette: '#ffb6c1',
            hypebeast: '#f97316'
        }
        return colors[mode] || '#00d4ff'
    }
    const getModeGlow = () => {
        const glows = {
            nice: 'rgba(0,255,136,0.4)',
            roast: 'rgba(255,107,53,0.4)',
            honest: 'rgba(59,130,246,0.4)',
            savage: 'rgba(255,20,147,0.4)',
            rizz: 'rgba(255,105,180,0.4)',
            celeb: 'rgba(255,215,0,0.4)',
            aura: 'rgba(155,89,182,0.4)',
            chaos: 'rgba(255,68,68,0.4)',
            y2k: 'rgba(0,206,209,0.4)',
            villain: 'rgba(76,29,149,0.4)',
            coquette: 'rgba(255,182,193,0.4)',
            hypebeast: 'rgba(249,115,22,0.4)'
        }
        return glows[mode] || 'rgba(0,212,255,0.4)'
    }

    // Get emoji for current mode
    const getModeEmoji = () => {
        switch (mode) {
            case 'nice': return '😇'
            case 'roast': return '🔥'
            case 'honest': return '📊'
            case 'savage': return '💀'
            case 'rizz': return '😏'
            case 'celeb': return '⭐'
            case 'aura': return '🔮'
            case 'chaos': return '🎪'
            case 'y2k': return '💎'
            case 'villain': return '🖤'
            case 'coquette': return '🎀'
            case 'hypebeast': return '👟'
            default: return '🔥'
        }
    }

    // Get display name for current mode
    const getModeDisplayName = () => {
        switch (mode) {
            case 'nice': return 'Nice'
            case 'roast': return 'Roast'
            case 'honest': return 'Honest'
            case 'savage': return 'Savage'
            case 'rizz': return 'Rizz'
            case 'celeb': return 'Celebrity'
            case 'aura': return 'Aura'
            case 'chaos': return 'Chaos'
            case 'y2k': return 'Y2K'
            case 'villain': return 'Villain'
            case 'coquette': return 'Coquette'
            case 'hypebeast': return 'Hypebeast'
            default: return 'Roast'
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

        // GUARD: Block free users in event mode who've used their weekly entry
        if (eventMode && !isPro && freeEventEntryUsed) {
            // Exit event mode and show paywall with context
            setEventMode(false)
            onShowPaywall()
            return
        }

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
            // Android: Show photo picker modal (Take Photo vs Upload)
            setShowAndroidPhotoModal(true)
        } else if (isIOS()) {
            // iOS: Use gallery input (no capture attr) - shows native picker with BOTH camera and gallery options!
            document.getElementById('androidGalleryInput')?.click()
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
            // Account for fixed BottomNav (64px) + safe area + extra breathing room
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
        }}>
            {/* Background Glow - Main accent with premium breathing effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Primary glow orb */}
                <div className="absolute w-[600px] h-[600px] rounded-full" style={{
                    background: `radial-gradient(circle, ${accentGlow} 0%, transparent 60%)`,
                    top: '30%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 4s ease-in-out infinite',
                    opacity: 0.35,
                    '--glow-color': accentGlow
                }} />
                {/* Secondary glow for depth */}
                <div className="absolute w-[400px] h-[400px] rounded-full" style={{
                    background: 'radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)',
                    bottom: '20%', left: '50%',
                    transform: 'translateX(-50%)',
                    animation: 'glow-breathe 5s ease-in-out infinite 1s',
                    opacity: 0.2
                }} />
                {/* Tertiary accent glow */}
                <div className="absolute w-[300px] h-[300px] rounded-full" style={{
                    background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)`,
                    top: '60%', right: '-10%',
                    animation: 'float-gentle 6s ease-in-out infinite',
                    opacity: 0.25
                }} />
                {/* Sparkle particles layer */}
                <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(2px 2px at 20px 30px, rgba(255,255,255,0.5) 0%, transparent 100%),
                                      radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.4) 0%, transparent 100%),
                                      radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.6) 0%, transparent 100%),
                                      radial-gradient(2px 2px at 130px 90px, rgba(255,255,255,0.3) 0%, transparent 100%),
                                      radial-gradient(1px 1px at 160px 20px, rgba(255,255,255,0.5) 0%, transparent 100%),
                                      radial-gradient(1.5px 1.5px at 180px 100px, ${accent}80 0%, transparent 100%)`,
                    backgroundSize: '200px 150px',
                    animation: 'particle-twinkle 3s ease-in-out infinite'
                }} />

                {/* Premium floating particles */}
                <FloatingParticles accentColor={accent} />
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
            <div className="w-full flex items-center justify-between px-4 mb-2">
                {/* Streak Badge - Left side */}
                <div
                    className="relative w-10 h-10 flex items-center justify-center rounded-full cursor-pointer transition-all active:scale-90"
                    style={{
                        background: dailyStreak?.current > 0
                            ? 'rgba(255,107,0,0.15)'
                            : 'rgba(255,255,255,0.05)',
                        border: dailyStreak?.current > 0
                            ? '1px solid rgba(255,107,0,0.3)'
                            : '1px solid rgba(255,255,255,0.1)',
                        boxShadow: dailyStreak?.current >= 7
                            ? '0 0 15px rgba(255,107,0,0.4)'
                            : 'none'
                    }}
                    onClick={() => {
                        vibrate(10);
                        const msg = dailyStreak?.current > 0
                            ? dailyStreak.message || `${dailyStreak.current} day streak! 🔥`
                            : 'Start your streak today! 💪';
                        showToast?.(msg);
                    }}
                    title={dailyStreak?.current > 0 ? `${dailyStreak.current} day streak` : 'No active streak'}
                >
                    <span className="text-lg" style={{
                        filter: dailyStreak?.current >= 7 ? 'drop-shadow(0 0 4px rgba(255,107,0,0.8))' : 'none'
                    }}>
                        {dailyStreak?.current >= 30 ? '🏆' :
                            dailyStreak?.current >= 14 ? '👑' :
                                dailyStreak?.current >= 7 ? '✨' :
                                    dailyStreak?.current >= 3 ? '🔥' :
                                        dailyStreak?.current >= 1 ? '🔥' : '💤'}
                    </span>
                    {dailyStreak?.current > 0 && (
                        <span
                            className="absolute -bottom-1 -right-1 text-[10px] font-bold rounded-full px-1.5 py-0.5"
                            style={{
                                background: 'linear-gradient(135deg, #ff6b00, #ff9500)',
                                color: '#fff',
                                minWidth: '18px',
                                textAlign: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}
                        >
                            {dailyStreak.current}
                        </span>
                    )}
                </div>

                {/* Logo - centered */}
                <img
                    src="/logo.svg"
                    alt="FitRate"
                    className="h-12"
                    style={{
                        filter: isPro || purchasedScans > 0
                            ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))'
                            : 'drop-shadow(0 0 20px rgba(0, 212, 255, 0.3))'
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

            {/* Scans Status Badge */}
            <div className="flex justify-center mb-2">
                <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full cursor-pointer transition-all active:scale-95"
                    style={{
                        background: purchasedScans > 0
                            ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,180,0,0.1) 100%)'
                            : 'rgba(0,212,255,0.08)',
                        border: purchasedScans > 0
                            ? '1px solid rgba(255,215,0,0.4)'
                            : '1px solid rgba(0,212,255,0.25)',
                    }}
                    onClick={() => { playSound('click'); vibrate(10); onShowPaywall(); }}
                >
                    <span className="text-sm">{purchasedScans > 0 ? '💎' : '⚡'}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${purchasedScans > 0 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                        {purchasedScans > 0 ? `${purchasedScans} Bonus Scans` : `${scansRemaining} Free Scans`}
                    </span>
                    <span className="text-[10px] text-white/40">+ Get More</span>
                </div>
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

            {/* Fashion Show Walk Context Banner - shows active mode */}
            {fashionShowName && (
                <div className="w-full max-w-sm p-4 rounded-2xl text-center mb-4" style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(168,85,247,0.15) 100%)',
                    border: '1px solid rgba(139,92,246,0.4)'
                }}>
                    <p className="text-lg font-bold text-white mb-1">🎭 Walking in "{fashionShowName}"</p>
                    {fashionShowVibe && (
                        <p className="text-sm text-purple-400 font-semibold mb-1">
                            ⚡ {fashionShowVibeLabel || fashionShowVibe.charAt(0).toUpperCase() + fashionShowVibe.slice(1)} Mode Active
                        </p>
                    )}
                    <p className="text-xs text-purple-300/70">
                        Take a photo to submit your fit!
                    </p>
                </div>
            )}

            {/* Daily Challenge Context Banner */}
            {dailyChallengeMode && !fashionShowName && (
                <div className="w-full max-w-sm p-4 rounded-2xl text-center mb-4" style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(139,92,246,0.15) 100%)',
                    border: '1px solid rgba(59,130,246,0.4)'
                }}>
                    <p className="text-lg font-bold text-white mb-1">⚡ Daily Challenge</p>
                    <p className="text-sm text-blue-400 font-semibold mb-1">
                        Get the highest score today!
                    </p>
                    <p className="text-xs text-blue-300/70">
                        #1 wins 5 free Pro scans 🎁
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

                        {/* Primary CTA: Get More Scans */}
                        <button
                            onClick={() => { playSound('click'); vibrate(20); onShowPaywall(); }}
                            className="px-8 py-4 rounded-full font-bold text-lg transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                color: '#000',
                                boxShadow: '0 4px 20px rgba(0,212,255,0.4)'
                            }}
                        >
                            ✨ Get More Scans
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

                            {/* Weekly Challenge */}
                            {currentEvent && onShowWeeklyChallenge && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(10); onShowWeeklyChallenge(); }}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all active:scale-95"
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                    }}
                                >
                                    <span>🏆</span>
                                    <span className="text-emerald-300 font-medium">Weekly Challenge</span>
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
                    // ENTRY BLOCKED: Free user has used their weekly entry
                    const entryBlocked = isCompeting && !isPro && freeEventEntryUsed;

                    // Pro Flow: User has Pro subscription OR purchased scans
                    const isProFlow = isPro || purchasedScans > 0;

                    // Choose colors based on mode - each of 12 modes has unique styling
                    let buttonAccent, buttonAccentEnd, buttonGlow, innerGradient;
                    if (entryBlocked) {
                        // Amber/gray for blocked state
                        buttonAccent = '#f59e0b';
                        buttonAccentEnd = '#b45309';
                        buttonGlow = 'rgba(245,158,11,0.3)';
                        innerGradient = 'linear-gradient(135deg, #78716c 0%, #57534e 50%, #44403c 100%)';
                    } else if (dailyChallengeMode) {
                        // Blue for Daily Challenge mode
                        buttonAccent = '#3b82f6';
                        buttonAccentEnd = '#1d4ed8';
                        buttonGlow = 'rgba(59,130,246,0.5)';
                        innerGradient = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)';
                    } else if (isCompeting) {
                        // Teal/emerald for competition mode
                        buttonAccent = '#10b981';
                        buttonAccentEnd = '#0d9488';
                        buttonGlow = 'rgba(16,185,129,0.5)';
                        innerGradient = 'linear-gradient(135deg, #10b981 0%, #0d9488 50%, #047857 100%)';
                    } else {
                        // Mode-specific colors for all 12 AI modes
                        switch (mode) {
                            case 'roast':
                                buttonAccent = '#ff6b35';
                                buttonAccentEnd = '#ff4444';
                                buttonGlow = 'rgba(255,68,68,0.4)';
                                innerGradient = 'linear-gradient(135deg, #ff6b35 0%, #ff4444 50%, #cc2200 100%)';
                                break;
                            case 'honest':
                                buttonAccent = '#3b82f6';
                                buttonAccentEnd = '#1d4ed8';
                                buttonGlow = 'rgba(59,130,246,0.4)';
                                innerGradient = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)';
                                break;
                            case 'savage':
                                buttonAccent = '#8b00ff';
                                buttonAccentEnd = '#6b21a8';
                                buttonGlow = 'rgba(139,0,255,0.4)';
                                innerGradient = 'linear-gradient(135deg, #8b00ff 0%, #7c3aed 50%, #6b21a8 100%)';
                                break;
                            case 'rizz':
                                buttonAccent = '#ff69b4';
                                buttonAccentEnd = '#ec4899';
                                buttonGlow = 'rgba(255,105,180,0.4)';
                                innerGradient = 'linear-gradient(135deg, #ff69b4 0%, #ec4899 50%, #db2777 100%)';
                                break;
                            case 'celeb':
                                buttonAccent = '#ffd700';
                                buttonAccentEnd = '#f59e0b';
                                buttonGlow = 'rgba(255,215,0,0.4)';
                                innerGradient = 'linear-gradient(135deg, #ffd700 0%, #f59e0b 50%, #d97706 100%)';
                                break;
                            case 'aura':
                                buttonAccent = '#9b59b6';
                                buttonAccentEnd = '#8e44ad';
                                buttonGlow = 'rgba(155,89,182,0.4)';
                                innerGradient = 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 50%, #7c3aed 100%)';
                                break;
                            case 'chaos':
                                buttonAccent = '#ff6b6b';
                                buttonAccentEnd = '#ef4444';
                                buttonGlow = 'rgba(255,107,107,0.4)';
                                innerGradient = 'linear-gradient(135deg, #ff6b6b 0%, #ef4444 50%, #dc2626 100%)';
                                break;
                            case 'y2k':
                                buttonAccent = '#ff69b4';
                                buttonAccentEnd = '#da70d6';
                                buttonGlow = 'rgba(255,105,180,0.4)';
                                innerGradient = 'linear-gradient(135deg, #ff69b4 0%, #da70d6 50%, #ba55d3 100%)';
                                break;
                            case 'villain':
                                buttonAccent = '#2d1b4e';
                                buttonAccentEnd = '#4c1d95';
                                buttonGlow = 'rgba(76,29,149,0.4)';
                                innerGradient = 'linear-gradient(135deg, #1a1a2e 0%, #2d1b4e 50%, #4c1d95 100%)';
                                break;
                            case 'coquette':
                                buttonAccent = '#ffb6c1';
                                buttonAccentEnd = '#ffc0cb';
                                buttonGlow = 'rgba(255,182,193,0.4)';
                                innerGradient = 'linear-gradient(135deg, #ffc0cb 0%, #ffb6c1 50%, #ff69b4 100%)';
                                break;
                            case 'hypebeast':
                                buttonAccent = '#f97316';
                                buttonAccentEnd = '#ea580c';
                                buttonGlow = 'rgba(249,115,22,0.4)';
                                innerGradient = 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)';
                                break;
                            case 'nice':
                            default:
                                buttonAccent = '#00d4ff';
                                buttonAccentEnd = '#00a8cc';
                                buttonGlow = 'rgba(0,212,255,0.4)';
                                innerGradient = 'linear-gradient(135deg, #00d4ff 0%, #00a8cc 50%, #0077aa 100%)';
                                break;
                        }
                    }

                    return (
                        <div className="flex flex-col items-center">
                            {/* Main Circular Button with Premium Breathing Rings */}
                            <div className="relative">
                                {/* Outer breathing ring 1 */}
                                <div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        border: `2px solid ${buttonAccent}30`,
                                        transform: 'scale(1.08)',
                                        animation: 'ring-breathe 3s ease-in-out infinite'
                                    }}
                                />
                                {/* Outer breathing ring 2 */}
                                <div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        border: `1px solid ${buttonAccent}20`,
                                        transform: 'scale(1.15)',
                                        animation: 'ring-breathe 3s ease-in-out infinite 0.5s'
                                    }}
                                />
                                {/* Outer breathing ring 3 - largest */}
                                <div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        border: `1px solid ${buttonAccent}10`,
                                        transform: 'scale(1.22)',
                                        animation: 'ring-breathe 3s ease-in-out infinite 1s'
                                    }}
                                />

                                <button
                                    id="main-scan-cta"
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
                                        animation: isCompeting ? 'tealPulse 2s ease-in-out infinite' : 'glow-breathe 4s ease-in-out infinite',
                                        '--glow-color': buttonGlow
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

                                    {/* Emoji - uses mode-specific emoji for all 12 modes */}
                                    <span className="relative text-7xl mb-2 drop-shadow-2xl transition-all duration-300" aria-hidden="true">
                                        {entryBlocked ? '🔒' : dailyChallengeMode ? getDailyMode().emoji : isCompeting ? '🏆' : getModeEmoji()}
                                    </span>

                                    {/* Main Text - mode-specific call to action */}
                                    <span className={`relative text-white font-black tracking-wide uppercase text-center transition-all duration-300 px-2 ${isCompeting && currentEvent?.theme?.length > 12 ? 'text-lg' : 'text-2xl'
                                        }`}>
                                        {entryBlocked ? 'ENTRY USED'
                                            : dailyChallengeMode ? 'DAILY CHALLENGE'
                                                : isCompeting ? (currentEvent.theme || 'COMPETE')
                                                    : mode === 'nice' ? 'RATE MY FIT'
                                                        : mode === 'roast' ? 'ROAST MY FIT'
                                                            : mode === 'honest' ? 'HONEST RATE'
                                                                : mode === 'savage' ? 'SAVAGE MODE'
                                                                    : mode === 'rizz' ? 'RIZZ CHECK'
                                                                        : mode === 'celeb' ? 'CELEB JUDGE'
                                                                            : mode === 'aura' ? 'AURA READ'
                                                                                : mode === 'chaos' ? 'CHAOS MODE'
                                                                                    : mode === 'y2k' ? 'Y2K CHECK'
                                                                                        : mode === 'villain' ? 'VILLAIN ERA'
                                                                                            : mode === 'coquette' ? 'COQUETTE'
                                                                                                : mode === 'hypebeast' ? 'DRIP CHECK'
                                                                                                    : 'RATE MY FIT'}
                                    </span>

                                    {/* Subtitle - mode-specific description */}
                                    <span className="relative text-white/50 text-sm font-medium mt-1 transition-all duration-300">
                                        {dailyChallengeMode ? `${getDailyMode().label} mode • Win 5 Pro scans!`
                                            : entryBlocked ? 'Entry used today'
                                                : isCompeting ? `${currentEvent?.theme || 'Weekly Challenge'}`
                                                    : mode === 'nice' ? 'Supportive AI feedback'
                                                        : mode === 'roast' ? 'Brutally honest AI'
                                                            : mode === 'honest' ? 'Balanced analysis'
                                                                : mode === 'savage' ? 'Maximum destruction'
                                                                    : mode === 'rizz' ? 'Dating vibe check'
                                                                        : mode === 'celeb' ? 'Celebrity judge'
                                                                            : mode === 'aura' ? 'Mystical energy read'
                                                                                : mode === 'chaos' ? 'Unhinged chaos'
                                                                                    : mode === 'y2k' ? "That's hot 💎"
                                                                                        : mode === 'villain' ? 'Main villain energy'
                                                                                            : mode === 'coquette' ? 'Soft & romantic'
                                                                                                : mode === 'hypebeast' ? 'Certified drip'
                                                                                                    : 'AI feedback'}
                                    </span>

                                    {/* Exit Challenge Button - Simple version without redundant text */}
                                    {(dailyChallengeMode || (eventMode && currentEvent)) && (
                                        <button
                                            className="mt-3 px-4 py-2 rounded-lg transition-all active:scale-95"
                                            style={{
                                                background: 'rgba(255,255,255,0.08)',
                                                border: '1px solid rgba(255,255,255,0.15)'
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                playSound('click')
                                                vibrate(15)
                                                if (dailyChallengeMode) {
                                                    setDailyChallengeMode?.(false)
                                                } else {
                                                    setEventMode(false)
                                                }
                                            }}
                                        >
                                            <span className="text-sm text-white/60">✕ Exit Challenge</span>
                                        </button>
                                    )}
                                </button>
                            </div> {/* Close breathing rings wrapper */}
                        </div>
                    )
                })()}
            </div>


            {/* Privacy Assurance */}
            <p className="text-center text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {eventMode
                    ? '🔒 Entry photo saved for leaderboard display'
                    : '🔒 Your photos, your privacy • Auto-deleted'
                }
            </p>

            {/* Mini-Dashboard: 2-Column Layout with Mode + Arena */}
            {!eventMode && !dailyChallengeMode && (
                <div className="flex gap-3 w-full max-w-sm mb-4">
                    {/* Mode Selector Card */}
                    <button
                        onClick={() => {
                            playSound('click')
                            vibrate(15)
                            setShowModeDrawer(true)
                            if (showNudge) {
                                localStorage.setItem('fitrate_seen_mode_nudge', 'true')
                                setShowNudge(false)
                            }
                        }}
                        className={`flex-1 py-4 px-4 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-[0.97] ${showNudge ? 'animate-pulse' : ''}`}
                        style={{
                            background: `linear-gradient(135deg, ${getModeColor()}20 0%, ${getModeColor()}10 100%)`,
                            border: `1px solid ${getModeColor()}40`,
                            boxShadow: `0 0 20px ${getModeGlow()}`
                        }}
                    >
                        <span className="text-2xl">{getModeEmoji()}</span>
                        <span className="text-white font-bold text-sm">{getModeDisplayName()}</span>
                        <span className="text-white/40 text-[10px]">12 modes ▼</span>
                    </button>

                    {/* Global Arena Card */}
                    {onOpenArena && (
                        <button
                            onClick={() => {
                                playSound('click')
                                vibrate(20)
                                // Open Arena entry screen
                                onOpenArena()
                            }}
                            className="flex-1 py-4 px-4 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-[0.97]"
                            style={{
                                background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,255,136,0.1) 100%)',
                                border: '1px solid rgba(0,212,255,0.3)',
                                boxShadow: '0 0 20px rgba(0,212,255,0.15)'
                            }}
                        >
                            <span className="text-2xl">🌍</span>
                            <span className="text-white font-bold text-sm">Arena</span>
                            <div className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-cyan-400 text-[10px] font-medium">Live</span>
                            </div>
                        </button>
                    )}
                </div>
            )}

            {/* My Battles Section - Active 1v1 Battles */}
            {activeBattles.length > 0 && (
                <div className="w-full max-w-sm mb-4">
                    <div className="flex items-center justify-between mb-3 px-1 animate-stagger-fade-up stagger-1" style={{ opacity: 0 }}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">⚔️</span>
                            <span className="text-white/60 text-sm font-semibold">My Battles</span>
                            <span className="text-white/30 text-xs">({activeBattles.length})</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {activeBattles.map((battle, index) => {
                            const modeEmojis = { nice: '😇', roast: '🔥', honest: '📊', savage: '💀', rizz: '😏' }
                            const statusText = battle.status === 'completed' ? 'Results ready!' : 'Waiting for opponent...'
                            const statusColor = battle.status === 'completed' ? 'text-green-400' : 'text-amber-400'
                            return (
                                <div
                                    key={battle.battleId}
                                    className="w-full flex items-center justify-between p-4 rounded-2xl transition-all glass-premium animate-stagger-fade-up"
                                    style={{
                                        background: battle.status === 'completed'
                                            ? 'linear-gradient(135deg, rgba(0,255,136,0.15) 0%, rgba(0,212,255,0.1) 100%)'
                                            : 'linear-gradient(135deg, rgba(255,107,53,0.15) 0%, rgba(255,0,128,0.1) 100%)',
                                        border: battle.status === 'completed'
                                            ? '1px solid rgba(0,255,136,0.25)'
                                            : '1px solid rgba(255,107,53,0.25)',
                                        opacity: 0,
                                        animationDelay: `${0.1 + index * 0.1}s`
                                    }}
                                >
                                    <button
                                        onClick={() => {
                                            playSound('click')
                                            vibrate(15)
                                            onNavigateToBattle?.(battle.battleId)
                                        }}
                                        className="flex items-center gap-3 flex-1 text-left"
                                    >
                                        <span className="text-2xl">{modeEmojis[battle.mode] || '⚔️'}</span>
                                        <div>
                                            <p className="text-white font-semibold text-sm">
                                                You scored {Math.round(battle.myScore)}
                                            </p>
                                            <p className={`${statusColor} text-[10px] font-medium`}>
                                                {statusText}
                                            </p>
                                        </div>
                                    </button>
                                    {/* Dismiss/Remove Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            playSound('click')
                                            vibrate(10)
                                            onRemoveBattle?.(battle.battleId)
                                        }}
                                        className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                        aria-label="Remove battle from list"
                                    >
                                        <span className="text-white/40 text-sm">✕</span>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* My Shows Section - Active Fashion Shows */}
            {activeShows.length > 0 && (
                <div className="w-full max-w-sm mb-4">
                    <div className="flex items-center justify-between mb-3 px-1 animate-stagger-fade-up stagger-1" style={{ opacity: 0 }}>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🎭</span>
                            <span className="text-white/60 text-sm font-semibold">My Shows</span>
                            <span className="text-white/30 text-xs">({activeShows.length})</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {activeShows.map((show, index) => (
                            <div
                                key={show.showId}
                                className="w-full flex items-center justify-between p-4 rounded-2xl transition-all glass-premium animate-stagger-fade-up"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(168,85,247,0.1) 100%)',
                                    border: '1px solid rgba(139,92,246,0.25)',
                                    opacity: 0,
                                    animationDelay: `${0.1 + index * 0.1}s`
                                }}
                            >
                                <button
                                    onClick={() => {
                                        playSound('click')
                                        vibrate(15)
                                        onNavigateToShow?.(show.showId)
                                    }}
                                    className="flex items-center gap-3 flex-1 text-left"
                                >
                                    <span className="text-2xl">🎭</span>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{show.name}</p>
                                        <p className="text-purple-300/60 text-[10px]">
                                            {show.vibeLabel || 'Nice 😌'} • Tap to rejoin
                                        </p>
                                    </div>
                                </button>
                                {/* Dismiss/Remove Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        playSound('click')
                                        vibrate(10)
                                        onRemoveShow?.(show.showId)
                                    }}
                                    className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-90"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                    aria-label="Remove show from list"
                                >
                                    <span className="text-white/40 text-sm">✕</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Event Destination Cards - Side by side */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mb-4">
                {/* Fashion Show - Purple gradient with animated sparkles */}
                {onStartFashionShow && (
                    <button
                        onClick={() => { playSound('click'); vibrate(15); onStartFashionShow(); }}
                        className="relative overflow-hidden rounded-2xl p-3 transition-all active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #4c1d95 100%)',
                            border: '2px solid rgba(167,139,250,0.5)',
                            boxShadow: '0 4px 20px rgba(139,92,246,0.4), 0 0 40px rgba(167,139,250,0.2)'
                        }}
                    >
                        {/* Animated sparkle overlay */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute" style={{ top: '10%', left: '12%', animation: 'sparkle 1.8s ease-in-out infinite' }}>✨</div>
                            <div className="absolute" style={{ bottom: '20%', right: '15%', animation: 'sparkle 2.2s ease-in-out infinite 0.4s' }}>💜</div>
                        </div>
                        <span className="relative text-3xl block mb-1 drop-shadow-lg">🎭</span>
                        <span className="relative text-white font-bold text-sm block">Fashion Show</span>
                        <span className="relative text-purple-200/70 text-[11px]">Compete with friends</span>
                    </button>
                )}

                {/* Challenges - Navigate to Challenges screen */}
                {(currentEvent || true) && (
                    <button
                        onClick={() => {
                            playSound('click');
                            vibrate(15);
                            onShowWeeklyChallenge?.();
                        }}
                        className="relative overflow-hidden rounded-2xl p-3 transition-all active:scale-[0.98]"
                        style={{
                            background: 'linear-gradient(135deg, #047857 0%, #10b981 40%, #0d9488 70%, #115e59 100%)',
                            border: '2px solid rgba(45,212,191,0.5)',
                            boxShadow: '0 4px 20px rgba(16,185,129,0.4), 0 0 40px rgba(45,212,191,0.2)',
                        }}
                    >
                        {/* Animated sparkle overlay */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute" style={{ top: '10%', left: '15%', animation: 'sparkle 1.5s ease-in-out infinite' }}>✨</div>
                            <div className="absolute" style={{ bottom: '15%', right: '12%', animation: 'sparkle 2s ease-in-out infinite 0.3s' }}>⭐</div>
                        </div>
                        {/* Gold shimmer line */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl">
                            <div className="absolute top-0 left-0 w-full h-full" style={{
                                background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.3) 50%, transparent 100%)',
                                transform: 'translateX(-100%)',
                                animation: 'shimmer 3s infinite'
                            }} />
                        </div>
                        <span className="relative text-3xl block mb-1 drop-shadow-lg">🏆</span>
                        <span className="relative text-white font-bold text-sm block">Challenges</span>
                        <span className="relative text-teal-100/80 text-[11px]">Daily & Weekly prizes</span>
                    </button>
                )}
            </div>

            {/* Subtle PWA Install Prompt - only show if not already installed */}
            {!window.matchMedia('(display-mode: standalone)').matches && (
                <button
                    onClick={() => {
                        playSound('click')
                        // Show iOS instructions or trigger beforeinstallprompt
                        if (window.deferredInstallPrompt) {
                            window.deferredInstallPrompt.prompt()
                        } else {
                            // iOS fallback - show toast with instructions
                            const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
                            if (isIOS) {
                                alert('Tap the Share button (□↑) then "Add to Home Screen"')
                            } else {
                                alert('Tap the menu (⋮) then "Add to Home Screen" or "Install App"')
                            }
                        }
                    }}
                    className="mt-4 mb-4 text-xs transition-all active:opacity-60"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                    📲 Add to Home Screen for quick access
                </button>
            )}

            {/* Android Photo Picker Modal - Premium Glassmorphism */}
            {showAndroidPhotoModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        animation: 'backdrop-fade 0.3s ease-out forwards'
                    }}
                    onClick={() => setShowAndroidPhotoModal(false)}
                >
                    <div
                        className="w-full max-w-md p-6 pb-10 rounded-t-3xl glass-premium-strong"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,45,0.95) 0%, rgba(20,20,32,0.98) 100%)',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            animation: 'modal-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
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
                            {/* Upload Photo Button - HIDDEN for Events/Fashion Shows (camera only!) */}
                            {!eventMode && !fashionShowId && (
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
                            )}
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

            {/* Mode Drawer - All 12 AI Modes with Premium Glassmorphism */}
            {showModeDrawer && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        animation: 'backdrop-fade 0.3s ease-out forwards'
                    }}
                    onClick={() => setShowModeDrawer(false)}
                >
                    <div
                        className="w-full max-w-md p-5 pb-8 rounded-t-3xl glass-premium-strong"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,45,0.95) 0%, rgba(20,20,32,0.98) 100%)',
                            boxShadow: '0 -8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                            animation: 'modal-slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />

                        {/* Header */}
                        <div className="text-center mb-5">
                            <h3 className="text-white text-lg font-bold mb-1">
                                Choose AI Mode
                            </h3>
                            <p className="text-white/40 text-xs">Pick how you want your fit rated</p>
                        </div>

                        {/* Mode Grid - 4 columns, 3 rows for 12 modes */}
                        <div className="grid grid-cols-4 gap-3">
                            {/* Nice */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('nice'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'nice' ? 'ring-3 ring-cyan-400' : ''}`}
                                style={{ background: 'rgba(0,212,255,0.15)' }}
                                aria-label="Nice mode - Supportive AI feedback"
                            >
                                <span className="text-3xl mb-1">😇</span>
                                <span className="text-[13px] font-bold text-cyan-200">Nice</span>
                            </button>

                            {/* Roast */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('roast'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'roast' ? 'ring-3 ring-orange-400' : ''}`}
                                style={{ background: 'rgba(255,68,68,0.15)' }}
                                aria-label="Roast mode - Brutally honest AI"
                            >
                                <span className="text-3xl mb-1">🔥</span>
                                <span className="text-[13px] font-bold text-orange-200">Roast</span>
                            </button>

                            {/* Honest */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('honest'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'honest' ? 'ring-3 ring-blue-400' : ''}`}
                                style={{ background: 'rgba(59,130,246,0.15)' }}
                                aria-label="Honest mode - Balanced analysis"
                            >
                                <span className="text-3xl mb-1">📊</span>
                                <span className="text-[13px] font-bold text-blue-200">Honest</span>
                            </button>

                            {/* Savage */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('savage'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'savage' ? 'ring-3 ring-purple-400' : ''}`}
                                style={{ background: 'rgba(139,0,255,0.15)' }}
                                aria-label="Savage mode - Maximum destruction"
                            >
                                <span className="text-3xl mb-1">💀</span>
                                <span className="text-[13px] font-bold text-purple-200">Savage</span>
                            </button>

                            {/* Rizz */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('rizz'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'rizz' ? 'ring-3 ring-pink-400' : ''}`}
                                style={{ background: 'rgba(255,105,180,0.15)' }}
                                aria-label="Rizz mode - Dating vibe check"
                            >
                                <span className="text-3xl mb-1">😏</span>
                                <span className="text-[13px] font-bold text-pink-200">Rizz</span>
                            </button>

                            {/* Celebrity */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('celeb'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'celeb' ? 'ring-3 ring-yellow-400' : ''}`}
                                style={{ background: 'rgba(255,215,0,0.15)' }}
                                aria-label="Celebrity mode - Celebrity judge"
                            >
                                <span className="text-3xl mb-1">⭐</span>
                                <span className="text-[13px] font-bold text-yellow-200">Celebrity</span>
                            </button>

                            {/* Aura */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('aura'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'aura' ? 'ring-3 ring-violet-400' : ''}`}
                                style={{ background: 'rgba(155,89,182,0.15)' }}
                                aria-label="Aura mode - Mystical energy read"
                            >
                                <span className="text-3xl mb-1">🔮</span>
                                <span className="text-[13px] font-bold text-violet-200">Aura</span>
                            </button>

                            {/* Chaos */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('chaos'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'chaos' ? 'ring-3 ring-red-400' : ''}`}
                                style={{ background: 'rgba(255,107,107,0.15)' }}
                                aria-label="Chaos mode - Unhinged AI chaos"
                            >
                                <span className="text-3xl mb-1">🎪</span>
                                <span className="text-[13px] font-bold text-red-200">Chaos</span>
                            </button>

                            {/* Y2K */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('y2k'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'y2k' ? 'ring-3 ring-pink-400' : ''}`}
                                style={{ background: 'rgba(255,105,180,0.15)' }}
                                aria-label="Y2K mode - That's hot"
                            >
                                <span className="text-3xl mb-1">💎</span>
                                <span className="text-[13px] font-bold text-pink-200">Y2K</span>
                            </button>

                            {/* Villain */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('villain'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'villain' ? 'ring-3 ring-indigo-400' : ''}`}
                                style={{ background: 'rgba(76,29,149,0.15)' }}
                                aria-label="Villain mode - Main villain energy"
                            >
                                <span className="text-3xl mb-1">🖤</span>
                                <span className="text-[13px] font-bold text-indigo-200">Villain</span>
                            </button>

                            {/* Coquette */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('coquette'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'coquette' ? 'ring-3 ring-pink-300' : ''}`}
                                style={{ background: 'rgba(255,182,193,0.15)' }}
                                aria-label="Coquette mode - Soft and romantic"
                            >
                                <span className="text-3xl mb-1">🎀</span>
                                <span className="text-[13px] font-bold text-pink-100">Coquette</span>
                            </button>

                            {/* Hypebeast */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); setMode('hypebeast'); setEventMode(false); setShowModeDrawer(false); }}
                                className={`flex flex-col items-center justify-center gap-1 p-3.5 rounded-xl transition-all active:scale-95 min-h-[56px] ${mode === 'hypebeast' ? 'ring-3 ring-orange-400' : ''}`}
                                style={{ background: 'rgba(249,115,22,0.15)' }}
                                aria-label="Hypebeast mode - Certified drip check"
                            >
                                <span className="text-3xl mb-1">👟</span>
                                <span className="text-[13px] font-bold text-orange-200">Hypebeast</span>
                            </button>
                        </div>

                        {/* Meet The Judges link */}
                        <button
                            onClick={() => {
                                setShowModeDrawer(false)
                                onNavigate?.('judges')
                            }}
                            className="w-full py-2.5 text-cyan-400 text-sm font-bold mt-4 transition-all active:text-cyan-300 flex items-center justify-center gap-2"
                        >
                            <span>👥</span>
                            <span>Meet Your AI Judges</span>
                            <span className="text-cyan-400/50">→</span>
                        </button>

                        {/* Cancel */}
                        <button
                            onClick={() => setShowModeDrawer(false)}
                            aria-label="Close mode selector"
                            className="w-full py-2.5 text-white/40 text-sm font-medium transition-all active:text-white/60"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div >
    )
}
