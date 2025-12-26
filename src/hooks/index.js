/**
 * FitRate Custom Hooks
 * Centralized exports for all custom hooks
 * 
 * NOTE: These hooks are created but NOT YET INTEGRATED into App.jsx.
 * App.jsx still contains all state inline (~2600 lines).
 * 
 * Future refactor session needed to:
 * 1. Import these hooks in App.jsx
 * 2. Remove duplicate state declarations
 * 3. Test after each change
 */

// Auth & Identity
export { default as useAuth } from './useAuth'

// Scan Limits & Usage
export { default as useScanLimits } from './useScanLimits'

// 1v1 Battles
export { default as useBattle } from './useBattle'

// Weekly Events/Challenges
export { default as useEvents } from './useEvents'

// Payments & Pro Status
export { default as usePayments } from './usePayments'

// Push Notifications
export { default as usePushNotifications } from './usePushNotifications'
