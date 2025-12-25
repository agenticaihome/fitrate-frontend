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
    dailyChallengeContext = null  // { rank, totalParticipants }
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

            // Format-aware Y positions
            const headerY = isSquare ? 50 : 80
            const scoreRingY = isSquare ? 220 : 320
            const verdictCardY = isSquare ? 420 : 600
            const breakdownY = isSquare ? 700 : 1050
            const ctaY = isSquare ? 950 : 1600

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

            // Score ring background
            ctx.beginPath()
            ctx.arc(540, scoreRingY, isSquare ? 100 : 130, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'
            ctx.lineWidth = 16
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
            ctx.arc(540, scoreRingY, isSquare ? 100 : 130, startAngle, endAngle)
            ctx.stroke()
            ctx.shadowBlur = 0

            // Score number
            ctx.fillStyle = '#fff'
            ctx.font = `bold ${isSquare ? 80 : 100}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(Math.round(scores.overall), 540, scoreRingY)

            // /100 below
            ctx.fillStyle = 'rgba(255,255,255,0.4)'
            ctx.font = `bold ${isSquare ? 24 : 30}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText('/ 100', 540, scoreRingY + (isSquare ? 55 : 70))
            ctx.textBaseline = 'alphabetic'

            // Verdict name below ring
            ctx.fillStyle = scoreColor
            ctx.font = `bold ${isSquare ? 32 : 42}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText(scores.verdict || 'The Verdict', 540, scoreRingY + (isSquare ? 110 : 140))

            // Percentile context
            const percent = Math.max(1, Math.round(scores.percentile || 50))
            const percentText = scores.overall >= 50
                ? `Better than ${percent}% of fits today`
                : `Worse than ${100 - percent}% of fits today`
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = `18px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText(percentText, 540, scoreRingY + (isSquare ? 145 : 180))

            // ===== THE VERDICT CARD (Split Layout) =====
            const cardX = 60
            const cardWidth = 960
            const cardHeight = isSquare ? 240 : 360

            // Card background
            ctx.fillStyle = 'rgba(255,255,255,0.04)'
            ctx.shadowColor = modeColors.glow
            ctx.shadowBlur = 40
            ctx.beginPath()
            ctx.roundRect(cardX, verdictCardY, cardWidth, cardHeight, 32)
            ctx.fill()
            ctx.shadowBlur = 0

            // Card border
            ctx.strokeStyle = `${modeColors.accent}66`
            ctx.lineWidth = 2
            ctx.stroke()

            // Split: Left side = text, Right side = photo
            const textAreaWidth = cardWidth * 0.6
            const photoAreaWidth = cardWidth * 0.35
            const photoX = cardX + textAreaWidth + 30
            const photoY = verdictCardY + 20
            const photoW = isSquare ? 200 : 280
            const photoH = isSquare ? 200 : cardHeight - 40

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


            // ===== FIT BREAKDOWN SECTION (2x2 Grid) =====
            ctx.textAlign = 'left'

            // FIT BREAKDOWN header
            ctx.fillStyle = 'rgba(255,255,255,0.5)'
            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('━━━ FIT BREAKDOWN ━━━', 540, breakdownY)
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
            ctx.fillText(scores.overall >= 50 ? '(what went right)' : '(what went wrong)', 540, breakdownY + 20)

            // 2x2 Grid of metrics
            const metrics = [
                { emoji: '🎨', label: 'Color Energy', score: scores.colorEnergy || Math.round(scores.overall * 0.9), desc: (scores.colorEnergy || scores.overall) >= 60 ? 'Bold palette' : 'Safe palette' },
                { emoji: '📐', label: 'Silhouette', score: scores.silhouette || Math.round(scores.overall * 0.85), desc: (scores.silhouette || scores.overall) >= 60 ? 'Sharp lines' : 'Angles off' },
                { emoji: '✨', label: 'Outfit Intent', score: scores.intent || Math.round(scores.overall * 0.95), desc: (scores.intent || scores.overall) >= 60 ? 'Clear vision' : 'No game plan' },
                { emoji: '🎲', label: 'Risk Taken', score: scores.riskTaken || Math.round(scores.overall * 0.7), desc: (scores.riskTaken || scores.overall * 0.7) >= 50 ? 'Bold moves' : 'Played safe' }
            ]

            const gridStartY = breakdownY + 45
            const cellWidth = isSquare ? 200 : 240
            const cellHeight = isSquare ? 70 : 90
            const gridGap = isSquare ? 20 : 30
            const gridStartX = (1080 - (cellWidth * 2 + gridGap)) / 2

            metrics.forEach((metric, i) => {
                const col = i % 2
                const row = Math.floor(i / 2)
                const x = gridStartX + col * (cellWidth + gridGap)
                const y = gridStartY + row * (cellHeight + gridGap)

                // Cell background
                ctx.fillStyle = 'rgba(255,255,255,0.04)'
                ctx.beginPath()
                ctx.roundRect(x, y, cellWidth, cellHeight, 12)
                ctx.fill()
                ctx.strokeStyle = 'rgba(255,255,255,0.08)'
                ctx.lineWidth = 1
                ctx.stroke()

                // Emoji + Label
                ctx.fillStyle = 'rgba(255,255,255,0.8)'
                ctx.font = `bold ${isSquare ? 14 : 16}px -apple-system, BlinkMacSystemFont, sans-serif`
                ctx.textAlign = 'left'
                ctx.fillText(`${metric.emoji} ${metric.label}`, x + 12, y + (isSquare ? 22 : 28))

                // Score number (mode colored)
                ctx.fillStyle = modeColors.accent
                ctx.font = `bold ${isSquare ? 24 : 32}px -apple-system, BlinkMacSystemFont, sans-serif`
                ctx.fillText(metric.score.toString(), x + 12, y + (isSquare ? 52 : 65))

                // Description
                ctx.fillStyle = 'rgba(255,255,255,0.4)'
                ctx.font = `${isSquare ? 11 : 13}px -apple-system, BlinkMacSystemFont, sans-serif`
                ctx.fillText(metric.desc, x + (isSquare ? 55 : 75), y + (isSquare ? 50 : 62))
            })

            // AI Summary line
            const summaryY = gridStartY + (cellHeight * 2) + (gridGap * 2) + 20
            const summaryText = scores.summaryLine || scores.tagline || `${scores.overall >= 60 ? 'Strong presence.' : 'Low presence.'} ${scores.overall >= 70 ? 'High intention.' : 'Needs focus.'}`
            ctx.fillStyle = 'rgba(255,255,255,0.05)'
            ctx.beginPath()
            ctx.roundRect(120, summaryY - 20, 840, 50, 25)
            ctx.fill()
            ctx.fillStyle = 'rgba(255,255,255,0.6)'
            ctx.font = `italic ${isSquare ? 16 : 20}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.textAlign = 'center'
            ctx.fillText(summaryText, 540, summaryY + 8)

            // ===== FOOTER =====
            const footerY = isSquare ? 1020 : 1800

            // TOP X% badge
            ctx.fillStyle = 'rgba(255,255,255,0.3)'
            ctx.font = `bold ${isSquare ? 16 : 20}px -apple-system, BlinkMacSystemFont, sans-serif`
            const footerPercent = Math.max(1, 100 - (scores.percentile || 50))
            ctx.fillText(`TOP ${footerPercent}% OF ALL FITS TODAY`, 540, footerY)

            // FITRATE.APP branding
            ctx.fillStyle = 'rgba(255,255,255,0.2)'
            ctx.font = `bold ${isSquare ? 14 : 18}px -apple-system, BlinkMacSystemFont, sans-serif`
            ctx.fillText('FITRATE.APP', 540, footerY + (isSquare ? 28 : 35))

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
