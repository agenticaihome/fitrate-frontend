import React, { useState, useCallback, useEffect } from 'react'
import { playSound, vibrate } from './utils/soundEffects'
import RulesModal from './components/RulesModal'
import { LIMITS, PRICES, RESETS, STRIPE_LINKS, ROUTES } from './config/constants'
import { getScoreColor, getPercentile } from './utils/scoreUtils'
import { generateShareCard as generateShareCardUtil } from './utils/shareUtils'

// Screens
import ResultsScreen from './screens/ResultsScreen'
import AnalyzingScreen from './screens/AnalyzingScreen'
import HomeScreen from './screens/HomeScreen'
import ErrorScreen from './screens/ErrorScreen'
import ProEmailPromptScreen from './screens/ProEmailPromptScreen'
import ProWelcomeScreen from './screens/ProWelcomeScreen'
import SharePreviewScreen from './screens/SharePreviewScreen'
import ShareSuccessScreen from './screens/ShareSuccessScreen'
import PaywallScreen from './screens/PaywallScreen'

// Modals
import PaywallModal from './components/modals/PaywallModal'
import LeaderboardModal from './components/modals/LeaderboardModal'

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

// Random share tips for virality
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

// ============================================
// GA4 SHARE TRACKING
// Track share events for virality analytics
// ============================================

export default function App() {
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isStandalone, setIsStandalone] = useState(false)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

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
      if (date === today) return Math.max(0, LIMITS.FREE_SCANS_DAILY - count)
    }
    return LIMITS.FREE_SCANS_DAILY
  })

  // Pro Roasts available (from referrals or $0.99 purchase)
  const [proRoasts, setProRoasts] = useState(0)

  // Analyzing screen state (must be at component level for hooks rules)


  const [shareFormat, setShareFormat] = useState('story') // 'story' = 9:16, 'feed' = 1:1
  const [showRules, setShowRules] = useState(false)
  const [showDeclineOffer, setShowDeclineOffer] = useState(false)
  const [declineCountdown, setDeclineCountdown] = useState(null) // Seconds remaining for decline offer

  const [screen, setScreen] = useState('home')
  const [showPaywall, setShowPaywall] = useState(false)
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')
  const [emailChecking, setEmailChecking] = useState(false)
  const [proEmail, setProEmail] = useState('')
  const [referralCount, setReferralCount] = useState(0)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [scores, setScores] = useState(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const [mode, setMode] = useState('nice') // 'nice', 'roast', 'honest', 'savage'
  const [timeUntilReset, setTimeUntilReset] = useState(null)
  const [shareData, setShareData] = useState(null)
  const [emailInput, setEmailInput] = useState('')
  const [error, setError] = useState(null)
  const [errorCode, setErrorCode] = useState(null) // Track API error codes for better UX

  // Weekly Event Mode state
  const [currentEvent, setCurrentEvent] = useState(null)
  const [upcomingEvent, setUpcomingEvent] = useState(null)
  const [eventMode, setEventMode] = useState(false) // Default: opt-out of event, show normal mode
  const [userEventStatus, setUserEventStatus] = useState(null)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [showEventRules, setShowEventRules] = useState(false)

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
            if (data.purchasedScans > 0) {
              setPurchasedScans(data.purchasedScans)
            }
            // Track referral progress for UI display
            if (data.totalReferrals !== undefined) {
              localStorage.setItem('fitrate_total_referrals', data.totalReferrals.toString())
            }
          }
        })
        .catch(console.error)
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
      proWeeklyDiscount: 1.99,
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

  const analyzeOutfit = useCallback(async (imageData) => {
    setScreen('analyzing')
    setError(null)
    setErrorCode(null) // Reset error code for fresh analysis

    // Optimistic check
    if (!isPro && scansRemaining <= 0) {
      setScreen('limit-reached')
      return
    }

    // Free users: call backend (routes to Gemini for real AI analysis)
    if (!isPro) {
      try {
        // Add timeout to prevent infinite loading
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000)

        // Call real AI endpoint (backend routes free users to Gemini)
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            image: imageData,
            mode,
            userId
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
          // Extract error code for better UX in ErrorScreen (was missing for free tier!)
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

        // Add virality features to real scores
        const scores = {
          ...data.scores,
          percentile: getPercentile(data.scores.overall),
          isLegendary: data.scores.overall >= 95 ? Math.random() < 0.3 : Math.random() < 0.01,
          shareTip: getRandomShareTip(),
          previousScore: lastScore // For "you improved!" messaging
        }

        // Save this score as the new lastScore
        localStorage.setItem('fitrate_last_score', data.scores.overall.toString())
        setLastScore(data.scores.overall)

        setScores(scores)
        setScreen('results')
        return
      } catch (err) {
        console.error('Analysis error:', err)
        if (err.name === 'AbortError') {
          setError("Request timed out — please try again!")
        } else {
          setError("Something went wrong — try again!")
        }
        setScreen('error')
        return
      }
    }

    // Pro users: call real AI
    try {
      // Add timeout to prevent infinite loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ image: imageData, mode, userId, eventMode: eventMode && currentEvent ? true : false }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const data = await response.json()

      if (!response.ok || !data.success) {
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

      setScores({ ...data.scores, mode, roastMode: mode === 'roast' || mode === 'savage' })

      // Refresh event status if user participated in event mode
      if (eventMode && currentEvent) {
        fetchUserEventStatus()
      }

      setScreen('results')
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
    }
  }, [mode, isPro, eventMode, currentEvent, userId])





  // Generate viral share card
  // Generate viral share card
  const generateShareCard = useCallback(async () => {
    // Satisfying feedback when generating
    playSound('share')
    vibrate(30)

    try {
      const { file, text, url, imageBlob } = await generateShareCardUtil({
        scores,
        shareFormat,
        uploadedImage,
        userId,
        isPro: isPro || false
      })

      setShareData({
        file,
        text,
        url,
        imageBlob
      })
      setScreen('share-preview')
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
  // EVENT RULES MODAL
  // ============================================
  if (showEventRules) {
    return <RulesModal event={currentEvent} onClose={() => setShowEventRules(false)} />
  }

  // ============================================
  // HOME SCREEN - Camera First, Zero Friction
  // Only show if paywall/leaderboard are NOT open (modals take priority)
  // ============================================
  if (screen === 'home' && !showPaywall && !showLeaderboard && !showRules) {
    return (
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
        onImageSelected={(img) => {
          setUploadedImage(img)
          setScreen('analyzing')
          analyzeOutfit(img)
        }}
        onShowPaywall={() => setShowPaywall(true)}
        onShowLeaderboard={() => { setShowLeaderboard(true); fetchLeaderboard(); }}
        onShowRules={() => setShowRules(true)}
        onError={(msg) => { setError(msg); setScreen('error'); }}
      />
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
      />
    )
  }

  // ============================================
  // RESULTS SCREEN - The Viral Engine
  // ============================================
  // ============================================
  // RESULTS SCREEN - The Viral Engine
  // ============================================
  if (screen === 'results' && scores) {
    return (
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
      />
    )
  }

  // ============================================
  // ERROR SCREEN
  // ============================================
  // ============================================
  // ERROR SCREEN
  // ============================================
  if (screen === 'error') {
    return (
      <ErrorScreen
        error={error}
        errorCode={errorCode}
        onReset={resetApp}
        onUpgrade={() => setShowPaywall(true)}
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

  // ============================================
  // SHARE PREVIEW SCREEN - Ultimate Share Experience
  // ============================================
  // ============================================
  // SHARE PREVIEW SCREEN
  // ============================================
  if (screen === 'share-preview' && shareData) {
    return (
      <SharePreviewScreen
        shareData={shareData}
        scores={scores}
        onShareSuccess={() => setScreen('share-success')}
        onClose={() => setScreen('results')}
        showToast={showToast}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        setShowToast={setShowToast}
      />
    )
  }


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

  return null
}
