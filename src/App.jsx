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

export default function App() {
  const [screen, setScreen] = useState('home')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [scores, setScores] = useState(null)
  const [shareData, setShareData] = useState(null)
  const [roastMode, setRoastMode] = useState(false)
  const [error, setError] = useState(null)
  const [revealStage, setRevealStage] = useState(0)
  const [timeUntilReset, setTimeUntilReset] = useState('')
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')
  const [proEmail, setProEmail] = useState(() => localStorage.getItem('fitrate_email') || '')
  const [emailInput, setEmailInput] = useState('')
  const [emailChecking, setEmailChecking] = useState(false)
  const [referralCount, setReferralCount] = useState(0)

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
      if (date === today) return Math.max(0, 1 - count)
    }
    return 1
  })

  const fileInputRef = useRef(null)

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
              alert("🎉 You got a bonus scan for using an invite link!")
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

    // Wider score range for variety
    const baseScore = roastMode
      ? Math.floor(Math.random() * 35) + 40  // 40-74 for roast
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

    return {
      overall: finalScore,
      color: Math.min(100, Math.max(0, finalScore + colorVariance)),
      fit: Math.min(100, Math.max(0, finalScore + fitVariance)),
      style: Math.min(100, Math.max(0, finalScore + styleVariance)),
      occasion: Math.min(100, Math.max(0, finalScore + Math.floor(Math.random() * 16) - 8)),
      trend: Math.min(100, Math.max(0, finalScore + Math.floor(Math.random() * 16) - 8)),
      verdict: isLegendary
        ? legendaryVerdicts[Math.floor(Math.random() * legendaryVerdicts.length)]
        : pickUnique(roastMode ? roastVerdicts : niceVerdicts, roastMode ? 'roast_verdict' : 'nice_verdict'),
      tip: pickUnique(roastMode ? roastTips : niceTips, roastMode ? 'roast_tip' : 'nice_tip'),
      shareTip: pickUnique(shareTips, 'share_tip'),
      aesthetic: pickUnique(AESTHETICS, 'aesthetic'),
      celebMatch: pickUnique(CELEBRITIES, 'celeb'),
      percentile: getPercentile(finalScore),
      isLegendary,
      roastMode,
      timestamp: Date.now()
    }
  }, [roastMode])

  const incrementScanCount = () => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('fitrate_scans')
    let count = 1
    if (stored) {
      const { date, count: storedCount } = JSON.parse(stored)
      if (date === today) count = storedCount + 1
    }
    localStorage.setItem('fitrate_scans', JSON.stringify({ date: today, count }))
    setScansRemaining(Math.max(0, 1 - count))
  }

  const analyzeOutfit = useCallback(async (imageData) => {
    setScreen('analyzing')
    setError(null)

    // Optimistic check
    if (!isPro && scansRemaining <= 0) {
      setScreen('limit-reached')
      return
    }

    // Free users: call backend to track scan by IP, then show mock scores
    if (!isPro) {
      try {
        // Register scan on server (tracks by IP - prevents localStorage bypass)
        const consumeUrl = API_URL.replace('/analyze', '/analyze/consume')
        const response = await fetch(consumeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })

        const data = await response.json()

        // Check if rate limited
        if (response.status === 429 || !data.success) {
          setScansRemaining(0)
          setScreen('limit-reached')
          return
        }

        // Update scans remaining from server
        if (data.scanInfo) {
          const bonus = data.scanInfo.bonusRemaining || 0
          setScansRemaining(data.scanInfo.scansRemaining + bonus)
          // Persist usage to prevent refresh bypass
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

        // Simulate AI thinking time for realism
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500))

        // Generate mock scores (no OpenAI cost)
        const mockScores = generateMockScores()
        setScores(mockScores)
        setScreen('results')
        return
      } catch (err) {
        console.error('Consume error:', err)
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
        body: JSON.stringify({ image: imageData, roastMode })
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

      setScores({ ...data.scores, roastMode })
      setScreen('results')
    } catch (err) {
      console.error('Analysis error:', err)
      setError("AI's getting dressed... try again!")
      setScreen('error')
    }
  }, [roastMode, isPro, generateMockScores])

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
        if (scores.overall < 60) return "AI humbled me 💀 Your turn?"
        if (scores.overall < 75) return "AI roasted my fit 🔥 Try it"
        return "Survived Roast Mode 😏"
      } else {
        if (scores.overall >= 90) return `${scores.overall}/100 — beat that 🏆`
        if (scores.overall >= 80) return "AI approved ✨ What's yours?"
        if (scores.overall >= 70) return "Not bad... can you do better? 👀"
        return "Your turn 👀"
      }
    }

    const hashtag = '#RateMyFit'
    const challengeHashtag = scores.overall >= 80 ? ' #FitRateChallenge' : ''
    const viralCaption = getViralCaption()

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920)
    gradient.addColorStop(0, '#0a0a0f')
    gradient.addColorStop(0.4, scores.roastMode ? '#2a1a1a' : '#1a1a2e')
    gradient.addColorStop(1, '#0a0a0f')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1920)

    // Glow effect behind card
    const glowColor = scores.roastMode ? 'rgba(255,68,68,0.4)' : 'rgba(0,212,255,0.4)'
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
    ctx.fillStyle = scores.roastMode ? '#ff6666' : '#00d4ff'
    ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(viralCaption, 540, 1350)

    // Hashtags
    ctx.fillStyle = scores.roastMode ? '#ff4444' : '#00ff88'
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText(`${hashtag}${challengeHashtag}`, 540, 1420)

    // Call to action box
    ctx.fillStyle = scores.roastMode ? 'rgba(255,68,68,0.2)' : 'rgba(0,212,255,0.2)'
    ctx.beginPath()
    ctx.roundRect(180, 1480, 720, 100, 20)
    ctx.fill()
    ctx.strokeStyle = scores.roastMode ? 'rgba(255,68,68,0.5)' : 'rgba(0,212,255,0.5)'
    ctx.lineWidth = 2
    ctx.stroke()

    // CTA text
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('Rate YOUR fit → fitrate.app', 540, 1545)

    // Branding footer
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '22px -apple-system, BlinkMacSystemFont, sans-serif'
    ctx.fillText('AI-Powered by FitRate', 540, 1620)

    // Generate share text based on context
    const getShareText = () => {
      const baseUrl = 'https://fitrate.app'
      if (scores.roastMode) {
        if (scores.overall < 60) return `AI destroyed my outfit 💀 What's your score? ${baseUrl}?ref=${userId} #RateMyFit`
        return `Got roasted and still scored ${scores.overall} 🔥 ${baseUrl}?ref=${userId} #RateMyFit`
      } else {
        if (scores.overall >= 90) return `${scores.overall}/100 on FitRate 🏆 Beat my score: ${baseUrl}?ref=${userId} #RateMyFit #FitRateChallenge`
        if (scores.overall >= 80) return `AI rated my fit ${scores.overall}/100 ✨ What's yours? ${baseUrl}?ref=${userId} #RateMyFit`
        return `Just got rated by FitRate AI. Your turn 👀 ${baseUrl}?ref=${userId} #RateMyFit`
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#00d4ff'
    return '#ff4444'
  }

  // Accent colors based on mode
  const accent = roastMode ? '#ff4444' : '#00d4ff'
  const accentGlow = roastMode ? 'rgba(255,68,68,0.4)' : 'rgba(0,212,255,0.4)'

  // ============================================
  // HOME SCREEN
  // ============================================
  if (screen === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 40%, #1a1a2e 60%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full opacity-30" style={{
            background: `radial-gradient(circle, ${accentGlow} 0%, transparent 70%)`,
            top: '10%', left: '-20%',
            animation: 'float 8s ease-in-out infinite'
          }} />
          <div className="absolute w-80 h-80 rounded-full opacity-20" style={{
            background: 'radial-gradient(circle, rgba(255,0,128,0.3) 0%, transparent 70%)',
            bottom: '20%', right: '-15%',
            animation: 'float 10s ease-in-out infinite reverse'
          }} />
        </div>

        {/* Hidden file input */}
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        {/* Streak Counter */}
        <div className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full" style={{
          background: 'rgba(255,153,0,0.1)',
          border: '1px solid rgba(255,153,0,0.3)',
          backdropFilter: 'blur(10px)'
        }}>
          <span className="text-xl">🔥</span>
          <span className="text-lg font-bold" style={{ color: '#ffecb3' }}>{dailyStreak}</span>
        </div>

        {/* Referral Counter - show if they've invited anyone */}
        {referralCount > 0 && (
          <div className="absolute top-20 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
            background: 'rgba(255,0,200,0.1)',
            border: '1px solid rgba(255,0,200,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <span className="text-sm">👥</span>
            <span className="text-sm font-bold" style={{ color: '#ffb3ec' }}>{referralCount} invited</span>
          </div>
        )}

        {/* Pro Badge */}
        {isPro && (
          <div className="absolute top-6 right-6 px-4 py-2 rounded-full" style={{
            background: 'rgba(0,255,136,0.1)',
            border: '1px solid rgba(0,255,136,0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            <span className="text-sm font-bold" style={{ color: '#00ff88' }}>⚡ PRO</span>
          </div>
        )}

        {/* Logo */}
        <h1 className="text-6xl font-black mb-4 tracking-tight" style={{
          background: `linear-gradient(135deg, #fff 0%, ${accent} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: `0 0 80px ${accentGlow}`
        }}>FITRATE</h1>

        <p className="text-sm mb-16 tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
          AI OUTFIT RATING
        </p>

        <button
          onClick={() => {
            playSound('click')
            vibrate(20)
            if (scansRemaining > 0 || isPro) fileInputRef.current?.click()
          }}
          disabled={scansRemaining === 0 && !isPro}
          className="relative w-56 h-56 rounded-full flex flex-col items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed group"
          style={{
            background: `linear-gradient(135deg, ${roastMode ? '#ff4444' : '#00d4ff'}33 0%, ${roastMode ? '#cc0000' : '#0099cc'}33 100%)`,
            border: `2px solid ${roastMode ? 'rgba(255,68,68,0.5)' : 'rgba(0,212,255,0.5)'}`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 0 60px ${accentGlow}, inset 0 0 60px rgba(255,255,255,0.05)`
          }}
        >
          {/* Inner glow ring */}
          <div className="absolute inset-3 rounded-full transition-all duration-300 group-hover:scale-105" style={{
            background: `linear-gradient(135deg, ${accent} 0%, ${roastMode ? '#ff0080' : '#00ff88'} 100%)`,
            boxShadow: `0 0 40px ${accentGlow}`
          }} />

          {/* Icon */}
          <span className="relative text-6xl mb-2 transition-transform duration-300 group-hover:scale-110 group-active:scale-95">
            {roastMode ? '💀' : '📸'}
          </span>
          <span className="relative text-white text-lg font-bold tracking-wider">
            {scansRemaining === 0 && !isPro ? 'LOCKED' : `RATE MY FIT${scansRemaining > 1 ? ` (${scansRemaining})` : ''}`}
          </span>
        </button>

        {/* Daily Theme */}
        <div className="mt-8 px-5 py-2 rounded-full flex items-center gap-2" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span className="text-xs font-semibold tracking-wider text-white/60">TODAY'S VIBE:</span>
          <span className="text-sm font-bold text-white shadow-sm" style={{ textShadow: '0 0 10px rgba(255,255,255,0.5)' }}>{todayTheme}</span>
        </div>

        {/* Mode Toggle - Glassmorphism pill */}
        <button
          onClick={() => {
            playSound('click')
            setRoastMode(!roastMode)
          }}
          className="mt-10 px-8 py-4 rounded-full transition-all duration-500"
          style={{
            background: roastMode ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${roastMode ? 'rgba(255,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
            backdropFilter: 'blur(10px)'
          }}
        >
          <span className="text-base font-semibold" style={{ color: roastMode ? '#ff4444' : 'rgba(255,255,255,0.6)' }}>
            {roastMode ? '🔥 Roast Mode' : '✨ Nice Mode'}
          </span>
        </button>

        {/* Scan Status / Limit Reached Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center" style={{
          background: 'linear-gradient(to top, #0a0a0f 20%, transparent 100%)',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom, 2rem))'
        }}>
          {scansRemaining > 0 || isPro ? (
            <p className="text-xs font-medium tracking-wide opacity-50">
              {isPro ? '⚡ 25 daily ratings active' : '1 free rating resets daily'}
            </p>
          ) : (
            <div className="w-full max-w-sm rounded-2xl p-4 flex items-center justify-between gap-4" style={{
              background: 'rgba(20,20,30,0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
            }}>
              <div className="flex flex-col">
                <span className="text-xs text-white/50 font-bold tracking-wider mb-0.5">NEXT FREE RATE</span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">{timeUntilReset}</span>
              </div>

              <a
                href="https://buy.stripe.com/4gM00l2SI7wT7LpfztfYY00"
                className="px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-transform active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                  boxShadow: '0 4px 15px rgba(0,212,255,0.3)'
                }}
              >
                Unlock ⚡
              </a>
            </div>
          )}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-30px) scale(1.1); }
          }
        `}</style>
      </div>
    )
  }

  // ============================================
  // ANALYZING SCREEN
  // ============================================
  if (screen === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        {/* Photo with scanning effect */}
        <div className="relative mb-10">
          <div className="w-52 h-72 rounded-3xl overflow-hidden" style={{
            boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${accentGlow}`,
            border: `2px solid ${accent}33`
          }}>
            <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
          </div>

          {/* Scan line */}
          <div className="absolute left-0 right-0 h-1 rounded-full" style={{
            background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            boxShadow: `0 0 20px ${accent}`,
            animation: 'scanLine 1.5s ease-in-out infinite'
          }} />

          {/* Corner accents */}
          <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 rounded-tl-lg" style={{ borderColor: accent }} />
          <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 rounded-tr-lg" style={{ borderColor: accent }} />
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 rounded-bl-lg" style={{ borderColor: accent }} />
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 rounded-br-lg" style={{ borderColor: accent }} />
        </div>

        {/* Loading text */}
        <p className="text-xl font-semibold text-white mb-4" style={{
          textShadow: `0 0 20px ${accentGlow}`,
          animation: 'pulse 2s ease-in-out infinite'
        }}>
          {roastMode ? 'Finding the violations...' : 'AI judging your drip...'}
        </p>

        {/* Dots */}
        <div className="flex gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{
              background: accent,
              boxShadow: `0 0 10px ${accent}`,
              animation: `bounce 1.4s ease-in-out infinite ${i * 0.2}s`
            }} />
          ))}
        </div>

        <style>{`
          @keyframes scanLine { 0% { top: 0; } 50% { top: calc(100% - 4px); } 100% { top: 0; } }
          @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        `}</style>
      </div>
    )
  }

  // ============================================
  // RESULTS SCREEN - Sequential Reveal
  // ============================================
  if (screen === 'results' && scores) {
    const scoreColor = getScoreColor(scores.overall)
    const modeAccent = scores.roastMode ? '#ff4444' : '#00d4ff'

    return (
      <div className="min-h-screen flex flex-col items-center p-6 pt-10 overflow-hidden" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #12121f 30%, #1a1a2e 60%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
        paddingBottom: 'max(6rem, env(safe-area-inset-bottom, 6rem))'
      }}>
        {/* Verdict - Huge & Bold */}
        <div className={`transition-all duration-700 ${revealStage >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <p className="text-2xl md:text-3xl font-black text-white text-center mb-6 px-4" style={{
            textShadow: `0 0 30px ${modeAccent}66`
          }}>
            {scores.verdict}
          </p>
        </div>

        {/* Photo + Score */}
        <div className={`relative mb-4 transition-all duration-700 delay-200 ${revealStage >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          {/* Glassmorphism card */}
          <div className="p-3 rounded-3xl" style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: `0 20px 60px ${scoreColor}33`
          }}>
            <div className="w-52 h-68 rounded-2xl overflow-hidden">
              <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" style={{ height: '260px' }} />
            </div>
          </div>

          {/* Score Badge */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="relative w-24 h-24 rounded-full flex items-center justify-center" style={{
              background: 'rgba(10,10,15,0.9)',
              border: `4px solid ${scoreColor}`,
              boxShadow: `0 0 40px ${scoreColor}66, inset 0 0 20px ${scoreColor}22`
            }}>
              {/* Animated ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="48" cy="48" r="44"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${scores.overall * 2.76} 276`}
                  style={{
                    transition: 'stroke-dasharray 1s ease-out',
                    filter: `drop-shadow(0 0 10px ${scoreColor})`
                  }}
                />
              </svg>
              <span className="text-3xl font-black" style={{ color: scoreColor }}>{scores.overall}</span>
            </div>
          </div>
        </div>

        {/* Aesthetic + Celeb */}
        <div className={`mt-10 mb-4 transition-all duration-700 delay-300 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex items-center gap-2 px-6 py-3 rounded-full" style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {scores.aesthetic} • {scores.celebMatch}
            </span>
          </div>
        </div>

        {/* Percentile - Social Proof */}
        <div className={`mb-2 transition-all duration-700 delay-350 ${revealStage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-sm font-medium" style={{
            color: scores.isLegendary ? '#ffd700' : 'rgba(255,255,255,0.6)',
            textShadow: scores.isLegendary ? '0 0 10px #ffd700' : 'none'
          }}>
            {scores.isLegendary
              ? "🌟 TOP 1% OF ALL TIME 🌟"
              : `Better than ${scores.percentile}% of fits today`}
          </p>
        </div>

        {/* Tip */}
        <div className={`w-full max-w-sm transition-all duration-700 delay-400 ${revealStage >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="p-4 rounded-2xl" style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${modeAccent}33`
          }}>
            <p className="text-xs font-bold mb-1" style={{ color: modeAccent }}>
              {scores.roastMode ? '💀 THE TRUTH' : '💡 PRO TIP'}
            </p>
            <p className="text-sm text-white/80">{scores.tip}</p>
            {scores.shareTip && (
              <p className="text-xs mt-2 italic" style={{ color: 'rgba(255,255,255,0.4)' }}>{scores.shareTip}</p>
            )}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className={`w-full max-w-sm flex gap-2 mt-4 mb-6 transition-all duration-700 delay-500 ${revealStage >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {[
            { label: 'Color', score: scores.color },
            { label: 'Fit', score: scores.fit },
            { label: 'Style', score: scores.style }
          ].map((item) => (
            <div key={item.label} className="flex-1 p-3 rounded-xl text-center" style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(10px)'
            }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
              <p className="text-xl font-bold" style={{ color: getScoreColor(item.score) }}>{item.score}</p>
            </div>
          ))}
        </div>

        {/* SHARE BUTTON - Pulsing glow */}
        <div className={`w-full max-w-sm transition-all duration-700 delay-600 ${revealStage >= 6 ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <button
            onClick={generateShareCard}
            className="w-full py-5 rounded-2xl text-white text-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${modeAccent} 0%, ${scores.roastMode ? '#ff0080' : '#00ff88'} 100%)`,
              boxShadow: `0 4px 30px ${modeAccent}66`,
              animation: 'pulseGlow 2s ease-in-out infinite'
            }}
          >
            📤 Share Your Rate
          </button>

          {/* FOMO Nudge */}
          <p className="text-center text-xs mt-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {scores.overall >= 80
              ? "🔥 Challenge someone to beat your score!"
              : "📸 Most users share their results"}
          </p>
        </div>

        {/* Rate Again */}
        <button
          onClick={resetApp}
          className="mt-4 text-sm font-medium transition-all hover:opacity-80"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Rate Another Fit
        </button>

        {/* Confetti for 90+ */}
        {scores.overall >= 90 && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(40)].map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  width: `${8 + Math.random() * 8}px`,
                  height: `${8 + Math.random() * 8}px`,
                  background: ['#ff4444', '#00d4ff', '#00ff88', '#ffd000', '#ff0080'][Math.floor(Math.random() * 5)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  animation: `confetti ${2.5 + Math.random() * 2}s linear forwards`,
                  animationDelay: `${Math.random() * 0.8}s`
                }}
              />
            ))}
          </div>
        )}

        <style>{`
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 4px 30px ${modeAccent}66; }
            50% { box-shadow: 0 4px 50px ${modeAccent}99; }
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
  // LIMIT REACHED SCREEN
  // ============================================
  if (screen === 'limit-reached') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
      }}>
        <span className="text-7xl mb-6">⏰</span>
        <h2 className="text-2xl font-bold text-white mb-2">Daily Limit Reached</h2>
        <p className="text-center mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Your free rate resets at midnight
        </p>

        {timeUntilReset && (
          <div className="px-6 py-3 rounded-full mb-8" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span className="text-lg font-semibold" style={{ color: '#00d4ff' }}>
              Next free rate in {timeUntilReset}
            </span>
          </div>
        )}

        <a
          href="https://buy.stripe.com/4gM00l2SI7wT7LpfztfYY00"
          className="px-8 py-4 rounded-2xl text-white font-bold text-lg transition-all hover:scale-105 mb-4"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
            boxShadow: '0 4px 30px rgba(0,212,255,0.4)'
          }}
        >
          Get 25 Rates/Day ⚡
        </a>

        <button
          onClick={resetApp}
          className="text-sm font-medium"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          ← Back to Home
        </button>
      </div>
    )
  }

  // ============================================
  // SHARE PREVIEW SCREEN
  // ============================================
  if (screen === 'share-preview' && shareData) {
    const handleSystemShare = async () => {
      // Try to share with URL param for better compatibility
      if (navigator.share) {
        try {
          // Construct data object dynamically
          const data = {
            title: 'My FitRate Score',
            text: shareData.text, // Text already contains the URL
          }

          // Only add files if supported (some apps fail if files mixed with url)
          if (navigator.canShare && navigator.canShare({ files: [shareData.file] })) {
            data.files = [shareData.file]
          } else {
            data.url = shareData.url // Fallback to just URL if files not supported
          }

          // Prioritize URL if we want clickable links? 
          // Actually, let's try sending EVERYTHING.
          // Note: Android often drops the URL if files are present.
          // Putting URL in 'text' is the safest bet for visibility.

          await navigator.share(data)
        } catch (err) {
          console.error("Share failed:", err)
          // Fallback: Copy link if share fails
          if (err.name !== 'AbortError') {
            navigator.clipboard.writeText(shareData.url)
            alert("Could not share directly. Link copied instead! 📋")
          }
        }
      } else {
        navigator.clipboard.writeText(shareData.url)
        alert("System sharing not available. Link copied! 📋")
      }
    }

    const handleTwitterShare = () => {
      const text = encodeURIComponent(shareData.text)
      window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    }

    const handleWhatsAppShare = () => {
      const text = encodeURIComponent(shareData.text)
      window.open(`https://wa.me/?text=${text}`, '_blank')
    }

    const handleCopyLink = () => {
      navigator.clipboard.writeText(shareData.url).then(() => {
        alert("Link copied! 📋")
      })
    }

    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center bg-[#0a0a0f] text-white font-sans overflow-y-auto"
        style={{
          height: '100dvh',
          paddingBottom: 'env(safe-area-inset-bottom, 24px)'
        }}>

        <div className="w-full max-w-md flex flex-col items-center p-6 min-h-full">
          <h2 className="text-3xl font-black mb-8 mt-4 text-center tracking-tight">Ready to Flex? 💪</h2>

          {/* Image Preview - Responsive Size */}
          <div className="relative w-[65%] max-w-[240px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl mb-8 transform transition-transform duration-500 hover:scale-[1.02]" style={{
            border: '2px solid rgba(255,255,255,0.1)',
            boxShadow: `0 20px 60px ${scores.roastMode ? '#ff4444' : '#00d4ff'}44`
          }}>
            <img src={URL.createObjectURL(shareData.imageBlob)} alt="Share Preview" className="w-full h-full object-cover" />
          </div>

          <div className="w-full flex flex-col gap-4 mt-auto">
            {/* Main System Share - Scale effect on press */}
            <button
              onClick={handleSystemShare}
              className="w-full py-4 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 transition-transform active:scale-95 touch-manipulation"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #00ff88 100%)',
                boxShadow: '0 8px 30px -4px rgba(0,212,255,0.4)',
                minHeight: '60px'
              }}
            >
              <span className="text-2xl">📤</span> Share Sheet
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleTwitterShare}
                className="py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 touch-manipulation"
                style={{
                  background: '#000000',
                  border: '1px solid rgba(255,255,255,0.1)',
                  minHeight: '60px'
                }}
              >
                🐦 Post
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95 touch-manipulation"
                style={{
                  background: '#25D366',
                  minHeight: '60px'
                }}
              >
                💬 Chat
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors active:bg-white/10 touch-manipulation"
              style={{
                color: 'rgba(255,255,255,0.9)',
                background: 'rgba(255,255,255,0.05)',
                minHeight: '56px'
              }}
            >
              🔗 Copy Link
            </button>

            <button
              onClick={() => downloadImage(shareData.imageBlob, shareData.text)}
              className="w-full py-4 text-sm font-medium text-white/50 active:text-white transition-colors touch-manipulation"
            >
              ⬇️ Download Image
            </button>
          </div>

          <button
            onClick={() => setScreen('results')}
            className="mt-4 py-2 px-6 text-sm font-medium rounded-full transition-colors active:bg-white/5 text-white/40 hover:text-white/60"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return null
}
