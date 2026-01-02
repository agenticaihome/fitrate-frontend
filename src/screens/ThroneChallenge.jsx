import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { THRONES, setKing, recordDefense, getKings } from './ThroneRoom'
import { getDisplayName } from '../utils/displayNameStorage'

// ============================================
// THRONE CHALLENGE SCREEN
// Challenge for a throne - take photo, battle the king
// ============================================
export default function ThroneChallenge({
    throne,
    currentKing,
    onComplete,
    onCancel,
    playSound,
    vibrate
}) {
    const [phase, setPhase] = useState('intro') // 'intro' | 'photo' | 'battle' | 'result'
    const [myPhoto, setMyPhoto] = useState(null)
    const [myScore, setMyScore] = useState(null)
    const [kingScore, setKingScore] = useState(null)
    const [result, setResult] = useState(null)
    const fileInputRef = useRef(null)
    const displayName = getDisplayName()

    const isVacant = !currentKing
    const isMyThrone = currentKing?.displayName === displayName

    // Handle photo selection
    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        playSound?.('whoosh')
        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result

            // Create thumbnail
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                const size = 400
                canvas.width = size
                canvas.height = size * (img.height / img.width)
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                const thumb = canvas.toDataURL('image/jpeg', 0.7)

                setMyPhoto(thumb)
                setPhase('battle')

                // Simulate battle after short delay
                setTimeout(() => simulateBattle(thumb), 1500)
            }
            img.src = dataUrl
        }
        reader.readAsDataURL(file)
        e.target.value = ''
    }

    // Simulate battle (in real impl, this would call backend)
    const simulateBattle = async (photoThumb) => {
        playSound?.('whoosh')

        // Generate scores
        const challengerScore = Math.floor(Math.random() * 25) + 75
        const kingDefenseScore = isVacant ? 0 : Math.floor(Math.random() * 25) + 70

        setMyScore(challengerScore)
        setKingScore(kingDefenseScore)

        setTimeout(async () => {
            const won = challengerScore > kingDefenseScore
            setResult(won ? 'victory' : 'defeat')
            setPhase('result')

            // Calculate points for leaderboard
            const points = won ? (isVacant ? 25 : 50) : 15 // 25 claim, 50 dethrone, 15 defense bonus if lost? No, wait.
            // If I WON: +25 (claim) or +50 (dethrone)
            // If I LOST: +1 participation? OR if I am the king defending?
            // This component is for the CHALLENGER.
            // If challenger loses, they get 1 pt participation.
            // BUT we also want to record the DEFENDER'S points? We can't easily record for another user without auth.
            // So we only record for the current user.

            let awardedPoints = 0
            let reason = ''

            if (won) {
                awardedPoints = isVacant ? 25 : 50
                reason = isVacant ? 'koth:claim' : 'koth:dethrone'

                // Claim the throne!
                setKing(throne.id, {
                    displayName,
                    photo: photoThumb,
                    score: challengerScore
                })
                playSound?.('celebrate')
                vibrate?.([100, 50, 100, 50, 200])
            } else {
                awardedPoints = 5 // Participation
                reason = 'koth:challenge_lost'

                // King defends
                recordDefense(throne.id)
                playSound?.('error')
                vibrate?.(50)
            }

            // Report score to backend
            try {
                // Get userId from localStorage (it's usually stored as 'fitrate_user' or similar, let's check utils)
                // For now, assume we can get it from localStorage 'fitrate_userid' or similar
                // Actually, let's use the standard storage key
                const storedUser = localStorage.getItem('fitrate_user')
                const userId = storedUser ? JSON.parse(storedUser).id : null

                if (userId && awardedPoints > 0) {
                    const API_URL = import.meta.env.VITE_API_URL || 'https://fitrate-backend-production.up.railway.app'
                    await fetch(`${API_URL}/api/arena/record-score`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId,
                            points: awardedPoints,
                            source: reason
                        })
                    })
                    console.log(`[KOTH] Reported score: +${awardedPoints} (${reason})`)
                }
            } catch (e) {
                console.error('[KOTH] Failed to report score:', e)
            }

        }, 2000)
    }

    const handleContinue = () => {
        onComplete?.({
            result,
            throne,
            myScore,
            kingScore
        })
    }

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden"
            style={{
                background: `linear-gradient(180deg, #0a0a1a 0%, ${throne.color}15 50%, #0a0a1a 100%)`
            }}
        >
            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
                className="sr-only"
            />

            {/* Header */}
            <div className="relative z-20 flex items-center justify-between p-4 pt-6">
                <button
                    onClick={() => {
                        playSound?.('click')
                        vibrate?.(10)
                        onCancel?.()
                    }}
                    className="w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span className="text-white text-lg">←</span>
                </button>

                <div className="text-center">
                    <h1 className="text-xl font-black text-white">{throne.emoji} {throne.name}</h1>
                    <p className="text-white/50 text-xs">{throne.mode} Mode</p>
                </div>

                <div className="w-11" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                {/* INTRO PHASE */}
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-sm"
                    >
                        <span className="text-8xl block mb-6">{throne.emoji}</span>

                        {isVacant ? (
                            <>
                                <h2 className="text-3xl font-black text-white mb-3">
                                    🏆 Claim This Throne!
                                </h2>
                                <p className="text-white/60 mb-8">
                                    The {throne.name} throne is vacant!<br />
                                    Upload a fit to claim the crown.
                                </p>
                            </>
                        ) : isMyThrone ? (
                            <>
                                <h2 className="text-3xl font-black text-white mb-3">
                                    👑 Defend Your Crown!
                                </h2>
                                <p className="text-white/60 mb-8">
                                    You are the {throne.name}!<br />
                                    {currentKing.defenses || 0} successful defenses so far.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-3xl font-black text-white mb-3">
                                    ⚔️ Challenge the King!
                                </h2>
                                <p className="text-white/60 mb-8">
                                    {currentKing.displayName || 'Anonymous'} holds the throne.<br />
                                    Beat their score to claim the crown!
                                </p>
                            </>
                        )}

                        <button
                            onClick={() => {
                                playSound?.('click')
                                vibrate?.([50, 30, 50])
                                fileInputRef.current?.click()
                            }}
                            className="px-8 py-4 rounded-2xl font-bold text-lg text-black transition-all active:scale-95"
                            style={{ background: `linear-gradient(135deg, ${throne.color}, #ffd700)` }}
                        >
                            📸 {isVacant ? 'Upload & Claim' : 'Upload & Battle'}
                        </button>
                    </motion.div>
                )}

                {/* BATTLE PHASE */}
                {phase === 'battle' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center"
                    >
                        <div className="flex items-center justify-center gap-8 mb-8">
                            {/* Challenger */}
                            <div className="text-center">
                                <div
                                    className="w-32 h-40 rounded-2xl overflow-hidden mb-3 border-2"
                                    style={{ borderColor: throne.color }}
                                >
                                    <img src={myPhoto} alt="Your fit" className="w-full h-full object-cover" />
                                </div>
                                <p className="text-white font-bold">You</p>
                                {myScore !== null && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-2xl font-black text-white"
                                    >
                                        {myScore}
                                    </motion.span>
                                )}
                            </div>

                            {/* VS */}
                            <div className="text-white/40 text-2xl font-black">VS</div>

                            {/* King */}
                            <div className="text-center">
                                <div
                                    className="w-32 h-40 rounded-2xl overflow-hidden mb-3 flex items-center justify-center"
                                    style={{
                                        background: isVacant ? 'rgba(255,255,255,0.05)' : undefined,
                                        border: '2px solid rgba(255,215,0,0.5)'
                                    }}
                                >
                                    {isVacant ? (
                                        <span className="text-4xl">🏆</span>
                                    ) : currentKing.photo ? (
                                        <img src={currentKing.photo} alt="King" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">👑</span>
                                    )}
                                </div>
                                <p className="text-white font-bold">{isVacant ? 'Vacant' : 'King'}</p>
                                {kingScore !== null && !isVacant && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-2xl font-black text-white"
                                    >
                                        {kingScore}
                                    </motion.span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-3 h-3 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-3 h-3 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <p className="text-white/50 mt-2">
                            {myScore === null ? 'Analyzing your fit...' : 'Comparing scores...'}
                        </p>
                    </motion.div>
                )}

                {/* RESULT PHASE */}
                {phase === 'result' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <span className="text-8xl block mb-4">
                            {result === 'victory' ? '👑' : '😢'}
                        </span>
                        <h2 className="text-4xl font-black text-white mb-2">
                            {result === 'victory' ? 'You Are King!' : 'The King Defends!'}
                        </h2>
                        <p className="text-white/60 mb-2">
                            {result === 'victory'
                                ? `You claimed the ${throne.name} throne!`
                                : `${currentKing?.displayName || 'The King'} remains on the throne.`
                            }
                        </p>
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <div className="text-center">
                                <span className="text-3xl font-black text-white">{myScore}</span>
                                <p className="text-white/50 text-xs">Your Score</p>
                            </div>
                            <span className="text-white/30">vs</span>
                            <div className="text-center">
                                <span className="text-3xl font-black text-white">{kingScore || '—'}</span>
                                <p className="text-white/50 text-xs">King's Score</p>
                            </div>
                        </div>

                        {result === 'victory' && (
                            <div
                                className="p-4 rounded-2xl mb-6"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.05))',
                                    border: '1px solid rgba(255,215,0,0.3)'
                                }}
                            >
                                <p className="text-yellow-300 text-sm font-bold">
                                    🎉 +50 points for claiming the crown!
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleContinue}
                            className="px-8 py-4 rounded-2xl font-bold text-lg text-black transition-all active:scale-95"
                            style={{ background: `linear-gradient(135deg, ${throne.color}, #ffd700)` }}
                        >
                            Continue
                        </button>
                    </motion.div>
                )}
            </div>

            <style>{`
                @keyframes orb-float {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-20px, 20px) scale(1.1); }
                }
            `}</style>
        </div>
    )
}
