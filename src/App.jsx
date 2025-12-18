import React, { useState, useRef, useCallback, useEffect } from 'react'
import { playSound, vibrate } from './utils/soundEffects'

// API endpoints
const API_URL = import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze'
const API_BASE = API_URL.replace('/api/analyze', '/api')

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

// Helper: Random share tips for virality
const SHARE_TIPS = [
  "Challenge a friend to beat this 👀",
  "Post to your story 📸",
  "Tag someone who needs a rating",
  "Drop this in the group chat",
  "Your followers need to see this",
  "This score goes crazy",
  "Bet you can't get higher 🔥",
  "Send to someone who thinks they dress better",
  "Post it 😏",
  "Your friends need to try this"
]

const getRandomShareTip = () => SHARE_TIPS[Math.floor(Math.random() * SHARE_TIPS.length)]

export default function App() {
  const [screen, setScreen] = useState('home')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [scores, setScores] = useState(null)
  const [shareData, setShareData] = useState(null)
  const [mode, setMode] = useState('nice') // 'nice', 'honest', or 'roast'
  const [error, setError] = useState(null)
  const [revealStage, setRevealStage] = useState(0)
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')
  const [proEmail, setProEmail] = useState(() => localStorage.getItem('fitrate_email') || '')
  const [emailInput, setEmailInput] = useState('')
  const [emailChecking, setEmailChecking] = useState(false)
  const [referralCount, setReferralCount] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Challenge a Friend (score from URL)
  const [challengeScore, setChallengeScore] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    return parseInt(params.get('challenge')) || null
  })

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
  const cameraInputRef = useRef(null)
  const [showCameraChoice, setShowCameraChoice] = useState(false)

  // User ID for referrals
  const [userId] = useState(() => {
    let id = localStorage.getItem('fitrate_user_id')
    if (!id) {
      id = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
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
        headers: { 'Content-Type': 'application/json' },
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
          }
        })
        .catch(console.error)
    }
  }, [userId])

  // Check if email is Pro
  const checkProStatus = async (email) => {
    try {
      setEmailChecking(true)
      const response = await fetch(`${API_BASE}/pro/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    const isNowPro = await checkProStatus(emailInput.trim())
    if (isNowPro) {
      setScreen('pro-welcome')
    } else {
      // Email not found yet - might take a moment for webhook
      // Save email anyway and mark as Pro (trust the redirect)
      localStorage.setItem('fitrate_pro', 'true')
      localStorage.setItem('fitrate_email', emailInput.toLowerCase().trim())
      setIsPro(true)
      setProEmail(emailInput.toLowerCase().trim())
      setScreen('pro-welcome')
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
      "Bro really said 'I'll figure it out later' 💀",
      "The colors are in a toxic relationship",
      "This fit is giving... participation trophy",
      "Outfit said 'I have food at home'",
      "The dryer ate better fits than this",
      "Pinterest fail but make it fashion",
      "The fit that texts back 'k'",
      "This outfit has a 2.3 GPA 📉",
      "Sir this is a Wendy's 💀",
      "Main NPC energy tbh",
      "Giving clearance rack at 9pm",
      "The algorithm buried this one",
      "This fit ghosted the vibe check",
      "Colors are screaming for help",
      "You wore this on purpose? 💀",
      "Fabric said 'I give up'",
      "The fit forgot the assignment",
      "This is a cry for help",
      "Outfit buffering... forever",
      "Did the lighting dirty you or... 😬",
      "Proportions left the chat",
      "This fit has a villain origin story",
      "Styled by throwing darts at the closet",
      "The vibes are confused and scared"
    ]

    const niceVerdicts = [
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
      "The drip is real 💧",
      "Outfit understood the assignment",
      "You chose fashion today",
      "The fit ate",
      "That friend everyone screenshots",
      "Effortless but intentional",
      "Pinterest would be proud",
      "Straight off a mood board",
      "The silhouette is perfect",
      "Casual done right",
      "Nailed it 🎯",
      "Main character rights earned"
    ]

    const shareTips = [
      "Challenge a friend to beat this 👀",
      "Post to your story 📸",
      "Tag someone who needs a rating",
      "Drop this in the group chat",
      "Your followers need to see this",
      "This score goes crazy",
      "Bet you can't get higher 🔥",
      "Send to someone who thinks they dress better",
      "Post it 😏",
      "Your friends need to try this"
    ]

    const roastTips = [
      "Start over. Please.",
      "Have you considered... literally anything else?",
      "Less is more. Way less.",
      "Google 'how to dress' and return",
      "Maybe try the other shirt next time",
      "The fit clinic is now open 💀",
      "Iron exists for a reason bestie",
      "Delete this and try again",
      "Stick to monochrome for a bit",
      "Accessories can't save this"
    ]

    const niceTips = [
      "Cuff the jeans for cleaner lines",
      "A chunky watch would elevate",
      "Try layering with a light jacket",
      "White sneakers would slap here",
      "Add a simple chain necklace",
      "Roll those sleeves up 🔥",
      "This with sunglasses = 💯",
      "The right bag would complete this",
      "Try French tucking the shirt",
      "Add a belt to define the waist"
    ]

    const honestVerdicts = [
      "Solid, but room to improve",
      "Almost there, just needs polish",
      "Good bones, execution varies",
      "The vision is there 📊",
      "Practical but not memorable",
      "Safe choice, nothing wrong",
      "Shows effort, needs refinement",
      "Close but missing something",
      "Functional, not exceptional",
      "Average execution of good idea"
    ]

    const honestTips = [
      "The proportions need work",
      "Consider a different wash",
      "Colors are fighting a bit",
      "Fit could be more intentional",
      "Accessories would help here",
      "Try a different silhouette",
      "The layers need balance",
      "Consider tailoring this piece",
      "Material upgrade would help",
      "Simpler might be better here"
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
          headers: { 'Content-Type': 'application/json' },
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
          shareTip: getRandomShareTip()
        }

        setScores(scores)
        setScreen('results')
        return
      } catch (err) {
        console.error('Analysis error:', err)
        setError("Connection issue... try again!")
        setScreen('error')
        return
      }
    }

    // Pro users: call real AI
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setError("AI's getting dressed... try again!")
      setScreen('error')
    }
  }, [mode, isPro, generateMockScores])

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Please use under 10MB.')
        setScreen('error')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        playSound('shutter')
        vibrate(50)
        setUploadedImage(e.target?.result)
        analyzeOutfit(e.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }, [analyzeOutfit])

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
    canvas.width = 1080
    canvas.height = 1920

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

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920)
    gradient.addColorStop(0, '#0a0a0f')
    gradient.addColorStop(0.4, modeColors.mid)
    gradient.addColorStop(1, '#0a0a0f')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1920)

    // Glow effect behind card
    const glowColor = modeColors.glow
    ctx.shadowColor = glowColor
    ctx.shadowBlur = 120
    ctx.fillStyle = 'rgba(255,255,255,0.03)'
    ctx.beginPath()
    ctx.roundRect(60, 120, 960, 1520, 48)
    ctx.fill()
    ctx.shadowBlur = 0

    // Glassmorphism card
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath()
    ctx.roundRect(60, 120, 960, 1520, 48)
    ctx.fill()

    // Border glow
    ctx.strokeStyle = scores.roastMode ? 'rgba(255,68,68,0.6)' : 'rgba(0,212,255,0.6)'
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

    // Draw photo with rounded corners
    const imgWidth = 580
    const imgHeight = 720
    const imgX = (1080 - imgWidth) / 2
    const imgY = 180

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

    // Score circle with glow
    const scoreColor = scores.overall >= 80 ? '#00ff88' : scores.overall >= 60 ? '#00d4ff' : '#ff4444'
    ctx.shadowColor = scoreColor
    ctx.shadowBlur = 40
    ctx.beginPath()
    ctx.arc(540, 980, 100, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.8)'
    ctx.fill()
    ctx.strokeStyle = scoreColor
    ctx.lineWidth = 8
    ctx.stroke()
    ctx.shadowBlur = 0

    // Score number - BIG
    ctx.fillStyle = scoreColor
    ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(scores.overall, 540, 1000)

    // "/100" below score
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('/100', 540, 1040)

    // Verdict - HUGE and punchy
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 46px -apple-system, BlinkMacSystemFont, sans-serif'
    // Word wrap for long verdicts
    const maxWidth = 900
    const verdictLines = wrapText(ctx, scores.verdict, maxWidth)
    verdictLines.forEach((line, i) => {
      ctx.fillText(line, 540, 1140 + (i * 52))
    })

    // Aesthetic + Celeb in pill style
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.beginPath()
    ctx.roundRect(140, 1220, 800, 50, 25)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = '26px -apple-system, BlinkMacSystemFont, sans-serif'
    const celebText = scores.celebMatch
    ctx.fillText(`${scores.aesthetic} • ${celebText}`, 540, 1255)

    // Challenge text - THE VIRAL HOOK
    ctx.fillStyle = modeColors.light
    ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(viralCaption, 540, 1350)

    // Hashtags
    ctx.fillStyle = modeColors.accent
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(hashtags, 540, 1420)

    // Call to action box
    ctx.fillStyle = modeColors.glow.replace('0.4', '0.2')
    ctx.beginPath()
    ctx.roundRect(180, 1480, 720, 100, 20)
    ctx.fill()
    ctx.strokeStyle = modeColors.glow.replace('0.4', '0.5')
    ctx.lineWidth = 2
    ctx.stroke()

    // CTA text - Made to screenshot positioning
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('Your turn → fitrate.app', 540, 1545)

    // Branding footer
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('Rate your fit in seconds', 540, 1620)

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
  }, [uploadedImage, scores, userId])

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

  const resetApp = useCallback(() => {
    setScreen('home')
    setUploadedImage(null)
    setScores(null)
    setError(null)
    setRevealStage(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
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

  // Analysis messages for analyzing screen
  const analysisMessages = mode === 'roast'
    ? ['Scanning for violations...', 'Checking color crimes...', 'Analyzing fit fails...', 'Computing roast level...', 'Preparing verdict...']
    : mode === 'honest'
      ? ['Assessing objectively...', 'Checking proportions...', 'Analyzing honestly...', 'Computing real score...', 'Preparing honest feedback...']
      : ['Checking color harmony...', 'Analyzing silhouette...', 'Reading the vibe...', 'Scanning for drip...', 'Computing fit score...']

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

        {/* Hidden inputs - one for camera, one for gallery */}
        <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileUpload} className="hidden" />
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        {/* Camera/Gallery Choice Modal (Desktop) */}
        {showCameraChoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowCameraChoice(false)}>
            <div className="bg-[#1a1a2e] rounded-3xl p-8 max-w-sm w-full mx-4 border border-white/10" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-white text-center mb-6">How do you want to upload?</h3>

              <button
                onClick={() => {
                  setShowCameraChoice(false)
                  cameraInputRef.current?.click()
                }}
                className="w-full py-4 mb-3 rounded-2xl text-white font-semibold flex items-center justify-center gap-3 transition-all active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${accent} 0%, ${mode === 'roast' ? '#ff0080' : '#00ff88'} 100%)`,
                  boxShadow: `0 8px 30px ${accentGlow}`
                }}
              >
                <span className="text-2xl">📸</span>
                Take a Photo
              </button>

              <button
                onClick={() => {
                  setShowCameraChoice(false)
                  fileInputRef.current?.click()
                }}
                className="w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-3 transition-all active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <span className="text-2xl">🖼️</span>
                Choose from Gallery
              </button>

              <button
                onClick={() => setShowCameraChoice(false)}
                className="w-full mt-4 py-2 text-sm transition-all"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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

        <p className="text-xs mb-8 tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Post it... or let us roast it first 😈
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

        {/* HERO CTA - HUGE "Rate My Fit" button */}
        <button
          onClick={() => {
            playSound('click')
            vibrate(20)
            if (scansRemaining > 0 || isPro) {
              // Check if mobile (has touch + small screen = go straight to camera)
              const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768
              if (isMobile) {
                cameraInputRef.current?.click()
              } else {
                // Desktop: show choice modal
                setShowCameraChoice(true)
              }
            } else {
              setScreen('paywall')
            }
          }}
          disabled={scansRemaining === 0 && !isPro}
          className="relative w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 disabled:opacity-40 group"
          style={{
            background: `radial-gradient(circle, ${getModeGlow()} 0%, transparent 70%)`,
            border: `3px solid ${accent}99`,
            boxShadow: `0 0 80px ${accentGlow}, inset 0 0 80px rgba(255,255,255,0.03)`
          }}
        >
          {/* Pulsing inner glow */}
          <div className="absolute inset-4 rounded-full transition-all duration-300 group-hover:scale-105 group-active:scale-95" style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${mode === 'roast' ? '#ff0080' : mode === 'honest' ? '#00d4ff' : '#00ff88'} 100%)`,
            boxShadow: `0 0 60px ${accentGlow}`,
            animation: 'pulse 2s ease-in-out infinite'
          }} />

          {/* Icon */}
          <span className="relative text-7xl mb-3 drop-shadow-lg">
            {mode === 'roast' ? '🔥' : mode === 'honest' ? '📊' : '📸'}
          </span>
          <span className="relative text-white text-xl font-black tracking-wider">
            {mode === 'roast' ? 'ROAST MY FIT' : mode === 'honest' ? 'REAL TALK' : 'RATE MY FIT'}
          </span>
        </button>

        {/* Three-Mode Selector Pills */}
        <div className="mt-10 flex items-center gap-2 p-1 rounded-full" style={{
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
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300"
              style={{
                background: mode === m.key
                  ? m.key === 'roast' ? 'rgba(255,68,68,0.3)'
                    : m.key === 'honest' ? 'rgba(74,144,217,0.3)'
                      : 'rgba(0,212,255,0.3)'
                  : 'transparent',
                border: mode === m.key
                  ? `1px solid ${m.key === 'roast' ? '#ff4444' : m.key === 'honest' ? '#4A90D9' : '#00d4ff'}`
                  : '1px solid transparent'
              }}
            >
              <span className={`text-lg transition-opacity ${mode === m.key ? 'opacity-100' : 'opacity-50'}`}>
                {m.emoji}
              </span>
              <span className={`text-sm font-medium transition-opacity ${mode === m.key ? 'opacity-100 text-white' : 'opacity-50 text-gray-400'}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>

        {/* Trust Message */}
        <p className="mt-6 text-[10px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
          <span>🔒</span> Photos analyzed instantly, never stored
        </p>

        {/* Scan Status - Tiny, non-intrusive */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center" style={{
          paddingBottom: 'max(4rem, env(safe-area-inset-bottom, 4rem))'
        }}>
          {scansRemaining > 0 || isPro ? (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isPro ? '⚡ Unlimited scans' : `${scansRemaining} free fit${scansRemaining !== 1 ? 's' : ''} today`}
            </p>
          ) : (
            <button
              onClick={() => setScreen('paywall')}
              className="flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95"
              style={{
                background: 'rgba(255,68,68,0.1)',
                border: '1px solid rgba(255,68,68,0.3)'
              }}
            >
              <span className="text-xs font-medium" style={{ color: '#ff6b6b' }}>
                Free fits reset in {timeUntilReset} · Get Pro
              </span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4" style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0.5rem)'
        }}>
          <a href="/privacy" className="text-[10px] transition-opacity hover:opacity-70" style={{ color: 'rgba(255,255,255,0.3)' }}>Privacy</a>
          <a href="/terms" className="text-[10px] transition-opacity hover:opacity-70" style={{ color: 'rgba(255,255,255,0.3)' }}>Terms</a>
          <a href="/about" className="text-[10px] transition-opacity hover:opacity-70" style={{ color: 'rgba(255,255,255,0.3)' }}>About</a>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.02); }
          }
        `}</style>
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
      <div className="min-h-screen flex flex-col items-center p-4 overflow-hidden" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
      }}>
        {/* OVERALL SCORE - BIG at TOP */}
        <div className={`relative mb-3 transition-all duration-700 ${revealStage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
          <div className="relative w-32 h-32">
            {/* Animated score ring */}
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
            {/* Score number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black" style={{ color: scoreColor }}>{scores.overall}</span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>/100</span>
            </div>
          </div>
        </div>

        {/* Verdict - Huge & Punchy */}
        <div className={`transition-all duration-700 delay-100 ${revealStage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-xl font-black text-white text-center mb-2 px-6" style={{
            textShadow: `0 0 30px ${modeAccent}66`,
            lineHeight: 1.3
          }}>
            {scores.verdict}
          </p>
        </div>

        {/* Viral hook + Percentile social proof */}
        <div className={`mb-3 transition-all duration-500 delay-200 ${revealStage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-sm font-bold mb-1" style={{
            color: scores.overall >= 80 ? '#00ff88' : (scores.overall >= 60 ? '#00d4ff' : '#ff6b6b')
          }}>
            {scores.overall >= 85 ? '🔥 This would go VIRAL' : (scores.overall >= 70 ? '👀 TikTok-worthy' : '😬 Room for improvement')}
          </p>
          <p className="text-xs font-medium" style={{
            color: scores.isLegendary ? '#ffd700' : 'rgba(255,255,255,0.5)',
            textShadow: scores.isLegendary ? '0 0 10px #ffd700' : 'none'
          }}>
            {scores.isLegendary ? "🌟 TOP 1% OF ALL TIME" : `Better than ${scores.percentile}% today`}
          </p>
        </div>

        {/* Photo - Smaller, clean */}
        <div className={`relative mb-3 transition-all duration-700 delay-300 ${revealStage >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className="w-36 h-48 rounded-2xl overflow-hidden" style={{
            boxShadow: `0 10px 40px ${scoreColor}33`,
            border: `2px solid ${scoreColor}44`
          }}>
            <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Aesthetic + Celeb Badge */}
        <div className={`mb-3 transition-all duration-500 delay-400 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {scores.aesthetic} • {scores.celebMatch}
            </span>
          </div>
        </div>

        {/* Sub-scores - Horizontal bars */}
        <div className={`w-full max-w-xs mb-3 transition-all duration-500 delay-500 ${revealStage >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Color', score: scores.color },
              { label: 'Fit', score: scores.fit },
              { label: 'Style', score: scores.style }
            ].map((item) => (
              <div key={item.label} className="text-center p-2 rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)'
              }}>
                <p className="text-[10px] mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
                <p className="text-lg font-bold" style={{ color: getScoreColor(item.score) }}>{item.score}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ONE Tip - Short & Readable */}
        <div className={`w-full max-w-xs mb-4 transition-all duration-500 delay-600 ${revealStage >= 4 ? 'opacity-100' : 'opacity-0'}`}>
          <div className="px-4 py-2.5 rounded-xl text-center" style={{
            background: `rgba(${scores.roastMode ? '255,68,68' : '0,212,255'},0.1)`,
            border: `1px solid rgba(${scores.roastMode ? '255,68,68' : '0,212,255'},0.2)`
          }}>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {scores.roastMode ? '💀 ' : '💡 '}{scores.tip}
            </p>
          </div>
        </div>

        {/* PRO EXCLUSIVE: Savage Level + Item Roasts */}
        {scores.savageLevel && (
          <div className={`w-full max-w-xs mb-4 transition-all duration-500 delay-700 ${revealStage >= 5 ? 'opacity-100' : 'opacity-0'}`}>
            {/* Pro Badge */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="px-2 py-1 rounded-full text-[10px] font-bold" style={{
                background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
                color: '#000'
              }}>⚡ PRO ANALYSIS</span>
            </div>

            {/* Savage Level Meter */}
            <div className="mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)' }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Savage Level</span>
                <span className="text-lg font-black" style={{ color: '#ff4444' }}>{scores.savageLevel}/10 🔥</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${scores.savageLevel * 10}%`,
                  background: 'linear-gradient(90deg, #ff4444 0%, #ff0080 100%)'
                }} />
              </div>
            </div>

            {/* Item-by-Item Roasts */}
            {scores.itemRoasts && (
              <div className="space-y-2 mb-3">
                {Object.entries(scores.itemRoasts).filter(([_, roast]) => roast && roast !== 'N/A').map(([item, roast]) => (
                  <div key={item} className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <span className="text-[10px] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>{item}</span>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{roast}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Worst Celeb Comparison */}
            {scores.worstCelebComparison && (
              <div className="px-3 py-2 rounded-lg text-center" style={{ background: 'rgba(255,68,68,0.05)', border: '1px dashed rgba(255,68,68,0.3)' }}>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>NOT giving:</span>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,68,68,0.9)' }}>{scores.worstCelebComparison}</p>
              </div>
            )}
          </div>
        )}

        {/* SHARE BUTTON - PRIMARY CTA, Above Fold */}
        <div className={`w-full max-w-xs transition-all duration-700 delay-700 ${revealStage >= 5 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <button
            onClick={generateShareCard}
            className="w-full py-4 rounded-2xl text-white text-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${modeAccent} 0%, ${scores.roastMode ? '#ff0080' : '#00ff88'} 100%)`,
              boxShadow: `0 8px 30px ${modeAccent}44`,
              animation: 'pulseGlow 2s ease-in-out infinite'
            }}
          >
            <span className="text-xl">📤</span> Share to Story
          </button>

          {/* Challenge a Friend Button */}
          <button
            onClick={async () => {
              playSound('click')
              vibrate(20)

              // Generate the share card first if we have shareData, otherwise use existing
              if (shareData?.imageBlob) {
                // We already have a share card image, share it with challenge text
                const challengeUrl = `${window.location.origin}?challenge=${scores.overall}`
                const challengeText = `I got ${scores.overall}/100 on FitRate! Think you can beat it? 👊`

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [shareData.file] })) {
                  try {
                    await navigator.share({
                      title: `Can you beat ${scores.overall}?`,
                      text: challengeText,
                      url: challengeUrl,
                      files: [shareData.file]
                    })
                  } catch (e) {
                    // User cancelled or error
                    console.log('Share cancelled or failed:', e)
                  }
                } else {
                  // Fallback: download image + copy link
                  const url = URL.createObjectURL(shareData.imageBlob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'fitrate-challenge.png'
                  a.click()
                  URL.revokeObjectURL(url)
                  navigator.clipboard.writeText(`${challengeText}\n${challengeUrl}`)
                  displayToast('Challenge saved & copied! 📤')
                }
              } else {
                // No share card yet, generate it first then share
                generateShareCard()
              }
            }}
            className="w-full max-w-xs py-3 mt-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)'
            }}
          >
            <span>👊</span> Challenge a Friend
          </button>

          <p className="text-center text-[11px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Share your score card & challenge link
          </p>
        </div>

        {/* Rate Again - Subtle */}
        <button
          onClick={resetApp}
          className="mt-3 text-xs font-medium transition-all active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          ← Rate Another
        </button>

        {/* Confetti for 90+ */}
        {scores.overall >= 90 && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  width: `${6 + Math.random() * 6}px`,
                  height: `${6 + Math.random() * 6}px`,
                  background: ['#ff4444', '#00d4ff', '#00ff88', '#ffd000', '#ff0080'][Math.floor(Math.random() * 5)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  animation: `confetti ${2 + Math.random() * 1.5}s linear forwards`,
                  animationDelay: `${Math.random() * 0.5}s`
                }}
              />
            ))}
          </div>
        )}

        <style>{`
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 8px 30px ${modeAccent}44; }
            50% { box-shadow: 0 8px 50px ${modeAccent}77; }
          }
          @keyframes confetti {
            0% { transform: translateY(0) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
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
        <p className="text-xl font-semibold text-white mb-2">{error || "Something went wrong"}</p>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Give it another shot</p>
        <button
          onClick={resetApp}
          className="px-8 py-4 rounded-2xl text-white font-semibold transition-all hover:scale-105"
          style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
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
        <h2 className="text-4xl font-black text-white mb-3">Welcome to FitPass!</h2>
        <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          25 AI outfit ratings per day unlocked
        </p>

        <div className="p-6 rounded-2xl mb-8 text-center" style={{
          background: 'rgba(0,255,136,0.1)',
          border: '1px solid rgba(0,255,136,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <p className="text-base" style={{ color: '#00ff88' }}>
            ✨ 25 scans per day<br />
            🤖 Real GPT-4 Vision AI<br />
            🔥 vs 1 free scan for non-Pro
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

          {/* Emotional headline */}
          <div className="text-center mb-6 mt-4">
            <span className="text-4xl mb-3 block">{mode === 'roast' ? '🔥' : '✨'}</span>
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === 'roast' ? 'Want the brutal truth?' : 'Ready for more?'}
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {timeUntilReset
                ? `Free fits reset in ${timeUntilReset}`
                : 'Unlock unlimited outfit ratings'}
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
              ⚡ Pro AI · $2.99/week
            </a>
          </div>

          {/* Trust microcopy */}
          <p className="text-center text-[11px] mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Cancel anytime. No commitment.
          </p>

          {/* Back button */}
          <button
            onClick={resetApp}
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

    const shareToTwitter = () => {
      const tweetText = encodeURIComponent(shareData.text)
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
    }

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

        {/* Share Card Preview */}
        <div className="relative w-[50%] max-w-[180px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl mb-6" style={{
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
          className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 mb-6"
          style={{
            background: `linear-gradient(135deg, ${scores?.roastMode ? '#ff4444' : '#00d4ff'} 0%, ${scores?.roastMode ? '#ff0080' : '#00ff88'} 100%)`,
            boxShadow: `0 8px 30px ${scores?.roastMode ? 'rgba(255,68,68,0.4)' : 'rgba(0,212,255,0.4)'}`
          }}
        >
          <span className="text-xl">📤</span> Share with Image
        </button>

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
              resetApp()
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
          onClick={resetApp}
          className="text-sm font-medium transition-all active:opacity-60"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Done
        </button>
      </div>
    )
  }

  return null
}
