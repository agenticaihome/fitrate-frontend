import React, { useState, useRef, useCallback, useEffect, useMemo, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'
import { formatTimeRemaining } from '../utils/dateUtils'
import { LIMITS } from '../config/constants'

// Lazy load 3D particle field for performance
const ParticleField = lazy(() => import('../components/3d/ParticleField').then(m => ({ default: m.ParticleFieldLight })))

// ============================================
// CINEMATIC ONBOARDING - Premium first impression
// ============================================
const OnboardingOverlay = ({ onComplete }) => {
    const [step, setStep] = useState(0)
    const [isExiting, setIsExiting] = useState(false)

    const steps = [
        {
            emoji: '📸',
            title: 'Snap Your Outfit',
            desc: 'Take a photo of what you\'re wearing',
            color: '#00d4ff',
            bgGradient: 'radial-gradient(circle at 50% 30%, rgba(0,212,255,0.3) 0%, transparent 60%)'
        },
        {
            emoji: '🤖',
            title: 'AI Rates Your Style',
            desc: 'Get a score from 1-100 with honest feedback',
            color: '#8b5cf6',
            bgGradient: 'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.3) 0%, transparent 60%)'
        },
        {
            emoji: '🔥',
            title: 'Level Up Your Look',
            desc: 'Get tips to improve & compete with friends',
            color: '#ff6b35',
            bgGradient: 'radial-gradient(circle at 50% 30%, rgba(255,107,53,0.3) 0%, transparent 60%)'
        }
    ]

    const handleNext = () => {
        playSound('click')
        vibrate([15, 10, 25])
        if (step < steps.length - 1) {
            setStep(step + 1)
        } else {
            setIsExiting(true)
            setTimeout(() => {
                localStorage.setItem('fitrate_onboarded', 'true')
                onComplete()
            }, 500)
        }
    }

    const currentStep = steps[step]

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{
                background: 'rgba(0,0,0,0.95)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)'
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Animated background glow */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ background: currentStep.bgGradient }}
                key={step}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
            />

            {/* Floating particles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                        background: currentStep.color,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        boxShadow: `0 0 10px ${currentStep.color}`
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.5, 1]
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                />
            ))}

            <div className="w-full max-w-sm text-center relative z-10">
                {/* Progress bar */}
                <div className="flex justify-center gap-3 mb-10">
                    {steps.map((s, i) => (
                        <motion.div
                            key={i}
                            className="h-1 rounded-full"
                            style={{
                                width: i === step ? 40 : 20,
                                background: i <= step ? currentStep.color : 'rgba(255,255,255,0.2)'
                            }}
                            animate={{
                                width: i === step ? 40 : 20,
                                boxShadow: i === step ? `0 0 10px ${currentStep.color}` : 'none'
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    ))}
                </div>

                {/* Step content with AnimatePresence */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {/* Emoji with 3D effect */}
                        <motion.div
                            className="text-8xl mb-6 inline-block"
                            style={{
                                filter: `drop-shadow(0 0 40px ${currentStep.color})`
                            }}
                            animate={{
                                y: [0, -10, 0],
                                rotateY: [0, 10, 0, -10, 0]
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: 'easeInOut'
                            }}
                        >
                            {currentStep.emoji}
                        </motion.div>

                        {/* Title with gradient */}
                        <motion.h2
                            className="text-3xl font-black mb-3"
                            style={{
                                background: `linear-gradient(135deg, #fff 0%, ${currentStep.color} 100%)`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: 'none'
                            }}
                        >
                            {currentStep.title}
                        </motion.h2>

                        <p className="text-white/60 text-lg mb-10">
                            {currentStep.desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Premium CTA Button */}
                <motion.button
                    onClick={handleNext}
                    className="w-full py-4 rounded-2xl font-bold text-lg relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${currentStep.color} 0%, ${currentStep.color}cc 100%)`,
                        color: '#fff',
                        boxShadow: `0 8px 30px ${currentStep.color}50, 0 0 60px ${currentStep.color}20`
                    }}
                    whileHover={{ scale: 1.02, boxShadow: `0 12px 40px ${currentStep.color}60, 0 0 80px ${currentStep.color}30` }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)'
                        }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                    />
                    <span className="relative z-10">
                        {step < steps.length - 1 ? 'Continue' : 'Let\'s Go! 🚀'}
                    </span>
                </motion.button>

                {/* Step indicator */}
                <motion.p
                    className="mt-4 text-white/30 text-sm"
                    animate={{ opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {step + 1} of {steps.length}
                </motion.p>

                {/* Skip option */}
                <motion.button
                    onClick={() => {
                        setIsExiting(true)
                        setTimeout(() => {
                            localStorage.setItem('fitrate_onboarded', 'true')
                            onComplete()
                        }, 300)
                    }}
                    className="mt-2 text-white/30 text-sm hover:text-white/50 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    Skip intro
                </motion.button>
            </div>
        </motion.div>
    )
}

// ============================================
// ENHANCED FLOATING PARTICLES with parallax layers
// ============================================
const FloatingParticles = ({ accentColor, secondaryColor = '#8b5cf6' }) => {
    const particles = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 1 + Math.random() * 3,
            delay: Math.random() * 15,
            duration: 18 + Math.random() * 18,
            opacity: 0.15 + Math.random() * 0.2,
            drift: -25 + Math.random() * 50,
            color: i % 4 === 0 ? accentColor : i % 4 === 1 ? secondaryColor : '#fff',
            layer: i % 3 // 0 = deep, 1 = mid, 2 = near (faster)
        })), [accentColor, secondaryColor]
    )

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Deep layer particles (slowest) */}
            {particles.filter(p => p.layer === 0).map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: p.opacity * 0.6 }}
                    transition={{ duration: 1, delay: p.delay * 0.1 }}
                    style={{
                        left: `${p.left}%`,
                        bottom: '-10px',
                        width: p.size * 0.8,
                        height: p.size * 0.8,
                        background: p.color,
                        boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                        animation: `particle-float ${p.duration * 1.3}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift * 0.5}px`
                    }}
                />
            ))}

            {/* Mid layer particles */}
            {particles.filter(p => p.layer === 1).map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: p.opacity * 0.8 }}
                    transition={{ duration: 0.8, delay: p.delay * 0.1 }}
                    style={{
                        left: `${p.left}%`,
                        bottom: '-10px',
                        width: p.size,
                        height: p.size,
                        background: p.color,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                        animation: `particle-float ${p.duration}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift}px`
                    }}
                />
            ))}

            {/* Near layer particles (fastest, brightest) */}
            {particles.filter(p => p.layer === 2).map(p => (
                <motion.div
                    key={p.id}
                    className="absolute rounded-full"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: p.opacity, scale: 1 }}
                    transition={{ duration: 0.5, delay: p.delay * 0.1 }}
                    style={{
                        left: `${p.left}%`,
                        bottom: '-10px',
                        width: p.size * 1.2,
                        height: p.size * 1.2,
                        background: p.color,
                        boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
                        animation: `particle-float ${p.duration * 0.7}s linear infinite`,
                        animationDelay: `${p.delay}s`,
                        '--drift': `${p.drift * 1.5}px`
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
        <div className="flex flex-col items-center p-6 relative" style={{
            minHeight: '100dvh',
            overflowX: 'hidden',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 30%, #12091f 70%, #0a0610 100%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
            paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))'
        }}>
            {/* Enhanced 3D Parallax Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none parallax-scene">
                {/* Deep layer - slowest */}
                <motion.div
                    className="parallax-orb parallax-orb-1"
                    style={{
                        '--orb-color-1': `${currentMode.color}15`,
                        top: '10%',
                        left: '15%'
                    }}
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -20, 0]
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                {/* Mid layer orbs */}
                <motion.div
                    className="parallax-orb parallax-orb-2"
                    style={{
                        '--orb-color-2': 'rgba(139,92,246,0.12)',
                        top: '55%',
                        right: '5%'
                    }}
                    animate={{
                        x: [0, -25, 0],
                        y: [0, 15, 0]
                    }}
                    transition={{
                        duration: 18,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 2
                    }}
                />

                {/* Central breathing glow */}
                <motion.div
                    className="absolute w-[500px] h-[500px] rounded-full"
                    style={{
                        background: `radial-gradient(circle, ${currentMode.glow} 0%, transparent 60%)`,
                        top: '35%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        filter: 'blur(40px)'
                    }}
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />

                {/* Accent orb */}
                <motion.div
                    className="parallax-orb parallax-orb-3"
                    style={{
                        '--orb-color-3': 'rgba(255,107,53,0.1)',
                        top: '75%',
                        left: '30%'
                    }}
                    animate={{
                        x: [0, 20, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{
                        duration: 22,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 5
                    }}
                />

                {/* Multi-layer floating particles */}
                <FloatingParticles accentColor={currentMode.color} secondaryColor="#8b5cf6" />
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
            <div className="flex flex-col items-center justify-center w-full max-w-sm py-8">
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

                        <div className="text-white/50 text-sm mb-2">or play for free:</div>

                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            {onOpenArena && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(15); onOpenArena(); }}
                                    className="w-full px-5 py-4 rounded-xl transition-all active:scale-95 flex items-center justify-between"
                                    style={{
                                        background: 'rgba(0,212,255,0.15)',
                                        border: '1px solid rgba(0,212,255,0.3)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🌍</span>
                                        <div className="text-left">
                                            <span className="text-cyan-300 font-bold block">Global Arena</span>
                                            <span className="text-cyan-400/70 text-xs">1v1 Battles</span>
                                        </div>
                                    </div>
                                    <span className="text-cyan-400 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(0,212,255,0.2)' }}>
                                        10 FREE/day
                                    </span>
                                </button>
                            )}
                            {onStartFashionShow && (
                                <button
                                    onClick={() => { playSound('click'); vibrate(15); onStartFashionShow(); }}
                                    className="w-full px-5 py-4 rounded-xl transition-all active:scale-95 flex items-center justify-between"
                                    style={{
                                        background: 'rgba(139,92,246,0.2)',
                                        border: '1px solid rgba(139,92,246,0.3)'
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">🎭</span>
                                        <div className="text-left">
                                            <span className="text-purple-300 font-bold block">Fashion Show</span>
                                            <span className="text-purple-400/70 text-xs">Battle Friends</span>
                                        </div>
                                    </div>
                                    <span className="text-purple-400 text-xs font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.2)' }}>
                                        FREE
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={() => { playSound('click'); vibrate(15); onShowWeeklyChallenge?.(); }}
                                className="w-full px-5 py-4 rounded-xl transition-all active:scale-95"
                                style={{
                                    background: 'rgba(59,130,246,0.15)',
                                    border: '1px solid rgba(59,130,246,0.3)'
                                }}
                            >
                                <div className="flex items-center justify-around">
                                    <div className="text-center">
                                        <span className="text-xl">⚡</span>
                                        <p className="text-blue-300 font-bold text-xs">Daily</p>
                                        <p className="text-blue-400/70 text-[10px]">1 FREE/day</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-2xl">🏆</span>
                                        <p className="text-white font-bold text-sm">Challenges</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xl">🌟</span>
                                        <p className="text-emerald-300 font-bold text-xs">Weekly</p>
                                        <p className="text-emerald-400/70 text-[10px]">1 FREE/week</p>
                                    </div>
                                </div>
                            </button>
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

                        {/* ============================================ */}
                        {/* 🌊 LIVING LIQUID ORB - Next Level UI */}
                        {/* ============================================ */}
                        <div className="relative mb-8" style={{ perspective: '1000px' }}>
                            {/* SVG Filters for liquid/gooey effect */}
                            <svg className="absolute w-0 h-0">
                                <defs>
                                    <filter id="goo">
                                        <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                                        <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10" result="goo" />
                                        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                                    </filter>
                                    <filter id="liquid-distort">
                                        <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" seed="1">
                                            <animate attributeName="baseFrequency" values="0.01;0.015;0.01" dur="10s" repeatCount="indefinite" />
                                        </feTurbulence>
                                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" />
                                    </filter>
                                    {/* Holographic gradient */}
                                    <linearGradient id="holographic" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#ff00ff">
                                            <animate attributeName="stop-color" values="#ff00ff;#00ffff;#ffff00;#ff00ff" dur="4s" repeatCount="indefinite" />
                                        </stop>
                                        <stop offset="50%" stopColor="#00ffff">
                                            <animate attributeName="stop-color" values="#00ffff;#ffff00;#ff00ff;#00ffff" dur="4s" repeatCount="indefinite" />
                                        </stop>
                                        <stop offset="100%" stopColor="#ffff00">
                                            <animate attributeName="stop-color" values="#ffff00;#ff00ff;#00ffff;#ffff00" dur="4s" repeatCount="indefinite" />
                                        </stop>
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Aurora background waves */}
                            <div className="absolute -inset-20 pointer-events-none overflow-hidden">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={`aurora-${i}`}
                                        className="absolute w-[400px] h-[200px] rounded-full opacity-30"
                                        style={{
                                            background: `linear-gradient(${90 + i * 60}deg, ${currentMode.color}00 0%, ${currentMode.color}40 50%, ${currentMode.color}00 100%)`,
                                            filter: 'blur(40px)',
                                            left: '50%',
                                            top: '50%',
                                            marginLeft: -200,
                                            marginTop: -100
                                        }}
                                        animate={{
                                            rotate: [0 + i * 120, 360 + i * 120],
                                            scale: [1, 1.2, 1]
                                        }}
                                        transition={{
                                            rotate: { duration: 20 + i * 5, repeat: Infinity, ease: 'linear' },
                                            scale: { duration: 8, repeat: Infinity, ease: 'easeInOut', delay: i * 2 }
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Magnetic floating particles */}
                            <div className="absolute inset-0 pointer-events-none" style={{ filter: 'url(#goo)' }}>
                                {[...Array(12)].map((_, i) => {
                                    const angle = (i / 12) * Math.PI * 2
                                    const radius = 120 + (i % 3) * 20
                                    return (
                                        <motion.div
                                            key={`particle-${i}`}
                                            className="absolute rounded-full"
                                            style={{
                                                width: 8 + (i % 4) * 4,
                                                height: 8 + (i % 4) * 4,
                                                background: i % 3 === 0
                                                    ? currentMode.color
                                                    : i % 3 === 1
                                                        ? '#fff'
                                                        : `${currentMode.color}88`,
                                                boxShadow: `0 0 ${10 + i * 2}px ${currentMode.color}`,
                                                left: '50%',
                                                top: '50%'
                                            }}
                                            animate={{
                                                x: [
                                                    Math.cos(angle) * radius,
                                                    Math.cos(angle + 0.5) * (radius - 30),
                                                    Math.cos(angle + 1) * radius,
                                                    Math.cos(angle + 1.5) * (radius + 20),
                                                    Math.cos(angle + 2) * radius
                                                ],
                                                y: [
                                                    Math.sin(angle) * radius,
                                                    Math.sin(angle + 0.5) * (radius - 30),
                                                    Math.sin(angle + 1) * radius,
                                                    Math.sin(angle + 1.5) * (radius + 20),
                                                    Math.sin(angle + 2) * radius
                                                ],
                                                scale: [1, 1.5, 1, 0.8, 1],
                                                opacity: [0.6, 1, 0.6, 0.9, 0.6]
                                            }}
                                            transition={{
                                                duration: 6 + i * 0.5,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                                delay: i * 0.3
                                            }}
                                        />
                                    )
                                })}
                            </div>

                            {/* Main liquid orb button */}
                            <motion.button
                                onClick={handleStart}
                                aria-label={dailyChallengeMode ? "Take a photo for daily challenge" : eventMode ? "Take a photo for weekly challenge" : "Take a photo to rate your outfit"}
                                className="relative w-64 h-64 flex flex-col items-center justify-center"
                                style={{ transformStyle: 'preserve-3d' }}
                                whileTap={{
                                    scale: 0.92,
                                    rotateX: 10,
                                    transition: { type: 'spring', stiffness: 500, damping: 15 }
                                }}
                                animate={{
                                    y: [0, -12, 0],
                                    rotateX: [0, 2, 0, -2, 0],
                                    rotateY: [0, 2, 0, -2, 0]
                                }}
                                transition={{
                                    y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                                    rotateX: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
                                    rotateY: { duration: 8, repeat: Infinity, ease: 'easeInOut' }
                                }}
                            >
                                {/* Deep ambient shadow */}
                                <div
                                    className="absolute w-48 h-12 rounded-[50%] left-1/2 -translate-x-1/2"
                                    style={{
                                        bottom: -20,
                                        background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
                                        filter: 'blur(15px)',
                                        transform: 'translateX(-50%) translateZ(-50px)'
                                    }}
                                />

                                {/* Outer glow aura */}
                                <motion.div
                                    className="absolute inset-[-20px] rounded-full"
                                    style={{
                                        background: `radial-gradient(circle, ${currentMode.color}30 0%, ${currentMode.color}10 40%, transparent 70%)`,
                                        filter: 'blur(20px)'
                                    }}
                                    animate={{
                                        scale: [1, 1.15, 1],
                                        opacity: [0.5, 0.8, 0.5]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                />

                                {/* Morphing liquid blob - outer layer */}
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        background: `
                                            radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.3) 0%, transparent 50%),
                                            radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.3) 0%, transparent 50%),
                                            linear-gradient(135deg, ${currentMode.color} 0%, ${currentMode.color}dd 50%, ${currentMode.color}aa 100%)
                                        `,
                                        boxShadow: `
                                            inset 0 -20px 40px rgba(0,0,0,0.4),
                                            inset 0 20px 40px rgba(255,255,255,0.2),
                                            0 0 80px ${currentMode.color}60,
                                            0 20px 60px rgba(0,0,0,0.4)
                                        `,
                                        transformStyle: 'preserve-3d'
                                    }}
                                    animate={{
                                        borderRadius: [
                                            '60% 40% 50% 50% / 50% 50% 40% 60%',
                                            '50% 60% 40% 50% / 40% 60% 50% 50%',
                                            '40% 50% 60% 50% / 50% 40% 60% 50%',
                                            '50% 40% 50% 60% / 60% 50% 40% 50%',
                                            '60% 40% 50% 50% / 50% 50% 40% 60%'
                                        ]
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                />

                                {/* Inner liquid layer with holographic sheen */}
                                <motion.div
                                    className="absolute inset-3 overflow-hidden"
                                    style={{
                                        background: `
                                            radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.4) 0%, transparent 40%),
                                            linear-gradient(180deg, ${currentMode.color} 0%, ${currentMode.color}cc 60%, ${currentMode.color}88 100%)
                                        `,
                                        boxShadow: 'inset 0 -15px 50px rgba(0,0,0,0.5), inset 0 15px 30px rgba(255,255,255,0.2)'
                                    }}
                                    animate={{
                                        borderRadius: [
                                            '50% 60% 40% 50% / 60% 40% 50% 50%',
                                            '60% 40% 50% 50% / 50% 50% 60% 40%',
                                            '40% 50% 60% 50% / 40% 60% 40% 60%',
                                            '50% 60% 50% 40% / 50% 40% 50% 60%',
                                            '50% 60% 40% 50% / 60% 40% 50% 50%'
                                        ]
                                    }}
                                    transition={{
                                        duration: 8,
                                        repeat: Infinity,
                                        ease: 'easeInOut',
                                        delay: 0.5
                                    }}
                                >
                                    {/* Holographic rainbow sweep */}
                                    <motion.div
                                        className="absolute inset-0 opacity-30"
                                        style={{
                                            background: 'linear-gradient(135deg, #ff006620 0%, #00ffff20 25%, #ffff0020 50%, #ff00ff20 75%, #00ff0020 100%)',
                                            backgroundSize: '400% 400%'
                                        }}
                                        animate={{
                                            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
                                        }}
                                        transition={{
                                            duration: 6,
                                            repeat: Infinity,
                                            ease: 'linear'
                                        }}
                                    />

                                    {/* Liquid surface reflection */}
                                    <motion.div
                                        className="absolute top-0 left-0 right-0 h-1/2"
                                        style={{
                                            background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 30%, transparent 100%)',
                                            borderRadius: '50% 50% 40% 40% / 100% 100% 0% 0%',
                                            filter: 'blur(1px)'
                                        }}
                                        animate={{
                                            opacity: [0.6, 0.8, 0.6],
                                            scaleX: [1, 1.02, 1]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    />

                                    {/* Moving light caustic */}
                                    <motion.div
                                        className="absolute w-full h-full"
                                        style={{
                                            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 50%)'
                                        }}
                                        animate={{
                                            x: [-30, 30, -30],
                                            y: [-20, 20, -20],
                                            opacity: [0.3, 0.6, 0.3]
                                        }}
                                        transition={{
                                            duration: 5,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    />
                                </motion.div>

                                {/* Floating inner bubble accents */}
                                {[...Array(5)].map((_, i) => (
                                    <motion.div
                                        key={`bubble-${i}`}
                                        className="absolute rounded-full pointer-events-none"
                                        style={{
                                            width: 6 + i * 3,
                                            height: 6 + i * 3,
                                            background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), rgba(255,255,255,0.2))',
                                            left: 60 + i * 25,
                                            top: 80 + (i % 3) * 30
                                        }}
                                        animate={{
                                            y: [0, -15, 0],
                                            x: [0, i % 2 ? 8 : -8, 0],
                                            opacity: [0.4, 0.8, 0.4],
                                            scale: [1, 1.2, 1]
                                        }}
                                        transition={{
                                            duration: 3 + i,
                                            repeat: Infinity,
                                            ease: 'easeInOut',
                                            delay: i * 0.5
                                        }}
                                    />
                                ))}

                                {/* Center content */}
                                <div className="relative z-10 flex flex-col items-center">
                                    {/* Animated emoji with float */}
                                    <motion.div
                                        className="text-5xl mb-2"
                                        style={{
                                            filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.4))'
                                        }}
                                        animate={{
                                            y: [0, -5, 0],
                                            scale: [1, 1.08, 1],
                                            rotate: [0, 3, -3, 0]
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    >
                                        {dailyChallengeMode ? '⚡' : eventMode ? '🏆' : '📸'}
                                    </motion.div>

                                    {/* Main text */}
                                    <motion.span
                                        className="text-white font-black text-xl tracking-wide text-center px-4"
                                        style={{
                                            textShadow: '0 2px 15px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.3)'
                                        }}
                                        animate={{
                                            textShadow: [
                                                '0 2px 15px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.3)',
                                                '0 2px 20px rgba(0,0,0,0.5), 0 0 60px rgba(255,255,255,0.4)',
                                                '0 2px 15px rgba(0,0,0,0.6), 0 0 40px rgba(255,255,255,0.3)'
                                            ]
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        {dailyChallengeMode
                                            ? 'DAILY CHALLENGE'
                                            : eventMode
                                                ? 'WEEKLY CHALLENGE'
                                                : 'RATE MY FIT'}
                                    </motion.span>

                                    {/* Mode pill with glass effect */}
                                    <motion.span
                                        className="text-white/95 text-sm font-bold mt-2 px-4 py-1.5 rounded-full"
                                        style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(8px)',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.3)',
                                            border: '1px solid rgba(255,255,255,0.2)'
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        {dailyChallengeMode
                                            ? `${getDailyMode().emoji} ${getDailyMode().label}`
                                            : eventMode
                                                ? currentEvent?.theme || 'Beat the leaderboard!'
                                                : `${currentMode.emoji} ${currentMode.label}`}
                                    </motion.span>
                                </div>

                                {/* Bottom reflection on "surface" */}
                                <motion.div
                                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-8"
                                    style={{
                                        background: `radial-gradient(ellipse, ${currentMode.color}40 0%, transparent 70%)`,
                                        filter: 'blur(8px)',
                                        transform: 'translateX(-50%) scaleY(0.3)'
                                    }}
                                    animate={{
                                        opacity: [0.4, 0.6, 0.4],
                                        scaleX: [1, 1.1, 1]
                                    }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                            </motion.button>

                            {/* Subtle interaction hint */}
                            <motion.p
                                className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/30 text-xs font-medium tracking-wider whitespace-nowrap"
                                animate={{
                                    opacity: [0.2, 0.4, 0.2],
                                    y: [0, -2, 0]
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                ✦ tap to begin ✦
                            </motion.p>
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
                        {/* Quick Actions Grid - Clay Cards with 3D depth */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Arena */}
                            {onOpenArena && (
                                <motion.button
                                    onClick={() => { playSound('click'); vibrate(15); onOpenArena(); }}
                                    className="p-4 rounded-2xl relative clay-card-cyan card-float-3d"
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    whileTap={{ scale: 0.97, y: 2 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                        <motion.span
                                            className="w-1.5 h-1.5 rounded-full bg-green-400"
                                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{ background: 'linear-gradient(135deg, #ff6b35, #ff0080)', color: '#fff' }}>
                                            LIVE
                                        </span>
                                    </div>
                                    <motion.span
                                        className="text-2xl block mb-1"
                                        animate={{ rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    >
                                        🌍
                                    </motion.span>
                                    <span className="text-white font-bold text-sm block">Global Arena</span>
                                    <span className="text-cyan-300/70 text-xs block">1v1 Battles</span>
                                    <span className="text-cyan-400 text-[10px] font-semibold mt-1 block">🎮 10 FREE matches/day</span>
                                </motion.button>
                            )}

                            {/* Fashion Show */}
                            {onStartFashionShow && (
                                <motion.button
                                    onClick={() => { playSound('click'); vibrate(15); onStartFashionShow(); }}
                                    className="p-4 rounded-2xl clay-card-purple card-float-3d"
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    whileTap={{ scale: 0.97, y: 2 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.15 }}
                                >
                                    <motion.span
                                        className="text-2xl block mb-1"
                                        animate={{ y: [0, -3, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        🎭
                                    </motion.span>
                                    <span className="text-white font-bold text-sm block">Fashion Show</span>
                                    <span className="text-purple-300/70 text-xs">Battle Friends</span>
                                </motion.button>
                            )}

                            {/* Challenges - Clay card with 3D effect */}
                            <motion.button
                                onClick={() => { playSound('click'); vibrate(15); onShowWeeklyChallenge?.(); }}
                                className="p-4 rounded-2xl col-span-2 clay-card card-float-3d"
                                style={{
                                    background: 'linear-gradient(145deg, rgba(59,130,246,0.12) 0%, rgba(16,185,129,0.08) 100%)'
                                }}
                                whileHover={{ scale: 1.01, y: -3 }}
                                whileTap={{ scale: 0.98, y: 1 }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex items-center justify-around">
                                    <motion.div
                                        className="text-center flex-1"
                                        animate={{ y: [0, -2, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                                    >
                                        <span className="text-2xl block">⚡</span>
                                        <p className="text-white font-bold text-xs">Daily</p>
                                        <p className="text-blue-300 text-[10px] font-semibold">1 FREE scan/day</p>
                                    </motion.div>
                                    <motion.div
                                        className="text-center px-3"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <span className="text-3xl block">🏆</span>
                                        <p className="text-white font-bold text-sm">Challenges</p>
                                    </motion.div>
                                    <motion.div
                                        className="text-center flex-1"
                                        animate={{ y: [0, -2, 0] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                    >
                                        <span className="text-2xl block">🌟</span>
                                        <p className="text-white font-bold text-xs">Weekly</p>
                                        <p className="text-emerald-300 text-[10px] font-semibold">1 FREE scan/week</p>
                                    </motion.div>
                                </div>
                            </motion.button>
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

            {/* Mode Drawer - Animated with Stagger */}
            <AnimatePresence>
                {showModeDrawer && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 z-[60]"
                            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModeDrawer(false)}
                        />

                        {/* Drawer */}
                        <motion.div
                            className="fixed bottom-0 left-0 right-0 z-[60] w-full max-w-md mx-auto p-5 pb-8 rounded-t-3xl glass-heavy"
                            style={{
                                background: 'linear-gradient(180deg, rgba(30,30,45,0.98) 0%, rgba(20,20,32,0.99) 100%)'
                            }}
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={{ top: 0, bottom: 0.5 }}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100) setShowModeDrawer(false)
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Handle */}
                            <motion.div
                                className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4"
                                initial={{ width: 0 }}
                                animate={{ width: 40 }}
                                transition={{ delay: 0.1 }}
                            />

                            {/* Header */}
                            <motion.div
                                className="text-center mb-5"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h3 className="text-white text-lg font-bold mb-1">Choose AI Mode</h3>
                                <p className="text-white/50 text-sm">How should we rate your fit?</p>
                            </motion.div>

                            {/* Mode Grid - Staggered animation */}
                            <div className="grid grid-cols-4 gap-2">
                                {MODES.map((m, index) => (
                                    <motion.button
                                        key={m.id}
                                        onClick={() => {
                                            playSound('click')
                                            vibrate([15, 10, 25])
                                            setTimeout(() => {
                                                setMode(m.id)
                                                setEventMode(false)
                                                setDailyChallengeMode?.(false)
                                                setShowModeDrawer(false)
                                            }, 150)
                                        }}
                                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl relative overflow-hidden ${mode === m.id ? 'ring-2' : ''}`}
                                        style={{
                                            background: `${m.color}15`,
                                            ringColor: m.color
                                        }}
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            y: 0,
                                            transition: {
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20,
                                                delay: index * 0.03
                                            }
                                        }}
                                        whileHover={{ scale: 1.08, rotateY: 5 }}
                                        whileTap={{ scale: 0.92 }}
                                        aria-label={`${m.label} mode - ${m.desc}`}
                                    >
                                        {/* Glow on selected */}
                                        {mode === m.id && (
                                            <motion.div
                                                className="absolute inset-0 rounded-xl pointer-events-none"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                style={{
                                                    boxShadow: `inset 0 0 15px ${m.glow}, 0 0 15px ${m.glow}`
                                                }}
                                            />
                                        )}
                                        <motion.span
                                            className="text-2xl relative z-10"
                                            animate={mode === m.id ? {
                                                scale: [1, 1.2, 1],
                                                rotate: [0, 10, -10, 0]
                                            } : {}}
                                            transition={{ duration: 0.4 }}
                                        >
                                            {m.emoji}
                                        </motion.span>
                                        <span className="text-[11px] font-bold text-white/90 relative z-10">{m.label}</span>
                                    </motion.button>
                                ))}
                            </div>

                            {/* Meet The Judges */}
                            <motion.button
                                onClick={() => {
                                    setShowModeDrawer(false)
                                    onNavigate?.('judges')
                                }}
                                className="w-full py-3 text-cyan-400 text-sm font-bold mt-4 flex items-center justify-center gap-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <span>👥</span>
                                <span>Meet Your AI Judges</span>
                                <span className="text-cyan-400/50">→</span>
                            </motion.button>

                            <motion.button
                                onClick={() => setShowModeDrawer(false)}
                                className="w-full py-2 text-white/40 text-sm font-medium"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                Cancel
                            </motion.button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

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
