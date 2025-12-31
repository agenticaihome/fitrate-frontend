import { getScoreColor } from './scoreUtils'

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

// ============================================
// HARD-SPEC: UNIQUENESS ENGINE - Rotation Pools
// ============================================

// AI INSIGHT LINE pools (explains WHY the score exists - neutral, editor tone)
// HARD-SPEC: ONE sentence, neutral, max ~90 chars, no emojis, no advice
const AI_INSIGHT_POOLS = {
    high: [
        'Color harmony works well; proportions carry the look.',
        'Clear intention with solid execution across the board.',
        'Silhouette and palette are working in sync here.',
        'Everything reads intentional, nothing feels forced.',
        'Strong fundamentals with a confident finish.'
    ],
    mid: [
        'Comfort-first approach with minimal styling risk.',
        'Functional fit; reads practical more than polished.',
        'Some coordination, but the pieces don\'t quite gel.',
        'Safe choices that don\'t push in any direction.',
        'Color is fine, but silhouette needs attention.'
    ],
    low: [
        'Fit does most of the work here — not much else lands.',
        'Color and proportion are working against each other.',
        'Reads more random than intentional.',
        'Missing cohesion between the pieces.',
        'Function over form — styling didn\'t show up.'
    ]
}

// CTA button variants - clearer, punchier
const CTA_VARIANTS = [
    'Get roasted → fitrate.app',
    'Rate YOUR fit → fitrate.app',
    'Can you do better? → fitrate.app'
]

// Pick random from array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ============================================
// MODE CONFIGURATION - Dynamic mode badge styling
// ============================================
const MODE_CONFIG = {
    nice: { gradient: 'linear-gradient(135deg, #00ff88 0%, #00d4ff 100%)', emoji: '😊', label: 'NICE MODE', textColor: '#000' },
    roast: { gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)', emoji: '🔥', label: 'ROAST MODE', textColor: '#fff' },
    honest: { gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', emoji: '💯', label: 'HONEST MODE', textColor: '#fff' },
    savage: { gradient: 'linear-gradient(135deg, #ff1493 0%, #ff0066 100%)', emoji: '💀', label: 'SAVAGE MODE', textColor: '#fff' },
    rizz: { gradient: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)', emoji: '😏', label: 'RIZZ MODE', textColor: '#fff' },
    celeb: { gradient: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)', emoji: '⭐', label: 'CELEB MODE', textColor: '#000' },
    aura: { gradient: 'linear-gradient(135deg, #9b59b6 0%, #8b5cf6 100%)', emoji: '✨', label: 'AURA MODE', textColor: '#fff' },
    chaos: { gradient: 'linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%)', emoji: '🎲', label: 'CHAOS MODE', textColor: '#fff' },
    event: { gradient: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', emoji: '🏆', label: 'EVENT MODE', textColor: '#fff' }
}


// ============================================
// GOLDEN RESULT CARD GENERATOR
// ============================================

export const generateShareCard = async ({
    scores,
    shareFormat,
    uploadedImage,
    userId,
    isPro,
    eventContext = null,
    dailyChallengeContext = null,
    cardDNA = null,
    isChallenge = false,  // When true, generates a challenge link with score
    challengeUrl = null,  // The /c/:id URL from backend (if created)
    creatorMode = false,  // P4.4: Square format for TikTok/Instagram
    creatorHandle = null  // P4.4: Optional @handle watermark
}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // P4.4: Creator mode uses square 1:1 format for TikTok/Instagram
            // Story format (9:16) is default for maximum vertical impact
            canvas.width = 1080
            canvas.height = creatorMode ? 1080 : 1920

            // Load user image AND logo in parallel
            const [img, logoImg] = await Promise.all([
                new Promise((imgResolve, imgReject) => {
                    const img = new Image()
                    img.crossOrigin = 'anonymous'
                    img.onload = () => imgResolve(img)
                    img.onerror = imgReject
                    img.src = uploadedImage
                }),
                new Promise((logoResolve) => {
                    const logo = new Image()
                    logo.crossOrigin = 'anonymous'
                    logo.onload = () => logoResolve(logo)
                    logo.onerror = () => logoResolve(null) // Don't fail if logo missing
                    logo.src = '/logo.svg'
                })
            ])

            // ===== SCORE-BASED COLOR SYSTEM =====
            const score = Math.round(scores.overall)
            const currentMode = scores.mode || 'honest'
            const modeConfig = MODE_CONFIG[currentMode] || MODE_CONFIG.honest
            const modeGradientMatch = modeConfig.gradient.match(/#[a-fA-F0-9]{6}/g)
            const modeColor = modeGradientMatch ? modeGradientMatch[0] : '#3b82f6'

            // Get score ring color based on score tier
            const getScoreRingColor = () => {
                if (score >= 90) return { from: '#ffd700', to: '#ff8c00' }  // Gold
                if (score >= 75) return { from: '#00ff88', to: '#00d4ff' }  // Green-Cyan
                if (score >= 60) return { from: '#00d4ff', to: '#3b82f6' }  // Blue
                if (score >= 40) return { from: '#f59e0b', to: '#ef4444' }  // Amber-Red
                return { from: '#ef4444', to: '#dc2626' }  // Red
            }
            const ringColors = getScoreRingColor()

            // ===== FULL-BLEED PHOTO BACKGROUND =====
            // Photo fills entire canvas - this is the key to the clean look
            const imgAspect = img.width / img.height
            const canvasAspect = canvas.width / canvas.height
            let drawWidth, drawHeight, drawX, drawY

            // Cover scaling - fill entire canvas, crop as needed
            if (imgAspect > canvasAspect) {
                drawHeight = canvas.height
                drawWidth = drawHeight * imgAspect
                drawX = (canvas.width - drawWidth) / 2
                drawY = 0
            } else {
                drawWidth = canvas.width
                drawHeight = drawWidth / imgAspect
                drawX = 0
                drawY = (canvas.height - drawHeight) / 3  // Bias upward for face
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

            // ===== GRADIENT OVERLAYS FOR TEXT LEGIBILITY =====
            // Top gradient for mode badge area
            const topGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.25)
            topGradient.addColorStop(0, 'rgba(0,0,0,0.5)')
            topGradient.addColorStop(1, 'transparent')
            ctx.fillStyle = topGradient
            ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3)

            // Bottom gradient for text content
            const bottomGradient = ctx.createLinearGradient(0, canvas.height * 0.45, 0, canvas.height)
            bottomGradient.addColorStop(0, 'transparent')
            bottomGradient.addColorStop(0.3, 'rgba(0,0,0,0.4)')
            bottomGradient.addColorStop(1, 'rgba(0,0,0,0.85)')
            ctx.fillStyle = bottomGradient
            ctx.fillRect(0, canvas.height * 0.4, canvas.width, canvas.height * 0.6)

            // ===== STRICT VERTICAL ZONE SYSTEM =====
            // "If anything crosses lanes → redesign"
            // Zone 1: Headline ONLY
            // Zone 2: Score + Mode ONLY  
            // Zone 3: Insight + Supporting text ONLY
            // Zone 4: Metrics + CTA

            let verdict = scores.verdict || scores.tagline || 'Looking good today.'

            // Strip emoji from headline - headlines = album titles, not captions
            verdict = verdict.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim()

            // ===== ZONE 1: HEADLINE (HERO) =====
            // Fixed anchor - does not move based on content
            const heroY = canvas.height * 0.57  // Locked position (tightened from 0.55)

            ctx.shadowColor = 'rgba(0,0,0,0.7)'
            ctx.shadowBlur = 15
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 4

            ctx.fillStyle = '#ffffff'
            ctx.font = '800 80px -apple-system, BlinkMacSystemFont, sans-serif'  // Slightly smaller for tighter lines
            ctx.textAlign = 'center'
            ctx.textBaseline = 'alphabetic'

            const verdictLines = wrapText(ctx, verdict, canvas.width - 80)
            const lineHeight = 85  // Tighter line height
            verdictLines.slice(0, 2).forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2, heroY + (i * lineHeight))
            })

            ctx.shadowColor = 'transparent'
            ctx.shadowBlur = 0
            ctx.shadowOffsetX = 0
            ctx.shadowOffsetY = 0

            // Calculate headline bottom - this is the zone boundary
            const headlineBottomY = heroY + ((Math.min(verdictLines.length, 2) - 1) * lineHeight) + 30

            // ===== ZONE 2: SCORE + MODE (Hard anchor below headline) =====
            // Minimum safe gap from headline bottom
            const safeGap = 28  // Tightened from 40 - "intentionally paired"
            const badgeSize = 140  // Compact stamp
            const badgeX = canvas.width / 2
            const badgeY = headlineBottomY + safeGap + (badgeSize / 2)  // Center of ring

            // Ring gradient
            const ringGradient = ctx.createLinearGradient(
                badgeX - badgeSize / 2, badgeY - badgeSize / 2,
                badgeX + badgeSize / 2, badgeY + badgeSize / 2
            )
            ringGradient.addColorStop(0, ringColors.from)
            ringGradient.addColorStop(1, ringColors.to)

            // Subtle glow
            ctx.shadowColor = ringColors.from
            ctx.shadowBlur = 18

            // Draw ring
            ctx.beginPath()
            ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2)
            ctx.strokeStyle = ringGradient
            ctx.lineWidth = 7
            ctx.stroke()
            ctx.shadowBlur = 0

            // Dark fill inside ring
            ctx.beginPath()
            ctx.arc(badgeX, badgeY, badgeSize / 2 - 5, 0, Math.PI * 2)
            ctx.fillStyle = 'rgba(0,0,0,0.8)'
            ctx.fill()

            // Score number
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 65px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(score.toString(), badgeX, badgeY - 3)

            // /100 - minimal
            ctx.fillStyle = 'rgba(255,255,255,0.35)'
            ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.fillText('/100', badgeX, badgeY + 28)

            // MODE BADGE - Attached to score ring like a label
            const modeBadgeY = badgeY + badgeSize / 2 + 8  // Very tight to ring
            const modeBadgeHeight = 32
            const modeBadgeText = `${modeConfig.emoji} ${modeConfig.label}`

            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
            const modeBadgeTextWidth = ctx.measureText(modeBadgeText).width
            const modeBadgeWidth = modeBadgeTextWidth + 22
            const modeBadgeX = (canvas.width - modeBadgeWidth) / 2

            ctx.fillStyle = 'rgba(255,255,255,0.06)'
            ctx.beginPath()
            ctx.roundRect(modeBadgeX, modeBadgeY, modeBadgeWidth, modeBadgeHeight, modeBadgeHeight / 2)
            ctx.fill()

            ctx.strokeStyle = 'rgba(255,255,255,0.12)'
            ctx.lineWidth = 1
            ctx.stroke()

            ctx.fillStyle = 'rgba(255,255,255,0.65)'
            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(modeBadgeText, canvas.width / 2, modeBadgeY + modeBadgeHeight / 2)

            // Zone 2 boundary
            const scoreZoneBottomY = modeBadgeY + modeBadgeHeight

            // ===== ZONE 3: INSIGHT (Below score zone with hard gap) =====
            const zone3Gap = 25  // Tightened from 35 - subordinate zone
            const insightY = scoreZoneBottomY + zone3Gap
            const insightPool = score >= 75 ? AI_INSIGHT_POOLS.high : score >= 50 ? AI_INSIGHT_POOLS.mid : AI_INSIGHT_POOLS.low
            const insight = scores.insight || pickRandom(insightPool)

            ctx.fillStyle = 'rgba(255,255,255,0.50)'  // Quieter
            ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif'
            const insightLines = wrapText(ctx, insight, canvas.width - 100)
            insightLines.slice(0, 2).forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2, insightY + (i * 34))
            })

            // ===== CELEBRITY JUDGE BADGE - Celeb Mode Only =====
            const insightBottomY = insightY + (Math.min(insightLines.length, 2) * 38)
            let judgeBadgeBottomY = insightBottomY  // Track where content ends for spacing

            if (currentMode === 'celeb' && scores.judgedBy) {
                const judgeBadgeY = insightBottomY + 30
                const judgeBadgeHeight = 48
                const judgeText = `🎭 Judged by ${scores.judgedBy}`

                ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif'
                const judgeBadgeTextWidth = ctx.measureText(judgeText).width
                const judgeBadgeWidth = judgeBadgeTextWidth + 40
                const judgeBadgeX = (canvas.width - judgeBadgeWidth) / 2

                // Dark badge background with gold border
                ctx.fillStyle = 'rgba(0,0,0,0.6)'
                ctx.beginPath()
                ctx.roundRect(judgeBadgeX, judgeBadgeY, judgeBadgeWidth, judgeBadgeHeight, 24)
                ctx.fill()

                // Gold border
                ctx.strokeStyle = 'rgba(255,215,0,0.5)'
                ctx.lineWidth = 2
                ctx.stroke()

                // Judge text in gold
                ctx.fillStyle = '#ffd700'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(judgeText, canvas.width / 2, judgeBadgeY + judgeBadgeHeight / 2)

                judgeBadgeBottomY = judgeBadgeY + judgeBadgeHeight
            }

            // ===== CELEBRITY MATCH BADGE - When AI detects celeb vibes =====
            if (scores.celebMatch) {
                const celebBadgeY = judgeBadgeBottomY + 25
                const celebBadgeHeight = 52
                const celebText = `⭐ Vibes like ${scores.celebMatch} ⭐`

                ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif'
                const celebBadgeTextWidth = ctx.measureText(celebText).width
                const celebBadgeWidth = celebBadgeTextWidth + 50
                const celebBadgeX = (canvas.width - celebBadgeWidth) / 2

                // Orange gradient background
                const celebGradient = ctx.createLinearGradient(celebBadgeX, celebBadgeY, celebBadgeX + celebBadgeWidth, celebBadgeY)
                celebGradient.addColorStop(0, 'rgba(255,107,53,0.25)')
                celebGradient.addColorStop(1, 'rgba(255,0,128,0.15)')
                ctx.fillStyle = celebGradient
                ctx.beginPath()
                ctx.roundRect(celebBadgeX, celebBadgeY, celebBadgeWidth, celebBadgeHeight, 26)
                ctx.fill()

                // Orange border
                ctx.strokeStyle = 'rgba(255,107,53,0.5)'
                ctx.lineWidth = 2
                ctx.stroke()

                // Text in white
                ctx.fillStyle = '#ffffff'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(celebText, canvas.width / 2, celebBadgeY + celebBadgeHeight / 2)
            }

            // ===== SUBSCORES ROW - Compact & Clean =====
            const subscoreY = canvas.height - 270
            const subscores = [
                { icon: '🎨', label: 'Color', value: scores.color || Math.round(score + (Math.random() * 6 - 3)) },
                { icon: '👔', label: 'Fit', value: scores.fit || Math.round(score + (Math.random() * 6 - 3)) },
                { icon: '✨', label: 'Style', value: scores.style || Math.round(score + (Math.random() * 6 - 3)) }
            ]

            const subscoreItemWidth = 160
            const subscoreGap = 20
            const totalSubscoreWidth = (subscoreItemWidth * 3) + (subscoreGap * 2)
            const subscoreStartX = (canvas.width - totalSubscoreWidth) / 2

            // Background pill for subscores - tighter
            ctx.fillStyle = 'rgba(0,0,0,0.55)'
            ctx.beginPath()
            ctx.roundRect(subscoreStartX - 15, subscoreY - 12, totalSubscoreWidth + 30, 62, 31)
            ctx.fill()

            subscores.forEach((sub, i) => {
                const x = subscoreStartX + (i * (subscoreItemWidth + subscoreGap)) + subscoreItemWidth / 2

                // Compact format: "🎨 Color  55"
                ctx.fillStyle = 'rgba(255,255,255,0.55)'
                ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.textAlign = 'right'
                ctx.fillText(`${sub.icon} ${sub.label}`, x - 8, subscoreY + 24)

                // Value - bold, white
                ctx.fillStyle = '#ffffff'
                ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.textAlign = 'left'
                ctx.fillText(sub.value.toString(), x + 8, subscoreY + 24)
            })

            // ===== CTA BUTTON =====
            const ctaY = canvas.height - 185  // Moved up slightly
            const ctaWidth = 580  // Slightly narrower for elegance
            const ctaHeight = 68
            const ctaX = (canvas.width - ctaWidth) / 2
            const ctaText = 'Post yours → fitrate.app'

            // Mode-specific gradient for CTA (matches the vibe!)
            const ctaGradient = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY)
            if (modeGradientMatch && modeGradientMatch.length >= 2) {
                ctaGradient.addColorStop(0, modeGradientMatch[0])
                ctaGradient.addColorStop(1, modeGradientMatch[1])
            } else {
                ctaGradient.addColorStop(0, '#10b981')
                ctaGradient.addColorStop(1, '#059669')
            }

            ctx.fillStyle = ctaGradient
            ctx.beginPath()
            ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, 16)
            ctx.fill()

            // CTA text - use mode-specific text color
            ctx.fillStyle = modeConfig.textColor || '#000000'
            ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(ctaText, canvas.width / 2, ctaY + ctaHeight / 2)

            // ===== DATE STAMP - Compact format =====
            const now = new Date()
            const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const dateStr = `${shortMonths[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

            // For celeb mode, show disclaimer instead of just date
            const dateY = canvas.height - 100
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'

            if (currentMode === 'celeb') {
                // Show disclaimer with date for celeb mode
                ctx.font = '20px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.fillText('AI parody • Not a real celeb • ' + dateStr, canvas.width / 2, dateY)
            } else {
                ctx.fillText(dateStr, canvas.width / 2, dateY)
            }

            // ===== FITRATE LOGO - Enhanced with glow =====
            const logoY = canvas.height - 55
            if (logoImg) {
                const logoHeight = 48  // Slightly larger
                const logoWidth = (logoImg.width / logoImg.height) * logoHeight
                const logoX = (canvas.width - logoWidth) / 2

                // Add subtle glow around logo
                ctx.shadowColor = 'rgba(255,255,255,0.4)'
                ctx.shadowBlur = 15
                ctx.globalAlpha = 0.85  // Increased contrast
                ctx.drawImage(logoImg, logoX, logoY - logoHeight / 2, logoWidth, logoHeight)
                ctx.globalAlpha = 1.0
                ctx.shadowBlur = 0
            } else {
                // Fallback text logo with glow
                ctx.shadowColor = 'rgba(255,255,255,0.3)'
                ctx.shadowBlur = 10
                ctx.fillStyle = 'rgba(255,255,255,0.75)'
                ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.fillText('FitRate', canvas.width / 2, logoY)
                ctx.shadowBlur = 0
            }

            // ===== P4.4: CREATOR HANDLE WATERMARK =====
            if (creatorHandle) {
                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.textAlign = 'center'
                // Position handle at bottom right corner
                const handleX = canvas.width - 100
                const handleY = canvas.height - 25
                ctx.textAlign = 'right'
                ctx.fillText(creatorHandle.startsWith('@') ? creatorHandle : `@${creatorHandle}`, handleX, handleY)
                ctx.textAlign = 'center'  // Reset alignment
            }

            // ===== GENERATE SHARE TEXT =====
            const getShareText = () => {
                const baseUrl = 'https://fitrate.app'
                // Prefer the new /c/:id party URL if provided, fallback to old query param
                const link = isChallenge
                    ? (challengeUrl || `${baseUrl}?ref=${userId}&challenge=${score}`)
                    : `${baseUrl}?ref=${userId}`

                // Challenge-specific copy - competitive and clear
                if (isChallenge) {
                    if (score >= 90) return `I got ${score}/100. Think you can beat that? 🔥\n${link}`
                    if (score >= 75) return `${score}/100. Your turn — let's see what you got 👀\n${link}`
                    if (score >= 50) return `I got ${score}. Can you do better?\n${link}`
                    return `${score}/100... surely you can beat this 😅\n${link}`
                }

                // Celebrity mode - include judge name
                if (currentMode === 'celeb' && scores.judgedBy) {
                    if (score >= 90) return `${scores.judgedBy} gave me ${score}/100! 🎭 #FitRateCeleb\n${link}`
                    if (score >= 75) return `${scores.judgedBy} judged my outfit: ${score}/100 🎭 #FitRateCeleb\n${link}`
                    if (score >= 50) return `${scores.judgedBy} wasn't impressed... ${score}/100 🎭 #FitRateCeleb\n${link}`
                    return `${scores.judgedBy} destroyed me 💀 ${score}/100 #FitRateCeleb\n${link}`
                }

                if (scores.roastMode || scores.mode === 'roast') {
                    if (score < 40) return `AI gave me a ${score}. Fair or personal? 💀 ${link}`
                    if (score < 60) return `"${scores.verdict}" — agree? 👇 ${link}`
                    return `Survived the roast with ${score}/100. Your turn? 🔥 ${link}`
                }

                if (dailyChallengeContext && dailyChallengeContext.rank) {
                    return dailyChallengeContext.rank === 1
                        ? `#1 in today's Daily Challenge! 👑 ${link}`
                        : `Rank #${dailyChallengeContext.rank} today. Beat me? ${link}`
                }

                if (score >= 90) return `${score}/100. Beat that? 🏆 ${link}`
                if (score >= 75) return `AI approved: ${score}/100 ✨ ${link}`
                return `Got ${score}/100. Thoughts? ${link}`
            }

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas to Blob failed'))
                    return
                }
                const file = new File([blob], 'fitrate-score.png', { type: 'image/png' })
                const text = getShareText()
                // URL matches the share text - prefer party URL if created
                const url = isChallenge
                    ? (challengeUrl || `https://fitrate.app?ref=${userId}&challenge=${score}`)
                    : `https://fitrate.app?ref=${userId}`

                resolve({
                    file,
                    text,
                    url,
                    imageBlob: blob,
                    isChallenge  // Pass through so caller knows this was a challenge share
                })
            }, 'image/png')

        } catch (error) {
            reject(error)
        }
    })
}
