import React, { useState, useCallback, useEffect, Suspense, lazy } from 'react'
import { playSound, vibrate } from './utils/soundEffects'
import RulesModal from './components/RulesModal'
import Footer from './components/common/Footer'
import BottomNav from './components/common/BottomNav'
import { LIMITS, PRICES, RESETS, STRIPE_LINKS, ROUTES } from './config/constants'
import { getScoreColor } from './utils/scoreUtils'
import { compressImage, cleanupBlobUrls, hintGarbageCollection, createThumbnail } from './utils/imageUtils'
import { generateShareCard as generateShareCardUtil } from './utils/shareUtils'
import {
  trackScanComplete,
  trackModeSelect,
  trackBeginCheckout,
  trackBattleCreate,
  trackBattleAccept,
  trackPaywallView,
  trackDailyChallengeJoin,
  trackWeeklyChallengeJoin,
  trackScanError
} from './utils/analytics'

// Note: Custom hooks created in src/hooks/ but not yet integrated
// Future refactor will use: useAuth, useScanLimits, useBattle

// ============================================
// LAZY-LOADED SCREENS (Code Splitting)
// Critical screens loaded immediately, others on-demand
// ============================================

// Critical path - loaded immediately
import HomeScreen from './screens/HomeScreen'
import AnalyzingScreen from './screens/AnalyzingScreen'

// Lazy-loaded screens - reduces initial bundle size
const ResultsScreen = lazy(() => import('./screens/ResultsScreen'))
const ErrorScreen = lazy(() => import('./screens/ErrorScreen'))
const ProEmailPromptScreen = lazy(() => import('./screens/ProEmailPromptScreen'))
const ProWelcomeScreen = lazy(() => import('./screens/ProWelcomeScreen'))
const ShareSuccessScreen = lazy(() => import('./screens/ShareSuccessScreen'))
const PaywallScreen = lazy(() => import('./screens/PaywallScreen'))
const RulesScreen = lazy(() => import('./screens/RulesScreen'))
const ChallengeResultScreen = lazy(() => import('./screens/ChallengeResultScreen'))
const BattleScreen = lazy(() => import('./screens/BattleScreen'))
const BattleRoom = lazy(() => import('./screens/BattleRoom'))
const BattleResultsReveal = lazy(() => import('./screens/BattleResultsReveal'))
const FashionShowCreate = lazy(() => import('./screens/FashionShowCreate'))
const FashionShowInvite = lazy(() => import('./screens/FashionShowInvite'))
const FashionShowHub = lazy(() => import('./screens/FashionShowHub'))
const ChallengesScreen = lazy(() => import('./screens/ChallengesScreen'))
const MeetTheJudges = lazy(() => import('./screens/MeetTheJudges'))
// Modals - less critical, lazy loaded
const PaywallModal = lazy(() => import('./components/modals/PaywallModal'))
const LeaderboardModal = lazy(() => import('./components/modals/LeaderboardModal'))
const EventExplainerModal = lazy(() => import('./components/modals/EventExplainerModal'))
const RestoreProModal = lazy(() => import('./components/modals/RestoreProModal'))
const ChallengeResultShareCard = lazy(() => import('./components/modals/ChallengeResultShareCard'))
import OnboardingModal from './components/modals/OnboardingModal'

// Loading fallback for Suspense
const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white/60 text-sm">Loading...</p>
    </div>
  </div>
)

// API endpoints
const API_URL = import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze'
const API_BASE = API_URL.replace('/api/analyze', '/api')

// SECURITY: API key for authenticated requests (set in environment)
const API_KEY = import.meta.env.VITE_API_KEY || ''

// Helper to get headers for API requests
const getApiHeaders = () => ({
  'Content-Type': 'application/json',
  ...(API_KEY && { 'X-API-Key': API_KEY })
})
// Aesthetics for mock scores
const AESTHETICS = [
  'Clean Girl', 'Dark Academia', 'Quiet Luxury', 'Streetwear', 'Y2K',
  'Cottagecore', 'Minimalist', 'Coastal Grandmother', 'Grunge', 'Preppy',
  'Gorpcore', 'Balletcore', 'Old Money', 'Skater', 'Bohemian'
]

const CELEBRITIES = [
  'Timothée Chalamet at the airport', 'Zendaya on press tour', 'Bad Bunny off-duty',
  'Hailey Bieber coffee run', 'A$AP Rocky front row', 'Bella Hadid street style',
  'Harry Styles on tour', 'Kendall Jenner model off-duty', 'Tyler the Creator at Coachella',
  'Dua Lipa going to dinner', 'Jacob Elordi casual', 'Sydney Sweeney brunch'
]

// Helper: Social proof percentile logic moved to utils/scoreUtils.js

// Helper: Get the start of the current week (Monday) as ISO date string
const getWeekStart = (date) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

// Daily Challenge: Rotating mode based on day of year
// All 12 AI modes cycle through daily
const DAILY_CHALLENGE_MODES = ['nice', 'roast', 'honest', 'savage', 'rizz', 'celeb', 'aura', 'chaos', 'y2k', 'villain', 'coquette', 'hypebeast']

const getDailyMode = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now - start
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
  return DAILY_CHALLENGE_MODES[dayOfYear % DAILY_CHALLENGE_MODES.length]
}

// Helper: Random share tips for virality (universal appeal)
const SHARE_TIPS = [
  "Challenge a friend to beat this 👀",
  "Share with friends 📸",
  "Tag someone who needs a rating",
  "Send this to your group chat",
  "Show your friends this score",
  "Think you can do better? Try again!",
  "Bet a friend can't beat this 🔥",
  "Send to someone stylish",
  "Share your results!",
  "Get your friends to try it too",
  "Compare scores with friends",
  "Who has the best style? Find out!"
]

const getRandomShareTip = () => SHARE_TIPS[Math.floor(Math.random() * SHARE_TIPS.length)]

// Helper: Social proof percentile (used by both mock scores and real AI results)
const getPercentile = (score) => {
  if (score >= 95) return 99
  if (score >= 90) return 96
  if (score >= 85) return 91
  if (score >= 80) return 84
  if (score >= 75) return 73
  if (score >= 70) return 61
  if (score >= 65) return 48
  if (score >= 60) return 35
  return Math.floor(score * 0.4)
}

// ============================================
// GA4 SHARE TRACKING
// Track share events for virality analytics
// ============================================

// ============================================
// IN-APP BROWSER DETECTION
// Twitter/Instagram/etc WebViews break PWAs
// ============================================
const detectInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera
  if (/Twitter/i.test(ua)) return 'Twitter'
  if (/Instagram/i.test(ua)) return 'Instagram'
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'Facebook'
  if (/TikTok/i.test(ua) || /BytedanceWebview/i.test(ua)) return 'TikTok'
  if (/LinkedIn/i.test(ua)) return 'LinkedIn'
  if (/Snapchat/i.test(ua)) return 'Snapchat'
  return null
}

export default function App() {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isStandalone, setIsStandalone] = useState(false)
  // First-time user onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('fitrate_onboarded')
  })
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(null)

  // ============================================
  // APP VERSION CHECK - Force update for stale caches
  // Bump this version when deploying breaking changes
  // ============================================
  const APP_VERSION = '2024.12.25.3'

  useEffect(() => {
    const storedVersion = localStorage.getItem('fitrate_app_version')

    // If user has older version, clear everything and reload
    if (storedVersion && storedVersion !== APP_VERSION) {
      console.log(`[Version] Outdated: ${storedVersion} → ${APP_VERSION}, forcing update...`)

      // Clear service worker registrations
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(reg => reg.unregister())
        })
      }

      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(keys => {
          keys.forEach(key => caches.delete(key))
        })
      }

      // Update version and force reload
      localStorage.setItem('fitrate_app_version', APP_VERSION)
      window.location.reload(true)
      return
    }

    // First visit or same version - store current
    localStorage.setItem('fitrate_app_version', APP_VERSION)
  }, [])

  // Detect standalone mode (PWA)
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true ||
        document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
      if (isStandaloneMode) {
        document.body.classList.add('is-standalone')
      }
      // Show install banner if not standalone and not dismissed
      const dismissed = localStorage.getItem('fitrate_install_dismissed')
      if (!isStandaloneMode && !dismissed) {
        setShowInstallBanner(true)
      }
    }
    checkStandalone()
  }, [])


  // Detect in-app browser on mount (Twitter/Instagram/etc)
  useEffect(() => {
    const detected = detectInAppBrowser()
    if (detected) {
      setInAppBrowser(detected)
      console.log(`[FitRate] Detected ${detected} in-app browser`)
    }
  }, [])

  // Track last score for "you improved!" messaging
  const [lastScore, setLastScore] = useState(() => {
    const saved = localStorage.getItem('fitrate_last_score')
    return saved ? parseInt(saved) : null
  })

  // Challenge a Friend (score from URL) - OLD SYSTEM (query param)
  const [challengeScore, setChallengeScore] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return parseInt(params.get('challenge')) || null
  })

  // ============================================
  // BATTLE ROOM STATE - Legendary 1v1 Battles
  // Supports both /b/:battleId (new) and /c/:id (legacy)
  // ============================================
  const [challengePartyId, setChallengePartyId] = useState(() => {
    const path = window.location.pathname
    // Check for /b/:battleId pattern (new battle room URL)
    const battleMatch = path.match(/^\/b\/([a-zA-Z0-9_-]+)$/)
    if (battleMatch) return battleMatch[1]
    // Check for /c/:challengeId pattern (legacy URL)
    const challengeMatch = path.match(/^\/c\/([a-zA-Z0-9_-]+)$/)
    if (challengeMatch) return challengeMatch[1]
    // Also check for ?challenge_id= query param (from challenge.html redirect)
    const params = new URLSearchParams(window.location.search)
    const queryId = params.get('challenge_id')
    if (queryId) return queryId
    return null
  })
  const [challengePartyData, setChallengePartyData] = useState(null)
  // Start loading immediately if we detected a battle ID to prevent HomeScreen flash
  const [challengePartyLoading, setChallengePartyLoading] = useState(() => {
    const path = window.location.pathname
    const battleMatch = path.match(/^\/b\/([a-zA-Z0-9_-]+)$/)
    const challengeMatch = path.match(/^\/c\/([a-zA-Z0-9_-]+)$/)
    const params = new URLSearchParams(window.location.search)
    const queryId = params.get('challenge_id')
    return !!(battleMatch || challengeMatch || queryId)
  })
  const [isCreatorOfChallenge, setIsCreatorOfChallenge] = useState(false)
  // Track if we're using new battle room (/b/) vs legacy (/c/)
  const [useBattleRoom, setUseBattleRoom] = useState(() => {
    const path = window.location.pathname
    return path.match(/^\/b\/([a-zA-Z0-9_-]+)$/) !== null
  })

  // Store last analyzed image thumbnail for battle photo display
  const [lastAnalyzedThumb, setLastAnalyzedThumb] = useState(null)

  // Store pending battle ID when responder needs to see results before battle comparison
  const [pendingBattleId, setPendingBattleId] = useState(null)

  // Show dramatic battle reveal animation
  const [showBattleReveal, setShowBattleReveal] = useState(false)

  // ============================================
  // FASHION SHOW STATE
  // ============================================
  const [fashionShowId, setFashionShowId] = useState(() => {
    // Check URL for /f/:showId pattern OR ?fs= query param
    const path = window.location.pathname
    const pathMatch = path.match(/^\/f\/([a-z0-9]{6})$/i)
    if (pathMatch) return pathMatch[1].toLowerCase()

    // Also check for ?fs= query param (from /show.html redirect)
    const params = new URLSearchParams(window.location.search)
    const fsParam = params.get('fs')
    if (fsParam && /^[a-z0-9]{6}$/i.test(fsParam)) return fsParam.toLowerCase()

    return null
  })
  const [fashionShowData, setFashionShowData] = useState(null)
  const [fashionShowScreen, setFashionShowScreen] = useState(() => {
    // If we have a show ID in URL (path or query), start in join mode
    const path = window.location.pathname
    const pathMatch = path.match(/^\/f\/([a-z0-9]{6})$/i)
    if (pathMatch) return 'join'

    const params = new URLSearchParams(window.location.search)
    const fsParam = params.get('fs')
    if (fsParam && /^[a-z0-9]{6}$/i.test(fsParam)) return 'join'

    return null  // null = not in fashion show mode
  })
  const [fashionShowNickname, setFashionShowNickname] = useState('')
  const [fashionShowEmoji, setFashionShowEmoji] = useState('😎')
  const [fashionShowWalks, setFashionShowWalks] = useState(0)
  const [fashionShowLoading, setFashionShowLoading] = useState(false)
  const [pendingFashionShowWalk, setPendingFashionShowWalk] = useState(false) // Auto-trigger camera after walk

  // Track user's active Fashion Shows (for "My Shows" section)
  const [activeShows, setActiveShows] = useState(() => {
    try {
      const saved = localStorage.getItem('fitrate_active_shows')
      if (saved) {
        const shows = JSON.parse(saved)
        // Filter out expired shows (older than 7 days)
        const now = Date.now()
        const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
        return shows.filter(s => (now - s.joinedAt) < maxAge)
      }
    } catch (e) {
      console.error('[FashionShow] Failed to parse active shows:', e)
    }
    return []
  })

  // Helper to add a show to active shows list (with vibe info)
  const addToActiveShows = (showId, showName, vibe = 'nice', vibeLabel = 'Nice 😌') => {
    setActiveShows(prev => {
      // Don't add duplicates
      if (prev.some(s => s.showId === showId)) return prev
      const updated = [...prev, { showId, name: showName, vibe, vibeLabel, joinedAt: Date.now() }]
      localStorage.setItem('fitrate_active_shows', JSON.stringify(updated))
      return updated
    })
  }

  // Helper to remove a show from active shows
  const removeFromActiveShows = (showId) => {
    setActiveShows(prev => {
      const updated = prev.filter(s => s.showId !== showId)
      localStorage.setItem('fitrate_active_shows', JSON.stringify(updated))
      return updated
    })
  }

  // ============================================
  // ACTIVE BATTLES - Track user's ongoing 1v1 battles
  // ============================================
  const [activeBattles, setActiveBattles] = useState(() => {
    try {
      const saved = localStorage.getItem('fitrate_active_battles')
      if (saved) {
        const battles = JSON.parse(saved)
        // Filter out expired battles (older than 24 hours)
        const now = Date.now()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours
        return battles.filter(b => (now - b.createdAt) < maxAge)
      }
    } catch (e) {
      console.error('[Battle] Failed to parse active battles:', e)
    }
    return []
  })

  // Helper to add a battle to active battles list
  const addToActiveBattles = (battleId, myScore, mode = 'nice', status = 'waiting') => {
    setActiveBattles(prev => {
      // Don't add duplicates
      if (prev.some(b => b.battleId === battleId)) return prev
      const updated = [...prev, { battleId, myScore, mode, status, createdAt: Date.now() }]
      localStorage.setItem('fitrate_active_battles', JSON.stringify(updated))
      return updated
    })
  }

  // Helper to remove a battle from active battles
  const removeFromActiveBattles = (battleId) => {
    setActiveBattles(prev => {
      const updated = prev.filter(b => b.battleId !== battleId)
      localStorage.setItem('fitrate_active_battles', JSON.stringify(updated))
      return updated
    })
  }

  // Helper to update battle status
  const updateBattleStatus = (battleId, status) => {
    setActiveBattles(prev => {
      const updated = prev.map(b => b.battleId === battleId ? { ...b, status } : b)
      localStorage.setItem('fitrate_active_battles', JSON.stringify(updated))
      return updated
    })
  }

  // Purchased scans (from scan packs)
  const [purchasedScans, setPurchasedScans] = useState(0)

  // Daily Theme Rotation
  const DAILY_THEMES = [
    "Y2K Revival", "Airport Looks", "Gym Baddie", "Date Night", "Coffee Run",
    "Office Siren", "Cozy Sunday", "Festival Fit", "Street Style", "Old Money",
    "Baggy Jeans", "Clean Girl", "Mob Wife", "Eclectic Grandpa"
  ]
  const todayTheme = DAILY_THEMES[Math.floor(Date.now() / (1000 * 60 * 60 * 24)) % DAILY_THEMES.length]

  const [scansRemaining, setScansRemaining] = useState(() => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('fitrate_scans')
    if (stored) {
      const { date, count } = JSON.parse(stored)
      if (date === today) return Math.max(0, LIMITS.TOTAL_FREE_DAILY - count)
    }
    return LIMITS.TOTAL_FREE_DAILY  // 2 total (1 Pro + 1 Free)
  })

  // Pro Preview removed - now 2 free Gemini scans/day
  // Pro scans earned via referrals (proRoasts state below)

  // Pro Roasts available (from referrals or $0.99 purchase)
  const [proRoasts, setProRoasts] = useState(0)

  // Analyzing screen state (must be at component level for hooks rules)


  const [shareFormat, setShareFormat] = useState('story') // 'story' = 9:16, 'feed' = 1:1
  const [showRules, setShowRules] = useState(false)
  const [showDeclineOffer, setShowDeclineOffer] = useState(false)
  const [declineCountdown, setDeclineCountdown] = useState(null) // Seconds remaining for decline offer

  // Daily Streak state - object with current, max, emoji, message, tier
  const [dailyStreak, setDailyStreak] = useState(() => {
    // Initialize from localStorage until server syncs on first scan
    const stored = localStorage.getItem('fitrate_streak')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Support both old format {date, count} and new format
        if (parsed.current !== undefined) return parsed
        if (parsed.count !== undefined) return { current: parsed.count, message: `${parsed.count} day streak! 🔥` }
      } catch (e) { /* ignore */ }
    }
    return { current: 0, message: 'Start your streak!' }
  })

  const [screen, setScreen] = useState('home')
  const [showPaywall, setShowPaywall] = useState(false)
  const [showChallengeResultShare, setShowChallengeResultShare] = useState(false)
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')
  const [emailChecking, setEmailChecking] = useState(false)
  const [proEmail, setProEmail] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [totalReferrals, setTotalReferrals] = useState(() => parseInt(localStorage.getItem('fitrate_total_referrals') || '0'))
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [scores, setScores] = useState(null)
  const [cardDNA, setCardDNA] = useState(null)  // Unique visual DNA for results card
  const [uploadedImage, setUploadedImage] = useState(null)
  const [mode, setMode] = useState(() => localStorage.getItem('fitrate_mode') || 'roast') // Persist mode preference
  const [timeUntilReset, setTimeUntilReset] = useState(null)
  const [shareData, setShareData] = useState(null)
  const [emailInput, setEmailInput] = useState('')
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null) // Track API error codes for better UX
  const [isAnalyzing, setIsAnalyzing] = useState(false) // Guard against double-execution of analyzeOutfit

  // Weekly Event Mode state
  const [currentEvent, setCurrentEvent] = useState(null)
  const [upcomingEvent, setUpcomingEvent] = useState(null)
  const [eventMode, setEventMode] = useState(false) // Default: opt-out of event, show normal mode
  const [dailyChallengeMode, setDailyChallengeMode] = useState(false) // Daily challenge mode
  const [userEventStatus, setUserEventStatus] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState([]) // Weekly challenge leaderboard
  const [dailyLeaderboard, setDailyLeaderboard] = useState([]) // Daily challenge leaderboard
  const [userDailyRank, setUserDailyRank] = useState(null)
  const [showEventRules, setShowEventRules] = useState(false)
  const [showEventExplainer, setShowEventExplainer] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)

  // Track if user has seen event explainer modal
  const [hasSeenEventExplainer, setHasSeenEventExplainer] = useState(() => {
    return localStorage.getItem('fitrate_seen_event_explainer') === 'true'
  })

  // Track free user's weekly event entry (1 per week)
  const [freeEventEntryUsed, setFreeEventEntryUsed] = useState(() => {
    const stored = localStorage.getItem('fitrate_free_event_entry')
    if (stored) {
      const { weekStart, used } = JSON.parse(stored)
      // Check if we're still in the same week (weeks start Monday)
      const currentWeekStart = getWeekStart(new Date())
      if (weekStart === currentWeekStart) {
        return used
      }
    }
    return false
  })

  // User ID for referrals
  // SECURITY: Use crypto.randomUUID for cryptographically secure IDs
  const [userId] = useState(() => {
    let id = localStorage.getItem('fitrate_user_id')
    if (!id) {
      // Use crypto.randomUUID if available (modern browsers), fallback to crypto.getRandomValues
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = crypto.randomUUID()
      } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const arr = new Uint8Array(16)
        crypto.getRandomValues(arr)
        id = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
      } else {
        // Last resort fallback (should never happen in modern browsers)
        id = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
      }
      localStorage.setItem('fitrate_user_id', id)
    }
    return id
  })



  // Check Pro status on load (Identity: Email OR UserId)
  useEffect(() => {
    if (!isPro) {
      const savedEmail = localStorage.getItem('fitrate_email')
      checkProStatus(savedEmail)
    }
  }, [])

  // PWA: Capture install prompt for later use
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault()
      window.deferredInstallPrompt = e
      console.log('[PWA] Install prompt captured')
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  // PWA STABILITY: Handle visibility changes and memory pressure
  // iOS Safari WebView can crash when backgrounding with large images in memory
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // App going to background - clean up memory
        cleanupBlobUrls();
        hintGarbageCollection();
        console.log('[PWA] Visibility hidden - memory cleaned');
      } else if (document.visibilityState === 'visible') {
        // App returning to foreground
        console.log('[PWA] Visibility restored');
      }
    };

    // Also handle page hide (more reliable on iOS)
    const handlePageHide = () => {
      cleanupBlobUrls();
      hintGarbageCollection();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  // PWA AUTO-UPDATE: Poll for updates every 60 seconds
  // Ensures users get the latest version even during long sessions
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForUpdates = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          // If there's a waiting worker, it means an update is ready
          if (registration.waiting) {
            console.log('[PWA] Update found, reloading...');
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      } catch (err) {
        console.warn('[PWA] Update check failed:', err);
      }
    };

    // Check immediately on mount
    checkForUpdates();

    // Then check every 60 seconds
    const interval = setInterval(checkForUpdates, 60000);

    // Also check when app regains focus (user comes back to tab)
    const handleFocus = () => checkForUpdates();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Handle Referrals & Payment Success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)

    // Payment Success: AUTO-LOGIN logic
    if (urlParams.get('success') === 'true') {
      // Show loading while we poll for the webhook to finish
      setScreen('home'); // Reset to home but show a toast
      displayToast("⚡ Activating your Pro access...");

      // Clear the param immediately
      window.history.replaceState({}, '', window.location.pathname);

      // Attempt status check immediately, and again after 2 and 5 seconds (webhook delay)
      checkProStatus();
      setTimeout(checkProStatus, 2000);
      setTimeout(checkProStatus, 5000);

      // If after 15 seconds we still are not pro, then show the email prompt as fallback
      setTimeout(() => {
        if (localStorage.getItem('fitrate_pro') !== 'true') {
          setScreen('pro-email-prompt');
        } else {
          setScreen('pro-welcome');
        }
      }, 15000);
    }

    // Referral Claim
    const referrerId = urlParams.get('ref')
    if (referrerId && referrerId !== userId) {
      // Claim referral
      fetch(`${API_BASE}/referral/claim`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ referrerId })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.newReferral) {
            // Give bonus to current user too (Referee Bonus)
            const stored = localStorage.getItem('fitrate_scans')
            if (stored) {
              // If already used scan, reset to allow 1 more
              // Simplest way: just clear the scan record so they get a fresh free scan
              localStorage.removeItem('fitrate_scans')
              setScansRemaining(1)
              displayToast("🎉 Bonus scan unlocked!")
            }
          }
        })
        .catch(console.error)
    }
  }, [userId])

  // Check bonuses on load
  useEffect(() => {
    if (userId) {
      fetch(`${API_BASE}/referral/stats?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.bonusScans > 0) {
              setScansRemaining(prev => prev + data.bonusScans)
            }
            if (data.referralCount) {
              setReferralCount(data.referralCount)
            }
            const purchasedCount = data.purchasedScans || data.purchasedScansRemaining || 0; if (purchasedCount > 0) setPurchasedScans(purchasedCount)
            // Track referral progress for UI display
            if (data.totalReferrals !== undefined) {
              setTotalReferrals(data.totalReferrals)
              localStorage.setItem('fitrate_total_referrals', data.totalReferrals.toString())
            }
          }
        })
        .catch(console.error)
    }
  }, [userId])

  // Poll for referral notifications (when someone uses your link)
  useEffect(() => {
    if (!userId) return

    // Check on focus (when user comes back to app)
    const checkNotifications = async () => {
      try {
        const res = await fetch(`${API_BASE}/referral/notifications?userId=${userId}`)
        const data = await res.json()
        if (data.success && data.notifications?.length > 0) {
          data.notifications.forEach(n => {
            if (n.type === 'referral_claimed') {
              if (n.newRoastEarned) {
                displayToast('🔥 Savage Roast unlocked! Someone used your link!')
                playSound('legendary')
                vibrate([100, 50, 100])
              } else {
                displayToast(`🎉 Someone used your link! (${n.sharesUntilNext} more for Savage Roast)`)
                vibrate(30)
              }
              // Update local referral count
              if (n.totalReferrals) {
                setTotalReferrals(n.totalReferrals)
                localStorage.setItem('fitrate_total_referrals', n.totalReferrals.toString())
              }
            }
          })
        }
      } catch (err) {
        console.warn('Notification check failed:', err)
      }
    }

    // Check on focus
    const handleFocus = () => checkNotifications()
    window.addEventListener('focus', handleFocus)

    // Also poll every 30 seconds
    const pollInterval = setInterval(checkNotifications, 30000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(pollInterval)
    }
  }, [userId])

  // Offline/Online detection
  useEffect(() => {
    const handleOffline = () => displayToast('No internet connection 📵')
    const handleOnline = () => displayToast('Back online ✅')
    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  // Persist mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('fitrate_mode', mode)
  }, [mode])

  // Warn user before leaving during active analysis (prevents scan loss)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isAnalyzing) {
        e.preventDefault()
        e.returnValue = 'Analysis in progress. Your scan may be lost if you leave.'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAnalyzing])

  // Decline offer countdown timer (5 minutes = 300 seconds)
  useEffect(() => {
    if (showDeclineOffer) {
      setDeclineCountdown(300) // Start at 5 minutes
      const timer = setInterval(() => {
        setDeclineCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setShowDeclineOffer(false)
            setShowPaywall(false)
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    } else {
      setDeclineCountdown(null)
    }
  }, [showDeclineOffer])

  // Mock event for fallback/testing
  const MOCK_EVENT = {
    id: 'mock-holiday',
    theme: 'Holiday Glam',
    themeEmoji: '✨',
    themeDescription: 'Sparkles, velvet, and festive vibes! Show us your best holiday party look.',
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalParticipants: 1240
  }

  // Fetch current event on load
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_BASE}/event`, { headers: getApiHeaders() })
        const data = await res.json()
        if (data.success && data.event) {
          setCurrentEvent(data.event)
        } else {
          setCurrentEvent(MOCK_EVENT)
        }
        if (data.upcoming) {
          setUpcomingEvent(data.upcoming)
        }
      } catch (e) {
        console.error('Failed to fetch event, using mock:', e)
        setCurrentEvent(MOCK_EVENT)
      }
    }
    fetchEvent()
  }, [])

  // Fetch user's event status
  const fetchUserEventStatus = async () => {
    if (!userId || !currentEvent) return
    try {
      const res = await fetch(`${API_BASE}/event/status?userId=${userId}`, { headers: getApiHeaders() })
      const data = await res.json()
      if (data.success) {
        setUserEventStatus(data)
      }
    } catch (e) {
      console.error('Failed to fetch event status:', e)
    }
  }

  // Fetch weekly challenge leaderboard
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/event/leaderboard`, { headers: getApiHeaders() })
      const data = await res.json()
      if (data.success) {
        setLeaderboard(data.leaderboard || [])
        if (data.event) setCurrentEvent(prev => ({ ...prev, ...data.event }))
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard:', e)
    }
  }

  // Fetch daily challenge leaderboard
  const fetchDailyLeaderboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/leaderboard/today?userId=${encodeURIComponent(userId)}`, { headers: getApiHeaders() })
      const data = await res.json()
      if (data.success) {
        setDailyLeaderboard(data.leaderboard || [])
        if (data.userRank) setUserDailyRank(data.userRank)
      }
    } catch (e) {
      console.error('Failed to fetch daily leaderboard:', e)
    }
  }

  // Fetch user event status when event loads
  useEffect(() => {
    if (currentEvent && userId) {
      fetchUserEventStatus()
    }
  }, [currentEvent, userId])

  // ============================================
  // FASHION SHOW - Fetch show data when ID detected
  // ============================================
  useEffect(() => {
    if (!fashionShowId) return

    const fetchShowData = async () => {
      setFashionShowLoading(true)
      try {
        const res = await fetch(`${API_BASE}/show/${fashionShowId}`)
        if (res.ok) {
          const data = await res.json()
          setFashionShowData(data)
          // Check if user already joined (has nickname saved)
          const savedNick = localStorage.getItem(`fashionshow_${fashionShowId}_nickname`)
          const savedEmoji = localStorage.getItem(`fashionshow_${fashionShowId}_emoji`)
          if (savedNick) {
            setFashionShowNickname(savedNick)
            setFashionShowEmoji(savedEmoji || '😎')
            setFashionShowScreen('runway') // Go straight to runway
          }
        } else {
          setFashionShowData(null) // Show not found
        }
      } catch (err) {
        console.error('[FashionShow] Fetch error:', err)
        setFashionShowData(null)
      } finally {
        setFashionShowLoading(false)
      }
    }

    fetchShowData()
  }, [fashionShowId])

  // ============================================
  // BATTLE ROOM - Fetch data when ID detected
  // ============================================
  useEffect(() => {
    if (!challengePartyId) return

    const fetchChallengeParty = async () => {
      setChallengePartyLoading(true)
      try {
        const res = await fetch(`${API_BASE}/battle/${challengePartyId}`, {
          headers: getApiHeaders()
        })
        if (res.ok) {
          const data = await res.json()
          setChallengePartyData(data)
          // Check if current user created this challenge
          const createdChallenges = JSON.parse(localStorage.getItem('fitrate_created_challenges') || '[]')
          setIsCreatorOfChallenge(createdChallenges.includes(challengePartyId))
        } else {
          setChallengePartyData(null)
        }
      } catch (err) {
        console.error('[Battle] Fetch error:', err)
        setChallengePartyData(null)
      } finally {
        setChallengePartyLoading(false)
      }
    }

    fetchChallengeParty()
  }, [challengePartyId])

  // Auto-refresh battle data every 10 seconds (while waiting for responder)
  useEffect(() => {
    if (!challengePartyId) return
    if (challengePartyData?.status === 'completed') return // Don't poll if completed

    const pollBattle = async () => {
      try {
        const res = await fetch(`${API_BASE}/battle/${challengePartyId}`, {
          headers: getApiHeaders()
        })
        if (res.ok) {
          const data = await res.json()
          setChallengePartyData(data)
          // If completed, play celebration sound
          if (data.status === 'completed' && challengePartyData?.status !== 'completed') {
            playSound('celebrate')
            vibrate([100, 50, 100])
          }
        }
      } catch (err) {
        console.error('[Battle] Poll error:', err)
      }
    }

    // Poll every 10 seconds
    const interval = setInterval(pollBattle, 10000)
    return () => clearInterval(interval)
  }, [challengePartyId, challengePartyData?.status])

  // Refresh battle data (manual)
  const refreshChallengeParty = async () => {
    if (!challengePartyId) return
    setChallengePartyLoading(true)
    try {
      const res = await fetch(`${API_BASE}/battle/${challengePartyId}`, {
        headers: getApiHeaders()
      })
      if (res.ok) {
        const data = await res.json()
        setChallengePartyData(data)
      }
    } catch (err) {
      console.error('[Battle] Refresh error:', err)
    } finally {
      setChallengePartyLoading(false)
    }
  }

  // Helper: Format time remaining moved to utils/dateUtils

  // Check if user is Pro (via Email OR UserId)
  const checkProStatus = async (emailToCheck) => {
    try {
      setEmailChecking(true)
      const payload = {
        userId,
        email: emailToCheck || undefined
      }

      const response = await fetch(`${API_BASE}/pro/check`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify(payload)
      })
      const data = await response.json()

      if (data.isPro) {
        localStorage.setItem('fitrate_pro', 'true')
        setIsPro(true)

        // Only update email if we actually got one back/verified one
        if (data.email) {
          const cleanEmail = data.email.toLowerCase().trim()
          localStorage.setItem('fitrate_email', cleanEmail)
          setProEmail(cleanEmail)
        }
        return true
      }
      return false
    } catch (err) {
      console.error('Pro check error:', err)
      return false
    } finally {
      setEmailChecking(false)
    }
  }

  // Handle email submit after payment
  // SECURITY: Don't blindly trust redirect - verify with server first
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    const isNowPro = await checkProStatus(emailInput.trim())
    if (isNowPro) {
      setScreen('pro-welcome')
    } else {
      // Email not found yet - webhook might take a moment to process
      // Save email for future checks but DON'T grant Pro status yet
      localStorage.setItem('fitrate_email', emailInput.toLowerCase().trim())
      setProEmail(emailInput.toLowerCase().trim())

      // Show a message and retry after a short delay
      displayToast('⏳ Payment processing... checking again in a moment')

      // Retry after 3 seconds (webhook usually processes quickly)
      setTimeout(async () => {
        const retryPro = await checkProStatus(emailInput.trim())
        if (retryPro) {
          setScreen('pro-welcome')
        } else {
          // Still not confirmed - show success anyway but don't set isPro locally
          // The next API call will check server-side Pro status
          displayToast('🎉 Welcome! Your Pro status will activate shortly.')
          setScreen('home')
        }
      }, 3000)
    }
  }



  // Open Stripe checkout
  const startCheckout = (product) => {
    // Product price mapping for GA4
    const PRODUCT_PRICES = {
      proWeekly: 2.99,
      proRoast: 0.99,
      starterPack: 1.99,
      popularPack: 3.99,
      powerPack: 9.99
    }


    // GA4 begin_checkout event
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: PRODUCT_PRICES[product] || 0,
        items: [{ item_id: product, item_name: product }]
      })
    }

    const url = STRIPE_LINKS[product]
    if (url && !url.includes('placeholder')) {
      // Add userId for webhook tracking
      const checkoutUrl = `${url}?client_reference_id=${userId}`
      window.location.href = checkoutUrl
    } else {
      displayToast('Checkout not available yet')
    }
  }

  // Countdown timer
  useEffect(() => {
    if (scansRemaining === 0 && !isPro) {
      const updateTimer = () => {
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        const diff = tomorrow - now
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeUntilReset(`${hours}h ${mins}m`)
      }
      updateTimer()
      const interval = setInterval(updateTimer, 60000)
      return () => clearInterval(interval)
    }
  }, [scansRemaining, isPro])

  // Auto-open paywall when navigating to paywall/limit-reached screen
  useEffect(() => {
    if ((screen === 'paywall' || screen === 'limit-reached') && !showPaywall) {
      setShowPaywall(true)
    }
  }, [screen, showPaywall])



  // Mock scores for free users - Maximum variety!
  const generateMockScores = useCallback(() => {
    // Use timestamp + random for better uniqueness
    const seed = Date.now() + Math.random() * 1000000
    const seededRandom = () => {
      const x = Math.sin(seed + Math.random() * 10000) * 10000
      return x - Math.floor(x)
    }

    const roastVerdicts = [
      // Gen Z roasts
      "Bro really said 'I'll figure it out later' 💀",
      "The colors are in a toxic relationship",
      "This fit is giving... participation trophy",
      "Outfit said 'I have food at home'",
      "The dryer ate better fits than this",
      "Pinterest fail but make it fashion",
      "The fit that texts back 'k'",
      "This outfit has a 2.3 GPA 📉",
      "Sir this is a Wendy's 💀",
      "The algorithm buried this one",
      "Colors are screaming for help",
      "You wore this on purpose? 💀",
      "Fabric said 'I give up'",
      "This is a cry for help",
      "Outfit buffering... forever",
      "Did the lighting dirty you or... 😬",
      "Proportions left the chat",
      "This fit has a villain origin story",
      "Styled by throwing darts at the closet",
      // Universal roasts (funny but accessible)
      "Did your mirror break this morning? 😅",
      "Bold choice. Very bold.",
      "The outfit equivalent of a Monday",
      "I've seen better... at the laundromat",
      "Were you in a rush? Be honest.",
      "This needs a do-over",
      "Interesting... and not in a good way",
      "Even the mannequin would say no",
      "Your closet deserves an apology",
      "Confidence is great, but so is a mirror",
      "This is a fashion emergency 🚨",
      "Let's pretend this didn't happen"
    ]

    const niceVerdicts = [
      // Gen Z favorites
      "Main character energy ✨",
      "Clean and confident 🔥",
      "Understated fire detected",
      "This fit just works",
      "Effortless style 💅",
      "Quiet confidence unlocked",
      "Actually dripping",
      "This hits different ✨",
      "Certified fresh fit 🏆",
      "Immaculate vibes only",
      "Serving looks",
      "The coordination is *chefs kiss*",
      "Outfit understood the assignment",
      "You chose fashion today",
      "Effortless but intentional",
      "Pinterest would be proud",
      "Straight off a mood board",
      "Casual done right",
      "Nailed it 🎯",
      // Universal appeal
      "Looking sharp! Ready for anything",
      "Great style choices here",
      "Well put together 👏",
      "This outfit works beautifully",
      "Classic meets modern — love it",
      "Confident and polished",
      "You've got great taste",
      "Style on point today",
      "This look is a winner",
      "Really well coordinated",
      "A+ for effort and execution",
      "Sharp and stylish"
    ]

    const shareTips = [
      // Share prompts for all ages
      "Challenge a friend to beat this 👀",
      "Share with friends 📸",
      "Tag someone who needs a rating",
      "Send this to your group chat",
      "Show your friends this score",
      "Think you can do better? Try again!",
      "Bet a friend can't beat this 🔥",
      "Send to someone stylish",
      "Share your results!",
      "Get your friends to try it too",
      "Compare scores with friends",
      "Who has the best style? Find out!"
    ]

    const roastTips = [
      // Funny but understandable for all ages
      "Start over. Please.",
      "Have you considered... literally anything else?",
      "Less is more. Way less.",
      "A quick search for 'outfit ideas' might help",
      "Maybe try the other shirt next time",
      "Time for a wardrobe intervention",
      "An iron might be your new best friend",
      "Try again tomorrow",
      "Stick to simpler colors for now",
      "Accessories won't save this one",
      "Phone a stylish friend",
      "When in doubt, go with basics",
      "Perhaps consult a mirror first?",
      "This is a learning opportunity"
    ]

    const niceTips = [
      // Style tips that work for everyone
      "Cuff the jeans for cleaner lines",
      "A nice watch would elevate this",
      "Try layering with a light jacket",
      "Clean white sneakers work great here",
      "A simple accessory could add polish",
      "Rolling the sleeves adds a relaxed vibe",
      "Sunglasses would complete the look",
      "The right bag would tie this together",
      "Try tucking in the front of your shirt",
      "A belt would add nice definition",
      "Consider adding a pop of color",
      "This would pair well with a blazer",
      "Minimal jewelry keeps it elegant",
      "Great canvas for accessories"
    ]

    const honestVerdicts = [
      // Constructive feedback
      "Solid, but room to improve",
      "Almost there, just needs polish",
      "Good bones, execution varies",
      "The vision is there 📊",
      "Practical but not memorable",
      "Safe choice, nothing wrong",
      "Shows effort, needs refinement",
      "Close but missing something",
      "Functional, not exceptional",
      "Average execution of good idea",
      // Universal honest feedback
      "Decent foundation to build on",
      "Some nice elements, some misses",
      "A few tweaks could elevate this",
      "Good start, room to grow",
      "Not bad, but could be better",
      "Respectable effort overall",
      "Works for the occasion",
      "Middle of the road — safe bet",
      "Has potential with adjustments"
    ]

    const honestTips = [
      // Constructive suggestions for all ages
      "The proportions could use adjustment",
      "Consider a different color palette",
      "These colors clash slightly",
      "The fit could be more tailored",
      "The right accessories would help",
      "Try a different silhouette",
      "Balance the layers better",
      "Tailoring would make a big difference",
      "Higher quality fabric would elevate this",
      "Simpler might work better here",
      "Check the overall balance",
      "Iron or steam for a polished look",
      "Match your shoes to the outfit tone",
      "Less is more in this case"
    ]

    // Wider score range for variety - honest mode uses full natural range
    const baseScore = mode === 'roast'
      ? Math.floor(Math.random() * 35) + 40  // 40-74 for roast
      : mode === 'honest'
        ? Math.floor(Math.random() * 45) + 45 // 45-89 for honest (natural distribution)
        : Math.floor(Math.random() * 25) + 72   // 72-96 for nice

    // Add some variance to make siblings different
    const colorVariance = Math.floor(Math.random() * 20) - 10
    const fitVariance = Math.floor(Math.random() * 20) - 10
    const styleVariance = Math.floor(Math.random() * 20) - 10

    // Smart picker: avoid repeats for last 10 uses
    const pickUnique = (array, historyKey) => {
      const historyLimit = 10
      let history = []
      try {
        const stored = localStorage.getItem(`fitrate_history_${historyKey}`)
        if (stored) history = JSON.parse(stored)
      } catch (e) { history = [] }

      // Filter out recently used items
      const available = array.filter(item => !history.includes(item))

      // If all options exhausted, reset history and pick from full array
      const pool = available.length > 0 ? available : array
      const picked = pool[Math.floor(Math.random() * pool.length)]

      // Update history (keep last N items)
      history.push(picked)
      if (history.length > historyLimit) history = history.slice(-historyLimit)
      localStorage.setItem(`fitrate_history_${historyKey}`, JSON.stringify(history))

      return picked
    }

    // Rare legendary easter eggs (1% chance)
    const isLegendary = Math.random() < 0.01
    const legendaryVerdicts = [
      "⭐ LEGENDARY FIT ⭐",
      "🔥 ABSOLUTE DRIP LORD 🔥",
      "👑 FASHION ROYALTY 👑",
      "💎 CERTIFIED ICONIC 💎",
      "🌟 MAIN CHARACTER OF THE YEAR 🌟"
    ]

    // Social proof percentile (fake but believable)
    const getPercentile = (score) => {
      if (score >= 95) return 99
      if (score >= 90) return 96
      if (score >= 85) return 91
      if (score >= 80) return 84
      if (score >= 75) return 73
      if (score >= 70) return 61
      if (score >= 65) return 48
      if (score >= 60) return 35
      return Math.floor(score * 0.4)
    }

    const finalScore = isLegendary ? Math.floor(Math.random() * 5) + 96 : baseScore // 96-100 for legendary

    // Pick verdicts/tips based on mode
    const getVerdictPool = () => {
      if (mode === 'roast') return roastVerdicts
      if (mode === 'honest') return honestVerdicts
      return niceVerdicts
    }
    const getTipPool = () => {
      if (mode === 'roast') return roastTips
      if (mode === 'honest') return honestTips
      return niceTips
    }

    return {
      overall: finalScore,
      color: Math.min(100, Math.max(0, finalScore + colorVariance)),
      fit: Math.min(100, Math.max(0, finalScore + fitVariance)),
      style: Math.min(100, Math.max(0, finalScore + styleVariance)),
      occasion: Math.min(100, Math.max(0, finalScore + Math.floor(Math.random() * 16) - 8)),
      trend: Math.min(100, Math.max(0, finalScore + Math.floor(Math.random() * 16) - 8)),
      verdict: isLegendary
        ? legendaryVerdicts[Math.floor(Math.random() * legendaryVerdicts.length)]
        : pickUnique(getVerdictPool(), `${mode}_verdict`),
      tip: pickUnique(getTipPool(), `${mode}_tip`),
      shareTip: pickUnique(shareTips, 'share_tip'),
      aesthetic: pickUnique(AESTHETICS, 'aesthetic'),
      celebMatch: pickUnique(CELEBRITIES, 'celeb'),
      percentile: getPercentile(finalScore),
      isLegendary,
      mode,
      roastMode: mode === 'roast', // backwards compatibility
      timestamp: Date.now()
    }
  }, [mode])

  const incrementScanCount = () => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('fitrate_scans')
    let count = 1
    if (stored) {
      const { date, count: storedCount } = JSON.parse(stored)
      if (date === today) count = storedCount + 1
    }
    localStorage.setItem('fitrate_scans', JSON.stringify({ date: today, count }))
    setScansRemaining(Math.max(0, LIMITS.FREE_SCANS_DAILY - count))
  }

  const analyzeOutfit = useCallback(async (imageData) => {
    // GUARD: Prevent double-execution from rapid taps
    if (isAnalyzing) {
      console.log('[Analyze] Already analyzing - ignoring duplicate call')
      return
    }
    setIsAnalyzing(true)

    setScreen('analyzing')
    setError(null)
    setErrorCode(null) // Reset error code for fresh analysis

    // Optimistic check
    if (!isPro && scansRemaining <= 0) {
      setIsAnalyzing(false)
      setScreen('limit-reached')
      return
    }

    // MODE ENFORCEMENT: Use show's vibe for Fashion Shows, daily rotating mode for Daily Challenge
    let effectiveMode = mode  // Default to user's selected mode

    // Fashion Show: Use show's vibe
    if (fashionShowId && fashionShowData?.vibe) {
      effectiveMode = fashionShowData.vibe
      console.log(`[FashionShow] Mode overridden: ${mode} → ${effectiveMode} (show vibe)`)
    }
    // Daily Challenge: Use today's rotating mode
    else if (dailyChallengeMode) {
      effectiveMode = getDailyMode()
      console.log(`[DailyChallenge] Mode overridden: ${mode} → ${effectiveMode} (today's rotating mode)`)
    }

    // Free users: call backend (routes to Gemini for real AI analysis)
    if (!isPro) {
      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        // Create thumbnail for event mode submissions (Weekly Challenge)
        const isEventSubmission = eventMode && currentEvent && !fashionShowId;
        const isDailyChallengeSubmission = dailyChallengeMode && !fashionShowId;
        const isRespondingToBattle = !!localStorage.getItem('fitrate_responding_challenge');

        // Create thumbnail for event, daily challenge, OR battle mode submissions
        let challengeThumb = null;
        if ((isEventSubmission || isDailyChallengeSubmission || isRespondingToBattle) && imageData) {
          try {
            challengeThumb = await createThumbnail(imageData, 150, 0.6);
            console.log(`[${isRespondingToBattle ? 'Battle' : isDailyChallengeSubmission ? 'Daily' : 'Event'}] Thumbnail created:`, challengeThumb ? `${Math.round(challengeThumb.length / 1024)}KB` : 'failed');
          } catch (e) {
            console.warn('Failed to create challenge thumbnail:', e);
          }
        }

        // Call real AI endpoint (backend routes free users to Gemini)
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            image: imageData,
            mode: effectiveMode,  // Use show's vibe when in Fashion Show
            userId,
            eventMode: isEventSubmission,
            dailyChallenge: isDailyChallengeSubmission,  // Flag for daily challenge leaderboard
            imageThumb: challengeThumb  // Send thumbnail for leaderboard display
          }),
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        const data = await response.json()

        // Check if rate limited
        if (response.status === 429 || data.limitReached) {
          setScansRemaining(0)
          setScreen('limit-reached')
          return
        }

        if (!data.success) {
          // Sync scans from server response (even on failure) to prevent client desync
          if (data.scanInfo) {
            setScansRemaining(data.scanInfo.scansRemaining || 0)
            localStorage.setItem('fitrate_scans', JSON.stringify({
              date: new Date().toDateString(),
              count: data.scanInfo.scansUsed || 0
            }))
          }
          // Extract error code for better UX in ErrorScreen
          const code = data.code || 'SERVER_ERROR'
          setErrorCode(code)
          setError(data.error || 'Analysis failed')
          setScreen('error')
          return
        }

        // Update scans remaining from server
        if (data.scanInfo) {
          const bonus = data.scanInfo.bonusRemaining || 0
          setScansRemaining(data.scanInfo.scansRemaining + bonus)
          const used = data.scanInfo.scansUsed || 1
          localStorage.setItem('fitrate_scans', JSON.stringify({ date: new Date().toDateString(), count: used }))
        }

        // Update Streak from server response (more accurate than client-side)
        if (data.streak) {
          setDailyStreak(data.streak)
          localStorage.setItem('fitrate_streak', JSON.stringify(data.streak))
          console.log(`[Streak] Server: ${data.streak.current} days, tier: ${data.streak.tier}`)
        } else {
          // Fallback to client-side streak (when server doesn't return it)
          const storedStreak = localStorage.getItem('fitrate_streak')
          let newStreak = 1
          const today = new Date().toDateString()
          if (storedStreak) {
            try {
              const parsed = JSON.parse(storedStreak)
              const date = parsed.date || parsed.lastScan
              const count = parsed.count || parsed.current || 0
              if (date !== today) newStreak = count + 1
              else newStreak = count || 1
            } catch (e) { /* ignore */ }
          }
          const newStreakObj = { current: newStreak, message: `${newStreak} day streak! 🔥` }
          localStorage.setItem('fitrate_streak', JSON.stringify(newStreakObj))
          setDailyStreak(newStreakObj)
        }

        // Add virality features to real scores + subscore fallbacks
        const overall = data.scores.overall
        const scores = {
          ...data.scores,
          // Subscore fallbacks: if AI doesn't return, generate from overall ±5
          color: data.scores.color ?? Math.min(100, Math.max(0, Math.round(overall + (Math.random() * 10 - 5)))),
          fit: data.scores.fit ?? Math.min(100, Math.max(0, Math.round(overall + (Math.random() * 10 - 5)))),
          style: data.scores.style ?? Math.min(100, Math.max(0, Math.round(overall + (Math.random() * 10 - 5)))),
          percentile: data.scores.percentile ?? getPercentile(overall),
          isLegendary: overall >= 95 ? Math.random() < 0.3 : Math.random() < 0.01,
          shareTip: getRandomShareTip(),
          previousScore: lastScore, // For "you improved!" messaging
          // Include eventInfo if present in the response (for weekly challenge tracking)
          eventInfo: data.eventInfo,
          // Include eventStatus for share card rank display
          eventStatus: data.eventStatus
        }

        // Save this score as the new lastScore
        localStorage.setItem('fitrate_last_score', data.scores.overall.toString())
        setLastScore(data.scores.overall)

        setScores(scores)

        // ============================================
        // Mark free user's weekly event entry as used
        // ============================================
        if (!isPro && data.eventStatus && (data.eventStatus.action === 'added' || data.eventStatus.action === 'improved')) {
          const weekStart = getWeekStart(new Date())
          localStorage.setItem('fitrate_free_event_entry', JSON.stringify({ weekStart, used: true }))
          setFreeEventEntryUsed(true)
          console.log('[Event] Free user weekly entry marked as used')
        }

        // ============================================
        // FASHION SHOW: Record walk to scoreboard
        // ============================================
        if (fashionShowId) {
          // Read nickname/emoji from localStorage directly (state may not be updated yet due to React async)
          const nickname = localStorage.getItem(`fashionshow_${fashionShowId}_nickname`) || fashionShowNickname || 'Guest'
          const emoji = localStorage.getItem(`fashionshow_${fashionShowId}_emoji`) || fashionShowEmoji || '😎'

          if (nickname) {
            try {
              // CONTENT MODERATION: Block thumbnail if AI flagged content as inappropriate
              const isContentSafe = !data.scores.contentFlagged;

              // Create thumbnail only if content is safe
              let imageThumb = null;
              if (isContentSafe) {
                imageThumb = await createThumbnail(imageData, 150, 0.6);
                console.log('[FashionShow] Thumbnail created:', imageThumb ? `${Math.round(imageThumb.length / 1024)}KB` : 'failed');
              } else {
                console.warn('[FashionShow] Content flagged as inappropriate - skipping thumbnail');
              }

              await fetch(`${API_BASE}/show/${fashionShowId}/walk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId,
                  nickname: nickname,
                  emoji: emoji,
                  score: data.scores.overall,
                  verdict: data.scores.verdict || '',
                  tagline: data.scores.tagline || '',  // Short funny title for leaderboard
                  imageThumb: imageThumb // Will be null if content was flagged
                })
              })
              setFashionShowWalks(prev => prev + 1)
              console.log(`[FashionShow] Walk recorded: ${data.scores.overall} (thumb: ${imageThumb ? 'yes' : 'no - flagged'})`)
            } catch (err) {
              console.error('[FashionShow] Failed to record walk:', err)
            }
          } else {
            console.warn('[FashionShow] Skipping walk record - no nickname found')
          }
        }

        // Reset challenge modes after scan
        setDailyChallengeMode(false)
        setEventMode(false)

        // ============================================
        // BATTLE ROOM - Submit responder score if responding to a battle (FREE USERS)
        // Auto-trigger dramatic battle reveal animation after submission!
        // ============================================
        const respondingBattleId = localStorage.getItem('fitrate_responding_challenge')
        if (respondingBattleId) {
          try {
            const battleRes = await fetch(`${API_BASE}/battle/${respondingBattleId}/respond`, {
              method: 'POST',
              headers: getApiHeaders(),
              body: JSON.stringify({
                responderScore: overall,
                responderId: userId,
                responderThumb: challengeThumb  // Use locally created thumbnail
              })
            })
            const battleResult = await battleRes.json()
            console.log('[Battle] Free user submitted response:', battleResult)

            // Clear the pending battle flag
            localStorage.removeItem('fitrate_responding_challenge')

            // The backend returns the full updated battle with status: 'completed'
            // Trigger the dramatic battle reveal animation immediately!
            if (battleResult && battleResult.status === 'completed') {
              // Add this battle to responder's active battles list (so it shows in "My Battles")
              addToActiveBattles(respondingBattleId, overall, battleResult.mode || 'nice', 'completed')

              setChallengePartyId(respondingBattleId)
              setChallengePartyData(battleResult)
              setIsCreatorOfChallenge(false) // We are the responder
              setShowBattleReveal(true)
              setIsAnalyzing(false)
              setScreen('home') // Clear to home so reveal takes over
              return
            }

            // Fallback: store battle ID so results screen can show "See Battle Results" CTA
            setPendingBattleId(respondingBattleId)
            setIsAnalyzing(false)
            setScreen('results')
            return
          } catch (err) {
            console.error('[Battle] Failed to submit free user response:', err)
            localStorage.removeItem('fitrate_responding_challenge')
            // Fall through to normal results
          }
        }

        // CRITICAL: Reset analyzing flag so user can scan again
        setIsAnalyzing(false)

        // If user came from a challenge link, show comparison screen first
        if (challengeScore) {
          setScreen('challenge-result')
        } else {
          setScreen('results')
        }
        return
      } catch (err) {
        console.error('Analysis error:', err)
        if (err.name === 'AbortError') {
          setError("Request timed out — please try again!")
        } else {
          setError("Something went wrong — try again!")
        }
        setScreen('error')
        setIsAnalyzing(false)
        return
      }
    }

    // Pro users: call real AI
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      // Create thumbnail for event mode OR daily challenge submissions OR battle photos
      const isProEventSubmission = eventMode && currentEvent && !fashionShowId;
      const isProDailyChallengeSubmission = dailyChallengeMode && !fashionShowId;

      // Always create thumbnail for potential battle photo display
      let proChallengeThumb = null;
      if (imageData) {
        try {
          proChallengeThumb = await createThumbnail(imageData, 150, 0.6);
          // Store for battle photo display
          setLastAnalyzedThumb(proChallengeThumb);
          console.log('[Thumbnail] Created for battle/challenge:', proChallengeThumb ? `${Math.round(proChallengeThumb.length / 1024)}KB` : 'failed');
        } catch (e) {
          console.warn('Failed to create thumbnail:', e);
        }
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          image: imageData,
          mode: effectiveMode,  // Use show's vibe when in Fashion Show
          userId,
          eventMode: isProEventSubmission,
          dailyChallenge: isProDailyChallengeSubmission,  // Flag for daily challenge leaderboard
          imageThumb: proChallengeThumb  // Send thumbnail for leaderboard display
        }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok || !data.success) {
        // Sync scans from server response (even on failure) to prevent client desync
        if (data.scanInfo) {
          setScansRemaining(data.scanInfo.scansRemaining || 0)
          localStorage.setItem('fitrate_scans', JSON.stringify({
            date: new Date().toDateString(),
            count: data.scanInfo.scansUsed || 0
          }))
        }
        // Extract error code for better UX in ErrorScreen
        const code = data.code || (response.status === 429 ? 'LIMIT_REACHED' : 'SERVER_ERROR')
        setErrorCode(code)
        throw new Error(data.error || 'Analysis failed')
      }

      // Update Streak
      const storedStreak = localStorage.getItem('fitrate_streak')
      let newStreak = 1
      const today = new Date().toDateString()
      if (storedStreak) {
        const { date, count } = JSON.parse(storedStreak)
        if (date !== today) newStreak = count + 1
        else newStreak = count
      }
      localStorage.setItem('fitrate_streak', JSON.stringify({ date: today, count: newStreak }))
      setDailyStreak(newStreak)

      // Add subscore fallbacks for Pro users (same as free tier for consistency)
      const overall = data.scores.overall
      setScores({
        ...data.scores,
        mode,
        roastMode: mode === 'roast' || mode === 'savage',
        // Subscore fallbacks: if AI doesn't return, generate from overall ±5
        color: data.scores.color ?? Math.min(100, Math.max(0, Math.round(overall + (Math.random() * 10 - 5)))),
        fit: data.scores.fit ?? Math.min(100, Math.max(0, Math.round(overall + (Math.random() * 10 - 5)))),
        style: data.scores.style ?? Math.min(100, Math.max(0, Math.round(overall + (Math.random() * 10 - 5)))),
        percentile: data.scores.percentile ?? getPercentile(overall),
        isLegendary: overall >= 95 ? Math.random() < 0.3 : Math.random() < 0.01,
        shareTip: getRandomShareTip(),
        // Include eventInfo if present in the response (for weekly challenge tracking)
        eventInfo: data.eventInfo,
        // Include eventStatus for share card rank display
        eventStatus: data.eventStatus,
        // Daily challenge data for share card
        dailyChallenge: data.dailyChallenge
      })

      // Store Card DNA separately for results card rendering
      if (data.cardDNA) {
        setCardDNA(data.cardDNA)
        console.log('[CardDNA] Received unique DNA:', data.cardDNA.signature)
      }

      // Track scan completion for GA4 analytics
      trackScanComplete(effectiveMode, overall, {
        isDailyChallenge: isProDailyChallengeSubmission,
        isWeeklyChallenge: isProEventSubmission,
        isFashionShow: Boolean(activeFashionShow?.id)
      })

      // Refresh event status if user participated in event mode
      if (eventMode && currentEvent) {
        fetchUserEventStatus()
      }

      // ============================================
      // CHALLENGE PARTY - Submit responder score if responding to a challenge
      // ============================================
      const respondingChallengeId = localStorage.getItem('fitrate_responding_challenge')
      if (respondingChallengeId) {
        try {
          const res = await fetch(`${API_BASE}/battle/${respondingChallengeId}/respond`, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              responderScore: overall,
              responderId: userId,
              responderThumb: proChallengeThumb  // Use locally created thumbnail (not stale state)
            })
          })
          const challengeResult = await res.json()
          console.log('[Challenge] Submitted response:', challengeResult)

          // Clear the pending challenge
          localStorage.removeItem('fitrate_responding_challenge')

          // The backend returns the full updated battle with status: 'completed'
          // Trigger the dramatic battle reveal animation immediately!
          if (challengeResult && challengeResult.status === 'completed') {
            // Add this battle to responder's active battles list (so it shows in "My Battles")
            addToActiveBattles(respondingChallengeId, overall, challengeResult.mode || 'nice', 'completed')

            setChallengePartyId(respondingChallengeId)
            setChallengePartyData(challengeResult)
            setIsCreatorOfChallenge(false) // We are the responder
            setShowBattleReveal(true)
            setScreen('home') // Clear to home so reveal takes over
            return
          }

          // Fallback: store battle ID so results screen can show "See Battle Results" CTA
          setPendingBattleId(respondingChallengeId)
          setScreen('results')
          return
        } catch (err) {
          console.error('[Challenge] Failed to submit response:', err)
          localStorage.removeItem('fitrate_responding_challenge')
          // Fall through to normal results
        }
      }

      // If user came from a challenge link (old system), show comparison screen first
      if (challengeScore) {
        setScreen('challenge-result')
      } else {
        setScreen('results')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      if (err.name === 'AbortError') {
        setError("Request timed out — please try again!")
        setErrorCode('PROVIDER_ERROR')
      } else {
        setError(err.message || "Something went wrong — try again!")
        // errorCode may have been set above from API response
      }
      trackScanError(errorCode || 'UNKNOWN', err.message)
      setScreen('error')
    } finally {
      setIsAnalyzing(false)
    }
  }, [mode, isPro, eventMode, currentEvent, userId, isAnalyzing, scansRemaining, dailyChallengeMode])





  // Generate viral share card AND trigger native share directly (1-tap share)
  // type: 'challenge' generates a 1v1 challenge link with score, otherwise normal share
  const generateShareCard = useCallback(async (type) => {
    const isChallenge = type === 'challenge'

    // Satisfying feedback when generating
    playSound('share')
    vibrate(30)

    // Helper: Download share card and copy caption (desktop fallback)
    const downloadAndCopy = (imageBlob, text) => {
      // Download the image
      const link = document.createElement('a')
      link.href = URL.createObjectURL(imageBlob)
      link.download = 'fitrate-score.png'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(link.href)

      // Copy caption to clipboard
      navigator.clipboard.writeText(text).then(() => {
        setToastMessage(isChallenge ? 'Challenge ready! Send to a friend 🔥' : 'Image saved! Caption copied ✅')
        setShowToast(true)
        playSound('pop')
        vibrate(20)

        // GA4 tracking
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'share', {
            method: 'download',
            content_type: isChallenge ? 'challenge' : 'outfit_rating',
            item_id: scores?.overall
          })
        }

        // Go to share success after a short delay
        setTimeout(() => setScreen('share-success'), 1500)
      }).catch((err) => {
        console.warn('[Share] Clipboard copy failed:', err?.message || err)
        setToastMessage(isChallenge ? 'Challenge ready! Paste caption to send' : 'Image saved! Paste caption manually.')
        setShowToast(true)
        setTimeout(() => setScreen('share-success'), 1500)
      })
    }

    try {
      // Build event context for themed share card
      const eventShareContext = (eventMode && currentEvent && scores?.eventStatus) ? {
        theme: currentEvent.theme,
        themeEmoji: currentEvent.themeEmoji,
        rank: scores.eventStatus.rank,
        weekId: currentEvent.weekId
      } : null

      // Build daily challenge context for themed share card
      const dailyChallengeShareContext = scores?.dailyChallenge ? {
        rank: scores.dailyChallenge.rank,
        totalParticipants: scores.dailyChallenge.totalParticipants
      } : null

      // ============================================
      // BATTLE ROOM CREATION - Create backend room for 1v1 battle
      // Uses new /b/ URL pattern for legendary battle experience
      // ============================================
      let challengeUrl = null
      if (isChallenge && scores?.overall) {
        try {
          const res = await fetch(`${API_BASE}/battle`, {
            method: 'POST',
            headers: getApiHeaders(),
            body: JSON.stringify({
              creatorScore: scores.overall,
              creatorId: userId,
              mode: mode,  // Send the mode so responder uses same mode
              creatorThumb: lastAnalyzedThumb  // Send creator's outfit photo
            })
          })
          const data = await res.json()
          if (data.challengeId) {
            // Use new /b/ URL pattern for battle rooms
            challengeUrl = `https://fitrate.app/b/${data.challengeId}`
            trackBattleCreate(scores.overall)
            // Track locally that we created this battle
            const created = JSON.parse(localStorage.getItem('fitrate_created_challenges') || '[]')
            created.push(data.challengeId)
            localStorage.setItem('fitrate_created_challenges', JSON.stringify(created))
            // Add to active battles list (shows in "My Battles" on home screen)
            addToActiveBattles(data.challengeId, scores.overall, mode, 'waiting')
            console.log('[Battle] Created room:', data.challengeId)
          }
        } catch (err) {
          console.error('[Battle] Failed to create room:', err)
          // Continue with old fallback (?challenge=XX param) if backend fails
        }
      }

      const { file, text, url, imageBlob } = await generateShareCardUtil({
        scores,
        shareFormat,
        uploadedImage,
        userId,
        isPro: isPro || false,
        eventContext: eventShareContext,
        dailyChallengeContext: dailyChallengeShareContext,
        cardDNA,
        isChallenge,
        challengeUrl  // Pass the party URL if created
      })

      // Store shareData for potential future use
      setShareData({ file, text, url, imageBlob })

      // Try native share directly (no intermediate screen!)
      if (navigator.share) {
        try {
          const sharePayload = {
            title: isChallenge ? 'FitRate Battle' : 'My FitRate Score',
            text: text,
          }

          // Check if we can share files (most mobile browsers)
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            sharePayload.files = [file]
          }

          await navigator.share(sharePayload)

          // GA4 tracking
          if (typeof window.gtag === 'function') {
            window.gtag('event', 'share', {
              method: 'native_share',
              content_type: isChallenge ? 'challenge' : 'outfit_rating',
              item_id: scores?.overall
            })
          }

          // Success! Go to share-success screen
          setScreen('share-success')
        } catch (err) {
          if (err.name !== 'AbortError') {
            // Share failed but not cancelled - fallback to download
            downloadAndCopy(imageBlob, text)
          }
          // If AbortError (user cancelled), stay on results screen
        }
      } else {
        // Desktop fallback: download + copy caption
        downloadAndCopy(imageBlob, text)
      }

    } catch (error) {
      console.error("Share card generation failed", error)
      setToastMessage("Failed to generate card. Please try again.")
      setShowToast(true)
    }
  }, [uploadedImage, scores, userId, shareFormat, isPro])

  // Helpers wrapText and downloadImage moved to utils/shareUtils and utils/imageUtils

  // Camera functions for live webcam capture
  const resetApp = useCallback(() => {
    setScreen('home')
    setUploadedImage(null)
    setScores(null)
    setError(null)
  }, [])

  // Global toast notification (replaces browser alerts)
  const displayToast = useCallback((message, duration = 2500) => {
    setToastMessage(message)
    setShowToast(true)
    playSound('pop')
    vibrate(20)
    setTimeout(() => setShowToast(false), duration)
  }, [])

  const getScoreColor = (score) => {
    if (score >= 95) return '#ffd700' // Gold for legendary
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#00d4ff'
    return '#ff4444'
  }

  // Accent colors based on mode - DISTINCT per mode for instant recognition
  const getModeColor = () => {
    const colors = {
      nice: '#00ff88',
      roast: '#ff6b35',
      honest: '#3b82f6',
      savage: '#ff1493',
      rizz: '#ff69b4',
      celeb: '#ffd700',
      aura: '#9b59b6',
      chaos: '#ff4444',
      y2k: '#00CED1',
      villain: '#4c1d95',
      coquette: '#ffb6c1',
      hypebeast: '#f97316'
    }
    return colors[mode] || '#00d4ff'
  }
  const getModeGlow = () => {
    const glows = {
      nice: 'rgba(0,255,136,0.4)',
      roast: 'rgba(255,107,53,0.4)',
      honest: 'rgba(59,130,246,0.4)',
      savage: 'rgba(255,20,147,0.4)',
      rizz: 'rgba(255,105,180,0.4)',
      celeb: 'rgba(255,215,0,0.4)',
      aura: 'rgba(155,89,182,0.4)',
      chaos: 'rgba(255,68,68,0.4)',
      y2k: 'rgba(0,206,209,0.4)',
      villain: 'rgba(76,29,149,0.4)',
      coquette: 'rgba(255,182,193,0.4)',
      hypebeast: 'rgba(249,115,22,0.4)'
    }
    return glows[mode] || 'rgba(0,212,255,0.4)'
  }
  // Secondary gradient color per mode


  // ============================================
  // CAMERA SCREEN - Full screen live camera
  // ============================================


  // ============================================
  // PAYWALL MODAL - Check FIRST before home screen
  // (The full paywall UI is defined later, but we check the condition here)
  // ============================================
  // NOTE: The paywall modal code block was at line 2928 but screens return early
  // So we need a way to make paywall take priority. We'll do this by NOT
  // returning from home screen if showPaywall is true - instead show paywall inline.

  // ============================================
  // EVENT RULES SCREEN
  // ============================================
  if (showEventRules) {
    return <Suspense fallback={<LoadingFallback />}><RulesScreen currentEvent={currentEvent} onClose={() => setShowEventRules(false)} /></Suspense>
  }

  // ============================================
  // SETTINGS / RESTORE MODAL
  // ============================================
  if (showRestoreModal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] text-white">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-center mb-6">⚙️ Settings</h2>

          {/* Pro Status */}
          <div className="mb-6 p-4 rounded-2xl text-center" style={{
            background: isPro ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
            border: isPro ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.1)'
          }}>
            {isPro ? (
              <>
                <span className="text-3xl block mb-2">⚡</span>
                <p className="text-emerald-400 font-bold">You're a Pro!</p>
                <p className="text-white/50 text-xs mt-1">Unlimited scans • All modes</p>
              </>
            ) : (
              <>
                <span className="text-3xl block mb-2">🔓</span>
                <p className="text-white/70 font-medium">Free Account</p>
                <p className="text-white/40 text-xs mt-1">{scansRemaining} scans/day</p>
              </>
            )}
          </div>

          {/* Restore Purchase */}
          {!isPro && (
            <div className="mb-6">
              <p className="text-white/50 text-sm text-center mb-3">Already purchased Pro?</p>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter purchase email"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 mb-3"
              />
              <button
                onClick={async () => {
                  if (!emailInput) return;
                  displayToast('Checking...');
                  try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/pro/check`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: emailInput, userId })
                    });
                    const data = await res.json();
                    if (data.isPro) {
                      localStorage.setItem('fitrate_pro', 'true');
                      localStorage.setItem('fitrate_email', emailInput);
                      setIsPro(true);
                      setShowRestoreModal(false);
                      displayToast('⚡ Pro restored!');
                    } else {
                      displayToast('No Pro found for this email');
                    }
                  } catch (err) {
                    displayToast('Error checking status');
                  }
                }}
                className="w-full py-3 rounded-xl font-bold text-white transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #00d4ff, #0099ff)' }}
              >
                Restore Purchase
              </button>
            </div>
          )}

          {/* Close */}
          <button
            onClick={() => setShowRestoreModal(false)}
            className="w-full py-3 text-white/50 font-medium"
          >
            ← Back
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // IN-APP BROWSER: No longer blocking - let users try the app
  // Camera may have quirks but sharing/viewing works fine
  // ============================================

  // ============================================
  // FIRST-TIME USER ONBOARDING (highest priority)
  // ============================================
  if (showOnboarding) {
    return (
      <OnboardingModal
        onComplete={() => setShowOnboarding(false)}
        playSound={playSound}
        vibrate={vibrate}
      />
    )
  }

  // ============================================
  // EVENT EXPLAINER MODAL (First-time users)
  // ============================================
  if (showEventExplainer && currentEvent) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <EventExplainerModal
          event={currentEvent}
          isPro={isPro}
          freeEventEntryUsed={freeEventEntryUsed}
          onJoin={() => {
            localStorage.setItem('fitrate_seen_event_explainer', 'true')
            setHasSeenEventExplainer(true)
            setShowEventExplainer(false)
            setEventMode(true)
          }}
          onClose={() => {
            localStorage.setItem('fitrate_seen_event_explainer', 'true')
            setHasSeenEventExplainer(true)
            setShowEventExplainer(false)
          }}
          onUpgrade={() => {
            setShowEventExplainer(false)
            setShowPaywall(true)
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // FASHION SHOW SCREENS
  // ============================================
  if (fashionShowScreen === 'create') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FashionShowCreate
          isPro={isPro}
          userId={userId}
          onShowCreated={(showData) => {
            setFashionShowData(showData)
            setFashionShowId(showData.showId)
            addToActiveShows(showData.showId, showData.name, showData.vibe, showData.vibeLabel) // Track in My Shows with vibe
            setFashionShowScreen('invite')
          }}
          onBack={() => {
            setFashionShowScreen(null)
            window.history.pushState({}, '', '/')
          }}
        />
      </Suspense>
    )
  }

  if (fashionShowScreen === 'invite') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FashionShowInvite
          showData={fashionShowData}
          onGoToRunway={() => {
            setFashionShowNickname('Host')
            setFashionShowScreen('runway')
            window.history.pushState({}, '', `/f/${fashionShowId}`)
          }}
          onBack={() => {
            setFashionShowScreen(null)
            window.history.pushState({}, '', '/')
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // FASHION SHOW HUB (Merged Join + Runway + Camera)
  // Skip if showing results/analyzing - let those screens take priority
  // ============================================
  if ((fashionShowScreen === 'join' || fashionShowScreen === 'runway') &&
    screen !== 'analyzing' && screen !== 'results' && screen !== 'error') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <FashionShowHub
          showId={fashionShowId}
          showData={fashionShowData}
          userId={userId}
          isPro={isPro}
          walksUsed={fashionShowWalks}
          walksAllowed={isPro ? 3 : 1}
          onImageSelected={(file, scanType) => {
            // Record nickname before analyzing
            const nickname = localStorage.getItem(`fashionshow_${fashionShowId}_nickname`) || 'Guest'
            const emoji = localStorage.getItem(`fashionshow_${fashionShowId}_emoji`) || '😎'
            setFashionShowNickname(nickname)
            setFashionShowEmoji(emoji)
            addToActiveShows(fashionShowId, fashionShowData?.name || 'Fashion Show', fashionShowData?.vibe, fashionShowData?.vibeLabel)

            // Start analysis
            setUploadedImage(file)
            setScreen('analyzing')
            analyzeOutfit(file, scanType)
          }}
          onShare={() => {
            const url = `https://fitrate.app/f/${fashionShowId}`
            if (navigator.share) {
              navigator.share({
                title: `Join ${fashionShowData?.name}`,
                text: `🎭 Join my Fashion Show on FitRate!`,
                url
              })
            } else {
              navigator.clipboard.writeText(url)
            }
          }}
          onBack={() => {
            // Clean exit: reset all Fashion Show state and go home
            setFashionShowScreen(null)
            setFashionShowId(null)
            setFashionShowData(null)
            setScreen('home')  // Explicit navigation to prevent render glitch
            window.history.pushState({}, '', '/')
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // CHALLENGES SCREEN (Daily + Weekly)
  // ============================================
  if (screen === 'challenges') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ChallengesScreen
          // Daily challenge props
          dailyLeaderboard={dailyLeaderboard}
          userDailyRank={userDailyRank}
          // Weekly challenge props
          currentEvent={currentEvent}
          weeklyLeaderboard={leaderboard}
          userEventStatus={userEventStatus}
          userId={userId}
          isPro={isPro}
          freeEventEntryUsed={freeEventEntryUsed}
          // Actions
          onCompeteDaily={() => {
            setDailyChallengeMode(true)
            setEventMode(false)
            setScreen('home')
          }}
          onCompeteWeekly={() => {
            setDailyChallengeMode(false)
            setEventMode(true)
            setScreen('home')
          }}
          onShowPaywall={() => setShowPaywall(true)}
          onShowFullLeaderboard={() => setShowLeaderboard(true)}
          onBack={() => setScreen('home')}
          // Data fetching
          fetchDailyLeaderboard={fetchDailyLeaderboard}
          fetchWeeklyLeaderboard={() => { fetchLeaderboard(); fetchUserEventStatus(); }}
        />
      </Suspense>
    )
  }

  // ============================================
  // MEET THE JUDGES - AI Personalities Showcase
  // ============================================
  if (screen === 'judges') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <MeetTheJudges
          onBack={() => setScreen('home')}
          onSelectMode={(selectedMode) => {
            setMode(selectedMode)
            localStorage.setItem('fitrate_mode', selectedMode)
            setScreen('home')
            displayToast(`${selectedMode.charAt(0).toUpperCase() + selectedMode.slice(1)} mode selected! 🎯`)
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // BATTLE RESULTS REVEAL - Dramatic cinematic reveal animation
  // Shows when battle is completed and user triggers "See Battle Results"
  // ============================================
  if (showBattleReveal && challengePartyData && challengePartyData.status === 'completed') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <BattleResultsReveal
          battleData={challengePartyData}
          isCreator={isCreatorOfChallenge}
          onViewScorecard={() => {
            // Navigate to user's detailed scorecard (ResultsScreen)
            setShowBattleReveal(false)
            setChallengePartyId(null)
            setChallengePartyData(null)
            window.history.pushState({}, '', '/')
            // The scores are already set from the responder's analysis, just show results
            setScreen('results')
          }}
          onShare={() => {
            setShowBattleReveal(false)
            // Share battle result
            const shareUrl = `https://fitrate.app/b/${challengePartyId}`
            const myScore = isCreatorOfChallenge ? challengePartyData.creatorScore : challengePartyData.responderScore
            const shareText = `⚔️ I scored ${Math.round(myScore)} in a 1v1 battle!\n${shareUrl}`
            if (navigator.share) {
              navigator.share({ title: 'FitRate Battle', text: shareText })
            } else {
              navigator.clipboard.writeText(shareText)
              displayToast('Battle result copied!')
            }
          }}
          onRematch={() => {
            setShowBattleReveal(false)
            // Start new battle - go to home to take new photo
            setChallengePartyId(null)
            setChallengePartyData(null)
            window.history.pushState({}, '', '/')
            setScreen('home')
          }}
          onHome={() => {
            setShowBattleReveal(false)
            setChallengePartyId(null)
            setChallengePartyData(null)
            window.history.pushState({}, '', '/')
            setScreen('home')
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // BATTLE ROOM - Legendary 1v1 Outfit Battles (/b/:id or /c/:id)
  // MUST be checked BEFORE HomeScreen to take priority
  // Skip if user is analyzing (so AnalyzingScreen can show)
  // ============================================
  if (challengePartyId && (challengePartyData || challengePartyLoading) && screen !== 'analyzing') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <BattleRoom
          battleId={challengePartyId}
          battleData={challengePartyData}
          userId={userId}
          isCreator={isCreatorOfChallenge}
          loading={challengePartyLoading}
          onImageSelected={async (imageData, scanType) => {
            // Responder took a photo directly in BattleRoom - analyze and submit
            localStorage.setItem('fitrate_responding_challenge', challengePartyId)
            setUploadedImage(imageData)
            setScreen('analyzing')
            analyzeOutfit(imageData, scanType)
          }}
          onShare={() => {
            // Share battle link (use /b/ for new pattern)
            const shareUrl = `https://fitrate.app/b/${challengePartyId}`
            const shareText = challengePartyData?.creatorScore
              ? `⚔️ I scored ${Math.round(challengePartyData.creatorScore)}. Can you beat me?\n${shareUrl}`
              : `⚔️ 1v1 me! Who's got better style?\n${shareUrl}`

            if (navigator.share) {
              navigator.share({ title: 'FitRate Battle', text: shareText })
            } else {
              navigator.clipboard.writeText(shareText)
              displayToast('Battle link copied! ⚔️')
            }
          }}
          onHome={() => {
            setChallengePartyId(null)
            setChallengePartyData(null)
            setUseBattleRoom(false)
            window.history.pushState({}, '', '/')
            setScreen('home')
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // HOME SCREEN - Camera First, Zero Friction
  // Only show if paywall/leaderboard are NOT open (modals take priority)
  // ============================================
  if (screen === 'home' && !showPaywall && !showLeaderboard && !showRules) {
    return (
      <>
        <HomeScreen
          mode={mode}
          setMode={setMode}
          isPro={isPro}
          scansRemaining={scansRemaining}
          dailyStreak={dailyStreak}
          currentEvent={currentEvent}
          eventMode={eventMode}
          dailyChallengeMode={dailyChallengeMode}
          setDailyChallengeMode={setDailyChallengeMode}
          setEventMode={setEventMode}
          purchasedScans={purchasedScans}
          challengeScore={challengeScore}
          showToast={showToast}
          toastMessage={toastMessage}
          showInstallBanner={showInstallBanner}
          onShowInstallBanner={setShowInstallBanner}
          hasSeenEventExplainer={hasSeenEventExplainer}
          onShowEventExplainer={() => setShowEventExplainer(true)}
          freeEventEntryUsed={freeEventEntryUsed}
          onImageSelected={(img, scanType) => {
            setUploadedImage(img)
            setScreen('analyzing')
            analyzeOutfit(img, scanType)
          }}
          onShowPaywall={() => setShowPaywall(true)}
          onShowRules={() => setShowEventRules(true)}
          onShowRestore={() => setShowRestoreModal(true)}
          onError={(msg) => { setError(msg); setScreen('error'); }}
          onStartFashionShow={() => setFashionShowScreen('create')}
          onShowWeeklyChallenge={() => { fetchDailyLeaderboard(); fetchLeaderboard(); fetchUserEventStatus(); setScreen('challenges'); }}
          pendingFashionShowWalk={pendingFashionShowWalk}
          onClearPendingWalk={() => setPendingFashionShowWalk(false)}
          fashionShowName={fashionShowData?.name}
          fashionShowVibe={fashionShowData?.vibe}
          fashionShowVibeLabel={fashionShowData?.vibeLabel}
          activeShows={activeShows}
          onNavigateToShow={(showId) => {
            // Navigate directly to a specific Fashion Show
            setFashionShowId(showId)
            setFashionShowScreen('runway')
            window.history.pushState({}, '', `/f/${showId}`)
            // Fetch show data with userId to get walk count
            fetch(`${API_BASE}/show/${showId}?userId=${encodeURIComponent(userId)}`)
              .then(res => res.json())
              .then(data => {
                if (data.showId) {
                  setFashionShowData(data)
                  // Restore nickname/emoji from localStorage
                  const savedNick = localStorage.getItem(`fashionshow_${showId}_nickname`)
                  const savedEmoji = localStorage.getItem(`fashionshow_${showId}_emoji`)
                  setFashionShowNickname(savedNick || 'Guest')
                  setFashionShowEmoji(savedEmoji || '😎')
                  // Restore walk count from backend
                  setFashionShowWalks(data.userWalks || 0)
                } else {
                  // Show expired/not found - remove from active shows
                  removeFromActiveShows(showId)
                  setFashionShowScreen(null)
                  window.history.pushState({}, '', '/')
                }
              })
              .catch((err) => {
                console.warn('[FashionShow] Failed to load show:', err?.message || err)
                removeFromActiveShows(showId)
                setFashionShowScreen(null)
                window.history.pushState({}, '', '/')
              })
          }}
          onRemoveShow={(showId) => {
            removeFromActiveShows(showId)
          }}
          activeBattles={activeBattles}
          onNavigateToBattle={async (battleId) => {
            // Navigate to a battle room
            setChallengePartyId(battleId)
            window.history.pushState({}, '', `/c/${battleId}`)
            setChallengePartyLoading(true)
            try {
              const res = await fetch(`${API_BASE}/battle/${battleId}`, {
                headers: getApiHeaders()
              })
              if (res.ok) {
                const data = await res.json()
                setChallengePartyData(data)
                // If battle is completed, show the reveal animation
                if (data.status === 'completed') {
                  setShowBattleReveal(true)
                }
              } else {
                // Battle not found - remove from list
                removeFromActiveBattles(battleId)
                setChallengePartyId(null)
                window.history.pushState({}, '', '/')
              }
            } catch (err) {
              console.error('[Battle] Failed to load:', err)
              removeFromActiveBattles(battleId)
              setChallengePartyId(null)
              window.history.pushState({}, '', '/')
            } finally {
              setChallengePartyLoading(false)
            }
          }}
          onRemoveBattle={(battleId) => {
            removeFromActiveBattles(battleId)
          }}
          onNavigate={(target) => {
            // General navigation for mode drawer links (judges, etc.)
            setScreen(target)
          }}
        />
        <BottomNav
          activeTab="home"
          eventMode={eventMode}
          onNavigate={(tab) => {
            if (tab === 'challenges') {
              fetchDailyLeaderboard();
              fetchLeaderboard();
              fetchUserEventStatus();
              setScreen('challenges');
            }
            // 'home' tab is already current, no action needed
          }}
          onScan={() => {
            // Trigger the main scan button on HomeScreen
            const mainCta = document.getElementById('main-scan-cta');
            if (mainCta) {
              mainCta.click();
            }
          }}
        />
      </>
    )
  }

  // ============================================
  // ANALYZING SCREEN - Dopamine Loader
  // ============================================
  if (screen === 'analyzing') {
    return (
      <AnalyzingScreen
        uploadedImage={uploadedImage}
        mode={mode}
        isPro={isPro}
        onBack={() => {
          setIsAnalyzing(false)
          setScreen('home')
          displayToast('Analysis cancelled')
        }}
      />
    )
  }

  // ============================================
  // CHALLENGE RESULT SCREEN - OLD SYSTEM ("Who Won?" from query param)
  // ============================================
  // Safety fallback: if we have challengeScore but no scores (scan failed), redirect home
  if (screen === 'challenge-result' && challengeScore && !scores) {
    setChallengeScore(null)
    setScreen('home')
    return null
  }

  if (screen === 'challenge-result' && scores && challengeScore) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <>
          <ChallengeResultScreen
            userScore={scores.overall}
            challengeScore={challengeScore}
            userImage={uploadedImage}
            onViewResults={() => setScreen('results')}
            onChallengeBack={() => {
              // Clear challenge score and trigger share for rematch
              setChallengeScore(null)
              setScreen('results')
              // Auto-trigger share after a short delay
              setTimeout(() => generateShareCard(), 500)
            }}
            onTryAgain={() => {
              setChallengeScore(null) // Clear so next scan goes to results
              resetApp()
            }}
            onSendResultBack={() => {
              // Open the visual share card modal
              playSound('click')
              vibrate(20)
              setShowChallengeResultShare(true)
            }}
          />

          {/* Challenge Result Share Card Modal */}
          {showChallengeResultShare && (
            <ChallengeResultShareCard
              userScore={scores.overall}
              challengeScore={challengeScore}
              userImage={uploadedImage}
              onClose={() => setShowChallengeResultShare(false)}
            />
          )}
        </>
      </Suspense>
    )
  }

  // ============================================
  // RESULTS SCREEN - The Viral Engine
  // ============================================
  if (screen === 'results' && scores) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <>
          <ResultsScreen
            scores={scores}
            cardDNA={cardDNA}
            mode={mode}
            uploadedImage={uploadedImage}
            isPro={isPro}
            scansRemaining={scansRemaining}
            onReset={resetApp}
            onSetMode={setMode}
            onGenerateShareCard={generateShareCard}
            onShowPaywall={() => setShowPaywall(true)}
            playSound={playSound}
            vibrate={vibrate}
            currentEvent={eventMode ? currentEvent : null}
            onStartFashionShow={() => setFashionShowScreen('create')}
            totalScans={LIMITS.TOTAL_FREE_DAILY - scansRemaining}
            fashionShowId={fashionShowId}
            fashionShowName={fashionShowData?.name}
            dailyStreak={dailyStreak}
            showToast={(msg) => { setToastMessage(msg); setShowToast(true); }}
            onReturnToRunway={() => {
              setFashionShowScreen('runway')
              setScores(null)
              setScreen('home')
            }}
            pendingBattleId={pendingBattleId}
            onSeeBattleResults={async () => {
              if (!pendingBattleId) return
              // Fetch battle data and show dramatic reveal
              setChallengePartyId(pendingBattleId)
              window.history.pushState({}, '', `/c/${pendingBattleId}`)
              setChallengePartyLoading(true)
              try {
                const partyRes = await fetch(`${API_BASE}/battle/${pendingBattleId}`, {
                  headers: getApiHeaders()
                })
                if (partyRes.ok) {
                  const partyData = await partyRes.json()
                  setChallengePartyData(partyData)
                  // Show the dramatic battle reveal animation!
                  setShowBattleReveal(true)
                  setScreen('home')  // Clear results screen
                }
              } finally {
                setChallengePartyLoading(false)
              }
              setPendingBattleId(null)  // Clear pending battle
            }}
          />
          <BottomNav
            activeTab={null}
            eventMode={eventMode}
            onNavigate={(tab) => {
              if (tab === 'home') {
                // Clear Fashion Show state to prevent stale navigation
                setFashionShowScreen(null)
                setScores(null)
                setScreen('home');
              } else if (tab === 'challenges') {
                fetchDailyLeaderboard();
                fetchLeaderboard();
                fetchUserEventStatus();
                setScreen('challenges');
              }
            }}
            onScan={() => {
              // Go home to scan again
              resetApp();
            }}
          />
        </>
      </Suspense>
    )
  }

  // ============================================
  // ERROR SCREEN
  // ============================================
  if (screen === 'error') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ErrorScreen
          error={error}
          errorCode={errorCode}
          onReset={() => {
            // Clear error state and go home
            setError(null)
            setErrorCode(null)
            setIsAnalyzing(false)
            setScreen('home')
          }}
          onUpgrade={() => setShowPaywall(true)}
          onHome={() => {
            setError(null)
            setErrorCode(null)
            setIsAnalyzing(false)
            setScreen('home')
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // PRO EMAIL PROMPT SCREEN
  // ============================================
  // ============================================
  // PRO EMAIL PROMPT SCREEN
  // ============================================
  if (screen === 'pro-email-prompt') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ProEmailPromptScreen
          emailInput={emailInput}
          setEmailInput={setEmailInput}
          onSubmit={handleEmailSubmit}
          checking={emailChecking}
        />
      </Suspense>
    )
  }

  // ============================================
  // PRO WELCOME SCREEN
  // ============================================
  if (screen === 'pro-welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] text-white" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        <div className="text-7xl mb-6">🎉</div>
        <h2 className="text-4xl font-black text-white mb-3">Welcome to FitRate Pro!</h2>
        <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          You now have 25 ratings per day
        </p>

        <div className="p-6 rounded-2xl mb-8 text-center" style={{
          background: 'rgba(0,255,136,0.1)',
          border: '1px solid rgba(0,255,136,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <p className="text-base" style={{ color: '#00ff88' }}>
            ✨ 25 ratings per day<br />
            🤖 Advanced AI analysis<br />
            🔥 All modes unlocked
          </p>
        </div>

        <button
          onClick={() => setScreen('home')}
          className="px-10 py-5 rounded-2xl text-white font-bold text-xl transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
            boxShadow: '0 4px 30px rgba(0,212,255,0.4)'
          }}
        >
          Start Rating 🚀
        </button>
      </div>
    )
  }

  // ============================================
  // PAYWALL/LIMIT-REACHED SCREEN - Redirect to Sales Page Modal
  // ============================================
  // ============================================
  // PAYWALL/LIMIT-REACHED SCREEN
  // ============================================
  if (screen === 'paywall' || screen === 'limit-reached') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PaywallScreen
          screen={screen}
          mode={mode}
          timeUntilReset={timeUntilReset}
          onShowPaywall={() => setShowPaywall(true)}
          onClose={() => setScreen('home')}
        />
      </Suspense>
    )
  }

  // SharePreviewScreen REMOVED - share now happens directly from Results
  // (1-tap share flow per founder audit recommendations)


  // ============================================
  // SHARE SUCCESS - One Follow-up Option
  // ============================================
  // ============================================
  // SHARE SUCCESS SCREEN
  // ============================================
  if (screen === 'share-success') {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <ShareSuccessScreen
          mode={mode}
          setMode={setMode}
          setScreen={setScreen}
          userId={userId}
          score={scores?.overall}
          totalReferrals={totalReferrals}
        />
      </Suspense>
    )
  }

  // ============================================
  // PAYWALL MODAL - Pro upgrade with decline offer
  // ============================================
  // ============================================
  // PAYWALL MODAL
  // ============================================
  if (showPaywall) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <PaywallModal
          showPaywall={showPaywall}
          setShowPaywall={setShowPaywall}
          showDeclineOffer={showDeclineOffer}
          setShowDeclineOffer={setShowDeclineOffer}
          declineCountdown={declineCountdown}
          checkoutLoading={checkoutLoading}
          startCheckout={startCheckout}
        />
      </Suspense>
    )
  }

  // ============================================
  // LEADERBOARD MODAL (Full view from Weekly Challenge)
  // ============================================
  if (showLeaderboard) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <LeaderboardModal
          showLeaderboard={showLeaderboard}
          setShowLeaderboard={setShowLeaderboard}
          currentEvent={currentEvent}
          leaderboard={leaderboard}
          userEventStatus={userEventStatus}
          isPro={isPro}
          upcomingEvent={upcomingEvent}
        />
      </Suspense>
    )
  }

  if (showRules) {
    return <RulesModal onClose={() => setShowRules(false)} />
  }

  // ============================================
  // RESTORE PRO MODAL
  // ============================================
  if (showRestoreModal) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <RestoreProModal
          userId={userId}
          onClose={() => setShowRestoreModal(false)}
          onRestoreSuccess={() => {
            setIsPro(true)
            localStorage.setItem('fitrate_pro', 'true')
            setShowRestoreModal(false)
            setScreen('home')
          }}
        />
      </Suspense>
    )
  }

  // ============================================
  // FALLBACK: No matching screen - redirect home
  // This should never happen, but prevents blank screen
  // ============================================
  console.warn('[Navigation] No matching screen condition - redirecting to home. Current state:', { screen, fashionShowScreen, showPaywall, showLeaderboard, showRules })

  // Use useEffect-safe reset: schedule redirect for next tick
  setTimeout(() => {
    setScreen('home')
    setFashionShowScreen(null)
  }, 0)

  return null
}
