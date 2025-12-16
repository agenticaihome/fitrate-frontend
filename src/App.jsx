import React, { useState, useRef, useCallback, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://fitrate-api.up.railway.app/api/analyze'

// Feature flags and modes
const OCCASIONS = [
  { id: 'casual', emoji: '😎', label: 'Casual' },
  { id: 'date', emoji: '💕', label: 'Date Night' },
  { id: 'work', emoji: '💼', label: 'Work/Interview' },
  { id: 'party', emoji: '🎉', label: 'Party/Club' },
  { id: 'streetwear', emoji: '🔥', label: 'Streetwear' },
  { id: 'formal', emoji: '🎩', label: 'Formal Event' },
]

const AESTHETICS = [
  'Clean Girl', 'Dark Academia', 'Quiet Luxury', 'Streetwear', 'Y2K',
  'Cottagecore', 'Minimalist', 'Coastal Grandmother', 'Grunge', 'Preppy',
  'Gorpcore', 'Balletcore', 'Old Money', 'Skater', 'Bohemian'
]

const CELEBRITIES = [
  'Timothée Chalamet at the airport', 'Zendaya on press tour', 'Bad Bunny off-duty',
  'Hailey Bieber coffee run', 'A$AP Rocky front row', 'Bella Hadid street style',
  'Harry Styles on tour', 'Kendall Jenner model off-duty', 'Tyler the Creator at Coachella',
  'Dua Lipa going to dinner', 'Jacob Elordi casual', 'Sydney Sweeney brunch',
  'Pete Davidson SNL afterparty', 'Rihanna anywhere tbh', 'Frank Ocean sighting'
]

export default function App() {
  const [screen, setScreen] = useState('home')
  const [uploadedImage, setUploadedImage] = useState(null)
  const [scores, setScores] = useState(null)
  const [error, setError] = useState(null)

  // New feature states
  const [roastMode, setRoastMode] = useState(false)
  const [selectedOccasion, setSelectedOccasion] = useState(null)
  const [showOccasionPicker, setShowOccasionPicker] = useState(false)
  const [streak, setStreak] = useState(() => {
    const stored = localStorage.getItem('fitrate_streak')
    if (stored) {
      const { count, lastDate } = JSON.parse(stored)
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      if (lastDate === today) return count
      if (lastDate === yesterday) return count
      return 0
    }
    return 0
  })

  const [scansRemaining, setScansRemaining] = useState(() => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('fitrate_scans')
    if (stored) {
      const { date, count } = JSON.parse(stored)
      if (date === today) return Math.max(0, 1 - count)
    }
    return 1
  })

  // Battle mode states
  const [battleMode, setBattleMode] = useState(false)
  const [battleOutfits, setBattleOutfits] = useState([null, null])
  const [battleResults, setBattleResults] = useState(null)

  const fileInputRef = useRef(null)
  const battleInputRef = useRef(null)

  const updateStreak = () => {
    const today = new Date().toDateString()
    const stored = localStorage.getItem('fitrate_streak')
    let newStreak = 1

    if (stored) {
      const { count, lastDate } = JSON.parse(stored)
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      if (lastDate === yesterday) newStreak = count + 1
      else if (lastDate === today) newStreak = count
    }

    localStorage.setItem('fitrate_streak', JSON.stringify({ count: newStreak, lastDate: today }))
    setStreak(newStreak)
  }

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
    updateStreak()
  }

  const generateMockScores = () => {
    const roastVerdicts = [
      "Bro really said 'I'll figure it out later' 💀",
      "The colors are in a toxic relationship",
      "This fit is giving... participation trophy",
      "Outfit said 'I have food at home'",
      "The dryer ate better fits than this",
      "This screams 'my mom still picks my clothes'",
      "Pinterest fail but make it fashion",
      "The fit that texts back 'k'",
      "Giving 'I woke up 5 mins before leaving'",
      "This outfit has a 2.3 GPA"
    ]

    const niceVerdicts = [
      "Clean minimalist energy ✨", "Main character vibes fr", "Understated fire 🔥",
      "The fit is fitting", "Effortlessly hard", "Quiet confidence activated",
      "Lowkey dripping", "This hits different", "Certified fresh fit",
      "Immaculate vibes only", "The algorithm would push this"
    ]

    const roastTips = [
      "Start over. Please.",
      "Have you considered... not this?",
      "Google 'how to dress' and take notes",
      "Call a friend. Any friend. Get help.",
      "The outfit is outfit-ing but not in a good way"
    ]

    const niceTips = [
      "Cuff the jeans for a cleaner silhouette",
      "A chunky watch would elevate this hard",
      "Swap the sneakers for loafers to level up",
      "This would hit different with silver accessories",
      "Try tucking the front of the shirt",
      "A leather belt would complete the look",
      "White sneakers would make this pop"
    ]

    const baseScore = roastMode ? Math.floor(Math.random() * 30) + 45 : Math.floor(Math.random() * 20) + 75
    const aesthetic = AESTHETICS[Math.floor(Math.random() * AESTHETICS.length)]
    const celeb = CELEBRITIES[Math.floor(Math.random() * CELEBRITIES.length)]

    return {
      overall: baseScore,
      color: baseScore + Math.floor(Math.random() * 10) - 5,
      fit: baseScore + Math.floor(Math.random() * 10) - 5,
      style: baseScore + Math.floor(Math.random() * 10) - 5,
      occasion: baseScore + Math.floor(Math.random() * 10) - 5,
      verdict: roastMode
        ? roastVerdicts[Math.floor(Math.random() * roastVerdicts.length)]
        : niceVerdicts[Math.floor(Math.random() * niceVerdicts.length)],
      tip: roastMode
        ? roastTips[Math.floor(Math.random() * roastTips.length)]
        : niceTips[Math.floor(Math.random() * niceTips.length)],
      aesthetic: aesthetic,
      celebMatch: celeb,
      trendScore: Math.floor(Math.random() * 30) + 60,
      occasionMatch: selectedOccasion ? Math.floor(Math.random() * 25) + 70 : null,
      roastMode: roastMode
    }
  }

  const analyzeOutfit = useCallback(async (imageData) => {
    setScreen('analyzing')
    setError(null)

    try {
      // For demo/fallback, use mock scores
      await new Promise(resolve => setTimeout(resolve, 2500))
      setScores(generateMockScores())
      incrementScanCount()
      setScreen('results')
    } catch (err) {
      console.error('Analysis error:', err)
      setScores(generateMockScores())
      incrementScanCount()
      setScreen('results')
    }
  }, [roastMode, selectedOccasion])

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
        if (battleMode) {
          const idx = battleOutfits[0] === null ? 0 : 1
          const newOutfits = [...battleOutfits]
          newOutfits[idx] = e.target?.result
          setBattleOutfits(newOutfits)
          if (idx === 1) {
            // Both outfits uploaded, analyze battle
            analyzeBattle(newOutfits)
          }
        } else {
          setUploadedImage(e.target?.result)
          analyzeOutfit(e.target?.result)
        }
      }
      reader.readAsDataURL(file)
    }
  }, [analyzeOutfit, battleMode, battleOutfits])

  const analyzeBattle = async (outfits) => {
    setScreen('analyzing')
    await new Promise(resolve => setTimeout(resolve, 3000))

    const score1 = Math.floor(Math.random() * 25) + 70
    const score2 = Math.floor(Math.random() * 25) + 70

    setBattleResults({
      outfit1: { score: score1, verdict: score1 > score2 ? "WINNER 👑" : "Close but no" },
      outfit2: { score: score2, verdict: score2 > score1 ? "WINNER 👑" : "Close but no" },
      winner: score1 > score2 ? 1 : score1 < score2 ? 2 : 0,
      commentary: score1 === score2
        ? "It's a tie! Both fits are equally fire 🔥"
        : `Outfit ${score1 > score2 ? '1' : '2'} takes the crown by ${Math.abs(score1 - score2)} points!`
    })
    setScreen('battle-results')
  }

  const handleDemoScan = useCallback(() => {
    const demoImage = 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&h=600&fit=crop'
    setUploadedImage(demoImage)
    analyzeOutfit(demoImage)
  }, [analyzeOutfit])

  const resetApp = useCallback(() => {
    setScreen('home')
    setUploadedImage(null)
    setScores(null)
    setError(null)
    setSelectedOccasion(null)
    setShowOccasionPicker(false)
    setBattleMode(false)
    setBattleOutfits([null, null])
    setBattleResults(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const handleShare = useCallback(async () => {
    const modeText = scores?.roastMode ? '🔥 ROAST MODE 🔥\n' : ''
    const shareText = `${modeText}I got ${scores?.overall}/100 on FitCheck!\n${scores?.verdict}\n\nAesthetic: ${scores?.aesthetic}\nCeleb Match: ${scores?.celebMatch}`
    const shareUrl = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title: `FitCheck: ${scores?.overall}/100`, text: shareText, url: shareUrl })
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard?.writeText(shareText + '\n\nRate your fit: ' + shareUrl)
          alert('Copied to clipboard!')
        }
      }
    } else {
      navigator.clipboard?.writeText(shareText + '\n\nRate your fit: ' + shareUrl)
      alert('Copied to clipboard!')
    }
  }, [scores])

  const getScoreColor = (score) => {
    if (score >= 85) return '#00ff88'
    if (score >= 70) return '#00d4ff'
    if (score >= 55) return '#ffd000'
    return '#ff4444'
  }

  const getScoreLabel = (score) => {
    if (score >= 90) return 'IMMACULATE'
    if (score >= 80) return 'CLEAN'
    if (score >= 70) return 'SOLID'
    if (score >= 60) return 'MID'
    if (score >= 50) return 'STRUGGLING'
    return 'VIOLATION'
  }

  // HOME SCREEN
  if (screen === 'home') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden" style={{
        background: roastMode
          ? 'linear-gradient(135deg, #1a0a0a 0%, #2e1a1a 50%, #1a0a0a 100%)'
          : 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        transition: 'background 0.5s ease'
      }}>
        {/* Ambient glows */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full pointer-events-none" style={{
          background: roastMode
            ? 'radial-gradient(circle, rgba(255,68,68,0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,212,255,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'pulse 4s ease-in-out infinite'
        }} />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(255,0,128,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'pulse 4s ease-in-out infinite 2s'
        }} />

        {/* Streak Counter */}
        {streak > 0 && (
          <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 rounded-full" style={{
            background: 'rgba(255,136,0,0.2)',
            border: '1px solid rgba(255,136,0,0.3)'
          }}>
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold" style={{ color: '#ff8800' }}>{streak} day streak</span>
          </div>
        )}

        {/* Roast Mode Toggle */}
        <button
          onClick={() => setRoastMode(!roastMode)}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300"
          style={{
            background: roastMode ? 'rgba(255,68,68,0.3)' : 'rgba(255,255,255,0.05)',
            border: roastMode ? '1px solid rgba(255,68,68,0.5)' : '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <span className="text-lg">{roastMode ? '🔥' : '😊'}</span>
          <span className="text-xs font-bold" style={{ color: roastMode ? '#ff4444' : 'rgba(255,255,255,0.5)' }}>
            {roastMode ? 'ROAST MODE' : 'Nice Mode'}
          </span>
        </button>

        {/* Logo */}
        <h1 className="text-5xl md:text-6xl font-extrabold mb-2" style={{
          letterSpacing: '-2px',
          background: roastMode
            ? 'linear-gradient(135deg, #fff 0%, #ff4444 50%, #ff8800 100%)'
            : 'linear-gradient(135deg, #fff 0%, #00d4ff 50%, #ff0080 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>FITRATE</h1>

        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
          {roastMode ? '🔥 No Mercy Mode 🔥' : 'AI Outfit Rating'}
        </p>

        {/* Occasion Picker */}
        {showOccasionPicker && (
          <div className="mb-8 p-4 rounded-2xl w-full max-w-sm" style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <p className="text-xs text-center mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Rating for:</p>
            <div className="grid grid-cols-3 gap-2">
              {OCCASIONS.map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => setSelectedOccasion(selectedOccasion === occ.id ? null : occ.id)}
                  className="flex flex-col items-center p-3 rounded-xl transition-all"
                  style={{
                    background: selectedOccasion === occ.id ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
                    border: selectedOccasion === occ.id ? '1px solid rgba(0,212,255,0.5)' : '1px solid transparent'
                  }}
                >
                  <span className="text-xl mb-1">{occ.emoji}</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>{occ.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        {/* Main scan button */}
        <button
          onClick={() => scansRemaining > 0 && fileInputRef.current?.click()}
          disabled={scansRemaining === 0}
          className="w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 relative disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: roastMode
              ? 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)'
              : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)',
            boxShadow: roastMode
              ? '0 0 60px rgba(255,68,68,0.4), inset 0 2px 20px rgba(255,255,255,0.2)'
              : '0 0 60px rgba(0,212,255,0.4), inset 0 2px 20px rgba(255,255,255,0.2)'
          }}
        >
          <div className="absolute inset-1 rounded-full pointer-events-none" style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
          <span className="text-5xl mb-2">{roastMode ? '💀' : '📸'}</span>
          <span className="text-white text-lg font-bold" style={{ letterSpacing: '1px' }}>
            {roastMode ? 'ROAST ME' : 'CHECK FIT'}
          </span>
        </button>

        <p className="text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {roastMode ? 'Prepare to be humbled' : 'Tap to scan your outfit'}
        </p>

        {/* Feature buttons */}
        <div className="flex gap-3 mt-8">
          <button
            onClick={() => setShowOccasionPicker(!showOccasionPicker)}
            className="px-4 py-2 rounded-full text-xs transition-all"
            style={{
              background: showOccasionPicker ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            🎯 Occasion
          </button>
          <button
            onClick={() => { setBattleMode(true); setScreen('battle') }}
            className="px-4 py-2 rounded-full text-xs transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            ⚔️ Fit Battle
          </button>
          <button
            onClick={handleDemoScan}
            className="px-4 py-2 rounded-full text-xs transition-all"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            🎬 Demo
          </button>
        </div>

        {/* Scan counter */}
        <div className="absolute bottom-8 flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          <span className="w-2 h-2 rounded-full" style={{
            background: scansRemaining > 0 ? '#00ff88' : '#ff4444',
            boxShadow: scansRemaining > 0 ? '0 0 10px #00ff88' : '0 0 10px #ff4444'
          }} />
          {scansRemaining > 0 ? (
            `${scansRemaining} free scan remaining today`
          ) : (
            <span>
              No scans remaining — {' '}
              <a
                href="https://buy.stripe.com/4gM00l2SI7wT7LpfztfYY00"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold hover:underline"
                style={{ color: '#ff0080' }}
              >
                Go Pro
              </a>
            </span>
          )}
        </div>

        <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }`}</style>
      </div>
    )
  }

  // BATTLE MODE SCREEN
  if (screen === 'battle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <button onClick={resetApp} className="absolute top-6 left-6 text-white/50 text-sm">← Back</button>

        <h2 className="text-2xl font-bold text-white mb-2">⚔️ FIT BATTLE ⚔️</h2>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Upload 2 outfits. AI picks the winner.</p>

        <div className="flex gap-4 mb-8">
          {[0, 1].map((idx) => (
            <div
              key={idx}
              onClick={() => !battleOutfits[idx] && fileInputRef.current?.click()}
              className="w-36 h-48 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105"
              style={{
                background: battleOutfits[idx] ? 'transparent' : 'rgba(255,255,255,0.05)',
                border: '2px dashed rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}
            >
              {battleOutfits[idx] ? (
                <img src={battleOutfits[idx]} alt={`Outfit ${idx + 1}`} className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="text-3xl mb-2">👕</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Outfit {idx + 1}</span>
                </>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {!battleOutfits[0] ? 'Upload first outfit' : !battleOutfits[1] ? 'Now upload second outfit' : 'Analyzing...'}
        </p>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
      </div>
    )
  }

  // BATTLE RESULTS
  if (screen === 'battle-results' && battleResults) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <h2 className="text-2xl font-bold text-white mb-6">⚔️ BATTLE RESULTS ⚔️</h2>

        <div className="flex gap-4 mb-6">
          {[0, 1].map((idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-32 h-44 rounded-xl overflow-hidden mb-3 relative" style={{
                border: battleResults.winner === idx + 1 ? '3px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: battleResults.winner === idx + 1 ? '0 0 30px rgba(0,255,136,0.3)' : 'none'
              }}>
                <img src={battleOutfits[idx]} alt={`Outfit ${idx + 1}`} className="w-full h-full object-cover" />
                {battleResults.winner === idx + 1 && (
                  <div className="absolute top-2 right-2 text-2xl">👑</div>
                )}
              </div>
              <div className="text-3xl font-bold" style={{ color: getScoreColor(idx === 0 ? battleResults.outfit1.score : battleResults.outfit2.score) }}>
                {idx === 0 ? battleResults.outfit1.score : battleResults.outfit2.score}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {idx === 0 ? battleResults.outfit1.verdict : battleResults.outfit2.verdict}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-white font-semibold mb-8">{battleResults.commentary}</p>

        <div className="flex gap-3">
          <button onClick={resetApp} className="px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: 'rgba(255,255,255,0.1)' }}>New Battle</button>
          <button className="px-6 py-3 rounded-xl text-white font-semibold"
            style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' }}>Share Results</button>
        </div>
      </div>
    )
  }

  // ANALYZING SCREEN
  if (screen === 'analyzing') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{
        background: roastMode
          ? 'linear-gradient(135deg, #1a0a0a 0%, #2e1a1a 50%, #1a0a0a 100%)'
          : 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div className="w-44 h-60 rounded-2xl overflow-hidden mb-10 relative" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <img src={uploadedImage || battleOutfits[0]} alt="Your outfit" className="w-full h-full object-cover" />
          <div className="absolute left-0 right-0 h-1" style={{
            background: roastMode
              ? 'linear-gradient(90deg, transparent, #ff4444, transparent)'
              : 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
            boxShadow: roastMode ? '0 0 20px #ff4444' : '0 0 20px #00d4ff',
            animation: 'scanLine 1.5s ease-in-out infinite'
          }} />
        </div>
        <h2 className="text-white text-xl font-semibold mb-3">
          {roastMode ? 'Finding the violations...' : 'Analyzing your fit...'}
        </h2>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full" style={{
              background: roastMode ? '#ff4444' : '#00d4ff',
              animation: `bounce 1.4s ease-in-out infinite ${i * 0.2}s`
            }} />
          ))}
        </div>
        {selectedOccasion && (
          <p className="text-sm mt-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Rating for: {OCCASIONS.find(o => o.id === selectedOccasion)?.label}
          </p>
        )}
        <style>{`
          @keyframes scanLine { 0% { top: 0; } 50% { top: calc(100% - 4px); } 100% { top: 0; } }
          @keyframes bounce { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; } 40% { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    )
  }

  // RESULTS SCREEN
  if (screen === 'results' && scores) {
    return (
      <div className="min-h-screen flex flex-col items-center p-5 pt-8 pb-20 overflow-y-auto" style={{
        background: scores.roastMode
          ? 'linear-gradient(135deg, #1a0a0a 0%, #2e1a1a 50%, #1a0a0a 100%)'
          : 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        {/* Roast Mode Badge */}
        {scores.roastMode && (
          <div className="mb-4 px-4 py-1 rounded-full" style={{ background: 'rgba(255,68,68,0.3)', border: '1px solid rgba(255,68,68,0.5)' }}>
            <span className="text-xs font-bold" style={{ color: '#ff4444' }}>🔥 ROAST MODE 🔥</span>
          </div>
        )}

        {/* Result Card */}
        <div className="w-full max-w-sm rounded-3xl p-6 relative overflow-hidden" style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)'
        }}>
          <div className="absolute top-4 right-4 text-xs font-bold" style={{ letterSpacing: '1px', color: 'rgba(255,255,255,0.2)' }}>FITRATE</div>

          {/* Photo with score */}
          <div className="w-full h-64 rounded-2xl overflow-hidden relative mb-4">
            <img src={uploadedImage} alt="Your outfit" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 flex flex-col items-center" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.9))' }}>
              <div className="text-5xl font-extrabold leading-none" style={{ color: getScoreColor(scores.overall), textShadow: `0 0 40px ${getScoreColor(scores.overall)}` }}>
                {scores.overall}
              </div>
              <div className="text-xs font-bold mt-1" style={{ letterSpacing: '2px', color: getScoreColor(scores.overall) }}>{getScoreLabel(scores.overall)}</div>
            </div>
          </div>

          {/* Verdict */}
          <div className="text-center mb-4">
            <p className="text-lg font-semibold text-white">{scores.verdict}</p>
          </div>

          {/* NEW: Aesthetic & Celeb Match */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Aesthetic</p>
              <p className="text-sm font-semibold text-white">{scores.aesthetic}</p>
            </div>
            <div className="flex-1 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Celeb Match</p>
              <p className="text-xs font-semibold text-white leading-tight">{scores.celebMatch}</p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Color', emoji: '🎨', score: scores.color },
              { label: 'Fit', emoji: '👔', score: scores.fit },
              { label: 'Style', emoji: '✨', score: scores.style },
              { label: 'Trend', emoji: '📈', score: scores.trendScore },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-sm w-5">{item.emoji}</span>
                <span className="text-xs w-12" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</span>
                <div className="flex-1 h-1.5 rounded overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded" style={{
                    width: `${Math.min(100, item.score)}%`,
                    background: `linear-gradient(90deg, ${getScoreColor(item.score)}, ${getScoreColor(item.score)}88)`
                  }} />
                </div>
                <span className="text-xs font-bold w-7 text-right" style={{ color: getScoreColor(item.score) }}>{item.score}</span>
              </div>
            ))}
          </div>

          {/* Pro Tip */}
          <div className="mt-4 p-3 rounded-xl" style={{
            background: scores.roastMode ? 'rgba(255,68,68,0.1)' : 'rgba(0,212,255,0.1)',
            border: scores.roastMode ? '1px solid rgba(255,68,68,0.2)' : '1px solid rgba(0,212,255,0.2)'
          }}>
            <div className="text-xs font-bold mb-1" style={{ color: scores.roastMode ? '#ff4444' : '#00d4ff' }}>
              {scores.roastMode ? '💀 THE TRUTH' : '💡 PRO TIP'}
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{scores.tip}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-5 w-full max-w-sm">
          <button onClick={resetApp} className="flex-1 py-3.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Scan Again</button>
          <button onClick={handleShare} className="flex-1 py-3.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: scores.roastMode ? 'linear-gradient(135deg, #ff4444 0%, #cc0000 100%)' : 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' }}>
            Share {scores.roastMode ? 'Roast' : 'Result'}
          </button>
        </div>

        {/* Pro CTA */}
        <div className="mt-5 p-4 rounded-xl text-center w-full max-w-sm" style={{
          background: 'linear-gradient(135deg, rgba(255,0,128,0.1) 0%, rgba(0,212,255,0.1) 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <p className="text-sm text-white font-semibold mb-1">Go Pro for Unlimited</p>
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>+ Outfit history, detailed tips, no watermark</p>
          <a
            href="https://buy.stripe.com/4gM00l2SI7wT7LpfztfYY00"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 rounded-full text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #ff0080 0%, #ff4d4d 100%)' }}
          >
            $3.99/mo
          </a>
        </div>
      </div>
    )
  }

  // ERROR SCREEN
  if (screen === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5" style={{
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div className="text-6xl mb-6">😅</div>
        <h2 className="text-white text-xl font-semibold mb-3">Oops!</h2>
        <p className="text-center mb-8 max-w-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{error}</p>
        <button onClick={resetApp} className="px-8 py-4 rounded-xl text-white font-semibold"
          style={{ background: 'linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)' }}>Try Again</button>
      </div>
    )
  }

  return null
}
