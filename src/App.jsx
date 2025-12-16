import React, { useState, useRef, useCallback, useEffect } from 'react'

// API endpoint
const API_URL = import.meta.env.VITE_API_URL || 'https://fitrate-production.up.railway.app/api/analyze'

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
  const [roastMode, setRoastMode] = useState(false)
  const [error, setError] = useState(null)

  // Countdown timer state
  const [timeUntilReset, setTimeUntilReset] = useState('')

  // Pro status
  const [isPro, setIsPro] = useState(() => localStorage.getItem('fitrate_pro') === 'true')

  // Check scans remaining
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
  const canvasRef = useRef(null)

  // Check for Stripe payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('success') === 'true') {
      localStorage.setItem('fitrate_pro', 'true')
      setIsPro(true)
      setScreen('pro-welcome')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

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

  // Mock scores for free users
  const generateMockScores = useCallback(() => {
    const roastVerdicts = [
      "Bro really said 'I'll figure it out later' 💀",
      "The colors are in a toxic relationship",
      "This fit is giving... participation trophy",
      "Outfit said 'I have food at home'",
      "The dryer ate better fits than this",
      "Pinterest fail but make it fashion",
      "The fit that texts back 'k'",
      "This outfit has a 2.3 GPA",
      "Sir this is a Wendy's 💀",
      "Main NPC energy tbh",
      "Giving clearance rack energy",
      "The algorithm buried this one"
    ]

    const niceVerdicts = [
      "Main character energy ✨",
      "Clean minimalist vibes fr",
      "Understated fire 🔥",
      "The fit is fitting",
      "Effortlessly hard",
      "Quiet confidence activated",
      "Lowkey dripping",
      "This hits different",
      "Certified fresh fit",
      "Immaculate vibes only",
      "Serving looks fr fr",
      "Chef's kiss coordination 👨‍🍳"
    ]

    const tips = roastMode
      ? ["Start over. Please.", "Have you considered... not this?", "Less is more. Way less.", "Google 'how to dress'"]
      : ["Cuff the jeans for a cleaner silhouette", "A chunky watch would elevate this", "Try layering with a light jacket", "White sneakers would make this pop"]

    const baseScore = roastMode ? Math.floor(Math.random() * 30) + 45 : Math.floor(Math.random() * 20) + 75

    return {
      overall: baseScore,
      color: Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 16) - 8)),
      fit: Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 16) - 8)),
      style: Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 16) - 8)),
      verdict: roastMode
        ? roastVerdicts[Math.floor(Math.random() * roastVerdicts.length)]
        : niceVerdicts[Math.floor(Math.random() * niceVerdicts.length)],
      tip: tips[Math.floor(Math.random() * tips.length)],
      aesthetic: AESTHETICS[Math.floor(Math.random() * AESTHETICS.length)],
      celebMatch: CELEBRITIES[Math.floor(Math.random() * CELEBRITIES.length)],
      roastMode
    }
  }, [roastMode])

  // Increment scan count
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

  // Analyze outfit
  const analyzeOutfit = useCallback(async (imageData) => {
    setScreen('analyzing')
    setError(null)

    // Free users get mock scores (no API cost)
    if (!isPro) {
      await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 1500))
      const mockScores = generateMockScores()
      setScores(mockScores)
      incrementScanCount()
      setScreen('results')
      return
    }

    // Pro users get real AI
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

      setScores({ ...data.scores, roastMode })
      setScreen('results')
    } catch (err) {
      console.error('Analysis error:', err)
      setError('AI is getting dressed... try again!')
      setScreen('error')
    }
  }, [roastMode, isPro, generateMockScores])

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image too large. Please use an image under 10MB.')
        setScreen('error')
        return
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result)
        analyzeOutfit(e.target?.result)
      }
      reader.readAsDataURL(file)
    }
  }, [analyzeOutfit])

  // Generate share card
  const generateShareCard = useCallback(async () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 1080
    canvas.height = 1920

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920)
    gradient.addColorStop(0, '#0a0a0f')
    gradient.addColorStop(0.5, '#1a1a2e')
    gradient.addColorStop(1, '#0a0a0f')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1080, 1920)

    // Load and draw user image
    const img = new Image()
    img.crossOrigin = 'anonymous'

    await new Promise((resolve) => {
      img.onload = resolve
      img.src = uploadedImage
    })

    // Draw image in center (cropped to fit)
    const imgSize = 600
    const imgX = (1080 - imgSize) / 2
    const imgY = 300

    // Rounded rectangle clip for image
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(imgX, imgY, imgSize, imgSize, 30)
    ctx.clip()

    // Calculate crop to maintain aspect ratio
    const scale = Math.max(imgSize / img.width, imgSize / img.height)
    const scaledW = img.width * scale
    const scaledH = img.height * scale
    const offsetX = imgX + (imgSize - scaledW) / 2
    const offsetY = imgY + (imgSize - scaledH) / 2
    ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH)
    ctx.restore()

    // Score circle
    const scoreColor = scores.overall >= 80 ? '#00ff88' : scores.overall >= 60 ? '#00d4ff' : '#ff4444'
    ctx.beginPath()
    ctx.arc(540, 1050, 100, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fill()
    ctx.strokeStyle = scoreColor
    ctx.lineWidth = 8
    ctx.stroke()

    // Score text
    ctx.fillStyle = scoreColor
    ctx.font = 'bold 72px SF Pro Display, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(scores.overall, 540, 1070)

    // Verdict
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px SF Pro Display, -apple-system, sans-serif'
    ctx.fillText(scores.verdict, 540, 1220)

    // Aesthetic + Celeb
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '32px SF Pro Display, -apple-system, sans-serif'
    ctx.fillText(`${scores.aesthetic} • ${scores.celebMatch}`, 540, 1300)

    // Hashtag
    const hashtag = scores.roastMode ? '#FitRateRoast' : '#FitRateGlowUp'
    ctx.fillStyle = scores.roastMode ? '#ff4444' : '#00d4ff'
    ctx.font = 'bold 36px SF Pro Display, -apple-system, sans-serif'
    ctx.fillText(hashtag, 540, 1450)

    // Branding
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '28px SF Pro Display, -apple-system, sans-serif'
    ctx.fillText('Rated by FitRate AI • fitrate.app', 540, 1800)

    // Convert to blob and share
    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'fitrate-score.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `I scored ${scores.overall}/100 on FitRate!`,
            text: `${scores.verdict} ${hashtag}`
          })
        } catch (err) {
          // Fallback: download
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = 'fitrate-score.png'
          a.click()
        }
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'fitrate-score.png'
        a.click()
      }
    }, 'image/png')
  }, [uploadedImage, scores])

  // Reset app
  const resetApp = useCallback(() => {
    setScreen('home')
    setUploadedImage(null)
    setScores(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 80) return '#00ff88'
    if (score >= 60) return '#00d4ff'
    return '#ff4444'
  }

  // ============================================
  // SCREENS
  // ============================================

  // HOME SCREEN - Ultra Simple
  if (screen === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Pro Badge */}
        {isPro && (
          <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full" style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(0,255,136,0.2))',
            border: '1px solid rgba(0,255,136,0.4)'
          }}>
            <span className="text-xs font-bold" style={{ color: '#00ff88' }}>⚡ PRO</span>
          </div>
        )}

        {/* Logo */}
        <h1 className="text-5xl font-extrabold mb-16" style={{
          letterSpacing: '-2px',
          background: roastMode
            ? 'linear-gradient(135deg, #fff 0%, #ff4444 100%)'
            : 'linear-gradient(135deg, #fff 0%, #00d4ff 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>FITRATE</h1>

        {/* Main Button */}
        <button
          onClick={() => scansRemaining > 0 || isPro ? fileInputRef.current?.click() : null}
          disabled={scansRemaining === 0 && !isPro}
          className="w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: roastMode
              ? 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)'
              : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            boxShadow: roastMode
              ? '0 0 80px rgba(255,68,68,0.5)'
              : '0 0 80px rgba(0,212,255,0.5)'
          }}
        >
          <span className="text-6xl mb-3">{roastMode ? '💀' : '📸'}</span>
          <span className="text-white text-xl font-bold tracking-wide">
            {scansRemaining === 0 && !isPro ? 'LOCKED' : 'RATE MY FIT'}
          </span>
        </button>

        {/* Mode Toggle */}
        <button
          onClick={() => setRoastMode(!roastMode)}
          className="mt-8 px-6 py-3 rounded-full transition-all duration-300"
          style={{
            background: roastMode ? 'rgba(255,68,68,0.2)' : 'rgba(255,255,255,0.05)',
            border: roastMode ? '1px solid rgba(255,68,68,0.4)' : '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <span className="text-sm font-semibold" style={{ color: roastMode ? '#ff4444' : 'rgba(255,255,255,0.6)' }}>
            {roastMode ? '🔥 Roast Mode' : '😊 Nice Mode'}
          </span>
        </button>

        {/* Scan Status */}
        <div className="absolute bottom-8 text-center">
          {scansRemaining > 0 || isPro ? (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {isPro ? '⚡ Unlimited AI scans' : '1 free rate per day • Unlimited with FitPass'}
            </p>
          ) : (
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Next free rate in {timeUntilReset}
              </p>
              <a
                href="https://buy.stripe.com/4gM00l2SI7wT7LpfztfYY00"
                className="text-xs font-bold"
                style={{ color: '#00d4ff' }}
              >
                Get unlimited →
              </a>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ANALYZING SCREEN
  if (screen === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div className="w-48 h-64 rounded-2xl overflow-hidden mb-8 relative" style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }}>
          <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(0deg, rgba(0,0,0,0.5) 0%, transparent 50%)'
          }} />
          {/* Scan line animation */}
          <div className="absolute left-0 right-0 h-1" style={{
            background: roastMode
              ? 'linear-gradient(90deg, transparent, #ff4444, transparent)'
              : 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
            boxShadow: roastMode ? '0 0 20px #ff4444' : '0 0 20px #00d4ff',
            animation: 'scanLine 1.5s ease-in-out infinite'
          }} />
        </div>

        <p className="text-white text-lg font-semibold mb-4">
          {roastMode ? 'Finding the violations...' : 'AI judging your drip...'}
        </p>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 rounded-full" style={{
              background: roastMode ? '#ff4444' : '#00d4ff',
              animation: `bounce 1.4s ease-in-out infinite ${i * 0.2}s`
            }} />
          ))}
        </div>

        <style>{`
          @keyframes scanLine { 0% { top: 0; } 50% { top: calc(100% - 4px); } 100% { top: 0; } }
          @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    )
  }

  // RESULTS SCREEN - Viral Share Focus
  if (screen === 'results' && scores) {
    const scoreColor = getScoreColor(scores.overall)

    return (
      <div className="min-h-screen flex flex-col items-center p-6 pt-12 pb-24" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        {/* Verdict - Big & Bold */}
        <p className="text-2xl font-bold text-white text-center mb-6 px-4" style={{
          textShadow: '0 2px 20px rgba(0,0,0,0.5)'
        }}>
          {scores.verdict}
        </p>

        {/* Photo + Score */}
        <div className="relative mb-6">
          <div className="w-56 h-72 rounded-2xl overflow-hidden" style={{
            boxShadow: `0 20px 60px ${scoreColor}33`
          }}>
            <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
          </div>

          {/* Score Badge */}
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-20 rounded-full flex items-center justify-center" style={{
            background: '#0a0a0f',
            border: `4px solid ${scoreColor}`,
            boxShadow: `0 0 30px ${scoreColor}66`
          }}>
            <span className="text-2xl font-extrabold" style={{ color: scoreColor }}>
              {scores.overall}
            </span>
          </div>
        </div>

        {/* Aesthetic + Celeb */}
        <p className="text-sm mt-4 mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {scores.aesthetic} • {scores.celebMatch}
        </p>

        {/* Tip */}
        <div className="w-full max-w-sm p-4 rounded-xl mb-6" style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <p className="text-xs font-bold mb-1" style={{ color: roastMode ? '#ff4444' : '#00d4ff' }}>
            {roastMode ? '💀 THE TRUTH' : '💡 PRO TIP'}
          </p>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{scores.tip}</p>
        </div>

        {/* Score Breakdown - Compact */}
        <div className="w-full max-w-sm flex gap-2 mb-8">
          {[
            { label: 'Color', score: scores.color },
            { label: 'Fit', score: scores.fit },
            { label: 'Style', score: scores.style }
          ].map((item) => (
            <div key={item.label} className="flex-1 p-3 rounded-xl text-center" style={{
              background: 'rgba(255,255,255,0.03)'
            }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.label}</p>
              <p className="text-lg font-bold" style={{ color: getScoreColor(item.score) }}>{item.score}</p>
            </div>
          ))}
        </div>

        {/* SHARE BUTTON - Primary CTA */}
        <button
          onClick={generateShareCard}
          className="w-full max-w-sm py-4 rounded-2xl text-white text-lg font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: roastMode
              ? 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)'
              : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            boxShadow: roastMode
              ? '0 4px 30px rgba(255,68,68,0.4)'
              : '0 4px 30px rgba(0,212,255,0.4)'
          }}
        >
          📤 Share Your Rate
        </button>

        {/* Rate Again */}
        <button
          onClick={resetApp}
          className="mt-4 text-sm font-semibold"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          ← Rate Another Fit
        </button>

        {/* Confetti for high scores */}
        {scores.overall >= 90 && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-20px',
                  background: ['#ff4444', '#00d4ff', '#00ff88', '#ffd000'][Math.floor(Math.random() * 4)],
                  borderRadius: Math.random() > 0.5 ? '50%' : '0',
                  animation: `confetti ${2 + Math.random() * 2}s linear forwards`,
                  animationDelay: `${Math.random() * 0.5}s`
                }}
              />
            ))}
            <style>{`
              @keyframes confetti {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
              }
            `}</style>
          </div>
        )}
      </div>
    )
  }

  // ERROR SCREEN
  if (screen === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <span className="text-6xl mb-6">👗</span>
        <p className="text-white text-lg font-semibold mb-2">{error || "Something went wrong"}</p>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Give it another shot</p>
        <button
          onClick={resetApp}
          className="px-8 py-3 rounded-xl text-white font-semibold"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  // PRO WELCOME SCREEN
  if (screen === 'pro-welcome') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{
        background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome to FitPass!</h2>
        <p className="text-center mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Unlimited AI outfit ratings unlocked
        </p>

        <div className="p-4 rounded-xl mb-8 text-center" style={{
          background: 'rgba(0,255,136,0.1)',
          border: '1px solid rgba(0,255,136,0.3)'
        }}>
          <p className="text-sm" style={{ color: '#00ff88' }}>
            ✨ Unlimited scans<br />
            🤖 Real GPT-4 Vision AI<br />
            🔥 No daily limits
          </p>
        </div>

        <button
          onClick={() => setScreen('home')}
          className="px-8 py-4 rounded-xl text-white font-bold text-lg"
          style={{
            background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            boxShadow: '0 4px 20px rgba(0,212,255,0.4)'
          }}
        >
          Start Rating 🚀
        </button>
      </div>
    )
  }

  // Fallback
  return null
}
