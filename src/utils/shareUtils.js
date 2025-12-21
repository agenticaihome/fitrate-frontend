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

export const generateShareCard = async ({
    scores,
    shareFormat,
    uploadedImage,
    userId,
    isPro,
    eventContext = null  // { theme, themeEmoji, rank, weekId }
}) => {
    return new Promise(async (resolve, reject) => {
        try {
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

            // Mode-specific colors
            const getModeAccent = () => {
                if (scores.mode === 'savage') return { mid: '#1a0a1a', glow: 'rgba(139,0,255,0.5)', accent: '#8b00ff', light: '#ff0044' }
                if (scores.roastMode || scores.mode === 'roast') return { mid: '#2a1a1a', glow: 'rgba(255,68,68,0.4)', accent: '#ff4444', light: '#ff6666' }
                if (scores.mode === 'honest') return { mid: '#1a1a2a', glow: 'rgba(74,144,217,0.4)', accent: '#4A90D9', light: '#6BA8E8' }
                return { mid: '#1a1a2e', glow: 'rgba(0,212,255,0.4)', accent: '#00d4ff', light: '#00ff88' }
            }
            const modeColors = getModeAccent()
            const isProCard = isPro || scores.savageLevel

            // Load user image
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise((imgResolve, imgReject) => {
                img.onload = imgResolve
                img.onerror = imgReject
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

            // PREMIUM BRANDING - Dynamic header for regular vs event
            ctx.save()
            ctx.textAlign = 'center'

            if (eventContext) {
                // EVENT MODE: Show theme with emoji
                ctx.fillStyle = '#10b981'  // Emerald for events
                ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.fillText(`${eventContext.themeEmoji} ${eventContext.theme.toUpperCase()}`, 540, 70)

                // Weekly Challenge badge
                ctx.fillStyle = 'rgba(16,185,129,0.2)'
                ctx.beginPath()
                const badgeWidth = 220
                ctx.roundRect(540 - badgeWidth / 2, 82, badgeWidth, 32, 16)
                ctx.fill()
                ctx.fillStyle = '#10b981'
                ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.fillText('🏆 WEEKLY CHALLENGE', 540, 103)

                // If ranked, show rank badge
                if (eventContext.rank) {
                    const rankY = 130
                    ctx.fillStyle = eventContext.rank <= 5 ? '#fbbf24' : '#fff'
                    ctx.font = 'black 24px -apple-system, BlinkMacSystemFont, sans-serif'
                    ctx.fillText(`#${eventContext.rank} ON LEADERBOARD`, 540, rankY)
                }
            } else {
                // REGULAR MODE: "FITRATE AI" seal
                ctx.fillStyle = '#fff'
                ctx.font = 'black 28px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.letterSpacing = '12px'
                ctx.globalAlpha = 0.8
                ctx.fillText('FITRATE AI', 540, 80)
            }
            ctx.restore()

            // CONVERSATION STAMP
            ctx.save()
            const stampX = isSquare ? 880 : 920
            const stampY = isSquare ? 120 : 240
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

            // PRO BADGE
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

            // Score number
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

            // Verdict
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
            // Rounded up for clean UI
            const percent = Math.max(1, 100 - scores.percentile)
            ctx.fillText(`TOP ${percent}% OF ALL FITS TODAY`, 540, isSquare ? 1040 : 1700)

            // Branding Footer - Strong CTA for Viral Re-scans
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = `bold ${isSquare ? 16 : 22}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText('TRY IT FREE @ FITRATE.APP', 540, isSquare ? 1070 : 1750)

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

            canvas.toBlob((blob) => {
                if (!blob) {
                    reject(new Error('Canvas to Blob failed'))
                    return;
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
