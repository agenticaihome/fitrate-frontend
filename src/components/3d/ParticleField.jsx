/**
 * 3D Particle Field - Phase 3 Enhancement
 * A stunning WebGL particle background with depth
 * Uses instanced rendering for performance
 */

import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PointMaterial, Points } from '@react-three/drei'
import * as THREE from 'three'

// ============================================
// FLOATING PARTICLES WITH DEPTH
// ============================================

function FloatingParticles({
  count = 500,
  color = '#00d4ff',
  size = 0.02,
  depth = 10,
  speed = 0.2
}) {
  const pointsRef = useRef()

  // Generate random particle positions
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const offsets = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Spread particles in a box
      positions[i * 3] = (Math.random() - 0.5) * 20      // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20  // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * depth // z

      speeds[i] = 0.5 + Math.random() * 1.5
      offsets[i] = Math.random() * Math.PI * 2
    }

    return { positions, speeds, offsets }
  }, [count, depth])

  useFrame((state) => {
    if (!pointsRef.current) return

    const positions = pointsRef.current.geometry.attributes.position.array
    const time = state.clock.elapsedTime * speed

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Gentle floating motion
      positions[i3 + 1] += Math.sin(time * particles.speeds[i] + particles.offsets[i]) * 0.002

      // Subtle horizontal drift
      positions[i3] += Math.cos(time * 0.5 + particles.offsets[i]) * 0.001

      // Reset particles that drift too far
      if (positions[i3 + 1] > 10) positions[i3 + 1] = -10
      if (positions[i3 + 1] < -10) positions[i3 + 1] = 10
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true

    // Slowly rotate the entire field
    pointsRef.current.rotation.y = time * 0.05
  })

  return (
    <Points ref={pointsRef} positions={particles.positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  )
}

// ============================================
// GLOWING ORBS (Larger accent particles)
// ============================================

function GlowingOrbs({ count = 20, colors = ['#00d4ff', '#8b5cf6', '#ff6b35'] }) {
  const groupRef = useRef()

  const orbs = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 8
      ],
      scale: 0.05 + Math.random() * 0.1,
      color: colors[i % colors.length],
      speed: 0.5 + Math.random() * 1,
      offset: Math.random() * Math.PI * 2
    }))
  }, [count, colors])

  useFrame((state) => {
    if (!groupRef.current) return

    groupRef.current.children.forEach((orb, i) => {
      const data = orbs[i]
      const time = state.clock.elapsedTime

      // Floating motion
      orb.position.y = data.position[1] + Math.sin(time * data.speed + data.offset) * 0.5
      orb.position.x = data.position[0] + Math.cos(time * data.speed * 0.7 + data.offset) * 0.3

      // Pulsing scale
      const pulse = 1 + Math.sin(time * 2 + data.offset) * 0.2
      orb.scale.setScalar(data.scale * pulse)
    })
  })

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color={orb.color}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// NEBULA CLOUDS (Fog-like depth effect)
// ============================================

function NebulaClouds({ color = '#8b5cf6', opacity = 0.1 }) {
  const cloudsRef = useRef()

  useFrame((state) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.z = state.clock.elapsedTime * 0.02
      cloudsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1
    }
  })

  return (
    <group ref={cloudsRef}>
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[0, 0, -5 - i * 2]}>
          <planeGeometry args={[30, 30]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={opacity / (i + 1)}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// PARALLAX PARTICLES (React to scroll/mouse)
// ============================================

function ParallaxLayer({
  count = 100,
  color = '#fff',
  size = 0.015,
  zOffset = 0,
  parallaxFactor = 1
}) {
  const pointsRef = useRef()

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = zOffset + (Math.random() - 0.5) * 2
    }
    return pos
  }, [count, zOffset])

  useFrame((state) => {
    if (!pointsRef.current) return

    // Parallax effect based on mouse position
    const { mouse } = state
    pointsRef.current.position.x = mouse.x * parallaxFactor * 0.5
    pointsRef.current.position.y = mouse.y * parallaxFactor * 0.5
  })

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={color}
        size={size}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.5}
      />
    </Points>
  )
}

// ============================================
// MAIN SCENE COMPONENT
// ============================================

function ParticleFieldScene({
  primaryColor = '#00d4ff',
  secondaryColor = '#8b5cf6',
  accentColor = '#ff6b35',
  particleCount = 500,
  enableOrbs = true,
  enableNebula = true,
  enableParallax = true
}) {
  return (
    <>
      {/* Main particle field */}
      <FloatingParticles
        count={particleCount}
        color={primaryColor}
        size={0.02}
        depth={12}
        speed={0.15}
      />

      {/* Secondary layer */}
      <FloatingParticles
        count={Math.floor(particleCount * 0.3)}
        color={secondaryColor}
        size={0.015}
        depth={8}
        speed={0.1}
      />

      {/* Glowing accent orbs */}
      {enableOrbs && (
        <GlowingOrbs
          count={15}
          colors={[primaryColor, secondaryColor, accentColor]}
        />
      )}

      {/* Nebula background */}
      {enableNebula && (
        <NebulaClouds color={secondaryColor} opacity={0.08} />
      )}

      {/* Parallax layers */}
      {enableParallax && (
        <>
          <ParallaxLayer
            count={50}
            color="#fff"
            size={0.025}
            zOffset={2}
            parallaxFactor={0.5}
          />
          <ParallaxLayer
            count={30}
            color={primaryColor}
            size={0.03}
            zOffset={4}
            parallaxFactor={1}
          />
        </>
      )}
    </>
  )
}

// ============================================
// EXPORTED WRAPPER COMPONENT
// ============================================

export default function ParticleField({
  primaryColor = '#00d4ff',
  secondaryColor = '#8b5cf6',
  accentColor = '#ff6b35',
  particleCount = 500,
  enableOrbs = true,
  enableNebula = true,
  enableParallax = true,
  className = ''
}) {
  return (
    <div className={`particle-field-container ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
      >
        <Suspense fallback={null}>
          <ParticleFieldScene
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            accentColor={accentColor}
            particleCount={particleCount}
            enableOrbs={enableOrbs}
            enableNebula={enableNebula}
            enableParallax={enableParallax}
          />
        </Suspense>
      </Canvas>

      {/* Gradient overlay for depth */}
      <div className="particle-field-overlay" />
    </div>
  )
}

// ============================================
// LIGHTWEIGHT VERSION (for performance)
// ============================================

export function ParticleFieldLight({
  color = '#00d4ff',
  particleCount = 200,
  className = ''
}) {
  return (
    <div className={`particle-field-container ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: false }}
        dpr={1}
      >
        <Suspense fallback={null}>
          <FloatingParticles
            count={particleCount}
            color={color}
            size={0.025}
            depth={10}
            speed={0.1}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
