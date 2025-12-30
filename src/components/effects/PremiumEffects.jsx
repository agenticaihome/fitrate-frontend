/**
 * Premium Effects Library
 * Ultimate 3D visual effects for next-level UI
 */

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useAnimationFrame } from 'framer-motion'

// ============================================
// RIPPLE EFFECT - Material Design Style
// ============================================

export function RippleButton({
  children,
  onClick,
  className = '',
  rippleColor = 'rgba(255,255,255,0.4)',
  ...props
}) {
  const [ripples, setRipples] = useState([])

  const addRipple = useCallback((e) => {
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height) * 2
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const newRipple = {
      id: Date.now(),
      x,
      y,
      size
    }

    setRipples(prev => [...prev, newRipple])

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
  }, [])

  const handleClick = (e) => {
    addRipple(e)
    onClick?.(e)
  }

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onClick={handleClick}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            background: rippleColor
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </button>
  )
}

// ============================================
// 3D PULSING RINGS - Around CTAs
// ============================================

export function PulsingRings({
  color = '#00d4ff',
  count = 3,
  size = 100,
  className = ''
}) {
  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border-2"
          style={{
            width: size,
            height: size,
            borderColor: color
          }}
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{
            scale: [0.8, 1.5, 2],
            opacity: [0.6, 0.3, 0]
          }}
          transition={{
            duration: 2.5,
            delay: i * 0.5,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// MAGNETIC BUTTON - Follows cursor
// ============================================

export function MagneticButton({
  children,
  onClick,
  className = '',
  strength = 0.3,
  ...props
}) {
  const buttonRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springConfig = { stiffness: 150, damping: 15 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const distX = (e.clientX - centerX) * strength
    const distY = (e.clientY - centerY) * strength
    x.set(distX)
    y.set(distY)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.button
      ref={buttonRef}
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// ============================================
// 3D TILT CARD - Mouse tracking
// ============================================

export function Tilt3DCard({
  children,
  className = '',
  tiltAmount = 15,
  glareOpacity = 0.2,
  perspective = 1000,
  scale = 1.02,
  ...props
}) {
  const cardRef = useRef(null)
  const [isHovered, setIsHovered] = useState(false)

  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  const glareX = useMotionValue(50)
  const glareY = useMotionValue(50)

  const springConfig = { stiffness: 300, damping: 30 }
  const springRotateX = useSpring(rotateX, springConfig)
  const springRotateY = useSpring(rotateY, springConfig)

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    const rotX = (mouseY / (rect.height / 2)) * -tiltAmount
    const rotY = (mouseX / (rect.width / 2)) * tiltAmount

    rotateX.set(rotX)
    rotateY.set(rotY)

    // Glare position
    const glareXPos = ((e.clientX - rect.left) / rect.width) * 100
    const glareYPos = ((e.clientY - rect.top) / rect.height) * 100
    glareX.set(glareXPos)
    glareY.set(glareYPos)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective,
        rotateX: springRotateX,
        rotateY: springRotateY,
        transformStyle: 'preserve-3d'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      whileHover={{ scale }}
      {...props}
    >
      {children}

      {/* Glare overlay */}
      <motion.div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,${glareOpacity}) 0%, transparent 60%)`,
          opacity: isHovered ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}

// ============================================
// FLOATING ISLAND - Main CTA container
// ============================================

export function FloatingIsland({
  children,
  className = '',
  glowColor = '#00d4ff',
  floatAmplitude = 8
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        y: [0, -floatAmplitude, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {/* Shadow */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full"
        style={{
          bottom: -20,
          background: 'rgba(0,0,0,0.3)',
          filter: 'blur(10px)'
        }}
        animate={{
          scaleX: [1, 0.9, 1],
          opacity: [0.3, 0.2, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {/* Glow */}
      <motion.div
        className="absolute inset-0 rounded-inherit pointer-events-none"
        style={{
          boxShadow: `0 0 40px ${glowColor}40, 0 0 80px ${glowColor}20`
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />

      {children}
    </motion.div>
  )
}

// ============================================
// SHIMMER TEXT - Animated gradient
// ============================================

export function ShimmerText({
  children,
  className = '',
  colors = ['#00d4ff', '#00ff88', '#ffd700', '#00d4ff']
}) {
  return (
    <motion.span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
        backgroundSize: '200% 100%'
      }}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'linear'
      }}
    >
      {children}
    </motion.span>
  )
}

// ============================================
// PARTICLE EXPLOSION - On tap/click
// ============================================

export function useParticleExplosion() {
  const [particles, setParticles] = useState([])

  const explode = useCallback(({ x, y, count = 20, colors = ['#00d4ff', '#00ff88', '#ffd700'] }) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
      angle: (i / count) * 360,
      distance: 50 + Math.random() * 100,
      size: 4 + Math.random() * 6,
      color: colors[i % colors.length],
      duration: 0.6 + Math.random() * 0.4
    }))

    setParticles(prev => [...prev, ...newParticles])

    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 1200)
  }, [])

  const ParticleContainer = useMemo(() => {
    return () => (
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        <AnimatePresence>
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                left: particle.x,
                top: particle.y,
                width: particle.size,
                height: particle.size,
                background: particle.color,
                boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
              }}
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                x: Math.cos(particle.angle * Math.PI / 180) * particle.distance,
                y: Math.sin(particle.angle * Math.PI / 180) * particle.distance,
                scale: 0,
                opacity: 0
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: particle.duration, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>
      </div>
    )
  }, [particles])

  return { explode, ParticleContainer }
}

// ============================================
// CONFETTI CANNON - Physics-based
// ============================================

export function ConfettiCannon({
  isActive,
  colors = ['#00ff88', '#00d4ff', '#ffd700', '#ff6b35', '#8b5cf6'],
  particleCount = 80,
  spread = 60,
  duration = 4
}) {
  const confetti = useMemo(() => {
    if (!isActive) return []
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: 50 + (Math.random() - 0.5) * spread,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      rotation: Math.random() * 360,
      delay: Math.random() * 0.3,
      xDrift: (Math.random() - 0.5) * 100,
      shape: Math.random() > 0.5 ? 'circle' : 'square'
    }))
  }, [isActive, colors, particleCount, spread])

  if (!isActive) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {confetti.map(piece => (
        <motion.div
          key={piece.id}
          className="absolute"
          style={{
            left: `${piece.x}%`,
            width: piece.size,
            height: piece.size,
            background: piece.color,
            borderRadius: piece.shape === 'circle' ? '50%' : '2px',
            boxShadow: `0 0 ${piece.size}px ${piece.color}40`
          }}
          initial={{
            top: '-5%',
            rotate: 0,
            scale: 1
          }}
          animate={{
            top: '110%',
            x: piece.xDrift,
            rotate: piece.rotation + 720,
            scale: [1, 1, 0.5]
          }}
          transition={{
            duration: duration + Math.random(),
            delay: piece.delay,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// AURORA BACKGROUND - Animated gradient
// ============================================

export function AuroraBackground({
  colors = ['#00d4ff', '#8b5cf6', '#ff6b35', '#00ff88'],
  speed = 10,
  className = ''
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="absolute w-[150%] h-[150%] rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}30 0%, transparent 50%)`,
            left: `${-25 + (i * 20)}%`,
            top: `${-25 + (i * 15)}%`,
            filter: 'blur(80px)'
          }}
          animate={{
            x: [0, 100, 0, -100, 0],
            y: [0, -50, 100, -50, 0],
            scale: [1, 1.2, 1, 0.8, 1]
          }}
          transition={{
            duration: speed + i * 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  )
}

// ============================================
// GLASS MORPHISM CARD - Premium glass effect
// ============================================

export function GlassMorphCard({
  children,
  className = '',
  blur = 20,
  opacity = 0.1,
  borderOpacity = 0.2,
  glowColor = null,
  ...props
}) {
  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `rgba(255, 255, 255, ${opacity})`,
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
        border: `1px solid rgba(255, 255, 255, ${borderOpacity})`,
        boxShadow: glowColor
          ? `0 8px 32px rgba(0,0,0,0.2), 0 0 40px ${glowColor}30`
          : '0 8px 32px rgba(0,0,0,0.2)'
      }}
      {...props}
    >
      {/* Top edge highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,${borderOpacity * 2}) 50%, transparent 100%)`
        }}
      />

      {children}
    </motion.div>
  )
}

// ============================================
// LIQUID BUTTON - Morphing shape
// ============================================

export function LiquidButton({
  children,
  onClick,
  className = '',
  color = '#00d4ff',
  ...props
}) {
  const [isPressed, setIsPressed] = useState(false)

  return (
    <motion.button
      className={`relative ${className}`}
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {/* Liquid background */}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
        }}
        animate={{
          borderRadius: isPressed
            ? '20px 30px 20px 30px'
            : '24px 24px 24px 24px'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      />

      {/* Shine overlay */}
      <motion.div
        className="absolute inset-0 rounded-inherit"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%)'
        }}
      />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

// ============================================
// NEON GLOW TEXT
// ============================================

export function NeonText({
  children,
  color = '#00d4ff',
  className = '',
  intensity = 1
}) {
  return (
    <motion.span
      className={className}
      style={{
        color,
        textShadow: `
          0 0 ${5 * intensity}px ${color},
          0 0 ${10 * intensity}px ${color},
          0 0 ${20 * intensity}px ${color},
          0 0 ${40 * intensity}px ${color}80
        `
      }}
      animate={{
        textShadow: [
          `0 0 ${5 * intensity}px ${color}, 0 0 ${10 * intensity}px ${color}, 0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}80`,
          `0 0 ${8 * intensity}px ${color}, 0 0 ${16 * intensity}px ${color}, 0 0 ${32 * intensity}px ${color}, 0 0 ${60 * intensity}px ${color}80`,
          `0 0 ${5 * intensity}px ${color}, 0 0 ${10 * intensity}px ${color}, 0 0 ${20 * intensity}px ${color}, 0 0 ${40 * intensity}px ${color}80`
        ]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.span>
  )
}

// ============================================
// SCORE COUNTER - Animated number
// ============================================

export function AnimatedScore({
  value,
  duration = 1.5,
  color = '#fff',
  size = 'text-6xl',
  className = ''
}) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setDisplayValue(Math.round(startValue + (value - startValue) * eased))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <motion.span
      className={`font-black ${size} ${className}`}
      style={{ color }}
      key={value}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  )
}
