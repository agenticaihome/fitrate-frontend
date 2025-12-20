import React, { useState } from 'react'
import { playSound, vibrate } from '../utils/soundEffects'
import { downloadImage } from '../utils/imageUtils'
import { trackShare } from '../utils/analytics'

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

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6" style={{
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
            paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
        }}>
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-60 animate-bounce" style={{
                    background: 'rgba(0,255,136,0.9)',
                    boxShadow: '0 4px 20px rgba(0,255,136,0.4)'
                }}>
                    <span className="text-black font-bold text-sm">{toastMessage}</span>
                </div>
            )}

            {/* Share Card Preview */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-6 w-[50%] max-w-[180px] aspect-[9/16]" style={{
                border: `2px solid ${scores?.roastMode ? 'rgba(255,68,68,0.3)' : 'rgba(0,212,255,0.3)'}`,
                boxShadow: `0 20px 60px ${scores?.roastMode ? 'rgba(255,68,68,0.3)' : 'rgba(0,212,255,0.3)'}`
            }}>
                <img src={URL.createObjectURL(shareData.imageBlob)} alt="Share Preview" className="w-full h-full object-cover" />
            </div>

            {/* Caption Preview */}
            <p className="text-xs text-center mb-4 px-4 max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                "{shareData.text.slice(0, 60)}..."
            </p>

            {/* Primary Share CTA - Native Share with Image */}
            <button
                onClick={handleShare}
                className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 mb-4"
                style={{
                    background: `linear-gradient(135deg, ${scores?.roastMode ? '#ff4444' : '#00d4ff'} 0%, ${scores?.roastMode ? '#ff0080' : '#00ff88'} 100%)`,
                    boxShadow: `0 8px 30px ${scores?.roastMode ? 'rgba(255,68,68,0.4)' : 'rgba(0,212,255,0.4)'}`
                }}
            >
                <span className="text-xl">📤</span> {hasNativeShare ? 'Share with Image' : 'Download & Share'}
            </button>

            {/* Fallback Share Buttons - Always visible for more options */}
            <div className="w-full max-w-xs mb-6">
                <p className="text-xs text-center mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Or share directly to:
                </p>
                <div className="share-grid-responsive grid grid-cols-3 gap-3 mb-3">
                    {/* WhatsApp - Primary */}
                    <button
                        onClick={shareToWhatsApp}
                        className="flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95"
                        style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}
                    >
                        <span className="text-2xl mb-1">💬</span>
                        <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>WhatsApp</span>
                    </button>

                    {/* SMS/Text */}
                    <button
                        onClick={shareToSMS}
                        className="flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                        <span className="text-2xl mb-1">📱</span>
                        <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Message</span>
                    </button>

                    {/* Copy Link */}
                    <button
                        onClick={copyShareLink}
                        className="flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.1)' }}
                    >
                        <span className="text-2xl mb-1">🔗</span>
                        <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Copy Link</span>
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {/* X (Twitter) */}
                    <button
                        onClick={shareToTwitter}
                        className="flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                        <span className="text-xl mb-1">𝕏</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>X</span>
                    </button>

                    {/* Facebook */}
                    <button
                        onClick={shareToFacebook}
                        className="flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                        <span className="text-xl mb-1">📘</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Facebook</span>
                    </button>

                    {/* Reddit */}
                    <button
                        onClick={shareToReddit}
                        className="flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                        <span className="text-xl mb-1">🤖</span>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Reddit</span>
                    </button>
                </div>
            </div>

            {/* Back */}
            <button
                onClick={onClose}
                className="text-sm transition-all active:opacity-60"
                style={{ color: 'rgba(255,255,255,0.4)' }}
            >
                ← Back to Results
            </button>
        </div>
    )
}
