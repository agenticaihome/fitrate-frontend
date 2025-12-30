/**
 * 3D Score Orb - Phase 3 Enhancement
 * A floating, glowing sphere that displays the user's score
 * Uses React Three Fiber for true WebGL 3D
 */

import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Html, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ============================================
// INNER GLOWING SPHERE
// ============================================

function GlowingSphere({ color, intensity = 1, distort = 0.3 }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (meshRef.current) {
      // Subtle rotation
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={distort}
        speed={2}
        roughness={0.2}
        metalness={0.8}
        emissive={color}
        emissiveIntensity={intensity * 0.5}
        transparent
        opacity={0.9}
      />
    </Sphere>
  )
}

// ============================================
// OUTER GLOW RINGS
// ============================================

function GlowRings({ color, count = 3 }) {
  const ringsRef = useRef([])

  useFrame((state) => {
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.z = state.clock.elapsedTime * (0.1 + i * 0.05)
        ring.scale.setScalar(1 + Math.sin(state.clock.elapsedTime + i) * 0.05)
      }
    })
  })

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh
          key={i}
          ref={el => ringsRef.current[i] = el}
          rotation={[Math.PI / 2, 0, (i * Math.PI) / count]}
        >
          <torusGeometry args={[1.3 + i * 0.15, 0.01, 16, 100]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.3 - i * 0.08}
          />
        </mesh>
      ))}
    </>
  )
}

// ============================================
// FLOATING PARTICLES AROUND ORB
// ============================================

function OrbParticles({ color, count = 50 }) {
  const particlesRef = useRef()

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const radius = 1.5 + Math.random() * 0.5

      temp.push({
        position: [
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ],
        scale: 0.02 + Math.random() * 0.03
      })
    }
    return temp
  }, [count])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.1
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1
    }
  })

  return (
    <group ref={particlesRef}>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position}>
          <sphereGeometry args={[particle.scale, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

// ============================================
// SCORE TEXT (HTML Overlay)
// ============================================

function ScoreDisplay({ score, color }) {
  return (
    <Html center>
      <div
        style={{
          fontFamily: 'SF Pro Display, -apple-system, sans-serif',
          fontSize: '3rem',
          fontWeight: 900,
          color: '#fff',
          textShadow: `0 0 20px ${color}, 0 0 40px ${color}`,
          userSelect: 'none',
          pointerEvents: 'none'
        }}
      >
        {score}
      </div>
    </Html>
  )
}

// ============================================
// MAIN SCORE ORB COMPONENT
// ============================================

function ScoreOrbScene({ score, color, showScore = true }) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color={color} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#fff" />

      {/* Floating orb group */}
      <Float
        speed={2}
        rotationIntensity={0.3}
        floatIntensity={0.5}
      >
        <GlowingSphere color={color} intensity={1.2} distort={0.25} />
        <GlowRings color={color} count={3} />
        <OrbParticles color={color} count={40} />

        {showScore && <ScoreDisplay score={score} color={color} />}
      </Float>

      {/* Background environment for reflections */}
      <Environment preset="night" />
    </>
  )
}

// ============================================
// EXPORTED WRAPPER COMPONENT
// ============================================

export default function ScoreOrb({
  score = 85,
  color = '#00d4ff',
  size = 200,
  className = ''
}) {
  return (
    <div
      className={`score-orb-container ${className}`}
      style={{ width: size, height: size }}
    >
      {/* CSS Glow effects */}
      <div
        className="score-orb-glow"
        style={{ '--orb-glow-color': `${color}60` }}
      />
      <div
        className="score-orb-ring"
        style={{ '--orb-ring-color': `${color}40` }}
      />

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 4], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ScoreOrbScene score={score} color={color} showScore={true} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// ============================================
// MINI ORB (for smaller displays)
// ============================================

export function MiniScoreOrb({
  score,
  color = '#00d4ff',
  size = 80,
  className = ''
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={0.8} color={color} />
          <Float speed={3} floatIntensity={0.3}>
            <Sphere args={[0.8, 32, 32]}>
              <MeshDistortMaterial
                color={color}
                distort={0.2}
                speed={3}
                roughness={0.3}
                metalness={0.7}
                emissive={color}
                emissiveIntensity={0.3}
              />
            </Sphere>
          </Float>
        </Suspense>
      </Canvas>

      {/* Score overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          fontFamily: 'SF Pro Display, -apple-system, sans-serif',
          fontSize: size * 0.3,
          fontWeight: 900,
          color: '#fff',
          textShadow: `0 0 10px ${color}`
        }}
      >
        {score}
      </div>
    </div>
  )
}
