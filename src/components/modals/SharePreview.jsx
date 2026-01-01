/**
 * SharePreview Modal
 * 
 * Shows preview of share card before sharing
 * "Looks good?" confirmation step
 */

import React, { useState, useEffect, useRef } from 'react'
import html2canvas from 'html2canvas'
import { playSound, vibrate } from '../../utils/soundEffects'

export default function SharePreview({
    cardRef, // Ref to the card element to capture
    onConfirm, // Called when user confirms share
    onCancel, // Called when user cancels
    title = "Share Preview",
    isOpen = false
}) {
    const [preview, setPreview] = useState(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState(null)

    // Generate preview when opened
    useEffect(() => {
        if (!isOpen || !cardRef?.current) {
            setPreview(null)
            return
        }

        const generatePreview = async () => {
            setIsGenerating(true)
            setError(null)

            try {
                const canvas = await html2canvas(cardRef.current, {
                    scale: 1.5, // Lower scale for preview
                    backgroundColor: '#0a0a0f',
                    logging: false,
                    useCORS: true,
                    allowTaint: true,
                    imageTimeout: 5000
                })

                setPreview(canvas.toDataURL('image/png'))
            } catch (err) {
                console.error('[SharePreview] Failed to generate preview:', err)
                setError('Could not generate preview')
            } finally {
                setIsGenerating(false)
            }
        }

        generatePreview()
    }, [isOpen, cardRef])

    if (!isOpen) return null

    const handleConfirm = () => {
        playSound('click')
        vibrate(30)
        onConfirm?.()
    }

    const handleCancel = () => {
        playSound('click')
        vibrate(10)
        onCancel?.()
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{
                background: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(20px)'
            }}
        >
            <div className="flex flex-col items-center max-w-sm w-full">
                {/* Header */}
                <h3 className="text-lg font-bold text-white mb-4">{title}</h3>

                {/* Preview Area */}
                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden bg-white/5 mb-4 flex items-center justify-center">
                    {isGenerating ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-sm text-white/50">Generating preview...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center p-4">
                            <span className="text-2xl mb-2 block">⚠️</span>
                            <span className="text-sm text-white/50">{error}</span>
                        </div>
                    ) : preview ? (
                        <img
                            src={preview}
                            alt="Share preview"
                            className="w-full h-full object-contain"
                        />
                    ) : null}
                </div>

                {/* Confirmation Text */}
                <p className="text-white/60 text-sm mb-4 text-center">
                    Looks good? 👀
                </p>

                {/* Buttons */}
                <div className="flex gap-3 w-full">
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-3 rounded-xl font-bold bg-white/10 text-white active:scale-95 transition-transform"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isGenerating || !!error}
                        className="flex-1 py-3 rounded-xl font-bold text-black active:scale-95 transition-transform disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)'
                        }}
                    >
                        📤 Share
                    </button>
                </div>
            </div>
        </div>
    )
}
