import React, { useState, useRef, useCallback, useEffect } from 'react'
import { playSound, vibrate } from './utils/soundEffects'
import ButtonTestPage from './ButtonTestPage'

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

// Helper: Social proof percentile based on score
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

// ============================================
// IMAGE COMPRESSION UTILITY
// Resize and compress images before upload to reduce bandwidth and speed
// ============================================
const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to JPEG with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedDataUrl)
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============================================
// GA4 SHARE TRACKING
// Track share events for virality analytics
// ============================================
const trackShare = (method, contentType = 'outfit_rating', score = null) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'share', {
      method: method,
      content_type: contentType,
      item_id: score ? `score_${score}` : 'unknown'
    })
  }
}

export default function App() {
  // Check for button test page
  const urlParams = new URLSearchParams(window.location.search)
  if (urlParams.get('test') === 'buttons') {
    return <ButtonTestPage />
  }

  const [screen, setScreen] = useState('home')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [scores, setScores] = useState(null)
  const [shareData, setShareData] = useState(null)
  const [mode, setMode] = useState('nice') // 'nice', 'honest', or 'roast'
  const [error, setError] = useState(null)
  const [displayedScore, setDisplayedScore] = useState(0)
  const [showPaywall, setShowPaywall] = useState(false)
  const [showDeclineOffer, setShowDeclineOffer] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [revealStage, setRevealStage] = useState(0)
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')
  const [proEmail, setProEmail] = useState(() => localStorage.getItem('fitrate_email') || '')
  const [emailInput, setEmailInput] = useState('')
  const [emailChecking, setEmailChecking] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isStandalone, setIsStandalone] = useState(false)

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
      if (date === today) return Math.max(0, 2 - count)  // Changed to 2 free/day
    }
    return 2  // 2 free scans per day
  })

  // Pro Roasts available (from referrals or $0.99 purchase)
  const [proRoasts, setProRoasts] = useState(0)

  // Analyzing screen state (must be at component level for hooks rules)
  const [analysisText, setAnalysisText] = useState(0)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraError, setCameraError] = useState(null)
  const [countdown, setCountdown] = useState(null) // null = no timer, 3/2/1 = counting
  const [facingMode, setFacingMode] = useState('environment') // 'environment' = rear, 'user' = front
  const [shareFormat, setShareFormat] = useState('story') // 'story' = 9:16, 'feed' = 1:1
  const [declineCountdown, setDeclineCountdown] = useState(null) // Seconds remaining for decline offer

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

      // If after 8 seconds we still are not pro, then show the email prompt as fallback
      setTimeout(() => {
        if (localStorage.getItem('fitrate_pro') !== 'true') {
          setScreen('pro-email-prompt');
        } else {
          setScreen('pro-welcome');
        }
      }, 8000);
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

  // Stripe Payment Links
  const STRIPE_LINKS = {
    proWeekly: 'https://buy.stripe.com/5kQ28tdxm3gD6HlgDxfYY02',        // $2.99/week
    proWeeklyDiscount: 'https://buy.stripe.com/8x214p2SI8AX8PtfztfYY03', // $1.99/week (decline offer)
    proRoast: 'https://buy.stripe.com/3cI9AVgJy7wT3v9gDxfYY01',         // $0.99 one-time
    // Scan Packs (one-time)
    starterPack: 'https://buy.stripe.com/aFa7sN1OEeZl0iXbjdfYY04',      // 5 scans - $1.99
    popularPack: 'https://buy.stripe.com/5kQ4gBfFu9F1ghVfztfYY05',      // 15 scans - $3.99
    powerPack: 'https://buy.stripe.com/4gMaEZ1OEeZlc1FcnhfYY06'         // 50 scans - $9.99
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

  // Sequential reveal animation
  useEffect(() => {
    if (screen === 'results' && scores) {
      setRevealStage(0)
      setDisplayedScore(0)

      // Score counting animation
      const duration = 1200
      const start = Date.now()
      const endScore = scores.overall

      const animateScore = () => {
        const now = Date.now()
        const elapsed = now - start
        const progress = Math.min(elapsed / duration, 1)

        // Easing function (easeOutExpo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const currentScore = Math.floor(easeProgress * endScore)

        setDisplayedScore(currentScore)

        if (progress < 1) {
          requestAnimationFrame(animateScore)
        }
      }

      const timers = [
        setTimeout(() => setRevealStage(1), 200),  // Verdict
        setTimeout(() => {
          setRevealStage(2)
          animateScore()
        }, 600),  // Score start
        setTimeout(() => setRevealStage(3), 1000), // Aesthetic/Celeb
        setTimeout(() => setRevealStage(4), 1300), // Tip
        setTimeout(() => setRevealStage(5), 1600), // Breakdown
        setTimeout(() => setRevealStage(6), 2000), // Share button
      ]
      // Vibrate on reveal if available
      if (navigator.vibrate) {
        setTimeout(() => navigator.vibrate(50), 600)
      }
      return () => timers.forEach(t => clearTimeout(t))
    }
  }, [screen, scores])

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
    setScansRemaining(Math.max(0, 2 - count))  // Changed to 2 free/day
  }

  const analyzeOutfit = useCallback(async (imageData) => {
    setScreen('analyzing')
    setError(null)

    // Optimistic check
    if (!isPro && scansRemaining <= 0) {
      setScreen('limit-reached')
      return
    }

    // Free users: call backend (routes to Gemini for real AI analysis)
    if (!isPro) {
      try {
        // Call real AI endpoint (backend routes free users to Gemini)
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: getApiHeaders(),
          body: JSON.stringify({
            image: imageData,
            mode,
            userId
          })
        })

        const data = await response.json()

        // Check if rate limited
        if (response.status === 429 || data.limitReached) {
          setScansRemaining(0)
          setScreen('limit-reached')
          return
        }

        if (!data.success) {
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
        setAnalysisProgress(100)
        setScreen('results')
        return
      } catch (err) {
        console.error('Analysis error:', err)
        setError("Something went wrong — try again!")
        setScreen('error')
        return
      }
    }

    // Pro users: call real AI
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ image: imageData, mode })
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
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
      setAnalysisProgress(100)
      setScreen('results')
    } catch (err) {
      console.error('Analysis error:', err)
      setError("Something went wrong — try again!")
      setScreen('error')
    }
  }, [mode, isPro, generateMockScores])

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // Prevent double-uploading
      if (screen === 'analyzing') return

      if (file.size > 10 * 1024 * 1024) {
        setError('Image is too large. Please try a smaller photo.')
        setScreen('error')
        return
      }

      playSound('shutter')
      vibrate(50)

      try {
        // Compress image if larger than 500KB
        let imageData
        if (file.size > 500 * 1024) {
          // Large file - compress it
          imageData = await compressImage(file, 1200, 0.7)
        } else {
          // Small file - read directly
          imageData = await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => resolve(e.target.result)
            reader.onerror = reject
            reader.readAsDataURL(file)
          })
        }

        setUploadedImage(imageData)
        analyzeOutfit(imageData)
      } catch (err) {
        console.error('Image processing error:', err)
        setError('Something went wrong — try again!')
        setScreen('error')
      }
    }
  }, [analyzeOutfit, screen])

  // Reveal Sequence & Sounds
  useEffect(() => {
    if (screen === 'results' && scores) {
      setRevealStage(0)

      // Stage 1: Verdict (Instant)
      const sound = scores.isLegendary ? 'legendary' : (scores.roastMode ? 'roast' : 'success')
      setTimeout(() => {
        playSound(sound)
        vibrate(scores.isLegendary ? [100, 50, 100, 50, 200] : (scores.roastMode ? [50, 50, 200] : [50, 50, 50]))
        setRevealStage(1)
      }, 100)

      // Stage 2: Photo
      setTimeout(() => {
        playSound('pop')
        vibrate(10)
        setRevealStage(2)
      }, 600)

      // Stage 3: Details
      setTimeout(() => {
        playSound('pop')
        setRevealStage(3)
      }, 1000)

      // Stage 4: Tip
      setTimeout(() => {
        setRevealStage(4)
      }, 1400)

      // Stage 5: Breakdown
      setTimeout(() => {
        setRevealStage(5)
      }, 1800)
    }
  }, [screen, scores])

  // Generate viral share card
  const generateShareCard = useCallback(async () => {
    // Satisfying feedback when generating
    playSound('share')
    vibrate(30)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Dynamic dimensions based on format
    const isSquare = shareFormat === 'feed'
    canvas.width = 1080
    canvas.height = isSquare ? 1080 : 1920

    // Determine viral caption based on score and mode
    const getViralCaption = () => {
      if (scores.roastMode) {
        if (scores.overall < 30) return "I got DESTROYED 💀💀💀"
        if (scores.overall < 45) return "AI showed no mercy 💀"
        if (scores.overall < 60) return "AI humbled me 💀 Your turn?"
        return "Survived Roast Mode 😏"
      } else if (scores.mode === 'honest') {
        if (scores.overall >= 90) return `${scores.overall}/100 — Honest mode approved 📊`
        if (scores.overall >= 75) return `Real talk: ${scores.overall}/100 📊`
        if (scores.overall >= 60) return `Honest score: ${scores.overall} — thoughts? 📊`
        return `Got my honest rating 📊 Your turn?`
      } else {
        if (scores.overall >= 95) return `${scores.overall}/100 — I'm literally perfect 💅`
        if (scores.overall >= 90) return `${scores.overall}/100 — beat that 🏆`
        if (scores.overall >= 80) return "AI approved ✨ What's yours?"
        if (scores.overall >= 70) return "Pretty good 👀 Can you beat it?"
        return "Your turn 👀"
      }
    }

    // Smart hashtags based on mode and score
    const getHashtags = () => {
      const base = '#FitRate #RateMyFit'
      if (scores.roastMode) {
        if (scores.overall < 40) return `${base} #Destroyed #AIRoast`
        return `${base} #RoastMode #AIRoast`
      }
      if (scores.mode === 'honest') {
        return `${base} #HonestRating #RealTalk`
      }
      if (scores.overall >= 95) return `${base} #Perfect #FitCheck`
      if (scores.overall >= 90) return `${base} #FitCheck #OOTD`
      if (scores.overall >= 80) return `${base} #FitRateChallenge`
      return `${base} #FitCheck`
    }
    const hashtags = getHashtags()
    const viralCaption = getViralCaption()
    // Mode-specific colors
    const getModeAccent = () => {
      if (scores.roastMode) return { mid: '#2a1a1a', glow: 'rgba(255,68,68,0.4)', accent: '#ff4444', light: '#ff6666' }
      if (scores.mode === 'honest') return { mid: '#1a1a2a', glow: 'rgba(74,144,217,0.4)', accent: '#4A90D9', light: '#6BA8E8' }
      return { mid: '#1a1a2e', glow: 'rgba(0,212,255,0.4)', accent: '#00d4ff', light: '#00ff88' }
    }
    const modeColors = getModeAccent()
    const isProCard = isPro || scores.savageLevel

    // Load user image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve) => {
      img.onload = resolve
      img.onerror = resolve
      img.src = uploadedImage
    })

    // SIMPLE DARK GRADIENT BACKGROUND (single image approach)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    bgGradient.addColorStop(0, '#0a0a15')
    bgGradient.addColorStop(0.3, '#0f0f1a')
    bgGradient.addColorStop(0.7, '#0f0f1a')
    bgGradient.addColorStop(1, '#0a0a15')
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Subtle accent glow at top
    const accentGlow = ctx.createRadialGradient(540, 200, 0, 540, 200, 600)
    accentGlow.addColorStop(0, modeColors.glow)
    accentGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = accentGlow
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Format-aware dimensions
    const cardHeight = isSquare ? 840 : 1540
    const cardY = isSquare ? 60 : 120
    const borderHeight = isSquare ? 1020 : 1860
    const innerBorderHeight = isSquare ? 1000 : 1840

    // PRO SPARKLE BORDER - Gold glow for Pro users
    if (isProCard) {
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 40
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.roundRect(30, 30, 1020, borderHeight, 40)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Inner sparkle line
      ctx.strokeStyle = 'rgba(255,215,0,0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(40, 40, 1000, innerBorderHeight, 36)
      ctx.stroke()
    }

    // Mode-specific card accent
    const cardGlow = isProCard ? 'rgba(255,215,0,0.2)' : modeColors.glow
    ctx.shadowColor = cardGlow
    ctx.shadowBlur = 100
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.beginPath()
    ctx.roundRect(60, cardY, 960, cardHeight, 48)
    ctx.fill()
    ctx.shadowBlur = 0

    // Border
    ctx.strokeStyle = isProCard ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.1)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw photo with rounded corners - FIXED for both formats
    // Use cover-style scaling (fills container, may crop)
    const imgWidth = isSquare ? 400 : 580
    const imgHeight = isSquare ? 400 : 720
    const imgX = (1080 - imgWidth) / 2
    const imgY = isSquare ? 90 : 180

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 28)
    ctx.clip()

    // Calculate cover scaling - maintains aspect ratio, fills container
    const imgAspect = img.width / img.height
    const targetAspect = imgWidth / imgHeight
    let drawWidth, drawHeight, drawX, drawY

    if (imgAspect > targetAspect) {
      // Image is wider - fit to height, center horizontally
      drawHeight = imgHeight
      drawWidth = imgHeight * imgAspect
      drawX = imgX + (imgWidth - drawWidth) / 2
      drawY = imgY
    } else {
      // Image is taller - fit to width, center vertically
      drawWidth = imgWidth
      drawHeight = imgWidth / imgAspect
      drawX = imgX
      drawY = imgY + (imgHeight - drawHeight) / 2
    }

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()

    // Score circle with glow - POSITION SCALED
    const scoreY = isSquare ? 660 : 980
    const scoreColor = scores.overall >= 80 ? '#00ff88' : scores.overall >= 60 ? '#00d4ff' : '#ff4444'
    ctx.shadowColor = scoreColor
    ctx.shadowBlur = 40
    ctx.beginPath()
    ctx.arc(540, scoreY, isSquare ? 80 : 100, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.fill()
    ctx.strokeStyle = scoreColor
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    // PREMIUM BRANDING - "FITRATE AI" Seal
    ctx.save()
    ctx.fillStyle = '#fff'
    ctx.font = 'black 28px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.letterSpacing = '12px'
    ctx.globalAlpha = 0.8
    ctx.fillText('FITRATE AI', 540, 80)
    ctx.restore()

    // CONVERSATION STAMP - Replaces the old "Certified" seal for maximum engagement
    ctx.save()
    const stampX = isSquare ? 880 : 920
    const stampY = isSquare ? 120 : 180
    // Dynamic Stamp Text & Color
    let stampText = "AGREE?"
    let stampColor = '#fff'
    if (scores.mode === 'roast' || scores.mode === 'savage') {
      stampText = scores.overall < 50 ? "COOKED?" : "SURVIVED?"
      stampColor = '#ff4444'
    } else {
      stampText = scores.overall >= 90 ? "VALID?" : "ROBBED?"
      stampColor = scores.overall >= 90 ? '#ffd700' : '#ff8800'
    }

    ctx.translate(stampX, stampY)
    ctx.rotate(15 * Math.PI / 180) // Slight tilt

    // Stamp Box
    ctx.fillStyle = stampColor
    ctx.shadowColor = 'rgba(0,0,0,0.5)'
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.roundRect(-70, -30, 140, 60, 10)
    ctx.fill()

    // Stamp Text
    ctx.fillStyle = '#000'
    ctx.font = 'black 24px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(stampText, 0, 2)
    ctx.restore()

    // PRO BADGE - Gold banner for Pro users or purchased scans
    if (isPro || scores.savageLevel) {
      // Gold gradient badge background
      const badgeWidth = 220
      const badgeHeight = 40
      const badgeX = (1080 - badgeWidth) / 2
      const badgeY = isSquare ? 600 : 915

      const goldGradient = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeWidth, badgeY)
      goldGradient.addColorStop(0, '#ffd700')
      goldGradient.addColorStop(1, '#ff8c00')

      ctx.fillStyle = goldGradient
      ctx.beginPath()
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 18)
      ctx.fill()

      // Badge text
      ctx.fillStyle = '#000'
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⚡ PRO ANALYSIS', 540, isSquare ? 627 : 942)
    }

    // Score number - BIG (centered in circle)
    ctx.fillStyle = scoreColor
    ctx.font = `bold ${isSquare ? 70 : 90}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(scores.overall, 540, scoreY)
    ctx.textBaseline = 'alphabetic' // Reset for other text

    // "/ 100" below score
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = `bold ${isSquare ? 24 : 32}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillText('/ 100', 540, scoreY + (isSquare ? 70 : 90))

    // Verdict - HUGE and punchy (positioned based on format)
    const verdictY = isSquare ? 780 : 1140
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${isSquare ? 36 : 46}px -apple-system, BlinkMacSystemFont, sans-serif`
    // Word wrap for long verdicts
    const maxWidth = isSquare ? 800 : 900
    const verdictLines = wrapText(ctx, scores.verdict, maxWidth)
    verdictLines.forEach((line, i) => {
      ctx.fillText(line, 540, verdictY + (i * (isSquare ? 42 : 52)))
    })

    // The Two Lines - Viral Context
    if (scores.lines && scores.lines.length >= 2) {
      const lineY = verdictY + (verdictLines.length * (isSquare ? 42 : 52)) + 30
      ctx.font = `italic ${isSquare ? 26 : 32}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(`"${scores.lines[0]}"`, 540, lineY)
      ctx.fillText(`"${scores.lines[1]}"`, 540, lineY + (isSquare ? 38 : 48))
    }

    // The Tagline Pill
    const taglineY = isSquare ? 920 : 1380
    ctx.font = `bold ${isSquare ? 22 : 28}px -apple-system, BlinkMacSystemFont, sans-serif`
    const taglineText = (scores.tagline || 'NO NOTES').toUpperCase()
    const taglineWidth = ctx.measureText(taglineText).width + 60

    ctx.fillStyle = 'rgba(255,255,255,0.05)'
    ctx.beginPath()
    ctx.roundRect(540 - taglineWidth / 2, taglineY - 35, taglineWidth, 54, 27)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255,255,255,0.1)'
    ctx.stroke()

    ctx.fillStyle = scoreColor
    ctx.fillText(taglineText, 540, taglineY + 3)

    // --- RE-ADDED STUFF ---
    // Sub-scores row (Color / Fit / Style)
    const subScoreY = isSquare ? 980 : 1450
    if (scores.color !== undefined) {
      const subScores = [
        { label: 'Color', score: scores.color },
        { label: 'Fit', score: scores.fit },
        { label: 'Style', score: scores.style }
      ]
      ctx.font = `bold ${isSquare ? 16 : 22}px -apple-system, BlinkMacSystemFont, sans-serif`
      subScores.forEach((sub, i) => {
        const x = 340 + (i * 200)
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillText(sub.label.toUpperCase(), x, subScoreY)
        ctx.fillStyle = getScoreColor(sub.score)
        ctx.fillText(sub.score.toString(), x, subScoreY + (isSquare ? 25 : 32))
      })
    }

    // Aesthetic + Celeb match pill
    const pillY = subScoreY + (isSquare ? 60 : 80)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath()
    ctx.roundRect(180, pillY, 720, isSquare ? 44 : 54, 27)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${isSquare ? 18 : 24}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillText(`${scores.aesthetic} • ${scores.celebMatch}`, 540, pillY + (isSquare ? 28 : 36))

    // PRO EXCLUSIVE: Savage Meter + Item Roast
    if (isProCard && scores.savageLevel) {
      const proY = pillY + (isSquare ? 70 : 100)
      ctx.font = `bold ${isSquare ? 14 : 18}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillStyle = '#ff4444'
      ctx.fillText(`SAVAGE LEVEL: ${scores.savageLevel}/10 🔥`, 540, proY - 10)

      if (scores.itemRoasts) {
        const roast = scores.itemRoasts.shoes || scores.itemRoasts.top || "No notes."
        ctx.font = `italic ${isSquare ? 16 : 20}px -apple-system, BlinkMacSystemFont, sans-serif`
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText(`"${roast}"`, 540, proY + 25)
      }
    }
    // -----------------------

    // PRO TIP (If applicable)
    if (isProCard && scores.proTip) {
      const tipY = taglineY + (isSquare ? 80 : 120)
      ctx.fillStyle = 'rgba(0,212,255,0.1)'
      ctx.beginPath()
      ctx.roundRect(140, tipY - 40, 800, 64, 32)
      ctx.fill()
      ctx.fillStyle = '#00d4ff'
      ctx.font = `bold ${isSquare ? 20 : 26}px -apple-system, BlinkMacSystemFont, sans-serif`
      ctx.fillText(`💡 PRO TIP: ${scores.proTip}`, 540, tipY + 4)
    }

    // SOCIAL PROOF - Percentile on card
    ctx.font = `bold ${isSquare ? 20 : 26}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.textAlign = 'center'
    ctx.fillText(`TOP ${100 - scores.percentile}% OF ALL FITS TODAY`, 540, isSquare ? 1040 : 1810)

    // Branding Footer - Strong CTA for Viral Re-scans
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.font = `bold ${isSquare ? 16 : 22}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillText('TRY IT FREE @ FITRATE.APP', 540, isSquare ? 1075 : 1870)

    // Generate Conversation-Starter Share Text
    const getShareText = () => {
      const baseUrl = 'https://fitrate.app'
      const link = `${baseUrl}?ref=${userId}`

      // Roast / Savage Strategy: Disagreement & Shock
      if (scores.roastMode || scores.mode === 'savage') {
        if (scores.overall < 35) return `FitRate gave me a ${scores.overall}/100. Is it really that bad? 💀 ${link}`
        if (scores.overall < 60) return `They said I have NPC energy. Agree or disagree? 👇 ${link}`
        return `Rated ${scores.overall}/100. Be honest... am I cooked? 🍳 ${link}`
      }

      // Nice / Honest Strategy: Validation & "Robbed" Debate
      if (scores.mode === 'honest') {
        if (scores.overall < 70) return `Honest mode gave me ${scores.overall}. I feel robbed. Thoughts? 🤨 ${link}`
        return `Got a ${scores.overall}/100 honestly. Accurate? 📊 ${link}`
      }

      // High Scores Strategy: Humble Brag / Challenge
      if (scores.overall >= 90) return `FitRate says ${scores.overall}/100. Can anyone beat this? 🏆 ${link}`
      if (scores.overall >= 80) return `Rated ${scores.overall}/100. Valid or glazed? 👀 ${link}`

      // Default / Low-Mid Nice
      return `Got rated ${scores.overall}/100 on FitRate. Thoughts? 👇 ${link}`
    }

    // Convert and share
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'fitrate-score.png', { type: 'image/png' })
      const text = getShareText()
      const url = `https://fitrate.app?ref=${userId}`

      setShareData({
        file,
        text,
        url,
        imageBlob: blob // Keep blob for downloading
      })
      setScreen('share-preview')

    }, 'image/png')
  }, [uploadedImage, scores, userId, shareFormat])

  // Helper: wrap text
  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ')
    const lines = []
    let currentLine = ''

    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    })
    if (currentLine) lines.push(currentLine)
    return lines
  }

  const downloadImage = (blob, shareText) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fitrate-score.png'
    a.click()
    URL.revokeObjectURL(url)
    // Copy caption to clipboard for desktop users
    if (shareText && navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
    }
  }

  // Camera functions for live webcam capture
  const startCamera = useCallback(async (facing = facingMode) => {
    setCameraError(null)
    // Stop any existing stream first
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing
          // Let browser choose best resolution - prevent zoom/crop issues
        },
        audio: false
      })
      setCameraStream(stream)
      setFacingMode(facing)
      setScreen('camera')

      // Connect stream to video element after screen renders
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      }, 100)
    } catch (err) {
      console.error('Camera error:', err)
      // Camera not available - fall back to file picker
      setCameraError(err.message)
      fileInputRef.current?.click()
    }
  }, [facingMode, cameraStream])

  const flipCamera = useCallback(() => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment'
    startCamera(newFacing)
  }, [facingMode, startCamera])

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }, [cameraStream])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas ref not available')
      return
    }

    const video = videoRef.current

    // Check if video is ready
    if (video.readyState < 2) {
      console.error('Video not ready yet')
      return
    }

    playSound('shutter')
    vibrate(50)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas (flip for front camera to match preview)
    if (facingMode === 'user') {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9)

    // Stop camera and analyze
    stopCamera()
    setCountdown(null)
    setUploadedImage(imageData)
    analyzeOutfit(imageData)
  }, [stopCamera, analyzeOutfit, facingMode])

  // Timer capture - 3 second countdown then capture
  const timerCapture = useCallback(() => {
    if (countdown !== null) return // Already counting

    playSound('tick')
    vibrate(20)
    setCountdown(3)

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) {
          clearInterval(timer)
          return null
        }
        if (prev <= 1) {
          clearInterval(timer)
          setTimeout(() => capturePhoto(), 100)
          return null
        }
        playSound('tick')
        vibrate(20)
        return prev - 1
      })
    }, 1000)
  }, [countdown, capturePhoto])

  const resetApp = useCallback(() => {
    stopCamera()
    setScreen('home')
    setUploadedImage(null)
    setScores(null)
    setError(null)
    setRevealStage(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [stopCamera])

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
  const getModeGradientEnd = () => {
    switch (mode) {
      case 'savage': return '#ff0044' // Dark red
      case 'roast': return '#ff8800'  // Orange
      case 'honest': return '#00d4ff' // Cyan
      default: return '#00ff88'       // Green (Nice)
    }
  }
  const accent = getModeColor()
  const accentGlow = getModeGlow()
  const accentEnd = getModeGradientEnd()

  // Analysis messages for analyzing screen - High-status dopamine feedback
  const analysisMessages = mode === 'savage'
    ? ['Preparing total destruction...', 'Loading maximum violence...', 'Calculating devastation...', 'Arming nuclear roasts...', 'Deploying fashion death....']
    : mode === 'roast'
      ? ['Synthesizing social suicide...', 'Detecting fabric failure...', 'Calculating ego damage...', 'Calibrating savagery...', 'Finalizing the damage...']
      : mode === 'honest'
        ? ['Analyzing social positioning...', 'Calculating wardrobe ROI...', 'Synthesizing aesthetic metrics...', 'Detecting style efficiency...', 'Finalizing objective data...']
        : ['Detecting main character signal...', 'Optimizing social ROI...', 'Synthesizing aesthetic value...', 'Calculating aura level...', 'Finalizing the flex...']

  // Progress and text animation effect for analyzing screen
  // IMPORTANT: This must be BEFORE any early returns to avoid hooks order issues
  useEffect(() => {
    if (screen !== 'analyzing') return

    // Reset progress when entering analyzing screen
    setAnalysisProgress(0)
    setAnalysisText(0)

    // Progress animation (0-90 over ~8-10s, caps at 90% until API responds)
    const progressInterval = setInterval(() => {
      setAnalysisProgress(p => {
        if (p >= 90) return 90  // Cap at 90%, API response will complete it
        // Slow ramp: 0.5-2% per tick for realistic ~10s duration
        const increment = Math.random() * 1.5 + 0.5
        const next = p + increment
        if (p < 50 && next >= 50) {
          vibrate(20)
        }
        if (p < 80 && next >= 80) {
          vibrate(30)
          playSound('tick')
        }
        return Math.min(90, next)
      })
    }, 200)  // Slower interval: 200ms instead of 100ms

    // Rotating text (slightly slower)
    const textInterval = setInterval(() => {
      setAnalysisText(t => (t + 1) % 5)
    }, 1200)  // 1.2s instead of 0.6s for more readable messages

    return () => {
      clearInterval(progressInterval)
      clearInterval(textInterval)
    }
  }, [screen])

  // ============================================
  // CAMERA SCREEN - Full screen live camera
  // ============================================
  if (screen === 'camera') {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col" style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Live camera preview */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
        />

        {/* Top bar - Mode indicator & buttons */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-4">
          {/* Mode indicator */}
          <div className="px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
            <span className="text-white text-sm font-medium">
              {mode === 'roast' ? '🔥 Roast' : mode === 'honest' ? '📊 Honest' : '✨ Nice'}
            </span>
          </div>

          {/* Top right buttons */}
          <div className="flex items-center gap-2">
            {/* Flip camera button */}
            <button
              onClick={() => {
                playSound('click')
                vibrate(15)
                flipCamera()
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm active:scale-95"
              aria-label="Flip camera"
            >
              <span className="text-white text-lg">🔄</span>
            </button>

            {/* Gallery button */}
            <button
              onClick={() => {
                playSound('click')
                vibrate(15)
                stopCamera()
                setScreen('home')
                setTimeout(() => fileInputRef.current?.click(), 100)
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm active:scale-95"
              aria-label="Open gallery"
            >
              <span className="text-white text-lg">🖼️</span>
            </button>
          </div>
        </div>

        {/* Spacer to push controls to bottom */}
        <div className="flex-1" />

        {/* Bottom controls */}
        <div className="relative z-10 pb-6">
          <div className="flex items-center justify-center gap-6 py-4" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)'
          }}>
            {/* Cancel button */}
            <button
              onClick={() => {
                playSound('click')
                vibrate(15)
                stopCamera()
                setCountdown(null)
                setScreen('home')
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95"
              aria-label="Cancel and go back"
            >
              <span className="text-white text-xl">✕</span>
            </button>

            {/* Capture button - BIG */}
            <button
              onClick={() => {
                playSound('click')
                vibrate(30)
                capturePhoto()
              }}
              disabled={countdown !== null}
              className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                boxShadow: '0 0 30px rgba(0,212,255,0.5)',
                border: '4px solid white'
              }}
              aria-label="Capture photo"
            >
              <span className="text-3xl">📸</span>
            </button>

            {/* Timer button */}
            <button
              onClick={() => {
                playSound('click')
                vibrate(20)
                timerCapture()
              }}
              disabled={countdown !== null}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 disabled:opacity-50"
              aria-label="3 second countdown timer"
            >
              <span className="text-white text-lg">⏱️</span>
            </button>
          </div>
        </div>

        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-8xl font-black text-white" style={{
              textShadow: '0 0 40px rgba(0,212,255,0.8), 0 0 80px rgba(0,212,255,0.5)',
              animation: 'pulse 0.5s ease-in-out'
            }}>
              {countdown}
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // ============================================
  // PAYWALL MODAL - Check FIRST before home screen
  // (The full paywall UI is defined later, but we check the condition here)
  // ============================================
  // NOTE: The paywall modal code block was at line 2928 but screens return early
  // So we need a way to make paywall take priority. We'll do this by NOT
  // returning from home screen if showPaywall is true - instead show paywall inline.

  // ============================================
  // HOME SCREEN - Camera First, Zero Friction
  // Only show if paywall is NOT open (paywall takes priority)
  // ============================================
  if (screen === 'home' && !showPaywall) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
      }}>
        {/* Subtle animated background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-[500px] h-[500px] rounded-full opacity-20" style={{
            background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            animation: 'pulse 4s ease-in-out infinite'
          }} />
        </div>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-60 animate-bounce" style={{
            background: 'rgba(0,255,136,0.9)',
            boxShadow: '0 4px 20px rgba(0,255,136,0.4)'
          }}>
            <span className="text-black font-bold text-sm">{toastMessage}</span>
          </div>
        )}

        {/* Mobile camera input (uses native camera app) */}
        <input type="file" accept="image/*" capture="environment" id="mobileCameraInput" onChange={handleFileUpload} className="hidden" />

        {/* Desktop/gallery file input */}
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Pro Badge - Only indicator kept */}
        {isPro && (
          <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full" style={{
            background: 'rgba(0,255,136,0.15)',
            border: '1px solid rgba(0,255,136,0.3)'
          }}>
            <span className="text-xs font-bold" style={{ color: '#00ff88' }}>⚡ PRO</span>
          </div>
        )}

        {/* Logo - Small and subtle */}
        <h1 className="text-3xl font-black mb-1 tracking-tight" style={{
          background: `linear-gradient(135deg, #fff 0%, ${accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>FITRATE</h1>

        <p className="text-sm mb-2 tracking-wide font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Your AI style coach
        </p>
        <p className="text-xs mb-6 tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Snap a photo • Get instant feedback • Have fun
        </p>

        {/* Challenge Banner - when friend shared a challenge link */}
        {challengeScore && (
          <div className="mb-8 px-6 py-4 rounded-2xl text-center" style={{
            background: 'linear-gradient(135deg, rgba(255,68,68,0.2) 0%, rgba(255,136,0,0.2) 100%)',
            border: '1px solid rgba(255,136,0,0.4)'
          }}>
            <p className="text-2xl font-black text-white mb-1">👊 Beat {challengeScore}?</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Your friend scored {challengeScore}/100 — can you do better?
            </p>
          </div>
        )}

        {/* STREAK PILL - Soft Loop Retention */}
        {dailyStreak > 0 && (
          <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 shadow-[0_0_20px_rgba(255,165,0,0.1)]">
              <span className="text-sm">🔥</span>
              <span className="text-xs font-black text-orange-400 uppercase tracking-widest">{dailyStreak} DAY STREAK</span>
            </div>
          </div>
        )}

        {/* HERO CTA - Central path of least resistance */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <button
            onClick={() => {
              playSound('click')
              vibrate(20)
              if (scansRemaining > 0 || isPro || purchasedScans > 0) {
                const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
                if (isMobile) {
                  document.getElementById('mobileCameraInput')?.click()
                } else {
                  startCamera()
                }
              } else {
                setShowPaywall(true)
              }
            }}
            className="btn-physical relative w-72 h-72 rounded-full flex flex-col items-center justify-center group"
            style={{
              background: `radial-gradient(circle, ${getModeGlow()} 0%, transparent 70%)`,
              border: `3px solid ${accent}99`,
              boxShadow: `var(--shadow-physical), 0 0 100px ${accentGlow}, inset 0 0 80px rgba(255,255,255,0.03)`,
              opacity: (scansRemaining === 0 && !isPro && purchasedScans === 0) ? 0.6 : 1
            }}
          >
            {/* Pulsing inner glow */}
            <div className="absolute inset-4 rounded-full transition-all duration-300 group-hover:scale-105 group-active:scale-95" style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${accentEnd} 100%)`,
              boxShadow: `0 0 60px ${accentGlow}`,
              animation: 'pulse 2s ease-in-out infinite'
            }} />

            {/* Icon */}
            <span className="relative text-8xl mb-4 drop-shadow-2xl">
              {mode === 'roast' ? '🔥' : mode === 'savage' ? '💀' : mode === 'honest' ? '📊' : '📸'}
            </span>
            <span className="relative text-white text-2xl font-black tracking-widest uppercase">
              {mode === 'roast' ? 'ROAST MY FIT' : mode === 'savage' ? 'DESTROY MY FIT' : mode === 'honest' ? 'ANALYZE FIT' : 'RATE MY FIT'}
            </span>

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <p className="text-[12px] font-black text-white/50 uppercase tracking-[0.15em] animate-pulse">Tap to Start</p>
            </div>
          </button>
        </div>

        {/* MODE SELECTOR - 2x2 Grid: Free on top, Pro on bottom */}
        <div className="mt-6 mb-10 grid grid-cols-2 gap-2 p-2 rounded-2xl" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {/* TOP ROW: FREE MODES */}
          {/* Nice Mode */}
          <button
            onClick={() => {
              playSound('click')
              vibrate(15)
              setMode('nice')
            }}
            className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 active:scale-[0.97] ${mode === 'nice' ? 'opacity-100' : 'opacity-60'}`}
            style={{
              background: mode === 'nice' ? 'rgba(0,212,255,0.25)' : 'rgba(255,255,255,0.05)',
              border: mode === 'nice' ? '1px solid #00d4ff' : '1px solid transparent'
            }}
          >
            <span className={`text-base transition-opacity ${mode === 'nice' ? 'opacity-100' : 'opacity-50'}`}>😇</span>
            <span className={`text-sm font-medium transition-opacity ${mode === 'nice' ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>Nice</span>
          </button>

          {/* Roast Mode */}
          <button
            onClick={() => {
              playSound('click')
              vibrate(15)
              setMode('roast')
            }}
            className={`flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 active:scale-[0.97] ${mode === 'roast' ? 'opacity-100' : 'opacity-60'}`}
            style={{
              background: mode === 'roast' ? 'rgba(255,68,68,0.25)' : 'rgba(255,255,255,0.05)',
              border: mode === 'roast' ? '1px solid #ff4444' : '1px solid transparent'
            }}
          >
            <span className={`text-base transition-opacity ${mode === 'roast' ? 'opacity-100' : 'opacity-50'}`}>😈</span>
            <span className={`text-sm font-medium transition-opacity ${mode === 'roast' ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>Roast</span>
          </button>

          {/* BOTTOM ROW: PRO MODES */}
          {/* Honest Mode */}
          <button
            onClick={() => {
              playSound('click')
              vibrate(15)
              if (isPro) {
                setMode('honest')
              } else {
                setShowPaywall(true)
              }
            }}
            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'honest' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
            style={{
              background: mode === 'honest' && isPro ? 'rgba(74,144,217,0.25)' : 'rgba(74,144,217,0.1)',
              border: mode === 'honest' && isPro ? '1px solid #4A90D9' : '1px dashed rgba(74,144,217,0.4)'
            }}
          >
            <span className={`text-base ${mode === 'honest' && isPro ? 'opacity-100' : 'opacity-50'}`}>📊</span>
            <span className={`text-sm font-medium ${mode === 'honest' && isPro ? 'text-white' : 'text-gray-400'}`}>Honest</span>
            {!isPro && <span className="text-[8px] ml-1 text-yellow-400 font-bold">PRO</span>}
          </button>

          {/* Savage Mode */}
          <button
            onClick={() => {
              playSound('click')
              vibrate(15)
              if (isPro) {
                setMode('savage')
              } else {
                setShowPaywall(true)
              }
            }}
            className={`relative flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-100 ${isPro ? (mode === 'savage' ? 'opacity-100' : 'opacity-60') : 'opacity-50'}`}
            style={{
              background: mode === 'savage' && isPro ? 'rgba(255,68,68,0.25)' : 'rgba(255,68,68,0.1)',
              border: mode === 'savage' && isPro ? '1px solid #ff4444' : '1px dashed rgba(255,68,68,0.4)'
            }}
          >
            <span className={`text-base ${mode === 'savage' && isPro ? 'opacity-100' : 'opacity-50'}`}>💀</span>
            <span className={`text-sm font-medium ${mode === 'savage' && isPro ? 'text-white' : 'text-gray-400'}`}>Savage</span>
            {!isPro && <span className="text-[8px] ml-1 text-yellow-400 font-bold">PRO</span>}
          </button>
        </div>

        {/* Trust Message */}
        <p className="mt-6 text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span>🔒</span> Photos analyzed instantly, never stored
        </p>

        {/* BOTTOM SECTION - Simple counter + Go Pro button */}
        <div style={{
          width: '100%',
          marginTop: 'auto',
          paddingTop: '16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          position: 'relative',
          zIndex: 50
        }}>
          {/* Simple scan counter */}
          <p style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.5)',
            margin: 0
          }}>
            {isPro
              ? '⚡ Pro: 25 ratings/day'
              : `${scansRemaining} free scan${scansRemaining !== 1 ? 's' : ''} left`}
          </p>

          {/* GO PRO BUTTON - Super simple, always visible for non-Pro */}
          {!isPro && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                playSound('click')
                vibrate(20)
                setShowPaywall(true)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 28px',
                backgroundColor: '#ffd700',
                color: '#000',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
                minHeight: '52px',
                minWidth: '160px',
                boxShadow: '0 4px 20px rgba(255,215,0,0.4)',
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                userSelect: 'none',
                zIndex: 100
              }}
            >
              👑 Go Pro
            </button>
          )}
        </div>

        {/* Footer Links - Compact */}
        <div className="flex justify-center gap-6 pb-2">
          <a href="/privacy" className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Privacy</a>
          <a href="/terms" className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>Terms</a>
          <a href="/about" className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>About</a>
        </div>
      </div>
    )
  }

  // ============================================
  // ANALYZING SCREEN - Dopamine Loader
  // ============================================
  if (screen === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Photo with glow effect */}
        <div className="relative mb-8">
          <div className="w-44 h-60 rounded-2xl overflow-hidden" style={{
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 60px ${accentGlow}`,
            border: `2px solid ${accent}44`
          }}>
            <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
          </div>

          {/* Scanning overlay effect */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div className="absolute left-0 right-0 h-1" style={{
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
              boxShadow: `0 0 20px ${accent}`,
              animation: 'scanLine 1.2s ease-in-out infinite'
            }} />
          </div>

          {/* Corner brackets */}
          <div className="absolute -top-2 -left-2 w-5 h-5 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: accent }} />
          <div className="absolute -top-2 -right-2 w-5 h-5 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: accent }} />
          <div className="absolute -bottom-2 -left-2 w-5 h-5 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: accent }} />
          <div className="absolute -bottom-2 -right-2 w-5 h-5 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: accent }} />
        </div>

        {/* Progress Ring */}
        <div className="relative w-24 h-24 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="50" cy="50" r="45"
              fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${analysisProgress * 2.83} 283`}
              style={{
                filter: `drop-shadow(0 0 10px ${accent})`,
                transition: 'stroke-dasharray 0.1s ease-out'
              }}
            />
          </svg>
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-black" style={{ color: accent }}>
              {Math.round(analysisProgress)}%
            </span>
          </div>
        </div>

        {/* Rotating analysis text */}
        <p className="text-lg font-semibold text-white text-center h-7 transition-opacity duration-300" style={{
          textShadow: `0 0 20px ${accentGlow}`
        }}>
          {analysisMessages[analysisText]}
        </p>

        {/* Pro Features Checklist - Primes users before results */}
        {!isPro && (
          <div className="mt-6 space-y-1.5 text-left">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="text-green-400">✓</span><span>Score + sub-ratings</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="text-green-400">✓</span><span>Celeb style match</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <span className="text-green-400">✓</span><span>Styling tip</span>
            </div>
            <div className="h-px my-2" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>
              <span>🔒</span><span>Savage Level (Pro)</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>
              <span>🔒</span><span>Item-by-item roasts (Pro)</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>
              <span>🔒</span><span>Advanced AI analysis (Pro)</span>
            </div>
          </div>
        )}

        {/* Subtle reassurance */}
        <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {mode === 'roast' ? 'Brutally honest AI incoming...' : mode === 'honest' ? 'Analyzing objectively...' : 'AI analyzing your style...'}
        </p>

        <style>{`
          @keyframes scanLine { 
            0% { top: 0; } 
            50% { top: calc(100% - 4px); } 
            100% { top: 0; } 
          }
        `}</style>
      </div>
    )
  }

  // ============================================
  // RESULTS SCREEN - The Viral Engine
  // ============================================
  if (screen === 'results' && scores) {
    const scoreColor = getScoreColor(scores.overall)

    // Mode-specific accent colors for distinct visual identity per mode
    const modeAccent = (() => {
      switch (scores.mode) {
        case 'savage': return '#8b00ff' // Purple
        case 'roast': return '#ff4444'  // Red
        case 'honest': return '#0077ff' // Blue
        default: return '#00d4ff'       // Cyan (Nice)
      }
    })()

    const modeGlow = (() => {
      switch (scores.mode) {
        case 'savage': return 'rgba(139,0,255,0.4)' // Purple glow
        case 'roast': return 'rgba(255,68,68,0.4)'  // Red glow
        case 'honest': return 'rgba(0,119,255,0.4)' // Blue glow
        default: return 'rgba(0,212,255,0.4)'       // Cyan glow (Nice)
      }
    })()

    const modeGradientEnd = (() => {
      switch (scores.mode) {
        case 'savage': return '#ff0044' // Dark red
        case 'roast': return '#ff8800'  // Orange
        case 'honest': return '#00d4ff' // Cyan
        default: return '#00ff88'       // Green (Nice)
      }
    })()

    return (
      <div className="min-h-screen flex flex-col items-center p-4 overflow-x-hidden relative" style={{
        background: '#0a0a0f',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
      }}>
        {/* DOPAMINE GLOW - Mode-Specific Pulsing Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[150%] h-[150%] rounded-full opacity-25 blur-[120px] animate-pulse"
            style={{
              background: `radial-gradient(circle, ${modeAccent} 0%, ${modeGradientEnd} 40%, transparent 70%)`,
              animationDuration: '4s'
            }}
          />
        </div>
        {/* OVERALL SCORE - BIG at TOP */}
        <div className={`relative mb-3 transition-all duration-700 ${revealStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={modeAccent}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${displayedScore * 2.83} 283`}
                style={{
                  transition: 'stroke-dasharray 1s ease-out',
                  filter: `drop-shadow(0 0 15px ${modeAccent})`
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black" style={{ color: modeAccent }}>{displayedScore}</span>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)', marginTop: '-4px' }}>/ 100</span>
            </div>
          </div>

          {/* Certified Badge on Results Screen */}
          {scores.overall >= 90 && (
            <div className="absolute -top-2 -right-6 rotate-12 animate-in zoom-in-50 duration-500 delay-700">
              <div className="bg-yellow-400 text-black text-[10px] font-black px-2 py-1 rounded-md shadow-lg shadow-yellow-400/20">
                DRIP APPROVED
              </div>
            </div>
          )}
        </div>

        {/* Verdict & Catchphrases - The Heart of the Smile Test */}
        <div className={`flex flex-col items-center gap-2 mb-6 transition-all duration-700 delay-100 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-2xl font-black text-white text-center px-4" style={{
            textShadow: `0 0 30px ${modeAccent}66`,
            lineHeight: 1.1
          }}>
            {scores.verdict}
          </p>

          {scores.lines && scores.lines.length >= 2 && (
            <div className="flex flex-col items-center gap-1.5 mt-2">
              <p className="text-sm font-semibold text-white/80 italic text-center max-w-[280px]">"{scores.lines[0]}"</p>
              <p className="text-sm font-semibold text-white/80 italic text-center max-w-[280px]">"{scores.lines[1]}"</p>
            </div>
          )}

          <div className="mt-5 px-6 py-2 rounded-full bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-xl" style={{
            borderColor: `${modeAccent}33`
          }}>
            <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{
              color: modeAccent,
              textShadow: `0 0 15px ${modeAccent}66`
            }}>
              {scores.tagline}
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className={`mb-4 transition-all duration-500 delay-200 text-center ${revealStage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm font-bold mb-1" style={{
            color: scores.overall >= 80 ? '#00ff88' : (scores.overall >= 60 ? '#00d4ff' : '#ff6b6b')
          }}>
            {(() => {
              if (scores.roastMode) {
                if (scores.mode === 'savage') {
                  if (scores.overall >= 40) return '💀 YOU SURVIVED (Barely)'
                  if (scores.overall >= 20) return '🩸 AI drew blood'
                  return '☠️ ABSOLUTE ANNIHILATION'
                }
                if (scores.overall >= 60) return '😏 You survived'
                if (scores.overall >= 45) return '💀 Rough day for your closet'
                return '☠️ AI showed no mercy'
              } else if (scores.mode === 'honest') {
                if (scores.overall >= 95) return '💎 STYLE GOD — Pure Perfection'
                if (scores.overall >= 85) return '🔥 Post this immediately'
                if (scores.overall >= 70) return '👍 Solid fit, respectable'
                if (scores.overall >= 55) return '📊 Average range'
                return '📉 Needs work'
              } else {
                if (scores.overall >= 90) return '🔥 LEGENDARY — Post this NOW'
                if (scores.overall >= 80) return '✨ Main character energy'
                if (scores.overall >= 70) return '💅 Serve! TikTok would approve'
                if (scores.overall >= 60) return '👀 Cute! Minor tweaks = viral'
                return '💪 Good foundation, keep styling!'
              }
            })()}
          </p>
          <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Better than {scores.percentile}% of fits today
          </p>
        </div>

        {/* PHOTO PREVIEW */}
        <div className={`w-full max-w-xs mb-8 transition-all duration-700 delay-300 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative group">
            {/* Shimmering border for top scores */}
            {scores.overall >= 90 && (
              <div className="absolute -inset-1.5 bg-gradient-to-r from-yellow-400 via-white to-yellow-400 rounded-[34px] opacity-30 blur-sm animate-pulse" />
            )}
            <div className={`w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl relative ${scores.overall >= 95 ? 'card-golden' : ''}`} style={{
              border: scores.overall >= 95 ? 'none' : `2px solid ${modeAccent}44`,
              boxShadow: scores.overall >= 95 ? undefined : `0 20px 60px rgba(0,0,0,0.6), inset 0 0 40px ${modeAccent}11`
            }}>
              <img src={uploadedImage} alt="Your fit" className="w-full h-full object-cover" />

              {/* Subtle branding on photo */}
              <div className="absolute top-4 left-4 opacity-40">
                <span className="text-[10px] font-black text-white tracking-widest uppercase">FitRate.app</span>
              </div>

              {/* Pro Tip Overlay (If Pro) */}
              {isPro && scores.proTip && revealStage >= 4 && (
                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl bg-black/60 backdrop-blur-md border animate-in fade-in slide-in-from-bottom-2" style={{
                  borderColor: `${modeAccent}33`
                }}>
                  <span className="text-[9px] font-black uppercase tracking-widest block mb-1" style={{ color: modeAccent }}>💡 Pro Suggestion</span>
                  <p className="text-xs text-white/90 font-medium">"{scores.proTip}"</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* GOLDEN INSIGHT (PRO) OR TEASER (FREE) */}
        <div className={`w-full max-w-xs mb-6 transition-all duration-700 delay-500 ${revealStage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {isPro && (
            <div className="card-physical p-5 border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_40px_rgba(0,212,255,0.15)]" style={{
              borderColor: `${modeAccent}50`,
              backgroundColor: `${modeAccent}15`,
              boxShadow: `0 0 40px ${modeGlow}`
            }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">✨</span>
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: modeAccent }}>Golden Insight</span>
              </div>
              <div className="space-y-4 text-left">
                {scores.identityReflection && (
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Identity Reflection</span>
                    <p className="text-sm text-white font-medium leading-relaxed">{scores.identityReflection}</p>
                  </div>
                )}
                {scores.socialPerception && (
                  <div>
                    <span className="text-[10px] font-bold text-white/40 uppercase block mb-1">Social Perception</span>
                    <p className="text-sm text-white font-medium leading-relaxed">{scores.socialPerception}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SUB-RATINGS & ROASTS */}
        <div className={`w-full max-w-xs mb-8 transition-all duration-700 delay-700 ${revealStage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[{ l: 'Color', s: scores.color }, { l: 'Fit', s: scores.fit }, { l: 'Style', s: scores.style }].map(x => (
              <div key={x.l} className="text-center p-2 rounded-xl bg-white/5">
                <p className="text-[9px] text-white/30 uppercase font-black mb-1">{x.l}</p>
                <p className="text-lg font-bold" style={{ color: getScoreColor(x.s) }}>{x.s}</p>
              </div>
            ))}
          </div>

          {scores.savageLevel && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 mb-4 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Savage Level</span>
                <span className="text-lg font-black text-red-500">{scores.savageLevel}/10 🔥</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${scores.savageLevel * 10}%` }} />
              </div>
              {scores.itemRoasts && (
                <div className="mt-4 space-y-2">
                  {Object.entries(scores.itemRoasts).filter(([_, r]) => r && r !== 'N/A').map(([k, v]) => (
                    <div key={k} className="text-xs text-white/80 leading-snug">
                      <span className="font-black text-red-500/70 uppercase text-[9px] mr-2">{k}:</span>
                      {v}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* PRIMARY CTA: SHARE BEFORE SELL */}
        <div className={`w-full max-w-xs transition-all duration-700 delay-1000 ${revealStage >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <button
            onClick={generateShareCard}
            className="btn-physical animate-pulse-glow w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 overflow-hidden group mb-4"
            style={{
              background: `linear-gradient(135deg, ${modeGradientEnd} 0%, ${modeAccent} 100%)`,
              boxShadow: `0 10px 40px ${modeGlow}, var(--shadow-physical)`,
              color: (scores.mode === 'roast' || scores.mode === 'savage') ? 'white' : 'black'
            }}
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="text-2xl">📤</span> SHARE THIS FIT
          </button>

          <button
            onClick={resetApp}
            className="btn-physical w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest active:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span>🔄</span>
            {scores.overall >= 85 ? "Can you beat this? Scan again" :
              scores.overall < 50 ? "Redeem yourself? Try again" :
                "Rate Another Fit"}
          </button>

          {/* Daily Limit Tracker - Habit Building */}
          {!isPro && (
            <p className="text-center text-[10px] uppercase font-bold tracking-widest mt-3 transition-opacity duration-300" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {scansRemaining > 0 ? `⚡ ${scansRemaining} free scan${scansRemaining !== 1 ? 's' : ''} left today` : 'Daily limit reached • Reset in 12h'}
            </p>
          )}

          {/* Viral Loop Teaser: Mode Switching */}
          {!isPro && scores.mode === 'nice' && (
            <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-2 delay-1000">
              <p className="text-[10px] text-white/40 mb-1.5 font-medium">Too nice? Try the viral Roast Mode</p>
              <button
                onClick={() => { setMode('roast'); resetApp(); }}
                className="text-xs text-red-400 font-black uppercase tracking-wider border-b border-red-400/30 pb-0.5 hover:text-red-300 transition-colors"
              >
                See what AI really thinks 😈
              </button>
            </div>
          )}
        </div>

        {/* Confetti for 90+ */}
        {scores.overall >= 90 && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute animate-bounce" style={{
                left: `${Math.random() * 100}%`,
                top: `${-20 - Math.random() * 50}px`,
                width: '8px',
                height: '8px',
                background: ['#ffd700', modeGradientEnd, modeAccent][i % 3],
                borderRadius: '50%',
                animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                animationDelay: `${Math.random() * 3}s`
              }} />
            ))}
          </div>
        )}

        <style>{`
          @keyframes fall {
            to { transform: translateY(100vh) rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // ============================================
  // ERROR SCREEN
  // ============================================
  if (screen === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#0a0a0f] text-white" style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        <span className="text-6xl mb-6">👗</span>
        <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Oops!</h2>
        <p className="text-white/60 text-center mb-8 max-w-xs">{error || "We couldn't rate that one. Try a clearer photo or check your connection."}</p>

        <div className="w-full max-w-xs">
          <button
            onClick={resetApp}
            className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg transition-all active:scale-95"
            style={{ boxShadow: 'var(--shadow-physical)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ============================================
  // PRO EMAIL PROMPT SCREEN
  // ============================================
  if (screen === 'pro-email-prompt') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0f] text-white" style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        <div className="text-6xl mb-6">✅</div>
        <h2 className="text-3xl font-bold text-white mb-2">Payment Successful!</h2>
        <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Enter the email you used to pay<br />to activate your Pro access
        </p>

        <form onSubmit={handleEmailSubmit} className="w-full max-w-sm">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-5 py-4 rounded-xl text-white text-lg mb-4"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              outline: 'none'
            }}
            required
          />
          <button
            type="submit"
            disabled={emailChecking || !emailInput.trim()}
            className="w-full py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
              boxShadow: '0 4px 20px rgba(0,212,255,0.4)'
            }}
          >
            {emailChecking ? 'Checking...' : 'Activate Pro ⚡'}
          </button>
        </form>

        <p className="text-xs mt-6 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Your Pro access will work across all devices
        </p>

        {/* Skip button to return home */}
        <button
          onClick={() => setScreen('home')}
          className="mt-4 text-sm text-gray-500 hover:text-white transition-all"
        >
          ← Skip for now
        </button>
      </div>
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
  if (screen === 'paywall' || screen === 'limit-reached') {
    // Instead of a separate screen, show the paywall modal on home
    // This ensures all purchase CTAs go through one canonical Sales Page
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>

        {/* Background content */}
        <div className="text-center">
          <span className="text-6xl mb-4 block">{mode === 'roast' ? '🔥' : '✨'}</span>
          <h2 className="text-2xl font-black text-white mb-2">
            {screen === 'limit-reached' ? "You've used today's free scans" : 'Upgrade to Pro'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {timeUntilReset ? `Resets in ${timeUntilReset}` : 'Get 25 ratings per day'}
          </p>

          {/* Single CTA to open Sales Page */}
          <button
            onClick={() => setShowPaywall(true)}
            className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
              boxShadow: '0 8px 30px rgba(0,212,255,0.3)',
              minHeight: '56px'
            }}
          >
            👑 View Options
          </button>

          {/* Back button */}
          <button
            onClick={() => setScreen('home')}
            className="w-full mt-4 py-3 text-sm font-medium transition-all active:opacity-60"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            ← Maybe later
          </button>
        </div>

        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // ============================================
  // SHARE PREVIEW SCREEN - Ultimate Share Experience
  // ============================================
  if (screen === 'share-preview' && shareData) {
    const showCopiedToast = (message) => {
      setToastMessage(message)
      setShowToast(true)
      playSound('pop')
      vibrate(20)
      setTimeout(() => setShowToast(false), 2000)
    }

    const handleShare = async () => {
      playSound('share')
      vibrate(30)

      if (navigator.share) {
        try {
          // Always try to share with image first
          const data = {
            title: 'My FitRate Score',
            text: shareData.text,
          }

          // Check if we can share files (most mobile browsers)
          if (navigator.canShare && navigator.canShare({ files: [shareData.file] })) {
            data.files = [shareData.file]
          }

          await navigator.share(data)
          trackShare('native_share', 'outfit_rating', scores?.overall)
          setScreen('share-success')
        } catch (err) {
          if (err.name !== 'AbortError') {
            // Fallback: download + copy
            downloadImage(shareData.imageBlob, shareData.text)
            trackShare('download', 'outfit_rating', scores?.overall)
            showCopiedToast('Image saved! Caption copied ✅')
          }
        }
      } else {
        // Desktop fallback
        downloadImage(shareData.imageBlob, shareData.text)
        navigator.clipboard.writeText(shareData.text)
        trackShare('download', 'outfit_rating', scores?.overall)
        showCopiedToast('Image saved! Caption copied ✅')
        setTimeout(() => setScreen('share-success'), 1500)
      }
    }

    const copyCaption = async () => {
      try {
        await navigator.clipboard.writeText(shareData.text)
        showCopiedToast('Caption copied ✅')
      } catch (err) {
        showCopiedToast('Couldn\'t copy 😕')
      }
    }

    // Share helpers with UTM tracking
    const getShareUrl = () => {
      const baseUrl = `${window.location.origin}?challenge=${scores?.overall || 85}`
      return `${baseUrl}&utm_source=share&utm_medium=social&utm_campaign=fitrate`
    }

    const getShareText = () => {
      return `I got ${scores?.overall || 85}/100 on FitRate! 🔥 Think you can beat it?`
    }

    const copyShareLink = async () => {
      try {
        await navigator.clipboard.writeText(getShareUrl())
        playSound('click')
        showCopiedToast('Link copied! 📋')
        trackShare('copy_link', 'outfit_rating', scores?.overall)
      } catch (err) {
        showCopiedToast("Couldn't copy 😕")
      }
    }

    const shareToTwitter = () => {
      playSound('click')
      vibrate(15)
      const text = encodeURIComponent(getShareText())
      const url = encodeURIComponent(getShareUrl())
      trackShare('twitter', 'outfit_rating', scores?.overall)
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    }

    const shareToFacebook = () => {
      playSound('click')
      vibrate(15)
      const url = encodeURIComponent(getShareUrl())
      trackShare('facebook', 'outfit_rating', scores?.overall)
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    }

    const shareToReddit = () => {
      playSound('click')
      vibrate(15)
      const title = encodeURIComponent(getShareText())
      const url = encodeURIComponent(getShareUrl())
      trackShare('reddit', 'outfit_rating', scores?.overall)
      window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank')
    }

    const shareToSMS = () => {
      playSound('click')
      vibrate(15)
      const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`)
      // Use different format for iOS vs Android
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      trackShare('sms', 'outfit_rating', scores?.overall)
      window.location.href = isIOS ? `sms:&body=${text}` : `sms:?body=${text}`
    }

    const shareToWhatsApp = () => {
      playSound('click')
      vibrate(15)
      const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`)
      trackShare('whatsapp', 'outfit_rating', scores?.overall)
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    // Check if native share is available
    const hasNativeShare = typeof navigator.share === 'function'

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6" style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
      }}>
        {/* Toast Notification */}
        {showToast && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full z-60 animate-bounce" style={{
            background: 'rgba(0,255,136,0.9)',
            boxShadow: '0 4px 20px rgba(0,255,136,0.4)'
          }}>
            <span className="text-black font-bold text-sm">{toastMessage}</span>
          </div>
        )}

        {/* Share Card Preview */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl mb-6 w-[50%] max-w-[180px] aspect-[9/16]" style={{
          border: `2px solid ${scores?.roastMode ? 'rgba(255,68,68,0.3)' : 'rgba(0,212,255,0.3)'}`,
          boxShadow: `0 20px 60px ${scores?.roastMode ? 'rgba(255,68,68,0.3)' : 'rgba(0,212,255,0.3)'}`
        }}>
          <img src={URL.createObjectURL(shareData.imageBlob)} alt="Share Preview" className="w-full h-full object-cover" />
        </div>

        {/* Caption Preview */}
        <p className="text-xs text-center mb-4 px-4 max-w-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          "{shareData.text.slice(0, 60)}..."
        </p>

        {/* Primary Share CTA - Native Share with Image */}
        <button
          onClick={handleShare}
          className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 mb-4"
          style={{
            background: `linear-gradient(135deg, ${scores?.roastMode ? '#ff4444' : '#00d4ff'} 0%, ${scores?.roastMode ? '#ff0080' : '#00ff88'} 100%)`,
            boxShadow: `0 8px 30px ${scores?.roastMode ? 'rgba(255,68,68,0.4)' : 'rgba(0,212,255,0.4)'}`
          }}
        >
          <span className="text-xl">📤</span> {hasNativeShare ? 'Share with Image' : 'Download & Share'}
        </button>

        {/* Fallback Share Buttons - Always visible for more options */}
        <div className="w-full max-w-xs mb-6">
          <p className="text-xs text-center mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Or share directly to:
          </p>
          <div className="share-grid-responsive grid grid-cols-3 gap-3 mb-3">
            {/* WhatsApp - Primary */}
            <button
              onClick={shareToWhatsApp}
              className="flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}
            >
              <span className="text-2xl mb-1">💬</span>
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>WhatsApp</span>
            </button>

            {/* SMS/Text */}
            <button
              onClick={shareToSMS}
              className="flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <span className="text-2xl mb-1">📱</span>
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Message</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={copyShareLink}
              className="flex flex-col items-center justify-center p-4 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            >
              <span className="text-2xl mb-1">🔗</span>
              <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Copy Link</span>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {/* X (Twitter) */}
            <button
              onClick={shareToTwitter}
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-xl mb-1">𝕏</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>X</span>
            </button>

            {/* Facebook */}
            <button
              onClick={shareToFacebook}
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-xl mb-1">📘</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Facebook</span>
            </button>

            {/* Reddit */}
            <button
              onClick={shareToReddit}
              className="flex flex-col items-center justify-center p-3 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <span className="text-xl mb-1">🤖</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Reddit</span>
            </button>
          </div>
        </div>

        {/* Back */}
        <button
          onClick={() => setScreen('results')}
          className="text-sm transition-all active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Back to Results
        </button>
      </div>
    )
  }


  // ============================================
  // SHARE SUCCESS - One Follow-up Option
  // ============================================
  if (screen === 'share-success') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6" style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'max(1rem, env(safe-area-inset-top, 1rem))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
      }}>
        <span className="text-6xl mb-4">🎉</span>
        <h2 className="text-2xl font-black mb-2">Shared!</h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Let's see if they can beat it
        </p>

        {/* ONE Follow-up Option */}
        <button
          onClick={() => {
            // If they used Nice mode, suggest Roast. Otherwise, rate another.
            if (mode !== 'roast') {
              setMode('roast')
              setScreen('home')
            } else {
              setScreen('home')
            }
          }}
          className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 mb-4"
          style={{
            background: mode === 'roast'
              ? 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)'
              : 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)',
            boxShadow: mode === 'roast'
              ? '0 8px 30px rgba(0,212,255,0.3)'
              : '0 8px 30px rgba(255,68,68,0.3)'
          }}
        >
          {mode === 'roast' ? '📸 Rate Another Fit' : '🔥 Roast It Harder'}
        </button>

        {/* Back to home */}
        <button
          onClick={() => setScreen('home')}
          className="text-sm font-medium transition-all active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Done
        </button>
      </div>
    )
  }

  // ============================================
  // PAYWALL MODAL - Pro upgrade with decline offer
  // ============================================
  if (showPaywall) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(10px)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
        {/* Decline Offer Popup - higher z-index to overlay main paywall */}
        {showDeclineOffer && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{
            background: 'rgba(0,0,0,0.95)'
          }}>
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-sm w-full border border-yellow-500/30 relative" style={{
              boxShadow: '0 0 60px rgba(255,215,0,0.2)'
            }}>
              {/* Close X for decline offer */}
              <button
                onClick={() => {
                  setShowDeclineOffer(false)
                  setShowPaywall(false)
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-white text-xl p-1"
                aria-label="Close"
              >
                ×
              </button>
              <p className="text-yellow-400 font-bold text-lg mb-2">⏰ Wait!</p>
              <h2 className="text-white text-2xl font-black mb-4">First week on us...</h2>

              <p className="text-gray-400 mb-2">
                Get Pro for just <span className="text-yellow-400 font-bold">$1.99/week</span> for your first month
                <br />
                <span className="text-xs">(then $2.99/week, cancel anytime)</span>
              </p>

              {/* Countdown Timer */}
              {declineCountdown && (
                <p className="text-center mb-4 text-yellow-400/80 font-bold">
                  ⏳ Offer expires in {Math.floor(declineCountdown / 60)}:{String(declineCountdown % 60).padStart(2, '0')}
                </p>
              )}

              <button
                onClick={() => startCheckout('proWeeklyDiscount')}
                disabled={checkoutLoading}
                className="btn-stable-width w-full py-4 rounded-2xl text-black font-bold text-lg mb-3 transition-all duration-100 active:scale-[0.97] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #ffd700 0%, #ffb800 100%)',
                  boxShadow: '0 8px 30px rgba(255,215,0,0.35)'
                }}
              >
                {checkoutLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                    Loading...
                  </span>
                ) : '🔥 Claim This Deal'}
              </button>

              <p className="text-center text-[10px] text-gray-500 mb-3">
                🔐 Secure checkout · Cancel anytime
              </p>

              <button
                onClick={() => {
                  setShowDeclineOffer(false)
                  setShowPaywall(false)
                }}
                className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60"
              >
                No thanks
              </button>
            </div>
          </div>
        )}

        {/* Main Paywall */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-sm w-full border border-cyan-500/20 relative max-h-[90vh] overflow-y-auto" style={{
          boxShadow: '0 0 60px rgba(0,212,255,0.1)'
        }}>
          {/* Close X - directly closes paywall - STICKY */}
          <button
            onClick={() => {
              playSound('click')
              setShowPaywall(false)
            }}
            className="sticky top-0 float-right text-gray-400 hover:text-white text-3xl p-2 bg-slate-900/80 rounded-full z-10"
            style={{ marginRight: '-0.5rem', marginTop: '-0.5rem' }}
            aria-label="Close paywall"
          >
            ×
          </button>

          {/* HEADER - Value Focused */}
          <div className="text-center mb-6">
            <h2 className="text-white text-2xl font-black mb-1">Unlock Your Full Style Profile</h2>
            <p className="text-gray-400 text-sm">Get the scores & stats you're missing</p>
          </div>

          {/* 👑 PRO SUBSCRIPTION - Best Value */}
          <div className="relative w-full mb-5">
            <button
              onClick={() => startCheckout('proWeekly')}
              disabled={checkoutLoading}
              className="btn-physical w-full p-4 rounded-3xl text-left transition-all group relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ffb800 100%)',
                border: '2px solid rgba(255,255,255,0.3)',
                boxShadow: 'var(--shadow-physical), 0 0 40px rgba(255,215,0,0.25)'
              }}
            >
              {/* Best Value Badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-black px-3 py-1.5 rounded-bl-xl uppercase tracking-wider z-10" style={{
                boxShadow: '-2px 2px 10px rgba(255,68,68,0.3)'
              }}>
                Best Value
              </div>

              {/* Shine effect */}
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000 pointer-events-none" />

              {/* Header: Crown + Title + Price */}
              <div className="flex flex-col w-full relative z-10">
                <div className="flex items-center gap-3 mb-3 pr-8">
                  <span className="text-2xl sm:text-3xl flex-shrink-0">👑</span>
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-black text-lg sm:text-2xl font-black leading-tight truncate">Pro Weekly</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-black text-black">$2.99</span>
                      <span className="text-black/60 text-sm font-bold">/wk</span>
                    </div>
                  </div>
                </div>

                {/* Visual Lock Tease - The Core "Non-Greedy" Hook */}
                <div className="flex items-center gap-2 mb-3 bg-black/10 p-2 rounded-lg">
                  <span className="text-[10px] uppercase font-black text-black/60 mr-1">Modes:</span>
                  <div className="flex gap-2 text-lg">
                    <span title="Nice">😌</span>
                    <span title="Roast">🔥</span>
                    <div className="relative">
                      <span>🧠</span>
                      <div className="absolute -top-1 -right-1 text-[8px] bg-black text-white px-1 rounded-full">🔒</div>
                    </div>
                    <div className="relative">
                      <span>😈</span>
                      <div className="absolute -top-1 -right-1 text-[8px] bg-black text-white px-1 rounded-full">🔒</div>
                    </div>
                  </div>
                </div>

                {/* Benefits - Precision Focus */}
                <div className="space-y-1.5 pl-1">
                  {[
                    'Unlock Honest & Savage Modes',
                    'Precision Scoring (e.g. 87.4)',
                    'Unlimited Scans (25/day)'
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm font-bold text-black/90">
                      <span className="text-black text-sm flex-shrink-0">✓</span>
                      <span className="truncate">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </button>
          </div>

          <p className="text-center text-[10px] font-bold text-gray-500 mb-4 tracking-wider uppercase">— OR PAY AS YOU GO —</p>

          {/* 🎟️ SCAN PACKS - 2-Column Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* 5 Scans */}
            <button
              onClick={() => startCheckout('starterPack')}
              disabled={checkoutLoading}
              className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px]"
              style={{
                background: 'rgba(100,200,255,0.08)',
                border: '1.5px solid rgba(100,200,255,0.3)'
              }}
            >
              <span className="block text-4xl font-black text-cyan-400 mb-1">5</span>
              <span className="block text-xs text-gray-400 uppercase font-bold mb-3 tracking-wide">Scans</span>
              <span className="block text-xs text-gray-500 mb-2">Use anytime</span>
              <span className="block text-lg font-black text-white">$1.99</span>
            </button>

            {/* 15 Scans - Highlighted */}
            <button
              onClick={() => startCheckout('popularPack')}
              disabled={checkoutLoading}
              className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px] relative overflow-hidden"
              style={{
                background: 'rgba(0,212,255,0.15)',
                border: '2px solid #00d4ff',
                boxShadow: 'var(--shadow-physical), 0 0 25px rgba(0,212,255,0.3)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1.5 bg-cyan-400" />
              <span className="block text-5xl font-black text-cyan-400 mb-1">15</span>
              <span className="block text-xs text-cyan-400/80 uppercase font-bold mb-3 tracking-wide">Scans</span>
              <span className="block text-xs text-cyan-300/70 mb-2">Use anytime</span>
              <span className="block text-lg font-black text-white">$3.99</span>
            </button>

            {/* 50 Scans */}
            <button
              onClick={() => startCheckout('powerPack')}
              disabled={checkoutLoading}
              className="btn-physical p-5 rounded-2xl text-center flex flex-col items-center justify-center min-h-[140px] col-span-2"
              style={{
                background: 'rgba(138,75,255,0.1)',
                border: '1.5px solid rgba(138,75,255,0.4)'
              }}
            >
              <span className="block text-5xl font-black text-purple-400 mb-1">50</span>
              <span className="block text-xs text-purple-400/70 uppercase font-bold mb-3 tracking-wide">Scans</span>
              <span className="block text-xs text-gray-500 mb-2">Use anytime</span>
              <span className="block text-lg font-black text-white">$9.99</span>
            </button>
          </div>

          {/* ☠️ SAVAGE ONE-OFF - "Curiosity" Framing */}
          <div className="relative w-full mb-5">
            <button
              onClick={() => startCheckout('proRoast')}
              disabled={checkoutLoading}
              className="btn-physical w-full p-5 rounded-2xl text-center transition-all group"
              style={{
                background: 'linear-gradient(135deg, #1a0000 0%, #330000 100%)',
                border: '2px solid rgba(255,68,68,0.5)',
                boxShadow: 'var(--shadow-physical), 0 0 30px rgba(255,68,68,0.2)'
              }}
            >
              <div className="flex flex-col items-center">
                <span className="text-4xl mb-2">☠️</span>
                <h3 className="text-red-400 text-xl font-black mb-1">Curious? Savage Mode</h3>
                <p className="text-red-300/60 text-sm font-bold mb-2">Try the brutal truth once</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 line-through">$2.99</span>
                  <span className="text-2xl font-black text-white">$0.99</span>
                </div>
              </div>
            </button>
          </div>

          {/* TRANSPARENCY SECTION */}
          <div className="mb-5 p-4 rounded-2xl" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div className="space-y-2">
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Free users get Nice & Roast modes
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="text-cyan-400">✓</span>
                Pro unlocks all modes
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="text-gray-500">✓</span>
                No hidden charges
              </p>
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <span className="text-gray-500">✓</span>
                Cancel anytime
              </p>
            </div>
          </div>

          {/* Reassurance + Close */}
          <p className="text-center text-[10px] text-gray-500 mb-3">
            🔐 Secure checkout · Instant access
          </p>
          <button
            onClick={() => {
              playSound('click')
              setShowPaywall(false)
            }}
            className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60"
          >
            ← Not now, go back
          </button>
        </div>
      </div>
    )
  }

  return null
}
