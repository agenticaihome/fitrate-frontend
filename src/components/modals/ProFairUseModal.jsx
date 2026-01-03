import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound, vibrate } from '../../utils/soundEffects'

/**
 * ProFairUseModal - Friendly screen for Pro users who hit 100/day limit
 * 
 * Key design principles:
 * - Celebrate their usage (they're a power user!)
 * - Clear about reset time
 * - NOT punishing - they ARE paying customers
 */
export default function ProFairUseModal({ isOpen, onClose }) {
    if (!isOpen) return null

    const handleClose = () => {
        playSound('click')
        vibrate(20)
        onClose()
    }

    // Calculate hours until midnight
    const now = new Date()
    const midnight = new Date()
    midnight.setHours(24, 0, 0, 0)
    const hoursLeft = Math.ceil((midnight - now) / (1000 * 60 * 60))

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[200] flex items-center justify-center p-6"
                style={{ background: 'rgba(0,0,0,0.85)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
            >
                <motion.div
                    className="w-full max-w-sm rounded-3xl p-8 text-center relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
                        border: '1px solid rgba(255,215,0,0.3)',
                        boxShadow: '0 0 60px rgba(255,215,0,0.15)'
                    }}
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Golden confetti particles */}
                    {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full"
                            style={{
                                background: '#ffd700',
                                left: `${10 + (i * 12)}%`,
                                top: `${20 + (i % 3) * 15}%`,
                                boxShadow: '0 0 8px rgba(255,215,0,0.5)'
                            }}
                            animate={{
                                y: [0, -10, 0],
                                opacity: [0.3, 0.7, 0.3],
                            }}
                            transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: Math.random()
                            }}
                        />
                    ))}

                    {/* Fire emoji with glow */}
                    <motion.div
                        className="text-7xl mb-4"
                        style={{ filter: 'drop-shadow(0 0 20px rgba(255,100,0,0.5))' }}
                        animate={{
                            scale: [1, 1.1, 1],
                            rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        🔥
                    </motion.div>

                    {/* Headline */}
                    <h2 className="text-2xl font-black text-white mb-2">
                        100 fits today!
                    </h2>

                    {/* Subheadline - celebratory */}
                    <p className="text-gray-300 mb-6">
                        You're officially a power user 💪
                    </p>

                    {/* Reset info */}
                    <div
                        className="rounded-2xl p-4 mb-6"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <p className="text-white/80 text-sm">
                            Fresh scans unlock at midnight
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            ~{hoursLeft} hour{hoursLeft !== 1 ? 's' : ''} to go
                        </p>
                    </div>

                    {/* CTA */}
                    <motion.button
                        onClick={handleClose}
                        className="w-full py-4 rounded-2xl font-bold text-lg"
                        style={{
                            background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                            color: '#000',
                            boxShadow: '0 4px 0 rgba(0,0,0,0.2)'
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        Got it! 👍
                    </motion.button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
