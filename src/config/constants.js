/**
 * FitRate Application Constants
 * Single Source of Truth for Limits, Pricing, and Links
 */

export const LIMITS = {
    // Scans - Simplified Model: 2 Free Gemini scans/day
    // Pro scans (GPT-4o) earned via referrals or subscription
    FREE_SCANS_DAILY: 2,            // Gemini-powered free scans
    TOTAL_FREE_DAILY: 2,            // For user display
    PRO_SCANS_DAILY: 25,            // Soft cap to prevent abuse

    // Weekly Event
    FREE_EVENT_ENTRIES_WEEKLY: 1,  // Free users get 1 entry per week
    PRO_EVENT_ENTRIES_DAILY: 5,    // Pro users can submit up to 5/day
    WINNER_COOLDOWN_WEEKS: 4,      // Previous winners sit out 4 weeks

    // Referral Rewards: 3 shares = 1 Savage Roast
    SHARES_PER_SAVAGE_ROAST: 3,
};

export const PRICES = {
    // Legacy (keeping for any existing subscribers)
    PRO_WEEKLY: 2.99,

    // 5-Tier Scan Pack System (Clash of Clans style)
    SCAN_PACK_3: 0.99,      // Tier 1: Tiny - removes friction
    SCAN_PACK_10: 2.99,     // Tier 2: Starter - "smart choice"
    SCAN_PACK_25: 4.99,     // Tier 3: Popular ⭐ - sweet spot
    SCAN_PACK_50: 7.99,     // Tier 4: Best Value
    SCAN_PACK_100: 12.99,   // Tier 5: Pro Pack - anchor

    // First-Time Buyer Offer (one-time only)
    FIRST_TIME_SCANS: 10,
    FIRST_TIME_PRICE: 0.99,
    FIRST_TIME_ORIGINAL: 2.99,
};

export const RESETS = {
    TIME_UTC: '00:00', // Midnight UTC
    TIME_DISPLAY: 'Midnight UTC',
};

// Stripe Checkout Links
// You have 4 existing links - just edit them in Stripe Dashboard to match these:
export const STRIPE_LINKS = {
    // ============================================
    // 5-TIER SCAN PACKS (Edit existing 4, create 2)
    // ============================================

    // Tier 1: 3 scans @ $0.99 (EDIT your old starterPack product)
    tinyPack: 'https://buy.stripe.com/aFa7sN1OEeZl0iXbjdfYY04',

    // Tier 2: 10 scans @ $2.99 (EDIT your old popularPack product)  
    starterPack: 'https://buy.stripe.com/5kQ4gBfFu9F1ghVfztfYY05',

    // Tier 3: 25 scans @ $4.99 ⭐ MOST POPULAR (EDIT your old powerPack product)
    popularPack: 'https://buy.stripe.com/4gMaEZ1OEeZlc1FcnhfYY06',

    // Tier 4: 50 scans @ $7.99 (EDIT your old proWeekly OR create new)
    valuePack: 'https://buy.stripe.com/5kQ28tdxm3gD6HlgDxfYY02',

    // Tier 5: 100 scans @ $12.99 (CREATE NEW in Stripe)
    proPack: 'NEED_TO_CREATE_100_SCAN_LINK',

    // First-Time Offer: 10 scans @ $0.99 (CREATE NEW in Stripe)
    firstTimeOffer: 'NEED_TO_CREATE_FIRST_TIME_LINK',

    // ============================================
    // SUBSCRIPTIONS - 25 scans/day (CREATE NEW)
    // ============================================

    // Monthly: $4.99/mo - 25 scans/day
    proMonthly: 'NEED_TO_CREATE_MONTHLY_SUB',

    // Yearly: $29.99/yr - 25 scans/day (50% off = "2 months free")
    proYearly: 'NEED_TO_CREATE_YEARLY_SUB',
};

// Subscription Pricing
export const SUBSCRIPTIONS = {
    MONTHLY_PRICE: 4.99,
    YEARLY_PRICE: 29.99,
    YEARLY_SAVINGS: 30,      // $60 - $30 = $30 saved
    SCANS_PER_DAY: 25,
};

// Internal Routes & Modal Keys
export const ROUTES = {
    HOME: 'home',
    RESULTS: 'results',
    PAYWALL: 'paywall',
    LIMIT_REACHED: 'limit-reached',
    PRO_WELCOME: 'pro-welcome',
    PRO_EMAIL_PROMPT: 'pro-email-prompt',
};
