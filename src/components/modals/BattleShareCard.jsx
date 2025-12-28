import React, { useRef } from 'react'
import html2canvas from 'html2canvas'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * BattleShareCard
 * 
 * Shareable battle results card showing both outfits, scores, and winner.
 * Generates an image for social media sharing.
 */
export default function BattleShareCard({
    battleData,
    isCreator,
    onClose
}) {
    const cardRef = useRef(null)

    const creatorScore = battleData?.creatorScore || 0
    const responderScore = battleData?.responderScore || 0
    const creatorThumb = battleData?.creatorThumb
    const responderThumb = battleData?.responderThumb
    const battleCommentary = battleData?.battleCommentary
    const winningFactor = battleData?.winningFactor

    const creatorWon = creatorScore > responderScore
    const responderWon = responderScore > creatorScore
    const tied = creatorScore === responderScore
    const userWon = isCreator ? creatorWon : responderWon
    const diff = Math.abs(creatorScore - responderScore)

    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'

    const userScore = isCreator ? creatorScore : responderScore
    const opponentScore = isCreator ? responderScore : creatorScore
    const userThumb = isCreator ? creatorThumb : responderThumb
    const opponentThumb = isCreator ? responderThumb : creatorThumb

    const handleShare = async () => {
        playSound('click')
        vibrate(30)

        if (!cardRef.current) return

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: '#0a0a0f',
                logging: false,
                useCORS: true
            })

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
            const file = new File([blob], `fitrate-battle-${Date.now()}.png`, { type: 'image/png' })

            const shareText = userWon
                ? `🏆 I won a style battle on FitRate! ${Math.round(userScore)} vs ${Math.round(opponentScore)} 🔥`
                : tied
                    ? `🤝 Epic tie in a FitRate style battle! Both scored ${Math.round(userScore)}!`
                    : `⚔️ Just battled on FitRate! ${Math.round(userScore)} vs ${Math.round(opponentScore)} - so close!`

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: userWon ? 'I won a style battle! 🏆' : 'Check out this style battle!',
                    text: shareText
                })
            } else {
                // Fallback: download
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `fitrate-battle-${Date.now()}.png`
                a.click()
                URL.revokeObjectURL(url)

                // Copy text to clipboard
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareText)
                }
            }
        } catch (err) {
            console.error('Share failed:', err)
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
            <div className="flex flex-col items-center max-h-[90vh] overflow-auto">
                {/* The shareable card */}
                <div
                    ref={cardRef}
                    className="w-80 rounded-3xl p-5 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a0f 100%)',
                        boxShadow: `0 0 60px ${userWon ? winColor : tied ? tieColor : loseColor}30`
                    }}
                >
                    {/* Gradient border */}
                    <div className="absolute inset-0 rounded-3xl" style={{
                        background: userWon
                            ? `linear-gradient(135deg, ${winColor}, #00d4ff)`
                            : tied
                                ? `linear-gradient(135deg, ${tieColor}, #ffa500)`
                                : `linear-gradient(135deg, ${loseColor}, #ff6b6b)`,
                        padding: '2px'
                    }}>
                        <div className="absolute inset-[2px] rounded-[22px]" style={{
                            background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a0f 100%)'
                        }} />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-4">
                            <span className="text-3xl block mb-1">
                                {userWon ? '🏆' : tied ? '🤝' : '⚔️'}
                            </span>
                            <p className="font-black text-lg" style={{
                                color: userWon ? winColor : tied ? tieColor : '#fff'
                            }}>
                                {userWon ? 'VICTORY!' : tied ? 'TIE MATCH!' : 'BATTLE COMPLETE'}
                            </p>
                        </div>

                        {/* VS Layout - Both outfits */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                            {/* Left Player (You) */}
                            <div className="flex-1 text-center">
                                <div
                                    className="w-24 h-24 mx-auto rounded-2xl mb-2 bg-white/5 overflow-hidden"
                                    style={{
                                        border: `2px solid ${isCreator ? (creatorWon ? winColor : loseColor) : (responderWon ? winColor : loseColor)}`,
                                        boxShadow: (isCreator ? creatorWon : responderWon) ? `0 0 20px ${winColor}40` : 'none'
                                    }}
                                >
                                    {userThumb ? (
                                        <img src={userThumb} alt="Your fit" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                    )}
                                </div>
                                <div className="text-xs text-white/50 mb-1">You</div>
                                <div className="text-2xl font-black" style={{
                                    color: userWon ? winColor : tied ? tieColor : '#fff'
                                }}>
                                    {userScore.toFixed(1)}
                                </div>
                            </div>

                            {/* VS Badge */}
                            <div className="flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                    <span className="text-sm font-black text-white/60">VS</span>
                                </div>
                            </div>

                            {/* Right Player (Opponent) */}
                            <div className="flex-1 text-center">
                                <div
                                    className="w-24 h-24 mx-auto rounded-2xl mb-2 bg-white/5 overflow-hidden"
                                    style={{
                                        border: `2px solid ${!isCreator ? (creatorWon ? winColor : loseColor) : (responderWon ? winColor : loseColor)}`,
                                        boxShadow: (!isCreator ? creatorWon : responderWon) ? `0 0 20px ${winColor}40` : 'none'
                                    }}
                                >
                                    {opponentThumb ? (
                                        <img src={opponentThumb} alt="Their fit" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                    )}
                                </div>
                                <div className="text-xs text-white/50 mb-1">Opponent</div>
                                <div className="text-2xl font-black" style={{
                                    color: !userWon && !tied ? winColor : tied ? tieColor : '#fff'
                                }}>
                                    {opponentScore.toFixed(1)}
                                </div>
                            </div>
                        </div>

                        {/* Win Margin */}
                        {!tied && (
                            <div className="text-center mb-3">
                                <span
                                    className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                                    style={{
                                        background: userWon ? `${winColor}20` : `${loseColor}20`,
                                        color: userWon ? winColor : loseColor
                                    }}
                                >
                                    {userWon ? `Won by ${diff.toFixed(1)} pts` : `Lost by ${diff.toFixed(1)} pts`}
                                </span>
                            </div>
                        )}

                        {/* AI Commentary */}
                        {battleCommentary && (
                            <div className="bg-white/5 rounded-xl p-3 mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm">🤖</span>
                                    <span className="text-[10px] text-white/40 uppercase tracking-wider">AI Judge</span>
                                </div>
                                <p className="text-xs text-white/80 leading-relaxed">
                                    "{battleCommentary}"
                                </p>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <img src="/logo.svg" alt="" className="h-5 opacity-60" />
                                <span className="text-[10px] text-white/40 font-medium">FitRate.app</span>
                            </div>
                            <span className="text-[10px] text-white/30">
                                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6 w-80">
                    <button
                        onClick={handleClose}
                        className="flex-1 py-4 rounded-2xl font-bold bg-white/10 text-white active:scale-[0.97] transition-transform"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 py-4 rounded-2xl font-bold text-black active:scale-[0.97] transition-transform"
                        style={{
                            background: userWon
                                ? `linear-gradient(135deg, ${winColor}, #00d4ff)`
                                : tied
                                    ? `linear-gradient(135deg, ${tieColor}, #ffa500)`
                                    : `linear-gradient(135deg, #8b5cf6, #3b82f6)`
                        }}
                    >
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
    )
}
