/**
 * Cloudflare Pages Function: Challenge Party OG Meta Tags
 *
 * Injects custom Open Graph meta tags for Challenge links (/c/:challengeId)
 * so they preview beautifully in iMessage, WhatsApp, Instagram DMs, etc.
 *
 * Features:
 * - Fetches battle data from API for dynamic OG tags
 * - Shows creator's score and battle mode
 * - Falls back to static OG tags if API fails
 *
 * Route: /c/:challengeId
 */

const API_BASE = 'https://fitrate-production.up.railway.app/api'

// Mode emoji mapping
const MODE_EMOJIS = {
    nice: '😇',
    roast: '🔥',
    honest: '📊',
    savage: '💀',
    rizz: '😏',
    celeb: '⭐',
    aura: '🔮',
    chaos: '🎪',
    y2k: '💎',
    villain: '🖤',
    coquette: '🎀',
    hypebeast: '👟'
}

// Mode label mapping
const MODE_LABELS = {
    nice: 'Nice',
    roast: 'Roast',
    honest: 'Honest',
    savage: 'Savage',
    rizz: 'Rizz',
    celeb: 'Celebrity',
    aura: 'Aura',
    chaos: 'Chaos',
    y2k: 'Y2K',
    villain: 'Villain',
    coquette: 'Coquette',
    hypebeast: 'Hypebeast'
}

export async function onRequest(context) {
    const { request, next, params, env } = context
    const challengeId = params.challengeId

    // Default OG values (used as fallback)
    let ogTitle = '1v1 Outfit Battle'
    let ogDescription = 'Think you can beat my fit? Scan yours and find out!'
    let ogImage = 'https://fitrate.app/og/battle.png'

    // Try to fetch battle data for dynamic OG tags
    try {
        const headers = { 'Content-Type': 'application/json' }
        // Use API key from environment if available
        if (env?.VITE_API_KEY) {
            headers['X-API-Key'] = env.VITE_API_KEY
        }

        const battleRes = await fetch(`${API_BASE}/battle/${challengeId}`, {
            method: 'GET',
            headers,
            // Short timeout for OG tag generation
            signal: AbortSignal.timeout(3000)
        })

        if (battleRes.ok) {
            const battle = await battleRes.json()

            if (battle && battle.creatorScore) {
                const score = Math.round(battle.creatorScore)
                const mode = battle.mode || 'nice'
                const modeEmoji = MODE_EMOJIS[mode] || '😇'
                const modeLabel = MODE_LABELS[mode] || 'Nice'

                // Dynamic OG content
                ogTitle = `${modeEmoji} ${score}/100 — Can You Beat This?`
                ogDescription = `I scored ${score} in ${modeLabel} Mode. Think you can do better? Accept the challenge!`

                // Use battle-specific OG image if available, otherwise default
                ogImage = battle.ogImage || 'https://fitrate.app/og/battle.png'
            }
        }
    } catch (error) {
        // Silent fail - use default OG tags
        console.log('[Challenge OG] API fetch failed, using defaults:', error.message)
    }

    try {
        // Get the original response (the SPA HTML from challenge.html fallback)
        const response = await next()

        // Only modify HTML responses
        const contentType = response.headers.get('content-type') || ''
        if (!contentType.includes('text/html')) {
            return response
        }

        // Clone the response since we need to read it
        const html = await response.text()

        // Battle OG meta tags with dynamic content
        const challengeMeta = `
    <!-- Battle Party OG Tags (Dynamic) -->
    <meta property="og:title" content="${escapeHtml(ogTitle)}" />
    <meta property="og:description" content="${escapeHtml(ogDescription)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://fitrate.app/c/${challengeId}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:site_name" content="FitRate" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@AgenticAIHome" />
    <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
    <meta name="twitter:image" content="${ogImage}" />
`

        // Safely inject meta tags
        let modifiedHtml = html

        // Remove existing OG tags to avoid duplicates
        modifiedHtml = modifiedHtml.replace(/<meta property="og:[^"]*"[^>]*>/gi, '')
        modifiedHtml = modifiedHtml.replace(/<meta name="twitter:[^"]*"[^>]*>/gi, '')

        // Update title tag
        modifiedHtml = modifiedHtml.replace(
            /<title>[^<]*<\/title>/,
            `<title>${escapeHtml(ogTitle)} — FitRate Battle</title>`
        )

        // Inject our OG tags right after the opening head tag
        modifiedHtml = modifiedHtml.replace(
            /<head>/i,
            '<head>' + challengeMeta
        )

        // Return modified response
        return new Response(modifiedHtml, {
            status: response.status,
            statusText: response.statusText,
            headers: {
                'content-type': 'text/html; charset=utf-8'
            }
        })
    } catch (error) {
        console.error('[Challenge OG] Error:', error)
        return await next()
    }
}

// Helper to escape HTML special characters in OG content
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
}
