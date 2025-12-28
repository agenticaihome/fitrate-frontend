import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'
import { formatTimeRemaining } from '../utils/dateUtils'
import { LIMITS } from '../config/constants'

// ============================================
// FIRST-TIME ONBOARDING MODAL
// Simple 3-step explainer for new users
// ============================================
const OnboardingOverlay = ({ onComplete }) => {
    const [step, setStep] = useState(0)

    const steps = [
        {
            emoji: '📸',
            title: 'Snap Your Outfit',
            desc: 'Take a photo of what you\'re wearing'
        },
        {
            emoji: '🤖',
            title: 'AI Rates Your Style',
            desc: 'Get a score from 1-100 with honest feedback'
        },
        {
            emoji: '🔥',
            title: 'Level Up Your Look',
            desc: 'Get tips to improve & compete with friends'
        }
    ]

    const handleNext = () => {
        playSound('click')
        vibrate(15)
        if (step < steps.length - 1) {
            setStep(step + 1)
        } else {
            localStorage.setItem('fitrate_onboarded', 'true')
            onComplete()
        }
    }

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)'
            }}
        >
            <div className="w-full max-w-sm text-center">
                {/* Progress dots */}
                <div className="flex justify-center gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full transition-all duration-300"
                            style={{
                                background: i === step ? '#00d4ff' : 'rgba(255,255,255,0.2)',
                                transform: i === step ? 'scale(1.3)' : 'scale(1)'
                            }}
                        />
                    ))}
                </div>

                {/* Step content */}
                <div
                    key={step}
                    className="animate-fade-in"
                    style={{ animation: 'fadeSlideUp 0.4s ease-out' }}
                >
                    <span className="text-7xl block mb-6">{steps[step].emoji}</span>
                    <h2 className="text-white text-2xl font-bold mb-3">
                        {steps[step].title}
                    </h2>
                    <p className="text-white/60 text-lg mb-8">
                        {steps[step].desc}
                    </p>
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleNext}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98]"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        color: '#000',
                        boxShadow: '0 4px 20px rgba(0,212,255,0.4)'
                    }}
                >
                    {step < steps.length - 1 ? 'Next' : 'Let\'s Go! 🚀'}
                </button>

                {/* Skip option */}
                <button
                    onClick={() => {
                        localStorage.setItem('fitrate_onboarded', 'true')
                        onComplete()
                    }}
                    className="mt-4 text-white/40 text-sm"
                >
                    Skip intro
                </button>
            </div>

            <style>{`
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}

// ============================================
// SIMPLIFIED FLOATING PARTICLES (reduced count)
// ============================================
const FloatingParticles = ({ accentColor }) => {
    const particles = useMemo(() =>
        Array.from({ length: 12 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 2,
            delay: Math.random() * 15,
            duration: 20 + Math.random() * 15,
            opacity: 0.1 + Math.random() * 0.15,
            drift: -20 + Math.random() * 40,
            color: i % 3 === 0 ? accentColor : '#fff'
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

// ============================================
// MODE DATA - All 12 AI Judges
// Punchier descriptions for 2025
// ============================================
const MODES = [
    { id: 'nice', emoji: '😇', label: 'Nice', desc: 'Your biggest fan', color: '#00d4ff', glow: 'rgba(0,212,255,0.4)' },
    { id: 'roast', emoji: '🔥', label: 'Roast', desc: 'Friendship-ending honesty', color: '#ff6b35', glow: 'rgba(255,107,53,0.4)' },
    { id: 'honest', emoji: '📊', label: 'Honest', desc: 'No cap, real talk', color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
    { id: 'savage', emoji: '💀', label: 'Savage', desc: 'Emotional damage loading', color: '#8b00ff', glow: 'rgba(139,0,255,0.4)' },
    { id: 'rizz', emoji: '😏', label: 'Rizz', desc: 'Would they swipe right?', color: '#ff69b4', glow: 'rgba(255,105,180,0.4)' },
    { id: 'celeb', emoji: '⭐', label: 'Celebrity', desc: 'A-list judgment', color: '#ffd700', glow: 'rgba(255,215,0,0.4)' },
    { id: 'aura', emoji: '🔮', label: 'Aura', desc: 'Reading your energy', color: '#9b59b6', glow: 'rgba(155,89,182,0.4)' },
    { id: 'chaos', emoji: '🎪', label: 'Chaos', desc: 'AI off its meds', color: '#ff6b6b', glow: 'rgba(255,107,107,0.4)' },
    { id: 'y2k', emoji: '💎', label: 'Y2K', desc: 'Paris Hilton energy', color: '#ff69b4', glow: 'rgba(255,105,180,0.4)' },
    { id: 'villain', emoji: '🖤', label: 'Villain', desc: 'Main character threat', color: '#7c3aed', glow: 'rgba(124,58,237,0.4)' },
    { id: 'coquette', emoji: '🎀', label: 'Coquette', desc: 'Soft girl aesthetic', color: '#f9a8d4', glow: 'rgba(249,168,212,0.4)' },
    { id: 'hypebeast', emoji: '👟', label: 'Hypebeast', desc: 'Certified drip doctor', color: '#f97316', glow: 'rgba(249,115,22,0.4)' }
]

// ============================================
// SOCIAL PROOF - Live activity simulation
// ============================================
const SOCIAL_PROOF_MESSAGES = [
    '847 fits rated in the last hour',
    '12.4K outfits rated today',
    'Join 50K+ fashion lovers',
    '94 avg score in the last 10 mins',
    'Someone just got a 98!',
]

// Daily Challenge: Rotating mode based on day of year
const getDailyMode = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
    return MODES[dayOfYear % MODES.length]
}

// Get mode data by ID
const getModeData = (modeId) => MODES.find(m => m.id === modeId) || MODES[0]

export default function HomeScreen({
    mode,
    setMode,
    isPro,
    scansRemaining,
    dailyStreak,
    currentEvent,
    eventMode,
    dailyChallengeMode,
    setDailyChallengeMode,
    setEventMode,
    purchasedScans,
    challengeScore,
    showToast,
    toastMessage,
    showInstallBanner,
    onShowInstallBanner,
    hasSeenEventExplainer,
    onShowEventExplainer,
    freeEventEntryUsed,
    onImageSelected,
    onShowPaywall,
    onShowRules,
    onShowRestore,
    onError,
    onStartFashionShow,
    onShowWeeklyChallenge,
    pendingFashionShowWalk,
    onClearPendingWalk,
    fashionShowName,
    fashionShowVibe,
    fashionShowVibeLabel,
    activeShows = [],
    onNavigateToShow,
    onRemoveShow,
    activeBattles = [],
    onNavigateToBattle,
    onRemoveBattle,
    onNavigate,
    onOpenArena
}) {
    // ==========================================
    // Local State
    // ==========================================
    const [view, setView] = useState('dashboard')
    const [cameraStream, setCameraStream] = useState(null)
    const [facingMode, setFacingMode] = useState('environment')
    const [countdown, setCountdown] = useState(null)
    const [cameraError, setCameraError] = useState(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [showAndroidPhotoModal, setShowAndroidPhotoModal] = useState(false)
    const [showModeDrawer, setShowModeDrawer] = useState(false)
    const [showMoreFeatures, setShowMoreFeatures] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(() => {
        return localStorage.getItem('fitrate_onboarded') !== 'true'
    })

    // Refs
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const fileInputRef = useRef(null)

    // Platform Detection
    const isAndroid = () => /Android/i.test(navigator.userAgent)
    const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream

    // Current mode data
    const currentMode = getModeData(mode)

    // Auto-trigger camera for Fashion Show walk
    useEffect(() => {
        if (pendingFashionShowWalk) {
            console.log('[FashionShow] Auto-triggering camera for walk')
            onClearPendingWalk?.()
            setTimeout(() => {
                if (isAndroid()) {
                    setShowAndroidPhotoModal(true)
                } else if (isIOS()) {
                    document.getElementById('androidGalleryInput')?.click()
                } else {
                    startCamera()
                }
            }, 300)
        }
    }, [pendingFashionShowWalk])

    // ==========================================
    // Camera Handlers
    // ==========================================
    const startCamera = useCallback(async (facing = facingMode) => {
        setCameraError(null)
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

            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    videoRef.current.play()
                }
            }, 100)
        } catch (err) {
            console.error('Camera error:', err)
            setCameraError(err.message)
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
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && view === 'camera' && cameraStream) {
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
        if (isProcessing) return
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        if (video.readyState < 2) return

        setIsProcessing(true)
        playSound('shutter')
        vibrate(50)

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = canvas.toDataURL('image/jpeg', 0.8)
        stopCamera()
        onImageSelected(imageData)
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

        if (file.size > 10 * 1024 * 1024) {
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
            onImageSelected(imageData, null)
        } catch (err) {
            console.error('Image processing error:', err)
            onError('Something went wrong — try again!')
        } finally {
            setIsProcessing(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }, [isProcessing, onError, onImageSelected])

    // ==========================================
    // Main Action Handler
    // ==========================================
    const handleStart = () => {
        if (isProcessing) return

        playSound('click')
        vibrate(20)

        // Block free users in event mode who've used their weekly entry
        if (eventMode && !isPro && freeEventEntryUsed) {
            setEventMode(false)
            onShowPaywall()
            return
        }

        if (scansRemaining > 0 || isPro || purchasedScans > 0) {
            proceedToCamera()
        } else {
            onShowPaywall()
        }
    }

    const proceedToCamera = () => {
        if (isAndroid()) {
            setShowAndroidPhotoModal(true)
        } else if (isIOS()) {
            document.getElementById('androidGalleryInput')?.click()
        } else {
            startCamera()
        }
    }

    const handleAndroidTakePhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        document.getElementById('androidCameraInput')?.click()
    }

    const handleAndroidUploadPhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        document.getElementById('androidGalleryInput')?.click()
    }

    // ==========================================
    // Compute scan status text
    // ==========================================
    const getScanStatusText = () => {
        if (isPro) return '∞ Unlimited Scans'
        if (purchasedScans > 0) return `${purchasedScans} Bonus Scans`
        return `${scansRemaining} Free Scans`
    }

    const getScanStatusIcon = () => {
        if (isPro) return '👑'
        if (purchasedScans > 0) return '💎'
        return '⚡'
    }

    // ==========================================
    // Count active items for badge
    // ==========================================
    const activeItemsCount = activeBattles.length + activeShows.length

    // ==========================================
    // RENDER: Onboarding
    // ==========================================
    if (showOnboarding) {
        return <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
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
                            {currentMode.emoji} {currentMode.label}
                        </span>
                    </div>
                    <button
                        onClick={() => { playSound('click'); vibrate(10); flipCamera(); }}
                        className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center active:scale-95"
                        aria-label="Flip camera"
                    >
                        <span className="text-xl">🔄</span>
                    </button>
                </div>

                <div className="flex-1" />

                {/* Bottom controls */}
                <div className="relative z-10 pb-6">
                    <div className="flex items-center justify-center gap-6 py-4" style={{
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
                    }}>
                        <button
                            onClick={() => { playSound('click'); vibrate(15); stopCamera(); }}
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95"
                            aria-label="Cancel"
                        >
                            <span className="text-white text-2xl">✕</span>
                        </button>

                        <button
                            onClick={() => { playSound('click'); vibrate(30); capturePhoto(); }}
                            disabled={countdown !== null}
                            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50"
                            aria-label="Take photo"
                            style={{
                                background: `linear-gradient(135deg, ${currentMode.color} 0%, #00ff88 100%)`,
                                boxShadow: `0 0 30px ${currentMode.glow}`,
                                border: '4px solid white'
                            }}
                        >
                            <span className="text-3xl">📸</span>
                        </button>

                        <button
                            onClick={() => { playSound('click'); vibrate(20); timerCapture(); }}
                            disabled={countdown !== null}
                            className="w-14 h-14 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 disabled:opacity-50"
                            aria-label="3 second timer"
                        >
                            <span className="text-white text-xl">⏱️</span>
                        </button>
                    </div>
                </div>

                {/* Countdown overlay */}
                {countdown !== null && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                        <div className="text-8xl font-black text-white" style={{
                            textShadow: `0 0 40px ${currentMode.glow}, 0 0 80px ${currentMode.glow}`,
                            animation: 'pulse 0.5s ease-in-out'
                        }}>
                            {countdown}
                        </div>
                    </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>
        )
    }

    // ==========================================
    // RENDER: Dashboard View (Simplified & Clean)
    // ==========================================
    return (
        <div className="min-h-screen flex flex-col items-center p-6 overflow-hidden relative" style={{
            background: 'linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 30%, #12091f 70%, #0a0610 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
            paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))'
        }}>
            {/* Subtle Background - Only ONE animated glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[500px] h-[500px] rounded-full" style={{
                    background: `radial-gradient(circle, ${currentMode.glow} 0%, transparent 60%)`,
                    top: '35%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    animation: 'glow-breathe 6s ease-in-out infinite',
                    opacity: 0.3
                }} />
                <FloatingParticles accentColor={currentMode.color} />
            </div>

            {/* Hidden Inputs */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                id="androidCameraInput"
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            <input
                type="file"
                accept="image/*"
                id="androidGalleryInput"
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Toast */}
            {showToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-60" style={{
                    background: 'rgba(0,255,136,0.9)',
                    boxShadow: '0 4px 20px rgba(0,255,136,0.4)'
                }}>
                    <span className="text-black font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* ============================================ */}
            {/* HEADER - Clean & Minimal */}
            {/* ============================================ */}
            <div className="w-full flex items-center justify-between mb-4">
                {/* Streak Badge - 48px touch target */}
                <button
                    className="relative w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{
                        background: dailyStreak?.current > 0
                            ? 'rgba(255,107,0,0.15)'
                            : 'rgba(255,255,255,0.05)',
                        border: dailyStreak?.current > 0
                            ? '1px solid rgba(255,107,0,0.3)'
                            : '1px solid rgba(255,255,255,0.1)'
                    }}
                    onClick={() => {
                        vibrate(10)
                        const msg = dailyStreak?.current > 0
                            ? `${dailyStreak.current} day streak! 🔥`
                            : 'Start your streak today! 💪'
                        showToast?.(msg)
                    }}
                    aria-label={`${dailyStreak?.current || 0} day streak`}
                >
                    <span className="text-xl">
                        {dailyStreak?.current >= 7 ? '🔥' : dailyStreak?.current >= 1 ? '🔥' : '💤'}
                    </span>
                    {dailyStreak?.current > 0 && (
                        <span
                            className="absolute -bottom-1 -right-1 text-[10px] font-bold rounded-full px-1.5 py-0.5"
                            style={{
                                background: 'linear-gradient(135deg, #ff6b00, #ff9500)',
                                color: '#fff',
                                minWidth: '18px',
                                textAlign: 'center'
                            }}
                        >
                            {dailyStreak.current}
                        </span>
                    )}
                </button>

                {/* Logo */}
                <img
                    src="/logo.svg"
                    alt="FitRate"
                    className="h-10"
                    style={{
                        filter: 'drop-shadow(0 0 15px rgba(0, 212, 255, 0.3))'
                    }}
                />

                {/* Settings - 48px touch target */}
                <button
                    onClick={() => { playSound('click'); vibrate(10); onShowRestore?.(); }}
                    aria-label="Settings"
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-xl">⚙️</span>
                </button>
            </div>

            {/* ============================================ */}
            {/* SCAN STATUS - Clear & Tappable */}
            {/* ============================================ */}
            <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 transition-all active:scale-95"
                style={{
                    background: isPro
                        ? 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,180,0,0.15) 100%)'
                        : purchasedScans > 0
                            ? 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,180,0,0.1) 100%)'
                            : 'rgba(0,212,255,0.1)',
                    border: isPro || purchasedScans > 0
                        ? '1px solid rgba(255,215,0,0.4)'
                        : '1px solid rgba(0,212,255,0.3)'
                }}
                onClick={() => { playSound('click'); vibrate(10); onShowPaywall(); }}
            >
                <span className="text-base">{getScanStatusIcon()}</span>
                <span className={`text-sm font-bold ${isPro || purchasedScans > 0 ? 'text-yellow-400' : 'text-cyan-400'}`}>
                    {getScanStatusText()}
                </span>
                {!isPro && (
                    <span className="text-white/50 text-xs">• Get More</span>
                )}
            </button>

            {/* ============================================ */}
            {/* CONTEXT BANNERS (Only when relevant) */}
            {/* ============================================ */}
            {challengeScore && (
                <div className="w-full max-w-sm mb-4 p-4 rounded-2xl text-center" style={{
                    background: 'linear-gradient(135deg, rgba(255,68,68,0.15) 0%, rgba(255,136,0,0.15) 100%)',
                    border: '1px solid rgba(255,136,0,0.3)'
                }}>
                    <p className="text-xl font-bold text-white">👊 Beat {challengeScore}?</p>
                    <p className="text-white/60 text-sm">Your friend scored {challengeScore}/100</p>
                </div>
            )}

            {fashionShowName && (
                <div className="w-full max-w-sm mb-4 p-4 rounded-2xl text-center" style={{
                    background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(168,85,247,0.15) 100%)',
                    border: '1px solid rgba(139,92,246,0.3)'
                }}>
                    <p className="text-lg font-bold text-white">🎭 Walking in "{fashionShowName}"</p>
                    <p className="text-purple-300 text-sm">Take a photo to submit your fit!</p>
                </div>
            )}

            {/* ============================================ */}
            {/* MAIN CTA - Unified & Clear */}
            {/* ============================================ */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
                {scansRemaining === 0 && !isPro && purchasedScans === 0 ? (
                    /* Out of Scans State - Fun personality */
                    <div className="flex flex-col items-center gap-6 py-8">
                        <div className="text-center">
                            <span className="text-5xl block mb-3">😅</span>
                            <h2 className="text-white text-xl font-bold mb-1">You've been busy!</h2>
                            <p className="text-white/60 text-sm">Fresh scans drop at midnight ⏰</p>
                        </div>

                        <button
                            onClick={() => { playSound('click'); vibrate(20); onShowPaywall(); }}
                            className="px-8 py-4 rounded-2xl font-bold text-lg transition-all active:scale-95"
                            style={{
                                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                                color: '#000',
                                boxShadow: '0 4px 25px rgba(0,212,255,0.4)'
                            }}
                        >
                            ✨ Unlock Unlimited
                        </button>

                        <div className="text-white/50 text-sm">or flex for free:</div>

                        <div className="flex gap-3">
                            {onStartFashionShow && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(15); onStartFashionShow(); }}
                                    className="px-5 py-3 rounded-xl transition-all active:scale-95"
                                    style={{
                                        background: 'rgba(139,92,246,0.2)',
                                        border: '1px solid rgba(139,92,246,0.3)'
                                    }}
                                >
                                    <span className="text-purple-300 font-medium">🎭 Battle Friends</span>
                                </button>
                            )}
                            {onOpenArena && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(15); onOpenArena(); }}
                                    className="px-5 py-3 rounded-xl transition-all active:scale-95"
                                    style={{
                                        background: 'rgba(0,212,255,0.15)',
                                        border: '1px solid rgba(0,212,255,0.3)'
                                    }}
                                >
                                    <span className="text-cyan-300 font-medium">🌍 Go Global</span>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Main CTA - Simplified */
                    <div className="flex flex-col items-center w-full">
                        {/* Challenge Mode Banner */}
                        {(dailyChallengeMode || eventMode) && (
                            <div
                                className="w-full max-w-xs mb-4 p-3 rounded-2xl text-center relative"
                                style={{
                                    background: dailyChallengeMode
                                        ? 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.15) 100%)'
                                        : 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(6,182,212,0.15) 100%)',
                                    border: dailyChallengeMode
                                        ? '1px solid rgba(59,130,246,0.4)'
                                        : '1px solid rgba(16,185,129,0.4)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <span className="text-xl">{dailyChallengeMode ? '⚡' : '🏆'}</span>
                                    <span className="text-white font-bold text-sm">
                                        {dailyChallengeMode ? 'Daily Challenge Active' : 'Weekly Challenge Active'}
                                    </span>
                                </div>
                                <p className="text-white/60 text-xs">
                                    {dailyChallengeMode
                                        ? `Today: ${getDailyMode().emoji} ${getDailyMode().label} Mode`
                                        : currentEvent?.theme || 'Beat the leaderboard!'}
                                </p>
                                <button
                                    onClick={() => {
                                        playSound('click')
                                        vibrate(10)
                                        setDailyChallengeMode?.(false)
                                        setEventMode?.(false)
                                    }}
                                    className="absolute top-2 right-2 text-white/40 text-xs px-2 py-1 rounded-full hover:text-white/70"
                                    style={{ background: 'rgba(255,255,255,0.1)' }}
                                >
                                    ✕ Exit
                                </button>
                            </div>
                        )}

                        {/* Single breathing ring */}
                        <div className="relative mb-6">
                            <div
                                className="absolute inset-0 rounded-full pointer-events-none"
                                style={{
                                    border: dailyChallengeMode
                                        ? '2px solid rgba(59,130,246,0.3)'
                                        : eventMode
                                            ? '2px solid rgba(16,185,129,0.3)'
                                            : `2px solid ${currentMode.color}30`,
                                    transform: 'scale(1.1)',
                                    animation: 'ring-breathe 3s ease-in-out infinite'
                                }}
                            />

                            <button
                                onClick={handleStart}
                                aria-label={dailyChallengeMode ? "Take a photo for daily challenge" : eventMode ? "Take a photo for weekly challenge" : "Take a photo to rate your outfit"}
                                className="relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all active:scale-[0.97]"
                                style={{
                                    background: dailyChallengeMode
                                        ? 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)'
                                        : eventMode
                                            ? 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)'
                                            : `radial-gradient(circle, ${currentMode.color}30 0%, transparent 70%)`,
                                    border: dailyChallengeMode
                                        ? '3px solid rgba(59,130,246,0.6)'
                                        : eventMode
                                            ? '3px solid rgba(16,185,129,0.6)'
                                            : `3px solid ${currentMode.color}60`,
                                    boxShadow: dailyChallengeMode
                                        ? '0 0 50px rgba(59,130,246,0.4), 0 0 100px rgba(59,130,246,0.2)'
                                        : eventMode
                                            ? '0 0 50px rgba(16,185,129,0.4), 0 0 100px rgba(16,185,129,0.2)'
                                            : `0 0 50px ${currentMode.glow}, 0 0 100px ${currentMode.glow}40`
                                }}
                            >
                                {/* Inner gradient */}
                                <div
                                    className="absolute inset-4 rounded-full"
                                    style={{
                                        background: dailyChallengeMode
                                            ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                                            : eventMode
                                                ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                                                : `linear-gradient(135deg, ${currentMode.color} 0%, ${currentMode.color}90 100%)`,
                                        boxShadow: dailyChallengeMode
                                            ? '0 0 60px rgba(59,130,246,0.5)'
                                            : eventMode
                                                ? '0 0 60px rgba(16,185,129,0.5)'
                                                : `0 0 60px ${currentMode.glow}`
                                    }}
                                />

                                {/* Icon */}
                                <span className="relative text-6xl mb-2">
                                    {dailyChallengeMode ? '⚡' : eventMode ? '🏆' : '📸'}
                                </span>

                                {/* Main Text - Changes based on mode */}
                                <span className="relative text-white font-black text-xl tracking-wide text-center px-4">
                                    {dailyChallengeMode
                                        ? 'DAILY CHALLENGE'
                                        : eventMode
                                            ? 'WEEKLY CHALLENGE'
                                            : 'RATE MY OUTFIT'}
                                </span>

                                {/* Mode indicator - Subtle */}
                                <span className="relative text-white/70 text-sm font-medium mt-1">
                                    {dailyChallengeMode
                                        ? `${getDailyMode().emoji} ${getDailyMode().label} Mode`
                                        : eventMode
                                            ? currentEvent?.theme || 'Beat the leaderboard!'
                                            : `${currentMode.emoji} ${currentMode.label} Mode`}
                                </span>
                            </button>
                        </div>

                        {/* Mode Selector - Hidden during challenge modes */}
                        {!dailyChallengeMode && !eventMode && (
                            <button
                                onClick={() => {
                                    playSound('click')
                                    vibrate(15)
                                    setShowModeDrawer(true)
                                }}
                                className="flex items-center gap-2 px-5 py-3 rounded-full transition-all active:scale-95 mb-4"
                                style={{
                                    background: `${currentMode.color}20`,
                                    border: `1px solid ${currentMode.color}40`
                                }}
                            >
                                <span className="text-xl">{currentMode.emoji}</span>
                                <span className="text-white font-semibold">{currentMode.label}</span>
                                <span className="text-white/50 text-sm">• Change ▼</span>
                            </button>
                        )}

                        {/* Challenge quick action - during challenge modes */}
                        {(dailyChallengeMode || eventMode) && (
                            <button
                                onClick={() => { playSound('click'); vibrate(15); onShowWeeklyChallenge?.(); }}
                                className="flex items-center gap-2 px-5 py-3 rounded-full transition-all active:scale-95 mb-4"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                <span className="text-lg">📊</span>
                                <span className="text-white font-semibold">View Leaderboard</span>
                            </button>
                        )}

                        {/* Social Proof + Privacy */}
                        <div className="text-center mb-4">
                            <p className="text-purple-300/70 text-xs mb-1">
                                🔥 {SOCIAL_PROOF_MESSAGES[Math.floor(Date.now() / 60000) % SOCIAL_PROOF_MESSAGES.length]}
                            </p>
                            <p className="text-white/40 text-[10px]">
                                🔒 Photos auto-deleted
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* MORE FEATURES - Collapsible Section */}
            {/* ============================================ */}
            <div className="w-full max-w-sm">
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(10)
                        setShowMoreFeatures(!showMoreFeatures)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 text-white/60 text-sm font-medium transition-all"
                >
                    <span>{showMoreFeatures ? '▲' : '▼'}</span>
                    <span>More Features</span>
                    {activeItemsCount > 0 && (
                        <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {activeItemsCount}
                        </span>
                    )}
                </button>

                {showMoreFeatures && (
                    <div className="space-y-3 mt-2 animate-fade-in" style={{ animation: 'fadeSlideUp 0.3s ease-out' }}>
                        {/* Quick Actions Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Arena */}
                            {onOpenArena && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(15); onOpenArena(); }}
                                    className="p-4 rounded-2xl transition-all active:scale-[0.97] relative"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(0,212,255,0.15) 0%, rgba(0,255,136,0.1) 100%)',
                                        border: '1px solid rgba(0,212,255,0.3)'
                                    }}
                                >
                                    <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                        style={{ background: 'linear-gradient(135deg, #ff6b35, #ff0080)', color: '#fff' }}>
                                        LIVE
                                    </span>
                                    <span className="text-2xl block mb-1">🌍</span>
                                    <span className="text-white font-bold text-sm block">Arena</span>
                                    <span className="text-cyan-300/70 text-xs">1v1 Battles</span>
                                </button>
                            )}

                            {/* Fashion Show */}
                            {onStartFashionShow && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(15); onStartFashionShow(); }}
                                    className="p-4 rounded-2xl transition-all active:scale-[0.97]"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(168,85,247,0.15) 100%)',
                                        border: '1px solid rgba(139,92,246,0.3)'
                                    }}
                                >
                                    <span className="text-2xl block mb-1">🎭</span>
                                    <span className="text-white font-bold text-sm block">Fashion Show</span>
                                    <span className="text-purple-300/70 text-xs">With Friends</span>
                                </button>
                            )}

                            {/* Challenges - Single entry for Daily + Weekly */}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); onShowWeeklyChallenge?.(); }}
                                className="p-4 rounded-2xl transition-all active:scale-[0.97] col-span-2"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(16,185,129,0.1) 100%)',
                                    border: '1px solid rgba(59,130,246,0.3)'
                                }}
                            >
                                <div className="flex items-center justify-center gap-4">
                                    <div className="text-center">
                                        <span className="text-2xl">⚡</span>
                                        <p className="text-xs text-blue-300/70">Daily</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-3xl">🏆</span>
                                        <p className="text-white font-bold text-sm">Challenges</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl">🌟</span>
                                        <p className="text-xs text-emerald-300/70">Weekly</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Active Battles */}
                        {activeBattles.length > 0 && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <span>⚔️</span>
                                    <span className="text-white/70 text-sm font-semibold">Your Battles</span>
                                </div>
                                <div className="space-y-2">
                                    {activeBattles.map((battle) => (
                                        <button
                                            key={battle.battleId}
                                            onClick={() => {
                                                playSound('click')
                                                vibrate(15)
                                                onNavigateToBattle?.(battle.battleId)
                                            }}
                                            className="w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98]"
                                            style={{
                                                background: battle.status === 'completed'
                                                    ? 'rgba(0,255,136,0.1)'
                                                    : 'rgba(255,107,53,0.1)',
                                                border: battle.status === 'completed'
                                                    ? '1px solid rgba(0,255,136,0.2)'
                                                    : '1px solid rgba(255,107,53,0.2)'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">
                                                    {getModeData(battle.mode)?.emoji || '⚔️'}
                                                </span>
                                                <div className="text-left">
                                                    <p className="text-white font-semibold text-sm">
                                                        {getModeData(battle.mode)?.label || 'Battle'}
                                                    </p>
                                                    <p className={`text-xs ${battle.status === 'completed' ? 'text-green-400' : 'text-amber-400'}`}>
                                                        {battle.status === 'completed' ? 'Results ready!' : 'Waiting...'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-white/40">→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Shows */}
                        {activeShows.length > 0 && (
                            <div className="mt-4">
                                <div className="flex items-center gap-2 mb-2 px-1">
                                    <span>🎭</span>
                                    <span className="text-white/70 text-sm font-semibold">Your Shows</span>
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
                                            className="w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98]"
                                            style={{
                                                background: 'rgba(139,92,246,0.1)',
                                                border: '1px solid rgba(139,92,246,0.2)'
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">🎭</span>
                                                <div className="text-left">
                                                    <p className="text-white font-semibold text-sm">{show.name}</p>
                                                    <p className="text-purple-300/70 text-xs">
                                                        {show.vibeLabel || 'Tap to rejoin'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-white/40">→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}

            {/* Android Photo Picker */}
            {showAndroidPhotoModal && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setShowAndroidPhotoModal(false)}
                >
                    <div
                        className="w-full max-w-md p-6 pb-10 rounded-t-3xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,45,0.98) 0%, rgba(20,20,32,0.99) 100%)',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
                        <h3 className="text-white text-lg font-bold text-center mb-6">
                            Choose Photo Source
                        </h3>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleAndroidTakePhoto}
                                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
                                style={{
                                    background: `linear-gradient(135deg, ${currentMode.color} 0%, #00ff88 100%)`,
                                    color: '#000'
                                }}
                            >
                                <span className="text-2xl">📷</span>
                                Take Photo
                            </button>
                            {!eventMode && !fashionShowName && (
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

            {/* Mode Drawer - Clean Grid */}
            {showModeDrawer && (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{
                        background: 'rgba(0,0,0,0.7)',
                        backdropFilter: 'blur(8px)'
                    }}
                    onClick={() => setShowModeDrawer(false)}
                >
                    <div
                        className="w-full max-w-md p-5 pb-8 rounded-t-3xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,45,0.98) 0%, rgba(20,20,32,0.99) 100%)',
                            animation: 'slideUp 0.3s ease-out'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />

                        <div className="text-center mb-5">
                            <h3 className="text-white text-lg font-bold mb-1">Choose AI Mode</h3>
                            <p className="text-white/50 text-sm">How should we rate your fit?</p>
                        </div>

                        {/* Mode Grid - 4 columns with elastic selection */}
                        <div className="grid grid-cols-4 gap-2">
                            {MODES.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={(e) => {
                                        playSound('click')
                                        vibrate([15, 10, 25]) // Quick triple-tap feel
                                        // Add elastic animation class
                                        e.currentTarget.classList.add('animate-mode-select')
                                        setTimeout(() => {
                                            setMode(m.id)
                                            setEventMode(false)
                                            setDailyChallengeMode?.(false)
                                            setShowModeDrawer(false)
                                        }, 200)
                                    }}
                                    className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all ${mode === m.id ? 'ring-2' : ''}`}
                                    style={{
                                        background: `${m.color}15`,
                                        ringColor: m.color
                                    }}
                                    aria-label={`${m.label} mode - ${m.desc}`}
                                >
                                    <span className="text-2xl">{m.emoji}</span>
                                    <span className="text-[11px] font-bold text-white/90">{m.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Meet The Judges */}
                        <button
                            onClick={() => {
                                setShowModeDrawer(false)
                                onNavigate?.('judges')
                            }}
                            className="w-full py-3 text-cyan-400 text-sm font-bold mt-4 flex items-center justify-center gap-2"
                        >
                            <span>👥</span>
                            <span>Meet Your AI Judges</span>
                            <span className="text-cyan-400/50">→</span>
                        </button>

                        <button
                            onClick={() => setShowModeDrawer(false)}
                            className="w-full py-2 text-white/40 text-sm font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Inline Styles */}
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    )
}
