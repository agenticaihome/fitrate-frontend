import React, { useState, useMemo } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { downloadImage } from '../utils/imageUtils'
import { trackShare } from '../utils/analytics'

// Mini Rating Bar for share preview
const MiniRatingBar = ({ label, value, icon, color }) => (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] border border-white/10">
        <span className="text-sm">{icon}</span>
        <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">{label}</span>
                <span className="text-xs font-black" style={{ color }}>{value}</span>
            </div>
            <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                    className="h-full rounded-full"
                    style={{
                        width: `${Math.min(100, Math.max(0, value))}%`,
                        background: `linear-gradient(90deg, ${color} 0%, ${color}cc 100%)`,
                        boxShadow: `0 0 6px ${color}66`
                    }}
                />
            </div>
        </div>
    </div>
)

export default function SharePreviewScreen({
    shareData,
    scores,
    onClose, // setScreen('results')
    onShareSuccess, // setScreen('share-success')
    showToast,
    toastMessage,
    setToastMessage,
    setShowToast
}) {
    const showCopiedToast = (message) => {
        setToastMessage(message)
        setShowToast(true)
        playSound('pop')
        vibrate(20)
        setTimeout(() => setShowToast(false), 2000)
    }

    const handleShare = async () => {
        playSound('share')
        vibrate(30)

        if (navigator.share) {
            try {
                // Always try to share with image first
                const data = {
                    title: 'My FitRate Score',
                    text: shareData.text,
                }

                // Check if we can share files (most mobile browsers)
                if (navigator.canShare && navigator.canShare({ files: [shareData.file] })) {
                    data.files = [shareData.file]
                }

                await navigator.share(data)
                trackShare('native_share', 'outfit_rating', scores?.overall)
                onShareSuccess()
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // Fallback: download + copy
                    downloadImage(shareData.imageBlob, 'fitrate-score.png', shareData.text)
                    trackShare('download', 'outfit_rating', scores?.overall)
                    showCopiedToast('Image saved! Caption copied ✅')
                }
            }
        } else {
            // Desktop fallback
            downloadImage(shareData.imageBlob, 'fitrate-score.png', shareData.text)
            trackShare('download', 'outfit_rating', scores?.overall)
            showCopiedToast('Image saved! Caption copied ✅')
            setTimeout(onShareSuccess, 1500)
        }
    }

    // Share helpers with UTM tracking
    const getShareUrl = () => {
        const baseUrl = `${window.location.origin}?challenge=${scores?.overall || 85}`
        return `${baseUrl}&utm_source=share&utm_medium=social&utm_campaign=fitrate`
    }

    const getShareText = () => {
        return `I got ${scores?.overall || 85}/100 on FitRate! 🔥 Think you can beat it?`
    }

    const copyShareLink = async () => {
        try {
            await navigator.clipboard.writeText(getShareUrl())
            playSound('click')
            showCopiedToast('Link copied! 📋')
            trackShare('copy_link', 'outfit_rating', scores?.overall)
        } catch (err) {
            showCopiedToast("Couldn't copy 😕")
        }
    }

    const shareToTwitter = () => {
        playSound('click')
        vibrate(15)
        const text = encodeURIComponent(getShareText())
        const url = encodeURIComponent(getShareUrl())
        trackShare('twitter', 'outfit_rating', scores?.overall)
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    }

    const shareToFacebook = () => {
        playSound('click')
        vibrate(15)
        const url = encodeURIComponent(getShareUrl())
        trackShare('facebook', 'outfit_rating', scores?.overall)
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    }

    const shareToReddit = () => {
        playSound('click')
        vibrate(15)
        const title = encodeURIComponent(getShareText())
        const url = encodeURIComponent(getShareUrl())
        trackShare('reddit', 'outfit_rating', scores?.overall)
        window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank')
    }

    const shareToSMS = () => {
        playSound('click')
        vibrate(15)
        const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`)
        // Use different format for iOS vs Android
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
        trackShare('sms', 'outfit_rating', scores?.overall)
        window.location.href = isIOS ? `sms:&body=${text}` : `sms:?body=${text}`
    }

    const shareToWhatsApp = () => {
        playSound('click')
        vibrate(15)
        const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`)
        trackShare('whatsapp', 'outfit_rating', scores?.overall)
        window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    // Check if native share is available
    const hasNativeShare = typeof navigator.share === 'function'

    // Theme colors based on mode
    const theme = useMemo(() => {
        if (scores?.roastMode) {
            return { accent: '#ff4444', end: '#ff8800', glow: 'rgba(255,68,68,0.4)' }
        }
        return { accent: '#00d4ff', end: '#00ff88', glow: 'rgba(0,212,255,0.4)' }
    }, [scores?.roastMode])

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-white p-6 overflow-y-auto" style={{
            background: 'radial-gradient(ellipse at top, rgba(0,212,255,0.08) 0%, #0a0a0f 50%)',
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
        }}>
            {/* Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-[400px] h-[400px] rounded-full opacity-20" style={{
                    background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
                    top: '20%', left: '50%',
                    transform: 'translate(-50%, -50%)'
                }} />
            </div>

            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-60" style={{
                    background: 'rgba(0,255,136,0.9)',
                    boxShadow: '0 4px 20px rgba(0,255,136,0.4)',
                    animation: 'cardSlideUp 0.3s ease-out'
                }}>
                    <span className="text-black font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Header */}
            <div className="text-center mb-4 relative z-10">
                <h2 className="text-xl font-black text-white mb-1">Share Your Score</h2>
                <p className="text-xs text-white/50">Show off your style rating</p>
            </div>

            {/* Share Card Preview with Glow */}
            <div className="relative mb-4">
                <div
                    className="absolute -inset-2 rounded-3xl opacity-50"
                    style={{
                        background: `linear-gradient(135deg, ${theme.accent}, ${theme.end})`,
                        filter: 'blur(20px)'
                    }}
                />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl w-[140px] aspect-[9/16]" style={{
                    border: `2px solid ${theme.accent}44`,
                    boxShadow: `0 20px 60px ${theme.glow}`
                }}>
                    <img src={URL.createObjectURL(shareData.imageBlob)} alt="Your outfit rating share card preview" className="w-full h-full object-cover" />
                </div>
            </div>

            {/* Rating Bars Display */}
            {scores && (
                <div className="w-full max-w-xs space-y-1.5 mb-4 relative z-10">
                    <MiniRatingBar label="Color" value={scores.color} icon="🎨" color="#ff6b9d" />
                    <MiniRatingBar label="Fit" value={scores.fit} icon="📐" color="#00d4ff" />
                    <MiniRatingBar label="Style" value={scores.style} icon="✨" color="#ffd700" />
                </div>
            )}

            {/* Caption Preview */}
            <p className="text-xs text-center mb-4 px-4 max-w-xs relative z-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
                "{shareData.text.slice(0, 60)}..."
            </p>

            {/* Primary Share CTA - Native Share with Image */}
            <button
                onClick={handleShare}
                aria-label={hasNativeShare ? 'Share your rating with image to other apps' : 'Download share card and copy caption'}
                className="btn-physical btn-shine w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 mb-4 relative overflow-hidden"
                style={{
                    background: `linear-gradient(135deg, ${theme.end} 0%, ${theme.accent} 100%)`,
                    boxShadow: `0 8px 0 rgba(0,0,0,0.25), 0 20px 40px ${theme.glow}`,
                    color: scores?.roastMode ? '#fff' : '#000'
                }}
            >
                <span className="text-xl" aria-hidden="true">📤</span> {hasNativeShare ? 'Share with Image' : 'Download & Share'}
            </button>

            {/* Fallback Share Buttons - Always visible for more options */}
            <div className="w-full max-w-xs mb-6 relative z-10">
                <p className="text-xs text-center mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Or share directly to:
                </p>
                <div className="share-grid-responsive grid grid-cols-3 gap-2 mb-2" role="group" aria-label="Primary sharing options">
                    {/* WhatsApp - Primary */}
                    <button
                        onClick={shareToWhatsApp}
                        aria-label="Share to WhatsApp"
                        className="glass-card flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95 hover:bg-white/[0.08]"
                        style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)' }}
                    >
                        <span className="text-xl mb-1" aria-hidden="true">💬</span>
                        <span className="text-[10px] font-bold" style={{ color: '#25d366' }}>WhatsApp</span>
                    </button>

                    {/* SMS/Text */}
                    <button
                        onClick={shareToSMS}
                        aria-label="Share via text message"
                        className="glass-card flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95 hover:bg-white/[0.08]"
                    >
                        <span className="text-xl mb-1" aria-hidden="true">📱</span>
                        <span className="text-[10px] font-bold text-white/70">Message</span>
                    </button>

                    {/* Copy Link */}
                    <button
                        onClick={copyShareLink}
                        aria-label="Copy share link to clipboard"
                        className="glass-card flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95 hover:bg-white/[0.08]"
                    >
                        <span className="text-xl mb-1" aria-hidden="true">🔗</span>
                        <span className="text-[10px] font-bold text-white/70">Copy Link</span>
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label="Social media sharing">
                    {/* X (Twitter) */}
                    <button
                        onClick={shareToTwitter}
                        aria-label="Share to X, formerly Twitter"
                        className="glass-card flex flex-col items-center justify-center p-2.5 rounded-xl transition-all active:scale-95 hover:bg-white/[0.08]"
                    >
                        <span className="text-lg mb-0.5" aria-hidden="true">𝕏</span>
                        <span className="text-[9px] font-bold text-white/50">X</span>
                    </button>

                    {/* Facebook */}
                    <button
                        onClick={shareToFacebook}
                        aria-label="Share to Facebook"
                        className="glass-card flex flex-col items-center justify-center p-2.5 rounded-xl transition-all active:scale-95 hover:bg-white/[0.08]"
                    >
                        <span className="text-lg mb-0.5" aria-hidden="true">📘</span>
                        <span className="text-[9px] font-bold text-white/50">Facebook</span>
                    </button>

                    {/* Reddit */}
                    <button
                        onClick={shareToReddit}
                        aria-label="Share to Reddit"
                        className="glass-card flex flex-col items-center justify-center p-2.5 rounded-xl transition-all active:scale-95 hover:bg-white/[0.08]"
                    >
                        <span className="text-lg mb-0.5" aria-hidden="true">🤖</span>
                        <span className="text-[9px] font-bold text-white/50">Reddit</span>
                    </button>
                </div>
            </div>

            {/* Back */}
            <button
                onClick={onClose}
                aria-label="Go back to results screen"
                className="text-sm font-medium transition-all active:scale-95 hover:text-white/60 relative z-10"
                style={{ color: 'rgba(255,255,255,0.4)' }}
            >
                ← Back to Results
            </button>
        </div>
    )
}
