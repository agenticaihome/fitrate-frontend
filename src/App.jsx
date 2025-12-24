import React, { useState, useCallback, useEffect } from 'react'
import { playSound, vibrate } from './utils/soundEffects'
import RulesModal from './components/RulesModal'
import Footer from './components/common/Footer'
import BottomNav from './components/common/BottomNav'
import { LIMITS, PRICES, RESETS, STRIPE_LINKS, ROUTES } from './config/constants'
import { getScoreColor } from './utils/scoreUtils'
import { compressImage, cleanupBlobUrls, hintGarbageCollection, createThumbnail } from './utils/imageUtils'
import { generateShareCard as generateShareCardUtil } from './utils/shareUtils'

// Screens
import ResultsScreen from './screens/ResultsScreen'
import AnalyzingScreen from './screens/AnalyzingScreen'
import HomeScreen from './screens/HomeScreen'
import ErrorScreen from './screens/ErrorScreen'
import ProEmailPromptScreen from './screens/ProEmailPromptScreen'
import ProWelcomeScreen from './screens/ProWelcomeScreen'
// SharePreviewScreen removed - share now triggers directly from Results
import ShareSuccessScreen from './screens/ShareSuccessScreen'
import PaywallScreen from './screens/PaywallScreen'
import RulesScreen from './screens/RulesScreen'
import ChallengeResultScreen from './screens/ChallengeResultScreen'
// Fashion Show screens
import FashionShowCreate from './screens/FashionShowCreate'
import FashionShowJoin from './screens/FashionShowJoin'
import FashionShowRunway from './screens/FashionShowRunway'
import FashionShowInvite from './screens/FashionShowInvite'
// Weekly Challenge screen
import WeeklyChallengeScreen from './screens/WeeklyChallengeScreen'

// Modals
import PaywallModal from './components/modals/PaywallModal'
import LeaderboardModal from './components/modals/LeaderboardModal'
import EventExplainerModal from './components/modals/EventExplainerModal'
import RestoreProModal from './components/modals/RestoreProModal'

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
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [inAppBrowser, setInAppBrowser] = useState(null)

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

  // Challenge a Friend (score from URL)
  const [challengeScore, setChallengeScore] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return parseInt(params.get('challenge')) || null
  })

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

  // Purchased scans (from scan packs)
  const [purchasedScans, setPurchasedScans] = useState(0)

  // Daily Streak Logic
  const [dailyStreak, setDailyStreak] = useState(() => {
    try {
      const stored = localStorage.getItem('fitrate_streak')
      if (stored) {
        const { date, count } = JSON.parse(stored)
        const lastDate = new Date(date)
        const today = new Date()

        // Check if yesterday (allow 48h window to be safe)
        const diffTime = Math.abs(today - lastDate)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays <= 2) return count // Keep streak
        return 0 // Streak broken
      }
    } catch (e) { return 0 }
    return 0
  })

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
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')
  const [emailChecking, setEmailChecking] = useState(false)
  const [proEmail, setProEmail] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [totalReferrals, setTotalReferrals] = useState(() => parseInt(localStorage.getItem('fitrate_total_referrals') || '0'))
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [scores, setScores] = useState(null)
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
  const [userEventStatus, setUserEventStatus] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
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

  // Fetch leaderboard
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

    // FASHION SHOW MODE ENFORCEMENT: Use show's vibe instead of user's selected mode
    const effectiveMode = fashionShowId && fashionShowData?.vibe
      ? fashionShowData.vibe  // Use the show's vibe setting
      : mode                   // Use user's selected mode

    if (fashionShowId && fashionShowData?.vibe && fashionShowData.vibe !== mode) {
      console.log(`[FashionShow] Mode overridden: ${mode} → ${fashionShowData.vibe} (show vibe)`)
    }

    // Free users: call backend (routes to Gemini for real AI analysis)
    if (!isPro) {
      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        // Create thumbnail for event mode submissions (Weekly Challenge)
        const isEventSubmission = eventMode && currentEvent && !fashionShowId;
        let eventThumb = null;
        if (isEventSubmission && imageData) {
          try {
            eventThumb = await createThumbnail(imageData, 150, 0.6);
            console.log('[Event] Thumbnail created:', eventThumb ? `${Math.round(eventThumb.length / 1024)}KB` : 'failed');
          } catch (e) {
            console.warn('Failed to create event thumbnail:', e);
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
            imageThumb: eventThumb  // Send thumbnail for Weekly Challenge top-5 display
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
        if (fashionShowId && fashionShowNickname) {
          try {
            // Create thumbnail for leaderboard display
            const imageThumb = await createThumbnail(imageData, 150, 0.6);
            console.log('[FashionShow] Thumbnail created:', imageThumb ? `${Math.round(imageThumb.length / 1024)}KB` : 'failed');

            await fetch(`${API_BASE}/show/${fashionShowId}/walk`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId,
                nickname: fashionShowNickname,
                emoji: fashionShowEmoji,
                score: data.scores.overall,
                verdict: data.scores.verdict || '',
                imageThumb: imageThumb // Include outfit thumbnail
              })
            })
            setFashionShowWalks(prev => prev + 1)
            console.log(`[FashionShow] Walk recorded: ${data.scores.overall} (thumb: ${imageThumb ? 'yes' : 'no'})`)
          } catch (err) {
            console.error('[FashionShow] Failed to record walk:', err)
          }
        }

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

      // Create thumbnail for event mode submissions (Weekly Challenge)
      const isProEventSubmission = eventMode && currentEvent && !fashionShowId;
      let proEventThumb = null;
      if (isProEventSubmission && imageData) {
        try {
          proEventThumb = await createThumbnail(imageData, 150, 0.6);
          console.log('[Event Pro] Thumbnail created:', proEventThumb ? `${Math.round(proEventThumb.length / 1024)}KB` : 'failed');
        } catch (e) {
          console.warn('Failed to create event thumbnail:', e);
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
          imageThumb: proEventThumb  // Send thumbnail for Weekly Challenge top-5 display
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
        eventStatus: data.eventStatus
      })

      // Refresh event status if user participated in event mode
      if (eventMode && currentEvent) {
        fetchUserEventStatus()
      }

      // If user came from a challenge link, show comparison screen first
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
      setScreen('error')
    } finally {
      setIsAnalyzing(false)
    }
  }, [mode, isPro, eventMode, currentEvent, userId, isAnalyzing, scansRemaining])





  // Generate viral share card AND trigger native share directly (1-tap share)
  const generateShareCard = useCallback(async () => {
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
        setToastMessage('Image saved! Caption copied ✅')
        setShowToast(true)
        playSound('pop')
        vibrate(20)

        // GA4 tracking
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'share', {
            method: 'download',
            content_type: 'outfit_rating',
            item_id: scores?.overall
          })
        }

        // Go to share success after a short delay
        setTimeout(() => setScreen('share-success'), 1500)
      }).catch((err) => {
        console.warn('[Share] Clipboard copy failed:', err?.message || err)
        setToastMessage('Image saved! Paste caption manually.')
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

      const { file, text, url, imageBlob } = await generateShareCardUtil({
        scores,
        shareFormat,
        uploadedImage,
        userId,
        isPro: isPro || false,
        eventContext: eventShareContext
      })

      // Store shareData for potential future use
      setShareData({ file, text, url, imageBlob })

      // Try native share directly (no intermediate screen!)
      if (navigator.share) {
        try {
          const sharePayload = {
            title: 'My FitRate Score',
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
              content_type: 'outfit_rating',
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
    switch (mode) {
      case 'savage': return '#8b00ff' // Purple
      case 'roast': return '#ff4444'  // Red
      case 'honest': return '#0077ff' // Blue
      default: return '#00d4ff'       // Cyan (Nice)
    }
  }
  const getModeGlow = () => {
    switch (mode) {
      case 'savage': return 'rgba(139,0,255,0.4)' // Purple glow
      case 'roast': return 'rgba(255,68,68,0.4)'  // Red glow
      case 'honest': return 'rgba(0,119,255,0.4)' // Blue glow
      default: return 'rgba(0,212,255,0.4)'       // Cyan glow (Nice)
    }
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
    return <RulesScreen currentEvent={currentEvent} onClose={() => setShowEventRules(false)} />
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
  // IN-APP BROWSER WARNING (Twitter/Instagram/etc)
  // ============================================
  if (inAppBrowser) {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent)
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0f] text-white"
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif" }}
      >
        <span className="text-6xl mb-6">🌐</span>
        <h2 className="text-2xl font-black mb-4 text-center">Open in Browser</h2>
        <p className="text-white/60 text-center mb-6 max-w-xs">
          FitRate works best in {isIOS ? 'Safari' : 'Chrome'}. {inAppBrowser}'s browser has limited features.
        </p>
        <div className="text-center space-y-4 w-full max-w-xs">
          <p className="text-sm text-white/40">
            Tap the menu ({isIOS ? '•••' : '⋮'}) then "Open in {isIOS ? 'Safari' : 'Browser'}"
          </p>
          <button
            onClick={() => setInAppBrowser(null)}
            className="w-full py-3 mt-4 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}
          >
            Continue Anyway (may not work)
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // EVENT EXPLAINER MODAL (First-time users)
  // ============================================
  if (showEventExplainer && currentEvent) {
    return (
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
    )
  }

  // ============================================
  // FASHION SHOW SCREENS
  // ============================================
  if (fashionShowScreen === 'create') {
    return (
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
    )
  }

  if (fashionShowScreen === 'invite') {
    return (
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
    )
  }

  if (fashionShowScreen === 'join') {
    return (
      <FashionShowJoin
        showId={fashionShowId}
        showData={fashionShowData}
        userId={userId}
        loading={fashionShowLoading}
        onJoined={(result) => {
          setFashionShowNickname(localStorage.getItem(`fashionshow_${fashionShowId}_nickname`) || 'Guest')
          setFashionShowEmoji(localStorage.getItem(`fashionshow_${fashionShowId}_emoji`) || '😎')
          addToActiveShows(fashionShowId, fashionShowData?.name || 'Fashion Show', fashionShowData?.vibe, fashionShowData?.vibeLabel) // Track in My Shows with vibe
          setFashionShowScreen('runway')
        }}
        onShowNotFound={() => {
          setFashionShowScreen(null)
          window.history.pushState({}, '', '/')
        }}
      />
    )
  }

  if (fashionShowScreen === 'runway') {
    return (
      <FashionShowRunway
        showId={fashionShowId}
        showData={fashionShowData}
        userId={userId}
        nickname={fashionShowNickname}
        emoji={fashionShowEmoji}
        isPro={isPro}
        walksUsed={fashionShowWalks}
        walksAllowed={isPro ? 3 : 1}
        onWalkRunway={() => {
          // Keep show context and trigger camera flow
          // fashionShowId and nickname stay set, so after analyze 
          // the score will be recorded to the show
          console.log('[FashionShow] Walk initiated - showId:', fashionShowId, 'nickname:', fashionShowNickname)
          setFashionShowScreen(null) // Exit show UI for camera
          setPendingFashionShowWalk(true) // Flag to auto-trigger camera
          setScreen('home')
          // Note: fashionShowId, fashionShowNickname, fashionShowEmoji stay set
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
          setFashionShowScreen(null)
          setFashionShowId(null)
          setFashionShowData(null)
          window.history.pushState({}, '', '/')
        }}
      />
    )
  }

  // ============================================
  // WEEKLY CHALLENGE SCREEN
  // ============================================
  if (screen === 'weekly-challenge') {
    return (
      <WeeklyChallengeScreen
        currentEvent={currentEvent}
        leaderboard={leaderboard}
        userEventStatus={userEventStatus}
        userId={userId}
        isPro={isPro}
        freeEventEntryUsed={freeEventEntryUsed}
        onCompete={() => {
          setEventMode(true)
          setScreen('home')
        }}
        onShowPaywall={() => setShowPaywall(true)}
        onBack={() => setScreen('home')}
      />
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
          onShowLeaderboard={() => { setShowLeaderboard(true); fetchLeaderboard(); }}
          onShowRules={() => setShowEventRules(true)}
          onShowRestore={() => setShowRestoreModal(true)}
          onError={(msg) => { setError(msg); setScreen('error'); }}
          onStartFashionShow={() => setFashionShowScreen('create')}
          onShowWeeklyChallenge={() => { fetchLeaderboard(); fetchUserEventStatus(); setScreen('weekly-challenge'); }}
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
        />
        <BottomNav
          activeTab="home"
          eventMode={eventMode}
          onNavigate={(tab) => {
            if (tab === 'gala') {
              fetchLeaderboard();
              fetchUserEventStatus();
              setScreen('weekly-challenge');
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
  // CHALLENGE RESULT SCREEN - "Who Won?"
  // ============================================
  // Safety fallback: if we have challengeScore but no scores (scan failed), redirect home
  if (screen === 'challenge-result' && challengeScore && !scores) {
    setChallengeScore(null)
    setScreen('home')
    return null
  }

  if (screen === 'challenge-result' && scores && challengeScore) {
    return (
      <ChallengeResultScreen
        userScore={scores.overall}
        challengeScore={challengeScore}
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
      />
    )
  }

  // ============================================
  // RESULTS SCREEN - The Viral Engine
  // ============================================
  if (screen === 'results' && scores) {
    return (
      <>
        <ResultsScreen
          scores={scores}
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
          onStartFashionShow={() => setScreen('fashion-create')}
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
        />
        <BottomNav
          activeTab={null}
          eventMode={eventMode}
          onNavigate={(tab) => {
            if (tab === 'home') {
              setScreen('home');
            } else if (tab === 'gala') {
              fetchLeaderboard();
              fetchUserEventStatus();
              setScreen('weekly-challenge');
            }
          }}
          onScan={() => {
            // Go home to scan again
            resetApp();
          }}
        />
      </>
    )
  }

  // ============================================
  // ERROR SCREEN
  // ============================================
  if (screen === 'error') {
    return (
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
      <ProEmailPromptScreen
        emailInput={emailInput}
        setEmailInput={setEmailInput}
        onSubmit={handleEmailSubmit}
        checking={emailChecking}
      />
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
      <PaywallScreen
        screen={screen}
        mode={mode}
        timeUntilReset={timeUntilReset}
        onShowPaywall={() => setShowPaywall(true)}
        onClose={() => setScreen('home')}
      />
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
      <ShareSuccessScreen
        mode={mode}
        setMode={setMode}
        setScreen={setScreen}
        userId={userId}
        score={scores?.overall}
        totalReferrals={totalReferrals}
      />
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
      <PaywallModal
        showPaywall={showPaywall}
        setShowPaywall={setShowPaywall}
        showDeclineOffer={showDeclineOffer}
        setShowDeclineOffer={setShowDeclineOffer}
        declineCountdown={declineCountdown}
        checkoutLoading={checkoutLoading}
        startCheckout={startCheckout}
      />
    )
  }

  // ============================================
  // LEADERBOARD MODAL
  // ============================================
  // ============================================
  // LEADERBOARD MODAL
  // ============================================
  if (showLeaderboard) {
    return (
      <LeaderboardModal
        showLeaderboard={showLeaderboard}
        setShowLeaderboard={setShowLeaderboard}
        currentEvent={currentEvent}
        leaderboard={leaderboard}
        userEventStatus={userEventStatus}
        isPro={isPro}
        upcomingEvent={upcomingEvent}
      />
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
    )
  }

  return null
}
