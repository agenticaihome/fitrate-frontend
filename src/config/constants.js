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
// NOTE: You'll need to create these products in Stripe!
export const STRIPE_LINKS = {
    // Legacy
    proWeekly: 'https://buy.stripe.com/5kQ28tdxm3gD6HlgDxfYY02',

    // 5-Tier Scan Packs (create these in Stripe)
    tinyPack: 'STRIPE_LINK_PLACEHOLDER_3_SCANS',       // 3 scans - $0.99
    starterPack: 'https://buy.stripe.com/aFa7sN1OEeZl0iXbjdfYY04', // 10 scans - $2.99
    popularPack: 'https://buy.stripe.com/5kQ4gBfFu9F1ghVfztfYY05', // 25 scans - $4.99
    valuePack: 'STRIPE_LINK_PLACEHOLDER_50_SCANS',     // 50 scans - $7.99
    proPack: 'STRIPE_LINK_PLACEHOLDER_100_SCANS',      // 100 scans - $12.99

    // First-Time Offer (create this in Stripe)
    firstTimeOffer: 'STRIPE_LINK_PLACEHOLDER_FIRST_TIME', // 10 scans - $0.99
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
