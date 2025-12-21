import React from 'react'
import { playSound, vibrate } from '../utils/soundEffects'

/**
 * ChallengeResultScreen - Shows "Who Won?" after a challenge scan
 * Displays victory/defeat with celebration animations
 */
export default function ChallengeResultScreen({
    userScore,           // User's new score
    challengeScore,      // Opponent's score from URL
    onViewResults,       // Go to full results
    onChallengeBack,     // Start new challenge share flow
    onTryAgain           // Go home to scan again
}) {
    const won = userScore > challengeScore
    const tied = userScore === challengeScore
    const diff = Math.abs(userScore - challengeScore)

    // Play victory/defeat sound on mount
    React.useEffect(() => {
        if (won) {
            playSound('celebrate')
            vibrate([100, 50, 100, 50, 200]) // Victory pattern
        } else if (tied) {
            playSound('pop')
            vibrate(50)
        } else {
            playSound('click')
            vibrate(30)
        }
    }, [won, tied])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative overflow-hidden"
            style={{
                background: won
                    ? 'linear-gradient(180deg, #0a1a0a 0%, #001a00 50%, #0a1a0a 100%)'
                    : tied
                        ? 'linear-gradient(180deg, #1a1a0a 0%, #1a1a00 50%, #1a1a0a 100%)'
                        : 'linear-gradient(180deg, #1a0a0a 0%, #1a0000 50%, #1a0a0a 100%)'
            }}
        >
            {/* Victory/Defeat Glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
                background: won
                    ? 'radial-gradient(circle at 50% 40%, rgba(0,255,136,0.2) 0%, transparent 60%)'
                    : tied
                        ? 'radial-gradient(circle at 50% 40%, rgba(255,215,0,0.2) 0%, transparent 60%)'
                        : 'radial-gradient(circle at 50% 40%, rgba(255,68,68,0.15) 0%, transparent 60%)'
            }} />

            {/* Result Icon */}
            <div className="text-8xl mb-6 animate-bounce" style={{ animationDuration: '1s' }}>
                {won ? '🏆' : tied ? '🤝' : '😭'}
            </div>

            {/* Result Title */}
            <h1 className="text-4xl font-black mb-2" style={{
                color: won ? '#00ff88' : tied ? '#ffd700' : '#ff4444'
            }}>
                {won ? 'YOU WON!' : tied ? "IT'S A TIE!" : 'THEY WON...'}
            </h1>

            {/* Score Comparison */}
            <div className="flex items-center gap-4 my-8">
                {/* Your Score */}
                <div className="flex flex-col items-center">
                    <span className="text-sm text-white/50 uppercase tracking-wide mb-2">You</span>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black"
                        style={{
                            background: won ? 'rgba(0,255,136,0.2)' : 'rgba(255,255,255,0.1)',
                            border: won ? '3px solid #00ff88' : '3px solid rgba(255,255,255,0.2)',
                            color: won ? '#00ff88' : '#fff'
                        }}>
                        {userScore}
                    </div>
                </div>

                {/* VS */}
                <div className="text-2xl font-black text-white/30">VS</div>

                {/* Challenger Score */}
                <div className="flex flex-col items-center">
                    <span className="text-sm text-white/50 uppercase tracking-wide mb-2">Them</span>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black"
                        style={{
                            background: !won && !tied ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                            border: !won && !tied ? '3px solid #ff4444' : '3px solid rgba(255,255,255,0.2)',
                            color: !won && !tied ? '#ff4444' : '#fff'
                        }}>
                        {challengeScore}
                    </div>
                </div>
            </div>

            {/* Difference Message */}
            <p className="text-lg text-white/60 mb-8">
                {won
                    ? `You beat them by ${diff} points! 🔥`
                    : tied
                        ? `Exactly the same! Fate has spoken.`
                        : `They got you by ${diff} points. Revenge time?`}
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
                {/* Primary CTA - Changes based on result */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(20)
                        if (won) {
                            onViewResults() // Show off your win
                        } else {
                            onChallengeBack() // Challenge them back!
                        }
                    }}
                    className="w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.97]"
                    style={{
                        background: won
                            ? 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)'
                            : 'linear-gradient(135deg, #ff4444 0%, #ff8800 100%)',
                        color: '#000',
                        boxShadow: won
                            ? '0 8px 30px rgba(0,255,136,0.3)'
                            : '0 8px 30px rgba(255,68,68,0.3)'
                    }}
                >
                    {won ? '🏆 Flex Your Victory' : '🔥 Challenge Them Back!'}
                </button>

                {/* Secondary CTA */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(15)
                        if (won) {
                            onChallengeBack() // Challenge someone else
                        } else {
                            onTryAgain() // Try again with different outfit
                        }
                    }}
                    className="w-full py-3 rounded-xl font-medium text-sm transition-all active:scale-[0.97]"
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    {won ? '👊 Challenge Someone Else' : '📸 Try a Different Outfit'}
                </button>

                {/* View Full Results */}
                <button
                    onClick={() => {
                        playSound('click')
                        vibrate(10)
                        onViewResults()
                    }}
                    className="w-full py-2 text-sm font-medium transition-all active:opacity-60"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                >
                    View Full Results →
                </button>
            </div>
        </div>
    )
}
