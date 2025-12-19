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

  // Check Pro status via email on load
  useEffect(() => {
    const savedEmail = localStorage.getItem('fitrate_email')
    if (savedEmail && !isPro) {
      checkProStatus(savedEmail)
    }
  }, [])

  // Handle Referrals & Payment Success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)

    // Payment Success
    if (urlParams.get('success') === 'true') {
      setScreen('pro-email-prompt')
      window.history.replaceState({}, '', window.location.pathname)
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

  // Check if email is Pro
  const checkProStatus = async (email) => {
    try {
      setEmailChecking(true)
      const response = await fetch(`${API_BASE}/pro/check`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email })
      })
      const data = await response.json()

      if (data.isPro) {
        localStorage.setItem('fitrate_pro', 'true')
        localStorage.setItem('fitrate_email', email.toLowerCase().trim())
        setIsPro(true)
        setProEmail(email.toLowerCase().trim())
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

  // Sequential reveal animation
  useEffect(() => {
    if (screen === 'results' && scores) {
      setRevealStage(0)
      const timers = [
        setTimeout(() => setRevealStage(1), 200),  // Verdict
        setTimeout(() => setRevealStage(2), 600),  // Score
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

      setScores({ ...data.scores, mode, roastMode: mode === 'roast' })
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

    // Gradient background - Premium for Pro
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920)
    if (isProCard) {
      gradient.addColorStop(0, '#0a0a12')
      gradient.addColorStop(0.3, '#1a1a2e')
      gradient.addColorStop(0.5, '#16213e')
      gradient.addColorStop(0.7, '#1a1a2e')
      gradient.addColorStop(1, '#0a0a12')
    } else {
      gradient.addColorStop(0, '#0a0a0f')
      gradient.addColorStop(0.4, modeColors.mid)
      gradient.addColorStop(1, '#0a0a0f')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1920)

    // PRO SPARKLE BORDER - Gold glow for Pro users
    if (isProCard) {
      ctx.shadowColor = '#ffd700'
      ctx.shadowBlur = 40
      ctx.strokeStyle = '#ffd700'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.roundRect(30, 30, 1020, 1860, 40)
      ctx.stroke()
      ctx.shadowBlur = 0

      // Inner sparkle line
      ctx.strokeStyle = 'rgba(255,215,0,0.3)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(40, 40, 1000, 1840, 36)
      ctx.stroke()
    }

    // Glow effect behind card
    const glowColor = isProCard ? 'rgba(255,215,0,0.3)' : modeColors.glow
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 120
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.beginPath()
    ctx.roundRect(60, 120, 960, 1520, 48)
    ctx.fill()
    ctx.shadowBlur = 0

    // Glassmorphism card
    ctx.fillStyle = isProCard ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)'
    ctx.beginPath()
    ctx.roundRect(60, 120, 960, 1520, 48)
    ctx.fill()

    // Border glow
    ctx.strokeStyle = isProCard ? 'rgba(255,215,0,0.5)' : (scores.roastMode ? 'rgba(255,68,68,0.6)' : 'rgba(0,212,255,0.6)')
    ctx.lineWidth = 4
    ctx.stroke()

    // Load user image
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise((resolve) => {
      img.onload = resolve
      img.onerror = resolve
      img.src = uploadedImage
    })

    // Draw photo with rounded corners - SCALE for format
    const yScale = canvas.height / 1920 // Scale factor for 1:1 vs 9:16
    const imgWidth = isSquare ? 500 : 580
    const imgHeight = isSquare ? 500 : 720
    const imgX = (1080 - imgWidth) / 2
    const imgY = isSquare ? 100 : 180

    ctx.save()
    ctx.beginPath()
    ctx.roundRect(imgX, imgY, imgWidth, imgHeight, 28)
    ctx.clip()

    const scale = Math.max(imgWidth / img.width, imgHeight / img.height)
    const scaledW = img.width * scale
    const scaledH = img.height * scale
    const offsetX = imgX + (imgWidth - scaledW) / 2
    const offsetY = imgY + (imgHeight - scaledH) / 2
    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH)
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

    // PRO BADGE - Gold banner for Pro users or purchased scans
    if (isPro || scores.savageLevel) {
      // Gold gradient badge background
      const badgeWidth = 200
      const badgeHeight = 36
      const badgeX = (1080 - badgeWidth) / 2
      const badgeY = isSquare ? 610 : 925

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
      ctx.fillText('⚡ PRO ANALYSIS', 540, isSquare ? 635 : 950)
    }

    // Score number - BIG
    ctx.fillStyle = scoreColor
    ctx.font = `bold ${isSquare ? 56 : 72}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText(scores.overall, 540, scoreY + (isSquare ? 18 : 20))

    // "/100" below score
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = `${isSquare ? 22 : 28}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillText('/100', 540, scoreY + (isSquare ? 50 : 60))

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

    // Sub-scores row (Color / Fit / Style) - only on story format (skip for square)
    const subScoreY = isSquare
      ? (verdictLines.length > 1 ? 870 : 850)
      : (verdictLines.length > 1 ? 1210 : 1180)

    if (!isSquare) {
      // Full subscores for 9:16
      const subScores = [
        { label: 'Color', score: scores.color },
        { label: 'Fit', score: scores.fit },
        { label: 'Style', score: scores.style }
      ]
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif'
      subScores.forEach((sub, i) => {
        const x = 300 + (i * 240)
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.fillText(sub.label, x, subScoreY)
        ctx.fillStyle = scoreColor
        ctx.fillText(sub.score.toString(), x, subScoreY + 28)
      })
    }

    // PRO EXCLUSIVE: Savage Meter + Item Roast
    let proContentY = subScoreY + 50
    if (isProCard && scores.savageLevel) {
      // Savage meter background
      const meterX = 180
      const meterWidth = 720
      const meterHeight = 28
      ctx.fillStyle = 'rgba(255,68,68,0.15)'
      ctx.beginPath()
      ctx.roundRect(meterX, proContentY, meterWidth, meterHeight, 14)
      ctx.fill()

      // Savage meter fill
      const fillWidth = (scores.savageLevel / 10) * meterWidth
      const savageGradient = ctx.createLinearGradient(meterX, 0, meterX + fillWidth, 0)
      savageGradient.addColorStop(0, '#ff4444')
      savageGradient.addColorStop(1, '#ff6b6b')
      ctx.fillStyle = savageGradient
      ctx.beginPath()
      ctx.roundRect(meterX, proContentY, fillWidth, meterHeight, 14)
      ctx.fill()

      // Savage label
      const fireEmoji = scores.savageLevel >= 9 ? '🔥🔥🔥' : scores.savageLevel >= 7 ? '🔥🔥' : '🔥'
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(`${fireEmoji} SAVAGE: ${scores.savageLevel}/10`, meterX + 20, proContentY - 8)
      ctx.textAlign = 'center'

      proContentY += 50
    }

    // PRO EXCLUSIVE: Best item roast quote
    if (isProCard && scores.itemRoasts) {
      const roasts = scores.itemRoasts
      // Pick the best roast (shoes usually most visible)
      const bestRoast = roasts.shoes || roasts.top || roasts.bottom
      if (bestRoast && bestRoast !== 'N/A') {
        const truncatedRoast = bestRoast.length > 45 ? bestRoast.slice(0, 42) + '...' : bestRoast
        ctx.fillStyle = 'rgba(255,215,0,0.15)'
        ctx.beginPath()
        ctx.roundRect(140, proContentY, 800, 50, 25)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif'
        ctx.fillText(`💬 "${truncatedRoast}"`, 540, proContentY + 33)
        proContentY += 60
      }
    }

    // Aesthetic + Celeb in pill style (skip for square to save space, or position lower)
    const pillY = isSquare
      ? subScoreY + 20
      : (isProCard && scores.savageLevel ? proContentY : subScoreY + 60)

    if (!isSquare) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.beginPath()
      ctx.roundRect(140, pillY, 800, 50, 25)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.font = '26px -apple-system, BlinkMacSystemFont, sans-serif'
      const celebText = scores.celebMatch
      ctx.fillText(`${scores.aesthetic} • ${celebText}`, 540, pillY + 35)
    }

    // For square: show condensed aesthetic tag
    if (isSquare) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText(`${scores.aesthetic}`, 540, 900)
    }

    // Challenge text - THE VIRAL HOOK (dynamic Y)
    const captionY = isSquare ? 950 : 1350
    ctx.fillStyle = isProCard ? '#ffd700' : modeColors.light
    ctx.font = `bold ${isSquare ? 28 : 38}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillText(viralCaption, 540, captionY)

    // Hashtags - Pro gets special hashtag (skip for square to save space)
    if (!isSquare) {
      ctx.fillStyle = isProCard ? '#ffd700' : modeColors.accent
      ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif'
      const proHashtags = isProCard ? '✨ #FitRatePro #OutfitCheck ✨' : hashtags
      ctx.fillText(proHashtags, 540, 1420)
    }

    // Call to action box - dynamic for format
    const ctaY = isSquare ? 990 : 1480
    const ctaHeight = isSquare ? 70 : 100
    ctx.fillStyle = modeColors.glow.replace('0.4', '0.2')
    ctx.beginPath()
    ctx.roundRect(isSquare ? 140 : 180, ctaY, isSquare ? 800 : 720, ctaHeight, 20)
    ctx.fill()
    ctx.strokeStyle = modeColors.glow.replace('0.4', '0.5')
    ctx.lineWidth = 2
    ctx.stroke()

    // CTA text - Made to screenshot positioning
    ctx.fillStyle = '#ffffff'
    ctx.font = `bold ${isSquare ? 26 : 34}px -apple-system, BlinkMacSystemFont, sans-serif`
    ctx.fillText('Your turn → fitrate.app', 540, ctaY + (ctaHeight / 2) + 8)

    // Branding footer (skip for square)
    if (!isSquare) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText('Rate your fit in seconds', 540, 1620)
    }

    // Generate share text - punchy, viral, screenshot-worthy
    const getShareText = () => {
      const baseUrl = 'https://fitrate.app'
      if (scores.roastMode) {
        if (scores.overall < 30) return `AI gave me a ${scores.overall} 💀💀💀 I'm devastated. Your turn? ${baseUrl}?ref=${userId}`
        if (scores.overall < 45) return `${scores.overall}/100 — AI showed NO mercy 💀 ${baseUrl}?ref=${userId}`
        if (scores.overall < 60) return `AI humbled me 💀 ${scores.overall}/100. Your turn? ${baseUrl}?ref=${userId}`
        return `Survived Roast Mode 😏 ${scores.overall}/100 ${baseUrl}?ref=${userId}`
      } else if (scores.mode === 'honest') {
        if (scores.overall >= 90) return `Honest mode gave me ${scores.overall}/100 📊 No cap. ${baseUrl}?ref=${userId}`
        if (scores.overall >= 75) return `Real talk: ${scores.overall}/100 📊 What's YOUR honest score? ${baseUrl}?ref=${userId}`
        return `Got my honest rating: ${scores.overall} 📊 ${baseUrl}?ref=${userId}`
      } else {
        if (scores.overall >= 95) return `${scores.overall}/100 💅 I'm literally perfect. Beat that: ${baseUrl}?ref=${userId}`
        if (scores.overall >= 90) return `${scores.overall}/100 — AI approved 🏆 Beat my score: ${baseUrl}?ref=${userId}`
        if (scores.overall >= 80) return `${scores.overall}/100 ✨ What's YOUR score? ${baseUrl}?ref=${userId}`
        if (scores.overall >= 70) return `${scores.overall}/100 — pretty good 👀 Can you beat it? ${baseUrl}?ref=${userId}`
        return `Got my fit rated: ${scores.overall} 👀 Your turn: ${baseUrl}?ref=${userId}`
      }
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
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#00d4ff'
    return '#ff4444'
  }

  // Accent colors based on mode
  const getModeColor = () => {
    if (mode === 'roast') return '#ff4444'
    if (mode === 'honest') return '#4A90D9'
    return '#00d4ff'
  }
  const getModeGlow = () => {
    if (mode === 'roast') return 'rgba(255,68,68,0.4)'
    if (mode === 'honest') return 'rgba(74,144,217,0.4)'
    return 'rgba(0,212,255,0.4)'
  }
  const accent = getModeColor()
  const accentGlow = getModeGlow()

  // Analysis messages for analyzing screen - High-status dopamine feedback
  const analysisMessages = mode === 'roast'
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
              onClick={flipCamera}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm active:scale-95"
            >
              <span className="text-white text-lg">🔄</span>
            </button>

            {/* Gallery button */}
            <button
              onClick={() => {
                stopCamera()
                setScreen('home')
                setTimeout(() => fileInputRef.current?.click(), 100)
              }}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm active:scale-95"
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
                stopCamera()
                setCountdown(null)
                setScreen('home')
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95"
            >
              <span className="text-white text-xl">✕</span>
            </button>

            {/* Capture button - BIG */}
            <button
              onClick={capturePhoto}
              disabled={countdown !== null}
              className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                boxShadow: '0 0 30px rgba(0,212,255,0.5)',
                border: '4px solid white'
              }}
            >
              <span className="text-3xl">📸</span>
            </button>

            {/* Timer button */}
            <button
              onClick={timerCapture}
              disabled={countdown !== null}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-95 disabled:opacity-50"
            >
              <span className="text-white text-sm font-bold">3s</span>
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
  // HOME SCREEN - Camera First, Zero Friction
  // ============================================
  if (screen === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
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
            disabled={scansRemaining === 0 && !isPro && purchasedScans === 0}
            className="btn-physical relative w-72 h-72 rounded-full flex flex-col items-center justify-center disabled:opacity-40 group"
            style={{
              background: `radial-gradient(circle, ${getModeGlow()} 0%, transparent 70%)`,
              border: `3px solid ${accent}99`,
              boxShadow: `var(--shadow-physical), 0 0 100px ${accentGlow}, inset 0 0 80px rgba(255,255,255,0.03)`
            }}
          >
            {/* Pulsing inner glow */}
            <div className="absolute inset-4 rounded-full transition-all duration-300 group-hover:scale-105 group-active:scale-95" style={{
              background: `linear-gradient(135deg, ${accent} 0%, ${mode === 'roast' ? '#ff0080' : mode === 'honest' ? '#00d4ff' : '#00ff88'} 100%)`,
              boxShadow: `0 0 60px ${accentGlow}`,
              animation: 'pulse 2s ease-in-out infinite'
            }} />

            {/* Icon */}
            <span className="relative text-8xl mb-4 drop-shadow-2xl">
              {mode === 'roast' ? '🔥' : mode === 'honest' ? '📊' : '📸'}
            </span>
            <span className="relative text-white text-2xl font-black tracking-widest uppercase">
              {mode === 'roast' ? 'ROAST MY FIT' : mode === 'honest' ? 'ANALYZE FIT' : 'RATE MY FIT'}
            </span>

            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <p className="text-[12px] font-black text-white/50 uppercase tracking-[0.15em] animate-pulse">Tap to Start</p>
            </div>
          </button>
        </div>

        {/* MODE SELECTOR - Refined, secondary pill */}
        <div className="mt-6 mb-10 flex items-center gap-2 p-1 rounded-full overflow-visible" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          {[
            { key: 'nice', emoji: '😇', label: 'Nice' },
            { key: 'honest', emoji: '📊', label: 'Honest' },
            { key: 'roast', emoji: '😈', label: 'Roast' }
          ].map((m) => (
            <button
              key={m.key}
              onClick={() => {
                playSound('click')
                vibrate(15)
                setMode(m.key)
              }}
              className={`flex items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-100 active:scale-[0.97] ${mode === m.key ? 'opacity-100' : 'opacity-60'}`}
              style={{
                background: mode === m.key
                  ? m.key === 'roast' ? 'rgba(255,68,68,0.25)' : m.key === 'honest' ? 'rgba(74,144,217,0.25)' : 'rgba(0,212,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
                border: mode === m.key
                  ? `1px solid ${m.key === 'roast' ? '#ff4444' : m.key === 'honest' ? '#4A90D9' : '#00d4ff'}`
                  : '1px solid transparent'
              }}
            >
              <span className={`text-sm transition-opacity ${mode === m.key ? 'opacity-100' : 'opacity-50'}`}>
                {m.emoji}
              </span>
              <span className={`text-xs font-medium transition-opacity ${mode === m.key ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>
                {m.label}
              </span>
            </button>
          ))}

          {/* SAVAGE Mode - Pro Only */}
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
            className={`relative flex items-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300 overflow-visible ${isPro ? '' : 'opacity-70'}`}
            style={{
              background: mode === 'savage' && isPro ? 'rgba(255,0,0,0.3)' : 'rgba(255,0,0,0.1)',
              border: mode === 'savage' && isPro ? '1px solid #ff0000' : '1px dashed rgba(255,0,0,0.4)',
              marginTop: !isPro ? '4px' : '0'
            }}
          >
            {!isPro && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap z-10" style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                color: '#000'
              }}>PRO</span>
            )}
            <span className={`text-sm transition-opacity ${mode === 'savage' && isPro ? 'opacity-100' : 'opacity-60'}`}>💀</span>
            <span className={`text-xs font-medium transition-opacity ${mode === 'savage' && isPro ? 'opacity-100 text-white' : 'opacity-60 text-gray-400'}`}>Savage</span>
            {!isPro && <span className="text-[11px] ml-1">🔒</span>}
          </button>
        </div>

        {/* Trust Message */}
        <p className="mt-6 text-xs flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span>🔒</span> Photos analyzed instantly, never stored
        </p>

        {/* Pro Tease - shows when low on scans */}
        {!isPro && scansRemaining <= 1 && (
          <button
            onClick={() => setShowPaywall(true)}
            className="btn-responsive-text flex items-center gap-1 text-xs mt-3 px-3 py-1.5 rounded-full transition-all active:scale-95 hover:opacity-100"
            style={{
              color: '#ffd700',
              background: 'rgba(255,215,0,0.1)',
              border: '1px solid rgba(255,215,0,0.3)'
            }}
          >
            <span>⚡ Go Pro</span>
          </button>
        )}

        {/* BOTTOM SECTION - COORDINATED LAYOUT */}
        <div className="w-full mt-auto pt-4 flex flex-col items-center gap-6" style={{
          paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 1rem))'
        }}>
          {/* Scan Status & Pro Upgrade */}
          <div className="flex flex-col items-center gap-3">
            {scansRemaining > 0 || isPro ? (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {isPro ? '⚡ 25 ratings per day' : `${scansRemaining} free rating${scansRemaining !== 1 ? 's' : ''} left today`}
              </p>
            ) : (
              <button
                onClick={() => setShowPaywall(true)}
                className="btn-physical btn-responsive-text flex items-center gap-2 px-6 py-2.5 rounded-full animate-pulse-glow"
                style={{
                  background: 'rgba(255,215,0,0.1)',
                  border: '1px solid rgba(255,215,0,0.4)',
                  boxShadow: '0 0 30px rgba(255,215,0,0.1)'
                }}
              >
                <span className="text-xs font-black" style={{ color: '#ffd700' }}>
                  GET MORE RATINGS 👑
                </span>
              </button>
            )}

            {!isPro && scansRemaining > 0 && (
              <button
                onClick={() => setShowPaywall(true)}
                className="text-[11px] font-black tracking-[0.15em] text-orange-400 opacity-70 hover:opacity-100 transition-opacity uppercase"
              >
                Go Pro →
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

        {/* Paywall Modal Overlay - Renders on top of home screen */}
        {showPaywall && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Decline Offer Popup */}
            {showDeclineOffer && (
              <div className="absolute inset-0 z-60 flex items-center justify-center p-4" style={{
                background: 'rgba(0,0,0,0.95)'
              }}>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 max-w-sm w-full border border-yellow-500/30" style={{
                  boxShadow: '0 0 60px rgba(255,215,0,0.2)'
                }}>
                  <p className="text-yellow-400 font-bold text-lg mb-2">✨ Special Offer</p>
                  <h2 className="text-white text-2xl font-black mb-4">Try Pro for less</h2>

                  <p className="text-gray-400 mb-4">
                    Get FitRate Pro for just <span className="text-yellow-400 font-bold">$1.99/week</span>
                    <br />
                    <span className="text-xs">(Regular price $2.99/week, cancel anytime)</span>
                  </p>

                  <button
                    onClick={() => startCheckout('proWeeklyDiscount')}
                    disabled={checkoutLoading}
                    className="w-full py-4 rounded-2xl text-black font-bold text-lg mb-3 transition-all duration-100 active:scale-[0.97] disabled:opacity-70"
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
                    ) : 'Get This Deal'}
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
                    Maybe later
                  </button>
                </div>
              </div>
            )}

            {/* Main Paywall */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-sm w-full border border-cyan-500/20 relative max-h-[90vh] overflow-y-auto" style={{
              boxShadow: '0 0 60px rgba(0,212,255,0.1)'
            }}>
              {/* Close X */}
              <button
                onClick={() => {
                  playSound('click')
                  setShowDeclineOffer(true) // Show decline offer instead of closing
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl"
              >
                ×
              </button>

              <div className="text-center mb-6">
                <span className="text-4xl mb-2 block">👑</span>
                <h2 className="text-white text-2xl font-black">Go Pro</h2>
                <p className="text-gray-400 text-sm mt-1">Get 25 outfit ratings every day</p>
              </div>

              {/* Pro Subscription Hero Card */}
              <div className="relative w-full mb-6">
                <button
                  onClick={() => startCheckout('proWeekly')}
                  disabled={checkoutLoading}
                  className="btn-physical w-full p-6 pb-8 rounded-3xl text-left transition-all group overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: 'var(--shadow-physical), 0 0 40px rgba(0,212,255,0.2)'
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000" />

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white text-xl font-black leading-tight">FitRate Pro</h3>
                    </div>
                    <span className="text-2xl">👑</span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {[
                      '25 ratings per day',
                      'Style personality insights',
                      'Social perception analysis',
                      'All modes included'
                    ].map((benefit, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] font-semibold text-white/90">
                        <span className="text-white text-[10px]">✓</span>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white">$2.99</span>
                      <span className="text-white/60 text-xs">/week</span>
                    </div>
                    <span className="text-[9px] font-black px-2 py-1 rounded-full bg-white/20 text-white uppercase tracking-wider">
                      Best Value
                    </span>
                  </div>
                </button>
              </div>

              <p className="text-center text-[10px] font-bold text-gray-500 mb-4 tracking-widest uppercase">— OR PAY PER RATING —</p>

              {/* Scan Packs Section - Supercell Style Loot Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* Starter Pack */}
                <button
                  onClick={() => startCheckout('starterPack')}
                  disabled={checkoutLoading}
                  className="btn-physical p-4 rounded-2xl text-center flex flex-col items-center justify-between min-h-[110px]"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <span className="block text-2xl font-black text-white">5</span>
                  <span className="block text-[9px] text-gray-500 uppercase font-black">ratings</span>
                  <span className="block text-sm font-bold text-white mt-1">$1.99</span>
                </button>

                {/* Popular Pack - Supercell Highlight */}
                <button
                  onClick={() => startCheckout('popularPack')}
                  disabled={checkoutLoading}
                  className="btn-physical p-4 rounded-2xl text-center flex flex-col items-center justify-between min-h-[110px] relative overflow-hidden"
                  style={{
                    background: 'rgba(0,212,255,0.1)',
                    border: '2px solid #00d4ff',
                    boxShadow: 'var(--shadow-physical), 0 0 20px rgba(0,212,255,0.2)'
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400" />
                  <span className="block text-3xl font-black text-cyan-400">15</span>
                  <span className="block text-[9px] text-cyan-400/70 uppercase font-black">ratings</span>
                  <span className="block text-sm font-bold text-white mt-1">$3.99</span>
                </button>

                {/* Power Pack */}
                <button
                  onClick={() => startCheckout('powerPack')}
                  disabled={checkoutLoading}
                  className="btn-physical p-4 rounded-2xl text-center flex flex-col items-center justify-between min-h-[110px]"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <span className="block text-2xl font-black text-white">50</span>
                  <span className="block text-[9px] text-gray-500 uppercase font-black">ratings</span>
                  <span className="block text-sm font-bold text-white mt-1">$9.99</span>
                </button>
              </div>

              {/* SAVAGE Roast option */}
              <button
                onClick={() => startCheckout('proRoast')}
                disabled={checkoutLoading}
                className="w-full py-4 rounded-2xl text-red-400 font-bold text-sm mb-4 mt-4 transition-all duration-100 active:scale-[0.97] disabled:opacity-50"
                style={{
                  background: 'rgba(255,68,68,0.08)',
                  border: '1px solid rgba(255,68,68,0.25)'
                }}
              >
                💀 Or get 1 SAVAGE Roast for $0.99
              </button>

              {/* Invite 3 → Get 15 Free Ratings */}
              <div className="w-full p-4 rounded-2xl mb-4" style={{
                background: 'rgba(0,255,136,0.06)',
                border: '1px dashed rgba(0,255,136,0.3)'
              }}>
                <p className="text-center text-xs text-green-400/80 mb-2">🎁 OR GET FREE RATINGS</p>
                <p className="text-center text-white text-sm font-bold mb-2">
                  Invite 3 friends → Get 15 free ratings
                </p>
                <div className="flex items-center justify-center gap-1 mb-3">
                  {[0, 1, 2].map(i => {
                    const totalReferrals = parseInt(localStorage.getItem('fitrate_total_referrals') || '0')
                    const filled = i < totalReferrals
                    return (
                      <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{
                        background: filled ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)',
                        border: filled ? '2px solid #00ff88' : '2px solid rgba(255,255,255,0.2)'
                      }}>
                        {filled ? '✓' : '?'}
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={async () => {
                    const shareUrl = `https://fitrate.app?ref=${userId}`
                    if (navigator.share) {
                      navigator.share({ title: 'Rate my fit!', url: shareUrl })
                    } else {
                      await navigator.clipboard.writeText(shareUrl)
                      displayToast('Link copied! 📋')
                    }
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all duration-100 active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                    color: '#000'
                  }}
                >
                  Share & Invite Friends 🚀
                </button>
              </div>

              {/* Reassurance + Close */}
              <p className="text-center text-[10px] text-gray-500 mb-3">
                🔐 Secure checkout · Cancel anytime
              </p>
              <button
                onClick={() => {
                  playSound('click')
                  setShowDeclineOffer(true)
                }}
                className="w-full py-3 text-sm text-gray-500 font-medium transition-all active:opacity-60"
              >
                Not now
              </button>
            </div>
          </div>
        )}
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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
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
    const modeAccent = scores.roastMode ? '#ff4444' : '#00d4ff'

    return (
      <div className="min-h-screen flex flex-col items-center p-4 overflow-x-hidden" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
      }}>
        {/* OVERALL SCORE - BIG at TOP */}
        <div className={`relative mb-3 transition-all duration-700 ${revealStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke={scoreColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${scores.overall * 2.83} 283`}
                style={{
                  transition: 'stroke-dasharray 1s ease-out',
                  filter: `drop-shadow(0 0 15px ${scoreColor})`
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black" style={{ color: scoreColor }}>{scores.overall}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>/100</span>
            </div>
          </div>
        </div>

        {/* Verdict - Large & Punchy */}
        <div className={`transition-all duration-700 delay-100 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xl font-black text-white text-center mb-2 px-6" style={{
            textShadow: `0 0 30px ${modeAccent}66`,
            lineHeight: 1.3
          }}>
            {scores.verdict}
          </p>
        </div>

        {/* Social Proof */}
        <div className={`mb-4 transition-all duration-500 delay-200 text-center ${revealStage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm font-bold mb-1" style={{
            color: scores.overall >= 80 ? '#00ff88' : (scores.overall >= 60 ? '#00d4ff' : '#ff6b6b')
          }}>
            {(() => {
              if (scores.roastMode) {
                if (scores.overall >= 60) return '😏 You survived'
                if (scores.overall >= 45) return '💀 Rough day for your closet'
                return '☠️ AI showed no mercy'
              } else if (scores.mode === 'honest') {
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

        {/* PHOTO & MAIN RESULT CARD */}
        <div className={`w-full max-w-xs mb-6 transition-all duration-700 delay-300 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <button
            onClick={generateShareCard}
            className="card-physical w-full p-4 group relative overflow-hidden active:scale-[0.98] transition-all text-left"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: `0 20px 50px rgba(0,0,0,0.3), inset 0 0 40px ${modeAccent}11`
            }}
          >
            <div className="flex gap-4 items-center">
              <div className="w-24 h-32 rounded-xl overflow-hidden shadow-2xl flex-shrink-0" style={{ border: `1px solid ${scoreColor}44` }}>
                <img src={uploadedImage} alt="Your fit" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black tracking-widest text-white/30 uppercase mb-2">Style Analysis</p>
                <p className="text-sm font-bold text-white mb-2 leading-tight">"{scores.tip}"</p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-bold uppercase">{scores.aesthetic}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 font-bold uppercase">{scores.celebMatch}</span>
                </div>
              </div>
            </div>
            <p className="text-center text-[11px] font-black text-white/40 uppercase tracking-widest mt-4 group-active:text-white/60">Tap to share</p>
          </button>
        </div>

        {/* GOLDEN INSIGHT (PRO) OR TEASER (FREE) */}
        <div className={`w-full max-w-xs mb-6 transition-all duration-700 delay-500 ${revealStage >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {isPro ? (
            <div className="card-physical p-5 border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_40px_rgba(0,212,255,0.15)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm">✨</span>
                <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">Golden Insight</span>
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
          ) : (
            <button
              onClick={() => setShowPaywall(true)}
              className="card-physical w-full p-5 border-dashed border-cyan-500/30 bg-cyan-500/5 active:scale-[0.98] transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🔒</span>
                  <span className="text-[10px] font-black tracking-widest text-cyan-400 uppercase">Pro Benefits</span>
                </div>
                <span className="text-[10px] font-black text-cyan-400">UNLOCK</span>
              </div>
              <div className="space-y-4 mb-4 text-left">
                <div>
                  <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Identity Reflection</span>
                  <div className="h-4 w-full bg-white/5 rounded blur-[4px]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-white/20 uppercase block mb-1">Social Perception</span>
                  <div className="h-4 w-3/4 bg-white/5 rounded blur-[4px]" />
                </div>
              </div>
              <div className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                Unlock Golden Insights 👑
              </div>
            </button>
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
            className="btn-physical animate-pulse-glow w-full py-5 rounded-2xl text-black font-black text-xl flex items-center justify-center gap-3 overflow-hidden group mb-4"
            style={{
              background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
              boxShadow: '0 10px 40px rgba(0, 212, 255, 0.4), var(--shadow-physical)'
            }}
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="text-2xl">📤</span> SHARE THIS FIT
          </button>

          <button
            onClick={resetApp}
            className="btn-physical w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-black uppercase tracking-widest active:bg-white/10 transition-all flex items-center justify-center gap-2"
          >
            <span>🔄</span> Rate Another Fit
          </button>
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
                background: ['#ffd700', '#00ff88', '#00d4ff'][i % 3],
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        <span className="text-7xl mb-6">👗</span>
        <p className="text-xl font-semibold text-white mb-2">{error || "Oops! We couldn't rate that one"}</p>
        <p className="text-sm mb-8 text-center px-4" style={{ color: 'rgba(255,255,255,0.5)' }}>Try a clearer photo or check your connection</p>
        <button
          onClick={resetApp}
          className="btn-physical px-8 py-4 rounded-2xl text-white font-semibold transition-all active:scale-[0.97]"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
            boxShadow: 'var(--shadow-physical), 0 0 30px rgba(0,212,255,0.3)'
          }}
        >
          Try Again
        </button>
      </div>
    )
  }

  // ============================================
  // PRO EMAIL PROMPT SCREEN
  // ============================================
  if (screen === 'pro-email-prompt') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
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
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
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
  // PAYWALL SCREEN - Mobile-Native Bottom Sheet
  // ============================================
  if (screen === 'paywall' || screen === 'limit-reached') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-end p-0" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        {/* Backdrop with photo preview if available */}
        {uploadedImage && (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <img src={uploadedImage} alt="" className="w-64 h-80 object-cover rounded-2xl blur-sm" />
          </div>
        )}

        {/* Bottom Sheet */}
        <div className="w-full max-w-md rounded-t-3xl p-6 pb-10 relative z-10" style={{
          background: 'linear-gradient(180deg, rgba(30,30,45,0.98) 0%, rgba(15,15,25,0.99) 100%)',
          backdropFilter: 'blur(20px)',
          animation: 'slideUp 0.4s ease-out',
          paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 2.5rem))'
        }}>
          {/* Handle bar */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full bg-white/20" />

          {/* Close X button */}
          <button
            onClick={() => setScreen('home')}
            className="absolute top-4 right-4 text-gray-500 hover:text-white text-2xl p-1"
            aria-label="Close"
          >
            ×
          </button>

          {/* Emotional headline */}
          <div className="text-center mb-6 mt-4">
            <span className="text-4xl mb-3 block">{mode === 'roast' ? '🔥' : '✨'}</span>
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === 'roast' ? 'Want the brutal truth?' : 'Ready for more?'}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {timeUntilReset
                ? `Free fits reset in ${timeUntilReset}`
                : 'Get 25 outfit ratings per day'}
            </p>
          </div>

          {/* Purchase Options */}
          <div className="flex flex-col gap-3 mb-5">
            {/* Primary: One-time Pro Roast */}
            <a
              href="https://buy.stripe.com/3cI9AVgJy7wT3v9gDxfYY01"
              className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)',
                boxShadow: '0 8px 30px rgba(255,68,68,0.3)'
              }}
            >
              🔥 Roast this one · $0.99
            </a>

            {/* Secondary: Pro subscription */}
            <a
              href="https://buy.stripe.com/5kQ28tdxm3gD6HlgDxfYY02"
              className="w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                boxShadow: '0 8px 30px rgba(0,212,255,0.3)'
              }}
            >
              ⚡ FitRate Pro · $2.99/week
            </a>
          </div>

          {/* Trust microcopy */}
          <p className="text-center text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Cancel anytime. No commitment.
          </p>

          {/* Back button */}
          <button
            onClick={() => setScreen('home')}
            className="w-full py-3 text-sm font-medium transition-all active:opacity-60"
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
          setScreen('share-success')
        } catch (err) {
          if (err.name !== 'AbortError') {
            // Fallback: download + copy
            downloadImage(shareData.imageBlob, shareData.text)
            showCopiedToast('Image saved! Caption copied ✅')
          }
        }
      } else {
        // Desktop fallback
        downloadImage(shareData.imageBlob, shareData.text)
        navigator.clipboard.writeText(shareData.text)
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
      } catch (err) {
        showCopiedToast("Couldn't copy 😕")
      }
    }

    const shareToTwitter = () => {
      const text = encodeURIComponent(getShareText())
      const url = encodeURIComponent(getShareUrl())
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
    }

    const shareToFacebook = () => {
      const url = encodeURIComponent(getShareUrl())
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
    }

    const shareToReddit = () => {
      const title = encodeURIComponent(getShareText())
      const url = encodeURIComponent(getShareUrl())
      window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank')
    }

    const shareToSMS = () => {
      const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`)
      // Use different format for iOS vs Android
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
      window.location.href = isIOS ? `sms:&body=${text}` : `sms:?body=${text}`
    }

    const shareToWhatsApp = () => {
      const text = encodeURIComponent(`${getShareText()}\n${getShareUrl()}`)
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    // Check if native share is available
    const hasNativeShare = typeof navigator.share === 'function'

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f] text-white p-6" style={{
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
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

        {/* Format Toggle - Stories (9:16) vs Feed (1:1) */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              playSound('click')
              setShareFormat('story')
              // Regenerate card for new format
              generateShareCard()
            }}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: shareFormat === 'story' ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.05)',
              border: shareFormat === 'story' ? '1px solid #00d4ff' : '1px solid rgba(255,255,255,0.1)',
              color: shareFormat === 'story' ? '#00d4ff' : 'rgba(255,255,255,0.5)'
            }}
          >
            9:16
          </button>
          <button
            onClick={() => {
              playSound('click')
              setShareFormat('feed')
              // Regenerate card for new format
              generateShareCard()
            }}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              background: shareFormat === 'feed' ? 'rgba(0,212,255,0.3)' : 'rgba(255,255,255,0.05)',
              border: shareFormat === 'feed' ? '1px solid #00d4ff' : '1px solid rgba(255,255,255,0.1)',
              color: shareFormat === 'feed' ? '#00d4ff' : 'rgba(255,255,255,0.5)'
            }}
          >
            1:1
          </button>
        </div>

        {/* Share Card Preview */}
        <div className={`relative rounded-2xl overflow-hidden shadow-2xl mb-6 ${shareFormat === 'feed' ? 'w-[180px] aspect-square' : 'w-[50%] max-w-[180px] aspect-[9/16]'}`} style={{
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
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
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
        backdropFilter: 'blur(10px)'
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

          <div className="text-center mb-6">
            <span className="text-4xl mb-2 block">👑</span>
            <h2 className="text-white text-2xl font-black">Go Pro</h2>
            <p className="text-gray-400 text-sm mt-1">Unlock 25 scans per day</p>
          </div>

          {/* Pro Subscription Hero Card */}
          <div className="relative w-full mb-6">
            <button
              onClick={() => startCheckout('proWeekly')}
              disabled={checkoutLoading}
              className="btn-physical w-full p-6 pb-8 rounded-3xl text-left transition-all group overflow-visible"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #0077ff 100%)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: 'var(--shadow-physical), 0 0 40px rgba(0,212,255,0.2)'
              }}
            >
              {/* Shine effect */}
              <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 group-hover:left-full transition-all duration-1000" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-white text-2xl font-black leading-tight">Elite Pro</h3>
                  <p className="text-white/70 text-sm">Full psycho-analysis access</p>
                </div>
                <span className="text-3xl">👑</span>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  '🤖 Premium GPT-4o AI',
                  '25 outfit ratings/day',
                  'Identity Reflection Insights',
                  'Social Perception Analysis',
                  'All Modes: Roast, Honest, Nice, Savage'
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-bold text-white/90">
                    <span className="text-white">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-white">$2.99</span>
                <span className="text-white/60 text-sm mb-1 pb-1">/ week</span>
                <span className="ml-auto text-[10px] font-black px-2 py-1 rounded-full bg-white/20 text-white uppercase tracking-wider">
                  Most Popular
                </span>
              </div>
            </button>
          </div>

          <p className="text-center text-[10px] font-bold text-gray-500 mb-4 tracking-widest uppercase">— OR GRAB A SCAN PACK —</p>


          {/* Scan Packs Section - Supercell Style Loot Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* Starter Pack */}
            <button
              onClick={() => startCheckout('starterPack')}
              disabled={checkoutLoading}
              className="btn-physical p-4 rounded-2xl text-center flex flex-col items-center justify-between min-h-[110px]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span className="block text-2xl font-black text-white">5</span>
              <span className="block text-[9px] text-gray-500 uppercase font-black">scans</span>
              <span className="block text-sm font-bold text-white mt-1">$1.99</span>
            </button>

            {/* Popular Pack - Supercell Highlight */}
            <button
              onClick={() => startCheckout('popularPack')}
              disabled={checkoutLoading}
              className="btn-physical p-4 rounded-2xl text-center flex flex-col items-center justify-between min-h-[110px] relative overflow-hidden"
              style={{
                background: 'rgba(0,212,255,0.1)',
                border: '2px solid #00d4ff',
                boxShadow: 'var(--shadow-physical), 0 0 20px rgba(0,212,255,0.2)'
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-cyan-400" />
              <span className="block text-3xl font-black text-cyan-400">15</span>
              <span className="block text-[9px] text-cyan-400/70 uppercase font-black">scans</span>
              <span className="block text-sm font-bold text-white mt-1">$3.99</span>
            </button>

            {/* Power Pack */}
            <button
              onClick={() => startCheckout('powerPack')}
              disabled={checkoutLoading}
              className="btn-physical p-4 rounded-2xl text-center flex flex-col items-center justify-between min-h-[110px]"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <span className="block text-2xl font-black text-white">50</span>
              <span className="block text-[9px] text-gray-500 uppercase font-black">scans</span>
              <span className="block text-sm font-bold text-white mt-1">$9.99</span>
            </button>
          </div>

          {/* SAVAGE Roast option */}
          <button
            onClick={() => startCheckout('proRoast')}
            disabled={checkoutLoading}
            className="btn-responsive-text btn-multi-line w-full py-4 rounded-2xl text-red-400 font-bold text-sm mb-4 transition-all duration-100 active:scale-[0.97] disabled:opacity-50"
            style={{
              background: 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.25)'
            }}
          >
            💀 Or get 1 SAVAGE Roast for $0.99
          </button>

          {/* Invite 3 → Get 15 Free Scans */}
          <div className="w-full p-4 rounded-2xl mb-4" style={{
            background: 'rgba(0,255,136,0.06)',
            border: '1px dashed rgba(0,255,136,0.3)'
          }}>
            <p className="text-center text-xs text-green-400/80 mb-2">🎁 OR GET FREE SCANS</p>
            <p className="text-center text-white text-sm font-bold mb-2">
              Invite 3 friends → Get 15 free scans
            </p>
            <div className="flex items-center justify-center gap-1 mb-3">
              {[0, 1, 2].map(i => {
                const totalReferrals = parseInt(localStorage.getItem('fitrate_total_referrals') || '0')
                const filled = i < totalReferrals
                return (
                  <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{
                    background: filled ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)',
                    border: filled ? '2px solid #00ff88' : '2px solid rgba(255,255,255,0.2)'
                  }}>
                    {filled ? '✓' : '?'}
                  </div>
                )
              })}
            </div>
            <button
              onClick={async () => {
                const shareUrl = `https://fitrate.app?ref=${userId}`
                if (navigator.share) {
                  navigator.share({ title: 'Rate my fit!', url: shareUrl })
                } else {
                  await navigator.clipboard.writeText(shareUrl)
                  displayToast('Link copied! 📋')
                }
              }}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-all duration-100 active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)',
                color: '#000'
              }}
            >
              Share & Invite Friends 🚀
            </button>
          </div>

          {/* Reassurance + Close */}
          <p className="text-center text-[10px] text-gray-500 mb-3">
            🔐 Secure checkout · Cancel anytime
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
