import React, { useRef, useState } from 'react'
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
    const [isSharing, setIsSharing] = useState(false)
    const [shareStatus, setShareStatus] = useState(null) // 'success' | 'error' | null

    const creatorScore = battleData?.creatorScore || 0
    const responderScore = battleData?.responderScore || 0
    const creatorThumb = battleData?.creatorThumb
    const responderThumb = battleData?.responderThumb
    const battleCommentary = battleData?.battleCommentary
    const winningFactor = battleData?.winningFactor

    // NEW: Original scores (what users saw when they first scanned)
    const originalCreatorScore = battleData?.originalCreatorScore
    const originalResponderScore = battleData?.originalResponderScore
    const scoresRecalculated = battleData?.scoresRecalculated

    // Determine winner - USE API winner field (AI head-to-head comparison)
    // Falls back to score comparison for legacy battles without winner field
    const apiWinner = battleData?.winner // 'creator' | 'opponent' | 'tie' | null
    const creatorWon = apiWinner ? apiWinner === 'creator' : creatorScore > responderScore
    const responderWon = apiWinner ? apiWinner === 'opponent' : responderScore > creatorScore
    const tied = apiWinner ? apiWinner === 'tie' : creatorScore === responderScore
    const userWon = isCreator ? creatorWon : responderWon

    // Use marginOfVictory from API if available, otherwise calculate from scores
    const diff = battleData?.marginOfVictory ?? Math.abs(creatorScore - responderScore)

    const winColor = '#00ff88'
    const loseColor = '#ff4444'
    const tieColor = '#ffd700'

    const userScore = isCreator ? creatorScore : responderScore
    const opponentScore = isCreator ? responderScore : creatorScore
    const userThumb = isCreator ? creatorThumb : responderThumb
    const opponentThumb = isCreator ? responderThumb : creatorThumb

    // NEW: Original scores for user and opponent
    const userOriginalScore = isCreator ? originalCreatorScore : originalResponderScore
    const opponentOriginalScore = isCreator ? originalResponderScore : originalCreatorScore

    const handleShare = async () => {
        if (isSharing) return // Prevent double-clicks

        playSound('click')
        vibrate(30)
        setIsSharing(true)
        setShareStatus(null)

        if (!cardRef.current) {
            setIsSharing(false)
            setShareStatus('error')
            return
        }

        try {
            // Generate image from card
            // Note: useCORS=true requires images to have proper CORS headers from server
            // We DON'T use allowTaint because tainted canvases can't be exported
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: '#0a0a0f',
                logging: false,
                useCORS: true,
                // Don't use allowTaint - it prevents toBlob from working
                // If images fail CORS, they just won't appear (better than total failure)
                imageTimeout: 5000,
                onclone: (clonedDoc) => {
                    // Force crossOrigin on all images in the clone
                    const images = clonedDoc.querySelectorAll('img')
                    images.forEach(img => {
                        img.crossOrigin = 'anonymous'
                        // Add error handler to prevent breaking if image fails
                        img.onerror = () => {
                            img.style.display = 'none'
                        }
                    })
                }
            }).catch(err => {
                console.error('[BattleShareCard] html2canvas failed:', err)
                throw new Error('Failed to generate image')
            })

            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob(blob => {
                    if (blob) resolve(blob)
                    else reject(new Error('Failed to create image blob'))
                }, 'image/png')
            })

            const file = new File([blob], `fitrate-battle-${Date.now()}.png`, { type: 'image/png' })

            const shareText = userWon
                ? `🏆 I won a style battle on FitRate! ${Math.round(userScore)} vs ${Math.round(opponentScore)} 🔥`
                : tied
                    ? `🤝 Epic tie in a FitRate style battle! Both scored ${Math.round(userScore)}!`
                    : `⚔️ Just battled on FitRate! ${Math.round(userScore)} vs ${Math.round(opponentScore)} - so close!`

            // Try native share with file
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: userWon ? 'I won a style battle! 🏆' : 'Check out this style battle!',
                    text: shareText
                })
                setShareStatus('success')
                playSound('success')
                vibrate([30, 20, 50])
            } else if (navigator.share) {
                // Share without file (text only)
                await navigator.share({
                    title: userWon ? 'I won a style battle! 🏆' : 'Check out this style battle!',
                    text: shareText + '\n\nfitrate.app'
                })
                // Also download the image
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `fitrate-battle-${Date.now()}.png`
                a.click()
                URL.revokeObjectURL(url)
                setShareStatus('success')
                playSound('success')
            } else {
                // Complete fallback: download + copy text
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `fitrate-battle-${Date.now()}.png`
                a.click()
                URL.revokeObjectURL(url)

                // Copy text to clipboard
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(shareText + '\n\nfitrate.app')
                }

                setShareStatus('success')
                playSound('pop')
                vibrate(20)
            }
        } catch (err) {
            console.error('[BattleShareCard] Share failed:', err)

            // If user cancelled share, don't show error
            if (err.name === 'AbortError') {
                setShareStatus(null)
            } else {
                // Try text-only fallback share
                const shareText = userWon
                    ? `🏆 I won a style battle on FitRate! ${Math.round(userScore)} vs ${Math.round(opponentScore)} 🔥\n\nfitrate.app`
                    : tied
                        ? `🤝 Epic tie in a FitRate style battle! Both scored ${Math.round(userScore)}!\n\nfitrate.app`
                        : `⚔️ Just battled on FitRate! ${Math.round(userScore)} vs ${Math.round(opponentScore)} - so close!\n\nfitrate.app`

                try {
                    if (navigator.share) {
                        await navigator.share({
                            title: userWon ? 'I won a style battle! 🏆' : 'Check out this style battle!',
                            text: shareText
                        })
                        setShareStatus('success')
                        playSound('success')
                    } else if (navigator.clipboard) {
                        await navigator.clipboard.writeText(shareText)
                        setShareStatus('success')
                        playSound('pop')
                        vibrate(20)
                    } else {
                        // Last resort failed
                        setShareStatus('error')
                        playSound('error')
                        vibrate(50)
                    }
                } catch (fallbackErr) {
                    console.error('[BattleShareCard] Fallback share also failed:', fallbackErr)
                    setShareStatus('error')
                    playSound('error')
                    vibrate(50)
                }
            }
        } finally {
            setIsSharing(false)
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
                                        <img src={userThumb} alt="Your fit" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                    )}
                                </div>
                                <div className="text-xs text-white/50 mb-1">You</div>
                                {scoresRecalculated && userOriginalScore != null ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 text-xs text-white/40">
                                            <span>{Math.round(userOriginalScore)}</span>
                                            <span>→</span>
                                        </div>
                                        <div className="text-xl font-black" style={{
                                            color: userWon ? winColor : tied ? tieColor : '#fff'
                                        }}>
                                            {userScore.toFixed(1)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-2xl font-black" style={{
                                        color: userWon ? winColor : tied ? tieColor : '#fff'
                                    }}>
                                        {userScore.toFixed(1)}
                                    </div>
                                )}
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
                                        <img src={opponentThumb} alt="Their fit" className="w-full h-full object-cover" crossOrigin="anonymous" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl">👤</div>
                                    )}
                                </div>
                                <div className="text-xs text-white/50 mb-1">Opponent</div>
                                {scoresRecalculated && opponentOriginalScore != null ? (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-center gap-1 text-xs text-white/40">
                                            <span>{Math.round(opponentOriginalScore)}</span>
                                            <span>→</span>
                                        </div>
                                        <div className="text-xl font-black" style={{
                                            color: !userWon && !tied ? winColor : tied ? tieColor : '#fff'
                                        }}>
                                            {opponentScore.toFixed(1)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-2xl font-black" style={{
                                        color: !userWon && !tied ? winColor : tied ? tieColor : '#fff'
                                    }}>
                                        {opponentScore.toFixed(1)}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Score Recalculation Note */}
                        {scoresRecalculated && (
                            <div className="text-[9px] text-white/30 text-center mb-2 italic">
                                Scores recalculated for head-to-head comparison
                            </div>
                        )}

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
                <div className="flex flex-col gap-3 mt-6 w-80">
                    {/* Status feedback */}
                    {shareStatus === 'success' && (
                        <div className="text-center text-sm py-2 px-4 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30">
                            ✓ Image saved! Share it from your gallery.
                        </div>
                    )}
                    {shareStatus === 'error' && (
                        <div className="text-center text-sm py-2 px-4 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                            Failed to share. Try again!
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-4 rounded-2xl font-bold bg-white/10 text-white active:scale-[0.97] transition-transform"
                            disabled={isSharing}
                        >
                            Close
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex-1 py-4 rounded-2xl font-bold text-black active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
                            style={{
                                background: userWon
                                    ? `linear-gradient(135deg, ${winColor}, #00d4ff)`
                                    : tied
                                        ? `linear-gradient(135deg, ${tieColor}, #ffa500)`
                                        : `linear-gradient(135deg, #8b5cf6, #3b82f6)`,
                                opacity: isSharing ? 0.7 : 1
                            }}
                        >
                            {isSharing ? (
                                <>
                                    <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"></span>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>📤 Share</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
