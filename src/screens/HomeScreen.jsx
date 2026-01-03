import React, { useState, useRef, useCallback, useEffect, useMemo, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'
import { formatTimeRemaining } from '../utils/dateUtils'
import { LIMITS } from '../config/constants'

// Lazy load 3D particle field for performance
const ParticleField = lazy(() => import('../components/3d/ParticleField').then(m => ({ default: m.ParticleFieldLight })))

// ============================================
// SINGLE-SCREEN ONBOARDING - Zero friction first impression
// ============================================
const OnboardingOverlay = ({ onComplete }) => {
    const [isExiting, setIsExiting] = useState(false)

    const handleStart = () => {
        playSound('click')
        vibrate([20, 15, 30])
        setIsExiting(true)
        setTimeout(() => {
            localStorage.setItem('fitrate_onboarded', 'true')
            onComplete()
        }, 400)
    }

    return (
        <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
            style={{
                background: 'linear-gradient(180deg, #0d0a1a 0%, #1a0f2e 50%, #0a0610 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isExiting ? 0 : 1 }}
            transition={{ duration: 0.4 }}
        >
            {/* Animated background glow */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle at 50% 40%, rgba(0,212,255,0.2) 0%, transparent 50%)'
                }}
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Floating particles */}
            {Array.from({ length: 15 }).map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full"
                    style={{
                        background: i % 3 === 0 ? '#00d4ff' : i % 3 === 1 ? '#8b5cf6' : '#fff',
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`,
                        boxShadow: `0 0 8px ${i % 3 === 0 ? '#00d4ff' : '#8b5cf6'}`
                    }}
                    animate={{
                        y: [0, -20, 0],
                        opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                    }}
                />
            ))}

            <div className="w-full max-w-sm text-center relative z-10">
                {/* Hero emoji with glow */}
                <motion.div
                    className="text-[100px] mb-6 inline-block"
                    style={{
                        filter: 'drop-shadow(0 0 40px rgba(0,212,255,0.5))'
                    }}
                    animate={{
                        y: [0, -12, 0],
                        rotate: [0, 3, 0, -3, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                >
                    📸
                </motion.div>

                {/* Main headline */}
                <motion.h1
                    className="text-3xl font-black mb-3 text-white"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    Snap your outfit
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    className="text-xl text-gray-300 mb-5"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Let's see what you've got 👀
                </motion.p>

                {/* Free scans badge - KEY VALUE PROP */}
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                    style={{
                        background: 'rgba(0,212,255,0.15)',
                        border: '1px solid rgba(0,212,255,0.3)'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.35 }}
                >
                    <span className="text-lg">⚡</span>
                    <span className="text-white/80 font-medium">2 FREE scans every day</span>
                </motion.div>

                {/* Big CTA Button */}
                <motion.button
                    onClick={handleStart}
                    className="w-full py-5 rounded-2xl font-black text-xl relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                        color: '#000',
                        boxShadow: '0 8px 40px rgba(0,212,255,0.4), 0 0 80px rgba(0,255,136,0.2)'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 12px 50px rgba(0,212,255,0.5), 0 0 100px rgba(0,255,136,0.3)' }}
                    whileTap={{ scale: 0.98 }}
                >
                    {/* Shimmer effect */}
                    <motion.div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
                        }}
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}
                    />
                    <span className="relative z-10">Let's Go! 🚀</span>
                </motion.button>

                {/* Privacy note */}
                <motion.p
                    className="mt-6 text-gray-500 text-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    🔒 Your photos stay private • Auto-deleted
                </motion.p>
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
    { id: 'nice', emoji: '😇', label: 'Nice', desc: 'Your biggest fan', color: '#00d4ff', glow: 'rgba(0,212,255,0.4)', cta: 'HYPE MY FIT' },
    { id: 'roast', emoji: '🔥', label: 'Roast', desc: 'Friendship-ending honesty', color: '#ff6b35', glow: 'rgba(255,107,53,0.4)', cta: 'ROAST MY FIT' },
    { id: 'honest', emoji: '📊', label: 'Honest', desc: 'No cap, real talk', color: '#3b82f6', glow: 'rgba(59,130,246,0.4)', cta: 'RATE MY FIT' },
    { id: 'savage', emoji: '💀', label: 'Savage', desc: 'Emotional damage loading', color: '#8b00ff', glow: 'rgba(139,0,255,0.4)', cta: 'DESTROY MY FIT' },
    { id: 'rizz', emoji: '😏', label: 'Rizz', desc: 'Would they swipe right?', color: '#ff69b4', glow: 'rgba(255,105,180,0.4)', cta: 'RATE MY RIZZ' },
    { id: 'celeb', emoji: '⭐', label: 'Celebrity', desc: 'A-list judgment', color: '#ffd700', glow: 'rgba(255,215,0,0.4)', cta: 'JUDGE MY FIT' },
    { id: 'aura', emoji: '🔮', label: 'Aura', desc: 'Reading your energy', color: '#9b59b6', glow: 'rgba(155,89,182,0.4)', cta: 'READ MY AURA' },
    { id: 'chaos', emoji: '🎪', label: 'Chaos', desc: 'AI off its meds', color: '#ff6b6b', glow: 'rgba(255,107,107,0.4)', cta: 'CHAOS MY FIT' },
    { id: 'y2k', emoji: '💎', label: 'Y2K', desc: 'Paris Hilton energy', color: '#ff69b4', glow: 'rgba(255,105,180,0.4)', cta: 'RATE MY Y2K' },
    { id: 'villain', emoji: '🖤', label: 'Villain', desc: 'Main character threat', color: '#7c3aed', glow: 'rgba(124,58,237,0.4)', cta: 'VILLAIN CHECK' },
    { id: 'coquette', emoji: '🎀', label: 'Coquette', desc: 'Soft girl aesthetic', color: '#f9a8d4', glow: 'rgba(249,168,212,0.4)', cta: 'RATE MY SOFT' },
    { id: 'hypebeast', emoji: '👟', label: 'Hypebeast', desc: 'Certified drip doctor', color: '#f97316', glow: 'rgba(249,115,22,0.4)', cta: 'CHECK MY DRIP' }
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

// ============================================
// MODE CAROUSEL - Swipeable peek carousel
// Shows current mode + neighbors for quick switching
// ============================================
const ModeCarousel = ({ currentModeId, onModeChange, onOpenDrawer }) => {
    const currentIndex = MODES.findIndex(m => m.id === currentModeId) || 0

    // Get prev/next indices (wrapping)
    const prevIndex = (currentIndex - 1 + MODES.length) % MODES.length
    const nextIndex = (currentIndex + 1) % MODES.length

    const prevMode = MODES[prevIndex]
    const currentMode = MODES[currentIndex]
    const nextMode = MODES[nextIndex]

    const handleSwipe = (direction) => {
        playSound('click')
        vibrate([10, 5, 15])
        if (direction === 'left') {
            onModeChange(nextMode.id)
        } else {
            onModeChange(prevMode.id)
        }
    }

    return (
        <div className="w-full max-w-xs mb-4">
            {/* Carousel Container */}
            <motion.div
                className="relative flex items-center justify-center gap-2 py-3 px-4 rounded-2xl overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${currentMode.color}15 0%, ${currentMode.color}05 100%)`,
                    border: `1px solid ${currentMode.color}30`
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.3}
                onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 50) {
                        handleSwipe(info.offset.x > 0 ? 'right' : 'left')
                    }
                }}
            >
                {/* Left neighbor (dimmed) */}
                <motion.button
                    onClick={() => handleSwipe('right')}
                    className="flex flex-col items-center opacity-40 hover:opacity-60 transition-opacity"
                    whileTap={{ scale: 0.9 }}
                >
                    <span className="text-2xl">{prevMode.emoji}</span>
                </motion.button>

                {/* Current mode (center, prominent) */}
                <motion.div
                    className="flex-1 flex flex-col items-center px-4"
                    key={currentMode.id}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    <motion.span
                        className="text-4xl mb-1"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.3 }}
                    >
                        {currentMode.emoji}
                    </motion.span>
                    <span className="text-white font-bold text-sm">{currentMode.label}</span>
                    <span
                        className="text-xs font-medium mt-0.5"
                        style={{ color: currentMode.color }}
                    >
                        {currentMode.desc}
                    </span>
                </motion.div>

                {/* Right neighbor (dimmed) */}
                <motion.button
                    onClick={() => handleSwipe('left')}
                    className="flex flex-col items-center opacity-40 hover:opacity-60 transition-opacity"
                    whileTap={{ scale: 0.9 }}
                >
                    <span className="text-2xl">{nextMode.emoji}</span>
                </motion.button>
            </motion.div>

            {/* Swipe hint + drawer link */}
            <div className="flex items-center justify-between mt-2 px-2">
                <span className="text-gray-500 text-xs">← swipe →</span>
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(10)
                        onOpenDrawer()
                    }}
                    className="text-gray-400 text-xs hover:text-white/70 transition-colors flex items-center gap-1"
                >
                    <span>All 12 Modes</span>
                    <span>👥</span>
                </button>
            </div>
        </div>
    )
}


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
    onOpenArena,
    dailyLeaderboard = [],
    onShowChallenges,
    onShowJudges
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
    const isIOS = () => {
        // Modern iPads report as Mac, so also check for touch + Safari
        const isAppleDevice = /iPhone|iPad|iPod/i.test(navigator.userAgent)
        const isMacWithTouch = /Macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1
        return (isAppleDevice || isMacWithTouch) && !window.MSStream
    }

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
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
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

        // Allow camera if:
        // 1. Has daily scans remaining
        // 2. Is Pro
        // 3. Has purchased scans
        // 4. Is Daily Challenge (1 free/day separate quota)
        // 5. Is Weekly Challenge (1 free/week separate quota - checked above)
        // 6. Is Fashion Show (host/join is free)
        const canScan = scansRemaining > 0 || isPro || purchasedScans > 0 ||
            dailyChallengeMode || (eventMode && !freeEventEntryUsed) || fashionShowName

        if (canScan) {
            proceedToCamera()
        } else {
            onShowPaywall()
        }
    }

    const proceedToCamera = () => {
        // For challenge modes: force camera-only (no gallery pick)
        const isChallengeMode = dailyChallengeMode || eventMode || fashionShowName

        if (isAndroid()) {
            if (isChallengeMode) {
                // Skip modal, go straight to camera for challenges
                document.getElementById('androidCameraInput')?.click()
            } else {
                setShowAndroidPhotoModal(true)
            }
        } else if (isIOS()) {
            // iOS: Use camera input for challenges, native picker (all options) otherwise
            if (isChallengeMode) {
                document.getElementById('androidCameraInput')?.click()
            } else {
                // Native file picker shows: Take Photo, Photo Library, Browse, etc.
                fileInputRef.current?.click()
            }
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
        if (isPro) return '∞ Unlimited'
        if (purchasedScans > 0) return `${purchasedScans} Bonus Scans`
        return `${scansRemaining}/2 daily`
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
                            onClick={() => { playSound('click'); vibrate(30); timerCapture(); }}
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
                    className="relative w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 overflow-visible"
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
                    <span className="text-gray-400 text-xs">• Get More</span>
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
                    <p className="text-gray-300 text-sm">Your friend scored {challengeScore}/100</p>
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
            {/* SOCIAL PROOF - Shows competition activity */}
            {/* ============================================ */}
            {dailyLeaderboard.length > 0 && !challengeScore && !fashionShowName && (
                <button
                    onClick={() => { playSound('click'); vibrate(15); onShowChallenges?.(); }}
                    className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-full transition-all active:scale-95"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-yellow-400">🏆</span>
                    <span className="text-white/70 text-sm font-medium">
                        {dailyLeaderboard.length} people competing today
                    </span>
                    <span className="text-gray-400 text-xs">→</span>
                </button>
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
                            <p className="text-gray-300 text-sm">Fresh scans drop at midnight ⏰</p>
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

                        <div className="text-gray-400 text-sm mb-2">or play for free:</div>

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
                                <p className="text-gray-300 text-xs">
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
                                    className="absolute top-2 right-2 text-gray-400 text-xs px-2 py-1 rounded-full hover:text-white/70"
                                    style={{ background: 'rgba(255,255,255,0.1)' }}
                                >
                                    ✕ Exit
                                </button>
                            </div>
                        )}

                        {/* Single breathing ring - NOW SWIPEABLE FOR MODE CHANGES */}
                        <div className="relative mb-3">
                            {/* Premium outer halo */}
                            <div
                                className="cta-halo"
                                style={{ '--cta-glow-color': dailyChallengeMode ? 'rgba(59,130,246,0.2)' : eventMode ? 'rgba(16,185,129,0.2)' : `${currentMode.color}20` }}
                            />

                            {/* Rotating gradient glow ring */}
                            <div
                                className="cta-glow-ring"
                                style={{ '--cta-glow-color': dailyChallengeMode ? 'rgba(59,130,246,0.4)' : eventMode ? 'rgba(16,185,129,0.4)' : `${currentMode.color}40` }}
                            />

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

                            {/* Swipeable Button Container */}
                            <motion.div
                                className="relative"
                                drag={!dailyChallengeMode && !eventMode ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.3}
                                onDragEnd={(_, info) => {
                                    if (Math.abs(info.offset.x) > 50) {
                                        const currentIndex = MODES.findIndex(m => m.id === mode) || 0
                                        if (info.offset.x > 0) {
                                            // Swipe right = previous mode
                                            const prevIndex = (currentIndex - 1 + MODES.length) % MODES.length
                                            setMode(MODES[prevIndex].id)
                                        } else {
                                            // Swipe left = next mode
                                            const nextIndex = (currentIndex + 1) % MODES.length
                                            setMode(MODES[nextIndex].id)
                                        }
                                        playSound('click')
                                        vibrate([10, 5, 15])
                                    }
                                }}
                            >
                                {/* Peek mode indicators on sides - TAPPABLE */}
                                {!dailyChallengeMode && !eventMode && (() => {
                                    const currentIndex = MODES.findIndex(m => m.id === mode) || 0
                                    const prevMode = MODES[(currentIndex - 1 + MODES.length) % MODES.length]
                                    const nextMode = MODES[(currentIndex + 1) % MODES.length]
                                    return (
                                        <>
                                            {/* Left peek - TAPPABLE with name */}
                                            <motion.button
                                                onClick={() => {
                                                    setMode(prevMode.id)
                                                    playSound('click')
                                                    vibrate([10, 5, 15])
                                                }}
                                                className="absolute left-[-55px] top-1/2 -translate-y-1/2 flex flex-col items-center opacity-60 hover:opacity-90 transition-opacity"
                                                animate={{ x: [0, -3, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                whileTap={{ scale: 0.85 }}
                                            >
                                                <span className="text-2xl">{prevMode.emoji}</span>
                                                <span className="text-[9px] text-gray-400 font-medium mt-0.5">{prevMode.label}</span>
                                            </motion.button>
                                            {/* Right peek - TAPPABLE with name */}
                                            <motion.button
                                                onClick={() => {
                                                    setMode(nextMode.id)
                                                    playSound('click')
                                                    vibrate([10, 5, 15])
                                                }}
                                                className="absolute right-[-55px] top-1/2 -translate-y-1/2 flex flex-col items-center opacity-60 hover:opacity-90 transition-opacity"
                                                animate={{ x: [0, 3, 0] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                whileTap={{ scale: 0.85 }}
                                            >
                                                <span className="text-2xl">{nextMode.emoji}</span>
                                                <span className="text-[9px] text-gray-400 font-medium mt-0.5">{nextMode.label}</span>
                                            </motion.button>
                                        </>
                                    )
                                })()}

                                <motion.button
                                    onClick={handleStart}
                                    aria-label={dailyChallengeMode ? "Take a photo for daily challenge" : eventMode ? "Take a photo for weekly challenge" : "Take a photo to rate your outfit"}
                                    className="cta-alive cta-touch relative w-64 h-64 rounded-full flex flex-col items-center justify-center"
                                    style={{
                                        '--cta-glow-color': dailyChallengeMode ? 'rgba(59,130,246,0.3)' : eventMode ? 'rgba(16,185,129,0.3)' : `${currentMode.color}30`,
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
                                    key={currentMode.id}
                                    initial={{ scale: 0.95 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    {/* Inner gradient */}
                                    <motion.div
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
                                        key={`inner-${currentMode.id}`}
                                        initial={{ scale: 0.9, opacity: 0.8 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                    />

                                    {/* Icon - animates on mode change */}
                                    <motion.span
                                        className="cta-icon-shimmer relative text-6xl mb-2"
                                        key={`icon-${dailyChallengeMode ? 'daily' : eventMode ? 'event' : currentMode.id}`}
                                        initial={{ scale: 0.5, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                    >
                                        {dailyChallengeMode ? '⚡' : eventMode ? '🏆' : currentMode.emoji}
                                    </motion.span>

                                    {/* Main Text - Mode-specific CTA */}
                                    <motion.span
                                        className="relative text-white font-black text-xl tracking-wide text-center px-4"
                                        key={`cta-${currentMode.id}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {dailyChallengeMode
                                            ? 'DAILY CHALLENGE'
                                            : eventMode
                                                ? 'WEEKLY CHALLENGE'
                                                : currentMode.cta || 'RATE MY FIT'}
                                    </motion.span>

                                    {/* Mode indicator - Shows mode name */}
                                    <motion.span
                                        className="relative text-white/70 text-sm font-medium mt-1"
                                        key={`label-${currentMode.id}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        {dailyChallengeMode
                                            ? `${getDailyMode().emoji} ${getDailyMode().label}`
                                            : eventMode
                                                ? currentEvent?.theme || 'Beat the leaderboard!'
                                                : currentMode.label}
                                    </motion.span>

                                    {/* Swipe hint - subtle pulse then fade */}
                                    {!dailyChallengeMode && !eventMode && (
                                        <motion.span
                                            className="absolute bottom-5 text-gray-400 text-[11px] font-medium tracking-wider"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: [0, 0.6, 0.4] }}
                                            transition={{ delay: 0.8, duration: 2 }}
                                        >
                                            ← swipe →
                                        </motion.span>
                                    )}
                                </motion.button>
                            </motion.div>
                        </div>

                        {/* All Modes Link - Opens drawer for full selection */}
                        {!dailyChallengeMode && !eventMode && (
                            <div className="flex items-center gap-4 mb-2">
                                <button
                                    onClick={() => {
                                        playSound('click')
                                        vibrate(10)
                                        setShowModeDrawer(true)
                                    }}
                                    className="text-gray-300 text-xs hover:text-white/80 transition-colors flex items-center gap-1.5"
                                >
                                    <span>All 12 Modes</span>
                                    <span className="text-gray-400">→</span>
                                </button>
                                <span className="text-gray-600">•</span>
                                <button
                                    onClick={() => {
                                        playSound('click')
                                        vibrate(10)
                                        onShowJudges?.()
                                    }}
                                    className="text-purple-300 text-xs hover:text-purple-200 transition-colors flex items-center gap-1.5"
                                >
                                    <span>🎭 Meet the Judges</span>
                                </button>
                            </div>
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

                        {/* Value Prop - Clear differentiation */}
                        <div className="text-center mb-3">
                            <p className="text-gray-300 text-xs mb-1">
                                Get your rating, then dare friends to beat it
                            </p>
                            <p className="text-gray-400 text-[10px]">
                                🔒 Private • No account needed
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* MODALS */}
            {/* ============================================ */}

            {/* Android Photo Picker */}
            {
                showAndroidPhotoModal && (
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
                                {/* Hide gallery for challenges - camera only to prevent gaming */}
                                {!eventMode && !fashionShowName && !dailyChallengeMode && (
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
                                    className="w-full py-3 text-gray-400 text-sm font-medium mt-2"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

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
                                className="text-center mb-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h3 className="text-white text-lg font-bold mb-1">Choose AI Mode</h3>
                                <p className="text-gray-400 text-sm">How should we rate your fit?</p>
                            </motion.div>

                            {/* P3.3 — FEATURED MODE PREVIEW - Shows selected mode personality */}
                            {mode && (() => {
                                const currentModeData = MODES.find(m => m.id === mode) || MODES[0]
                                return (
                                    <motion.div
                                        className="mb-4 p-4 rounded-2xl text-center"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.15 }}
                                        style={{
                                            background: `linear-gradient(135deg, ${currentModeData.color}20 0%, ${currentModeData.color}08 100%)`,
                                            border: `1px solid ${currentModeData.color}40`,
                                            boxShadow: `0 0 20px ${currentModeData.glow}`
                                        }}
                                    >
                                        <span className="text-4xl inline-block mb-2">{currentModeData.emoji}</span>
                                        <p className="text-lg font-black text-white mb-1">{currentModeData.label} Mode</p>
                                        <p className="text-sm text-gray-300 italic">"{currentModeData.desc}"</p>
                                    </motion.div>
                                )
                            })()}

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
                                className="w-full py-2 text-gray-400 text-sm font-medium"
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
        </div >
    )
}
