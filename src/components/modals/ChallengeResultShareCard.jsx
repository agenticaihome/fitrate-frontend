import React, { useRef } from 'react'
import html2canvas from 'html2canvas'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * ChallengeResultShareCard
 *
 * Visual share card for 1v1 challenge results.
 * Shows both scores, winner indication, and can be shared as an image.
 */
export default function ChallengeResultShareCard({
    userScore,
    challengeScore,
    userImage,
    onClose
}) {
    const cardRef = useRef(null)

    const won = userScore > challengeScore
    const tied = userScore === challengeScore
    const lost = !won && !tied
    const diff = Math.round(Math.abs(userScore - challengeScore) * 10) / 10

    // Style based on result
    const getResultStyle = () => {
        if (won) return {
            gradient: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
            bg: 'linear-gradient(180deg, #0a1a0a 0%, #001a00 50%, #0a1a0a 100%)',
            glow: 'rgba(0, 255, 136, 0.4)',
            title: 'VICTORY',
            emoji: '🏆',
            accent: '#00ff88'
        }
        if (tied) return {
            gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8800 100%)',
            bg: 'linear-gradient(180deg, #1a1a0a 0%, #1a1a00 50%, #1a1a0a 100%)',
            glow: 'rgba(255, 215, 0, 0.4)',
            title: 'TIE GAME',
            emoji: '🤝',
            accent: '#ffd700'
        }
        return {
            gradient: 'linear-gradient(135deg, #ff4444 0%, #ff8800 100%)',
            bg: 'linear-gradient(180deg, #1a0a0a 0%, #1a0000 50%, #1a0a0a 100%)',
            glow: 'rgba(255, 68, 68, 0.4)',
            title: 'DEFEATED',
            emoji: '💀',
            accent: '#ff4444'
        }
    }

    const style = getResultStyle()

    const handleShare = async () => {
        playSound('share')
        vibrate(30)

        if (!cardRef.current) return

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                logging: false,
                useCORS: true
            })

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
            const file = new File([blob], `fitrate-challenge-result.png`, { type: 'image/png' })

            const shareText = won
                ? `🏆 I won the FitRate challenge! ${userScore} vs ${challengeScore} - beat them by ${diff} points!`
                : tied
                    ? `🤝 We tied on FitRate! Both scored ${userScore}. Rematch?`
                    : `💀 Lost this FitRate challenge ${userScore} vs ${challengeScore}... but I want a rematch! ⚔️`

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: won ? 'I Won!' : tied ? 'We Tied!' : 'Challenge Result',
                    text: shareText
                })
                playSound('pop')
                vibrate(20)
                onClose()
            } else {
                // Fallback: download + copy text
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'fitrate-challenge-result.png'
                a.click()
                URL.revokeObjectURL(url)

                // Copy share text to clipboard
                await navigator.clipboard.writeText(shareText)
                playSound('pop')
                vibrate(20)
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Share failed:', err)
            }
        }
    }

    const handleClose = () => {
        playSound('click')
        vibrate(10)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
            background: 'rgba(0,0,0,0.95)',
            backdropFilter: 'blur(20px)'
        }}>
            <div className="flex flex-col items-center">
                {/* The shareable card */}
                <div
                    ref={cardRef}
                    className="w-80 rounded-3xl p-6 relative overflow-hidden"
                    style={{
                        background: style.bg,
                        boxShadow: `0 0 60px ${style.glow}`
                    }}
                >
                    {/* Gradient border */}
                    <div className="absolute inset-0 rounded-3xl" style={{
                        background: style.gradient,
                        padding: '3px'
                    }}>
                        <div className="absolute inset-[3px] rounded-[21px]" style={{ background: '#0a0a0f' }} />
                    </div>

                    {/* Glow overlay */}
                    <div className="absolute inset-0 pointer-events-none" style={{
                        background: `radial-gradient(circle at 50% 30%, ${style.glow} 0%, transparent 60%)`
                    }} />

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Result header */}
                        <div className="text-center mb-6">
                            <span className="text-6xl block mb-2">{style.emoji}</span>
                            <h2 className="text-3xl font-black" style={{
                                background: style.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {style.title}
                            </h2>
                        </div>

                        {/* Score comparison */}
                        <div className="flex items-center justify-center gap-4 mb-6">
                            {/* User score */}
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-20 h-20 rounded-full overflow-hidden mb-2"
                                    style={{
                                        border: `3px solid ${won || tied ? style.accent : 'rgba(255,255,255,0.3)'}`,
                                        boxShadow: won ? `0 0 20px ${style.glow}` : 'none'
                                    }}
                                >
                                    {userImage ? (
                                        <img
                                            src={userImage}
                                            alt="You"
                                            className="w-full h-full object-cover"
                                            crossOrigin="anonymous"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                            <span className="text-2xl">👤</span>
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs text-white/50 uppercase tracking-wider">Me</span>
                                <span
                                    className="text-3xl font-black"
                                    style={{ color: won || tied ? style.accent : '#fff' }}
                                >
                                    {Math.round(userScore)}
                                </span>
                            </div>

                            {/* VS */}
                            <div className="text-xl font-black text-white/30">VS</div>

                            {/* Opponent score */}
                            <div className="flex flex-col items-center">
                                <div
                                    className="w-20 h-20 rounded-full overflow-hidden mb-2 flex items-center justify-center"
                                    style={{
                                        background: lost ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                                        border: `3px solid ${lost ? style.accent : 'rgba(255,255,255,0.3)'}`,
                                        boxShadow: lost ? `0 0 20px ${style.glow}` : 'none'
                                    }}
                                >
                                    <span className="text-3xl">{lost ? '😎' : '🤷'}</span>
                                </div>
                                <span className="text-xs text-white/50 uppercase tracking-wider">Them</span>
                                <span
                                    className="text-3xl font-black"
                                    style={{ color: lost ? style.accent : '#fff' }}
                                >
                                    {Math.round(challengeScore)}
                                </span>
                            </div>
                        </div>

                        {/* Point difference */}
                        <div
                            className="rounded-xl p-3 text-center mb-4"
                            style={{
                                background: `${style.accent}15`,
                                border: `1px solid ${style.accent}30`
                            }}
                        >
                            <p className="text-sm" style={{ color: style.accent }}>
                                {won
                                    ? `Won by ${diff} points 🔥`
                                    : tied
                                        ? `Exactly tied! Fate decides.`
                                        : `Lost by ${diff} points`
                                }
                            </p>
                        </div>

                        {/* CTA text */}
                        <p className="text-center text-white/60 text-sm mb-4">
                            {won
                                ? "Think you can beat me? 👀"
                                : tied
                                    ? "Rematch to break the tie?"
                                    : "I demand a rematch! ⚔️"
                            }
                        </p>

                        {/* Footer */}
                        <div className="flex items-center justify-center gap-2">
                            <img src="/logo.svg" alt="" className="h-5 opacity-50" />
                            <span className="text-gray-500 text-xs">FitRate.app</span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 w-80">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-4 rounded-2xl font-bold bg-white/10 text-white active:scale-[0.97] transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 py-4 rounded-2xl font-bold text-black active:scale-[0.97] transition-transform"
                        style={{ background: style.gradient }}
                    >
                        📤 Send Result
                    </button>
                </div>
            </div>
        </div>
    )
}
