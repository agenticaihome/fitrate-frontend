/**
 * FashionShowHub Screen
 * 
 * Merged view: Join + Runway + Camera all in one
 * - If not joined: Show name input + "Walk the Runway" button
 * - If joined: Show scoreboard + "Walk the Runway" button
 * - Camera opens inline when user taps Walk
 */

import React, { useState, useEffect, useRef } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { compressImage } from '../utils/imageUtils'
import EmptyState from '../components/common/EmptyState'
import { ScoreboardLoader } from '../components/common/ShimmerLoader'

const EMOJI_OPTIONS = ['😎', '🔥', '✨', '💅', '👑', '🎭']

export default function FashionShowHub({
    showId,
    showData,
    userId,
    isPro,
    walksUsed = 0,
    walksAllowed = 1,
    onImageSelected,
    onShare,
    onViewResults,
    onBack
}) {
    // Join state
    const [nickname, setNickname] = useState(() =>
        localStorage.getItem(`fashionshow_${showId}_nickname`) || ''
    )
    const [emoji, setEmoji] = useState(() =>
        localStorage.getItem(`fashionshow_${showId}_emoji`) || '😎'
    )
    const [hasJoined, setHasJoined] = useState(() =>
        !!localStorage.getItem(`fashionshow_${showId}_nickname`)
    )

    // Runway state
    const [scoreboard, setScoreboard] = useState(showData?.scoreboard || [])
    const [scoreboardLoading, setScoreboardLoading] = useState(true)
    const [timeRemaining, setTimeRemaining] = useState(() => {
        // Calculate from expiresAt for accuracy, fallback to timeRemaining
        if (showData?.expiresAt) {
            return Math.max(0, new Date(showData.expiresAt).getTime() - Date.now())
        }
        return showData?.timeRemaining || 0
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Reactions state - track which entries user has reacted to
    const [userReactions, setUserReactions] = useState(new Set())
    const [reactingTo, setReactingTo] = useState(null) // Currently reacting to (for animation)

    // Camera state
    const [showCamera, setShowCamera] = useState(false)
    const [showAndroidPhotoModal, setShowAndroidPhotoModal] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)
    const fileInputRef = useRef(null)

    const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/analyze', '/api') || 'https://fitrate-production.up.railway.app/api'

    // Platform Detection Helpers
    const isAndroid = () => /Android/i.test(navigator.userAgent)
    const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent) && !window.MSStream

    // Sync timeRemaining when showData changes (fixes initial load timing issue)
    useEffect(() => {
        if (showData?.expiresAt) {
            // Calculate from expiresAt for accuracy
            const remaining = Math.max(0, new Date(showData.expiresAt).getTime() - Date.now())
            setTimeRemaining(remaining)
        } else if (showData?.timeRemaining !== undefined) {
            setTimeRemaining(showData.timeRemaining)
        }
    }, [showData?.expiresAt, showData?.timeRemaining])

    // Format time remaining
    const formatTime = (ms) => {
        if (ms <= 0) return 'Ended'
        const hours = Math.floor(ms / (1000 * 60 * 60))
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
        return `${hours}h ${minutes}m`
    }

    // Countdown timer
    useEffect(() => {
        const interval = setInterval(() => {
            setTimeRemaining(prev => Math.max(0, prev - 1000))
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Cleanup camera stream on unmount (prevents glitch when navigating away)
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
        }
    }, [])

    // Poll scoreboard
    useEffect(() => {
        const fetchScoreboard = async () => {
            try {
                const res = await fetch(`${API_BASE}/show/${showId}/scoreboard`)
                if (res.ok) {
                    const data = await res.json()
                    setScoreboard(data.scoreboard || [])
                }
            } catch (err) {
                console.error('[FashionShow] Scoreboard poll error:', err)
            } finally {
                setScoreboardLoading(false)
            }
        }
        fetchScoreboard()
        const interval = setInterval(fetchScoreboard, 10000)
        return () => clearInterval(interval)
    }, [showId])

    // Join the show
    const handleJoin = async () => {
        if (!nickname.trim()) {
            setError('Enter your name!')
            return
        }
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${API_BASE}/show/${showId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, nickname: nickname.trim(), emoji })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to join')

            localStorage.setItem(`fashionshow_${showId}_nickname`, nickname.trim())
            localStorage.setItem(`fashionshow_${showId}_emoji`, emoji)
            setHasJoined(true)
            playSound('success')
            vibrate([50, 30, 50])
        } catch (err) {
            setError(err.message)
            playSound('error')
        } finally {
            setLoading(false)
        }
    }

    // Handle 🔥 reaction
    const handleReaction = async (targetUserId) => {
        if (reactingTo || userReactions.has(targetUserId) || targetUserId === userId) return

        setReactingTo(targetUserId)
        playSound('success')
        vibrate([30, 20, 30])

        try {
            const res = await fetch(`${API_BASE}/show/${showId}/react`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, targetUserId })
            })
            const data = await res.json()
            if (data.success) {
                // Update local state
                setUserReactions(prev => new Set([...prev, targetUserId]))
                // Update scoreboard with new count
                setScoreboard(prev => prev.map(entry =>
                    entry.userId === targetUserId
                        ? { ...entry, reactionCount: data.reactionCount }
                        : entry
                ))
            }
        } catch (err) {
            console.error('[FashionShow] Reaction error:', err)
        } finally {
            setTimeout(() => setReactingTo(null), 300) // Delay to show animation
        }
    }

    // Handle file upload from native camera or gallery
    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file || isProcessing) return

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            setError('Image is too large. Please try a smaller photo.')
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
            onImageSelected?.(imageData, 'fashionshow')
        } catch (err) {
            console.error('Image processing error:', err)
            setError('Something went wrong — try again!')
        } finally {
            setIsProcessing(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Start camera - platform specific
    const startCamera = async () => {
        playSound('click')
        vibrate(15)

        if (isAndroid()) {
            // Android: Show dual-button picker modal
            setShowAndroidPhotoModal(true)
        } else if (isIOS()) {
            // iOS: Open native Camera app directly
            document.getElementById('fashionShowCameraInput')?.click()
        } else {
            // Desktop: Use getUserMedia for live camera preview
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
                setError('Camera access denied')
                console.error('[FashionShow] Camera error:', err)
            }
        }
    }

    // Android-specific handlers for dual-button modal
    const handleAndroidTakePhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        // Directly click camera input with capture attribute (forces native camera)
        document.getElementById('fashionShowCameraInput')?.click()
    }

    const handleAndroidUploadPhoto = () => {
        setShowAndroidPhotoModal(false)
        playSound('click')
        vibrate(15)
        // Click gallery input without capture attribute
        document.getElementById('fashionShowGalleryInput')?.click()
    }

    // Capture photo
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0)

        canvas.toBlob((blob) => {
            const file = new File([blob], 'fashion-show-walk.jpg', { type: 'image/jpeg' })
            stopCamera()
            playSound('success')
            vibrate(50)
            onImageSelected?.(file, 'fashionshow')
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

    const canWalk = walksUsed < walksAllowed && timeRemaining > 0 && showData?.status !== 'ended'
    const userRank = scoreboard.findIndex(e => e.userId === userId) + 1

    // Show loading
    if (!showData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center">
                <div className="text-5xl animate-pulse">🎭</div>
            </div>
        )
    }

    // Check if show has ended - trust backend status OR local timer expired
    // If status is 'ended', show is definitely over
    // If timeRemaining <= 0 but status isn't 'ended', still allow viewing but disable walking
    const showEnded = showData?.status === 'ended'
    const canStillWalk = timeRemaining > 0 && !showEnded

    // Camera view
    if (showCamera) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="flex-1 object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Show vibe banner */}
                <div className="absolute top-safe left-0 right-0 p-4 text-center">
                    <div className="inline-block px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
                        <span className="text-white font-bold">🎭 {showData.name}</span>
                        <span className="text-white/60 ml-2 text-sm">{showData.vibeLabel}</span>
                    </div>
                </div>

                {/* Camera controls */}
                <div className="absolute bottom-safe left-0 right-0 p-6 flex items-center justify-center gap-6">
                    <button
                        onClick={stopCamera}
                        className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl"
                    >
                        ✕
                    </button>
                    <button
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <div className="w-16 h-16 rounded-full border-4 border-purple-500" />
                    </button>
                    <div className="w-14 h-14" /> {/* Spacer */}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col">
            {/* Hidden File Inputs - Platform-specific camera/gallery access */}
            {/* Fashion Show Camera Input - with capture attribute to force native camera */}
            <input
                type="file"
                accept="image/*"
                capture="environment"
                id="fashionShowCameraInput"
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            {/* Fashion Show Gallery Input - no capture, opens gallery picker */}
            <input
                type="file"
                accept="image/*"
                id="fashionShowGalleryInput"
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />
            {/* Fallback input for desktop when getUserMedia fails */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileUpload}
                style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 1, height: 1 }}
            />

            {/* Header */}
            <div className="pt-safe px-4 py-4 flex items-center justify-between">
                <button onClick={() => { playSound('click'); onBack?.(); }} className="text-white/60 text-sm">
                    ← Exit
                </button>
                <button onClick={() => { playSound('click'); onShare?.(); }} className="text-white/60 text-sm">
                    Share 📤
                </button>
            </div>

            {/* Show Ended Banner */}
            {(showEnded || timeRemaining <= 0) && (
                <div className="mx-4 mb-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-center">
                        <div className="text-2xl mb-1">🏁</div>
                        <div className="text-lg font-bold text-amber-400">Show Complete!</div>
                        <p className="text-amber-200/70 text-sm mt-1 mb-3">See who won the competition</p>
                        <button
                            onClick={() => { playSound('success'); vibrate([50, 30, 50]); onViewResults?.(); }}
                            className="px-6 py-3 rounded-xl font-bold text-white active:scale-[0.98] transition-transform"
                            style={{
                                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                                color: '#000',
                                boxShadow: '0 4px 20px rgba(255,215,0,0.4)'
                            }}
                        >
                            🏆 View Full Results
                        </button>
                    </div>
                </div>
            )}

            {/* Show Header */}
            <div className="px-4 text-center mb-4">
                <h1 className="text-2xl font-black text-white mb-1">🎭 {showData.name}</h1>
                <div className="flex items-center justify-center gap-3 text-sm">
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/60">{showData.vibeLabel}</span>
                    {showData.familySafe && <span className="text-green-400 text-xs">Family Safe ✅</span>}
                </div>
                {/* Participant counter - creates FOMO */}
                {(scoreboard.length > 0 || showData?.maxParticipants) && (
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                        <span className="text-purple-400 font-bold">{scoreboard.length} {scoreboard.length === 1 ? 'friend' : 'friends'}</span>
                        <span className="text-white/40">competing</span>
                        {showData?.maxParticipants && (
                            <span className={`text-sm px-2 py-0.5 rounded-full ${scoreboard.length >= showData.maxParticipants ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                {scoreboard.length >= showData.maxParticipants
                                    ? '🚫 FULL'
                                    : `${showData.maxParticipants - scoreboard.length} spots left`}
                            </span>
                        )}
                        {scoreboard[0] && canStillWalk && (
                            <span className="text-amber-400 text-sm">👑 {scoreboard[0].nickname} leads with {scoreboard[0].score?.toFixed(0)}</span>
                        )}
                    </div>
                )}
                {canStillWalk && (
                    <div className="mt-2 text-white/40 text-sm">⏰ {formatTime(timeRemaining)} remaining</div>
                )}
            </div>

            {/* Join Form OR Walk Button */}
            <div className="px-4 mb-4">
                {!hasJoined && canStillWalk ? (
                    // Show join form only if show is still active AND has time remaining
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Enter your name"
                            maxLength={20}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold placeholder:text-white/30 focus:outline-none focus:border-purple-500 mb-4"
                        />

                        {/* Quick emoji picker */}
                        <div className="flex gap-2 mb-4 justify-center">
                            {EMOJI_OPTIONS.map((e) => (
                                <button
                                    key={e}
                                    onClick={() => { setEmoji(e); playSound('click'); }}
                                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${emoji === e ? 'bg-purple-500/30 border-2 border-purple-500' : 'bg-white/10'
                                        }`}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>

                        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

                        <button
                            onClick={handleJoin}
                            disabled={loading || !nickname.trim()}
                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${loading || !nickname.trim()
                                ? 'bg-white/10 text-white/30'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white active:scale-[0.98]'
                                }`}
                        >
                            {loading ? '⏳ Joining...' : '📸 Snap Your Fit & Join'}
                        </button>
                    </div>
                ) : !hasJoined && !canStillWalk ? (
                    // Show ended or time expired - user never joined, just show "Start New Show" option
                    <button
                        onClick={() => { playSound('click'); window.location.href = '/'; }}
                        className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white active:scale-[0.98]"
                    >
                        🎭 Start a New Show
                    </button>
                ) : (
                    <button
                        onClick={canWalk ? startCamera : undefined}
                        disabled={!canWalk}
                        className={`w-full py-6 rounded-3xl font-black text-xl flex flex-col items-center justify-center gap-1 transition-all ${canWalk
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 active:scale-[0.98]'
                            : 'bg-white/10 text-white/30'
                            }`}
                    >
                        {walksUsed > 0 ? (
                            <>
                                <span className="text-3xl">✅</span>
                                <span>You've Walked!</span>
                                {userRank > 0 && <span className="text-sm font-normal text-white/60">You're #{userRank}</span>}
                            </>
                        ) : timeRemaining <= 0 ? (
                            <>
                                <span className="text-3xl">🏁</span>
                                <span>Show Ended</span>
                            </>
                        ) : (
                            <>
                                <span className="text-3xl">📸</span>
                                <span>Snap Your Fit</span>
                                <span className="text-sm font-normal text-white/60">Take a photo to compete</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Scoreboard */}
            <div className="px-4 flex-1 overflow-y-auto pb-8">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-black text-white/60 uppercase tracking-widest">📊 Scoreboard</h2>
                    <span className="text-xs text-white/40">{scoreboard.length} entries</span>
                </div>

                {scoreboardLoading && scoreboard.length === 0 ? (
                    <ScoreboardLoader rows={3} />
                ) : scoreboard.length === 0 ? (
                    <EmptyState
                        variant="fashion"
                        title="No walks yet"
                        subtitle="Be the first to strut your stuff!"
                    />
                ) : (
                    <div className="space-y-2">
                        {scoreboard.slice(0, 10).map((entry, idx) => {
                            const isUser = entry.userId === userId
                            const rankEmoji = idx === 0 ? '👑' : idx === 1 ? '🔥' : idx === 2 ? '⭐' : `#${idx + 1}`
                            return (
                                <div
                                    key={`${entry.userId}-${idx}`}
                                    className={`p-3 rounded-xl ${isUser ? 'bg-purple-500/20 border border-purple-500/30' : 'bg-white/5'}`}
                                >
                                    {/* Top row: Rank, Image, Score */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg w-8 text-center">{rankEmoji}</span>
                                        {/* Outfit Thumbnail or Emoji Fallback */}
                                        {entry.imageThumb ? (
                                            <img
                                                src={entry.imageThumb}
                                                alt={`${entry.nickname}'s outfit`}
                                                className="w-14 h-14 rounded-xl object-cover border-2 flex-shrink-0"
                                                style={{ borderColor: isUser ? 'rgba(168,85,247,0.5)' : 'rgba(255,255,255,0.1)' }}
                                            />
                                        ) : (
                                            <span className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                                                {entry.emoji}
                                            </span>
                                        )}
                                        {/* Tagline - short funny title (2-5 words) */}
                                        <span className="flex-1 text-sm font-bold text-white/80 truncate">
                                            {entry.tagline || entry.nickname}
                                        </span>
                                        {/* 🔥 Reaction Button */}
                                        {!isUser && hasJoined && (
                                            <button
                                                onClick={() => handleReaction(entry.userId)}
                                                disabled={userReactions.has(entry.userId) || reactingTo === entry.userId}
                                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm transition-all ${userReactions.has(entry.userId)
                                                    ? 'bg-orange-500/20 text-orange-400'
                                                    : 'bg-white/5 text-white/50 hover:bg-orange-500/20 hover:text-orange-400 active:scale-95'
                                                    }`}
                                                style={{
                                                    transform: reactingTo === entry.userId ? 'scale(1.2)' : 'scale(1)',
                                                    transition: 'transform 0.15s ease-out'
                                                }}
                                            >
                                                <span className="text-base">🔥</span>
                                                {entry.reactionCount > 0 && (
                                                    <span className="font-bold">{entry.reactionCount}</span>
                                                )}
                                            </button>
                                        )}
                                        {/* Show reaction count for self */}
                                        {isUser && entry.reactionCount > 0 && (
                                            <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-sm">
                                                <span className="text-base">🔥</span>
                                                <span className="font-bold">{entry.reactionCount}</span>
                                            </span>
                                        )}
                                        <div className="text-2xl font-black text-white">{entry.score?.toFixed(1)}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
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
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                                    color: '#fff',
                                    boxShadow: '0 4px 20px rgba(139,92,246,0.3)'
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
        </div>
    )
}
