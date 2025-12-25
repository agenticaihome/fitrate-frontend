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
    eventContext = null,  // { theme, themeEmoji, rank, weekId }
    dailyChallengeContext = null,  // { rank, totalParticipants }
    cardDNA = null  // Card DNA for unique visuals
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
                    if (scores.overall < 30) return "The AI chose violence 💀"
                    if (scores.overall < 45) return "This was personal 💀"
                    if (scores.overall < 60) return "Humbled. Your turn? 😈"
                    return "Survived the roast 😏"
                } else if (scores.mode === 'honest') {
                    if (scores.overall >= 90) return `${scores.overall}/100 — No notes 📊`
                    if (scores.overall >= 75) return `Objectively solid 📊`
                    if (scores.overall >= 60) return `The truth hurts 📊`
                    return `Honest rating. Thoughts? 📊`
                } else if (scores.mode === 'rizz') {
                    if (scores.overall >= 90) return `Dangerously attractive 😏`
                    if (scores.overall >= 75) return `W Rizz confirmed 💋`
                    if (scores.overall >= 50) return `Valid or delusional? 😏`
                    return `The AI said touch grass 💔`
                } else if (scores.mode === 'celeb') {
                    return `${scores.celebrityJudge || 'A legend'} has spoken 🎭`
                } else if (scores.mode === 'aura') {
                    if (scores.vibeAssessment === 'Main Character') return `Main character confirmed ✨`
                    if (scores.vibeAssessment === 'NPC') return `NPC behavior detected 💀`
                    return `${scores.auraColor || 'Your'} Aura revealed 🔮`
                } else if (scores.mode === 'chaos') {
                    if (scores.chaosLevel >= 8) return `The AI went feral 🎪`
                    return `Chaos mode activated 🌀`
                } else {
                    if (scores.overall >= 95) return `Literally perfect 💅`
                    if (scores.overall >= 90) return `Main character energy 🏆`
                    if (scores.overall >= 80) return "AI approved ✨"
                    if (scores.overall >= 70) return "Solid. Can you beat it? 👀"
                    return "Your turn 👀"
                }
            }

            // Mode-specific colors
            const getModeAccent = () => {
                if (scores.mode === 'savage') return { mid: '#1a0a1a', glow: 'rgba(139,0,255,0.5)', accent: '#8b00ff', light: '#ff0044' }
                if (scores.roastMode || scores.mode === 'roast') return { mid: '#2a1a1a', glow: 'rgba(255,68,68,0.4)', accent: '#ff4444', light: '#ff6666' }
                if (scores.mode === 'honest') return { mid: '#1a1a2a', glow: 'rgba(74,144,217,0.4)', accent: '#4A90D9', light: '#6BA8E8' }
                if (scores.mode === 'rizz') return { mid: '#2a1a2a', glow: 'rgba(255,105,180,0.5)', accent: '#ff69b4', light: '#ff1493' }
                if (scores.mode === 'celeb') return { mid: '#2a2a1a', glow: 'rgba(255,215,0,0.5)', accent: '#ffd700', light: '#ff8c00' }
                if (scores.mode === 'aura') return { mid: '#1a1a2a', glow: 'rgba(155,89,182,0.5)', accent: '#9b59b6', light: '#8e44ad' }
                if (scores.mode === 'chaos') return { mid: '#2a1a1a', glow: 'rgba(255,107,107,0.5)', accent: '#ff6b6b', light: '#ee5a24' }
                return { mid: '#1a1a2e', glow: 'rgba(0,212,255,0.4)', accent: '#00d4ff', light: '#00ff88' }
            }
            const modeColors = getModeAccent()
            const isProCard = isPro || scores.savageLevel || ['rizz', 'celeb', 'aura', 'chaos'].includes(scores.mode)

            // Load user image
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise((imgResolve, imgReject) => {
                img.onload = imgResolve
                img.onerror = imgReject
                img.src = uploadedImage
            })

            // DNA-DRIVEN BACKGROUND (uses Card DNA gradient or fallback)
            const dnaGradientColors = cardDNA?.styleTokens?.gradient?.colors || ['#0a0a15', '#0f0f1a']
            const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
            bgGradient.addColorStop(0, dnaGradientColors[0])
            bgGradient.addColorStop(0.3, dnaGradientColors[1])
            bgGradient.addColorStop(0.7, dnaGradientColors[1])
            bgGradient.addColorStop(1, dnaGradientColors[0])
            ctx.fillStyle = bgGradient
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Subtle accent glow at top
            const accentGlow = ctx.createRadialGradient(540, 300, 0, 540, 300, 500)
            accentGlow.addColorStop(0, modeColors.glow)
            accentGlow.addColorStop(1, 'transparent')
            ctx.fillStyle = accentGlow
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Format-aware Y positions (COMPRESSED 20% for poster-like density)
            const headerY = isSquare ? 40 : 60
            const scoreRingY = isSquare ? 190 : 280   // Tighter to header
            const verdictCardY = isSquare ? 400 : 580  // Closer to score
            const breakdownY = isSquare ? 660 : 1000   // Tighter to card
            const ctaY = isSquare ? 820 : 1250         // Moved up significantly

            // ===== TODAY'S FIT VERDICT HEADER =====
            ctx.save()
            ctx.textAlign = 'center'

            // Decorative lines
            ctx.strokeStyle = modeColors.accent
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.moveTo(200, headerY + 20)
            ctx.lineTo(380, headerY + 20)
            ctx.stroke()
            ctx.beginPath()
            ctx.moveTo(700, headerY + 20)
            ctx.lineTo(880, headerY + 20)
            ctx.stroke()

            // Header text - Daily Challenge or regular
            ctx.fillStyle = dailyChallengeContext ? '#00d4ff' : modeColors.accent
            ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.letterSpacing = '8px'
            const headerText = dailyChallengeContext ? '⚡ DAILY CHALLENGE ⚡' : "TODAY'S FIT VERDICT"
            ctx.fillText(headerText, 540, headerY + 28)
            ctx.restore()

            // Daily Challenge Rank Badge (if applicable)
            if (dailyChallengeContext && dailyChallengeContext.rank) {
                const rankY = headerY + 60
                ctx.fillStyle = 'rgba(0, 212, 255, 0.15)'
                ctx.beginPath()
                ctx.roundRect(380, rankY - 15, 320, 35, 20)
                ctx.fill()
                ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)'
                ctx.lineWidth = 2
                ctx.stroke()
                ctx.fillStyle = '#00d4ff'
                ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif'
                ctx.textAlign = 'center'
                const rankText = `🏅 Rank #${dailyChallengeContext.rank}/${dailyChallengeContext.totalParticipants || '?'} Today`
                ctx.fillText(rankText, 540, rankY + 5)
            }

            // ===== GIANT SCORE RING =====
            const scoreColor = scores.overall >= 85 ? '#ffd700' :
                scores.overall >= 75 ? '#ff6b35' :
                    scores.overall >= 60 ? '#00d4ff' :
                        scores.overall >= 40 ? '#ffaa00' : '#ff4444'

            // Score ring background (BIGGER - 15% larger)
            const ringRadius = isSquare ? 115 : 150  // Upgraded from 100/130
            ctx.beginPath()
            ctx.arc(540, scoreRingY, ringRadius, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'
            ctx.lineWidth = 20  // Thicker ring
            ctx.stroke()

            // Score ring progress (animated effect simulated)
            const ringGradient = ctx.createLinearGradient(440, scoreRingY - 130, 640, scoreRingY + 130)
            ringGradient.addColorStop(0, scoreColor)
            ringGradient.addColorStop(1, modeColors.light || scoreColor)
            ctx.strokeStyle = ringGradient
            ctx.shadowColor = scoreColor
            ctx.shadowBlur = 30
            ctx.beginPath()
            const startAngle = -Math.PI / 2
            const endAngle = startAngle + (scores.overall / 100) * Math.PI * 2
            ctx.arc(540, scoreRingY, ringRadius, startAngle, endAngle)
            ctx.stroke()
            ctx.shadowBlur = 0

            // Score number (BIGGER with glow - eye snaps in <200ms)
            ctx.shadowColor = scoreColor
            ctx.shadowBlur = 25  // Glow behind number
            ctx.fillStyle = '#fff'
            ctx.font = `bold ${isSquare ? 110 : 140}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(Math.round(scores.overall), 540, scoreRingY)
            ctx.shadowBlur = 0

            // /100 below (50% quieter)
            ctx.fillStyle = 'rgba(255,255,255,0.2)'
            ctx.font = `${isSquare ? 22 : 28}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText('/ 100', 540, scoreRingY + (isSquare ? 55 : 75))
            ctx.textBaseline = 'alphabetic'

            // Verdict headline (HEAVIER + closer to score)
            ctx.fillStyle = scoreColor
            ctx.font = `800 ${isSquare ? 36 : 48}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText(scores.verdict || 'The Verdict', 540, scoreRingY + (isSquare ? 95 : 125))

            // Percentile context (tighter)
            const percent = Math.max(1, Math.round(scores.percentile || 50))
            const percentText = scores.overall >= 50
                ? `Better than ${percent}% of fits today`
                : `Worse than ${100 - percent}% of fits today`
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = `16px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText(percentText, 540, scoreRingY + (isSquare ? 125 : 160))

            // ===== THE VERDICT CARD (Tighter Layout) =====
            const cardX = 80
            const cardWidth = 920
            const cardHeight = isSquare ? 200 : 320  // Reduced height

            // Card background
            ctx.fillStyle = 'rgba(255,255,255,0.03)'
            ctx.shadowColor = modeColors.glow
            ctx.shadowBlur = 25
            ctx.beginPath()
            ctx.roundRect(cardX, verdictCardY, cardWidth, cardHeight, 24)
            ctx.fill()
            ctx.shadowBlur = 0

            // Card border
            ctx.strokeStyle = `${modeColors.accent}66`
            ctx.lineWidth = 2
            ctx.stroke()

            // Split: Left side = text, Right side = photo
            const textAreaWidth = cardWidth * 0.6
            const photoAreaWidth = cardWidth * 0.35
            const photoX = cardX + textAreaWidth + 20
            const photoY = verdictCardY + 15
            const photoW = isSquare ? 240 : 340  // 20% BIGGER photo
            const photoH = isSquare ? 240 : cardHeight - 30

            // THE VERDICT label
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'left'
            ctx.letterSpacing = '4px'
            ctx.fillText('THE VERDICT', cardX + 30, verdictCardY + 40)

            // Verdict name in card
            ctx.fillStyle = '#fff'
            ctx.font = `bold ${isSquare ? 28 : 36}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText(scores.verdict || 'Style Check', cardX + 30, verdictCardY + (isSquare ? 80 : 90))

            // Tagline / one-liner
            if (scores.tagline) {
                ctx.fillStyle = 'rgba(255,255,255,0.6)'
                ctx.font = `italic ${isSquare ? 18 : 22}px -apple-system, BlinkMacSystemFont, sans-serif`
                const taglineLines = wrapText(ctx, `"${scores.tagline}"`, textAreaWidth - 60)
                taglineLines.slice(0, 2).forEach((line, i) => {
                    ctx.fillText(line, cardX + 30, verdictCardY + (isSquare ? 115 : 135) + (i * (isSquare ? 24 : 30)))
                })
            }

            // Identity line
            if (scores.line || (scores.lines && scores.lines[0])) {
                const identityLine = scores.line || scores.lines[0]
                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = `${isSquare ? 14 : 16}px -apple-system, BlinkMacSystemFont, sans-serif`
                const lineY = verdictCardY + (isSquare ? 170 : 210)
                const identityLines = wrapText(ctx, identityLine, textAreaWidth - 60)
                identityLines.slice(0, 2).forEach((line, i) => {
                    ctx.fillText(line, cardX + 30, lineY + (i * 20))
                })
            }

            // Photo on right side
            ctx.save()
            ctx.beginPath()
            ctx.roundRect(photoX, photoY, photoW, photoH, 16)
            ctx.clip()

            // Cover scaling for photo
            const imgAspect = img.width / img.height
            const targetAspect = photoW / photoH
            let drawWidth, drawHeight, drawX, drawY

            if (imgAspect > targetAspect) {
                drawHeight = photoH
                drawWidth = photoH * imgAspect
                drawX = photoX + (photoW - drawWidth) / 2
                drawY = photoY
            } else {
                drawWidth = photoW
                drawHeight = photoW / imgAspect
                drawX = photoX
                drawY = photoY + (photoH - drawHeight) / 2
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            ctx.restore()

            // Photo border
            ctx.strokeStyle = `${modeColors.accent}88`
            ctx.lineWidth = 3
            ctx.beginPath()
            ctx.roundRect(photoX, photoY, photoW, photoH, 16)
            ctx.stroke()


            // ===== SIMPLIFIED BAR BREAKDOWN (Viral-Optimized) =====
            ctx.textAlign = 'center'

            // 3-bar metrics (cleaner, more scannable)
            const barMetrics = [
                { label: 'Style', score: scores.colorEnergy || Math.round(scores.overall * 0.9) },
                { label: 'Risk', score: scores.riskTaken || Math.round(scores.overall * 0.7) },
                { label: 'Intent', score: scores.intent || Math.round(scores.overall * 0.95) }
            ]

            const barStartX = 180
            const barWidth = 720
            const barHeight = isSquare ? 10 : 14
            const barSpacing = isSquare ? 40 : 55
            const barStartY = breakdownY + 20

            barMetrics.forEach((metric, i) => {
                const y = barStartY + i * barSpacing

                // Label
                ctx.fillStyle = 'rgba(255,255,255,0.7)'
                ctx.font = `bold ${isSquare ? 14 : 18}px -apple-system, BlinkMacSystemFont, sans-serif`
                ctx.textAlign = 'left'
                ctx.fillText(metric.label, barStartX - 80, y + (barHeight / 2) + 5)

                // Bar background
                ctx.fillStyle = 'rgba(255,255,255,0.1)'
                ctx.beginPath()
                ctx.roundRect(barStartX, y, barWidth, barHeight, barHeight / 2)
                ctx.fill()

                // Bar fill (percentage-based)
                const fillWidth = (metric.score / 100) * barWidth
                ctx.fillStyle = modeColors.accent
                ctx.shadowColor = modeColors.accent
                ctx.shadowBlur = 8
                ctx.beginPath()
                ctx.roundRect(barStartX, y, fillWidth, barHeight, barHeight / 2)
                ctx.fill()
                ctx.shadowBlur = 0
            })

            // ===== SHARE CTA LINE (Viral Trigger) =====
            const ctaLineY = barStartY + (barSpacing * 3) + 30
            ctx.fillStyle = 'rgba(255,255,255,0.06)'
            ctx.beginPath()
            ctx.roundRect(150, ctaLineY - 25, 780, 55, 28)
            ctx.fill()
            ctx.strokeStyle = `${modeColors.accent}40`
            ctx.lineWidth = 1
            ctx.stroke()

            // CTA Text - conversation starter
            const ctaOptions = [
                "Think this is wrong? Prove it.",
                "Post yours. Let the internet decide.",
                "Agree or nah? Your turn.",
                "Valid or violence? You decide."
            ]
            const ctaText = ctaOptions[Math.floor(Math.random() * ctaOptions.length)]
            ctx.fillStyle = modeColors.accent
            ctx.font = `bold ${isSquare ? 18 : 22}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.textAlign = 'center'
            ctx.fillText(ctaText, 540, ctaLineY + 5)

            // ===== DNA BADGES (Time-of-Day + Streak) =====
            const dnaBadgesY = ctaLineY + (isSquare ? 55 : 75)
            const timeBadge = cardDNA?.copySlots?.timeBadge
            const streakBadge = cardDNA?.copySlots?.streakBadge
            const timeAccent = cardDNA?.timeContext?.accent || modeColors.accent

            // Render badges side by side if both exist, centered if only one
            const badges = [timeBadge, streakBadge].filter(Boolean)
            if (badges.length > 0) {
                const badgeSpacing = isSquare ? 12 : 18
                const badgePadding = isSquare ? 20 : 28
                const badgeFontSize = isSquare ? 13 : 16

                // Measure total width
                ctx.font = `bold ${badgeFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
                const badgeWidths = badges.map(b => ctx.measureText(b).width + badgePadding * 2)
                const totalWidth = badgeWidths.reduce((a, b) => a + b, 0) + (badges.length - 1) * badgeSpacing

                let currentX = 540 - totalWidth / 2

                badges.forEach((badge, i) => {
                    const width = badgeWidths[i]
                    const isTime = badge === timeBadge
                    const badgeColor = isTime ? timeAccent : '#FFB347'

                    // Badge background
                    ctx.fillStyle = `${badgeColor}20`
                    ctx.beginPath()
                    ctx.roundRect(currentX, dnaBadgesY - (isSquare ? 12 : 15), width, isSquare ? 26 : 32, (isSquare ? 26 : 32) / 2)
                    ctx.fill()
                    ctx.strokeStyle = `${badgeColor}50`
                    ctx.lineWidth = 1
                    ctx.stroke()

                    // Badge text
                    ctx.fillStyle = badgeColor
                    ctx.font = `bold ${badgeFontSize}px -apple-system, BlinkMacSystemFont, sans-serif`
                    ctx.textAlign = 'center'
                    ctx.fillText(badge, currentX + width / 2, dnaBadgesY + (isSquare ? 2 : 3))

                    currentX += width + badgeSpacing
                })
            }

            // ===== FOOTER (Stronger Branding - tighter) =====
            const footerY = isSquare ? 960 : 1550  // Compressed for tighter layout

            // Percentile context (tighter copy)
            const footerPercent = Math.max(1, 100 - (scores.percentile || 50))
            const percentCopy = scores.overall >= 50
                ? `Outscored ${footerPercent}% of fits today`
                : `Top ${100 - footerPercent}% avoided this fate`
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = `bold ${isSquare ? 14 : 18}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.textAlign = 'center'
            ctx.fillText(percentCopy, 540, footerY)

            // FITRATE branding - memorable tagline
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.font = `bold ${isSquare ? 18 : 24}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText('FitRate', 540, footerY + (isSquare ? 35 : 45))
            ctx.fillStyle = 'rgba(255,255,255,0.35)'
            ctx.font = `${isSquare ? 12 : 16}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText('Get rated. Get roasted.', 540, footerY + (isSquare ? 55 : 72))

            // Generate Conversation-Starter Share Text
            const getShareText = () => {
                const baseUrl = 'https://fitrate.app'
                const link = `${baseUrl}?ref=${userId}`

                // Roast / Savage Strategy: Sharp, conversation-starting
                if (scores.roastMode || scores.mode === 'savage') {
                    if (scores.overall < 35) return `AI gave me a ${scores.overall}. Valid or personal? 💀 ${link}`
                    if (scores.overall < 60) return `"${scores.verdict}" — agree? 👇 ${link}`
                    return `Survived roast mode with ${scores.overall}/100. Fair? 😏 ${link}`
                }

                // Nice / Honest Strategy: Debate-friendly
                if (scores.mode === 'honest') {
                    if (scores.overall < 70) return `AI said ${scores.overall}. Robbed or accurate? 🤨 ${link}`
                    return `Honest rating: ${scores.overall}/100. Thoughts? 📊 ${link}`
                }

                // Rizz Mode Strategy: Playful flex
                if (scores.mode === 'rizz') {
                    if (scores.overall >= 85) return `${scores.overall}% rizz confirmed 😏 What's yours? ${link}`
                    if (scores.overall >= 60) return `Rizz check: ${scores.overall}%. Valid? 🤔 ${link}`
                    return `The AI humbled me 💔 Your turn? ${link}`
                }

                // Celeb Mode Strategy: Authority quote
                if (scores.mode === 'celeb') {
                    return `${scores.celebrityJudge || 'Anna Wintour'} rated my fit. Agree? 🎭 ${link}`
                }

                // Aura Mode Strategy: Identity hook
                if (scores.mode === 'aura') {
                    if (scores.vibeAssessment === 'Main Character') return `Main character aura ✨ Accurate? ${link}`
                    if (scores.vibeAssessment === 'NPC') return `AI called me an NPC 💀 Valid? ${link}`
                    return `${scores.auraColor} aura 🔮 What's yours? ${link}`
                }

                // Chaos Mode Strategy: Absurdist share
                if (scores.mode === 'chaos') {
                    return `"${scores.absurdComparison || 'The AI went feral'}" 🎪 ${link}`
                }

                // Daily Challenge Strategy: Competitive hook
                if (dailyChallengeContext && dailyChallengeContext.rank) {
                    const rankText = dailyChallengeContext.rank === 1
                        ? `#1 in today's Daily Challenge! 👑`
                        : `Rank #${dailyChallengeContext.rank} in today's Daily Challenge ⚡`
                    return `${rankText} ${scores.overall}/100. Can you beat me? ${link}`
                }

                // High Scores Strategy: Flex + challenge
                if (scores.overall >= 90) return `${scores.overall}/100. Beat that? 🏆 ${link}`
                if (scores.overall >= 80) return `AI approved at ${scores.overall}/100 ✨ ${link}`

                // Default
                return `Got ${scores.overall}/100. Thoughts? 👇 ${link}`
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
