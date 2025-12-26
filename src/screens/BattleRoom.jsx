import React, { useState, useEffect, useMemo, useRef } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'

/**
 * BattleRoom - Legendary 1v1 Outfit Battle Experience
 *
 * Super simple UX that grandpa/grandma/kids can use:
 * - Big, obvious buttons
 * - Clear step-by-step flow
 * - 24-hour countdown timer
 * - Auto-refresh for real-time updates
 * - Platform-specific camera handling
 *
 * URL Pattern: /b/:battleId (unique battle links)
 */

// Confetti for winner reveal
function ConfettiPiece({ delay, color, left }) {
    return (
        <div
            className="confetti-piece"
            style={{
                left: `${left}%`,
                animationDelay: `${delay}s`,
                width: Math.random() > 0.5 ? '10px' : '8px',
                height: Math.random() > 0.5 ? '10px' : '8px',
                background: color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
        />
    )
}

export default function BattleRoom({
    battleId,
    battleData,
    userId,
    isCreator,
    onImageSelected,
    onShare,
    onHome,
    loading
}) {
    // State
    const [showConfetti, setShowConfetti] = useState(false)
    const [revealed, setRevealed] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(() => {
        if (battleData?.expiresAt) {
            return Math.max(0, new Date(battleData.expiresAt).getTime() - Date.now())
        }
        // Default 24 hours if no expiresAt
        return 24 * 60 * 60 * 1000
    })

    // Camera state
    const [showCamera, setShowCamera] = useState(false)
    const [showAndroidPhotoModal, setShowAndroidPhotoModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    // Battle state
    const isCompleted = battleData?.status === 'completed'
    const isExpired = timeRemaining <= 0 && !isCompleted
    const creatorScore = battleData?.creatorScore || 0
    const responderScore = battleData?.responderScore || 0
    const battleMode = battleData?.mode || 'nice'

    // Platform detection
    const isAndroid = () => /Android/i.test(navigator.userAgent)
    const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream

    // Mode helpers
    const getModeEmoji = (m) => {
        const emojis = { nice: '😇', roast: '🔥', honest: '📊', savage: '💀', rizz: '😏', celeb: '⭐', aura: '🔮', chaos: '🎪', y2k: '💎', villain: '🖤', coquette: '🎀', hypebeast: '👟' }
        return emojis[m] || '😇'
    }
    const getModeLabel = (m) => {
        const labels = { nice: 'Nice', roast: 'Roast', honest: 'Honest', savage: 'Savage', rizz: 'Rizz', celeb: 'Celebrity', aura: 'Aura', chaos: 'Chaos', y2k: 'Y2K', villain: 'Villain', coquette: 'Coquette', hypebeast: 'Hypebeast' }
        return labels[m] || 'Nice'
    }

    // Sync timeRemaining when battleData changes
    useEffect(() => {
        if (battleData?.expiresAt) {
            const remaining = Math.max(0, new Date(battleData.expiresAt).getTime() - Date.now())
            setTimeRemaining(remaining)
        }
    }, [battleData?.expiresAt])

    // Countdown timer - update every second
    useEffect(() => {
        if (isCompleted) return // Don't count down if battle is done
        const interval = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [isCompleted])

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
        }
    }, [])

    // Format time remaining - grandpa-friendly
    const formatTime = (ms) => {
        if (ms <= 0) return 'Time\'s Up!'
        const hours = Math.floor(ms / (1000 * 60 * 60))
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((ms % (1000 * 60)) / 1000)

        if (hours > 0) {
            return `${hours}h ${minutes}m left`
        } else if (minutes > 0) {
            return `${minutes}m ${seconds}s left`
        } else {
            return `${seconds}s left!`
        }
    }

    // Determine winner
    const creatorWon = creatorScore > responderScore
    const responderWon = responderScore > creatorScore
    const tied = creatorScore === responderScore && isCompleted
    const diff = Math.round(Math.abs(creatorScore - responderScore) * 10) / 10

    // Colors
    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'
    const waitingColor = '#00d4ff'
    const battlePurple = '#8b5cf6'

    // Confetti pieces
    const confettiPieces = useMemo(() => {
        const colors = ['#00ff88', '#00d4ff', '#fff', '#ffd700', '#ff69b4']
        return Array.from({ length: 40 }, (_, i) => ({
            id: i,
            color: colors[i % colors.length],
            left: Math.random() * 100,
            delay: Math.random() * 0.5
        }))
    }, [])

    // Reveal animation when completed
    useEffect(() => {
        if (isCompleted && !revealed) {
            const timer = setTimeout(() => {
                setRevealed(true)
                setShowConfetti(true)
                playSound('celebrate')
                vibrate([100, 50, 100, 50, 200])
                setTimeout(() => setShowConfetti(false), 3500)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isCompleted, revealed])

    // Handle file upload
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file || isProcessing) return

        if (file.size > 10 * 1024 * 1024) {
            playSound('error')
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
            onImageSelected?.(imageData, 'battle')
        } catch (err) {
            console.error('Image processing error:', err)
            playSound('error')
        } finally {
            setIsProcessing(false)
        }
    }

    // Start camera - platform specific
    const startCamera = async () => {
        playSound('click')
        vibrate(20)

        if (isAndroid()) {
            setShowAndroidPhotoModal(true)
        } else if (isIOS()) {
            document.getElementById('battleCameraInput')?.click()
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1080 }, height: { ideal: 1920 } }
                })
                streamRef.current = stream
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                }
                setShowCamera(true)
            } catch (err) {
                console.error('[Battle] Camera error:', err)
                document.getElementById('battleGalleryInput')?.click()
            }
        }
    }

    // Android handlers
    const handleAndroidTakePhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        document.getElementById('battleCameraInput')?.click()
    }

    const handleAndroidUploadPhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        document.getElementById('battleGalleryInput')?.click()
    }

    // Capture photo (desktop)
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
            const file = new File([blob], 'battle-photo.jpg', { type: 'image/jpeg' })
            stopCamera()
            playSound('success')
            vibrate(50)
            onImageSelected?.(file, 'battle')
        }, 'image/jpeg', 0.9)
    }

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        setShowCamera(false)
    }

    // Loading state
    if (loading && !battleData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4"
                style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2a 50%, #0a0a1a 100%)' }}>
                <div className="text-7xl animate-pulse mb-4">⚔️</div>
                <p className="text-white/60 text-lg">Loading Battle...</p>
            </div>
        )
    }

    // Camera view (desktop)
    if (showCamera) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <video ref={videoRef} autoPlay playsInline muted className="flex-1 object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                <div className="absolute top-safe left-0 right-0 p-4 text-center">
                    <div className="inline-block px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                        <span className="text-white font-bold">⚔️ Battle Mode</span>
                        <span className="text-white/60 ml-2 text-sm">{getModeEmoji(battleMode)} {getModeLabel(battleMode)}</span>
                    </div>
                </div>

                <div className="absolute bottom-safe left-0 right-0 p-6 flex items-center justify-center gap-6">
                    <button onClick={stopCamera}
                        className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl">
                        ✕
                    </button>
                    <button onClick={capturePhoto}
                        className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                        <div className="w-16 h-16 rounded-full border-4 border-purple-500" />
                    </button>
                    <div className="w-14 h-14" />
                </div>
            </div>
        )
    }

    // =====================================================
    // EXPIRED STATE - Battle link no longer valid
    // =====================================================
    if (isExpired) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #1a0a0a 0%, #0a0a1a 50%, #1a0a0a 100%)' }}>

                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 40%, rgba(255,68,68,0.15) 0%, transparent 60%)' }} />

                <div className="text-8xl mb-6">⏰</div>
                <h1 className="text-3xl font-black text-red-400 mb-2">Battle Expired</h1>
                <p className="text-white/50 text-lg mb-8 max-w-xs">
                    This battle has ended. Start a new one!
                </p>

                <button onClick={() => { playSound('click'); vibrate(20); onHome?.(); }}
                    className="w-full max-w-xs py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.97]"
                    style={{
                        background: `linear-gradient(135deg, ${battlePurple} 0%, #a855f7 100%)`,
                        color: '#fff',
                        boxShadow: `0 8px 30px ${battlePurple}40`
                    }}>
                    ⚔️ Start New Battle
                </button>
            </div>
        )
    }

    // =====================================================
    // COMPLETED STATE - Show Results!
    // =====================================================
    if (isCompleted) {
        const userWon = isCreator ? creatorWon : responderWon
        const userLost = isCreator ? responderWon : creatorWon
        const accentColor = userWon ? winColor : userLost ? loseColor : tieColor

        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
                style={{
                    background: userWon
                        ? 'linear-gradient(180deg, #0a1a0a 0%, #001a00 50%, #0a1a0a 100%)'
                        : userLost
                            ? 'linear-gradient(180deg, #1a0a0a 0%, #1a0000 50%, #1a0a0a 100%)'
                            : 'linear-gradient(180deg, #1a1a0a 0%, #1a1a00 50%, #1a1a0a 100%)'
                }}>

                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: `radial-gradient(circle at 50% 40%, ${accentColor}25 0%, transparent 60%)` }} />

                {showConfetti && confettiPieces.map(piece => <ConfettiPiece key={piece.id} {...piece} />)}

                {/* Result Icon */}
                <div className="text-8xl mb-4"
                    style={{
                        opacity: revealed ? 1 : 0,
                        transform: revealed ? 'scale(1)' : 'scale(0)',
                        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: `drop-shadow(0 0 30px ${accentColor})`
                    }}>
                    {userWon ? '🏆' : userLost ? '💀' : '🤝'}
                </div>

                {/* Result Title */}
                <h1 className={`text-4xl font-black mb-2 ${userWon ? 'legendary-text' : ''}`}
                    style={{
                        color: userWon ? undefined : accentColor,
                        opacity: revealed ? 1 : 0,
                        transition: 'opacity 0.5s ease-out 0.2s'
                    }}>
                    {userWon ? 'YOU WON!' : userLost ? 'YOU LOST' : "IT'S A TIE!"}
                </h1>

                {/* Score Comparison */}
                <div className="flex items-center gap-8 my-8"
                    style={{
                        opacity: revealed ? 1 : 0,
                        transform: revealed ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
                    }}>

                    {/* Creator */}
                    <div className="flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-3 overflow-hidden"
                            style={{
                                background: creatorWon ? `${winColor}20` : 'rgba(255,255,255,0.08)',
                                border: `4px solid ${creatorWon ? winColor : 'rgba(255,255,255,0.2)'}`,
                                boxShadow: creatorWon ? `0 0 40px ${winColor}40` : 'none'
                            }}>
                            {battleData?.creatorThumb ? (
                                <img src={battleData.creatorThumb} alt="Creator" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl">{isCreator ? '👤' : '🎯'}</span>
                            )}
                        </div>
                        <span className="text-sm text-white/50 font-bold uppercase tracking-wider mb-1">
                            {isCreator ? 'You' : 'Challenger'}
                        </span>
                        <span className="text-4xl font-black" style={{ color: creatorWon ? winColor : '#fff' }}>
                            {Math.round(creatorScore)}
                        </span>
                    </div>

                    <div className="text-2xl font-black text-white/30">VS</div>

                    {/* Responder */}
                    <div className="flex flex-col items-center">
                        <div className="w-28 h-28 rounded-full flex items-center justify-center mb-3 overflow-hidden"
                            style={{
                                background: responderWon ? `${winColor}20` : 'rgba(255,255,255,0.08)',
                                border: `4px solid ${responderWon ? winColor : 'rgba(255,255,255,0.2)'}`,
                                boxShadow: responderWon ? `0 0 40px ${winColor}40` : 'none'
                            }}>
                            {battleData?.responderThumb ? (
                                <img src={battleData.responderThumb} alt="Responder" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-4xl">{isCreator ? '🎯' : '👤'}</span>
                            )}
                        </div>
                        <span className="text-sm text-white/50 font-bold uppercase tracking-wider mb-1">
                            {isCreator ? 'Opponent' : 'You'}
                        </span>
                        <span className="text-4xl font-black" style={{ color: responderWon ? winColor : '#fff' }}>
                            {Math.round(responderScore)}
                        </span>
                    </div>
                </div>

                {/* Point Difference */}
                <p className="text-xl mb-8" style={{
                    color: 'rgba(255,255,255,0.7)',
                    opacity: revealed ? 1 : 0,
                    transition: 'opacity 0.5s ease-out 0.5s'
                }}>
                    {tied
                        ? <span>Exactly tied! <strong style={{ color: tieColor }}>Fate decides.</strong></span>
                        : <span>Won by <strong style={{ color: accentColor }}>{diff} points</strong></span>
                    }
                </p>

                {/* CTAs */}
                <div className="flex flex-col gap-4 w-full max-w-xs" style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease-out 0.6s'
                }}>
                    <button onClick={() => { playSound('click'); vibrate(20); onShare?.(); }}
                        className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.97]"
                        style={{
                            background: `linear-gradient(135deg, ${accentColor} 0%, ${userWon ? '#00d4ff' : '#ff8800'} 100%)`,
                            color: userWon ? '#000' : '#fff',
                            boxShadow: `0 8px 30px ${accentColor}40`
                        }}>
                        {userWon ? '🏆 Share Your Win' : '⚔️ Rematch!'}
                    </button>

                    <button onClick={() => { playSound('click'); vibrate(10); onHome?.(); }}
                        className="w-full py-4 rounded-xl font-medium transition-all active:scale-[0.97]"
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.8)',
                            border: '1px solid rgba(255,255,255,0.15)'
                        }}>
                        🏠 Back to Home
                    </button>
                </div>
            </div>
        )
    }

    // =====================================================
    // WAITING STATE - Creator or Responder perspective
    // =====================================================
    return (
        <div className="min-h-screen flex flex-col px-4 pt-safe pb-8 relative overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #0a0a1a 0%, #1a0a2a 50%, #0a0a1a 100%)' }}>

            {/* Hidden file inputs */}
            <input type="file" accept="image/*" capture="environment" id="battleCameraInput"
                onChange={handleFileUpload} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }} />
            <input type="file" accept="image/*" id="battleGalleryInput"
                onChange={handleFileUpload} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }} />

            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(circle at 50% 30%, ${battlePurple}30 0%, transparent 60%)` }} />

            {/* Header with countdown */}
            <div className="flex items-center justify-between py-4 relative z-10">
                <button onClick={() => { playSound('click'); onHome?.(); }} className="text-white/50 text-sm font-medium">
                    ← Exit
                </button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20">
                    <span className="text-lg">⏰</span>
                    <span className="text-sm font-bold text-white/80">{formatTime(timeRemaining)}</span>
                </div>
                <button onClick={() => { playSound('click'); onShare?.(); }} className="text-white/50 text-sm font-medium">
                    Share 📤
                </button>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center text-center">

                {/* Battle icon */}
                <div className="text-8xl mb-4" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                    ⚔️
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black mb-2" style={{ color: battlePurple }}>
                    {isCreator ? 'Battle Sent!' : '1v1 Outfit Battle'}
                </h1>

                {/* Mode badge */}
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 mb-6">
                    <span className="text-xl">{getModeEmoji(battleMode)}</span>
                    <span className="text-base font-bold text-white/80">{getModeLabel(battleMode)} Mode</span>
                </div>

                {/* Explainer for responder - super simple */}
                {!isCreator && (
                    <div className="bg-white/5 rounded-2xl p-5 mb-6 w-full max-w-sm border border-white/10">
                        <p className="text-lg text-white/80 leading-relaxed">
                            Your friend scored <strong className="text-white">{Math.round(creatorScore)}</strong> points.
                            <br />
                            <span className="text-white/60">Take a photo of your outfit to battle!</span>
                        </p>
                    </div>
                )}

                {/* Score cards */}
                <div className="flex items-center gap-6 mb-8 w-full max-w-sm justify-center">

                    {/* Creator score */}
                    <div className="flex-1 bg-white/5 rounded-2xl p-5 border border-white/10">
                        <div className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center overflow-hidden"
                            style={{
                                background: battlePurple + '30',
                                border: `3px solid ${battlePurple}`
                            }}>
                            {battleData?.creatorThumb ? (
                                <img src={battleData.creatorThumb} alt="Creator" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl">{isCreator ? '👤' : '🎯'}</span>
                            )}
                        </div>
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                            {isCreator ? 'Your Score' : 'Their Score'}
                        </p>
                        <p className="text-4xl font-black" style={{ color: battlePurple }}>
                            {Math.round(creatorScore)}
                        </p>
                    </div>

                    {/* VS */}
                    <div className="text-xl font-black text-white/30">VS</div>

                    {/* Responder slot */}
                    <div className="flex-1 bg-white/5 rounded-2xl p-5 border border-dashed border-white/20">
                        <div className="w-16 h-16 mx-auto rounded-full mb-3 flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '3px dashed rgba(255,255,255,0.2)' }}>
                            <span className="text-2xl">❓</span>
                        </div>
                        <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                            {isCreator ? 'Opponent' : 'Your Score'}
                        </p>
                        <p className="text-2xl font-black text-white/30">
                            ???
                        </p>
                    </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-4 w-full max-w-sm">
                    {isCreator ? (
                        <>
                            {/* Creator waiting - auto-refresh message */}
                            <div className="text-center py-3">
                                <p className="text-white/50 text-sm mb-2">
                                    ⏳ Waiting for someone to accept...
                                </p>
                                <p className="text-white/30 text-xs">
                                    {loading ? '🔄 Checking...' : 'Auto-refreshing every 10 seconds'}
                                </p>
                            </div>

                            <button onClick={() => { playSound('click'); vibrate(20); onShare?.(); }}
                                className="w-full py-5 rounded-2xl font-black text-xl transition-all active:scale-[0.97]"
                                style={{
                                    background: `linear-gradient(135deg, ${battlePurple} 0%, #a855f7 100%)`,
                                    color: '#fff',
                                    boxShadow: `0 8px 30px ${battlePurple}40`
                                }}>
                                📤 Share Battle Link
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Responder CTA - big and obvious */}
                            <button onClick={startCamera} disabled={isProcessing}
                                className="w-full py-6 rounded-2xl font-black text-2xl transition-all active:scale-[0.97] disabled:opacity-50"
                                style={{
                                    background: `linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)`,
                                    color: '#000',
                                    boxShadow: '0 8px 40px rgba(0,255,136,0.4)'
                                }}>
                                {isProcessing ? '⏳ Processing...' : '📸 Snap Your Outfit'}
                            </button>

                            <p className="text-center text-white/40 text-sm">
                                Take a photo and see who wins!
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Android Photo Picker Modal */}
            {showAndroidPhotoModal && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center"
                    style={{ background: 'rgba(0,0,0,0.8)' }}
                    onClick={() => setShowAndroidPhotoModal(false)}>
                    <div className="w-full max-w-md p-6 pb-10 rounded-t-3xl"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,40,0.98) 0%, rgba(20,20,28,0.99) 100%)',
                            boxShadow: '0 -4px 30px rgba(0,0,0,0.5)'
                        }}
                        onClick={e => e.stopPropagation()}>
                        <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-6" />
                        <h3 className="text-white text-xl font-bold text-center mb-6">
                            📸 Choose Photo Source
                        </h3>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleAndroidTakePhoto}
                                className="flex items-center justify-center gap-3 w-full py-5 rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
                                style={{
                                    background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                                    color: '#000',
                                    boxShadow: '0 4px 20px rgba(0,255,136,0.3)'
                                }}>
                                <span className="text-2xl">📷</span>
                                Take Photo
                            </button>
                            <button onClick={handleAndroidUploadPhoto}
                                className="flex items-center justify-center gap-3 w-full py-5 rounded-xl font-bold text-lg transition-all active:scale-[0.98]"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    border: '1px solid rgba(255,255,255,0.2)'
                                }}>
                                <span className="text-2xl">🖼️</span>
                                Upload Photo
                            </button>
                            <button onClick={() => setShowAndroidPhotoModal(false)}
                                className="w-full py-3 text-white/50 text-sm font-medium mt-2">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
