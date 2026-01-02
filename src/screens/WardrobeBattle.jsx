import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getWardrobe, hasCompleteWardrobe } from './WardrobeSetup'
import { getDisplayName } from '../utils/displayNameStorage'

// ============================================
// ANIMATED BACKGROUND
// ============================================
const AnimatedBackground = ({ color }) => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
            className="absolute w-96 h-96 rounded-full blur-3xl opacity-20"
            style={{
                background: `radial-gradient(circle, ${color}, transparent)`,
                top: '-10%',
                right: '-20%',
                animation: 'orb-float 8s ease-in-out infinite'
            }}
        />
        <div
            className="absolute w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{
                background: `radial-gradient(circle, #00ff88, transparent)`,
                bottom: '-5%',
                left: '-10%',
                animation: 'orb-float 12s ease-in-out infinite reverse'
            }}
        />
    </div>
)

// ============================================
// ROUND RESULT COMPONENT
// ============================================
const RoundResult = ({ roundNum, myOutfit, opponentOutfit, myScore, opponentScore, isRevealed }) => {
    const won = myScore > opponentScore
    const tie = myScore === opponentScore

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 p-4 rounded-2xl mb-3"
            style={{
                background: isRevealed
                    ? won ? 'rgba(0,255,136,0.1)' : tie ? 'rgba(255,255,255,0.05)' : 'rgba(255,50,50,0.1)'
                    : 'rgba(255,255,255,0.03)',
                border: isRevealed
                    ? won ? '1px solid rgba(0,255,136,0.3)' : tie ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,50,50,0.3)'
                    : '1px solid rgba(255,255,255,0.1)'
            }}
        >
            {/* Round number */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-white/60 text-sm font-bold">{roundNum}</span>
            </div>

            {/* My outfit */}
            <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img src={myOutfit.thumb} alt="My outfit" className="w-full h-full object-cover" />
                {isRevealed && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-0.5">
                        <span className="text-white text-xs font-bold">{Math.round(myScore)}</span>
                    </div>
                )}
            </div>

            {/* VS */}
            <div className="flex-shrink-0">
                <span className="text-white/40 text-xs font-bold">VS</span>
            </div>

            {/* Opponent outfit */}
            <div className="relative w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                {isRevealed ? (
                    <>
                        <img src={opponentOutfit?.thumb || '/placeholder.jpg'} alt="Opponent" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-0.5">
                            <span className="text-white text-xs font-bold">{Math.round(opponentScore)}</span>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <span className="text-2xl">❓</span>
                    </div>
                )}
            </div>

            {/* Result */}
            <div className="flex-1 text-right">
                {isRevealed && (
                    <span className={`text-lg font-bold ${won ? 'text-green-400' : tie ? 'text-white/50' : 'text-red-400'}`}>
                        {won ? '✓ Win' : tie ? '— Tie' : '✗ Loss'}
                    </span>
                )}
            </div>
        </motion.div>
    )
}

// ============================================
// SCORE INDICATOR
// ============================================
const ScoreIndicator = ({ myWins, opponentWins, opponentName = 'Opponent', color }) => {
    return (
        <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
                <span className="text-4xl font-black text-white">{myWins}</span>
                <p className="text-white/50 text-xs">You</p>
            </div>
            <div className="text-white/30 text-2xl">-</div>
            <div className="text-center">
                <span className="text-4xl font-black text-white">{opponentWins}</span>
                <p className="text-white/50 text-xs truncate max-w-[80px]">{opponentName}</p>
            </div>
        </div>
    )
}

// ============================================
// MAIN WARDROBE BATTLE SCREEN
// ============================================
export default function WardrobeBattle({
    myOutfits,
    opponentOutfits,
    opponentName = 'Opponent',
    onComplete,
    onCancel,
    playSound,
    vibrate,
    color = '#9b59b6'
}) {
    const [currentRound, setCurrentRound] = useState(0)
    const [roundResults, setRoundResults] = useState([])
    const [isRevealing, setIsRevealing] = useState(false)
    const [battleComplete, setBattleComplete] = useState(false)
    const [myWins, setMyWins] = useState(0)
    const [opponentWins, setOpponentWins] = useState(0)

    // Simulate AI scoring for each outfit (in real impl, this would come from backend)
    const getScore = useCallback(() => Math.floor(Math.random() * 30) + 70, [])

    const revealNextRound = useCallback(() => {
        if (currentRound >= 5 || myWins >= 3 || opponentWins >= 3) {
            setBattleComplete(true)
            return
        }

        setIsRevealing(true)
        playSound?.('whoosh')

        // Simulate scoring
        const myScore = getScore()
        const oppScore = getScore()

        setTimeout(() => {
            const result = {
                myOutfit: myOutfits[currentRound],
                opponentOutfit: opponentOutfits?.[currentRound] || { thumb: '/placeholder.jpg' },
                myScore,
                opponentScore: oppScore,
                isRevealed: true
            }

            setRoundResults(prev => [...prev, result])

            if (myScore > oppScore) {
                setMyWins(w => w + 1)
                playSound?.('success')
                vibrate?.([50, 30, 50])
            } else if (oppScore > myScore) {
                setOpponentWins(w => w + 1)
                playSound?.('error')
                vibrate?.(30)
            } else {
                playSound?.('click')
            }

            setCurrentRound(r => r + 1)
            setIsRevealing(false)
        }, 1500)
    }, [currentRound, myWins, opponentWins, myOutfits, opponentOutfits, getScore, playSound, vibrate])

    // Check for winner
    useEffect(() => {
        if (myWins >= 3 || opponentWins >= 3) {
            setBattleComplete(true)
            if (myWins >= 3) {
                playSound?.('celebrate')
                vibrate?.([100, 50, 100, 50, 200])
            }
        }
    }, [myWins, opponentWins, playSound, vibrate])

    const handleComplete = () => {
        const result = myWins > opponentWins ? 'win' : myWins < opponentWins ? 'loss' : 'tie'
        onComplete?.({
            result,
            myWins,
            opponentWins,
            rounds: roundResults
        })
    }

    return (
        <div
            className="fixed inset-0 flex flex-col overflow-hidden"
            style={{
                background: `linear-gradient(180deg, #0a0a1a 0%, ${color}08 50%, #0a0a1a 100%)`
            }}
        >
            <AnimatedBackground color={color} />

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
                    <h1 className="text-xl font-black text-white">Wardrobe Wars</h1>
                    <p className="text-white/50 text-xs">Best of 5 • First to 3</p>
                </div>

                <div className="w-11" />
            </div>

            {/* Score */}
            <div className="px-6 pt-4">
                <ScoreIndicator myWins={myWins} opponentWins={opponentWins} opponentName={opponentName} color={color} />
            </div>

            {/* Rounds */}
            <div className="flex-1 px-6 overflow-y-auto pb-24">
                <AnimatePresence>
                    {roundResults.map((result, i) => (
                        <RoundResult
                            key={i}
                            roundNum={i + 1}
                            myOutfit={result.myOutfit}
                            opponentOutfit={result.opponentOutfit}
                            myScore={result.myScore}
                            opponentScore={result.opponentScore}
                            isRevealed={result.isRevealed}
                        />
                    ))}
                </AnimatePresence>

                {/* Pending round indicator */}
                {!battleComplete && currentRound < 5 && (
                    <div className="flex items-center gap-4 p-4 rounded-2xl border border-dashed border-white/20">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                            <span className="text-white/60 text-sm font-bold">{currentRound + 1}</span>
                        </div>
                        <span className="text-white/40 text-sm">
                            {isRevealing ? '⏳ Revealing...' : 'Ready to reveal'}
                        </span>
                    </div>
                )}
            </div>

            {/* Bottom CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black/90 to-transparent z-30">
                {battleComplete ? (
                    <div className="text-center mb-4">
                        <span className="text-4xl block mb-2">
                            {myWins > opponentWins ? '🎉' : myWins < opponentWins ? '😢' : '🤝'}
                        </span>
                        <h2 className="text-2xl font-black text-white">
                            {myWins > opponentWins ? 'Victory!' : myWins < opponentWins ? 'Defeat' : 'Tie Game'}
                        </h2>
                        <p className="text-white/50">
                            Final Score: {myWins} - {opponentWins}
                        </p>
                    </div>
                ) : null}

                <button
                    onClick={battleComplete ? handleComplete : revealNextRound}
                    disabled={isRevealing}
                    className="w-full py-4 rounded-2xl font-bold text-lg text-black transition-all active:scale-[0.98]"
                    style={{
                        background: `linear-gradient(135deg, ${color}, #00ff88)`,
                        opacity: isRevealing ? 0.6 : 1
                    }}
                >
                    {battleComplete
                        ? '🏆 Continue'
                        : isRevealing
                            ? '⏳ Revealing...'
                            : `⚔️ Reveal Round ${currentRound + 1}`}
                </button>
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
