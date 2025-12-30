/**
 * FitRate Analytics Utility
 * Comprehensive GA4 event tracking for business metrics
 * 
 * GA4 Property: G-M574TETDZQ
 */

// Helper to safely call gtag
const gtag = (...args) => {
    if (typeof window.gtag === 'function') {
        window.gtag(...args)
    }
}

// ============================================
// CORE ENGAGEMENT EVENTS
// ============================================

/**
 * Track share events (for virality metrics)
 */
export const trackShare = (method, contentType = 'outfit_rating', score = null) => {
    gtag('event', 'share', {
        method: method,
        content_type: contentType,
        item_id: score ? `score_${score}` : 'unknown'
    })
}

/**
 * Track scan completion (core product usage)
 */
export const trackScanComplete = (mode, score, options = {}) => {
    gtag('event', 'scan_complete', {
        mode: mode,
        score: Math.round(score),
        score_tier: score >= 90 ? 'legendary' : score >= 75 ? 'great' : score >= 50 ? 'solid' : 'needs_work',
        is_daily_challenge: options.isDailyChallenge || false,
        is_weekly_challenge: options.isWeeklyChallenge || false,
        is_fashion_show: options.isFashionShow || false
    })
}

/**
 * Track mode selection (understand mode popularity)
 */
export const trackModeSelect = (modeName, context = 'drawer') => {
    gtag('event', 'select_mode', {
        mode_name: modeName,
        context: context // 'drawer', 'daily_challenge', 'fashion_show'
    })
}

// ============================================
// MONETIZATION EVENTS
// ============================================

/**
 * Track checkout start (funnel tracking)
 */
export const trackBeginCheckout = (product, price, currency = 'USD') => {
    gtag('event', 'begin_checkout', {
        currency: currency,
        value: price,
        items: [{
            item_name: product,
            price: price,
            quantity: 1
        }]
    })
}

/**
 * Track purchase completion (revenue tracking)
 * Note: Should be called from webhook success callback
 */
export const trackPurchase = (product, price, currency = 'USD') => {
    gtag('event', 'purchase', {
        currency: currency,
        value: price,
        items: [{
            item_name: product,
            price: price,
            quantity: 1
        }]
    })
}

/**
 * Track paywall view (conversion funnel)
 */
export const trackPaywallView = (trigger = 'scan_limit') => {
    gtag('event', 'view_item', {
        items: [{ item_name: 'paywall', item_category: trigger }]
    })
}

/**
 * Track first-time offer view
 */
export const trackFirstTimeOfferView = () => {
    gtag('event', 'view_promotion', {
        promotion_name: 'first_time_offer',
        creative_name: '10_scans_99c'
    })
}

// ============================================
// SOCIAL & VIRAL EVENTS
// ============================================

/**
 * Track battle creation (viral feature)
 */
export const trackBattleCreate = (creatorScore) => {
    gtag('event', 'battle_create', {
        creator_score: Math.round(creatorScore)
    })
}

/**
 * Track battle acceptance (viral conversion)
 */
export const trackBattleAccept = (battleId) => {
    gtag('event', 'battle_accept', {
        battle_id: battleId
    })
}

/**
 * Track Fashion Show join (group engagement)
 */
export const trackFashionShowJoin = (showId, vibe) => {
    gtag('event', 'fashion_show_join', {
        show_id: showId,
        vibe: vibe
    })
}

/**
 * Track Fashion Show creation
 */
export const trackFashionShowCreate = (vibe) => {
    gtag('event', 'fashion_show_create', {
        vibe: vibe
    })
}

/**
 * Track referral share
 */
export const trackReferralShare = (method) => {
    gtag('event', 'referral_share', {
        share_method: method
    })
}

// ============================================
// RETENTION & ENGAGEMENT EVENTS
// ============================================

/**
 * Track daily challenge participation
 */
export const trackDailyChallengeJoin = (mode) => {
    gtag('event', 'daily_challenge_join', {
        mode: mode
    })
}

/**
 * Track weekly challenge participation
 */
export const trackWeeklyChallengeJoin = (theme) => {
    gtag('event', 'weekly_challenge_join', {
        theme: theme
    })
}

/**
 * Track streak milestone
 */
export const trackStreakMilestone = (streakCount) => {
    gtag('event', 'streak_milestone', {
        streak_days: streakCount
    })
}

/**
 * Track leaderboard view
 */
export const trackLeaderboardView = (type = 'daily') => {
    gtag('event', 'leaderboard_view', {
        leaderboard_type: type
    })
}

// ============================================
// ERROR & DIAGNOSTIC EVENTS
// ============================================

/**
 * Track scan errors (for debugging)
 */
export const trackScanError = (errorType, errorMessage) => {
    gtag('event', 'scan_error', {
        error_type: errorType,
        error_message: errorMessage?.substring(0, 100) // Truncate for GA4 limits
    })
}

/**
 * Track camera permission status
 */
export const trackCameraPermission = (status) => {
    gtag('event', 'camera_permission', {
        permission_status: status // 'granted', 'denied', 'prompt'
    })
}

// ============================================
// TRAFFIC SOURCE TRACKING
// ============================================

/**
 * Detect source from referrer URL
 */
const detectSourceFromReferrer = (referrer) => {
    if (!referrer) return 'direct'
    const r = referrer.toLowerCase()
    if (r.includes('t.co') || r.includes('twitter.com') || r.includes('x.com')) return 'twitter'
    if (r.includes('tiktok.com')) return 'tiktok'
    if (r.includes('instagram.com')) return 'instagram'
    if (r.includes('facebook.com') || r.includes('fb.com')) return 'facebook'
    if (r.includes('youtube.com') || r.includes('youtu.be')) return 'youtube'
    if (r.includes('reddit.com')) return 'reddit'
    if (r.includes('google.')) return 'google'
    return 'other'
}

/**
 * Track visit source (call on app load)
 * Captures UTM params and referrer for attribution
 */
export const trackVisitSource = () => {
    // Only track once per session
    if (sessionStorage.getItem('fitrate_visit_tracked')) return

    const urlParams = new URLSearchParams(window.location.search)
    const utmSource = urlParams.get('utm_source')
    const utmMedium = urlParams.get('utm_medium')
    const utmCampaign = urlParams.get('utm_campaign')
    const referrer = document.referrer

    // Determine source - prefer UTM, fallback to referrer detection
    const source = utmSource || detectSourceFromReferrer(referrer)
    const medium = utmMedium || (referrer ? 'referral' : 'direct')

    // Store in localStorage for later events
    if (utmSource) localStorage.setItem('fitrate_utm_source', utmSource)
    if (utmMedium) localStorage.setItem('fitrate_utm_medium', utmMedium)
    if (utmCampaign) localStorage.setItem('fitrate_utm_campaign', utmCampaign)

    // Fire GA4 event
    gtag('event', 'visit_source', {
        traffic_source: source,
        traffic_medium: medium,
        campaign: utmCampaign || 'none',
        referrer_domain: referrer ? new URL(referrer).hostname : 'direct',
        landing_page: window.location.pathname
    })

    // Mark as tracked for this session
    sessionStorage.setItem('fitrate_visit_tracked', 'true')

    console.log('[Analytics] Visit tracked:', { source, medium, campaign: utmCampaign })
}

