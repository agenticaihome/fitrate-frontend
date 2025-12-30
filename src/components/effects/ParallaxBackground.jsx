/**
 * Parallax Background - Phase 1 Enhancement
 * Multi-layer parallax with floating orbs
 */

import React, { useEffect, useRef, useMemo } from 'react'

export default function ParallaxBackground({
  primaryColor = '#00d4ff',
  secondaryColor = '#8b5cf6',
  accentColor = '#ff6b35',
  particleCount = 15,
  enableParallax = true
}) {
  const containerRef = useRef(null)

  // Parallax scroll effect
  useEffect(() => {
    if (!enableParallax) return

    const handleScroll = () => {
      if (containerRef.current) {
        const scrollY = window.scrollY
        containerRef.current.style.setProperty('--scroll-y', `${scrollY}px`)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enableParallax])

  // Generate floating particles
  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 1 + Math.random() * 2,
      delay: Math.random() * 15,
      duration: 20 + Math.random() * 15,
      opacity: 0.1 + Math.random() * 0.15,
      drift: -20 + Math.random() * 40,
      color: i % 3 === 0 ? primaryColor : i % 3 === 1 ? secondaryColor : '#fff'
    })), [particleCount, primaryColor, secondaryColor]
  )

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none parallax-scroll-container"
      style={{ zIndex: 0 }}
    >
      {/* Deep layer - slowest moving */}
      <div className="parallax-layer parallax-bg-slow">
        <div
          className="parallax-orb parallax-orb-1"
          style={{
            '--orb-color-1': `${primaryColor}20`,
            top: '10%',
            left: '20%'
          }}
        />
        <div
          className="parallax-orb parallax-orb-2"
          style={{
            '--orb-color-2': `${secondaryColor}15`,
            top: '60%',
            right: '10%'
          }}
        />
      </div>

      {/* Mid layer - medium speed */}
      <div className="parallax-layer parallax-bg-medium">
        <div
          className="parallax-orb parallax-orb-3"
          style={{
            '--orb-color-3': `${accentColor}12`,
            top: '40%',
            left: '60%'
          }}
        />

        {/* Central glow */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${primaryColor}30 0%, transparent 60%)`,
            top: '35%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'glow-breathe 6s ease-in-out infinite',
            opacity: 0.4
          }}
        />
      </div>

      {/* Near layer - fastest moving */}
      <div className="parallax-layer parallax-bg-fast">
        {/* Floating particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.left}%`,
              bottom: '-10px',
              width: p.size,
              height: p.size,
              background: p.color,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              animation: `particle-float ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
              '--drift': `${p.drift}px`
            }}
          />
        ))}
      </div>

      {/* Noise texture overlay for premium feel */}
      <div className="absolute inset-0 noise-overlay opacity-[0.02]" />
    </div>
  )
}

// ============================================
// SIMPLIFIED VERSION (for lighter pages)
// ============================================

export function SimpleParallaxBackground({ color = '#00d4ff' }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, ${color}25 0%, transparent 60%)`,
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'glow-breathe 5s ease-in-out infinite',
          opacity: 0.5
        }}
      />
    </div>
  )
}
