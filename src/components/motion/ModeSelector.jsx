/**
 * Enhanced Mode Selector - Phase 2 Framer Motion
 * Beautiful stagger animations + 3D card tilt
 */

import React, { forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { playSound, vibrate } from '../../utils/soundEffects'

// Mode data - 6 Free + 6 Pro-exclusive
const MODES = [
  // FREE MODES (6)
  { id: 'nice', emoji: '😇', label: 'Nice', desc: 'Your biggest fan', color: '#00d4ff', glow: 'rgba(0,212,255,0.4)' },
  { id: 'roast', emoji: '🔥', label: 'Roast', desc: 'Friendship-ending honesty', color: '#ff6b35', glow: 'rgba(255,107,53,0.4)' },
  { id: 'honest', emoji: '📊', label: 'Honest', desc: 'No cap, real talk', color: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  { id: 'chaos', emoji: '🎪', label: 'Chaos', desc: 'AI off its meds', color: '#ff6b6b', glow: 'rgba(255,107,107,0.4)' },
  { id: 'coquette', emoji: '🎀', label: 'Coquette', desc: 'Soft girl aesthetic', color: '#f9a8d4', glow: 'rgba(249,168,212,0.4)' },
  { id: 'hypebeast', emoji: '👟', label: 'Hypebeast', desc: 'Certified drip doctor', color: '#f97316', glow: 'rgba(249,115,22,0.4)' },
  // PRO MODES (6) - Exclusive to subscribers
  { id: 'savage', emoji: '💀', label: 'Savage', desc: 'Emotional damage loading', color: '#8b00ff', glow: 'rgba(139,0,255,0.4)', proOnly: true },
  { id: 'rizz', emoji: '😏', label: 'Rizz', desc: 'Would they swipe right?', color: '#ff69b4', glow: 'rgba(255,105,180,0.4)', proOnly: true },
  { id: 'celeb', emoji: '⭐', label: 'Celebrity', desc: 'A-list judgment', color: '#ffd700', glow: 'rgba(255,215,0,0.4)', proOnly: true },
  { id: 'aura', emoji: '🔮', label: 'Aura', desc: 'Reading your energy', color: '#9b59b6', glow: 'rgba(155,89,182,0.4)', proOnly: true },
  { id: 'y2k', emoji: '💎', label: 'Y2K', desc: 'Paris Hilton energy', color: '#ff69b4', glow: 'rgba(255,105,180,0.4)', proOnly: true },
  { id: 'villain', emoji: '🖤', label: 'Villain', desc: 'Main character threat', color: '#7c3aed', glow: 'rgba(124,58,237,0.4)', proOnly: true }
]

// ============================================
// TAPPABLE MODE CARD with 3D tilt
// ============================================

const ModeCard = forwardRef(({
  mode,
  isSelected,
  onSelect,
  index,
  isLocked = false,
  onShowPaywall
}, ref) => {
  const handleTap = () => {
    playSound('click')
    vibrate([15, 10, 25])
    if (isLocked) {
      onShowPaywall?.()
      return
    }
    onSelect(mode.id)
  }

  return (
    <motion.button
      ref={ref}
      onClick={handleTap}
      className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl relative overflow-hidden ${isLocked ? 'opacity-60' : ''}`}
      style={{
        background: `${mode.color}15`,
        border: isSelected ? `2px solid ${mode.color}` : '2px solid transparent'
      }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{
        opacity: isLocked ? 0.6 : 1,
        scale: 1,
        y: 0,
        transition: {
          type: 'spring',
          stiffness: 400,
          damping: 20,
          delay: index * 0.03 // Stagger effect
        }
      }}
      whileHover={{
        scale: 1.05,
        rotateX: 5,
        rotateY: -5,
        transition: { duration: 0.2 }
      }}
      whileTap={{
        scale: 0.95,
        transition: { duration: 0.1 }
      }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
      aria-label={`${mode.label} mode - ${mode.desc}${isLocked ? ' (Pro only)' : ''}`}
    >
      {/* Pro badge for locked modes */}
      {isLocked && (
        <div className="absolute top-1 right-1 z-20">
          <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            PRO
          </span>
        </div>
      )}

      {/* Glow effect on selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            boxShadow: `inset 0 0 20px ${mode.glow}, 0 0 20px ${mode.glow}`
          }}
        />
      )}

      {/* Emoji */}
      <motion.span
        className="text-2xl"
        animate={isSelected ? {
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0]
        } : {}}
        transition={{ duration: 0.4 }}
      >
        {isLocked ? '🔒' : mode.emoji}
      </motion.span>

      {/* Label */}
      <span className="text-[11px] font-bold text-white/90">{mode.label}</span>

      {/* Selection indicator */}
      {isSelected && !isLocked && (
        <motion.div
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ background: mode.color }}
        >
          <span className="text-[8px]">✓</span>
        </motion.div>
      )}
    </motion.button>
  )
})

ModeCard.displayName = 'ModeCard'

// ============================================
// MAIN MODE SELECTOR DRAWER
// ============================================

export default function ModeSelector({
  isOpen,
  onClose,
  currentMode,
  onSelectMode,
  onNavigateToJudges,
  isPro = false,
  onShowPaywall
}) {
  const handleSelect = (modeId) => {
    setTimeout(() => {
      onSelectMode(modeId)
      onClose()
    }, 150)
  }

  const handleShowPaywall = () => {
    onClose()
    onShowPaywall?.()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-[60] w-full max-w-md mx-auto p-5 pb-8 rounded-t-3xl"
            style={{
              background: 'linear-gradient(180deg, rgba(30,30,45,0.98) 0%, rgba(20,20,32,0.99) 100%)'
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose()
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <motion.div
              className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4"
              initial={{ width: 0 }}
              animate={{ width: 40 }}
              transition={{ delay: 0.1 }}
            />

            {/* Header */}
            <motion.div
              className="text-center mb-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-white text-lg font-bold mb-1">Choose AI Mode</h3>
              <p className="text-gray-400 text-sm">How should we rate your fit?</p>
            </motion.div>

            {/* Mode Grid with stagger */}
            <div className="grid grid-cols-4 gap-2">
              {MODES.map((mode, index) => (
                <ModeCard
                  key={mode.id}
                  mode={mode}
                  isSelected={currentMode === mode.id}
                  onSelect={handleSelect}
                  index={index}
                  isLocked={mode.proOnly && !isPro}
                  onShowPaywall={handleShowPaywall}
                />
              ))}
            </div>

            {/* Meet The Judges */}
            <motion.button
              onClick={() => {
                onClose()
                onNavigateToJudges?.()
              }}
              className="w-full py-3 text-cyan-400 text-sm font-bold mt-4 flex items-center justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>👥</span>
              <span>Meet Your AI Judges</span>
              <span className="text-cyan-400/50">→</span>
            </motion.button>

            {/* Cancel */}
            <motion.button
              onClick={onClose}
              className="w-full py-2 text-gray-400 text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Cancel
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================
// COMPACT MODE PILL (for top bar display)
// ============================================

export function ModePill({ mode, onClick }) {
  const modeData = MODES.find(m => m.id === mode) || MODES[0]

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-5 py-3 rounded-full transition-all"
      style={{
        background: `${modeData.color}20`,
        border: `1px solid ${modeData.color}40`
      }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 0 20px ${modeData.glow}`
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="text-xl"
        animate={{
          rotate: [0, 5, -5, 0]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3
        }}
      >
        {modeData.emoji}
      </motion.span>
      <span className="text-white font-semibold">{modeData.label}</span>
      <span className="text-gray-400 text-sm">• Change ▼</span>
    </motion.button>
  )
}
