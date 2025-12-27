import React, { useRef } from 'react'
import html2canvas from 'html2canvas'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * WinnerShareCard
 * 
 * Shareable medal card for Top 5 winners.
 * Generates an image they can download/share to social media.
 */
export default function WinnerShareCard({
    rank,
    score,
    theme,
    themeEmoji,
    weekId,
    isPro,
    onClose
}) {
    const cardRef = useRef(null)

    // Medal styles based on rank
    const getMedalStyle = () => {
        if (rank === 1) return {
            gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #B8860B 100%)',
            border: '#FFD700',
            glow: 'rgba(255, 215, 0, 0.5)',
            title: '🏆 CHAMPION',
            medal: '👑'
        }
        if (rank === 2) return {
            gradient: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 50%, #A8A8A8 100%)',
            border: '#C0C0C0',
            glow: 'rgba(192, 192, 192, 0.5)',
            title: '🥈 RUNNER UP',
            medal: '🥈'
        }
        if (rank === 3) return {
            gradient: 'linear-gradient(135deg, #E8A862 0%, #CD7F32 50%, #8B4513 100%)',
            border: '#CD7F32',
            glow: 'rgba(205, 127, 50, 0.5)',
            title: '🥉 THIRD PLACE',
            medal: '🥉'
        }
        return {
            gradient: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
            border: '#8B5CF6',
            glow: 'rgba(139, 92, 246, 0.5)',
            title: '⭐ TOP 5 WINNER',
            medal: '⭐'
        }
    }

    const style = getMedalStyle()

    const handleShare = async () => {
        playSound('click')
        vibrate(30)

        if (!cardRef.current) return

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2,
                backgroundColor: null,
                logging: false
            })

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
            const file = new File([blob], `fitrate-winner-${weekId}.png`, { type: 'image/png' })

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: `I ranked #${rank} in FitRate! 🏆`,
                    text: `Just placed #${rank} in the "${theme}" Style Challenge! 🔥`
                })
            } else {
                // Fallback: download
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `fitrate-winner-${weekId}.png`
                a.click()
                URL.revokeObjectURL(url)
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
            {/* The shareable card */}
            <div className="flex flex-col items-center">
                <div
                    ref={cardRef}
                    className="w-80 rounded-3xl p-6 relative overflow-hidden"
                    style={{
                        background: '#0a0a0f',
                        boxShadow: `0 0 60px ${style.glow}`
                    }}
                >
                    {/* Medal border */}
                    <div className="absolute inset-0 rounded-3xl" style={{
                        background: style.gradient,
                        padding: '3px'
                    }}>
                        <div className="absolute inset-[3px] rounded-[21px] bg-[#0a0a0f]" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                        {/* Header */}
                        <div className="text-center mb-4">
                            <span className="text-5xl block mb-2">{style.medal}</span>
                            <p className="font-black text-lg" style={{
                                background: style.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                {style.title}
                            </p>
                        </div>

                        {/* Rank */}
                        <div className="text-center mb-4">
                            <span className="text-7xl font-black" style={{
                                background: style.gradient,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: `0 0 40px ${style.glow}`
                            }}>
                                #{rank}
                            </span>
                        </div>

                        {/* Score */}
                        <div className="bg-white/5 rounded-2xl p-4 mb-4 text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Score</p>
                            <p className="text-4xl font-black text-white">
                                {isPro ? score.toFixed(1) : Math.round(score)}
                            </p>
                        </div>

                        {/* Theme */}
                        <div className="text-center mb-4">
                            <span className="text-2xl">{themeEmoji}</span>
                            <p className="text-white font-bold">{theme}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{weekId}</p>
                        </div>

                        {/* Achievement Banner */}
                        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-xl p-2 text-center">
                            <p className="text-purple-300 text-sm font-bold">
                                {rank === 1 ? '👑 #1 CHAMPION' : '🏅 TOP 5 FINISHER'}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <img src="/logo.svg" alt="" className="h-6 opacity-50" />
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
                        Close
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex-1 py-4 rounded-2xl font-bold text-black active:scale-[0.97] transition-transform"
                        style={{ background: style.gradient }}
                    >
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
    )
}
