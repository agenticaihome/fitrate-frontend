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
    cardDNA = null
}) => {
    return new Promise(async (resolve, reject) => {
        try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            // Fixed dimensions (story format only for maximum impact)
            canvas.width = 1080
            canvas.height = 1920

            // Load user image
            const img = await new Promise((imgResolve, imgReject) => {
                const img = new Image()
                img.crossOrigin = 'anonymous'
                img.onload = () => imgResolve(img)
                img.onerror = imgReject
                img.src = uploadedImage
            })

            // ===== SCORE-BASED COLOR SYSTEM (HARD-SPEC ranges) =====
            const score = Math.round(scores.overall)
            const getScoreBadgeColors = () => {
                // HARD-SPEC: exact color tiers
                if (score >= 90) return { from: '#ffd700', to: '#fff8dc' }      // 90+ → Gold → soft white
                if (score >= 80) return { from: '#50C878', to: '#98FB98' }      // 80-89 → Green → mint
                if (score >= 70) return { from: '#20B2AA', to: '#50C878' }      // 70-79 → Teal → green
                if (score >= 50) return { from: '#DAA520', to: '#20B2AA' }      // 50-69 → Amber → teal
                return { from: '#CD853F', to: '#DAA520' }                        // 0-49 → Muted amber / tired orange
            }
            const badgeColors = getScoreBadgeColors()

            // ===== DARK PREMIUM BACKGROUND =====
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            bgGradient.addColorStop(0, '#0a0a12')
            bgGradient.addColorStop(0.5, '#0f0f18')
            bgGradient.addColorStop(1, '#0a0a12')
            ctx.fillStyle = bgGradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Subtle warm accent glow (right side) - restrained
            const accentGlow = ctx.createRadialGradient(canvas.width, canvas.height * 0.4, 0, canvas.width, canvas.height * 0.4, 400)
            accentGlow.addColorStop(0, `${badgeColors.from}15`)
            accentGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = accentGlow
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // ===== SECTION 1: HERO IMAGE (60-65% of height) =====
            const imageMargin = 40
            const imageWidth = canvas.width - (imageMargin * 2)
            const imageHeight = Math.floor(canvas.height * 0.62)  // 62% of canvas
            const imageY = 60
            const imageRadius = 24

            // Draw image with rounded corners
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(imageMargin, imageY, imageWidth, imageHeight, imageRadius)
            ctx.clip()

            // Cover scaling for image (TIGHTER CROP - 8% more zoom, face in upper third)
            const imgAspect = img.width / img.height
            const targetAspect = imageWidth / imageHeight
            let drawWidth, drawHeight, drawX, drawY
            const cropTightness = 1.08  // 8% tighter crop

            if (imgAspect > targetAspect) {
                drawHeight = imageHeight * cropTightness
                drawWidth = drawHeight * imgAspect
                drawX = imageMargin + (imageWidth - drawWidth) / 2
                drawY = imageY - (drawHeight - imageHeight) * 0.3  // Shift up for face focus
            } else {
                drawWidth = imageWidth * cropTightness
                drawHeight = drawWidth / imgAspect
                drawX = imageMargin - (drawWidth - imageWidth) / 2
                drawY = imageY - (drawHeight - imageHeight) * 0.3  // Shift up for face focus
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

            // Vignette fade at bottom for text legibility
            const vignette = ctx.createLinearGradient(0, imageY + imageHeight - 200, 0, imageY + imageHeight)
            vignette.addColorStop(0, 'transparent')
            vignette.addColorStop(1, 'rgba(0,0,0,0.6)')
            ctx.fillStyle = vignette
            ctx.fillRect(imageMargin, imageY, imageWidth, imageHeight)

            // MODE-COLORED OVERLAY - subtle tint matching mode energy
            const currentMode = scores.mode || 'honest'
            const modeConfig = MODE_CONFIG[currentMode] || MODE_CONFIG.honest
            const modeGradientMatch = modeConfig.gradient.match(/#[a-fA-F0-9]{6}/g)
            const modeColor = modeGradientMatch ? modeGradientMatch[0] : '#3b82f6'

            // Subtle color wash from top
            const colorWash = ctx.createLinearGradient(0, imageY, 0, imageY + imageHeight * 0.4)
            colorWash.addColorStop(0, `${modeColor}25`)  // 15% opacity at top
            colorWash.addColorStop(1, 'transparent')
            ctx.fillStyle = colorWash
            ctx.fillRect(imageMargin, imageY, imageWidth, imageHeight)

            ctx.restore()

            // Subtle border around image
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(imageMargin, imageY, imageWidth, imageHeight, imageRadius)
            ctx.stroke()

            // ===== SECTION 2: SCORE BADGE - MASSIVE for mobile =====
            const badgeSize = 170  // MASSIVE badge
            const badgeX = canvas.width / 2
            const badgeY = imageY + imageHeight - badgeSize * 0.25

            // Badge outer glow
            ctx.shadowColor = badgeColors.from
            ctx.shadowBlur = 30

            // Badge ring gradient
            const badgeGradient = ctx.createLinearGradient(
                badgeX - badgeSize / 2, badgeY - badgeSize / 2,
                badgeX + badgeSize / 2, badgeY + badgeSize / 2
            )
            badgeGradient.addColorStop(0, badgeColors.from)
            badgeGradient.addColorStop(1, badgeColors.to)

            // Draw ring - thicker
            ctx.beginPath()
            ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2)
            ctx.strokeStyle = badgeGradient
            ctx.lineWidth = 12
            ctx.stroke()
            ctx.shadowBlur = 0

            // Badge inner dark fill
            ctx.beginPath()
            ctx.arc(badgeX, badgeY, badgeSize / 2 - 10, 0, Math.PI * 2)
            ctx.fillStyle = '#0f0f18'
            ctx.fill()

            // Score number - MASSIVE
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 92px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(score.toString(), badgeX, badgeY - 12)

            // /100 below score - bigger
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.font = '28px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.fillText('/100', badgeX, badgeY + 46)

            // ===== SECTION 3: MODE BADGE - MASSIVE for mobile =====
            const modeBadgeY = imageY + imageHeight + 70
            const modeBadgeHeight = 56
            const modeBadgeText = `${modeConfig.emoji} ${modeConfig.label}`

            // Measure mode badge width - BIGGER font
            ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif'
            const modeBadgeTextWidth = ctx.measureText(modeBadgeText).width
            const modeBadgeWidth = modeBadgeTextWidth + 48
            const modeBadgeX = (canvas.width - modeBadgeWidth) / 2

            // Use mode color for glow
            const modeGlowColor = modeColor

            // Mode badge glow
            ctx.shadowColor = modeGlowColor
            ctx.shadowBlur = 20

            // Mode badge gradient background
            const modeBadgeGradient = ctx.createLinearGradient(modeBadgeX, modeBadgeY, modeBadgeX + modeBadgeWidth, modeBadgeY)
            if (modeGradientMatch && modeGradientMatch.length >= 2) {
                modeBadgeGradient.addColorStop(0, modeGradientMatch[0])
                modeBadgeGradient.addColorStop(1, modeGradientMatch[1])
            } else {
                modeBadgeGradient.addColorStop(0, '#3b82f6')
                modeBadgeGradient.addColorStop(1, '#06b6d4')
            }

            ctx.fillStyle = modeBadgeGradient
            ctx.beginPath()
            ctx.roundRect(modeBadgeX, modeBadgeY, modeBadgeWidth, modeBadgeHeight, modeBadgeHeight / 2)
            ctx.fill()
            ctx.shadowBlur = 0

            // Mode badge text - MASSIVE
            ctx.fillStyle = modeConfig.textColor
            ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(modeBadgeText, canvas.width / 2, modeBadgeY + modeBadgeHeight / 2)

            // ===== SECTION 4: VERDICT HEADLINE - HUGE for mobile =====
            const verdictY = modeBadgeY + modeBadgeHeight + 50
            const verdict = scores.verdict || scores.tagline || 'Looking good today.'

            ctx.fillStyle = '#ffffff'
            ctx.font = '800 64px -apple-system, BlinkMacSystemFont, sans-serif'  // MASSIVE - grandma can read it
            ctx.textAlign = 'center'
            ctx.textBaseline = 'alphabetic'

            // Wrap to multiple lines - that's fine, makes it readable
            const verdictLines = wrapText(ctx, verdict, canvas.width - 100)
            verdictLines.slice(0, 3).forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2, verdictY + (i * 72))
            })

            // ===== SECTION 5: CTA BUTTON - matches MODE color =====
            const ctaY = verdictY + (verdictLines.length * 72) + 50
            const ctaWidth = 580
            const ctaHeight = 88
            const ctaX = (canvas.width - ctaWidth) / 2
            const ctaText = pickRandom(CTA_VARIANTS)
            const ctaRadius = 22

            // CTA gradient matches mode color
            const ctaGradient = ctx.createLinearGradient(ctaX, ctaY, ctaX + ctaWidth, ctaY)
            if (modeGradientMatch && modeGradientMatch.length >= 2) {
                ctaGradient.addColorStop(0, modeGradientMatch[0])
                ctaGradient.addColorStop(1, modeGradientMatch[1])
            } else {
                ctaGradient.addColorStop(0, '#10b981')
                ctaGradient.addColorStop(1, '#06b6d4')
            }

            ctx.fillStyle = ctaGradient
            ctx.beginPath()
            ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaRadius)
            ctx.fill()

            // Button text
            ctx.fillStyle = modeConfig.textColor
            ctx.font = 'bold 34px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(ctaText, canvas.width / 2, ctaY + ctaHeight / 2)

            // ===== SECTION 6: TIMESTAMP - adds authenticity =====
            const now = new Date()
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            const modeVerb = currentMode === 'roast' ? 'Roasted' : currentMode === 'nice' ? 'Rated' : 'Scored'
            const timestamp = `${modeVerb} ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`

            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '24px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(timestamp, canvas.width / 2, ctaY + ctaHeight + 45)

            // ===== SECTION 7: FITRATE WATERMARK =====
            ctx.fillStyle = 'rgba(255,255,255,0.35)'
            ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('FitRate.app', canvas.width / 2, canvas.height - 50)

            // ===== GENERATE SHARE TEXT =====
            const getShareText = () => {
                const baseUrl = 'https://fitrate.app'
                const link = `${baseUrl}?ref=${userId}`

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
                const url = `https://fitrate.app?ref=${userId}`

                resolve({
                    file,
                    text,
                    url,
                    imageBlob: blob
                })
            }, 'image/png')

        } catch (error) {
            reject(error)
        }
    })
}
