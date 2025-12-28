import React, { useState, useEffect, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

/**
 * BattleScreen - The shared "room" for a 1v1 outfit battle
 *
 * Both challenger and responder can visit this page to see:
 * - Waiting state (if no response yet)
 * - Result state (once both have played)
 */

// Confetti for the winner reveal
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

export default function BattleScreen({
    battleId,
    battleData, // { creatorScore, responderScore?, mode?, status: 'waiting'|'completed', createdAt }
    isCreator,     // Did the current user create this battle?
    onRefresh,     // Refresh battle data
    onAcceptChallenge, // Responder wants to scan their outfit
    onShare,       // Re-share the challenge link
    onHome,        // Go back home
    loading
}) {
    const [showConfetti, setShowConfetti] = useState(false)
    const [revealed, setRevealed] = useState(false)

    const isCompleted = battleData?.status === 'completed'
    const creatorScore = battleData?.creatorScore || 0
    const responderScore = battleData?.responderScore || 0
    const battleMode = battleData?.mode || 'nice'  // AI mode for this battle

    // Mode display helpers
    const getModeEmoji = (m) => {
        const emojis = { nice: '😇', roast: '🔥', honest: '📊', savage: '💀', rizz: '😏', celeb: '⭐', aura: '🔮', chaos: '🎪', y2k: '💎', villain: '🖤', coquette: '🎀', hypebeast: '👟' }
        return emojis[m] || '😇'
    }
    const getModeLabel = (m) => {
        const labels = { nice: 'Nice', roast: 'Roast', honest: 'Honest', savage: 'Savage', rizz: 'Rizz', celeb: 'Celebrity', aura: 'Aura', chaos: 'Chaos', y2k: 'Y2K', villain: 'Villain', coquette: 'Coquette', hypebeast: 'Hypebeast' }
        return labels[m] || 'Nice'
    }

    // Determine winner - USE API winner field (AI head-to-head comparison)
    // Falls back to score comparison for legacy battles without winner field
    const apiWinner = battleData?.winner // 'creator' | 'opponent' | 'tie' | null
    const creatorWon = apiWinner ? apiWinner === 'creator' : creatorScore > responderScore
    const responderWon = apiWinner ? apiWinner === 'opponent' : responderScore > creatorScore
    const tied = apiWinner ? apiWinner === 'tie' : creatorScore === responderScore

    // Use marginOfVictory from API if available, otherwise calculate from scores
    const diff = battleData?.marginOfVictory != null
        ? Math.round(battleData.marginOfVictory * 10) / 10
        : Math.round(Math.abs(creatorScore - responderScore) * 10) / 10

    // Colors
    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'
    const waitingColor = '#00d4ff'

    // Confetti colors
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

                // Hide confetti after 3s
                setTimeout(() => setShowConfetti(false), 3500)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [isCompleted, revealed])

    // Format time ago
    const formatTimeAgo = (dateString) => {
        if (!dateString) return ''
        const diff = Date.now() - new Date(dateString).getTime()
        const minutes = Math.floor(diff / 60000)
        if (minutes < 1) return 'Just now'
        if (minutes < 60) return `${minutes}m ago`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours}h ago`
        return `${Math.floor(hours / 24)}d ago`
    }

    // WAITING STATE - Challenge sent, awaiting response
    if (!isCompleted) {
        return (
            <div
                className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, #0a0a1a 0%, #0a1a1a 50%, #0a0a1a 100%)'
                }}
            >
                {/* Glow */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(circle at 50% 40%, ${waitingColor}20 0%, transparent 60%)`
                    }}
                />

                {/* Icon */}
                <div className="text-7xl mb-6" style={{ animation: 'pulse 2s ease-in-out infinite' }}>
                    ⏳
                </div>

                {/* Title */}
                <h1 className="text-3xl font-black mb-2" style={{ color: waitingColor }}>
                    {isCreator ? 'Battle Sent!' : 'Battle Time!'}
                </h1>

                {/* Mode Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 mb-4">
                    <span className="text-lg">{getModeEmoji(battleMode)}</span>
                    <span className="text-sm font-bold text-white/80">{getModeLabel(battleMode)} Mode</span>
                </div>

                <p className="text-white/60 mb-8 max-w-xs">
                    {isCreator
                        ? "Waiting for someone to accept your battle..."
                        : "Scan your outfit to complete the battle!"
                    }
                </p>

                {/* Creator's Score */}
                <div className="bg-white/5 rounded-2xl p-6 mb-8 w-full max-w-xs">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
                        {isCreator ? 'Your Score' : 'Their Score'}
                    </p>
                    <p className="text-5xl font-black" style={{ color: waitingColor }}>
                        {Math.round(creatorScore)}
                    </p>
                    <p className="text-xs text-white/30 mt-2">
                        {formatTimeAgo(battleData?.createdAt)}
                    </p>
                </div>

                {/* VS Divider */}
                <div className="flex items-center gap-4 mb-8 w-full max-w-xs">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-white/30 font-bold">VS</span>
                    <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Waiting indicator */}
                <div className="bg-white/5 rounded-2xl p-6 mb-8 w-full max-w-xs border border-dashed border-white/20">
                    <p className="text-4xl mb-2">🤷</p>
                    <p className="text-white/40">
                        {isCreator ? 'Waiting for opponent...' : 'Your score goes here'}
                    </p>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    {isCreator ? (
                        <>
                            {/* Refresh */}
                            <button
                                onClick={() => {
                                    playSound('click')
                                    vibrate(20)
                                    onRefresh?.()
                                }}
                                disabled={loading}
                                className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97] disabled:opacity-50"
                                style={{
                                    background: `linear-gradient(135deg, ${waitingColor} 0%, #0066ff 100%)`,
                                    color: '#000'
                                }}
                            >
                                {loading ? '⏳ Checking...' : '🔄 Check for Response'}
                            </button>

                            {/* Re-share */}
                            <button
                                onClick={() => {
                                    playSound('click')
                                    vibrate(15)
                                    onShare?.()
                                }}
                                className="w-full py-3 rounded-xl font-medium transition-all active:scale-[0.97]"
                                style={{
                                    background: 'rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.8)',
                                    border: '1px solid rgba(255,255,255,0.15)'
                                }}
                            >
                                📤 Share Again
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Accept Battle */}
                            <button
                                onClick={() => {
                                    playSound('click')
                                    vibrate(30)
                                    onAcceptChallenge?.()
                                }}
                                className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97]"
                                style={{
                                    background: `linear-gradient(135deg, ${winColor} 0%, #00d4ff 100%)`,
                                    color: '#000',
                                    boxShadow: `0 8px 30px ${winColor}40`
                                }}
                            >
                                ⚔️ Accept Battle
                            </button>
                        </>
                    )}

                    {/* Home */}
                    <button
                        onClick={() => {
                            playSound('click')
                            vibrate(10)
                            onHome?.()
                        }}
                        className="w-full py-2 text-sm font-medium transition-all active:opacity-60"
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        )
    }

    // COMPLETED STATE - Both have played, show results!
    const userWon = isCreator ? creatorWon : responderWon
    const userLost = isCreator ? responderWon : creatorWon
    const accentColor = userWon ? winColor : userLost ? loseColor : tieColor

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
            style={{
                background: userWon
                    ? 'linear-gradient(180deg, #0a1a0a 0%, #001a00 50%, #0a1a0a 100%)'
                    : userLost
                        ? 'linear-gradient(180deg, #1a0a0a 0%, #1a0000 50%, #1a0a0a 100%)'
                        : 'linear-gradient(180deg, #1a1a0a 0%, #1a1a00 50%, #1a1a0a 100%)'
            }}
        >
            {/* Glow */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `radial-gradient(circle at 50% 40%, ${accentColor}25 0%, transparent 60%)`
                }}
            />

            {/* Confetti */}
            {showConfetti && confettiPieces.map(piece => (
                <ConfettiPiece key={piece.id} {...piece} />
            ))}

            {/* Result Icon */}
            <div
                className="text-7xl mb-4"
                style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? 'scale(1)' : 'scale(0)',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    filter: `drop-shadow(0 0 30px ${accentColor})`
                }}
            >
                {userWon ? '🏆' : userLost ? '💀' : '🤝'}
            </div>

            {/* Result Title */}
            <h1
                className={`text-3xl font-black mb-1 ${userWon ? 'legendary-text' : ''}`}
                style={{
                    color: userWon ? undefined : accentColor,
                    opacity: revealed ? 1 : 0,
                    transition: 'opacity 0.5s ease-out 0.2s'
                }}
            >
                {userWon ? 'YOU WON!' : userLost ? 'YOU LOST' : "IT'S A TIE!"}
            </h1>

            <p className="text-white/50 text-sm mb-6" style={{
                opacity: revealed ? 1 : 0,
                transition: 'opacity 0.5s ease-out 0.3s'
            }}>
                Battle #{battleId?.slice(-6)}
            </p>

            {/* Score Comparison */}
            <div
                className="flex items-center gap-6 mb-6"
                style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s'
                }}
            >
                {/* Creator Score */}
                <div className="flex flex-col items-center">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center mb-2 overflow-hidden"
                        style={{
                            background: creatorWon ? `${winColor}20` : 'rgba(255,255,255,0.08)',
                            border: `3px solid ${creatorWon ? winColor : 'rgba(255,255,255,0.2)'}`,
                            boxShadow: creatorWon ? `0 0 30px ${winColor}40` : 'none'
                        }}
                    >
                        {battleData?.creatorThumb ? (
                            <img
                                src={battleData.creatorThumb}
                                alt="Creator outfit"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-3xl">{isCreator ? '👤' : '🤷'}</span>
                        )}
                    </div>
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                        {isCreator ? 'You' : 'Them'}
                    </span>
                    <span
                        className="text-3xl font-black"
                        style={{ color: creatorWon ? winColor : '#fff' }}
                    >
                        {Math.round(creatorScore)}
                    </span>
                </div>

                {/* VS */}
                <div className="text-xl font-black text-white/30">VS</div>

                {/* Responder Score */}
                <div className="flex flex-col items-center">
                    <div
                        className="w-24 h-24 rounded-full flex items-center justify-center mb-2 overflow-hidden"
                        style={{
                            background: responderWon ? `${winColor}20` : 'rgba(255,255,255,0.08)',
                            border: `3px solid ${responderWon ? winColor : 'rgba(255,255,255,0.2)'}`,
                            boxShadow: responderWon ? `0 0 30px ${winColor}40` : 'none'
                        }}
                    >
                        {battleData?.responderThumb ? (
                            <img
                                src={battleData.responderThumb}
                                alt="Responder outfit"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-3xl">{isCreator ? '🤷' : '👤'}</span>
                        )}
                    </div>
                    <span className="text-xs text-white/50 uppercase tracking-wider">
                        {isCreator ? 'Them' : 'You'}
                    </span>
                    <span
                        className="text-3xl font-black"
                        style={{ color: responderWon ? winColor : '#fff' }}
                    >
                        {Math.round(responderScore)}
                    </span>
                </div>
            </div>

            {/* Point Difference */}
            <p
                className="text-lg mb-8"
                style={{
                    color: 'rgba(255,255,255,0.7)',
                    opacity: revealed ? 1 : 0,
                    transition: 'opacity 0.5s ease-out 0.5s'
                }}
            >
                {tied
                    ? <span>Exactly tied! <strong style={{ color: tieColor }}>Fate decides.</strong></span>
                    : <span>Won by <strong style={{ color: accentColor }}>{diff} points</strong></span>
                }
            </p>

            {/* CTAs */}
            <div
                className="flex flex-col gap-3 w-full max-w-xs"
                style={{
                    opacity: revealed ? 1 : 0,
                    transform: revealed ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.5s ease-out 0.6s'
                }}
            >
                {/* Rematch */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        onShare?.()
                    }}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97]"
                    style={{
                        background: `linear-gradient(135deg, ${accentColor} 0%, ${userWon ? '#00d4ff' : '#ff8800'} 100%)`,
                        color: userWon ? '#000' : '#fff',
                        boxShadow: `0 8px 30px ${accentColor}40`
                    }}
                >
                    {userWon ? '🏆 Battle Someone Else' : '⚔️ Rematch!'}
                </button>

                {/* Home */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(10)
                        onHome?.()
                    }}
                    className="w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.97]"
                    style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(255,255,255,0.15)'
                    }}
                >
                    🏠 Back to Home
                </button>
            </div>
        </div>
    )
}
