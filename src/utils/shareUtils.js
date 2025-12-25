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
// UNIQUENESS ENGINE - Rotation Pools
// ============================================

// Vibe tag pools (Aesthetic · Reference format)
const VIBE_TAGS = {
    high: [
        'Main Character · Street Edit',
        'Clean Money · Quiet Flex',
        'Effortless · NYC Core',
        'Old Money · New Energy',
        'Soft Launch · Premium',
        'Editorial · Off-Duty',
        'Understated · On Point'
    ],
    mid: [
        'Casual Friday · Extended',
        'Comfort Zone · Unlocked',
        'Low Effort · Decent Return',
        'Safe Choice · Solid',
        'Weekend Mode · Enabled',
        'Cozy Core · Activated'
    ],
    low: [
        'Laundry Day · Vibes',
        'Comfort Over Style',
        'Function First · Always',
        'Zero Effort · Zero Shame',
        'NPC Energy · Detected'
    ]
}

// "Real Talk" prefix variants
const REAL_TALK_VARIANTS = [
    'Real talk',
    'No spin',
    'Honest score',
    'Call it',
    'The verdict',
    'Straight up'
]

// CTA button variants
const CTA_VARIANTS = [
    'Post yours → fitrate.app',
    'Your turn → fitrate.app',
    'Think you\'d score higher?',
    'Let\'s see yours',
    'Beat this? → fitrate.app',
    'Your fit next'
]

// Pick random from array
const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

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

            // ===== SCORE-BASED COLOR SYSTEM =====
            const score = Math.round(scores.overall)
            const getScoreBadgeColors = () => {
                if (score >= 90) return { from: '#ffd700', to: '#fff8dc' }      // Gold → soft white
                if (score >= 80) return { from: '#50C878', to: '#98FB98' }      // Green → mint
                if (score >= 70) return { from: '#20B2AA', to: '#50C878' }      // Teal → green
                if (score >= 60) return { from: '#DAA520', to: '#20B2AA' }      // Amber → teal
                return { from: '#FF8C00', to: '#DAA520' }                        // Orange → amber
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

            // Cover scaling for image
            const imgAspect = img.width / img.height
            const targetAspect = imageWidth / imageHeight
            let drawWidth, drawHeight, drawX, drawY

            if (imgAspect > targetAspect) {
                drawHeight = imageHeight
                drawWidth = imageHeight * imgAspect
                drawX = imageMargin + (imageWidth - drawWidth) / 2
                drawY = imageY
            } else {
                drawWidth = imageWidth
                drawHeight = imageWidth / imgAspect
                drawX = imageMargin
                drawY = imageY + (imageHeight - drawHeight) / 2
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)

            // Vignette fade at bottom for text legibility
            const vignette = ctx.createLinearGradient(0, imageY + imageHeight - 200, 0, imageY + imageHeight)
            vignette.addColorStop(0, 'transparent')
            vignette.addColorStop(1, 'rgba(0,0,0,0.6)')
            ctx.fillStyle = vignette
            ctx.fillRect(imageMargin, imageY, imageWidth, imageHeight)

            ctx.restore()

            // Subtle border around image
            ctx.strokeStyle = 'rgba(255,255,255,0.1)'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.roundRect(imageMargin, imageY, imageWidth, imageHeight, imageRadius)
            ctx.stroke()

            // ===== SECTION 2: SCORE BADGE (Overlapping image bottom) =====
            const badgeSize = 120
            const badgeX = canvas.width / 2
            const badgeY = imageY + imageHeight - badgeSize / 2 + 10  // Overlaps image

            // Badge outer glow (restrained)
            ctx.shadowColor = badgeColors.from
            ctx.shadowBlur = 30

            // Badge ring gradient
            const badgeGradient = ctx.createLinearGradient(
                badgeX - badgeSize / 2, badgeY - badgeSize / 2,
                badgeX + badgeSize / 2, badgeY + badgeSize / 2
            )
            badgeGradient.addColorStop(0, badgeColors.from)
            badgeGradient.addColorStop(1, badgeColors.to)

            // Draw ring
            ctx.beginPath()
            ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2)
            ctx.strokeStyle = badgeGradient
            ctx.lineWidth = 8
            ctx.stroke()
            ctx.shadowBlur = 0

            // Badge inner dark fill
            ctx.beginPath()
            ctx.arc(badgeX, badgeY, badgeSize / 2 - 6, 0, Math.PI * 2)
            ctx.fillStyle = '#0f0f18'
            ctx.fill()

            // Score number
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(score.toString(), badgeX, badgeY - 8)

            // /100 below score
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.fillText('/100', badgeX, badgeY + 28)

            // ===== SECTION 3: VERDICT HEADLINE =====
            const verdictY = imageY + imageHeight + 100
            const verdict = scores.verdict || scores.tagline || 'Looking good today.'

            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'

            // Wrap if needed
            const verdictLines = wrapText(ctx, verdict, canvas.width - 120)
            verdictLines.slice(0, 2).forEach((line, i) => {
                ctx.fillText(line, canvas.width / 2, verdictY + (i * 44))
            })

            // ===== SECTION 4: VIBE / STYLE TAG =====
            const vibeBand = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low'
            const vibeTag = pickRandom(VIBE_TAGS[vibeBand])
            const vibeY = verdictY + (verdictLines.length * 44) + 20

            ctx.fillStyle = 'rgba(255,255,255,0.45)'
            ctx.font = '600 18px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.fillText(vibeTag, canvas.width / 2, vibeY)

            // ===== SECTION 5: MICRO SCORES (3 Pills) =====
            const pillY = vibeY + 50
            const pillWidth = 100
            const pillHeight = 40
            const pillGap = 20
            const totalPillWidth = (pillWidth * 3) + (pillGap * 2)
            const pillStartX = (canvas.width - totalPillWidth) / 2

            const microScores = [
                { label: 'Color', score: scores.colorEnergy || Math.round(score * 0.95) },
                { label: 'Fit', score: scores.silhouette || Math.round(score * 0.9) },
                { label: 'Style', score: scores.intent || Math.round(score * 1.02) }
            ]

            microScores.forEach((item, i) => {
                const x = pillStartX + (i * (pillWidth + pillGap))

                // Pill background
                ctx.fillStyle = 'rgba(255,255,255,0.06)'
                ctx.beginPath()
                ctx.roundRect(x, pillY, pillWidth, pillHeight, pillHeight / 2)
                ctx.fill()

                // Pill border
                ctx.strokeStyle = 'rgba(255,255,255,0.1)'
                ctx.lineWidth = 1
                ctx.stroke()

                // Label
                ctx.fillStyle = 'rgba(255,255,255,0.5)'
                ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.textAlign = 'left'
                ctx.fillText(item.label, x + 12, pillY + 26)

                // Score value
                ctx.fillStyle = badgeColors.from
                ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.textAlign = 'right'
                ctx.fillText(item.score.toString(), x + pillWidth - 12, pillY + 26)
            })

            // ===== SECTION 6: "REAL TALK" LINE =====
            const realTalkY = pillY + pillHeight + 40
            const realTalkPrefix = pickRandom(REAL_TALK_VARIANTS)

            ctx.textAlign = 'center'
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = '18px -apple-system, BlinkMacSystemFont, sans-serif'
            const realTalkText = `${realTalkPrefix}: `
            const realTalkWidth = ctx.measureText(realTalkText).width

            // Draw prefix lighter
            ctx.fillText(realTalkPrefix + ':', canvas.width / 2 - 30, realTalkY)

            // Draw score heavier
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.fillText(`${score}/100`, canvas.width / 2 + 50, realTalkY)

            // ===== SECTION 7: CTA BUTTON =====
            const ctaY = realTalkY + 60
            const ctaWidth = 340
            const ctaHeight = 56
            const ctaX = (canvas.width - ctaWidth) / 2
            const ctaText = pickRandom(CTA_VARIANTS)

            // Button background
            ctx.fillStyle = 'rgba(255,255,255,0.08)'
            ctx.beginPath()
            ctx.roundRect(ctaX, ctaY, ctaWidth, ctaHeight, ctaHeight / 2)
            ctx.fill()

            // Button border
            ctx.strokeStyle = 'rgba(255,255,255,0.2)'
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Button text
            ctx.fillStyle = '#ffffff'
            ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(ctaText, canvas.width / 2, ctaY + 36)

            // ===== SECTION 8: FOOTER TAGLINE =====
            const footerY = ctaY + ctaHeight + 35
            ctx.fillStyle = 'rgba(255,255,255,0.25)'
            ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.fillText('Rate your fit in seconds', canvas.width / 2, footerY)

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
