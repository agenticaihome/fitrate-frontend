/**
 * 3D Components - React Three Fiber
 * Lazy loaded for performance
 */

import { lazy } from 'react'

// Lazy load 3D components to reduce initial bundle size
export const ScoreOrb = lazy(() => import('./ScoreOrb'))
export const ParticleField = lazy(() => import('./ParticleField'))

// Direct imports for components that need immediate loading
export { MiniScoreOrb } from './ScoreOrb'
export { ParticleFieldLight } from './ParticleField'
