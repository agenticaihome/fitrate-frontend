/**
 * Framer Motion Components - Phase 2 Enhancements
 * Reusable motion wrappers for premium animations
 */

import React, { forwardRef } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'

// ============================================
// ANIMATION VARIANTS (Reusable presets)
// ============================================

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
}

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

export const popIn = {
  initial: { opacity: 0, scale: 0.5 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 20 }
  },
  exit: { opacity: 0, scale: 0.8 }
}

export const slideInFromBottom = {
  initial: { opacity: 0, y: '100%' },
  animate: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  },
  exit: { opacity: 0, y: '100%' }
}

export const slideInFromLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 }
}

export const scaleRotate = {
  initial: { opacity: 0, scale: 0, rotate: -180 },
  animate: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 200, damping: 15 }
  },
  exit: { opacity: 0, scale: 0, rotate: 180 }
}

// ============================================
// STAGGER CONTAINER
// Animates children with sequential delay
// ============================================

export const StaggerContainer = ({
  children,
  staggerDelay = 0.05,
  delayChildren = 0,
  className = '',
  ...props
}) => (
  <motion.div
    className={className}
    initial="initial"
    animate="animate"
    exit="exit"
    variants={{
      animate: {
        transition: {
          staggerChildren: staggerDelay,
          delayChildren
        }
      }
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// ============================================
// STAGGER ITEM
// Individual item within StaggerContainer
// ============================================

export const StaggerItem = ({
  children,
  variant = 'fadeUp',
  className = '',
  ...props
}) => {
  const variants = {
    fadeUp: {
      initial: { opacity: 0, y: 15 },
      animate: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      },
      exit: { opacity: 0, y: -10 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: {
        opacity: 1,
        scale: 1,
        transition: { type: 'spring', stiffness: 400, damping: 20 }
      },
      exit: { opacity: 0, scale: 0.9 }
    },
    slideIn: {
      initial: { opacity: 0, x: -20 },
      animate: {
        opacity: 1,
        x: 0,
        transition: { type: 'spring', stiffness: 400, damping: 25 }
      },
      exit: { opacity: 0, x: 20 }
    }
  }

  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// TAPPABLE CARD - 3D tilt with gesture
// ============================================

export const TappableCard = forwardRef(({
  children,
  onClick,
  className = '',
  tiltAmount = 10,
  scaleOnTap = 0.97,
  ...props
}, ref) => {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const rotateX = useTransform(y, [-100, 100], [tiltAmount, -tiltAmount])
  const rotateY = useTransform(x, [-100, 100], [-tiltAmount, tiltAmount])

  const springConfig = { stiffness: 300, damping: 30 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    x.set(e.clientX - centerX)
    y.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
      whileTap={{ scale: scaleOnTap }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      {...props}
    >
      {children}
    </motion.div>
  )
})

TappableCard.displayName = 'TappableCard'

// ============================================
// FLOATING ELEMENT - Gentle hover animation
// ============================================

export const FloatingElement = ({
  children,
  amplitude = 8,
  duration = 3,
  className = '',
  ...props
}) => (
  <motion.div
    className={className}
    animate={{
      y: [0, -amplitude, 0],
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// ============================================
// BREATHING GLOW - Pulsing glow effect
// ============================================

export const BreathingGlow = ({
  children,
  glowColor = 'rgba(0,212,255,0.4)',
  minOpacity = 0.4,
  maxOpacity = 0.8,
  duration = 3,
  className = '',
  ...props
}) => (
  <motion.div
    className={className}
    animate={{
      boxShadow: [
        `0 0 30px ${glowColor.replace(/[\d.]+\)$/, `${minOpacity})`)}`,
        `0 0 60px ${glowColor.replace(/[\d.]+\)$/, `${maxOpacity})`)}`,
        `0 0 30px ${glowColor.replace(/[\d.]+\)$/, `${minOpacity})`)}`
      ]
    }}
    transition={{
      duration,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    {...props}
  >
    {children}
  </motion.div>
)

// ============================================
// PAGE TRANSITION WRAPPER
// ============================================

export const PageTransition = ({
  children,
  variant = 'fade',
  className = ''
}) => {
  const variants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.05 }
    }
  }

  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

// ============================================
// MODAL OVERLAY with AnimatePresence
// ============================================

export const ModalOverlay = ({
  isOpen,
  onClose,
  children,
  className = ''
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className={`fixed z-50 ${className}`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

// ============================================
// DRAWER (Bottom Sheet)
// ============================================

export const BottomDrawer = ({
  isOpen,
  onClose,
  children,
  className = ''
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          className="fixed inset-0 z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}
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
        >
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
)

// ============================================
// SCORE REVEAL - Dramatic number animation
// ============================================

export const ScoreReveal = ({
  score,
  color = '#00d4ff',
  size = 'large',
  className = ''
}) => {
  const sizes = {
    small: 'text-4xl',
    medium: 'text-6xl',
    large: 'text-8xl'
  }

  return (
    <motion.div
      className={`font-black ${sizes[size]} ${className}`}
      style={{
        color,
        textShadow: `0 0 40px ${color}, 0 0 80px ${color}40`
      }}
      initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
      animate={{
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: { type: 'spring', stiffness: 200, damping: 12 }
      }}
    >
      {score}
    </motion.div>
  )
}

// ============================================
// CONFETTI BURST
// ============================================

export const ConfettiBurst = ({ isActive, colors = ['#00ff88', '#00d4ff', '#fff', '#ffd700'] }) => {
  if (!isActive) return null

  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[i % colors.length],
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(piece => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            width: Math.random() > 0.5 ? '10px' : '8px',
            height: Math.random() > 0.5 ? '10px' : '8px',
            background: piece.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px'
          }}
          initial={{
            top: '-20px',
            rotate: 0,
            opacity: 1
          }}
          animate={{
            top: '100vh',
            rotate: 720,
            opacity: 0
          }}
          transition={{
            duration: 3,
            delay: piece.delay,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// GESTURE CARD - Swipeable with spring physics
// ============================================

export const GestureCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  className = '',
  ...props
}) => {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])

  return (
    <motion.div
      className={className}
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x > swipeThreshold) {
          onSwipeRight?.()
        } else if (info.offset.x < -swipeThreshold) {
          onSwipeLeft?.()
        }
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Re-export AnimatePresence for convenience
export { AnimatePresence, motion }
